"""
Canit Pulse — Brand Health Score Engine
==========================================
Computes a weighted, explainable Brand Health Score (0–100) from
real platform analytics data. Designed for Instagram first; architected
for multi-platform reuse (Facebook, LinkedIn, Threads, Pinterest).

Usage:
    from services.brand_health import compute_brand_health

    result = compute_brand_health(platform_data, platform="instagram", prev_data=prev_ig)
    print(result.score)       # 74.2
    print(result.label)       # "Strong"
    print(result.components)  # Per-signal breakdown for explainability
    print(result.explanation) # Human-readable summary string

ML Integration:
    To replace the weighted sum with a trained model, register it via:
        from services.brand_health import register_ml_model
        register_ml_model(my_model_fn)
    The model receives the same `components` dict and must return a float 0–100.
    Signal extraction and normalization still run (for explainability output).

Score Labels:
     0–39  → "Needs Attention"
    40–69  → "Moderate"
    70–100 → "Strong"

Version: 1.0.0 | Platform: Instagram (multi-platform ready)
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Callable


# ── Version ────────────────────────────────────────────────────────────────────

SCORER_VERSION = "1.0.0"

# Weight map — must sum to 1.0
SIGNAL_WEIGHTS: dict[str, float] = {
    "engagement_rate":    0.30,
    "reach_growth":       0.20,
    "posting_cadence":    0.15,
    "saves_shares":       0.15,
    "follower_growth":    0.10,
    "content_diversity":  0.10,
}

# Label thresholds
LABEL_THRESHOLDS = [
    (70, "Strong"),
    (40, "Moderate"),
    (0,  "Needs Attention"),
]

# Explanation template
_EXPLANATION_TEMPLATE = (
    "Calculated using engagement ({eng:.0f}%), reach ({reach:.0f}%), "
    "posting consistency ({cadence:.0f}%), saves & shares ({saves:.0f}%), "
    "follower growth ({growth:.0f}%), and content intelligence ({diversity:.0f}%) signals."
)


# ── ML Hook ────────────────────────────────────────────────────────────────────

# Set via `register_ml_model(fn)` to activate ML-driven scoring.
# The registered function must accept `components: list[dict]` and return float 0–100.
_ML_MODEL: Callable[[list[dict]], float] | None = None


def register_ml_model(model_fn: Callable[[list[dict]], float]) -> None:
    """
    Register a trained ML model to replace the weighted sum in score computation.
    The model receives the fully-computed components list and must return a float 0–100.
    Signal extraction, normalization, and component output are unchanged — only the
    final aggregation step is replaced when a model is registered.

    Example:
        def my_model(components: list[dict]) -> float:
            feature_vector = [c["normalized_score"] for c in components]
            return float(trained_model.predict([feature_vector])[0])

        register_ml_model(my_model)
    """
    global _ML_MODEL
    _ML_MODEL = model_fn


def unregister_ml_model() -> None:
    """Remove the registered ML model, reverting to weighted sum."""
    global _ML_MODEL
    _ML_MODEL = None


# ── Output Dataclass ───────────────────────────────────────────────────────────

@dataclass
class BrandHealthResult:
    """
    The complete result of a Brand Health computation.

    Attributes:
        score:       Final weighted score, 0–100.
        label:       Human-readable label ("Needs Attention", "Moderate", "Strong").
        components:  Per-signal breakdown — raw_value, normalized_score,
                     weight, weighted_contribution, and signal_key.
        explanation: Ready-to-display sentence for the frontend tooltip.
        metadata:    Platform, version, and ML readiness flag.
    """
    score: float
    label: str
    components: list[dict] = field(default_factory=list)
    explanation: str = ""
    metadata: dict = field(default_factory=dict)


# ── Generic Normalizers ─────────────────────────────────────────────────────────

def _safe_float(v: Any, default: float = 0.0) -> float:
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v.replace(",", "").replace(" ", "").replace("%", ""))
        except ValueError:
            return default
    return default


def _safe_int(v: Any, default: int = 0) -> int:
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str):
        try:
            return int(v.replace(",", "").replace(" ", ""))
        except ValueError:
            return default
    return default


def _clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp value to [lo, hi]."""
    return max(lo, min(hi, value))


