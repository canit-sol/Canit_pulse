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


def fetch_seo_data(archived_blob: dict = None) -> dict:
    """
    Get SEO data. Currently only from archive since no live website scraping exists.
    Returns SEO data dict.
    """
    if archived_blob:
        seo_data = archived_blob.get("seo_data", {})
        if seo_data:
            logger.info(f"fetch_seo_data: Using archived SEO data (website_visits={seo_data.get('website_visits', 'N/A')})")
            return seo_data
    logger.info("fetch_seo_data: No SEO data available (no live scraping implemented)")
    return {}


def fetch_all_report_data(
    client_id: str,
    month: str,
    year: str,
    archived_blob: dict = None,
    client_keys: dict = None
) -> Tuple[dict, dict, dict, bool, bool, bool]:
    """
    Fetch all data sources with live-first, archive-fallback strategy.

    Returns:
        Tuple of (
            instagram_data,
            facebook_data,
            seo_data,
            instagram_is_live,
            facebook_is_live,
            seo_is_live (always False - no live scraping implemented)
        )
    """
    logger.info(f"fetch_all_report_data: Starting for client {client_id} month={month} year={year}")

    # Instagram
    ig_data, ig_is_live = {}, False
    try:
        get_client_stats = _get_instagram_module()

        if client_keys and client_keys.get('ig_access_token') and client_keys.get('ig_account_id'):
            try:
                logger.info(f"fetch_all_report_data: Fetching live Instagram data")
                ig_data = get_client_stats(client_keys, month, year)
                if ig_data and ig_data.get("posts"):
                    ig_is_live = True
                    logger.info(f"fetch_all_report_data: Instagram live fetch successful, {len(ig_data.get('posts', []))} posts")
                else:
                    logger.warning(f"fetch_all_report_data: Instagram live fetch returned no posts")
            except Exception as e:
                logger.error(f"fetch_all_report_data: Instagram live fetch failed: {e}")
        else:
            logger.warning(f"fetch_all_report_data: No Instagram credentials available")
    except Exception as e:
        logger.error(f"fetch_all_report_data: Instagram module error: {e}")

    # Fall back to archived Instagram data
    if not ig_is_live and archived_blob:
        ig_data, arch_month, arch_year = _use_archived_data(archived_blob, month, year)
        logger.warning(f"fetch_all_report_data: INSTAGRAM - LIVE DATA FAILED - Using archived from {arch_month} {arch_year}")
        ig_is_live = False

    # Facebook
    fb_data, fb_is_live = fetch_facebook_data(client_keys, archived_blob)
    if not fb_is_live and archived_blob:
        logger.warning(f"fetch_all_report_data: FACEBOOK - LIVE DATA FAILED - Using archived data")

    # SEO (no live scraping implemented - always from archive)
    seo_data = fetch_seo_data(archived_blob)
    seo_is_live = False

    logger.info(f"fetch_all_report_data: Complete - IG_live={ig_is_live}, FB_live={fb_is_live}, SEO_live={seo_is_live}")
    return ig_data, fb_data, seo_data, ig_is_live, fb_is_live, seo_is_live


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


