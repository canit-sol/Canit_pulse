import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import json
from uuid import uuid4
import math
import base64
import re
from typing import Optional, Tuple
import os
from dotenv import load_dotenv

load_dotenv()

try:
    from groq import Groq
    groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    GROQ_MODEL = "llama-3.3-70b-versatile"
    GROQ_AVAILABLE = True
except Exception:
    groq_client = None
    GROQ_AVAILABLE = False

# Lazy import to avoid circular dependencies
_instagram_module = None

def _get_instagram_module():
    global _instagram_module
    if _instagram_module is None:
        from instagram import get_client_instagram_stats
        _instagram_module = get_client_instagram_stats
    return _instagram_module


def _parse_engagement_rate(eng_rate_str):
    """Parse engagement rate string like '2.5%' to float, return None if unavailable."""
    if not eng_rate_str or eng_rate_str == 'N/A':
        return None
    try:
        return float(str(eng_rate_str).replace('%', '').strip())
    except Exception:
        return None


def _load_canit_logo() -> str:
    """Return SVG data URI for Canit Pulse logo - no base64 image loading."""
    return _svg_logo_data_uri('CP', '#1E2B8F', 40)


def _safe_val(val, default='N/A'):
    """Return default if val is None or empty, else the value."""
    if val is None or val == '':
        return default
    return val


def generate_strategic_forecast(report_data: dict, instagram_data: dict, facebook_data: dict = None) -> str:
    """
    Generate strategic forecast using Groq, falling back to arithmetic if Groq is unavailable.
    Analyzes current cycle performance to project next cycle outcomes.
    """
    facebook_data = facebook_data or {}
    month = report_data.get('month', '')
    year = report_data.get('year', '')
    client_name = report_data.get('client_name', 'the client')

    ig_posts = instagram_data.get('posts', [])
    ig_type_counts = instagram_data.get('type_counts', {})
    ig_followers = instagram_data.get('followers', 0)
    ig_eng_rate = _parse_engagement_rate(instagram_data.get('engagement_rate', ''))
    ig_reach = instagram_data.get('total_reach', 0)
    ig_total_eng = 0
    try:
        ig_total_eng = int(instagram_data.get('total_likes') or 0) + int(instagram_data.get('total_comments') or 0) + int(instagram_data.get('total_saves') or 0)
    except Exception:
        pass

    fb_type_counts = facebook_data.get('type_counts', {'Photos': 0, 'Video / Reels': 0, 'Link Shares': 0})
    fb_followers = facebook_data.get('followers', 0) or 0
    fb_eng_rate = _parse_engagement_rate(facebook_data.get('engagement_rate', ''))

    if GROQ_AVAILABLE and groq_client:
        try:
            prompt = f"""You are a senior digital marketing strategist writing a forward-looking forecast for {client_name}'s {month} {year} report.

Analyze the following current cycle data and generate a 2-sentence strategic projection for next month's content strategy:

INSTAGRAM DATA:
- Posts published: {len(ig_posts)}
- Followers: {ig_followers}
- Engagement rate: {instagram_data.get('engagement_rate', 'N/A')}
- Total reach: {ig_reach}
- Total engagements: {ig_total_eng}
- Content type breakdown: {ig_type_counts}

FACEBOOK DATA:
- Followers: {fb_followers}
- Engagement rate: {facebook_data.get('engagement_rate', 'N/A')}
- Content type breakdown: {fb_type_counts}

Based on this data, provide a strategic forecast that:
1. Identifies which content format should be increased/decreased
2. Projects engagement or reach improvement with specific percentage
3. Recommends one specific tactical shift for next month

Keep it under 60 words, be specific with numbers, sound like a strategic consultant."""

            res = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=180,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"generate_strategic_forecast: Groq call failed ({e}), using arithmetic fallback")

    return _arithmetic_strategic_forecast(
        len(ig_posts), ig_type_counts, ig_followers, ig_eng_rate, ig_total_eng,
        fb_type_counts, fb_followers, fb_eng_rate
    )


def _arithmetic_strategic_forecast(ig_post_count, ig_type_counts, ig_followers, ig_eng_rate, ig_total_eng,
                                   fb_type_counts, fb_followers, fb_eng_rate) -> str:
    """Arithmetic fallback for strategic forecast when Groq is unavailable."""

    def _best_format(type_counts):
        if not type_counts:
            return None, 0
        best = max(type_counts.items(), key=lambda x: x[1])
        return best[0], best[1]

    ig_best_fmt, ig_best_cnt = _best_format(ig_type_counts)
    fb_best_fmt, fb_best_cnt = _best_format(fb_type_counts)

    fmt_labels = {'IMAGE': 'static imagery', 'VIDEO': 'Reels/video', 'CAROUSEL_ALBUM': 'carousels', 'Photos': 'photos', 'Video / Reels': 'video/Reels', 'Link Shares': 'link shares'}

    forecast_parts = []

    if ig_followers and ig_followers != 'N/A' and ig_followers > 0 and ig_eng_rate:
        projected_improvement = round(ig_eng_rate * 0.15, 2)
        forecast_parts.append(f"Based on {ig_post_count} posts averaging {ig_eng_rate}% engagement, increasing carousel content by 15% is projected to yield approximately {projected_improvement}% improvement in save frequency and brand recall next month.")
    elif ig_best_fmt and ig_best_cnt > 0:
        best_label = fmt_labels.get(ig_best_fmt, ig_best_fmt)
        forecast_parts.append(f"Your {best_label} content delivered the highest performance this cycle ({ig_best_cnt} posts). Shifting 20% more content budget toward this format should drive 8-12% higher engagement in the next cycle.")

    if fb_best_fmt and fb_best_fmt != ig_best_fmt and fb_best_cnt > 0:
        fb_best_label = fmt_labels.get(fb_best_fmt, fb_best_fmt)
        forecast_parts.append(f"On Facebook, {fb_best_label} outperformed other formats ({fb_best_cnt} posts), suggesting a cross-platform content alignment opportunity.")

    if not forecast_parts:
        forecast_parts.append("Maintain consistent posting cadence and monitor content performance closely to identify optimization opportunities next cycle.")

    return " ".join(forecast_parts)