def _logistic_normalize(x: float, midpoint: float, steepness: float = 0.5) -> float:
    """
    Smooth logistic curve: maps x → 0–100.
    - At x == midpoint  → ~50
    - Steepness controls how quickly the curve rises.
    """
    return _clamp(100 / (1 + math.exp(-steepness * (x - midpoint))))


def _linear_normalize(x: float, x_min: float, x_max: float) -> float:
    """Map x from [x_min, x_max] linearly to [0, 100]. Clamps outside range."""
    if x_max <= x_min:
        return 0.0
    return _clamp((x - x_min) / (x_max - x_min) * 100)


# ── Signal Scorers ─────────────────────────────────────────────────────────────
# Each scorer returns (raw_value, normalized_score: float 0–100, human_label: str)

def _score_engagement_rate(metrics: dict) -> tuple[Any, float, str]:
    """
    Engagement Rate → 30%
    Formula: logistic curve centred at midpoint based on follower tier.
      - Small (<10K): midpoint=3.5, steepness=1.0
      - Mid (10K-100K): midpoint=2.5, steepness=1.2
      - Large (100K+): midpoint=1.5, steepness=1.5
    Ensure ER >= 5.0% scores near maximum (>= 95.0).
    Industry Instagram average: 1–3%. Exceptional: 10%+.
    """
    er = _safe_float(metrics.get("engagement_rate", 0))
    tier = metrics.get("tier", "small")
    
    if tier == "small":
        midpoint = 3.5
        steepness = 1.0
    elif tier == "mid":
        midpoint = 2.5
        steepness = 1.2
    else:
        midpoint = 1.5
        steepness = 1.5
        
    score = _logistic_normalize(er, midpoint=midpoint, steepness=steepness)
    if er >= 5.0:
        score = max(score, 95.0)
        
    return er, round(score, 1), f"{er}%"


def _score_reach_growth(metrics: dict) -> tuple[Any, float, str]:
    """
    Reach / Impressions Growth → 20%
    Primary: reach-to-follower ratio (amplification factor) scored per tier:
      - Small (<10K): midpoint=150.0 (1.5x), steepness=0.02
      - Mid (10K-100K): midpoint=100.0 (1.0x), steepness=0.025
      - Large (100K+): midpoint=50.0 (0.5x), steepness=0.04
    Exceptional reach ratio (>= 150%) yields a high minimum ratio_score (>= 95.0).
    First return value is reach-to-follower ratio (multiplier) instead of raw reach.
    """
    total_reach  = _safe_int(metrics.get("total_reach", 0))
    followers    = max(_safe_int(metrics.get("followers", 1)), 1)
    prev_reach   = _safe_int(metrics.get("prev_total_reach", 0))
    tier         = metrics.get("tier", "small")

    reach_ratio_pct = (total_reach / followers) * 100
    
    if tier == "small":
        midpoint = 150.0
        steepness = 0.02
    elif tier == "mid":
        midpoint = 100.0
        steepness = 0.025
    else:
        midpoint = 50.0
        steepness = 0.04

    ratio_score = _logistic_normalize(reach_ratio_pct, midpoint=midpoint, steepness=steepness)
    if reach_ratio_pct >= 150.0:
        ratio_score = max(ratio_score, 95.0)

    # MoM blend
    reach_multiplier = round(total_reach / followers, 2)
    if prev_reach > 0:
        mom_growth_pct = ((total_reach - prev_reach) / prev_reach) * 100
        mom_score = _logistic_normalize(mom_growth_pct, midpoint=10.0, steepness=0.04)
        final_score = ratio_score * 0.70 + mom_score * 0.30
        if reach_ratio_pct >= 150.0:
            final_score = max(final_score, ratio_score, 95.0)
        label = f"{reach_multiplier:.1f}x reach multiplier ({total_reach:,} reach), {mom_growth_pct:+.1f}% MoM"
    else:
        final_score = ratio_score
        label = f"{reach_multiplier:.1f}x reach multiplier ({total_reach:,} reach)"

    return reach_multiplier, round(final_score, 1), label


