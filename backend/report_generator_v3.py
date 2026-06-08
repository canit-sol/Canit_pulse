"""
Bento Report Generator v3
- Instagram posts grid (actual thumbnails)
- Synopsis box (AI written)
- AI chat box (embedded)
- Removed: Engagement rate + Total reach standalone boxes (per sketch)
- Added: Content format used, Calendar, Post timeline, Synopsis, AI
"""


def generate_report_html(report_data: dict, instagram_data: dict, synopsis: str, brand_color: str = "#c8922a") -> str:
    client_name  = report_data.get("client_name", "Client")
    month        = report_data.get("month", "")
    year         = report_data.get("year", "")
    handle       = instagram_data.get("instagram_handle", "")
    total_posts  = instagram_data.get("total_posts", 0)
    active_days  = instagram_data.get("active_days", [])
    total_reach  = instagram_data.get("total_reach", "N/A")
    eng_rate     = instagram_data.get("engagement_rate", "N/A")
    weekly_posts = instagram_data.get("weekly_posts", [])
    content_types= instagram_data.get("content_types", [])
    top_post     = instagram_data.get("top_post", {})
    posts        = instagram_data.get("posts", [])
    followers    = instagram_data.get("followers", 0)
    type_counts  = instagram_data.get("type_counts", {})

    # Paid/Organic breakdown
    paid = instagram_data.get("paid", {})
    organic_data = instagram_data.get("organic", {})
    bifurcation = instagram_data.get("bifurcation_available", False)

    # Client name split for hero
    words = client_name.split()
    if len(words) >= 2:
        mid = len(words) // 2
        hero_name = " ".join(words[:mid]) + "<br>" + " ".join(words[mid:])
    else:
        hero_name = client_name

    # Calendar cells
    cal_cells = ""
    for _ in range(2):  # offset: Tuesday start
        cal_cells += '<div class="cal-day cal-empty"></div>'
    for d in range(1, 32):
        cls = "cal-active" if d in active_days else "cal-inactive"
        cal_cells += f'<div class="cal-day {cls}">{d}</div>'

    # Weekly bars
    max_w = max((w.get("count", 0) for w in weekly_posts), default=1) or 1
    weekly_html = ""
    for w in weekly_posts:
        pct = round(w.get("count", 0) / max_w * 100)
        weekly_html += f"""
        <div class="tl-bar-wrap">
          <div class="tl-label">{w['week']}</div>
          <div class="tl-bar-bg"><div class="tl-bar" style="width:{pct}%"></div></div>
          <div class="tl-count">{w['count']}</div>
        </div>"""

    # Content type tags
    type_labels = {"IMAGE": "📷 Static", "VIDEO": "🎬 Reels", "CAROUSEL_ALBUM": "🎠 Carousel"}
    format_tags = "".join(
        f'<span class="format-tag">{type_labels.get(t, t)} <span class="ft-count">{type_counts.get(t, "")}</span></span>'
        for t in content_types
    )

    # Posts grid (first 9 posts as thumbnails)
    posts_grid = ""
    for p in posts[:9]:
        img = p.get("media_url", "")
        day = p.get("day", "")
        likes = p.get("likes", 0)
        mt = p.get("media_type", "IMAGE")
        badge = "▶" if mt == "VIDEO" else ("⧉" if mt == "CAROUSEL_ALBUM" else "")
        caption = p.get("caption", "")[:60].replace('"', '&quot;')
        link = p.get("permalink", "#")
        posts_grid += f"""
        <a class="post-thumb" href="{link}" target="_blank" title="{caption}">
          <img src="{img}" alt="Post day {day}" loading="lazy" onerror="this.parentElement.classList.add('img-error')" />
          <div class="pt-overlay">
            <div class="pt-day">Day {day}</div>
            <div class="pt-likes">♥ {likes}</div>
            {f'<div class="pt-badge">{badge}</div>' if badge else ''}
          </div>
        </a>"""

    # Top post image
    tp_img = top_post.get("media_url", "")
    tp_caption = top_post.get("caption", "Best performing post this month")[:100]
    tp_link = top_post.get("permalink", "#")

    # Followers formatted
    def fmt(n):
        if isinstance(n, int):
            if n >= 1000: return f"{n/1000:.1f}K"
        return str(n)

    report_id = report_data.get("report_id", "")

    # Build paid breakdown section
    paid_section = ""
    if bifurcation:
        paid_section = f"""
  <!-- REACH BREAKDOWN -->
  <div class="box b-dark span-12">
    <div class="label">📊 Reach Breakdown — Organic vs Paid</div>
    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top:12px;">
      <div style="background:#113a87; color:white; border-radius:12px; padding:16px;">
        <div style="font-size:10px; opacity:0.6; text-transform:uppercase; letter-spacing:2px;">Total Reach</div>
        <div style="font-size:24px; font-weight:900; margin-top:4px;">{instagram_data.get('total_reach', '0')}</div>
        <div style="font-size:10px; opacity:0.6; margin-top:4px;">Organic + Paid</div>
      </div>
      <div style="background:#f0fdf4; border-radius:12px; padding:16px;">
        <div style="font-size:10px; color:#16a34a; font-weight:700; text-transform:uppercase; letter-spacing:2px;">Organic</div>
        <div style="font-size:24px; font-weight:900; color:#15803d; margin-top:4px;">{organic_data.get('total_reach', '0')}</div>
        <div style="font-size:10px; color:#86efac; margin-top:4px;">Natural reach</div>
      </div>
      <div style="background:#fff7ed; border-radius:12px; padding:16px;">
        <div style="font-size:10px; color:#ea580c; font-weight:700; text-transform:uppercase; letter-spacing:2px;">Paid / Boosted</div>
        <div style="font-size:24px; font-weight:900; color:#c2410c; margin-top:4px;">{paid.get('total_reach', '0')}</div>
        <div style="font-size:10px; color:#fdba74; margin-top:4px;">Ad-driven reach</div>
      </div>
    </div>
    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-top:12px;">
      <div style="background:rgba(200,146,42,0.08); border-radius:12px; padding:16px;">
        <div style="font-size:10px; color:var(--muted); font-weight:700; text-transform:uppercase; letter-spacing:2px;">Total Impressions</div>
        <div style="font-size:20px; font-weight:900; color:var(--brand); margin-top:4px;">{instagram_data.get('total_impressions', '0')}</div>
      </div>
      <div style="background:#f0fdf4; border-radius:12px; padding:16px;">
        <div style="font-size:10px; color:#16a34a; font-weight:700; text-transform:uppercase; letter-spacing:2px;">Organic Impressions</div>
        <div style="font-size:20px; font-weight:900; color:#15803d; margin-top:4px;">{organic_data.get('total_impressions', '0')}</div>
      </div>
      <div style="background:#fff7ed; border-radius:12px; padding:16px;">
        <div style="font-size:10px; color:#ea580c; font-weight:700; text-transform:uppercase; letter-spacing:2px;">Paid Impressions</div>
        <div style="font-size:20px; font-weight:900; color:#c2410c; margin-top:4px;">{paid.get('total_impressions', '0')}</div>
      </div>
    </div>
  </div>
"""

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{client_name} · {month} {year}</title>
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {{ box-sizing: border-box; margin: 0; padding: 0; }}
    :root {{
      --brand: {brand_color};
      --dark: #0f0d0a; --dark2: #141108; --dark3: #1e1a13;
      --light: #f5f0e8; --muted: #7a6040; --border: rgba(200,146,42,0.18);
    }}
    body {{ background: var(--dark); font-family: 'DM Sans', sans-serif; padding: 16px; }}

    .grid {{
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 12px;
      max-width: 1100px;
      margin: 0 auto;
    }}

    .box {{
      border-radius: 20px; padding: 26px; position: relative;
      overflow: hidden; transition: transform 0.2s, filter 0.2s;
      animation: up 0.5s ease both;
    }}
    .box:hover {{ transform: scale(1.012); filter: brightness(1.06); }}
    @keyframes up {{ from{{opacity:0;transform:translateY(16px)}} to{{opacity:1;transform:translateY(0)}} }}
    .box:nth-child(1){{animation-delay:.05s}} .box:nth-child(2){{animation-delay:.10s}}
    .box:nth-child(3){{animation-delay:.15s}} .box:nth-child(4){{animation-delay:.20s}}
    .box:nth-child(5){{animation-delay:.25s}} .box:nth-child(6){{animation-delay:.30s}}
    .box:nth-child(7){{animation-delay:.35s}} .box:nth-child(8){{animation-delay:.40s}}
    .box:nth-child(9){{animation-delay:.45s}} .box:nth-child(10){{animation-delay:.50s}}

    .label {{ font-size: 10px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 10px; }}
    .big-num {{ font-family: 'Syne', sans-serif; font-weight: 800; line-height: 0.9; }}
    .sub {{ font-size: 13px; margin-top: 8px; opacity: 0.65; }}

    /* HERO */
    .b-hero {{ grid-column: span 7; grid-row: span 2; background: var(--brand); }}
    .b-hero .label {{ color: rgba(255,255,255,0.55); }}
    .b-hero .client-name {{ font-family:'Syne',sans-serif; font-weight:800; font-size:clamp(36px,4vw,58px); color:#fff; line-height:1; margin:12px 0 8px; }}
    .b-hero .handle {{ font-size:13px; color:rgba(255,255,255,0.5); margin-bottom:10px; }}
    .b-hero .cta {{ position:absolute; bottom:24px; left:26px; font-size:12px; color:rgba(255,255,255,0.45); }}
    .hero-circle {{ position:absolute; right:-30px; top:-30px; width:200px; height:200px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.12); pointer-events:none; }}
    .hero-circle2 {{ position:absolute; right:20px; top:60px; width:100px; height:100px; border-radius:50%; border:1.5px solid rgba(255,255,255,0.09); pointer-events:none; }}

    /* DARK BOX */
    .b-dark {{ background: var(--dark3); border: 1px solid var(--border); }}
    .b-dark .label {{ color: var(--brand); opacity:.8; }}
    .b-dark .big-num {{ color: var(--brand); }}
    .b-dark .sub {{ color: var(--muted); }}

    /* LIGHT BOX */
    .b-light {{ background: var(--light); }}
    .b-light .label {{ color: var(--muted); }}
    .b-light .big-num {{ color: #2a1f0a; }}
    .b-light .sub {{ color: var(--muted); }}

    /* AMBER BOX */
    .b-amber {{ background: var(--brand); }}
    .b-amber .label {{ color: rgba(255,255,255,0.55); }}
    .b-amber .big-num {{ color: #fff; }}
    .b-amber .sub {{ color: rgba(255,255,255,0.6); }}

    /* SIZES */
    .span-5 {{ grid-column: span 5; }}
    .span-4 {{ grid-column: span 4; }}
    .span-3 {{ grid-column: span 3; }}
    .span-6 {{ grid-column: span 6; }}
    .span-7 {{ grid-column: span 7; }}
    .span-8 {{ grid-column: span 8; }}
    .span-12 {{ grid-column: span 12; }}

    /* CALENDAR */
    .cal-title {{ font-family:'Syne',sans-serif; font-weight:700; font-size:18px; color:var(--brand); margin-bottom:4px; }}
    .cal-sub {{ font-size:11px; color:var(--muted); margin-bottom:10px; }}
    .cal-header {{ display:grid; grid-template-columns:repeat(7,1fr); gap:3px; margin-bottom:3px; }}
    .cal-h {{ font-size:9px; color:var(--muted); text-align:center; }}
    .cal-grid {{ display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }}
    .cal-day {{ aspect-ratio:1; border-radius:5px; display:flex; align-items:center; justify-content:center; font-size:9px; font-weight:500; }}
    .cal-empty {{ background:transparent; }}
    .cal-inactive {{ background:#1a1610; color:#4a3a20; }}
    .cal-active {{ background:var(--brand); color:#fff; }}

    /* TIMELINE */
    .tl-bar-wrap {{ display:flex; align-items:center; gap:10px; margin-bottom:8px; }}
    .tl-label {{ font-size:11px; color:var(--muted); width:32px; flex-shrink:0; }}
    .tl-bar-bg {{ flex:1; background:#e0d8c8; border-radius:4px; height:8px; overflow:hidden; }}
    .tl-bar {{ height:100%; border-radius:4px; background:var(--brand); }}
    .tl-count {{ font-size:11px; color:var(--muted); width:16px; text-align:right; }}

    /* CONTENT FORMATS */
    .format-tags {{ display:flex; flex-wrap:wrap; gap:6px; margin-top:14px; }}
    .format-tag {{ background:rgba(200,146,42,0.15); color:var(--brand); font-size:11px; font-weight:600; padding:5px 10px; border-radius:20px; }}
    .ft-count {{ opacity:0.7; }}

    /* POSTS GRID */
    .posts-grid {{ display:grid; grid-template-columns:repeat(3,1fr); gap:8px; margin-top:14px; }}
    .post-thumb {{
      position:relative; border-radius:10px; overflow:hidden;
      aspect-ratio:1; display:block; background:#1a1610;
      text-decoration:none; transition:transform 0.2s;
    }}
    .post-thumb:hover {{ transform:scale(1.04); }}
    .post-thumb img {{ width:100%; height:100%; object-fit:cover; display:block; }}
    .post-thumb.img-error {{ background:#2a2010; }}
    .post-thumb.img-error::after {{ content:'📷'; position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:24px; }}
    .pt-overlay {{
      position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
      display:flex; flex-direction:column; justify-content:flex-end; padding:8px;
      opacity:0; transition:opacity 0.2s;
    }}
    .post-thumb:hover .pt-overlay {{ opacity:1; }}
    .pt-day {{ font-size:10px; color:rgba(255,255,255,0.8); }}
    .pt-likes {{ font-size:11px; color:#fff; font-weight:600; }}
    .pt-badge {{ position:absolute; top:8px; right:8px; font-size:12px; }}

    /* TOP POST */
    .tp-img {{ width:100%; border-radius:12px; aspect-ratio:1; object-fit:cover; margin-top:12px; display:block; background:#1a1610; }}
    .post-stats {{ display:flex; gap:12px; margin-top:12px; flex-wrap:wrap; }}
    .ps {{ display:flex; flex-direction:column; }}
    .ps-num {{ font-size:17px; font-weight:700; color:var(--brand); }}
    .ps-label {{ font-size:10px; color:var(--muted); margin-top:2px; }}

    /* SYNOPSIS */
    .synopsis-text {{ font-size:14px; color:#c8a870; line-height:1.65; margin-top:10px; font-style:italic; }}

    /* AI CHAT */
    .chat-wrap {{ display:flex; flex-direction:column; height:260px; }}
    .chat-messages {{ flex:1; overflow-y:auto; padding:4px 0; display:flex; flex-direction:column; gap:8px; }}
    .chat-msg {{ font-size:12px; line-height:1.5; padding:8px 12px; border-radius:10px; max-width:90%; }}
    .chat-msg.ai {{ background:rgba(200,146,42,0.12); color:#c8a870; align-self:flex-start; }}
    .chat-msg.user {{ background:var(--brand); color:#fff; align-self:flex-end; }}
    .chat-input-row {{ display:flex; gap:8px; margin-top:10px; }}
    .chat-input {{
      flex:1; background:rgba(0,0,0,0.3); border:1px solid var(--border);
      border-radius:10px; padding:9px 12px; font-size:12px; color:var(--light);
      font-family:'DM Sans',sans-serif; outline:none;
    }}
    .chat-input:focus {{ border-color:var(--brand); }}
    .chat-send {{
      background:var(--brand); border:none; border-radius:10px;
      padding:9px 14px; color:#fff; font-size:12px; font-weight:600;
      cursor:pointer; font-family:'DM Sans',sans-serif; transition:opacity 0.2s;
    }}
    .chat-send:hover {{ opacity:0.85; }}
    .chat-send:disabled {{ opacity:0.5; cursor:not-allowed; }}
    .typing {{ color:var(--muted); font-size:11px; font-style:italic; padding:4px 0; }}

    /* FOLLOWERS */
    .growth-tag {{ display:inline-block; background:var(--brand); color:#fff; font-size:11px; font-weight:600; padding:4px 10px; border-radius:20px; margin-top:10px; }}

    /* FOOTER */
    .footer {{ text-align:center; padding:20px 0 8px; color:#3a3020; font-size:11px; max-width:1100px; margin:0 auto; }}

    @media(max-width:720px) {{
      .b-hero,.span-5,.span-4,.span-3,.span-6,.span-7,.span-8 {{ grid-column:span 12; }}
    }}
  </style>
</head>
<body>

<div class="grid">

  <!-- HERO -->
  <div class="box b-hero">
    <div class="hero-circle"></div><div class="hero-circle2"></div>
    <div class="label">Activity Report · {month} {year}</div>
    <div class="client-name">{hero_name}</div>
    <div class="handle">@{handle}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.6);max-width:280px;line-height:1.5;">
      {synopsis[:120] + '...' if len(synopsis) > 120 else synopsis}
    </div>
    <div class="cta">Scroll to explore your report →</div>
  </div>

  <!-- SOCIAL POSTS COUNT -->
  <div class="box b-dark span-5">
    <div class="label">Instagram Posts</div>
    <div class="big-num" style="font-size:68px;">{total_posts}</div>
    <div class="sub">posts this month</div>
  </div>

  <!-- FOLLOWERS -->
  <div class="box b-light span-5">
    <div class="label">Followers</div>
    <div class="big-num" style="font-size:52px;">{fmt(followers)}</div>
    <div class="sub">total followers</div>
    <div class="growth-tag">↑ {eng_rate} engagement</div>
  </div>

  <!-- CONTENT FORMATS -->
  <div class="box b-dark span-4">
    <div class="label">Content Formats Used</div>
    <div class="big-num" style="font-size:42px;">{len(content_types)}+</div>
    <div class="format-tags">{format_tags}</div>
  </div>

  <!-- CALENDAR -->
  <div class="box b-dark span-5">
    <div class="label">Posting Calendar</div>
    <div class="cal-title">{month} {year}</div>
    <div class="cal-sub">{len(active_days)} active days</div>
    <div class="cal-header">
      <div class="cal-h">M</div><div class="cal-h">T</div><div class="cal-h">W</div>
      <div class="cal-h">T</div><div class="cal-h">F</div><div class="cal-h">S</div><div class="cal-h">S</div>
    </div>
    <div class="cal-grid">{cal_cells}</div>
  </div>

  <!-- TIMELINE -->
  <div class="box b-light span-7">
    <div class="label">Post Timeline</div>
    <div style="font-family:'Syne',sans-serif;font-weight:700;font-size:18px;color:#2a1f0a;margin-bottom:4px;">Weekly Breakdown</div>
    <div style="font-size:11px;color:var(--muted);margin-bottom:14px;">{total_posts} posts across {len(active_days)} days</div>
    {weekly_html}
    <div style="margin-top:14px;padding-top:12px;border-top:1px solid #e0d8c8;">
      <div style="font-size:11px;color:#a08050;margin-bottom:6px;">Reach trend</div>
      <svg width="100%" height="40" viewBox="0 0 300 40">
        <polyline points="0,34 60,26 120,16 180,22 240,8 300,12"
          fill="none" stroke="{brand_color}" stroke-width="2.5" stroke-linecap="round"/>
        <polyline points="0,34 60,26 120,16 180,22 240,8 300,12 300,40 0,40"
          fill="{brand_color}" fill-opacity="0.12" stroke="none"/>
        <circle cx="240" cy="8" r="4" fill="{brand_color}"/>
      </svg>
    </div>
  </div>

  <!-- POSTS GRID (actual Instagram posts) -->
  <div class="box b-dark span-6">
    <div class="label">📸 {month} Posts — Instagram Mirror</div>
    <div style="font-size:11px;color:var(--muted);margin-top:2px;">{total_posts} posts · tap to view on Instagram</div>
    <div class="posts-grid">{posts_grid}</div>
  </div>

  <!-- TOP POST -->
  <div class="box b-dark span-6">
    <div class="label">⭐ Top Post This Month</div>
    <div style="font-size:13px;color:#d4a855;margin-top:6px;line-height:1.45;">"{tp_caption}"</div>
    <a href="{tp_link}" target="_blank">
      <img class="tp-img" src="{top_post.get('media_url','')}" alt="Top post"
           onerror="this.style.display='none'" />
    </a>
    <div class="post-stats">
      <div class="ps"><div class="ps-num">{top_post.get('impressions','—')}</div><div class="ps-label">Impressions</div></div>
      <div class="ps"><div class="ps-num">{top_post.get('likes','—')}</div><div class="ps-label">Likes</div></div>
      <div class="ps"><div class="ps-num">{top_post.get('saves','—')}</div><div class="ps-label">Saves</div></div>
      <div class="ps"><div class="ps-num">{top_post.get('comments','—')}</div><div class="ps-label">Comments</div></div>
    </div>
  </div>

  {paid_section}

  <!-- SYNOPSIS -->
  <div class="box b-dark span-6">
    <div class="label">✦ AI Synopsis</div>
    <div class="synopsis-text">{synopsis}</div>
  </div>

  <!-- AI CHAT -->
  <div class="box b-dark span-6">
    <div class="label">🤖 Ask AI About This Report</div>
    <div class="chat-wrap">
      <div class="chat-messages" id="chatMessages">
        <div class="chat-msg ai">Hi! I know everything about {client_name}'s {month} performance. Ask me anything — best post, strategy, what to improve...</div>
      </div>
      <div id="typingIndicator" class="typing" style="display:none;">AI is thinking...</div>
      <div class="chat-input-row">
        <input class="chat-input" id="chatInput" placeholder="e.g. Which post did best?" onkeydown="if(event.key==='Enter')sendChat()" />
        <button class="chat-send" id="chatSend" onclick="sendChat()">Send</button>
      </div>
    </div>
  </div>

</div>

<div class="footer">{client_name} · {month} {year} · Generated by Canit Pulse</div>

<script>
  const REPORT_ID = "{report_id}";
  let chatHistory = [];

  async function sendChat() {{
    const input = document.getElementById('chatInput');
    const q = input.value.trim();
    if (!q) return;

    input.value = '';
    addMsg(q, 'user');
    chatHistory.push({{role:'user', content:q}});

    document.getElementById('chatSend').disabled = true;
    document.getElementById('typingIndicator').style.display = 'block';
    scrollChat();

    try {{
      const res = await fetch(`/api/reports/${{REPORT_ID}}/chat`, {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (localStorage.getItem('token') || '')}},
        body: JSON.stringify({{question: q, history: chatHistory}})
      }});
      const data = await res.json();
      const answer = data.answer || 'Sorry, I could not answer that.';
      addMsg(answer, 'ai');
      chatHistory.push({{role:'assistant', content:answer}});
    }} catch(e) {{
      addMsg('Connection error. Please try again.', 'ai');
    }} finally {{
      document.getElementById('chatSend').disabled = false;
      document.getElementById('typingIndicator').style.display = 'none';
      scrollChat();
    }}
  }}

  function addMsg(text, role) {{
    const div = document.createElement('div');
    div.className = `chat-msg ${{role}}`;
    div.textContent = text;
    document.getElementById('chatMessages').appendChild(div);
    scrollChat();
  }}

  function scrollChat() {{
    const el = document.getElementById('chatMessages');
    el.scrollTop = el.scrollHeight;
  }}
</script>
</body>
</html>"""
