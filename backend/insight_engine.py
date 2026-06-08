"""
Canit Pulse — AI Insight Engine
==================================
Threshold-based intelligence system that generates strategic insights
from raw analytics data. Designed for multi-platform support and
future ML model integration.

Usage:
    from insight_engine import generate_insights
    insights = generate_insights(platform_data, platform="instagram")
"""

from collections import defaultdict
from datetime import datetime
from typing import Any

# ── Helper ──────────────────────────────────────────

def _safe_int(v, default=0):
    if isinstance(v, (int, float)): return int(v)
    if isinstance(v, str):
        try: return int(v.replace(",", "").replace(" ", ""))
        except: return default
    return default

def _safe_float(v, default=0.0):
    if isinstance(v, (int, float)): return float(v)
    if isinstance(v, str):
        try: return float(v.replace(",", "").replace(" ", "").replace("%", ""))
        except: return default
    return default


# ── Insight Data Class ──────────────────────────────

class Insight:
    """A single generated insight with metadata for ranking."""
    def __init__(self, category: str, text: str, insight_type: str, impact: float, key: str):
        self.category = category      # FORMAT, TIMING, CADENCE, RETENTION, PERFORMANCE, GROWTH
        self.text = text              # The human-readable insight string
        self.type = insight_type      # positive, warning, info
        self.impact = impact          # 0-100 impact score for prioritization
        self.key = key                # Dedup key (e.g., "reels_vs_photos")

    def to_dict(self):
        return {"category": self.category, "text": self.text, "type": self.type}


# ── Rule Engine ─────────────────────────────────────
# Each rule is a function that receives parsed metrics and returns
# a list of Insight objects (or empty list if rule doesn't trigger).

def _rule_content_format(metrics: dict) -> list[Insight]:
    """Compare engagement across content formats."""
    results = []
    type_engagement = metrics.get("type_engagement", {})
    month = metrics.get("month", "this month")

    reels = type_engagement.get("VIDEO", {})
    photos = type_engagement.get("IMAGE", {})
    carousels = type_engagement.get("CAROUSEL_ALBUM", {})

    r_avg = reels.get("avg_eng", 0)
    p_avg = photos.get("avg_eng", 0)
    c_avg = carousels.get("avg_eng", 0)

    if r_avg > 0 and p_avg > 0 and r_avg > p_avg:
        ratio = round(r_avg / max(p_avg, 1), 1)
        if ratio >= 2:
            results.append(Insight(
                "FORMAT",
                f"During {month}, short-form video content delivered {ratio}x higher interaction rates compared to static imagery, reinforcing the strategic value of Reels.",
                "positive", impact=85, key="reels_vs_photos"
            ))
        elif ratio >= 1.3:
            results.append(Insight(
                "FORMAT",
                f"Our {month} analysis shows Reels outperforming static posts by {round((ratio - 1) * 100)}%, suggesting continued investment in video-first content.",
                "positive", impact=65, key="reels_vs_photos"
            ))

    if c_avg > 0 and p_avg > 0 and c_avg > p_avg:
        pct = round((c_avg / max(p_avg, 1) - 1) * 100)
        if pct > 10:
            results.append(Insight(
                "FORMAT",
                f"For the {month} cycle, Carousel posts demonstrated a {pct}% engagement premium over single-image content, indicating higher audience swipe intent.",
                "positive", impact=60, key="carousels_vs_photos"
            ))

    if r_avg > 0 and c_avg > 0 and r_avg < c_avg:
        pct = round((c_avg / max(r_avg, 1) - 1) * 100)
        if pct > 15:
            results.append(Insight(
                "FORMAT",
                f"In our {month} review, Carousels outperformed Reels by {pct}% — consider leveraging multi-slide storytelling.",
                "info", impact=55, key="carousels_vs_reels"
            ))

    return results


