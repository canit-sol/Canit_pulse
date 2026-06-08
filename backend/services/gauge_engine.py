"""
Canit Pulse — Performance Gauge Intelligence Engine
======================================================
Computes five explainable performance gauges (0–100) from real analytics data.
Each gauge uses derived intelligence and graceful fallbacks — never returns 0
simply because an API field is missing.

Gauges:
  engagement_quality   — Depth and quality of audience interaction
  audience_loyalty     — Repeat engagement, retention, and depth signals
  reach_efficiency     — How far content spreads relative to audience size
  content_consistency  — Cadence regularity and publishing frequency
  virality_potential   — Saves, shares, amplification, and reel multiplier

Usage:
    from services.gauge_engine import compute_gauges
    result = compute_gauges(platform_data, prev_data=prev_ig, cal_count=14)
    print(result["gauges"])          # { engagement_quality: 72.3, ... }
    print(result["confidence"])      # { engagement_quality: "high", ... }
    print(result["explanations"])    # { engagement_quality: "Based on ...", ... }

Platform: Instagram first; all scorers are platform-agnostic.
Version: 1.0.0
"""

from __future__ import annotations

import math
from datetime import datetime
from typing import Any


# ── Helpers ────────────────────────────────────────────────────────────────────

def _sf(v: Any, d: float = 0.0) -> float:
    if isinstance(v, (int, float)):
        return float(v)
    if isinstance(v, str):
        try:
            return float(v.replace(",", "").replace(" ", "").replace("%", ""))
        except ValueError:
            return d
    return d


def _si(v: Any, d: int = 0) -> int:
    if isinstance(v, (int, float)):
        return int(v)
    if isinstance(v, str):
        try:
            return int(v.replace(",", "").replace(" ", ""))
        except ValueError:
            return d
    return d


def _clamp(v: float, lo: float = 0.0, hi: float = 100.0) -> float:
    return max(lo, min(hi, v))


def _logistic(x: float, mid: float, k: float = 0.4) -> float:
    """Smooth S-curve normalizer → 0–100."""
    return _clamp(100 / (1 + math.exp(-k * (x - mid))))


def _linear(x: float, x_min: float, x_max: float) -> float:
    if x_max <= x_min:
        return 0.0
    return _clamp((x - x_min) / (x_max - x_min) * 100)


# ── Metrics Parser ─────────────────────────────────────────────────────────────

def _parse(platform_data: dict, prev_data: dict | None, cal_count: int) -> dict:
    """Flatten raw platform data into a uniform metrics dict."""
    posts = platform_data.get("posts", [])
    if not isinstance(posts, list):
        posts = []

    post_count = len(posts) or _si(platform_data.get("total_posts", 0))

    # Parse post timestamps for cadence
    post_dates: list[datetime] = []
    type_engagement: dict[str, dict] = {}

    for p in posts:
        ts = p.get("timestamp", "")
        if ts and "T" in ts:
            try:
                post_dates.append(datetime.fromisoformat(ts.replace("Z", "+00:00")))
            except Exception:
                pass

    post_dates.sort()

    # Per-type engagement (VIDEO / IMAGE / CAROUSEL_ALBUM)
    for mt in ["VIDEO", "IMAGE", "CAROUSEL_ALBUM"]:
        tp = [p for p in posts if p.get("media_type") == mt]
        if tp:
            avg = sum(
                _si(p.get("like_count", p.get("likes", 0)))
                + _si(p.get("comments_count", p.get("comments", 0)))
                for p in tp
            ) / len(tp)
            if avg > 0:
                type_engagement[mt] = {"count": len(tp), "avg_eng": round(avg, 1)}

    # Max posting gap
    max_gap = 0
    avg_gap = 0.0
    if len(post_dates) >= 2:
        gaps = [(post_dates[i + 1] - post_dates[i]).days for i in range(len(post_dates) - 1)]
        max_gap = max(gaps)
        avg_gap = sum(gaps) / len(gaps)

    # Organic metrics redirection
    total_er = _sf(platform_data.get("engagement_rate", 0))
    is_high_er = (total_er > 3.0) or (0.03 < total_er <= 1.0)
    if is_high_er:
        src_data = platform_data
    else:
        src_data = platform_data.get("organic", {}) if "organic" in platform_data else platform_data

    # Raw totals
    total_likes     = _si(src_data.get("total_likes", platform_data.get("total_likes", 0)))
    total_comments  = _si(src_data.get("total_comments", platform_data.get("total_comments", 0)))
    total_saves     = _si(src_data.get("total_saves", platform_data.get("total_saves", 0)))
    total_shares    = _si(src_data.get("total_shares", platform_data.get("total_shares", 0)))
    total_reach     = _si(src_data.get("total_reach", platform_data.get("total_reach", 0)))
    total_imp       = _si(src_data.get("total_impressions", platform_data.get("total_impressions", 0)))
    followers       = max(_si(platform_data.get("followers", 1)), 1)
    engagement_rate = _sf(src_data.get("engagement_rate", platform_data.get("engagement_rate", 0)))

    # Previous period
    if prev_data:
        prev_src = prev_data.get("organic", {}) if "organic" in prev_data else prev_data
        prev_reach     = _si(prev_src.get("total_reach", prev_data.get("total_reach", 0)))
        prev_followers = _si(prev_data.get("followers", 0))
        prev_eng       = _sf(prev_src.get("engagement_rate", prev_data.get("engagement_rate", 0.0)))
        prev_saves     = _si(prev_src.get("total_saves", prev_data.get("total_saves", 0)))
    else:
        prev_reach     = 0
        prev_followers = 0
        prev_eng       = 0.0
        prev_saves     = 0

    return {
        "post_count":      post_count,
        "post_dates":      post_dates,
        "type_engagement": type_engagement,
        "max_gap":         max_gap,
        "avg_gap":         avg_gap,
        "total_likes":     total_likes,
        "total_comments":  total_comments,
        "total_saves":     total_saves,
        "total_shares":    total_shares,
        "total_reach":     total_reach,
        "total_imp":       total_imp,
        "followers":       followers,
        "engagement_rate": engagement_rate,
        "prev_reach":      prev_reach,
        "prev_followers":  prev_followers,
        "prev_eng":        prev_eng,
        "prev_saves":      prev_saves,
        "cal_count":       cal_count,
        "is_high_er":      is_high_er,
        "total_er":        total_er,
    }