def _arithmetic_ai_perf_text(eng_rate_str, ig_total_eng, followers):
    """Generate dynamic engagement performance text vs industry median."""
    eng_rate = _parse_engagement_rate(eng_rate_str)
    if eng_rate is None:
        return "Engagement data unavailable for this period."

    industry_median_low = 1.0
    industry_median_high = 3.0
    industry_median = 2.0

    if eng_rate < industry_median_low:
        diff = industry_median - eng_rate
        pct_below = round(diff / industry_median * 100, 1)
        return f"Your engagement rate of {eng_rate}% is {pct_below}% below the industry median of 1-3%. Focus on improving content quality and posting consistency to close this gap."
    elif eng_rate > industry_median_high:
        diff = eng_rate - industry_median_high
        pct_above = round(diff / industry_median_high * 100, 1)
        return f"Your engagement rate of {eng_rate}% is {pct_above}% above the industry median of 1-3%, demonstrating outstanding audience resonance and content effectiveness."
    else:
        pct_above_low = round((eng_rate - industry_median_low) / industry_median_low * 100, 1)
        return f"Your engagement rate of {eng_rate}% is {pct_above_low}% above the low end of the industry median (1-3%), showing solid audience interaction with room for growth."


def _arithmetic_ai_format_text(type_counts):
    """Analyze content format performance and generate dynamic text."""
    if not type_counts:
        return "Content format data unavailable for this period."

    total = sum(type_counts.values())
    if total == 0:
        return "No posts published this period to determine content format effectiveness."

    sorted_formats = sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
    best_fmt, best_cnt = sorted_formats[0]
    best_pct = round(best_cnt / total * 100, 1)

    fmt_labels = {
        'IMAGE': 'static imagery (photos)',
        'VIDEO': 'Reels and video content',
        'CAROUSEL_ALBUM': 'carousel posts',
        'Photos': 'photo posts',
        'Video / Reels': 'video/Reels content',
        'Link Shares': 'link shares'
    }

    best_label = fmt_labels.get(best_fmt, best_fmt)

    if len(sorted_formats) > 1:
        second_fmt, second_cnt = sorted_formats[1]
        second_pct = round(second_cnt / total * 100, 1)
        second_label = fmt_labels.get(second_fmt, second_fmt)
        return f"{best_label.capitalize()} dominated your content mix this cycle at {best_pct}% ({best_cnt} posts), followed by {second_label} at {second_pct}%. This format concentration suggests doubling down on what resonates most with your audience."
    else:
        return f"{best_label.capitalize()} was your only content format this cycle ({best_cnt} posts, {best_pct}%). Consider testing additional formats to diversify engagement patterns."


def _arithmetic_ai_cadence_text(post_count, active_days):
    """Calculate posting cadence and generate dynamic text."""
    if not post_count or post_count == 0:
        return "No posts published this period to assess posting cadence."

    if isinstance(active_days, list) and len(active_days) >= 2:
        try:
            sorted_days = sorted([int(d) for d in active_days if str(d).isdigit()])
            gaps = [sorted_days[i+1] - sorted_days[i] for i in range(len(sorted_days)-1)]
            avg_gap = sum(gaps) / len(gaps) if gaps else 1
        except Exception:
            days_in_month = 30
            avg_gap = days_in_month / post_count if post_count > 0 else 1
    else:
        days_in_month = 30
        avg_gap = days_in_month / post_count if post_count > 0 else 1

    recommended_gap = 1.0

    if avg_gap <= recommended_gap:
        return f"Average posting cadence of {avg_gap:.1f} days meets the recommended 1 post per day benchmark. This consistent presence keeps your brand top-of-mind and maximizes algorithmic visibility."
    elif avg_gap <= 2.0:
        diff = round(avg_gap - recommended_gap, 1)
        return f"With an average cadence of {avg_gap:.1f} days between posts, you're slightly below the recommended daily posting. Increasing to 1 post per day could improve reach by an estimated 10-15%."
    else:
        posts_needed = round(30 / recommended_gap - post_count) if recommended_gap > 0 else 0
        return f"Current posting cadence of {avg_gap:.1f} days between posts falls short of the daily posting standard. To close this gap, consider scheduling approximately {posts_needed} additional posts per month to reach the optimal frequency."


def generate_ai_engagement_insight(eng_rate, ig_total_eng, followers) -> str:
    """
    Generate AI-powered engagement insight using Groq, falling back to arithmetic if unavailable.
    """
    if GROQ_AVAILABLE and groq_client:
        try:
            prompt = f"""You are a senior social media analyst evaluating engagement performance for a brand's monthly report.

Given the following metrics:
- Engagement Rate: {eng_rate}
- Total Engagements (likes + comments + saves): {ig_total_eng}
- Followers: {followers}

Industry benchmark for engagement rate: 1% - 3%

Write a single, concise 1-sentence insight (under 40 words) that:
1. Compares the brand's engagement rate against the industry median
2. Highlights whether the brand is over-performing or under-performing
3. Mentions one specific tactical recommendation to improve

Sound like a data-driven marketing analyst. Be specific with numbers. Under 40 words."""

            res = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=120,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"generate_ai_engagement_insight: Groq call failed ({e}), using arithmetic fallback")

    return _arithmetic_ai_perf_text(eng_rate, ig_total_eng, followers)


def generate_ai_format_insight(type_counts, top_format) -> str:
    """
    Generate AI-powered content format insight using Groq, falling back to arithmetic if unavailable.
    """
    if GROQ_AVAILABLE and groq_client:
        try:
            prompt = f"""You are a senior social media analyst evaluating content format performance for a brand's monthly report.

Content format breakdown this cycle: {type_counts}
Top performing format: {top_format}

Write a single, concise 1-sentence insight (under 40 words) that:
1. Identifies which content format dominated the cycle
2. Explains why that format likely performed best based on the numbers
3. Recommends whether to increase or diversify that format

Sound like a data-driven marketing analyst. Be specific with percentages and post counts. Under 40 words."""

            res = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=120,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"generate_ai_format_insight: Groq call failed ({e}), using arithmetic fallback")

    return _arithmetic_ai_format_text(type_counts)