def _score_posting_cadence(metrics: dict) -> tuple[Any, float, str]:
    """
    Posting Consistency / Cadence → 15%
    Components:
      1. Volume score: posts_this_month / 20 → 100 (20 posts/month = perfect)
      2. Gap penalty: max_gap_days > 3 starts penalizing (−5 pts per day over 3, max −40 pts)
    Final = volume_score − gap_penalty, clamped to 0–100.
    """
    post_count   = _safe_int(metrics.get("post_count", 0))
    post_dates   = metrics.get("post_dates_sorted", [])

    # 1. Volume score (target: 20 posts/month = 100)
    volume_score = _clamp((post_count / 20) * 100)

    # 2. Gap penalty
    gap_penalty = 0.0
    max_gap = 0
    if len(post_dates) >= 2:
        gaps = [(post_dates[i + 1] - post_dates[i]).days for i in range(len(post_dates) - 1)]
        max_gap = max(gaps)
        if max_gap > 3:
            gap_penalty = min((max_gap - 3) * 5.0, 40.0)

    final_score = _clamp(volume_score - gap_penalty)
    label = f"{post_count} posts"
    if max_gap > 0:
        label += f", max gap {max_gap}d"

    return post_count, round(final_score, 1), label


def _score_saves_shares(metrics: dict) -> tuple[Any, float, str]:
    """
    Saves + Shares → 15%
    Formula: (saves + shares) per post, normalized via logistic curve per tier:
      - Small (<10K): midpoint=5.0, steepness=0.3
      - Mid (10K-100K): midpoint=10.0, steepness=0.2
      - Large (100K+): midpoint=20.0, steepness=0.1
    If total engagement rate > 3%, treat saves/shares as healthy and enforce minimum floor of 80.0.
    """
    total_saves  = _safe_int(metrics.get("total_saves", 0))
    total_shares = _safe_int(metrics.get("total_shares", 0))
    post_count   = max(_safe_int(metrics.get("post_count", 1)), 1)
    tier         = metrics.get("tier", "small")
    er           = _safe_float(metrics.get("engagement_rate", 0))

    combined = total_saves + total_shares
    per_post  = combined / post_count

    if tier == "small":
        midpoint = 5.0
        steepness = 0.3
    elif tier == "mid":
        midpoint = 10.0
        steepness = 0.2
    else:
        midpoint = 20.0
        steepness = 0.1

    score = _logistic_normalize(per_post, midpoint=midpoint, steepness=steepness)
    if er > 3.0:
        score = max(score, 80.0)

    label = f"{combined:,} saves+shares ({per_post:.1f}/post)"
    return combined, round(score, 1), label


def _score_follower_growth(metrics: dict) -> tuple[Any, float, str]:
    """
    Follower Growth → 10%
    If prev_followers is available: MoM growth % is primary signal.
      - Small (<10K): midpoint=5.0% growth, steepness=0.2
      - Mid (10K-100K): midpoint=3.0% growth, steepness=0.3
      - Large (100K+): midpoint=1.5% growth, steepness=0.4
    Fallback (no prev): absolute follower tier scoring.
    """
    followers      = max(_safe_int(metrics.get("followers", 1)), 1)
    prev_followers = _safe_int(metrics.get("prev_followers", 0))
    tier           = metrics.get("tier", "small")

    if prev_followers > 0:
        mom_growth_pct = ((followers - prev_followers) / prev_followers) * 100
        
        if tier == "small":
            midpoint = 5.0
            steepness = 0.2
        elif tier == "mid":
            midpoint = 3.0
            steepness = 0.3
        else:
            midpoint = 1.5
            steepness = 0.4
            
        score = _logistic_normalize(mom_growth_pct, midpoint=midpoint, steepness=steepness)
        label = f"{followers:,} followers ({mom_growth_pct:+.1f}% MoM)"
        raw   = mom_growth_pct
    else:
        # Tier-based fallback using log scale
        score = _clamp(math.log10(max(followers, 1)) / math.log10(500_000) * 100)
        label = f"{followers:,} followers"
        raw   = followers

    return raw, round(score, 1), label