def _rule_save_rate(metrics: dict) -> list[Insight]:
    """Analyze content save behavior."""
    results = []
    total_saves = metrics.get("total_saves", 0)
    post_count = metrics.get("post_count", 0)
    month = metrics.get("month", "this month")
    if post_count < 1:
        return results

    save_per_post = round(total_saves / post_count, 1)

    if save_per_post >= 15:
        results.append(Insight(
            "RETENTION",
            f"Content in {month} achieved {save_per_post} saves per post — significantly above platform norms, indicating high intent to revisit.",
            "positive", impact=80, key="save_rate_high"
        ))
    elif save_per_post >= 8:
        results.append(Insight(
            "RETENTION",
            f"An average save rate of {save_per_post} per post in {month} indicates strong content utility and information value.",
            "positive", impact=60, key="save_rate_good"
        ))
    elif save_per_post < 3 and post_count >= 5:
        results.append(Insight(
            "RETENTION",
            f"The low {month} save rate of {save_per_post} per post signals an opportunity to increase content utility through actionable or reference-worthy formats.",
            "warning", impact=50, key="save_rate_low"
        ))

    return results


def _rule_posting_day(metrics: dict) -> list[Insight]:
    """Identify highest-performing posting day."""
    results = []
    day_engagement = metrics.get("day_engagement", {})
    month = metrics.get("month", "this month")
    if not day_engagement:
        return results

    day_avgs = {d: sum(vals) / len(vals) for d, vals in day_engagement.items() if vals}
    if not day_avgs:
        return results

    best = max(day_avgs.items(), key=lambda x: x[1])
    avg_best = round(best[1])
    if avg_best > 0:
        results.append(Insight(
            "TIMING",
            f"During {month}, {best[0]} posts consistently outperformed other days with an average of {avg_best} interactions.",
            "positive", impact=55, key="best_day"
        ))

    return results


def _rule_posting_hour(metrics: dict) -> list[Insight]:
    """Identify peak audience activity hours."""
    results = []
    hour_engagement = metrics.get("hour_engagement", {})
    month = metrics.get("month", "this month")
    if not hour_engagement:
        return results

    hour_avgs = {h: sum(vals) / len(vals) for h, vals in hour_engagement.items() if vals}
    if not hour_avgs:
        return results

    best = max(hour_avgs.items(), key=lambda x: x[1])
    h = best[0]
    period = "AM" if h < 12 else "PM"
    display_h = h if h <= 12 else h - 12
    if display_h == 0:
        display_h = 12

    results.append(Insight(
        "TIMING",
        f"Audience responsiveness in {month} peaked around {display_h}:00 {period}. We recommend aligning posting times with this active window.",
        "info", impact=50, key="peak_hour"
    ))

    return results


def _rule_posting_cadence(metrics: dict) -> list[Insight]:
    """Analyze posting consistency and gaps."""
    results = []
    post_dates = metrics.get("post_dates_sorted", [])
    month = metrics.get("month", "this month")
    if len(post_dates) < 2:
        return results

    gaps = [(post_dates[i + 1] - post_dates[i]).days for i in range(len(post_dates) - 1)]
    max_gap = max(gaps) if gaps else 0
    avg_gap = round(sum(gaps) / len(gaps), 1) if gaps else 0
    post_count = metrics.get("post_count", 0)

    if max_gap >= 7:
        results.append(Insight(
            "CADENCE",
            f"A {max_gap}-day content gap was detected during {month}. Extended gaps correlate with reach suppression and audience drop-offs.",
            "warning", impact=75, key="long_gap"
        ))
    elif max_gap >= 5:
        results.append(Insight(
            "CADENCE",
            f"A {max_gap}-day posting gap was identified in {month}. Keeping gaps under 4 days helps preserve algorithmic momentum.",
            "warning", impact=55, key="moderate_gap"
        ))

    if avg_gap <= 2 and post_count >= 5:
        results.append(Insight(
            "CADENCE",
            f"Consistent {month} posting cadence of every {avg_gap} days successfully maintained steady reach stability.",
            "positive", impact=60, key="consistent_cadence"
        ))
    elif avg_gap <= 3 and post_count >= 5:
        results.append(Insight(
            "CADENCE",
            f"Posting frequency in {month} averaged every {avg_gap} days. Tightening this slightly will enhance distribution consistency.",
            "info", impact=40, key="moderate_cadence"
        ))

    return results