# ── Gauge Scorers ──────────────────────────────────────────────────────────────

def _gauge_engagement_quality(m: dict) -> tuple[float, str, str]:
    """
    Engagement Quality — depth of audience interaction.

    Signals (in priority order):
      1. Engagement rate (primary) — logistic curve at 5% midpoint
      2. Interactions-per-post (secondary blend)
      3. Save rate bonus — saves signal intent > likes
      4. Fallback: raw like/comment count if ER is zero

    Confidence: high if ER>0, medium if derived, low if only raw counts.
    """
    er = m["engagement_rate"]
    post_count = max(m["post_count"], 1)
    total_likes = m["total_likes"]
    total_comments = m["total_comments"]
    total_saves = m["total_saves"]

    # Primary: engagement rate logistic (3%→~40, 5%→~50, 10%→~82, 20%→~98)
    if er > 0:
        er_score = _logistic(er, mid=5.0, k=0.45)
        confidence = "high"
    else:
        # Derived ER from raw counts
        total_interactions = total_likes + total_comments + total_saves
        if m["total_imp"] > 0:
            derived_er = (total_interactions / m["total_imp"]) * 100
        elif m["total_reach"] > 0:
            derived_er = (total_interactions / m["total_reach"]) * 100
        else:
            derived_er = (total_interactions / m["followers"]) * 100
        er_score = _logistic(derived_er, mid=5.0, k=0.45)
        confidence = "medium"

    # Secondary: interactions per post (50 per post = 100)
    ipp = (total_likes + total_comments + total_saves) / post_count
    ipp_score = _clamp((ipp / 50) * 100)

    # Save-rate bonus: saves signal higher intent (up to +8 pts)
    save_per_post = total_saves / post_count
    save_bonus = _clamp(save_per_post * 0.8, hi=8.0)

    # Blend: 60% ER-derived, 30% IPP, 10% save bonus
    score = _clamp(er_score * 0.60 + ipp_score * 0.30 + save_bonus)

    if er > 0:
        explanation = f"Driven by {er}% engagement rate and {ipp:.1f} avg interactions/post."
    else:
        explanation = f"Estimated from {total_likes + total_comments + total_saves:,} total interactions across {post_count} posts."

    if m.get("is_high_er"):
        score = max(score, 80.0)

    return round(score, 1), confidence, explanation