def generate_pdf_html_to_file(
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
    print("[STREAMING] generate_pdf_html_to_file called - v2")
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


def generate_pdf_html(
    report_data:    dict,
    instagram_data: dict,
    synopsis:       str,
    seo_data:       dict = {},
    facebook_data:  dict = {},
    brand_color:    str  = '#c8922a',
    client_logo_url: str = ''
) -> str:

    # Normalize instagram blobs: archived snapshots may store totals under
    # nested keys (organic/paid) or use different field names. Normalize to a
    # predictable flat shape so the rest of the template can assume keys.
    def _parse_num(v):
        """Parse ints and human-formatted strings like '2.8K' or '1.2M'. Return int when possible, else 0."""
        if v is None:
            return 0
        if isinstance(v, (int, float)):
            return int(v)
        s = str(v).strip()
        if s == '' or s.upper() == 'N/A' or s == 'ΓÇö':
            return 0
        # remove commas
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
        # If the snapshot is wrapped under an 'instagram' key, unwrap it.
        if 'instagram' in insta and isinstance(insta.get('instagram'), dict):
            insta = insta.get('instagram')

        out = dict(insta)  # shallow copy

        # posts list
        out['posts'] = insta.get('posts') or insta.get('posts_list') or insta.get('media') or []

        # Totals: prefer top-level totals, otherwise try organic+paid breakdown
        total_imp = None
        total_reach = None
        total_likes = None
        total_saves = None
        total_comments = None

        # direct keys
        if insta.get('total_impressions') is not None:
            total_imp = insta.get('total_impressions')
        elif insta.get('impressions') is not None:
            total_imp = insta.get('impressions')

        if insta.get('total_reach') is not None:
            total_reach = insta.get('total_reach')
        elif insta.get('reach') is not None:
            total_reach = insta.get('reach')

        if insta.get('total_likes') is not None:
            total_likes = insta.get('total_likes')
        elif insta.get('likes') is not None and isinstance(insta.get('likes'), (int, float)):
            total_likes = insta.get('likes')

        if insta.get('total_saves') is not None:
            total_saves = insta.get('total_saves')
        elif insta.get('saves') is not None and isinstance(insta.get('saves'), (int, float)):
            total_saves = insta.get('saves')

        if insta.get('total_comments') is not None:
            total_comments = insta.get('total_comments')
        elif insta.get('comments') is not None and isinstance(insta.get('comments'), (int, float)):
            total_comments = insta.get('comments')

        # organic/paid breakdown
        organic = insta.get('organic') or insta.get('org') or {}
        paid = insta.get('paid') or {}
        try:
            if total_imp is None:
                oi = organic.get('total_impressions') or organic.get('impressions')
                pi = paid.get('total_impressions') or paid.get('impressions')
                total_imp = oi if oi is not None else 0
                if pi is not None:
                    total_imp = (_parse_num(total_imp) + _parse_num(pi))
            if total_reach is None:
                orch = organic.get('total_reach') or organic.get('reach')
                pr = paid.get('total_reach') or paid.get('reach')
                total_reach = orch if orch is not None else 0
                if pr is not None:
                    total_reach = (_parse_num(total_reach) + _parse_num(pr))
            if total_likes is None:
                ol = organic.get('total_likes') or organic.get('likes')
                pl = paid.get('total_likes') or paid.get('likes')
                total_likes = ol if ol is not None else 0
                if pl is not None:
                    total_likes = (_parse_num(total_likes) + _parse_num(pl))
            if total_saves is None:
                osv = organic.get('total_saves') or organic.get('saves')
                psv = paid.get('total_saves') or paid.get('saves')
                total_saves = osv if osv is not None else 0
                if psv is not None:
                    total_saves = (_parse_num(total_saves) + _parse_num(psv))
            if total_comments is None:
                oc = organic.get('total_comments') or organic.get('comments')
                pc = paid.get('total_comments') or paid.get('comments')
                total_comments = oc if oc is not None else 0
                if pc is not None:
                    total_comments = (_parse_num(total_comments) + _parse_num(pc))
        except Exception:
            pass

        # If any totals are numeric strings, parse them to ints for arithmetic
        ti = _parse_num(total_imp) if total_imp is not None else 0
        tr = _parse_num(total_reach) if total_reach is not None else 0
        tl = _parse_num(total_likes) if total_likes is not None else 0
        ts = _parse_num(total_saves) if total_saves is not None else 0
        tc = _parse_num(total_comments) if total_comments is not None else 0

        # put back into out in best-effort typed form (ints when possible)
        out['total_impressions'] = ti if ti else (str(total_imp) if total_imp not in (None, '') else 'N/A')
        out['total_reach'] = tr if tr else (str(total_reach) if total_reach not in (None, '') else 'N/A')
        out['total_likes'] = tl if tl else (str(total_likes) if total_likes not in (None, '') else 'N/A')
        out['total_saves'] = ts if ts else (str(total_saves) if total_saves not in (None, '') else 'N/A')
        out['total_comments'] = tc if tc else (str(total_comments) if total_comments not in (None, '') else 'N/A')

        # followers (normalize to integer when possible)
        raw_followers = None
        if insta.get('followers') is not None:
            raw_followers = insta.get('followers')
        elif insta.get('follower_count') is not None:
            raw_followers = insta.get('follower_count')
        elif insta.get('followers_count') is not None:
            raw_followers = insta.get('followers_count')
        else:
            raw_followers = 'N/A'
        # parse into integer (0 when not parseable)
        fl = _parse_num(raw_followers)
        out['followers'] = fl if fl else 'N/A'

        # engagement rate: prefer explicit string, otherwise compute
        # Use per-follower engagement by default; fall back to impressions when
        # followers are not available. This matches choice 1 (engagement per follower).
        if insta.get('engagement_rate'):
            out['engagement_rate'] = insta.get('engagement_rate')
        else:
            total_interactions = tl + tc + ts
            if fl > 0:
                out['engagement_rate'] = f"{round(total_interactions / fl * 100, 2)}%"
            elif ti > 0:
                out['engagement_rate'] = f"{round(total_interactions / ti * 100, 2)}%"
            else:
                out['engagement_rate'] = 'N/A'

        # top_post normalization: ensure numeric impressions/likes/saves/comments where possible
        tp = insta.get('top_post') or {}
        if isinstance(tp, dict):
            tp_out = dict(tp)
            tp_out['impressions'] = _parse_num(tp.get('impressions') or tp.get('impr') or tp.get('reach'))
            tp_out['likes'] = _parse_num(tp.get('likes'))
            tp_out['saves'] = _parse_num(tp.get('saves'))
            tp_out['comments'] = _parse_num(tp.get('comments'))
            out['top_post'] = tp_out
        else:
            out['top_post'] = tp

        # type_counts and weekly_posts fallback
        out['type_counts'] = insta.get('type_counts') or insta.get('format_counts') or {}
        out['weekly_posts'] = insta.get('weekly_posts') or insta.get('weekly_counts') or []

        return out

    # normalize the incoming instagram data so template code is simpler
    instagram_data = _normalize_instagram(instagram_data)

    # ΓöÇΓöÇ Data extraction (unchanged routes) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    client_name  = report_data.get('client_name', 'Client')
    month        = report_data.get('month', '')
    year         = report_data.get('year', '')
    logger.info('Generating PDF HTML for client %s, month %s %s', client_name, month, year)

    handle        = instagram_data.get('instagram_handle', '')
    # Prefer explicit 'N/A' for missing scalar metrics; lists/dicts remain empty by default
    total_posts   = instagram_data.get('total_posts', 'N/A')
    active_days   = instagram_data.get('active_days', [])
    total_reach   = instagram_data.get('total_reach', 'N/A')
    eng_rate      = instagram_data.get('engagement_rate', 'N/A')
    weekly_posts  = instagram_data.get('weekly_posts', [])
    content_types = instagram_data.get('content_types', [])
    top_post      = instagram_data.get('top_post', {})
    posts         = instagram_data.get('posts', [])
    type_counts   = instagram_data.get('type_counts', {})
    followers     = instagram_data.get('followers', 'N/A')
    # Some data providers use 'total_impressions' while others use 'impressions'
    ig_impressions = instagram_data.get('impressions') or instagram_data.get('total_impressions') or 'N/A'
    # Total interactions: try explicit field, otherwise sum likes+comments+saves when available
    ig_likes_raw    = instagram_data.get('total_likes') if instagram_data.get('total_likes') is not None else instagram_data.get('likes')
    ig_comments_raw = instagram_data.get('total_comments') if instagram_data.get('total_comments') is not None else instagram_data.get('comments')
    ig_saves_raw    = instagram_data.get('total_saves') if instagram_data.get('total_saves') is not None else instagram_data.get('saves')
    try:
        if instagram_data.get('total_engagement') is not None:
            ig_total_eng = instagram_data.get('total_engagement')
        else:
            # if the raw parts are numeric, sum them
            parts = [v for v in (ig_likes_raw, ig_comments_raw, ig_saves_raw) if isinstance(v, (int, float))]
            ig_total_eng = sum(parts) if parts else 'N/A'
    except Exception:
        ig_total_eng = 'N/A'

    ig_likes    = ig_likes_raw if ig_likes_raw is not None else 'N/A'
    ig_comments = ig_comments_raw if ig_comments_raw is not None else 'N/A'
    ig_saves    = ig_saves_raw if ig_saves_raw is not None else 'N/A'

    # Treat channel metrics as unavailable (N/A) only when we don't have
    # a successful snapshot AND there are no posts. This allows real fetched
    # data (which may omit a 'status' field) to be shown.
    insta_status = str(instagram_data.get('status', '')).lower()
    insta_has_posts = bool(instagram_data.get('posts'))
    if insta_status != 'success' and not insta_has_posts:
        total_posts = 'N/A'
        active_days = []
        total_reach = 'N/A'
        eng_rate = 'N/A'
        weekly_posts = []
        content_types = []
        top_post = {}
        posts = []
        type_counts = {}
        followers = 'N/A'
        ig_impressions = 'N/A'
        ig_total_eng = 'N/A'
        ig_likes = 'N/A'
        ig_comments = 'N/A'
        ig_saves = 'N/A'

    blog_posts_list      = seo_data.get('blog_posts_list', [])  # list of {title, excerpt, date}

    fb_page_likes  = facebook_data.get('page_likes', 'N/A')
    fb_page_reach  = facebook_data.get('page_reach', 0)
    fb_engagement  = facebook_data.get('engagement_rate', '0%')
    fb_posts       = facebook_data.get('posts', 0)
    fb_impressions = facebook_data.get('impressions', 0)
    fb_reactions   = facebook_data.get('reactions', 0)
    fb_comments    = facebook_data.get('comments', 0)
    fb_shares      = facebook_data.get('shares', 0)
    fb_total_interactions = (fb_reactions or 0) + (fb_comments or 0) + (fb_shares or 0)
    fb_followers   = facebook_data.get('followers', 0)
    fb_type_counts = facebook_data.get('type_counts', {'Photos': 0, 'Video / Reels': 0, 'Link Shares': 0})

    # AI Brand Intelligence fields (optional) ΓÇö default to None so UI shows N/A
    brand_health_index   = report_data.get('brand_health_index')
    audience_growth      = report_data.get('audience_growth')
    reach_acceleration   = report_data.get('reach_acceleration')
    engagement_energy_lbl= report_data.get('engagement_energy_label')
    market_percentile    = report_data.get('market_percentile')
    interaction_energy   = report_data.get('interaction_energy')
    consistency_index    = report_data.get('consistency_index')
    reach_efficiency     = report_data.get('reach_efficiency')
    virality_factor      = report_data.get('virality_factor')
    ai_perf_obs          = report_data.get('ai_perf_observation', '')
    ai_format_obs        = report_data.get('ai_format_observation', '')
    ai_cadence_obs       = report_data.get('ai_cadence_observation', '')
    strategic_forecast   = report_data.get('strategic_forecast', '')
    # Extract text from recommendations/action_steps (handle dict format)
    raw_recommendations = report_data.get('recommendations', [])
    raw_action_steps = report_data.get('action_steps', [])
    
    def _extract_text(item):
        if isinstance(item, dict):
            return item.get('text', '')
        return str(item)
    
    recommendations = [_extract_text(r) for r in raw_recommendations if _extract_text(r)]
    action_steps = [_extract_text(a) for a in raw_action_steps if _extract_text(a)]
    next_reach_proj      = report_data.get('next_reach_proj', '+12.4% Projected')
    next_eng_proj        = report_data.get('next_engagement_proj', '+8.5% Projected')
    next_conv_proj       = report_data.get('next_conversion_proj', '+15.0% Projected')

    # ΓöÇΓöÇ Logos ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    bg_hex      = brand_color.lstrip('#') if isinstance(brand_color, str) else 'c8922a'
    CANIT_LOGO  = _load_canit_logo()
    initials = ''.join(w[0].upper() for w in client_name.split() if w)[:2] or 'CL'
    if client_logo_url:
        CLIENT_LOGO = client_logo_url
    else:
        CLIENT_LOGO = _svg_logo_data_uri(initials, bg_hex)

    # ΓöÇΓöÇ SVG assets ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    weekly_svg      = svg_bar_chart(weekly_posts) if weekly_posts else None
    ai_cloud_svg    = svg_word_cloud(synopsis)
    # SVG assets ΓÇö create only when numeric values exist; otherwise use empty-state svgs
    try:
        donut_svg = svg_donut_gauge(float(brand_health_index)) if (brand_health_index is not None and str(brand_health_index) != '') else None
    except Exception:
        donut_svg = None
    stacked_svg     = svg_stacked_bar(type_counts) if type_counts else None
    # progress bars use numeric pct if available, otherwise 0 (visual empty bar)
    def _safe_pct(v):
        try:
            return float(v)
        except Exception:
            return 0.0

    pb_ie = svg_progress_bar(_safe_pct(interaction_energy), color=BRAND_PRIMARY)
    pb_ci = svg_progress_bar(_safe_pct(consistency_index), color=BRAND_PRIMARY)
    pb_re = svg_progress_bar(_safe_pct(reach_efficiency), color=BRAND_PRIMARY)
    pb_vf = svg_progress_bar(_safe_pct(virality_factor), color=BRAND_PRIMARY)

    # ΓöÇΓöÇ Content format breakdown rows (Instagram) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    type_label_map = {'IMAGE': 'Photos', 'VIDEO': 'Reels / Video', 'CAROUSEL_ALBUM': 'Carousels'}
    total_tc = sum(type_counts.values()) or 1
    format_rows_html = ''
    for t, cnt in type_counts.items():
        lbl  = type_label_map.get(t, t)
        pct  = cnt / total_tc * 100
        pbar = svg_progress_bar(pct, width=260)
        format_rows_html += f'''
        <div class="fmt-row">
          <div class="fmt-label">{lbl}</div>
          <img src="{pbar}" class="fmt-bar" alt="">
          <div class="fmt-pct">{cnt} posts ({pct:.0f}%)</div>
        </div>'''

    # ΓöÇΓöÇ Facebook format breakdown rows ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    fb_total_tc = sum(fb_type_counts.values()) or 1
    fb_format_rows_html = ''
    for lbl, cnt in fb_type_counts.items():
        pct  = cnt / fb_total_tc * 100
        pbar = svg_progress_bar(pct, width=260)
        fb_format_rows_html += f'''
        <div class="fmt-row">
          <div class="fmt-label">{lbl}</div>
          <img src="{pbar}" class="fmt-bar" alt="">
          <div class="fmt-pct">{cnt} posts ({pct:.0f}%)</div>
        </div>'''

    # ── Top performing post (use stored base64 only; no live fetch) ─────────────────
    tp_img     = top_post.get('media_url', '')
    tp_media_type = top_post.get('media_type', 'IMAGE')
    tp_permalink = top_post.get('permalink', '#')
    tp_caption = top_post.get('caption', 'Best performing post this month')[:120]
    tp_likes   = top_post.get('likes', 0)
    tp_comments= top_post.get('comments', 0)
    tp_saves   = top_post.get('saves', 0)
    
    tp_img_b64 = top_post.get('media_base64', '') or ''
    if not tp_img_b64:
        tp_img_b64 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23f0f0f0' width='200' height='200'/%3E%3Ctext x='100' y='100' text-anchor='middle' fill='%23999' font-size='14'%3ETop Post%3C/text%3E%3C/svg%3E"
    
    # No posts grid - only show top performing post
    posts_grid = ''

    # ΓöÇΓöÇ Calendar cells ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    cal_cells = ''.join(
        f'<div class="cal-day cal-{"active" if d in active_days else "inactive"}">{d}</div>'
        for d in range(1, 32)
    )

    # ΓöÇΓöÇ Blog article rows ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    blog_rows_html = ''
    for art in blog_posts_list[:5]:
        blog_rows_html += f'''
        <div class="blog-row">
          <div class="blog-left">
            <div class="blog-title">{art.get("title","")}</div>
            <div class="blog-excerpt">{art.get("excerpt","")[:120]}ΓÇª</div>
          </div>
          <div class="blog-date">{art.get("date","")}</div>
        </div>'''

    # ΓöÇΓöÇ Recommendations ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    reco_items_html = ''.join(
        f'<div class="reco-item">{i+1}. {r}</div>' for i, r in enumerate(recommendations)
    )
    action_items_html = ''.join(
        f'<div class="action-item"><span class="action-check">Γ£ô</span>{a}</div>' for a in action_steps
    )

    # ΓöÇΓöÇ Try/log ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
    try:
        logger.info(
            'generate_pdf_html: client=%s month=%s year=%s total_posts=%s posts_len=%s followers=%s',
            client_name, month, year, total_posts, len(posts), followers
        )
    except Exception:
        logger.info('generate_pdf_html: called (failed to summarise data)')

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # CSS
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
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

    body {{
      background: var(--bg);
      font-family: 'DM Sans', sans-serif;
      color: var(--text);
      font-size: 10px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      display: flex;
      flex-direction: column;
      align-items: center;
    }}

    /* ΓöÇΓöÇ Page wrapper ΓöÇΓöÇ */
    .pdf-page {{
      width: 210mm;
      min-height: 297mm;
      padding: 12mm 14mm 10mm;
      background: var(--bg);
      page-break-after: always;
      break-after: page;
      display: flex;
      flex-direction: column;
    }}
    .pdf-page > .card,
    .pdf-page > .kpi-card,
    .pdf-page > .two-col,
    .pdf-page > .two-col-40-60,
    .pdf-page > .stat-banner,
    .pdf-page > .bench-table,
    .pdf-page > .cover-page,
    .pdf-page > .forecast-banner,
    .pdf-page > .posts-grid,
    .pdf-page > .page-topbar,
    .pdf-page > .page-footer,
    .pdf-page > .section-label,
    .pdf-page > .page-title,
    .pdf-page > .page-subtitle {{
      max-width: 180mm;
      width: 100%;
      margin-left: auto;
      margin-right: auto;
    }}

    /* ΓöÇΓöÇ Top bar ΓöÇΓöÇ */
    .page-topbar {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
      margin-bottom: 14px;
    }}
    .topbar-left, .topbar-right {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .topbar-logo {{
      height: 24px;
      width: 24px;
      border-radius: 6px;
      object-fit: cover;
    }}
    .topbar-report-label {{
      font-size: 8px;
      font-weight: 600;
      color: var(--label);
      letter-spacing: 0.10em;
      text-transform: uppercase;
    }}
    .topbar-brand {{
      font-size: 10px;
      font-weight: 700;
      color: var(--navy);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }}

    /* ΓöÇΓöÇ Page footer ΓöÇΓöÇ */
    .page-footer {{
      display: flex;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 8px;
      border-top: 1px solid var(--border);
      font-size: 8px;
      color: var(--label);
      text-transform: uppercase;
      letter-spacing: 0.12em;
    }}

    /* ΓöÇΓöÇ Section label ΓöÇΓöÇ */
    .section-label {{
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 9px;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.12em;
      margin-bottom: 6px;
    }}
    .sl-icon {{ font-size: 12px; }}

    /* ΓöÇΓöÇ Page title ΓöÇΓöÇ */
    .page-title {{
      font-family: 'Poppins', sans-serif;
      font-weight: 900;
      font-size: 24px;
      color: var(--text);
      line-height: 1.1;
      margin-bottom: 4px;
    }}
    .page-subtitle {{
      font-size: 9px;
      color: var(--muted);
      line-height: 1.5;
      max-width: 520px;
      margin-bottom: 14px;
    }}

    /* ΓöÇΓöÇ KPI card (Instagram / Facebook) ΓöÇΓöÇ */
    .kpi-card {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      flex: 1;
    }}
    .kc-header {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }}
    .kc-icon {{ font-size: 14px; color: var(--navy); }}
    .kc-platform {{
      font-size: 10px;
      font-weight: 700;
      color: var(--navy);
      letter-spacing: 0.08em;
      flex: 1;
    }}
    .status-pill {{
      background: var(--status-bg);
      color: var(--status);
      font-size: 7px;
      font-weight: 700;
      letter-spacing: 0.10em;
      padding: 2px 8px;
      border-radius: 4px;
    }}
    .kc-metrics {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 10px;
    }}
    .kc-divider {{
      grid-column: 1 / -1;
      height: 1px;
      background: var(--border);
    }}
    .kc-mlabel {{
      font-size: 7px;
      font-weight: 500;
      color: var(--label);
      text-transform: uppercase;
      letter-spacing: 0.10em;
      margin-bottom: 4px;
    }}
    .kc-mvalue {{
      font-family: 'Poppins', sans-serif;
      font-weight: 800;
      font-size: 20px;
      line-height: 1;
    }}
    .kc-footer {{
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid var(--border);
      padding-top: 8px;
      font-size: 9px;
    }}
    .kc-footer-label {{ font-weight: 600; color: var(--text); }}
    .kc-footer-value {{ font-weight: 700; }}

    /* ΓöÇΓöÇ Cross-channel benchmark table ΓöÇΓöÇ */
    .bench-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
    }}
    .bench-table th {{
      font-size: 7px;
      font-weight: 600;
      color: var(--label);
      text-transform: uppercase;
      letter-spacing: 0.10em;
      text-align: left;
      padding: 6px 8px;
      border-bottom: 1px solid var(--border);
    }}
    .bench-table td {{
      padding: 8px;
      border-bottom: 1px solid var(--border);
      color: var(--muted);
    }}
    .bench-table td:first-child {{ font-weight: 600; color: var(--text); }}
    .bench-table td.primary-driver {{ color: var(--brand); font-weight: 700; }}

    /* ΓöÇΓöÇ Stat banner (multi-column strip) ΓöÇΓöÇ */
    .stat-banner {{
      display: flex;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 14px;
    }}
    .stat-pill {{
      flex: 1;
      padding: 12px 14px;
      border-right: 1px solid var(--border);
    }}
    .stat-pill:last-child {{ border-right: none; }}
    .sp-label {{
      font-size: 7px;
      font-weight: 500;
      color: var(--label);
      text-transform: uppercase;
      letter-spacing: 0.10em;
      margin-bottom: 4px;
    }}
    .sp-value {{
      font-family: 'Poppins', sans-serif;
      font-weight: 800;
      font-size: 18px;
    }}

    /* ΓöÇΓöÇ Two-col layout ΓöÇΓöÇ */
    .two-col {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 14px;
    }}
    .two-col-40-60 {{
      display: grid;
      grid-template-columns: 2fr 3fr;
      gap: 14px;
      margin-bottom: 14px;
    }}

    /* ΓöÇΓöÇ Generic card ΓöÇΓöÇ */
    .card {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
    }}
    .card-title {{
      font-size: 8px;
      font-weight: 700;
      color: var(--text);
      text-transform: uppercase;
      letter-spacing: 0.10em;
      margin-bottom: 10px;
    }}

    /* ΓöÇΓöÇ Format breakdown rows ΓöÇΓöÇ */
    .fmt-row {{
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }}
    .fmt-label {{ font-size: 9px; color: var(--text); width: 90px; flex-shrink: 0; }}
    .fmt-bar {{ flex: 1; height: 7px; display: block; }}
    .fmt-pct {{ font-size: 8px; color: var(--muted); width: 80px; text-align: right; flex-shrink: 0; }}

    /* ΓöÇΓöÇ Interaction split ΓöÇΓöÇ */
    .int-row {{
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px solid var(--border);
      font-size: 9px;
    }}
    .int-row:last-child {{ border-bottom: none; }}
    .int-icon {{ margin-right: 6px; }}
    .int-label {{ color: var(--muted); flex: 1; }}
    .int-value {{ font-weight: 700; }}
    .int-total-row {{
      display: flex;
      justify-content: space-between;
      padding-top: 8px;
      font-size: 10px;
      font-weight: 700;
      color: var(--text);
    }}
    .int-total-val {{ color: var(--navy); font-family:'Poppins',sans-serif; font-weight:800; }}

    /* ΓöÇΓöÇ Top post card ΓöÇΓöÇ */
    .top-post-card {{
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px 14px;
      margin-bottom: 14px;
    }}
    .tp-label {{
      font-size: 8px;
      font-weight: 700;
      color: var(--brand);
      text-transform: uppercase;
      letter-spacing: 0.10em;
      margin-bottom: 8px;
    }}
    .tp-inner {{
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }}
    .tp-thumb {{
      width: 96px;
      aspect-ratio: 3 / 4;
      border-radius: 6px;
      flex-shrink: 0;
      background: var(--border);
      overflow: hidden;
    }}
    .tp-thumb img {{
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }}
    .tp-caption {{ font-size: 9px; color: var(--muted); font-style: italic; line-height: 1.5; margin-bottom: 6px; }}
    .tp-stats {{ display: flex; gap: 14px; font-size: 8px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }}
    .tp-stat-icon {{ color: var(--brand); margin-right: 3px; }}

    /* ΓöÇΓöÇ Brand health vectors ΓöÇΓöÇ */
    .bv-row {{ margin-bottom: 10px; }}
    .bv-header {{ display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 4px; }}
    .bv-name {{ font-weight: 600; color: var(--text); }}
    .bv-pct {{ font-weight: 700; color: var(--navy); }}
    .bv-bar {{ width: 100%; }}

    /* ΓöÇΓöÇ AI diagnostic ΓöÇΓöÇ */
    .diag-row {{ padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 9px; line-height: 1.5; }}
    .diag-row:last-child {{ border-bottom: none; }}
    .diag-tag {{
      font-size: 7px; font-weight: 700; color: var(--brand);
      text-transform: uppercase; letter-spacing: 0.10em;
      display: block; margin-bottom: 3px;
    }}

    /* ΓöÇΓöÇ Forecast banner ΓöÇΓöÇ */
    .forecast-banner {{
      background: {FORECAST_BG};
      border: 1px solid {FORECAST_BORDER};
      border-radius: 8px;
      padding: 10px 14px;
      font-size: 9px;
      line-height: 1.5;
      margin-top: 14px;
    }}
    .forecast-label {{ font-weight: 700; color: var(--navy); margin-right: 4px; }}

    /* ΓöÇΓöÇ Blog articles ΓöÇΓöÇ */
    .blog-row {{
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }}
    .blog-row:last-child {{ border-bottom: none; }}
    .blog-left {{ flex: 1; }}
    .blog-title {{ font-size: 9px; font-weight: 700; color: var(--blue-link); text-decoration: underline; margin-bottom: 3px; }}
    .blog-excerpt {{ font-size: 8px; color: var(--label); font-style: italic; }}
    .blog-date {{
      font-size: 7px; font-weight: 700; color: #fff;
      background: var(--brand); padding: 3px 7px; border-radius: 4px;
      white-space: nowrap; flex-shrink: 0;
    }}

    /* ΓöÇΓöÇ Recommendations ΓöÇΓöÇ */
    .reco-item {{
      font-size: 9px; font-weight: 600; color: var(--text);
      font-style: italic; line-height: 1.6; margin-bottom: 4px;
    }}
    .action-item {{
      display: flex; gap: 8px; align-items: flex-start;
      font-size: 9px; font-weight: 700; color: var(--text); line-height: 1.5; margin-bottom: 6px;
    }}
    .action-check {{ color: var(--navy); font-size: 11px; flex-shrink: 0; }}

    /* ΓöÇΓöÇ Projected benchmarks ΓöÇΓöÇ */
    .proj-row {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 14px;
      margin-top: 8px;
    }}
    .proj-cell {{ }}
    .proj-col-label {{
      font-size: 7px; font-weight: 600; color: var(--label);
      text-transform: uppercase; letter-spacing: 0.10em; margin-bottom: 4px;
    }}
    .proj-value {{
      font-family: 'Poppins', sans-serif; font-weight: 800;
      font-size: 14px; color: var(--brand);
    }}

    /* ΓöÇΓöÇ Posts grid ΓöÇΓöÇ */
    .posts-grid {{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; justify-content: center; }}
    .post-thumb-link {{
      display: block; text-decoration: none; color: inherit;
    }}
    .post-thumb-link:hover .post-thumb {{ opacity: 0.9; }}
    .post-thumb {{
      position: relative; border-radius: 8px; overflow: hidden;
      aspect-ratio: 1; background: var(--border);
    }}
    .post-thumb img {{ width: 100%; height: 100%; object-fit: cover; display: block; }}
    .pt-overlay {{
      position: absolute; inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%);
      display: flex; flex-direction: column; justify-content: flex-end; padding: 8px;
    }}
    .pt-day {{ font-size: 9px; color: rgba(255,255,255,0.85); }}
    .pt-likes {{ font-size: 10px; color: #fff; font-weight: 700; }}
    .pt-badge {{ position: absolute; top: 8px; right: 8px; font-size: 12px; }}

    /* ΓöÇΓöÇ Calendar ΓöÇΓöÇ */
    .cal-title {{
      font-family: 'Poppins', sans-serif; font-weight: 700; font-size: 14px;
      color: var(--navy); margin-bottom: 2px;
    }}
    .cal-sub {{ font-size: 9px; color: var(--muted); margin-bottom: 8px; }}
    .cal-grid {{ display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }}
    .cal-day {{
      aspect-ratio: 1; border-radius: 5px;
      display: flex; align-items: center; justify-content: center;
      font-size: 9px; font-weight: 600; border: 1px solid var(--border);
    }}
    .cal-inactive {{ background: transparent; color: var(--muted); border: 1px dashed rgba(0,0,0,0.07); }}
    .cal-active {{ background: var(--brand); color: #fff; border-color: transparent; }}

    /* ΓöÇΓöÇ Signals grid ΓöÇΓöÇ */
    .signals-grid {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }}
    .signal-item {{ }}
    .signal-name {{ font-size: 8px; color: var(--muted); margin-bottom: 2px; }}
    .signal-value {{ font-size: 13px; font-weight: 800; color: var(--navy); }}

    /* ΓöÇΓöÇ Cover specific ΓöÇΓöÇ */
    .cover-badge {{
      display: inline-block;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid var(--border);
      color: var(--muted);
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }}
    .cover-h1 {{
      font-family: 'Poppins', sans-serif;
      font-weight: 900;
      font-size: 30px;
      color: var(--text);
      line-height: 1.05;
      margin-bottom: 10px;
    }}
    .cover-rule {{
      width: 40px; height: 3px;
      background: var(--brand);
      border-radius: 2px;
      margin: 10px 0;
    }}
    .cover-subtitle {{
      font-size: 10px;
      color: var(--muted);
      line-height: 1.6;
      max-width: 480px;
      margin-bottom: 20px;
    }}
    .cover-prepared-card {{
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 12px;
      max-width: 62%;
    }}
    .cover-prep-label {{
      font-size: 7px; color: var(--label); text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px;
    }}
    .cover-client {{
      font-family: 'Poppins', sans-serif;
      font-weight: 700; font-size: 18px; color: var(--text); margin-bottom: 4px;
    }}
    .cover-date {{ font-size: 9px; color: var(--muted); }}
    """

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # HTML head
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    head_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>{client_name} ┬╖ {month} {year}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>{css}</style>
</head>
<body>
"""

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 1 ΓÇö COVER
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    cover_page = f'''
    <div class="pdf-page">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0;padding-bottom:8px;border-bottom:1px solid {BG_CARD_BORDER};">
        <div style="display:flex;align-items:center;gap:8px;">
          <img src="{CLIENT_LOGO}" style="height:22px;width:22px;border-radius:5px;" alt="Client">
          <span style="font-size:9px;font-weight:600;color:{TEXT_PRIMARY};">{month.upper()} {year}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
          <img src="{CANIT_LOGO}" style="height:22px;width:22px;border-radius:5px;" alt="CP">
          <span style="font-size:10px;font-weight:700;color:{BRAND_PRIMARY};letter-spacing:0.12em;">CANIT PULSE</span>
        </div>
      </div>

      <div style="height:120px;"></div>

      <div class="cover-badge">MONTHLY DIGITAL PERFORMANCE</div>
      <h1 class="cover-h1">INTEGRATED ANALYTICS &amp;<br>BRAND INTELLIGENCE</h1>
      <div class="cover-rule"></div>
      <p class="cover-subtitle">A comprehensive performance audit across platform metrics, SEO indicators,
      published content calendar, and algorithmic brand health analysis.</p>

      <div class="cover-prepared-card">
        <div class="cover-prep-label">PREPARED FOR</div>
        <div class="cover-client">{client_name}</div>
        <div class="cover-date">≡ƒôà {month} {year}</div>
      </div>

      <div style="margin-top:auto;display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid {BG_CARD_BORDER};">
        <div style="font-size:8px;color:{BRAND_PRIMARY};font-weight:700;text-transform:uppercase;letter-spacing:0.10em;">POWERED BY<br>CANIT PULSE ANALYTICS PLATFORM</div>
        <div style="font-size:8px;color:{TEXT_LABEL};text-align:right;text-transform:uppercase;letter-spacing:0.10em;">CONFIDENTIAL REPORT<br>Internal Marketing Strategy Document</div>
      </div>
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 2 ΓÇö KPI SUMMARY OVERVIEW
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    ig_reach_str  = _fmt(total_reach)
    ig_imp_str    = _fmt(ig_impressions)
    ig_r_zero     = str(total_reach) in ('0', 'N/A', '0')
    ig_i_zero     = str(ig_impressions) == '0'

    fb_r_zero     = str(fb_page_reach) == '0'
    fb_f_zero     = str(fb_followers) in ('0', 'N/A')
    fb_p_zero     = str(fb_posts) == '0'

    ig_card_html  = _kpi_card_2x2(
        'Instagram', 'ΓÖí', True,
        ig_reach_str, ig_imp_str,
        str(eng_rate), str(_fmt(followers)),
        total_posts
    )
    fb_card_html  = _kpi_card_2x2(
        'Facebook', '≡ƒæÑ', True,
        str(fb_page_reach), str(fb_impressions),
        str(fb_engagement), str(fb_followers),
        fb_posts, followers_label='FOLLOWERS/FANS'
    )

    ig_total_eng_fmt = _fmt(ig_total_eng) if ig_total_eng else 'N/A'

    def _parse_pct(v):
        try:
            return float(str(v).replace('%', '').strip())
        except Exception:
            return 0.0

    def _parse_num_raw(v):
        try:
            s = str(v).replace(',', '').strip().upper()
            if s.endswith('K'):
                return float(s[:-1]) * 1_000
            if s.endswith('M'):
                return float(s[:-1]) * 1_000_000
            return float(s)
        except Exception:
            return 0.0

    ig_reach_val = _parse_num_raw(ig_reach_str)
    fb_reach_val = _parse_num_raw(fb_page_reach)
    primary_reach = 'Instagram' if ig_reach_val >= fb_reach_val else 'Facebook'

    ig_eng_val = _parse_pct(eng_rate)
    fb_eng_val = _parse_pct(fb_engagement)
    primary_engagement = 'Instagram' if ig_eng_val >= fb_eng_val else 'Facebook'

    ig_interactions_val = _parse_num_raw(ig_total_eng_fmt)
    fb_interactions_val = _parse_num_raw(fb_total_interactions)
    primary_interactions = 'Instagram' if ig_interactions_val >= fb_interactions_val else 'Facebook'

    kpi_page = f'''
    <div class="pdf-page">
      {_page_header(CLIENT_LOGO, CANIT_LOGO, month, year)}
      {_section_label('Γ£ª', 'HIGH-LEVEL METRICS')}
      {_page_title('KPI SUMMARY OVERVIEW',
                   'Comparative top-line channel analytics tracking audience reach, impressions, engagement, and follower accumulation.')}

      <div class="two-col" style="margin-bottom:14px;">
        {ig_card_html}
        {fb_card_html}
      </div>

      <div class="card">
        <div class="card-title">CROSS-CHANNEL METRICS BENCHMARK</div>
        <table class="bench-table">
          <thead>
            <tr>
              <th>PERFORMANCE AREA</th>
              <th>INSTAGRAM</th>
              <th>FACEBOOK</th>
              <th>PRIMARY DRIVER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Reach Distribution</td>
              <td>{ig_reach_str}</td>
              <td>{fb_page_reach}</td>
              <td class="primary-driver">{primary_reach}</td>
            </tr>
            <tr>
              <td>Engagement Efficiency</td>
              <td>{eng_rate}</td>
              <td>{fb_engagement}</td>
              <td class="primary-driver">{primary_engagement}</td>
            </tr>
            <tr>
              <td>Total Interactions</td>
              <td>{ig_total_eng_fmt}</td>
              <td>{fb_reactions}</td>
              <td class="primary-driver">{primary_interactions}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {_page_footer(2)}
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 3 ΓÇö AI BRAND INTELLIGENCE
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    top_format = max(type_counts.items(), key=lambda x: x[1])[0] if type_counts else 'N/A'
    ai_perf_text    = ai_perf_obs or generate_ai_engagement_insight(eng_rate, ig_total_eng, followers)
    ai_format_text  = ai_format_obs or generate_ai_format_insight(type_counts, top_format)
    ai_cadence_text = ai_cadence_obs or generate_ai_cadence_insight(total_posts, active_days)
    fc_text         = strategic_forecast or generate_strategic_forecast(report_data, instagram_data, facebook_data)

    ai_page = f'''
    <div class="pdf-page">
      {_page_header(CLIENT_LOGO, CANIT_LOGO, month, year)}
      {_section_label('≡ƒûÑ', 'AI ENGINE ANALYSIS')}
      {_page_title('AI BRAND INTELLIGENCE',
                   'Algorithmic evaluation of your digital footprint, industry competitiveness, sentiment signals, and projected growth trajectory.')}

      <!-- Brand health + signals top card -->
      <div class="card" style="margin-bottom:14px;">
        <div style="display:flex;gap:24px;align-items:flex-start;">
          <div style="text-align:center;min-width:110px;">
            <div style="font-size:7px;font-weight:600;color:{TEXT_LABEL};text-transform:uppercase;letter-spacing:0.10em;margin-bottom:8px;">BRAND HEALTH INDEX</div>
            <img src="{donut_svg}" style="width:90px;height:90px;" alt="Brand health gauge">
            <div style="font-size:8px;font-weight:700;color:{BRAND_PRIMARY};text-transform:uppercase;letter-spacing:0.12em;margin-top:6px;">STRONG</div>
          </div>
          <div style="flex:1;">
            <div style="font-size:7px;font-weight:600;color:{TEXT_LABEL};text-transform:uppercase;letter-spacing:0.10em;margin-bottom:10px;">ALGORITHMIC GROWTH SIGNALS</div>
            <div class="signals-grid">
              <div class="signal-item">
                <div class="signal-name">Γåù Audience Growth</div>
                <div class="signal-value">{audience_growth}</div>
              </div>
              <div class="signal-item">
                <div class="signal-name">ΓèÖ Reach Acceleration</div>
                <div class="signal-value">{reach_acceleration}</div>
              </div>
              <div class="signal-item">
                <div class="signal-name">ΓÜí Engagement Energy</div>
                <div class="signal-value">{engagement_energy_lbl}</div>
              </div>
              <div class="signal-item">
                <div class="signal-name">ΓèÖ Market Percentile</div>
                <div class="signal-value">{market_percentile}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="two-col">
        <!-- Brand Health Vectors -->
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;gap:5px;">
            <span style="font-size:11px;">Γ£ª</span> BRAND HEALTH VECTORS
          </div>
          <div class="bv-row">
            <div class="bv-header"><span class="bv-name">Interaction Energy</span><span class="bv-pct">{interaction_energy}%</span></div>
            <img src="{pb_ie}" class="bv-bar" alt="">
          </div>
          <div class="bv-row">
            <div class="bv-header"><span class="bv-name">Consistency Index</span><span class="bv-pct">{consistency_index}%</span></div>
            <img src="{pb_ci}" class="bv-bar" alt="">
          </div>
          <div class="bv-row">
            <div class="bv-header"><span class="bv-name">Reach Efficiency</span><span class="bv-pct">{reach_efficiency}%</span></div>
            <img src="{pb_re}" class="bv-bar" alt="">
          </div>
          <div class="bv-row">
            <div class="bv-header"><span class="bv-name">Virality Factor</span><span class="bv-pct">{virality_factor}%</span></div>
            <img src="{pb_vf}" class="bv-bar" alt="">
          </div>
        </div>

        <!-- AI Diagnostic Observations -->
        <div class="card">
          <div class="card-title" style="display:flex;align-items:center;gap:5px;">
            <span style="font-size:11px;">ΓèÖ</span> AI DIAGNOSTIC OBSERVATIONS
          </div>
          <div class="diag-row">
            <span class="diag-tag">PERFORMANCE</span>
            {ai_perf_text}
          </div>
          <div class="diag-row">
            <span class="diag-tag">FORMAT</span>
            {ai_format_text}
          </div>
          <div class="diag-row">
            <span class="diag-tag">CADENCE</span>
            {ai_cadence_text}
          </div>
        </div>
      </div>

      <div class="forecast-banner">
        <span class="forecast-label">Γ£ª Strategic Forecast:</span>
        {fc_text}
      </div>

      {_page_footer(3)}
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 4 ΓÇö INSTAGRAM ANALYTICS
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    ig_likes_fmt    = _fmt(ig_likes) if ig_likes else _fmt(top_post.get('likes', 0))
    # Reuse precomputed weekly_svg to avoid double work
    weekly_img_html = (
        f'<img src="{weekly_svg}" style="width:100%;height:auto;border-radius:6px;" alt="Weekly chart">'
        if weekly_svg else '<div style="color:var(--label);font-size:9px;padding:8px 0;">No weekly data</div>'
    )
    stacked_img_html = (
        f'<img src="{svg_stacked_bar(type_counts)}" style="width:100%;height:10px;border-radius:4px;" alt="">'
        if type_counts else ''
    )

    ig_page = f'''
    <div class="pdf-page">
      {_page_header(CLIENT_LOGO, CANIT_LOGO, month, year)}
      {_section_label('ΓÖí', 'CHANNEL DEEP DIVE')}
      {_page_title('INSTAGRAM ANALYTICS',
                   'Platform-specific analysis tracking engagement mechanics, publication trends, content format distribution, and high-performance posts.')}

      <!-- 4-stat banner -->
      <div class="stat-banner">
        {_stat_pill('TOTAL REACH', _fmt(total_reach), zero=ig_r_zero)}
        {_stat_pill('IMPRESSIONS', _fmt(ig_impressions), zero=ig_i_zero)}
        {_stat_pill('ENGAGEMENT RATE', str(eng_rate), zero=False)}
        {_stat_pill('TOTAL FOLLOWERS', str(_fmt(followers)), zero=(str(followers) == '0'))}
      </div>

      <div class="two-col-40-60" style="margin-bottom:14px;">
        <!-- Interaction split -->
        <div class="card">
          <div class="card-title">INTERACTION SPLIT</div>
          <div class="int-row">
            <span class="int-icon" style="color:{BRAND_ACCENT};">ΓÖí</span>
            <span class="int-label">Likes</span>
            <span class="int-value" style="color:{BRAND_ACCENT};">{_fmt(ig_likes)}</span>
          </div>
          <div class="int-row">
            <span class="int-icon" style="color:{BRAND_PRIMARY};">≡ƒÆ¼</span>
            <span class="int-label">Comments</span>
            <span class="int-value" style="color:{TEXT_SECONDARY};">{ig_comments}</span>
          </div>
          <div class="int-row">
            <span class="int-icon" style="color:{BRAND_PRIMARY};">Γûí</span>
            <span class="int-label">Saves</span>
            <span class="int-value" style="color:{TEXT_SECONDARY};">{ig_saves}</span>
          </div>
          <div class="int-total-row">
            <span>Total Engagement</span>
            <span class="int-total-val">{_fmt(ig_total_eng) if ig_total_eng else 'N/A'}</span>
          </div>
        </div>

        <!-- Content format breakdown -->
        <div class="card">
          <div class="card-title">CONTENT FORMAT BREAKDOWN</div>
          {format_rows_html if format_rows_html else '<div style="color:var(--label);font-size:9px;">No format data</div>'}
        </div>
      </div>

      <!-- Top performing post -->
      <div class="top-post-card">
        <div class="tp-label">Γÿà TOP PERFORMING POST</div>
        <div class="tp-inner">
          <a href="{tp_permalink}" target="_blank" class="post-thumb-link">
            <div class="tp-thumb">
              {'<img src="{}" alt="Top post" onerror="this.style.background=\'#E2E5F0\'">'.format(tp_img_b64) if tp_img_b64 else '<div style="width:100%;height:100%;background:var(--border);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:24px;">Γû╢</div>'}
            </div>
            {f'<span class="tp-badge">{tp_media_type}</span>' if tp_media_type != 'IMAGE' else ''}
          </a>
          <div>
            <div class="tp-caption">"{tp_caption}"</div>
            <div class="tp-stats">
              <span><span class="tp-stat-icon">ΓÖí</span>{tp_likes} LIKES</span>
              <span><span class="tp-stat-icon">≡ƒÆ¼</span>{tp_comments} COMMENTS</span>
              <span><span class="tp-stat-icon">Γûí</span>{tp_saves} SAVES</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly chart -->
      <div class="card">
        <div class="card-title">WEEKLY BREAKDOWN</div>
        {weekly_img_html}
      </div>

      {_page_footer(4)}
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 5 ΓÇö FACEBOOK ANALYTICS
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    fb_empty_state = '' if (fb_reactions or fb_comments or fb_shares) else '''
      <div class="card" style="text-align:center;padding:20px;">
        <span style="font-size:9px;color:var(--label);">No Facebook post metrics registered for this cycle.</span>
      </div>'''

    fb_page = f'''
    <div class="pdf-page">
      {_page_header(CLIENT_LOGO, CANIT_LOGO, month, year)}
      {_section_label('≡ƒæÑ', 'CHANNEL DEEP DIVE')}
      {_page_title('FACEBOOK ANALYTICS',
                   'Platform-specific analysis tracking engagement mechanics, publication trends, content format distribution, and high-performance posts.')}

      <!-- 4-stat banner -->
      <div class="stat-banner">
        {_stat_pill('TOTAL REACH', str(fb_page_reach), zero=fb_r_zero)}
        {_stat_pill('IMPRESSIONS', str(fb_impressions), zero=(str(fb_impressions) == '0'))}
        {_stat_pill('ENGAGEMENT RATE', str(fb_engagement), zero=False)}
        {_stat_pill('FOLLOWERS/FANS', str(fb_followers), zero=fb_f_zero)}
      </div>

      <div class="two-col-40-60" style="margin-bottom:14px;">
        <!-- Reaction breakdown -->
        <div class="card">
          <div class="card-title">REACTION BREAKDOWN</div>
          <div class="int-row">
            <span class="int-icon" style="color:{BRAND_ACCENT};">ΓÖí</span>
            <span class="int-label">Reactions</span>
            <span class="int-value" style="color:{'#E83E6C' if fb_reactions else '#1E2B8F'};">{fb_reactions}</span>
          </div>
          <div class="int-row">
            <span class="int-icon" style="color:{BRAND_PRIMARY};">≡ƒÆ¼</span>
            <span class="int-label">Comments</span>
            <span class="int-value" style="color:{'#E83E6C' if fb_comments else '#1E2B8F'};">{fb_comments}</span>
          </div>
          <div class="int-row">
            <span class="int-icon" style="color:{BRAND_PRIMARY};">Γ£ª</span>
            <span class="int-label">Shares</span>
            <span class="int-value" style="color:{'#E83E6C' if fb_shares else '#1E2B8F'};">{fb_shares}</span>
          </div>
          <div class="int-total-row">
            <span>Total Interactions</span>
            <span class="int-total-val" style="color:{'#E83E6C' if (fb_reactions+fb_comments+fb_shares) else '#1E2B8F'};">{fb_reactions + fb_comments + fb_shares}</span>
          </div>
        </div>

        <!-- Content format breakdown -->
        <div class="card">
          <div class="card-title">CONTENT FORMAT BREAKDOWN</div>
          {fb_format_rows_html if fb_format_rows_html else '<div style="color:var(--label);font-size:9px;">No format data</div>'}
        </div>
      </div>

      {fb_empty_state}

      {_page_footer(5)}
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 6 ΓÇö BLOG ARTICLES
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    seo_page = f'''
    <div class="pdf-page">
      {_page_header(CLIENT_LOGO, CANIT_LOGO, month, year)}
      {_section_label('≡ƒôä', 'CONTENT')}
      {_page_title('BLOG ARTICLES',
                   'Published blog articles for the current cycle.')}

      <!-- Published blog articles -->
      <div class="card">
        <div class="card-title">≡ƒôà PUBLISHED BLOG ARTICLES ({len(blog_posts_list)})</div>
        {blog_rows_html if blog_rows_html else '<div style="color:var(--label);font-size:9px;padding:6px 0;">No blog articles published this cycle.</div>'}
      </div>

      {_page_footer(6)}
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # PAGE 7 ΓÇö STRATEGIC RECOMMENDATIONS
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    rec_items = recommendations or [
        f'Post frequency increase: +300% to reach 36 posts/month, boosting engagement by 5%.',
        f'Content diversification: 80% visual, 20% interactive to lift engagement rate by 8%.',
        f'Hashtag optimization: Use 5 high-traffic hashtags to increase reach by 20%.',
    ]
    reco_html_final = ''.join(
        f'<div class="reco-item">{i+1}. {r}</div>' for i, r in enumerate(rec_items)
    )

    act_items = action_steps or [
        'Prioritize publishing detailed, high-authority blog articles focusing on standard search queries containing "omnevum products" to capture growing organic traffic.',
    ]
    action_html_final = ''.join(
        f'<div class="action-item"><span class="action-check">Γ£ô</span>{a}</div>' for a in act_items
    )

    rec_page = f'''
    <div class="pdf-page">
      {_page_header(CLIENT_LOGO, CANIT_LOGO, month, year)}
      {_section_label('≡ƒûÑ', 'NEXT STEPS & ACTION PLAN')}
      {_page_title('STRATEGIC RECOMMENDATIONS',
                   'Data-driven marketing optimisations and actionable suggestions formulated by our analytics engine to maximise performance next cycle.')}

      <!-- Core performance insight -->
      <div class="card" style="margin-bottom:14px;">
        <div class="card-title" style="display:flex;align-items:center;gap:5px;"><span style="color:{BRAND_ACCENT};">Γ£ª</span> CORE PERFORMANCE INSIGHT</div>
        {reco_html_final}
      </div>

      <!-- Specific action steps -->
      <div class="card" style="margin-bottom:14px;">
        <div class="card-title" style="display:flex;align-items:center;gap:5px;"><span style="color:{BRAND_PRIMARY};">Γÿæ</span> SPECIFIC ACTION STEPS</div>
        {action_html_final}
      </div>

      {_page_footer(7)}
    </div>'''

    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    # Assemble
    # ΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉΓòÉ
    final_html = (
        head_html
        + cover_page
        + kpi_page
        + ai_page
        + ig_page
        + fb_page
        + seo_page
        + rec_page
        + '</body></html>'
    )
    return final_html