def _rule_engagement_rate(metrics: dict) -> list[Insight]:
    """Evaluate overall engagement rate against benchmarks."""
    results = []
    engagement_rate = metrics.get("engagement_rate", 0)
    month = metrics.get("month", "this month")

    if engagement_rate >= 10:
        results.append(Insight(
            "PERFORMANCE",
            f"At {engagement_rate}%, the {month} engagement rate significantly exceeds the industry median of 1-3%, demonstrating outstanding audience resonance.",
            "positive", impact=90, key="engagement_exceptional"
        ))
    elif engagement_rate >= 5:
        results.append(Insight(
            "PERFORMANCE",
            f"Our {month} audit shows an engagement rate of {engagement_rate}%, positioning the brand above typical benchmarks.",
            "positive", impact=70, key="engagement_strong"
        ))
    elif engagement_rate >= 2:
        results.append(Insight(
            "PERFORMANCE",
            f"The {month} engagement rate of {engagement_rate}% lies within typical industry norms. Content experimentation could unlock further lift.",
            "info", impact=40, key="engagement_average"
        ))
    elif engagement_rate > 0:
        results.append(Insight(
            "PERFORMANCE",
            f"Engagement rate of {engagement_rate}% in {month} sits below the 2% target. Audience alignment and creative review are recommended.",
            "warning", impact=80, key="engagement_low"
        ))

    return results


def _rule_growth_momentum(metrics: dict) -> list[Insight]:
    """Analyze growth between periods."""
    results = []
    growth = metrics.get("growth", {})
    month = metrics.get("month", "this month")
    prev_month = metrics.get("prev_month", "previous month")

    organic_reach = metrics.get("organic_reach", 0)
    paid_reach = metrics.get("paid_reach", 0)
    if paid_reach > organic_reach and paid_reach > 0:
        results.append(Insight(
            "GROWTH",
            f"Distribution is ad-driven rather than organic audience expansion. Paid reach of {paid_reach:,} represents the dominant channel for brand exposure during {month}.",
            "info", impact=50, key="paid_dominance"
        ))

    if not growth.get("has_previous"):
        return results

    reach_growth = growth.get("reach", 0)
    foll_growth = growth.get("followers", 0)

    if reach_growth > 50:
        results.append(Insight(
            "GROWTH",
            f"Monthly reach expanded by {reach_growth}% in {month} compared to {prev_month}, demonstrating exceptional organic discoverability.",
            "positive", impact=85, key="reach_surge"
        ))
    elif reach_growth > 0:
        results.append(Insight(
            "GROWTH",
            f"Reach increased by {reach_growth}% in {month} compared to {prev_month}, maintaining positive audience scaling momentum.",
            "positive", impact=60, key="reach_growth"
        ))
    elif reach_growth < 0:
        results.append(Insight(
            "GROWTH",
            f"Reach declined by {abs(reach_growth)}% in {month} compared to {prev_month}. We recommend auditing peak active hours and format variety.",
            "warning", impact=70, key="reach_decline"
        ))

    if foll_growth > 0:
        results.append(Insight(
            "GROWTH",
            f"Follower base grew by {foll_growth}% during {month} relative to {prev_month}, showing steady community acquisition acceleration.",
            "positive", impact=65, key="follower_growth"
        ))
    elif foll_growth < 0:
        results.append(Insight(
            "GROWTH",
            f"Follower count contracted {abs(foll_growth)}% in {month} compared to {prev_month}, suggesting potential content-community mismatch.",
            "warning", impact=60, key="follower_decline"
        ))

    return results


# ── Rule Registry ───────────────────────────────────
# All rules listed here run for every analysis. Add new rules here.

INSIGHT_RULES = [
    _rule_engagement_rate,
    _rule_content_format,
    _rule_save_rate,
    _rule_posting_day,
    _rule_posting_hour,
    _rule_posting_cadence,
    _rule_growth_momentum,
]


# ── Metrics Parser ──────────────────────────────────