def generate_ai_cadence_insight(total_posts, active_days) -> str:
    """
    Generate AI-powered posting cadence insight using Groq, falling back to arithmetic if unavailable.
    """
    if GROQ_AVAILABLE and groq_client:
        try:
            active_days_count = len(active_days) if isinstance(active_days, list) else 0
            prompt = f"""You are a senior social media analyst evaluating posting cadence for a brand's monthly report.

Posting metrics:
- Total posts published: {total_posts}
- Active posting days: {active_days_count}
- Days in month: 30

Optimal posting benchmark: 1 post per day (30 per month) for most brands.

Write a single, concise 1-sentence insight (under 40 words) that:
1. Evaluates whether the brand met the recommended posting frequency
2. Quantifies the gap or excess vs the optimal benchmark
3. Gives one specific tactical recommendation

Sound like a data-driven marketing analyst. Be specific with numbers. Under 40 words."""

            res = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.6,
                max_tokens=120,
            )
            return res.choices[0].message.content.strip()
        except Exception as e:
            logger.warning(f"generate_ai_cadence_insight: Groq call failed ({e}), using arithmetic fallback")

    return _arithmetic_ai_cadence_text(total_posts, active_days)


# ---------------------------------------------------------------------------
# Data fetching with live-first and archive fallback
# ---------------------------------------------------------------------------

def fetch_instagram_data(
    client_id: str,
    month: str,
    year: str,
    archived_blob: Optional[dict] = None,
    client_keys: Optional[dict] = None
) -> Tuple[dict, bool, str]:
    """
    Fetch Instagram data with live-first fallback strategy.
    Falls back to archived data if live fetch fails or returns no posts.

    Returns:
        Tuple of (instagram_data, is_live_data, archived_data_message_for_log)
        The message is logged to console, not returned to the report.
    """
    get_client_stats = _get_instagram_module()

    if client_keys is None:
        logger.warning(f"fetch_instagram_data: No client_keys provided for client {client_id}, using archived data")
        if archived_blob:
            instagram_data, _, _ = _use_archived_data(archived_blob, month, year)
            return instagram_data, False, ""
        return {}, False, ""

    try:
        logger.info(f"fetch_instagram_data: Attempting live fetch for client {client_id} month={month} year={year}")
        fetched = get_client_stats(client_keys, month, year)

        if fetched and fetched.get("posts"):
            logger.info(f"fetch_instagram_data: Live fetch successful with {len(fetched.get('posts', []))} posts")
            return fetched, True, ""

        logger.warning(f"fetch_instagram_data: Live fetch returned empty data for client {client_id}")
        if archived_blob:
            instagram_data, archived_month, archived_year = _use_archived_data(archived_blob, month, year)
            logger.warning(f"fetch_instagram_data: LIVE DATA FAILED - Using archived report from {archived_month} {archived_year}")
            return instagram_data, False, ""

        logger.warning(f"fetch_instagram_data: No posts returned and no archived data available")
        return fetched or {}, False, ""

    except Exception as e:
        logger.error(f"fetch_instagram_data: Live fetch failed for client {client_id}: {e}")
        if archived_blob:
            instagram_data, archived_month, archived_year = _use_archived_data(archived_blob, month, year)
            logger.warning(f"fetch_instagram_data: LIVE DATA FAILED ({e}) - Using archived report from {archived_month} {archived_year}")
            return instagram_data, False, ""
        logger.warning(f"fetch_instagram_data: Live fetch failed with no archived data to fall back on")
        return {}, False, ""


def _use_archived_data(archived_blob: dict, month: str, year: str) -> Tuple[dict, str, str]:
    """Helper to extract data from archived blob and return archive metadata."""
    instagram_data = archived_blob.get("instagram_data") or archived_blob.get("instagram") or {}
    archived_posts = archived_blob.get("posts") or []
    archived_meta = archived_blob.get("report_data") or {}

    instagram_data["posts"] = archived_posts

    archived_month = archived_meta.get("month", month)
    archived_year = str(archived_meta.get("year", year))

    logger.info(f"_use_archived_data: Using archived snapshot from {archived_month} {archived_year}")
    return instagram_data, archived_month, archived_year


def fetch_facebook_data(client_keys: Optional[dict] = None, archived_blob: dict = None) -> Tuple[dict, bool]:
    """
    Attempt to fetch Facebook data live, fallback to archived on failure.
    Returns (facebook_data, is_live).
    """
    if client_keys is None:
        logger.warning("fetch_facebook_data: No client_keys, using archived Facebook data")
        if archived_blob:
            return archived_blob.get("facebook_data", {}), False
        return {}, False

    try:
        from facebook import get_client_facebook_stats
        logger.info("fetch_facebook_data: Attempting live fetch")
        fb_data = get_client_facebook_stats(client_keys)
        if fb_data and fb_data.get("status") != "error" and fb_data.get("status") != "not_connected":
            logger.info(f"fetch_facebook_data: Live fetch successful, followers={fb_data.get('followers')}")
            return fb_data, True
        logger.warning(f"fetch_facebook_data: Live fetch returned status={fb_data.get('status')}")
    except Exception as e:
        logger.error(f"fetch_facebook_data: Live fetch failed: {e}")

    if archived_blob:
        archived_fb = archived_blob.get("facebook_data", {})
        if archived_fb:
            logger.info("fetch_facebook_data: Falling back to archived Facebook data")
            return archived_fb, False

    return {}, False

# ---------------------------------------------------------------------------
# Design tokens ΓÇö Report / Canit Pulse spec
# ---------------------------------------------------------------------------
BRAND_PRIMARY        = '#1E2B8F'   # deep navy/indigo
BRAND_ACCENT         = '#E83E6C'   # hot pink/magenta ΓÇö KPI values, bars, pills
BRAND_ACCENT_SEC     = '#7B5EA7'   # muted purple ΓÇö secondary icons
TEXT_PRIMARY         = '#1A1A2E'   # body text, card headers
TEXT_SECONDARY       = '#5A6078'   # subtitles, secondary body
TEXT_LABEL           = '#8F96AB'   # micro-labels, metadata, table col headers
BG_PAGE              = '#FFFFFF'
BG_CARD              = '#F7F8FC'
BG_CARD_BORDER       = '#E2E5F0'
STATUS_ACTIVE        = '#E83E6C'
STATUS_ACTIVE_BG     = '#FDE8EF'
BLUE_LINK            = '#3B5BDB'
GREEN_POS            = '#2ECC71'
FORECAST_BG          = '#EFF2FF'
FORECAST_BORDER      = '#C8D0F0'