def _gauge_audience_loyalty(m: dict) -> tuple[float, str, str]:
    """
    Audience Loyalty — retention, repeat engagement, depth signals.

    Signals:
      1. Comment-to-like ratio — comments require intent, likes are passive
      2. Save rate — saves mean audience will return
      3. Engagement stability — MoM engagement delta (smaller swing = more loyal)
      4. Posting consistency as loyalty proxy (consistent posting retains audience)

    Never divides by zero. Always returns a meaningful estimate.
    """
    total_likes    = m["total_likes"]
    total_comments = m["total_comments"]
    total_saves    = m["total_saves"]
    post_count     = max(m["post_count"], 1)
    er             = m["engagement_rate"]
    prev_eng       = m["prev_eng"]

    # 1. Comment-to-like ratio (ideal: 10–15% of likes are comments)
    if total_likes > 0:
        comment_ratio = (total_comments / total_likes) * 100
        # 5% → 50pts, 15% → 90pts, 25%+ → 100pts
        ratio_score = _logistic(comment_ratio, mid=10.0, k=0.25)
    else:
        # Fallback: comment rate vs followers
        comments_per_follower = (total_comments / m["followers"]) * 100
        ratio_score = _logistic(comments_per_follower, mid=2.0, k=0.5)

    # 2. Save rate (5 saves/post → 60pts, 15/post → 90pts)
    save_per_post = total_saves / post_count
    save_score = _logistic(save_per_post, mid=7.0, k=0.3)

    # 3. Engagement stability (MoM delta, smaller = more stable = more loyal)
    if prev_eng > 0 and er > 0:
        eng_delta_pct = abs((er - prev_eng) / prev_eng) * 100
        # 0% swing → 100pts, 30% swing → 50pts, 70%+ → 20pts
        stability_score = _clamp(100 - eng_delta_pct * 1.2)
        has_stability = True
    else:
        # Use consistency as proxy for stability
        stability_score = _clamp((post_count / 20) * 80)
        has_stability = False

    # 4. Posting consistency as loyalty enabler (audiences return to consistent accounts)
    consistency_proxy = _clamp((post_count / 16) * 70)

    # Blend weights shift when stability data is available
    if has_stability:
        score = (ratio_score * 0.35 + save_score * 0.30 + stability_score * 0.25 + consistency_proxy * 0.10)
        confidence = "high"
        explanation = f"Comment depth {total_comments}, saves {total_saves}, engagement swing {abs(er - prev_eng):.1f}%."
    else:
        score = (ratio_score * 0.40 + save_score * 0.40 + consistency_proxy * 0.20)
        confidence = "medium"
        explanation = f"Estimated from comment depth ({total_comments}) and save rate ({save_per_post:.1f}/post)."

    if m.get("is_high_er"):
        score = max(score, 80.0)
        explanation = f"Strong audience loyalty indicated by a high total engagement rate of {er}%."

    return round(_clamp(score), 1), confidence, explanation


def _gauge_reach_efficiency(m: dict) -> tuple[float, str, str]:
    """
    Reach Efficiency — how far content spreads relative to audience.

    Signals:
      1. Reach-to-follower ratio (primary) — organic amplification
      2. Reach-to-impressions ratio (secondary) — unique audience efficiency
      3. MoM reach growth (tertiary) — acceleration signal
      4. Fallback: engagement-derived reach estimate

    The old formula returned 0 when impressions were missing (common without paid data).
    We now use reach/followers as the primary signal.
    """
    total_reach  = m["total_reach"]
    total_imp    = m["total_imp"]
    followers    = m["followers"]
    prev_reach   = m["prev_reach"]

    # 1. Reach-to-follower ratio (amplification)
    # 50% reach/followers → 25pts, 100% → 50pts, 200% → 75pts, 400%+ → 100pts
    if total_reach > 0:
        reach_ratio_pct = (total_reach / followers) * 100
        ratio_score = _logistic(reach_ratio_pct, mid=100.0, k=0.025)
        confidence = "high"
    else:
        # Estimate reach from engagement (avg: reach ≈ 3–6× engagement interactions)
        est_interactions = m["total_likes"] + m["total_comments"] + m["total_saves"]
        est_reach = est_interactions * 4.5  # conservative amplification estimate
        reach_ratio_pct = (est_reach / followers) * 100
        ratio_score = _logistic(reach_ratio_pct, mid=100.0, k=0.025) * 0.7  # confidence discount
        confidence = "estimated"

    # 2. Reach-to-impressions ratio (unique audience efficiency, 0–100%)
    if total_imp > 0 and total_reach > 0:
        r_to_i = (total_reach / total_imp) * 100
        # Healthy: 50–80% unique reach. 60% → 75pts, 80% → 95pts.
        ri_score = _linear(r_to_i, x_min=20.0, x_max=85.0)
    else:
        ri_score = 50.0  # neutral when not available

    # 3. MoM reach growth
    if prev_reach > 0 and total_reach > 0:
        mom_growth = ((total_reach - prev_reach) / prev_reach) * 100
        # -50% → 0, 0% → 50, +50% → 80, +100%+ → 100
        growth_score = _logistic(mom_growth, mid=10.0, k=0.04)
        blend = ratio_score * 0.50 + ri_score * 0.25 + growth_score * 0.25
        explanation = f"Reach {total_reach:,} ({reach_ratio_pct:.0f}% of {followers:,} followers), {mom_growth:+.1f}% MoM."
    else:
        blend = ratio_score * 0.65 + ri_score * 0.35
        explanation = (
            f"Reach {total_reach:,} ({reach_ratio_pct:.0f}% of {followers:,} followers)."
            if total_reach > 0 else
            "Reach not reported. Estimated from engagement interactions."
        )

    return round(_clamp(blend), 1), confidence, explanation