def _score_content_diversity(metrics: dict) -> tuple[Any, float, str]:
    """
    Content Diversity / Format Performance → 10%
    Two components blended 60/40:
    1. Format variety (60%):
       - 1 format type → 30 pts
       - 2 format types → 65 pts
       - 3+ format types → 100 pts
    2. Best-type engagement lift (40%):
       Ratio of best-performing format avg engagement to overall avg.
       Rewards accounts that have identified and leaned into their strongest format.
       - Same as average (ratio=1) → 50 pts
       - 2x better              → 80 pts
       - 3x+ better             → 100 pts
    """
    type_engagement = metrics.get("type_engagement", {})
    post_count      = max(_safe_int(metrics.get("post_count", 1)), 1)
    total_likes     = _safe_int(metrics.get("total_likes", 0))
    total_comments  = _safe_int(metrics.get("total_comments", 0))

    # 1. Format variety score
    num_formats = len(type_engagement)
    if num_formats >= 3:
        variety_score = 100.0
    elif num_formats == 2:
        variety_score = 65.0
    elif num_formats == 1:
        variety_score = 30.0
    else:
        variety_score = 10.0  # No data / single-post month

    # 2. Best-type lift score
    lift_score = 50.0  # neutral default
    if type_engagement:
        overall_avg = (total_likes + total_comments) / post_count if post_count else 0
        best_avg = max(v.get("avg_eng", 0) for v in type_engagement.values())
        if overall_avg > 0 and best_avg > 0:
            lift_ratio = best_avg / overall_avg
            # Map ratio: 1.0→50, 2.0→80, 3.0+→100
            lift_score = _clamp(_linear_normalize(lift_ratio, x_min=1.0, x_max=3.0) * 0.5 + 50)

    final_score = variety_score * 0.60 + lift_score * 0.40

    format_names = {"VIDEO": "Reels", "IMAGE": "Photos", "CAROUSEL_ALBUM": "Carousels", "TEXT": "Text"}
    used = [format_names.get(k, k) for k in type_engagement.keys()]
    label = f"{num_formats} format{'s' if num_formats != 1 else ''} ({', '.join(used) or 'none'})"

    return num_formats, round(final_score, 1), label


# ── Signal Registry ────────────────────────────────────────────────────────────
# Maps signal key → (scorer_fn, weight, display_name).
# Add new signals here — no other code needs to change.

_SIGNAL_REGISTRY: list[tuple[str, Callable, float, str]] = [
    ("engagement_rate",   _score_engagement_rate,   SIGNAL_WEIGHTS["engagement_rate"],   "Engagement Rate"),
    ("reach_growth",      _score_reach_growth,       SIGNAL_WEIGHTS["reach_growth"],       "Reach & Growth"),
    ("posting_cadence",   _score_posting_cadence,    SIGNAL_WEIGHTS["posting_cadence"],    "Posting Consistency"),
    ("saves_shares",      _score_saves_shares,        SIGNAL_WEIGHTS["saves_shares"],       "Saves & Shares"),
    ("follower_growth",   _score_follower_growth,     SIGNAL_WEIGHTS["follower_growth"],    "Follower Growth"),
    ("content_diversity", _score_content_diversity,  SIGNAL_WEIGHTS["content_diversity"],  "Content Diversity"),
]


# ── Metrics Parser ─────────────────────────────────────────────────────────────

def _parse_metrics(platform_data: dict, prev_data: dict | None = None) -> dict:
    """
    Extract and normalize raw platform data into a flat metrics dict
    consumed by each signal scorer. Platform-agnostic by design.
    """
    posts = platform_data.get("posts", [])
    if not isinstance(posts, list):
        posts = []

    post_count = len(posts) or _safe_int(platform_data.get("total_posts", 0))

    # Parse post timestamps for cadence analysis
    post_dates_sorted: list[datetime] = []
    type_engagement: dict[str, dict] = {}

    for post in posts:
        ts = post.get("timestamp", "")
        if ts and "T" in ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                post_dates_sorted.append(dt)
            except Exception:
                pass

    post_dates_sorted.sort()

    # Per-type engagement (for content diversity signal)
    for media_type in ["VIDEO", "IMAGE", "CAROUSEL_ALBUM", "TEXT"]:
        type_posts = [p for p in posts if p.get("media_type") == media_type]
        if type_posts:
            avg_eng = sum(
                _safe_int(p.get("like_count", p.get("likes", 0)))
                + _safe_int(p.get("comments_count", p.get("comments", 0)))
                for p in type_posts
            ) / len(type_posts)
            if avg_eng > 0:
                type_engagement[media_type] = {
                    "count": len(type_posts),
                    "avg_eng": round(avg_eng, 1),
                }

    # Previous period values (for MoM signals)
    prev_reach     = _safe_int(prev_data.get("total_reach", 0)) if prev_data else 0
    prev_followers = _safe_int(prev_data.get("followers", 0)) if prev_data else 0

    followers = _safe_int(platform_data.get("followers", 1)) or 1
    if followers < 10000:
        tier = "small"
    elif followers < 100000:
        tier = "mid"
    else:
        tier = "large"

    return {
        "engagement_rate":    _safe_float(platform_data.get("engagement_rate", 0)),
        "total_reach":        _safe_int(platform_data.get("total_reach", 0)),
        "total_impressions":  _safe_int(platform_data.get("total_impressions", 0)),
        "followers":          followers,
        "tier":               tier,
        "total_likes":        _safe_int(platform_data.get("total_likes", 0)),
        "total_comments":     _safe_int(platform_data.get("total_comments", 0)),
        "total_saves":        _safe_int(platform_data.get("total_saves", 0)),
        "total_shares":       _safe_int(platform_data.get("total_shares", 0)),
        "post_count":         post_count,
        "post_dates_sorted":  post_dates_sorted,
        "type_engagement":    type_engagement,
        # Previous period (injected for MoM computation)
        "prev_total_reach":   prev_reach,
        "prev_followers":     prev_followers,
    }