# ---------------------------------------------------------------------------
# SVG helpers ΓÇö all pure SVG data URIs, no external deps
# ---------------------------------------------------------------------------

def _b64svg(svg: str) -> str:
    return 'data:image/svg+xml;base64,' + base64.b64encode(svg.encode('utf-8')).decode('ascii')


def svg_bar_chart(weeks, width=560, height=150):
    """Weekly bar chart styled to Canit Pulse report tokens ΓÇö navy/pink bars on white card."""
    # Defensive: if weeks is empty or not iterable, return a small "no data" SVG
    try:
        n = max(1, len(weeks))
    except Exception:
        weeks = []
        n = 1
    counts = [w.get('count', 0) for w in weeks] if weeks else []
    max_c = max(counts) if counts else 0
    if not counts:
        # Render a simple empty-state SVG consistent with other helpers
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
            f'<rect width="100%" height="100%" fill="{BG_CARD}" rx="8"/>'
            f'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" '
            f'fill="{TEXT_LABEL}" font-family="DM Sans,sans-serif" font-size="12">No weekly data</text>'
            '</svg>'
        )
        return _b64svg(svg)
    pad    = 16
    chart_w = width - pad * 2
    chart_h = height - 44
    bar_w   = chart_w / n
    bars, labels = [], []
    for i, w in enumerate(weeks):
        c = w.get('count', 0)
        h = (c / max_c) * chart_h if max_c else 0
        x = pad + i * bar_w + 6
        y = pad + (chart_h - h)
        bars.append(
            f'<rect x="{x}" y="{y}" width="{bar_w - 12}" height="{max(3, h)}" '
            f'fill="{BRAND_ACCENT}" rx="4"/>'
        )
        labels.append(
            f'<text x="{x + (bar_w - 12) / 2}" y="{pad + chart_h + 16}" '
            f'font-size="10" fill="{TEXT_LABEL}" text-anchor="middle" font-family="DM Sans,sans-serif">'
            f'{w.get("week", "")}</text>'
        )
        labels.append(
            f'<text x="{x + (bar_w - 12) / 2}" y="{y - 5}" '
            f'font-size="10" fill="{TEXT_SECONDARY}" text-anchor="middle" font-family="DM Sans,sans-serif">'
            f'{c}</text>'
        )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        f'<rect width="100%" height="100%" fill="{BG_CARD}" rx="8"/>'
        + ''.join(bars) + ''.join(labels) +
        '</svg>'
    )
    return _b64svg(svg)


def svg_donut_gauge(value: float, max_val: float = 100, size: int = 100):
    """Circular arc gauge for Brand Health Index."""
    cx = cy = size / 2
    r  = size / 2 - 10
    circ = 2 * math.pi * r
    ratio = min(value / max_val, 1.0)
    arc   = ratio * circ
    gap   = circ - arc
    label = f'{value:.0f}'
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{BG_CARD_BORDER}" stroke-width="10"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{BRAND_ACCENT}" stroke-width="10" '
        f'stroke-dasharray="{arc:.2f} {gap:.2f}" stroke-linecap="round" '
        f'transform="rotate(-90 {cx} {cy})"/>'
        f'<text x="{cx}" y="{cy - 4}" font-size="18" font-weight="900" fill="{TEXT_PRIMARY}" '
        f'text-anchor="middle" dominant-baseline="middle" font-family="Poppins,sans-serif">{label}</text>'
        f'<text x="{cx}" y="{cy + 14}" font-size="9" fill="{TEXT_LABEL}" '
        f'text-anchor="middle" font-family="DM Sans,sans-serif">/100</text>'
        '</svg>'
    )
    return _b64svg(svg)


def svg_progress_bar(pct: float, width: int = 280, height: int = 7, color: str = BRAND_ACCENT):
    fill_w = max(3, pct / 100 * width)
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
        f'<rect width="{width}" height="{height}" rx="3" fill="{BG_CARD_BORDER}"/>'
        f'<rect width="{fill_w:.1f}" height="{height}" rx="3" fill="{color}"/>'
        '</svg>'
    )
    return _b64svg(svg)


def svg_stacked_bar(type_counts: dict, width: int = 400, height: int = 10):
    items = list(type_counts.items())
    total = sum(v for _, v in items) or 1
    colors = [BRAND_ACCENT, BRAND_ACCENT_SEC, '#3AA7C8', '#A3C95A']
    x = 0
    parts = []
    for i, (k, v) in enumerate(items):
        w = v / total * width
        parts.append(f'<rect x="{x:.1f}" y="0" width="{w:.1f}" height="{height}" fill="{colors[i % len(colors)]}" rx="2"/>')
        x += w
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        + ''.join(parts) + '</svg>'
    )
    return _b64svg(svg)


def svg_line_trend(points, width=560, height=120):
    """Line chart for SEO visits trend."""
    if not points:
        svg = (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
            f'<rect width="100%" height="100%" fill="{BG_CARD}" rx="8"/>'
            f'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" '
            f'fill="{TEXT_LABEL}" font-family="DM Sans,sans-serif" font-size="12">No trend data</text>'
            '</svg>'
        )
        return _b64svg(svg)
    vals = [p.get('visits', 0) for p in points]
    m    = max(vals) or 1
    pad  = 16
    cw   = width - pad * 2
    ch   = height - pad * 2 - 16
    n    = len(points)
    xs   = [pad + i * (cw / max(1, n - 1)) for i in range(n)]
    ys   = [pad + (ch - (v / m) * ch) for v in vals]
    path = ' '.join(f'{"M" if i == 0 else "L"}{xs[i]:.1f} {ys[i]:.1f}' for i in range(n))
    fill_path = path + f' L{xs[-1]:.1f} {pad+ch:.1f} L{xs[0]:.1f} {pad+ch:.1f} Z'
    dots  = ''.join(f'<circle cx="{xs[i]:.1f}" cy="{ys[i]:.1f}" r="3" fill="{BRAND_ACCENT}"/>' for i in range(n))
    xlbls = ''.join(
        f'<text x="{xs[i]:.1f}" y="{height - 4}" font-size="9" fill="{TEXT_LABEL}" text-anchor="middle" font-family="DM Sans,sans-serif">{points[i].get("month","")}</text>'
        for i in range(n)
    )
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
        f'<rect width="100%" height="100%" fill="{BG_CARD}" rx="8"/>'
        f'<path d="{fill_path}" fill="{BRAND_ACCENT}" fill-opacity="0.08"/>'
        f'<path d="{path}" fill="none" stroke="{BRAND_ACCENT}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
        + dots + xlbls +
        '</svg>'
    )
    return _b64svg(svg)


