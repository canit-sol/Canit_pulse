"""
Generates a beautiful bento-grid HTML report from structured report data.
Returns a complete standalone HTML string.
"""
import json


def generate_report_html(data: dict, brand_color: str = "#c8922a") -> str:
    # Derive color variants from brand_color
    client_name = data.get("client_name", "Client")
    month = data.get("month", "")
    year = data.get("year", "")
    tagline = data.get("tagline", "Monthly Performance Summary")
    metrics = data.get("metrics", [])
    platforms = data.get("platforms", [])
    content_formats = data.get("content_formats", [])
    top_post = data.get("top_post", {})
    weekly_posts = data.get("weekly_posts", [])
    active_days = data.get("active_days", [])
    follower_growth = data.get("follower_growth", "N/A")
    follower_growth_pct = data.get("follower_growth_pct", "")
    engagement_rate = data.get("engagement_rate", "N/A")
    total_reach = data.get("total_reach", "N/A")
    highlights = data.get("highlights", [])
    next_goals = data.get("next_month_goals", [])

    # Build metrics boxes (first 6)
    metric_boxes = ""
    for m in metrics[:6]:
        icon = m.get("icon", "")
        label = m.get("label", "Metric")
        value = m.get("value", "—")
        unit = m.get("unit", "")
        metric_boxes += f"""
        <div class="box box-metric" data-aos>
          <div class="label">{label}</div>
          <div class="big-num">{value}</div>
          <div class="sub">{unit}</div>
        </div>"""

    # Build calendar
    cal_cells = ""
    days_in_month = 31
    # Find what day of week the month starts (simplified: use first active day context)
    start_offset = 2  # default: starts on Tuesday
    for i in range(start_offset):
        cal_cells += '<div class="cal-day cal-empty"></div>'
    for d in range(1, days_in_month + 1):
        cls = "cal-active" if d in active_days else "cal-inactive"
        cal_cells += f'<div class="cal-day {cls}">{d}</div>'

    # Build platform bars
    platform_html = ""
    bar_html = ""
    for p in platforms[:5]:
        name = p.get("name", "Platform")
        pct = p.get("percentage", 0)
        platform_html += f"""
          <div class="channel-item">
            <div style="display:flex;align-items:center;">
              <div class="channel-dot"></div>
              <div class="channel-name">{name}</div>
            </div>
            <div class="channel-pct">{pct}%</div>
          </div>"""
        alpha = round(pct / 100, 2)
        bar_html += f'<div style="width:{pct}%;background:rgba(255,255,255,{alpha + 0.1});"></div>'

    # Build weekly bars
    weekly_html = ""
    max_posts = max((w.get("count", 0) for w in weekly_posts), default=1) or 1
    for w in weekly_posts:
        week = w.get("week", "Wk")
        count = w.get("count", 0)
        pct = round((count / max_posts) * 100)
        weekly_html += f"""
        <div class="tl-bar-wrap">
          <div class="tl-label">{week}</div>
          <div class="tl-bar-bg"><div class="tl-bar" style="width:{pct}%"></div></div>
          <div class="tl-count">{count}</div>
        </div>"""

    # Content format tags
    format_tags = "".join(
        f'<span class="format-tag">{f}</span>' for f in content_formats
    )

    # Highlights list
    highlights_html = "".join(
        f'<div class="highlight-item"><span class="hi-dot">✦</span> {h}</div>'
        for h in highlights[:4]
    )

    # Next month goals
    goals_html = "".join(
        f'<div class="goal-item">→ {g}</div>'
        for g in next_goals[:3]
    )

    # Top post stats
    tp_title = top_post.get("title", "Top performing post this month")
    tp_impressions = top_post.get("impressions", "—")
    tp_likes = top_post.get("likes", "—")
    tp_saves = top_post.get("saves", "—")
    tp_shares = top_post.get("shares", "—")

    # Split client name for hero display
    words = client_name.split()
    if len(words) >= 2:
        hero_name = f"{' '.join(words[:len(words)//2])}<br>{''.join(words[len(words)//2:])}"
    else:
        hero_name = client_name

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{client_name} · {month} {year} Report</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}

    :root {{
      --brand: {brand_color};
      --dark: #0f0d0a;
      --dark2: #1a1610;
      --dark3: #1e1a13;
      --light: #f5f0e8;
      --muted: #7a6040;
      --accent: {brand_color};
    }}

    body {{
      background: var(--dark);
      font-family: 'DM Sans', sans-serif;
      padding: 16px;
      min-height: 100vh;
    }}

    .report-header {{
      text-align: center;
      padding: 24px 0 20px;
      color: var(--muted);
      font-size: 11px;
      letter-spacing: 0.15em;
      text-transform: uppercase;
    }}

    .bento-grid {{
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
      max-width: 1100px;
      margin: 0 auto;
    }}

    .box {{
      border-radius: 20px;
      padding: 26px;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.25s ease, filter 0.25s ease;
      animation: fadeUp 0.5s ease both;
    }}
    .box:hover {{ transform: scale(1.015); filter: brightness(1.07); }}

    @keyframes fadeUp {{
      from {{ opacity: 0; transform: translateY(16px); }}
      to   {{ opacity: 1; transform: translateY(0); }}
    }}
    .box:nth-child(1) {{ animation-delay: 0.05s; }}
    .box:nth-child(2) {{ animation-delay: 0.10s; }}
    .box:nth-child(3) {{ animation-delay: 0.15s; }}
    .box:nth-child(4) {{ animation-delay: 0.20s; }}
    .box:nth-child(5) {{ animation-delay: 0.25s; }}
    .box:nth-child(6) {{ animation-delay: 0.30s; }}
    .box:nth-child(7) {{ animation-delay: 0.35s; }}
    .box:nth-child(8) {{ animation-delay: 0.40s; }}
    .box:nth-child(9) {{ animation-delay: 0.45s; }}
    .box:nth-child(10) {{ animation-delay: 0.50s; }}

    .label {{
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }}

    .big-num {{
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      line-height: 0.9;
    }}

    .sub {{
      font-size: 13px;
      margin-top: 8px;
      opacity: 0.65;
    }}

    /* HERO */
    .box-hero {{
      grid-column: span 7; grid-row: span 2;
      background: var(--brand);
    }}
    .box-hero .label {{ color: rgba(255,255,255,0.6); }}
    .box-hero .client-name {{
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: clamp(38px, 4.5vw, 60px);
      color: #fff;
      line-height: 1;
      margin: 12px 0 8px;
    }}
    .box-hero .period {{ font-size: 12px; color: rgba(255,255,255,0.5); letter-spacing: 0.08em; text-transform: uppercase; }}
    .box-hero .tagline {{ font-size: 14px; color: rgba(255,255,255,0.7); margin-top: 14px; max-width: 300px; line-height: 1.5; }}
    .box-hero .cta {{ position: absolute; bottom: 26px; left: 26px; font-size: 12px; color: rgba(255,255,255,0.5); }}
    .hero-circle {{ position: absolute; right: -30px; top: -30px; width: 200px; height: 200px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.12); pointer-events:none; }}
    .hero-circle2 {{ position: absolute; right: 20px; top: 60px; width: 100px; height: 100px; border-radius: 50%; border: 1.5px solid rgba(255,255,255,0.09); pointer-events:none; }}

    /* METRIC boxes (dark) */
    .box-metric {{
      grid-column: span 5;
      background: var(--dark3);
      border: 1px solid rgba(200,146,42,0.15);
    }}
    .box-metric .label {{ color: var(--brand); opacity: 0.8; }}
    .box-metric .big-num {{ font-size: 56px; color: var(--brand); }}
    .box-metric .sub {{ color: var(--muted); }}

    /* ENGAGEMENT — light box */
    .box-engage {{
      grid-column: span 4;
      background: var(--light);
    }}
    .box-engage .label {{ color: var(--muted); }}
    .box-engage .big-num {{ font-size: 52px; color: #2a1f0a; }}
    .box-engage .sub {{ color: var(--muted); }}

    /* REACH */
    .box-reach {{
      grid-column: span 4;
      background: var(--brand);
    }}
    .box-reach .label {{ color: rgba(255,255,255,0.55); }}
    .box-reach .big-num {{ font-size: 52px; color: #fff; }}
    .box-reach .sub {{ color: rgba(255,255,255,0.6); }}

    /* CONTENT FORMATS */
    .box-formats {{
      grid-column: span 4;
      background: var(--dark3);
      border: 1px solid rgba(200,146,42,0.15);
    }}
    .box-formats .label {{ color: var(--brand); opacity:0.8; }}
    .format-tags {{ display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }}
    .format-tag {{
      background: rgba(200,146,42,0.15);
      color: var(--brand);
      font-size: 10px;
      font-weight: 600;
      padding: 5px 10px;
      border-radius: 20px;
      letter-spacing: 0.05em;
    }}

    /* CALENDAR */
    .box-calendar {{
      grid-column: span 5;
      background: var(--dark3);
      border: 1px solid rgba(200,146,42,0.15);
    }}
    .box-calendar .label {{ color: var(--brand); opacity:0.8; }}
    .cal-title {{ font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; color: var(--brand); margin-bottom: 4px; }}
    .cal-sub {{ font-size: 11px; color: var(--muted); margin-bottom: 10px; }}
    .cal-header {{ display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; margin-bottom: 3px; }}
    .cal-header-day {{ font-size: 9px; color: var(--muted); text-align: center; padding: 2px 0; }}
    .cal-grid {{ display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }}
    .cal-day {{
      aspect-ratio: 1;
      border-radius: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9px;
      font-weight: 500;
    }}
    .cal-empty {{ background: transparent; }}
    .cal-inactive {{ background: #1a1610; color: #4a3a20; }}
    .cal-active {{ background: var(--brand); color: #fff; }}

    /* TIMELINE */
    .box-timeline {{
      grid-column: span 7;
      background: var(--light);
    }}
    .box-timeline .label {{ color: var(--muted); }}
    .tl-title {{ font-family: 'Syne', sans-serif; font-weight: 700; font-size: 20px; color: #2a1f0a; margin-bottom: 4px; }}
    .tl-sub {{ font-size: 11px; color: var(--muted); margin-bottom: 14px; }}
    .tl-bar-wrap {{ display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }}
    .tl-label {{ font-size: 11px; color: var(--muted); width: 32px; flex-shrink: 0; }}
    .tl-bar-bg {{ flex: 1; background: #e0d8c8; border-radius: 4px; height: 8px; overflow: hidden; }}
    .tl-bar {{ height: 100%; border-radius: 4px; background: var(--brand); transition: width 1s ease; }}
    .tl-count {{ font-size: 11px; color: var(--muted); width: 16px; text-align: right; }}

    /* CHANNELS */
    .box-channels {{
      grid-column: span 4;
      background: var(--brand);
    }}
    .box-channels .label {{ color: rgba(255,255,255,0.55); }}
    .channel-list {{ margin-top: 12px; display: flex; flex-direction: column; gap: 9px; }}
    .channel-item {{ display: flex; align-items: center; justify-content: space-between; }}
    .channel-name {{ font-size: 13px; color: rgba(255,255,255,0.85); }}
    .channel-dot {{ width: 7px; height: 7px; border-radius: 50%; background: rgba(255,255,255,0.5); margin-right: 8px; }}
    .channel-pct {{ font-size: 13px; font-weight: 600; color: #fff; }}
    .channel-bar {{ margin-top: 14px; height: 5px; border-radius: 4px; overflow: hidden; background: rgba(255,255,255,0.15); display: flex; }}

    /* TOP POST */
    .box-toppost {{
      grid-column: span 5;
      background: var(--dark3);
      border: 1px solid rgba(200,146,42,0.15);
    }}
    .box-toppost .label {{ color: var(--brand); opacity:0.8; }}
    .post-title-text {{
      font-size: 14px;
      color: #d4a855;
      margin-top: 10px;
      font-weight: 500;
      line-height: 1.45;
    }}
    .post-stats {{ display: flex; gap: 14px; margin-top: 14px; flex-wrap: wrap; }}
    .post-stat {{ display: flex; flex-direction: column; }}
    .post-stat-num {{ font-size: 18px; font-weight: 700; color: var(--brand); }}
    .post-stat-label {{ font-size: 10px; color: var(--muted); margin-top: 2px; }}

    /* GROWTH */
    .box-growth {{
      grid-column: span 3;
      background: var(--light);
    }}
    .box-growth .label {{ color: var(--muted); }}
    .box-growth .big-num {{ font-size: 36px; color: #2a1f0a; }}
    .growth-tag {{
      display: inline-block;
      background: var(--brand);
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 20px;
      margin-top: 10px;
    }}

    /* HIGHLIGHTS */
    .box-highlights {{
      grid-column: span 6;
      background: var(--dark3);
      border: 1px solid rgba(200,146,42,0.15);
    }}
    .box-highlights .label {{ color: var(--brand); opacity:0.8; }}
    .highlight-item {{
      font-size: 13px;
      color: #c8a870;
      padding: 8px 0;
      border-bottom: 1px solid rgba(200,146,42,0.1);
      display: flex;
      align-items: flex-start;
      gap: 8px;
      line-height: 1.45;
    }}
    .highlight-item:last-child {{ border-bottom: none; }}
    .hi-dot {{ color: var(--brand); flex-shrink: 0; font-size: 10px; margin-top: 3px; }}

    /* GOALS */
    .box-goals {{
      grid-column: span 6;
      background: var(--brand);
    }}
    .box-goals .label {{ color: rgba(255,255,255,0.55); }}
    .goal-item {{
      font-size: 13px;
      color: rgba(255,255,255,0.85);
      padding: 8px 0;
      border-bottom: 1px solid rgba(255,255,255,0.12);
    }}
    .goal-item:last-child {{ border-bottom: none; }}

    /* FOOTER */
    .report-footer {{
      text-align: center;
      padding: 24px 0 12px;
      color: #3a3020;
      font-size: 11px;
      letter-spacing: 0.08em;
    }}

    @media (max-width: 720px) {{
      .box-hero    {{ grid-column: span 12; grid-row: span 1; }}
      .box-metric  {{ grid-column: span 6; }}
      .box-engage, .box-reach, .box-formats {{ grid-column: span 12; }}
      .box-calendar, .box-timeline {{ grid-column: span 12; }}
      .box-channels, .box-toppost, .box-growth {{ grid-column: span 12; }}
      .box-highlights, .box-goals {{ grid-column: span 12; }}
    }}
  </style>
</head>
<body>

<div class="report-header">Generated with Canit Pulse · {month} {year}</div>

<div class="bento-grid">

  <!-- HERO -->
  <div class="box box-hero">
    <div class="hero-circle"></div>
    <div class="hero-circle2"></div>
    <div class="label">Activity Report · {month} {year}</div>
    <div class="client-name">{hero_name}</div>
    <div class="period">Monthly Performance Summary</div>
    <div class="tagline">{tagline}</div>
    <div class="cta">Tap any card to explore →</div>
  </div>

  <!-- DYNAMIC METRIC BOXES -->
  {metric_boxes}

  <!-- ENGAGEMENT -->
  <div class="box box-engage">
    <div class="label">Engagement Rate</div>
    <div class="big-num">{engagement_rate}</div>
    <div class="sub">avg this month</div>
  </div>

  <!-- REACH -->
  <div class="box box-reach">
    <div class="label">Total Reach</div>
    <div class="big-num">{total_reach}</div>
    <div class="sub">accounts reached</div>
  </div>

  <!-- CONTENT FORMATS -->
  <div class="box box-formats">
    <div class="label">Content Formats Used</div>
    <div class="big-num" style="font-size:42px;color:var(--brand);">{len(content_formats)}+</div>
    <div class="format-tags">{format_tags}</div>
  </div>

  <!-- CALENDAR -->
  <div class="box box-calendar">
    <div class="label">When We Posted</div>
    <div class="cal-title">{month} Calendar</div>
    <div class="cal-sub">{len(active_days)} active days →</div>
    <div class="cal-header">
      <div class="cal-header-day">M</div><div class="cal-header-day">T</div>
      <div class="cal-header-day">W</div><div class="cal-header-day">T</div>
      <div class="cal-header-day">F</div><div class="cal-header-day">S</div>
      <div class="cal-header-day">S</div>
    </div>
    <div class="cal-grid">{cal_cells}</div>
  </div>

  <!-- TIMELINE -->
  <div class="box box-timeline">
    <div class="label">Day by Day</div>
    <div class="tl-title">Post Timeline</div>
    <div class="tl-sub">Posts per week this month</div>
    {weekly_html}
    <div style="margin-top:16px;padding-top:14px;border-top:1px solid #e0d8c8;">
      <div style="font-size:11px;color:#a08050;margin-bottom:6px;">Engagement trend</div>
      <svg width="100%" height="44" viewBox="0 0 300 44">
        <polyline points="0,38 60,28 120,18 180,24 240,10 300,14"
          fill="none" stroke="{brand_color}" stroke-width="2.5"
          stroke-linecap="round" stroke-linejoin="round"/>
        <polyline points="0,38 60,28 120,18 180,24 240,10 300,14 300,44 0,44"
          fill="{brand_color}" fill-opacity="0.12" stroke="none"/>
        <circle cx="240" cy="10" r="4" fill="{brand_color}"/>
      </svg>
    </div>
  </div>

  <!-- CHANNELS -->
  <div class="box box-channels">
    <div class="label">Platform Split</div>
    <div class="channel-list">{platform_html}</div>
    <div class="channel-bar">{bar_html}</div>
  </div>

  <!-- TOP POST -->
  <div class="box box-toppost">
    <div class="label">⭐ Top Post This Month</div>
    <div class="post-title-text">"{tp_title}"</div>
    <div class="post-stats">
      <div class="post-stat"><div class="post-stat-num">{tp_impressions}</div><div class="post-stat-label">Impressions</div></div>
      <div class="post-stat"><div class="post-stat-num">{tp_likes}</div><div class="post-stat-label">Likes</div></div>
      <div class="post-stat"><div class="post-stat-num">{tp_saves}</div><div class="post-stat-label">Saves</div></div>
      <div class="post-stat"><div class="post-stat-num">{tp_shares}</div><div class="post-stat-label">Shares</div></div>
    </div>
  </div>

  <!-- GROWTH -->
  <div class="box box-growth">
    <div class="label">Follower Growth</div>
    <div class="big-num">{follower_growth}</div>
    <div class="sub" style="color:var(--muted);">new followers</div>
    <div class="growth-tag">↑ {follower_growth_pct} vs last month</div>
  </div>

  <!-- HIGHLIGHTS -->
  <div class="box box-highlights">
    <div class="label">✦ Key Wins This Month</div>
    {highlights_html}
  </div>

  <!-- GOALS -->
  <div class="box box-goals">
    <div class="label">→ Next Month Goals</div>
    {goals_html}
  </div>

</div>

<div class="report-footer">
  {client_name} · {month} {year} · Generated by Canit Pulse
</div>

</body>
</html>"""

    return html