# ── Label Resolver ─────────────────────────────────────────────────────────────

def _resolve_label(score: float) -> str:
    for threshold, label in LABEL_THRESHOLDS:
        if score >= threshold:
            return label
    return "Needs Attention"


# ── Main Entry Point ───────────────────────────────────────────────────────────

def compute_brand_health(
    platform_data: dict,
    platform: str = "instagram",
    prev_data: dict | None = None,
) -> BrandHealthResult:
    """
    Compute the Brand Health Score from raw platform analytics data.

    Args:
        platform_data:  Raw analytics dict for the current reporting period.
                        For Instagram this is the `instagram` block returned by
                        `get_client_instagram_stats()`. For future platforms,
                        pass the equivalent block.
        platform:       Platform identifier ("instagram", "facebook", etc.).
                        Used for metadata tagging only — scorers are platform-agnostic.
        prev_data:      Optional previous period's analytics dict. When provided,
                        enables Month-over-Month growth signals for reach and followers.

    Returns:
        BrandHealthResult with score, label, per-component breakdown, and explanation.
    """
    metrics = _parse_metrics(platform_data, prev_data)
    components: list[dict] = []

    for signal_key, scorer_fn, weight, display_name in _SIGNAL_REGISTRY:
        try:
            raw_value, normalized_score, human_label = scorer_fn(metrics)
        except Exception as exc:
            # A failing signal never crashes the whole score — it contributes 0
            print(f"[BrandHealth] Signal '{signal_key}' failed: {exc}")
            raw_value, normalized_score, human_label = None, 0.0, "unavailable"

        weighted_contribution = round(normalized_score * weight, 2)

        components.append({
            "signal_key":            signal_key,
            "display_name":          display_name,
            "raw_label":             human_label,
            "normalized_score":      normalized_score,      # 0–100
            "weight":                weight,                # e.g. 0.30
            "weight_pct":            round(weight * 100),   # e.g. 30
            "weighted_contribution": weighted_contribution, # normalized_score × weight
        })

    # ── Aggregate (weighted sum OR ML model) ──────────────────────────────────
    if _ML_MODEL is not None:
        try:
            raw_score = float(_ML_MODEL(components))
        except Exception as exc:
            print(f"[BrandHealth] ML model failed, falling back to weighted sum: {exc}")
            raw_score = sum(c["weighted_contribution"] for c in components)
    else:
        raw_score = sum(c["weighted_contribution"] for c in components)

    final_score = round(_clamp(raw_score), 1)
    label       = _resolve_label(final_score)

    # ── Explainability string ─────────────────────────────────────────────────
    score_map = {c["signal_key"]: c["normalized_score"] for c in components}
    explanation = _EXPLANATION_TEMPLATE.format(
        eng=score_map.get("engagement_rate", 0),
        reach=score_map.get("reach_growth", 0),
        cadence=score_map.get("posting_cadence", 0),
        saves=score_map.get("saves_shares", 0),
        growth=score_map.get("follower_growth", 0),
        diversity=score_map.get("content_diversity", 0),
    )

    return BrandHealthResult(
        score=final_score,
        label=label,
        components=components,
        explanation=explanation,
        metadata={
            "platform":      platform,
            "version":       SCORER_VERSION,
            "ml_active":     _ML_MODEL is not None,
            "signals_used":  len(components),
            "has_prev_data": prev_data is not None,
        },
    )