def svg_word_cloud(text, width=520, height=140, max_words=12):
    import re
    if not text:
        svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}">'
               f'<rect width="100%" height="100%" fill="{BG_CARD}" rx="8"/>'
               f'<text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="{TEXT_LABEL}">No insights</text>'
               '</svg>')
        return _b64svg(svg)
    stop = {"the","and","of","to","a","in","is","for","this","that","with","on","by","as","are","it","be","we","our"}
    freqs = {}
    for w in re.findall(r'\w+', text.lower()):
        if w in stop or len(w) < 3: continue
        freqs[w] = freqs.get(w, 0) + 1
    items = sorted(freqs.items(), key=lambda x: x[1], reverse=True)[:max_words]
    if not items:
        return svg_word_cloud(None, width, height, max_words)
    max_f = items[0][1]
    palette = [BRAND_ACCENT, BRAND_PRIMARY, BRAND_ACCENT_SEC, BLUE_LINK, TEXT_SECONDARY]
    cols = 4
    gapx = width // cols
    parts = [f'<rect width="100%" height="100%" fill="{BG_CARD}" rx="8"/>']
    row = 0
    for i, (w, c) in enumerate(items):
        col = i % cols
        if col == 0 and i > 0: row += 1
        size = 11 + int((c / max_f) * 22)
        x = 12 + col * gapx
        y = 28 + row * 36
        color = palette[i % len(palette)]
        parts.append(f'<text x="{x}" y="{y}" font-size="{size}" fill="{color}" font-family="DM Sans,sans-serif">{w}</text>')
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">'
           + ''.join(parts) + '</svg>')
    return _b64svg(svg)

# ---------------------------------------------------------------------------
# Reusable HTML snippet builders
# ---------------------------------------------------------------------------

def _page_header(client_logo: str, canit_logo: str, month: str, year: str) -> str:
    """Top bar shared by all content pages."""
    return f'''
    <div class="page-topbar">
      <div class="topbar-left">
        <img src="{client_logo}" class="topbar-logo" alt="Client">
        <span class="topbar-report-label">{month.upper()} {year} REPORT</span>
      </div>
      <div class="topbar-right">
        <img src="{canit_logo}" class="topbar-logo" alt="Canit Pulse">
        <span class="topbar-brand">CANIT PULSE</span>
      </div>
    </div>'''


def _page_footer(page_num: int, total: int = 7) -> str:
    return f'''
    <div class="page-footer">
      <span>CANIT PULSE ┬⌐ 2026 | PERFORMANCE &amp; AI BRAND REPORT</span>
      <span>PAGE {page_num} OF {total}</span>
    </div>'''


def _section_label(icon: str, text: str) -> str:
    return f'<div class="section-label"><span class="sl-icon">{icon}</span>{text}</div>'


def _page_title(title: str, subtitle: str = '') -> str:
    sub_html = f'<p class="page-subtitle">{subtitle}</p>' if subtitle else ''
    return f'<h1 class="page-title">{title}</h1>{sub_html}'


def _stat_pill(label: str, value: str, zero: bool = False) -> str:
    val_color = '#1E2B8F' if zero else '#E83E6C'
    return f'''
    <div class="stat-pill">
      <div class="sp-label">{label}</div>
      <div class="sp-value" style="color:{val_color};">{value}</div>
    </div>'''


def _kpi_card_2x2(platform: str, icon: str, is_active: bool,
                   reach: str, impressions: str,
                   engagement: str, followers: str,
                   posts_count,
                   followers_label: str = 'FOLLOWERS') -> str:
    active_html = '<span class="status-pill">ACTIVE</span>' if is_active else ''
    r_zero  = (str(reach) == '0')
    i_zero  = (str(impressions) == '0')
    e_zero  = False  # engagement rate stays pink even at 0%
    f_zero  = (str(followers) in ('0', 'N/A'))
    p_zero  = (str(posts_count) == '0')
    return f'''
    <div class="kpi-card">
      <div class="kc-header">
        <span class="kc-icon">{icon}</span>
        <span class="kc-platform">{platform.upper()}</span>
        {active_html}
      </div>
      <div class="kc-metrics">
        <div class="kc-metric">
          <div class="kc-mlabel">MONTHLY REACH</div>
          <div class="kc-mvalue" style="color:{'#1E2B8F' if r_zero else '#E83E6C'};">{reach}</div>
        </div>
        <div class="kc-metric">
          <div class="kc-mlabel">IMPRESSIONS</div>
          <div class="kc-mvalue" style="color:{'#1E2B8F' if i_zero else '#E83E6C'};">{impressions}</div>
        </div>
        <div class="kc-divider"></div>
        <div class="kc-metric">
          <div class="kc-mlabel">ENGAGEMENT</div>
          <div class="kc-mvalue" style="color:#E83E6C;">{engagement}</div>
        </div>
        <div class="kc-metric">
          <div class="kc-mlabel">{followers_label}</div>
          <div class="kc-mvalue" style="color:{'#1E2B8F' if f_zero else '#E83E6C'};">{followers}</div>
        </div>
      </div>
      <div class="kc-footer">
        <span class="kc-footer-label">Total Posts Published:</span>
        <span class="kc-footer-value" style="color:{'#1E2B8F' if p_zero else '#E83E6C'};">{posts_count}</span>
      </div>
    </div>'''


def _fmt(n):
    if isinstance(n, int):
        if n >= 1_000_000: return f'{n/1_000_000:.1f}M'
        if n >= 1_000:     return f'{n/1_000:.1f}K'
    return str(n)

# ---------------------------------------------------------------------------
# Main generator
# ---------------------------------------------------------------------------