def _gauge_content_consistency(m: dict) -> tuple[float, str, str]:
    """
    Content Consistency — publishing frequency and cadence regularity.

    Signals:
      1. Posts-per-month score (target: 20/month = 100)
      2. Max gap penalty (>3 days starts penalizing, capped at −40pts)
      3. Average gap bonus (low avg gap = consistent)
      4. Content calendar planned count as supplementary signal

    Avoids 0 when either posts or calendar exist.
    """
    post_count = m["post_count"]
    cal_count  = m["cal_count"]
    max_gap    = m["max_gap"]
    avg_gap    = m["avg_gap"]

    # Use whichever is higher: actual posts or planned
    effective_count = max(post_count, cal_count)

    if effective_count == 0:
        return 5.0, "low", "No posts or scheduled content found."

    # 1. Volume score (20 posts/month = 100, 10 posts = 50)
    volume_score = _clamp((effective_count / 20) * 100)

    # 2. Max gap penalty
    gap_penalty = 0.0
    if max_gap > 3:
        gap_penalty = _clamp((max_gap - 3) * 5.0, hi=40.0)

    # 3. Avg gap bonus (low avg gap = high consistency, +10 pts max)
    if avg_gap > 0:
        avg_gap_bonus = _clamp((1 / avg_gap) * 10, hi=10.0)
    else:
        avg_gap_bonus = 0.0

    score = _clamp(volume_score - gap_penalty + avg_gap_bonus)

    if post_count > 0 and max_gap > 0:
        confidence = "high"
        explanation = f"{post_count} posts, max gap {max_gap}d, avg {avg_gap:.1f}d between posts."
    elif cal_count > 0:
        confidence = "medium"
        explanation = f"{cal_count} scheduled in content calendar, {post_count} published."
    else:
        confidence = "medium"
        explanation = f"{post_count} posts detected this period."

    return round(score, 1), confidence, explanation


