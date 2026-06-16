import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
import re, os, urllib.parse
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


def _parse_engagement_rate(eng_rate_str):
    if not eng_rate_str or eng_rate_str == 'N/A':
        return None
    try:
        return float(str(eng_rate_str).replace('%', '').strip())
    except Exception:
        return None


def _load_canit_logo() -> str:
    logo_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'logo.png')
    if os.path.exists(logo_path):
        import base64
        with open(logo_path, 'rb') as lf:
            data = lf.read()
        return 'data:image/png;base64,' + base64.b64encode(data).decode('ascii')
    return _svg_logo_data_uri('CP', '#1E2B8F', 40)


def generate_strategic_forecast(report_data: dict, instagram_data: dict, facebook_data: dict = None) -> str:
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


# ---------------------------------------------------------------------------
# Design tokens
# ---------------------------------------------------------------------------
BRAND_PRIMARY        = '#1E2B8F'
BRAND_ACCENT         = '#E83E6C'
BRAND_ACCENT_SEC     = '#7B5EA7'
TEXT_PRIMARY         = '#1A1A2E'
TEXT_SECONDARY       = '#5A6078'
TEXT_LABEL           = '#8F96AB'
BG_PAGE              = '#FFFFFF'
BG_CARD              = '#F7F8FC'
BG_CARD_BORDER       = '#E2E5F0'
STATUS_ACTIVE        = '#E83E6C'
STATUS_ACTIVE_BG     = '#FDE8EF'
BLUE_LINK            = '#3B5BDB'
GREEN_POS            = '#2ECC71'

# ---------------------------------------------------------------------------
# SVG helper
# ---------------------------------------------------------------------------
def _svg_logo_data_uri(initials: str, bg_hex: str, size: int = 32) -> str:
    bg_hex = bg_hex.lstrip('#')
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
    return 'data:image/svg+xml,' + urllib.parse.quote(svg)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _val(v):
    if v is None or str(v).strip() == '' or str(v).upper() == 'N/A':
        return 'No data available'
    return str(v)


def _parse_num(v):
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