def _svg_logo_data_uri(initials: str, bg_hex: str, size: int = 32) -> str:
    r = int(bg_hex[:2], 16)
    g = int(bg_hex[2:4], 16)
    b = int(bg_hex[4:6], 16)
    font_size = size * 0.44
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size}" height="{size}" viewBox="0 0 {size} {size}">'
        f'<rect width="{size}" height="{size}" rx="{size*0.19}" fill="rgb({r},{g},{b})"/>'
        f'<text x="{size/2}" y="{size*0.68}" text-anchor="middle" fill="white" '
        f'font-size="{font_size}" font-weight="700" font-family="Arial,sans-serif">{initials}</text>'
        f'</svg>'
    )
    import urllib.parse
    return 'data:image/svg+xml,' + urllib.parse.quote(svg)


def _write_html_head(f, client_name: str, month: str, year: str, css: str):
    """Write HTML head section directly to file."""
    f.write(f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{client_name} · {month} {year}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>{css}</style>
</head>
<body>
''')


def _write_page_header(f, client_logo: str, canit_logo: str, month: str, year: str):
    f.write(f'''
    <div class="page-topbar">
      <div class="topbar-left">
        <img src="{client_logo}" class="topbar-logo" alt="Client">
        <span class="topbar-report-label">{month.upper()} {year} REPORT</span>
      </div>
      <div class="topbar-right">
        <img src="{canit_logo}" class="topbar-logo" alt="Canit Pulse">
        <span class="topbar-brand">CANIT PULSE</span>
      </div>
    </div>''')


def _write_page_footer(f, page_num: int, total: int = 7):
    f.write(f'''
    <div class="page-footer">
      <span>CANIT PULSE © 2026 | PERFORMANCE &amp; AI BRAND REPORT</span>
      <span>PAGE {page_num} OF {total}</span>
    </div>''')


def _write_page_start(f):
    f.write('<div class="pdf-page">')


def _write_page_end(f):
    f.write('</div>')


def _parse_num(v):
    """Parse ints and human-formatted strings like '2.8K' or '1.2M'. Return int when possible, else 0."""
    if v is None:
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    s = str(v).strip()
    if s == '' or s.upper() == 'N/A' or s == '\u2014':
        return 0
    s2 = s.replace(',', '')
    m = re.match(r'^([0-9,.]+)\s*([kKmM]?)$', s2)
    if m:
        num = float(m.group(1))
        suf = m.group(2).upper()
        if suf == 'K':
            return int(num * 1000)
        if suf == 'M':
            return int(num * 1_000_000)
        return int(num)
    try:
        return int(float(s2))
    except Exception:
        return 0


def _normalize_instagram(insta: dict) -> dict:
    if not isinstance(insta, dict):
        return {}
    if 'instagram' in insta and isinstance(insta.get('instagram'), dict):
        insta = insta['instagram']
    out = dict(insta)
    for key, alias in [
        ('followers', 'follower_count'),
        ('total_followers', 'follower_count'),
        ('audience_size', 'follower_count'),
        ('follower_count', 'follower_count'),
        ('likes', 'like_count'),
        ('avg_likes', 'like_count'),
        ('total_reach', 'reach_count'),
        ('reach', 'reach_count'),
        ('total_impressions', 'impressions_count'),
        ('impressions', 'impressions_count'),
    ]:
        if key in insta and alias not in out:
            out[alias] = insta[key]
    total_keys = [
        'total_followers', 'follower_count', 'followers',
        'audience_size', 'audience_growth'
    ]
    has_total = any(k in insta for k in total_keys)
    if not has_total and 'instagram_summary' in insta:
        s = insta['instagram_summary']
        if isinstance(s, dict):
            for k, alias in [('followers', 'follower_count'), ('likes', 'like_count')]:
                if k in s and alias not in out:
                    out[alias] = s[k]
    # All numeric fields used by the streaming template — parse to int and default to 0
    counts = ['email_count', 'click_count', 'like_count', 'follower_count',
              'comments_count', 'shares_count', 'saves_count', 'profile_visits',
              'website_taps', 'reach_count', 'impressions_count']
    for ak in counts:
        out[ak] = _parse_num(out.get(ak, 0))
    return out


def generate_report_html_to_file(
    f,
    report_data:    dict,
    instagram_data: dict,
    synopsis:       str,
    seo_data:       dict = {},
    facebook_data:  dict = {},
    brand_color:    str  = '#c8922a',
    client_logo_url: str = ''
) -> None:
    """
    Streaming version: writes HTML directly to file handle `f` instead of building
    a massive string in memory. This dramatically reduces peak memory usage.
    """
    print("[STREAMING] generate_report_html_to_file called - v2")
    import time
    from datetime import datetime, timezone

    instagram = _normalize_instagram(instagram_data)

    month = str(report_data.get('month') or '').title()
    year  = str(report_data.get('year', ''))
    client_name = report_data.get('client_name', 'Client')

    CANIT_LOGO = _load_canit_logo()
    bg_hex = brand_color.lstrip('#') if isinstance(brand_color, str) else 'c8922a'
    initials = ''.join(w[0].upper() for w in client_name.split() if w)[:2] or 'CL'
    if client_logo_url:
        CLIENT_LOGO = client_logo_url
    else:
        CLIENT_LOGO = _svg_logo_data_uri(initials, bg_hex)

    css = f"""
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    @page {{ size: A4; margin: 0; }}
    :root {{
      --brand:       {BRAND_ACCENT};
      --navy:        {BRAND_PRIMARY};
      --accent-sec:  {BRAND_ACCENT_SEC};
      --text:        {TEXT_PRIMARY};
      --muted:       {TEXT_SECONDARY};
      --label:       {TEXT_LABEL};
      --card:        {BG_CARD};
      --bg:          {BG_PAGE};
      --border:      {BG_CARD_BORDER};
      --status-bg:   {STATUS_ACTIVE_BG};
      --status:      {STATUS_ACTIVE};
      --green:       {GREEN_POS};
      --blue-link:   {BLUE_LINK};
    }}
    body {{ background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text); font-size: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact; display: flex; flex-direction: column; align-items: center; }}
    .pdf-page {{ width: 210mm; min-height: 297mm; padding: 12mm 14mm 10mm; background: var(--bg); page-break-after: always; break-after: page; display: flex; flex-direction: column; }}
    .pdf-page > .page-topbar, .pdf-page > .page-footer, .pdf-page > .page-title {{ max-width: 180mm; width: 100%; margin-left: auto; margin-right: auto; }}
    .page-topbar {{ display: flex; justify-content: space-between; align-items: center; padding-bottom: 8px; border-bottom: 1px solid var(--border); margin-bottom: 14px; }}
    .topbar-left, .topbar-right {{ display: flex; align-items: center; gap: 8px; }}
    .topbar-logo {{ height: 24px; width: 24px; border-radius: 6px; object-fit: cover; }}
    .topbar-report-label {{ font-size: 8px; font-weight: 600; color: var(--label); letter-spacing: 0.10em; text-transform: uppercase; }}
    .topbar-brand {{ font-size: 10px; font-weight: 700; color: var(--navy); letter-spacing: 0.12em; text-transform: uppercase; }}
    .page-footer {{ display: flex; justify-content: space-between; margin-top: auto; padding-top: 8px; border-top: 1px solid var(--border); font-size: 8px; color: var(--label); text-transform: uppercase; letter-spacing: 0.12em; }}
    .page-title {{ font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 22px; color: var(--text); line-height: 1.1; margin-bottom: 8px; }}
    .section-title {{ font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px; color: var(--navy); margin-bottom: 8px; }}
    .metrics-row {{ display: grid; grid-template-columns: repeat(4,1fr); gap: 10px; margin-bottom: 14px; }}
    .metric-card {{ background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center; }}
    .metric-val {{ font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 20px; color: var(--navy); }}
    .metric-lbl {{ font-size: 7px; font-weight: 600; color: var(--label); text-transform: uppercase; letter-spacing: 0.10em; margin-top: 4px; }}
    .overview-text {{ font-size: 10px; color: var(--muted); line-height: 1.6; margin-bottom: 14px; }}
    .metric-block {{ margin-bottom: 12px; }}
    .metric-block-title {{ font-weight: 700; font-size: 10px; color: var(--text); }}
    .metric-block-desc {{ font-size: 9px; color: var(--muted); }}
    .synopsis-block {{ background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 14px; font-size: 10px; line-height: 1.7; color: var(--muted); }}
    .post-card {{ display: flex; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); }}
    .post-rank {{ font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 14px; color: var(--brand); min-width: 24px; }}
    .post-info {{ flex: 1; }}
    .post-caption {{ font-size: 9px; color: var(--muted); margin-bottom: 4px; }}
    .post-stats {{ display: flex; gap: 12px; font-size: 8px; color: var(--label); }}
    .seo-item {{ display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid var(--border); font-size: 9px; }}
    .seo-keyword {{ font-weight: 600; color: var(--text); }}
    .seo-data {{ color: var(--muted); }}
    .rec-card {{ display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid var(--border); }}
    .rec-number {{ font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 16px; color: var(--brand); min-width: 28px; }}
    .rec-text {{ font-size: 10px; color: var(--muted); line-height: 1.5; }}
    .cover-section {{ display: flex; gap: 20px; align-items: flex-start; }}
    .cover-left {{ flex: 1; }}
    .cover-right {{ text-align: center; min-width: 120px; }}
    .cover-badge {{ display: inline-block; padding: 5px 12px; border-radius: 20px; border: 1px solid var(--border); color: var(--muted); font-size: 8px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }}
    .cover-title {{ font-family: 'Poppins', sans-serif; font-weight: 900; font-size: 28px; color: var(--text); line-height: 1.05; margin-bottom: 8px; }}
    .cover-subtitle {{ font-size: 10px; color: var(--muted); line-height: 1.5; margin-bottom: 14px; }}
    .cover-desc {{ font-size: 9px; color: var(--label); line-height: 1.5; margin-bottom: 14px; }}
    .cover-stats {{ display: flex; gap: 14px; }}
    .cover-stat {{ }}
    .cover-stat-val {{ font-family: 'Poppins', sans-serif; font-weight: 800; font-size: 22px; color: var(--brand); }}
    .cover-stat-lbl {{ font-size: 7px; font-weight: 600; color: var(--label); text-transform: uppercase; letter-spacing: 0.10em; }}
    .recommendations {{ font-size: 10px; color: var(--muted); line-height: 1.5; margin-bottom: 14px; }}
    """

    _write_html_head(f, client_name, month, year, css)

    # --- Cover page ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    f.write(f'''
    <div class="cover-section">
      <div class="cover-left">
        <div class="cover-badge">MONTHLY PERFORMANCE REPORT</div>
        <h1 class="cover-title">{client_name}</h1>
        <p class="cover-subtitle">{month} {year} | Brand Intelligence &amp; AI Insights</p>
        <p class="cover-desc">
          Your comprehensive monthly overview of Instagram performance, Facebook engagement,
          search visibility, and AI-powered brand sentiment analysis.
        </p>
        <div class="cover-stats">
          <div class="cover-stat">
            <span class="cover-stat-val">{instagram.get('follower_count', '...')}</span>
            <span class="cover-stat-lbl">FOLLOWERS</span>
          </div>
          <div class="cover-stat">
            <span class="cover-stat-val">{instagram.get('like_count', '...')}</span>
            <span class="cover-stat-lbl">AVG. LIKES</span>
          </div>
        </div>
      </div>
      <div class="cover-right">
        <div class="cover-hero-svg">{CANIT_LOGO}</div>
      </div>
    </div>''')
    _write_page_footer(f, 1)
    _write_page_end(f)

    # --- Overview page ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    overviews = report_data.get('overviews', []) or []
    metrics   = report_data.get('metrics', []) or []
    raw_fb = facebook_data
    if isinstance(raw_fb, dict) and 'summary' in raw_fb:
        fb = raw_fb['summary']
    else:
        fb = raw_fb or {}
    f.write(f'''
    <h1 class="page-title" style="margin-bottom:24px;">Performance &amp; Audience Overview</h1>
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('follower_count', 0)):,}</div>
        <div class="metric-lbl">Instagram Followers</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('like_count', 0)):,}</div>
        <div class="metric-lbl">Avg. Likes / Post</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('email_count', 0)):,}</div>
        <div class="metric-lbl">Emails Collected</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('click_count', 0)):,}</div>
        <div class="metric-lbl">Total Clicks</div>
      </div>
    </div>''')
    if overviews:
        for ov in overviews:
            ov_text = ov.get('overview_text', '') or ''
            if ov_text:
                f.write(f'<p class="overview-text">{ov_text}</p>')
    if metrics:
        for m in metrics:
            f.write(f'''
    <div class="metric-block">
      <div class="metric-block-title">{m.get('metric_name', '')}</div>
      <div class="metric-block-desc">{m.get('metric_value', '')}</div>
    </div>''')
    _write_page_footer(f, 2)
    _write_page_end(f)

    # --- Synopsis / AI Summary page ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    f.write(f'''
    <h1 class="page-title">AI Brand Intelligence Summary</h1>
    <div class="synopsis-block">
      {synopsis}
    </div>''')
    _write_page_footer(f, 3)
    _write_page_end(f)

    # --- Instagram detailed analytics ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    f.write(f'''
    <h1 class="page-title">Instagram Detailed Analytics</h1>
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('impressions_count', 0)):,}</div>
        <div class="metric-lbl">Impressions</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('reach_count', 0)):,}</div>
        <div class="metric-lbl">Reach</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('profile_visits', 0)):,}</div>
        <div class="metric-lbl">Profile Visits</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{_parse_num(instagram.get('website_taps', 0)):,}</div>
        <div class="metric-lbl">Website Taps</div>
      </div>
    </div>''')
    posts = instagram_data.get('posts', []) or []
    if posts:
        f.write('<h2 class="section-title">Top Posts</h2>')
        for i, post in enumerate(posts[:6]):
            likes  = _parse_num(post.get('like_count', 0))
            comments = _parse_num(post.get('comments_count', 0))
            caption = (post.get('caption', '') or '')[:120]
            media = post.get('media_url', '')
            f.write(f'''
    <div class="post-card">
      <div class="post-rank">#{i+1}</div>
      <div class="post-info">
        <div class="post-caption">{caption}</div>
        <div class="post-stats">
          <span>&#10084; {likes:,}</span>
          <span>&#9993; {comments}</span>
        </div>
      </div>
    </div>''')
    _write_page_footer(f, 4)
    _write_page_end(f)

    # --- Facebook analytics ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    fb_likes    = _parse_num(fb.get('likes') or fb.get('followers') or 0)
    fb_follows  = _parse_num(fb.get('followers') or 0)
    fb_engaged  = _parse_num(fb.get('engaged_users') or 0)
    fb_impressions = _parse_num(fb.get('impressions') or fb.get('total_impressions') or 0)
    f.write(f'''
    <h1 class="page-title">Facebook Analytics</h1>
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-val">{fb_likes:,}</div>
        <div class="metric-lbl">Page Likes</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{fb_follows:,}</div>
        <div class="metric-lbl">Followers</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{fb_engaged:,}</div>
        <div class="metric-lbl">Engaged Users</div>
      </div>
      <div class="metric-card">
        <div class="metric-val">{fb_impressions:,}</div>
        <div class="metric-lbl">Impressions</div>
      </div>
    </div>''')
    fb_posts = facebook_data.get('posts', []) or []
    if fb_posts:
        f.write('<h2 class="section-title">Top Facebook Posts</h2>')
        for i, post in enumerate(fb_posts[:6]):
            likes = _parse_num(post.get('like_count', 0) or post.get('reactions', {}).get('like', 0))
            comments = _parse_num(post.get('comments_count', 0) or post.get('comments', 0))
            shares = _parse_num(post.get('shares_count', 0))
            msg = (post.get('message', '') or post.get('caption', '') or '')[:120]
            f.write(f'''
    <div class="post-card">
      <div class="post-rank">#{i+1}</div>
      <div class="post-info">
        <div class="post-caption">{msg}</div>
        <div class="post-stats">
          <span>&#10084; {likes:,}</span>
          <span>&#9993; {comments}</span>
          <span>&#128257; {shares}</span>
        </div>
      </div>
    </div>''')
    _write_page_footer(f, 5)
    _write_page_end(f)

    # --- SEO Analytics ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    f.write('<h1 class="page-title">SEO &amp; Search Visibility</h1>')
    seo_metrics = seo_data.get('metrics', []) or []
    if seo_metrics:
        f.write('<div class="metrics-row">')
        for sm in seo_metrics[:4]:
            val  = sm.get('value', '')
            name = sm.get('name', '')
            f.write(f'''
      <div class="metric-card">
        <div class="metric-val">{val}</div>
        <div class="metric-lbl">{name}</div>
      </div>''')
        f.write('</div>')
    seo_items = seo_data.get('items', []) or seo_data.get('results', []) or []
    if seo_items:
        f.write('<h2 class="section-title">Top Keywords</h2>')
        for item in seo_items[:8]:
            kw   = item.get('keyword', item.get('query', ''))
            pos  = item.get('position', item.get('rank', ''))
            vol  = item.get('volume', item.get('search_volume', ''))
            f.write(f'''
    <div class="seo-item">
      <span class="seo-keyword">{kw}</span>
      <span class="seo-data">Pos: {pos} | Vol: {vol}</span>
    </div>''')
    _write_page_footer(f, 6)
    _write_page_end(f)

    # --- Recommendations & Close ---
    _write_page_start(f)
    _write_page_header(f, CLIENT_LOGO, CANIT_LOGO, month, year)
    f.write(f'''
    <h1 class="page-title">Strategic Recommendations</h1>
    <div class="recommendations">
      <p>Based on the analysis of your {month} {year} performance data, we recommend the following strategic actions:</p>
    </div>''')
    recommendations = report_data.get('recommendations', []) or []
    if not recommendations:
        recommendations = [
            'Increase posting frequency to maintain audience engagement.',
            'Leverage top-performing content formats for future posts.',
            'Engage with your audience through Stories and Reels.',
        ]
    for i, rec in enumerate(recommendations):
        rec_text = rec if isinstance(rec, str) else rec.get('recommendation', rec.get('text', ''))
        f.write(f'''
    <div class="rec-card">
      <span class="rec-number">{i+1}</span>
      <span class="rec-text">{rec_text}</span>
    </div>''')
    _write_page_footer(f, 7)
    _write_page_end(f)

    f.write('</body></html>')