def parse_platform_metrics(ig: dict, growth: dict | None = None) -> dict:
    """
    Parse raw platform data into a normalized metrics dict
    consumed by the rule engine. Works for Instagram; extend for other platforms.
    """
    posts = ig.get("posts", []) if isinstance(ig.get("posts"), list) else []
    post_count = len(posts) or _safe_int(ig.get("total_posts", 0))
    type_counts = ig.get("type_counts", {})

    # Per-type engagement
    type_engagement: dict[str, dict[str, Any]] = {}
    for media_type in ["VIDEO", "IMAGE", "CAROUSEL_ALBUM", "TEXT"]:
        type_posts = [p for p in posts if p.get("media_type") == media_type]
        if type_posts:
            avg_eng = sum(
                _safe_int(p.get("like_count", p.get("likes", 0))) + _safe_int(p.get("comments_count", p.get("comments", 0)))
                for p in type_posts
            ) / len(type_posts)
            if avg_eng > 0:
                type_engagement[media_type] = {"count": len(type_posts), "avg_eng": round(avg_eng, 1)}

    # Day-of-week engagement
    day_engagement: dict[str, list[int]] = defaultdict(list)
    hour_engagement: dict[int, list[int]] = defaultdict(list)
    post_dates_sorted: list[datetime] = []

    for p in posts:
        ts = p.get("timestamp", "")
        if ts and "T" in ts:
            try:
                dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
                eng = _safe_int(p.get("like_count", p.get("likes", 0))) + _safe_int(p.get("comments_count", p.get("comments", 0)))
                day_engagement[dt.strftime("%A")].append(eng)
                hour_engagement[dt.hour].append(eng)
                post_dates_sorted.append(dt)
            except:
                pass

    post_dates_sorted.sort()

    organic_reach = _safe_int(ig.get("organic", {}).get("total_reach", ig.get("total_reach", 0)))
    paid_reach = _safe_int(ig.get("paid", {}).get("total_reach", 0))

    return {
        "engagement_rate": _safe_float(ig.get("engagement_rate", 0)),
        "total_reach": _safe_int(ig.get("total_reach", 0)),
        "total_impressions": _safe_int(ig.get("total_impressions", 0)),
        "followers": _safe_int(ig.get("followers", 0)) or 1,
        "total_likes": _safe_int(ig.get("total_likes", 0)),
        "total_comments": _safe_int(ig.get("total_comments", 0)),
        "total_saves": _safe_int(ig.get("total_saves", 0)),
        "total_shares": _safe_int(ig.get("total_shares", 0)),
        "post_count": post_count,
        "type_engagement": type_engagement,
        "type_counts": type_counts,
        "day_engagement": dict(day_engagement),
        "hour_engagement": dict(hour_engagement),
        "post_dates_sorted": post_dates_sorted,
        "growth": growth or {},
        "organic_reach": organic_reach,
        "paid_reach": paid_reach,
    }


# ── Main Entry Point ───────────────────────────────

def get_prev_month(month_name: str) -> str:
    if not month_name:
        return "previous month"
    months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]
    if month_name in months:
        idx = months.index(month_name)
        return months[idx - 1]
    return "previous month"


def generate_insights(
    platform_data: dict,
    growth: dict | None = None,
    platform: str = "instagram",
    max_insights: int = 8,
    month: str = None,
    year: str = None,
) -> list[dict]:
    """
    Generate prioritized, deduplicated insights from raw platform analytics.

    Args:
        platform_data: Raw platform data dict (e.g., the `instagram` block from a report).
        growth: Optional growth metrics dict with `reach`, `followers`, `engagement`, `has_previous`.
        platform: Platform name (for future multi-platform support).
        max_insights: Maximum number of insights to return.
        month: Selected reporting month name.
        year: Selected reporting year.

    Returns:
        List of insight dicts sorted by impact score (highest first).
    """
    metrics = parse_platform_metrics(platform_data, growth)
    metrics["month"] = month or "this month"
    metrics["year"] = year or ""
    metrics["prev_month"] = get_prev_month(month)

    all_insights: list[Insight] = []
    seen_keys: set[str] = set()

    for rule_fn in INSIGHT_RULES:
        try:
            rule_results = rule_fn(metrics)
            for insight in rule_results:
                if insight.key not in seen_keys:
                    seen_keys.add(insight.key)
                    all_insights.append(insight)
        except Exception as e:
            # Never crash on a single rule failure
            print(f"[InsightEngine] Rule {rule_fn.__name__} failed: {e}")

    # Sort by impact (highest first), take top N
    all_insights.sort(key=lambda x: x.impact, reverse=True)
    return [i.to_dict() for i in all_insights[:max_insights]]