def _fmt_num(n):
    try:
        n = int(n)
        if n >= 1_000_000:
            return f'{n/1_000_000:.1f}M'
        if n >= 1_000:
            return f'{n/1_000:.1f}K'
        return f'{n:,}'
    except Exception:
        return str(n)


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
    counts = ['email_count', 'click_count', 'like_count', 'follower_count',
              'comments_count', 'shares_count', 'saves_count', 'profile_visits',
              'website_taps', 'reach_count', 'impressions_count']
    for ak in counts:
        if ak in out:
            out[ak] = _parse_num(out[ak])
    return out


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------
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
    print("[STREAMING] generate_report_html_to_file called - single page")

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

    raw_fb = facebook_data
    if isinstance(raw_fb, dict) and 'summary' in raw_fb:
        fb = raw_fb['summary']
    else:
        fb = raw_fb or {}

    posts = instagram_data.get('posts', []) or []
    fb_posts = facebook_data.get('posts', []) or []

    # ── CSS ──────────────────────────────────────────────────────────────
    css = f"""
    *,*::before,*::after{{box-sizing:border-box;margin:0;padding:0}}
    @page{{size:A4;margin:8mm}}
    :root{{
      --brand:{BRAND_ACCENT};
      --navy:{BRAND_PRIMARY};
      --text:{TEXT_PRIMARY};
      --muted:{TEXT_SECONDARY};
      --label:{TEXT_LABEL};
      --card:{BG_CARD};
      --bg:{BG_PAGE};
      --border:{BG_CARD_BORDER};
    }}
    body{{background:var(--bg);font-family:'DM Sans',sans-serif;color:var(--text);font-size:11px;-webkit-print-color-adjust:exact;print-color-adjust:exact}}
    .dashboard{{width:190mm;min-height:277mm;padding:8mm 10mm;margin:0 auto;overflow:hidden;display:flex;flex-direction:column;gap:12px}}

    /* ── Header ── */
    .dash-header{{display:flex;justify-content:space-between;align-items:center;padding-bottom:10px;border-bottom:3px solid var(--navy)}}
    .h-left,.h-right{{display:flex;align-items:center;gap:12px}}
    .h-logo{{height:32px;width:32px;border-radius:6px;object-fit:cover;flex-shrink:0}}
    .h-client-name{{font-family:'Poppins',sans-serif;font-weight:800;font-size:16px;color:var(--navy);text-transform:uppercase;letter-spacing:0.08em}}
    .h-brand{{font-size:14px;font-weight:700;color:var(--navy);letter-spacing:0.12em;text-transform:uppercase}}

    /* ── Title ── */
    .title-row{{display:flex;justify-content:space-between;align-items:baseline;padding:8px 0 6px}}
    .title-main{{font-family:'Poppins',sans-serif;font-weight:900;font-size:26px;color:var(--text)}}
    .title-sub{{font-size:12px;color:var(--label);text-transform:uppercase;letter-spacing:0.12em}}

    /* ── KPI Row ── */
    .kpi-row{{display:flex;flex-wrap:wrap;gap:10px}}
    .kpi-card{{
      flex:1 0 120px;background:var(--card);border:1px solid var(--border);
      border-radius:10px;padding:14px 10px;text-align:center;min-width:0
    }}
    .kpi-val{{font-family:'Poppins',sans-serif;font-weight:800;font-size:22px;color:var(--navy);line-height:1.1}}
    .kpi-lbl{{font-size:9px;font-weight:600;color:var(--label);text-transform:uppercase;letter-spacing:0.1em;margin-top:4px}}

    /* ── Synopsis ── */
    .synopsis-card{{
      background:linear-gradient(135deg,var(--navy),#2a3a8a);border-radius:10px;
      padding:14px 18px;font-size:12px;line-height:1.7;color:#e8ecf8;font-style:italic
    }}

    /* ── Platform Cards (full-width stacked) ── */
    .full-card{{
      background:var(--card);border:1px solid var(--border);
      border-radius:10px;padding:14px;width:100%
    }}
    .mid-heading{{
      font-family:'Poppins',sans-serif;font-weight:700;font-size:13px;
      color:var(--navy);margin-bottom:8px;padding-bottom:5px;
      border-bottom:2px solid var(--brand)
    }}
    .mid-grid{{display:flex;flex-wrap:wrap;gap:8px}}
    .mid-metric{{
      flex:1 0 calc(25% - 6px);background:var(--bg);border:1px solid var(--border);
      border-radius:6px;padding:12px 8px;text-align:center
    }}
    .mid-metric-val{{font-family:'Poppins',sans-serif;font-weight:800;font-size:18px;color:var(--navy)}}
    .mid-metric-lbl{{font-size:8px;font-weight:600;color:var(--label);text-transform:uppercase;letter-spacing:0.08em;margin-top:3px}}

    /* ── Top Posts Grid ── */
    .posts-row{{display:flex;gap:10px;flex-wrap:wrap}}
    .post-card{{
      flex:1 0 calc(25% - 8px);background:var(--bg);border:1px solid var(--border);
      border-radius:8px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;
      min-width:140px;transition:transform 0.15s
    }}
    .post-card:hover{{transform:scale(1.02)}}
    .post-img{{width:100%;aspect-ratio:1;object-fit:cover;display:block;background:#eee}}
    .post-img-placeholder{{background:linear-gradient(135deg,#e8ecf8,#d0d8f0)}}
    .post-img-fail .post-img{{display:none}}
    .post-img-fail::before{{content:'No Image';display:flex;align-items:center;justify-content:center;aspect-ratio:1;color:var(--label);font-size:11px;background:var(--card)}}
    .post-info{{padding:8px;display:flex;flex-direction:column;gap:4px}}
    .post-badge{{
      display:inline-block;padding:2px 7px;border-radius:4px;font-size:8px;
      font-weight:700;text-transform:uppercase;align-self:flex-start
    }}
    .post-badge-ig{{background:#FDE8EF;color:#E83E6C}}
    .post-badge-fb{{background:#E8F0FE;color:#1877F2}}
    .post-text{{font-size:9px;color:var(--muted);line-height:1.35;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}}
    .post-stats{{font-size:9px;color:var(--navy);font-weight:600}}

    /* ── Footer ── */
    .dash-footer{{
      border-top:2px solid var(--border);padding-top:8px;margin-top:auto;
      font-size:9px;color:var(--label);text-align:center;text-transform:uppercase;letter-spacing:0.12em
    }}
    """

    # ── HTML ────────────────────────────────────────────────────────────
    f.write('<!DOCTYPE html>\n<html lang="en">\n<head>\n')
    f.write(f'<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n')
    f.write(f'<title>{client_name} · {month} {year}</title>\n')
    f.write('<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700;800;900&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">\n')
    f.write(f'<style>{css}</style>\n</head>\n<body>\n<div class="dashboard">\n')

    # ── Header ──
    f.write(f'''
    <div class="dash-header">
      <div class="h-left">
        <img src="{CLIENT_LOGO}" class="h-logo" alt="Client">
        <span class="h-client-name">{client_name}</span>
      </div>
      <div class="h-right">
        <img src="{CANIT_LOGO}" class="h-logo" alt="Canit Pulse">
        <span class="h-brand">CANIT PULSE</span>
      </div>
    </div>''')

    # ── Title ──
    f.write(f'''
    <div class="title-row">
      <div class="title-main">{client_name}</div>
      <div class="title-sub">{month} {year} · Monthly Performance Report</div>
    </div>''')

    # ── KPI Row ──
    kpi_items = []
    if 'follower_count' in instagram:
        kpi_items.append(('IG Followers', _fmt_num(instagram['follower_count'])))
    if 'like_count' in instagram:
        kpi_items.append(('Avg Likes', _fmt_num(instagram['like_count'])))
    if 'followers' in fb:
        kpi_items.append(('FB Fans', _fmt_num(fb['followers'])))
    reach_val = instagram.get('reach_count') or instagram.get('total_reach') or 0
    if reach_val:
        kpi_items.append(('Reach', _fmt_num(reach_val)))
    impr_val = instagram.get('impressions_count') or instagram.get('total_impressions') or 0
    if impr_val:
        kpi_items.append(('Impressions', _fmt_num(impr_val)))

    if kpi_items:
        f.write('<div class="kpi-row">')
        for lbl, val in kpi_items:
            f.write(f'<div class="kpi-card"><div class="kpi-val">{_val(val)}</div><div class="kpi-lbl">{lbl}</div></div>')
        f.write('</div>')

    # ── Synopsis ──
    if synopsis and synopsis.strip():
        f.write(f'<div class="synopsis-card">{synopsis}</div>')

    # ── Platform Cards (Instagram / Facebook / Top Posts) ──
    ig_metrics = []
    if 'followers' in instagram:
        ig_metrics.append(('Followers', _fmt_num(instagram['followers'])))
    elif 'follower_count' in instagram:
        ig_metrics.append(('Followers', _fmt_num(instagram['follower_count'])))
    total_posts = instagram_data.get('total_posts', len(posts))
    if total_posts:
        ig_metrics.append(('Posts', str(total_posts)))
    if instagram.get('reach_count') or instagram.get('total_reach'):
        ig_metrics.append(('Reach', _fmt_num(instagram.get('reach_count') or instagram.get('total_reach'))))
    if instagram.get('impressions_count') or instagram.get('total_impressions'):
        ig_metrics.append(('Impressions', _fmt_num(instagram.get('impressions_count') or instagram.get('total_impressions'))))
    ig_eng = instagram_data.get('engagement_rate', '')
    if not ig_eng or ig_eng in ('0', '0%', '0.0%'):
        ig_reach = _parse_num(instagram.get('reach_count', instagram.get('total_reach', 0)))
        ig_likes = _parse_num(instagram.get('like_count', instagram.get('total_likes', 0)))
        if ig_reach > 0 and ig_likes > 0:
            ig_eng = f"{(ig_likes / ig_reach) * 100:.2f}%"
    if ig_eng:
        ig_metrics.append(('Eng Rate', ig_eng))

    fb_metrics = []
    if fb.get('followers'):
        fb_metrics.append(('Followers', _fmt_num(fb['followers'])))
    if fb.get('fan_count'):
        fb_metrics.append(('Fans', _fmt_num(fb['fan_count'])))
    fb_post_count = fb.get('total_posts', fb.get('post_count', len(fb_posts)))
    if fb_post_count:
        fb_metrics.append(('Posts', str(fb_post_count)))
    if fb.get('page_reach') or fb.get('total_reach'):
        fb_reach = fb.get('page_reach') or fb.get('total_reach')
        fb_metrics.append(('Reach', _fmt_num(fb_reach)))
    if fb.get('total_impressions') or fb.get('impressions'):
        fb_impressions = fb.get('total_impressions') or fb.get('impressions')
        fb_metrics.append(('Impressions', _fmt_num(fb_impressions)))
    if fb.get('total_reactions'):
        fb_metrics.append(('Reactions', _fmt_num(fb['total_reactions'])))
    fb_eng = fb.get('engagement_rate', '')
    if not fb_eng or fb_eng in ('0', '0%', '0.0%'):
        reach = _parse_num(fb.get('page_reach', fb.get('total_reach', 0)))
        reactions = _parse_num(fb.get('total_reactions', 0))
        if reach > 0 and reactions > 0:
            fb_eng = f"{(reactions / reach) * 100:.2f}%"
    if fb_eng:
        fb_metrics.append(('Eng Rate', fb_eng))

    top_posts = []
    for p in (posts[:4] if posts else []):
        likes = _parse_num(p.get('like_count', p.get('likes', 0)))
        caption = (p.get('caption', '') or '')[:80]
        img = p.get('media_url', '') or ''
        permalink = p.get('permalink', '#')
        top_posts.append(('IG', caption, likes, img, permalink))
    for p in (fb_posts[:4] if fb_posts else []):
        likes = _parse_num(p.get('like_count', p.get('likes', 0)))
        msg = (p.get('message', '') or p.get('caption', '') or '')[:80]
        img = p.get('media_url', p.get('full_picture', '')) or ''
        permalink = p.get('permalink', '#')
        top_posts.append(('FB', msg or 'No message', likes, img, permalink))

    has_ig = bool(ig_metrics)
    has_fb = bool(fb_metrics)
    has_posts = bool(top_posts)

    if has_ig:
        f.write('<div class="full-card"><div class="mid-heading">Instagram</div><div class="mid-grid">')
        for lbl, val in ig_metrics:
            f.write(f'<div class="mid-metric"><div class="mid-metric-val">{_val(val)}</div><div class="mid-metric-lbl">{lbl}</div></div>')
        f.write('</div></div>')

    if has_fb:
        f.write('<div class="full-card"><div class="mid-heading">Facebook</div><div class="mid-grid">')
        for lbl, val in fb_metrics:
            f.write(f'<div class="mid-metric"><div class="mid-metric-val">{_val(val)}</div><div class="mid-metric-lbl">{lbl}</div></div>')
        f.write('</div></div>')

    if has_posts:
        f.write('<div class="full-card"><div class="mid-heading">Top Posts</div><div class="posts-row">')
        for badge, text, likes, img_url, permalink in top_posts[:4]:
            badge_cls = 'post-badge-ig' if badge == 'IG' else 'post-badge-fb'
            f.write(f'<a class="post-card" href="{permalink}" target="_blank">')
            if img_url:
                f.write(f'<img class="post-img" src="{img_url}" alt="" loading="lazy" onerror="this.parentElement.classList.add(\'post-img-fail\')">')
            else:
                f.write('<div class="post-img post-img-placeholder"></div>')
            f.write(f'<div class="post-info"><span class="post-badge {badge_cls}">{badge}</span>')
            f.write(f'<span class="post-text">{text}</span>')
            f.write(f'<span class="post-stats">&#10084; {_fmt_num(likes)}</span>')
            f.write('</div></a>')
        f.write('</div></div>')

    # ── Footer ──
    f.write(f'<div class="dash-footer">CANIT PULSE &copy; 2026 | {client_name} | {month} {year} | Monthly Performance Report</div>')
    f.write('</div>\n</body>\n</html>')