def _gauge_virality_potential(m: dict) -> tuple[float, str, str]:
    """
    Virality Potential — shares, saves, amplification, and reel multiplier.

    Signals (cascading priority):
      1. Shares per post (primary — direct virality signal)
      2. Saves per post (secondary — intent-to-reshare signal)
      3. Reach-to-engagement amplification ratio (how far content travels beyond direct followers)
      4. Reel performance multiplier (VIDEO posts getting higher engagement = viral format)
      5. Fallback: engagement rate as virality proxy (highly engaged content gets shared)

    Old formula: returned 0 when shares=0. Now uses saves + amplification + reels.
    """
    total_shares    = m["total_shares"]
    total_saves     = m["total_saves"]
    total_likes     = m["total_likes"]
    total_comments  = m["total_comments"]
    total_reach     = m["total_reach"]
    followers       = m["followers"]
    post_count      = max(m["post_count"], 1)
    er              = m["engagement_rate"]
    type_eng        = m["type_engagement"]

    signals_used = []

    # 1. Shares per post (10/post = 100pts)
    if total_shares > 0:
        shares_per_post = total_shares / post_count
        share_score = _logistic(shares_per_post, mid=4.0, k=0.35)
        signals_used.append(f"{total_shares} shares")
    else:
        share_score = None  # not available

    # 2. Save rate as virality proxy (saves precede shares; 15/post = 80pts)
    save_per_post = total_saves / post_count
    save_score = _logistic(save_per_post, mid=8.0, k=0.22)
    if total_saves > 0:
        signals_used.append(f"{total_saves} saves")

    # 3. Reach amplification (reach / followers — content travelling beyond audience)
    if total_reach > 0:
        amp_ratio = total_reach / followers
        # 1× = 50pts, 2× = 75pts, 4×+ = 100pts
        amp_score = _logistic(amp_ratio * 100, mid=150.0, k=0.02)
        signals_used.append(f"{amp_ratio:.1f}× reach amplification")
    else:
        amp_score = 30.0  # neutral baseline

    # 4. Reel performance multiplier
    video_data = type_eng.get("VIDEO", {})
    all_avgs = [v["avg_eng"] for v in type_eng.values() if v.get("avg_eng", 0) > 0]
    if video_data and all_avgs:
        overall_avg = sum(all_avgs) / len(all_avgs)
        reel_multiplier = video_data["avg_eng"] / max(overall_avg, 1)
        # 1× → 0 bonus, 2× → +15pts, 3×+ → +25pts
        reel_bonus = _clamp((reel_multiplier - 1) * 15, hi=25.0)
        signals_used.append(f"Reels {reel_multiplier:.1f}× avg engagement")
    else:
        reel_bonus = 0.0

    # 5. ER fallback component
    if er > 0:
        er_proxy = _logistic(er, mid=6.0, k=0.35)
    else:
        interactions = total_likes + total_comments + total_saves
        derived_er = (interactions / followers * 100) if followers > 0 else 0
        er_proxy = _logistic(derived_er, mid=6.0, k=0.35)

    # Blend strategy based on data availability
    if share_score is not None:
        # Full signal set
        raw = (share_score * 0.35 + save_score * 0.25 + amp_score * 0.20 + er_proxy * 0.20)
        confidence = "high"
    else:
        # No shares — use saves + amplification + ER + reels
        raw = (save_score * 0.35 + amp_score * 0.30 + er_proxy * 0.25 + save_score * 0.10)
        confidence = "medium"

    score = _clamp(raw + reel_bonus)
    explanation = (
        "Based on " + (", ".join(signals_used) if signals_used else "engagement rate proxy") + "."
    )
    if m.get("is_high_er"):
        score = max(score, 80.0)
        if total_reach > followers:
            explanation = f"High virality indicated by {total_reach / followers:.1f}x reach multiplier and strong engagement."

    return round(score, 1), confidence, explanation


# ── Main Entry Point ───────────────────────────────────────────────────────────

def compute_gauges(
    platform_data: dict,
    prev_data: dict | None = None,
    cal_count: int = 0,
    platform: str = "instagram",
) -> dict:
    """
    Compute all five performance gauges from platform analytics data.

    Args:
        platform_data:  Raw analytics dict for the current period (Instagram block).
        prev_data:      Previous period's analytics dict for MoM stability signals.
        cal_count:      Number of content calendar scheduled entries.
        platform:       Platform identifier (for metadata tagging).

    Returns:
        dict with keys:
          gauges       — { gauge_key: score (float 0–100) }
          confidence   — { gauge_key: "high" | "medium" | "estimated" | "low" }
          explanations — { gauge_key: human-readable explanation string }
          metadata     — { platform, version, has_prev_data }
    """
    m = _parse(platform_data, prev_data, cal_count)

    scorers = [
        ("engagement_quality",  _gauge_engagement_quality),
        ("audience_loyalty",    _gauge_audience_loyalty),
        ("reach_efficiency",    _gauge_reach_efficiency),
        ("content_consistency", _gauge_content_consistency),
        ("virality_potential",  _gauge_virality_potential),
    ]

    gauges: dict[str, float]  = {}
    confidence: dict[str, str] = {}
    explanations: dict[str, str] = {}

    for key, fn in scorers:
        try:
            score, conf, expl = fn(m)
            gauges[key]       = score
            confidence[key]   = conf
            explanations[key] = expl
        except Exception as exc:
            print(f"[GaugeEngine] Gauge '{key}' failed: {exc}")
            gauges[key]       = 0.0
            confidence[key]   = "error"
            explanations[key] = "Could not compute — insufficient data."

    return {
        "gauges":       gauges,
        "confidence":   confidence,
        "explanations": explanations,
        "metadata": {
            "platform":      platform,
            "version":       "1.0.0",
            "has_prev_data": prev_data is not None,
            "post_count":    m["post_count"],
        },
    }
