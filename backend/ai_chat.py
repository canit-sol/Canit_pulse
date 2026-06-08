"""
AI Synopsis generator + AI chat interface for report data.
Uses Groq (free) — swap to Anthropic when key arrives.
"""
import os
import json
from groq import Groq
from dotenv import load_dotenv, find_dotenv

load_dotenv(find_dotenv(), override=True)

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL  = "llama-3.3-70b-versatile"


def generate_synopsis(report_data: dict, instagram_data: dict, facebook_data: dict = None) -> str:
    """
    Generate a 3-4 sentence AI written synopsis of the month's performance.
    Honest, insightful, written like a real marketing analyst.
    """
    month  = report_data.get("month", "")
    year   = report_data.get("year", "")
    client_name = report_data.get("client_name", "the client")

    fb = facebook_data or {}
    fb_section = ""
    if fb.get("status") == "success":
        fb_section = f"""
Facebook Data:
- Total posts: {fb.get('total_posts', 0)}
- Total reach: {fb.get('total_reach', 'N/A')}
- Total impressions: {fb.get('total_impressions', 'N/A')}
- Engagement rate: {fb.get('engagement_rate', 'N/A')}
- Total reactions: {fb.get('total_reactions', 0)}
- Total comments: {fb.get('total_comments', 0)}
- Total shares: {fb.get('total_shares', 0)}
- Followers: {fb.get('followers', 0)}
"""

    prompt = f"""You are a senior digital marketing analyst writing a monthly performance synopsis.

Client: {client_name}
Month: {month} {year}

Instagram Data:
- Total posts: {instagram_data.get('total_posts', 0)}
- Active posting days: {len(instagram_data.get('active_days', []))}
- Total reach: {instagram_data.get('total_reach', 'N/A')}
- Total impressions: {instagram_data.get('total_impressions', 'N/A')}
- Engagement rate: {instagram_data.get('engagement_rate', 'N/A')}
- Total likes: {instagram_data.get('total_likes', 0)}
- Total saves: {instagram_data.get('total_saves', 0)}
- Total comments: {instagram_data.get('total_comments', 0)}
- Followers: {instagram_data.get('followers', 0)}
- Content types used: {', '.join(instagram_data.get('content_types', []))}
- Top post: "{instagram_data.get('top_post', {}).get('caption', '')[:100]}"
- Weekly breakdown: {instagram_data.get('weekly_posts', [])}
{fb_section}
Write a 3-4 sentence professional synopsis covering all connected platforms. Be specific with numbers. Mention what worked well, what the posting consistency was like, and one forward-looking insight. 
Do NOT use bullet points. Write in flowing prose. Keep it under 80 words. Sound like a real analyst, not an AI."""

    res = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=200,
    )
    return res.choices[0].message.content.strip()


def chat_with_report(question: str, report_data: dict, platform_data: dict, history: list, context_str: str = None) -> str:
    """
    Answer questions about the report data.
    history = list of {"role": "user"/"assistant", "content": "..."}
    """
    client_name = report_data.get("client_name", "the client")
    month = report_data.get("month", "")
    year  = report_data.get("year", "")

    system = f"""You are an AI marketing assistant for {client_name}'s {month} {year} report.
You have access to their complete performance data for this month.

{context_str if context_str else ""}

DATA:
- Total posts: {platform_data.get('total_posts', 0)}
- Active days: {platform_data.get('active_days', [])}
- Total reach: {platform_data.get('reach') or platform_data.get('total_reach')}
- Total impressions: {platform_data.get('impressions') or platform_data.get('total_impressions')}
- Engagement rate: {platform_data.get('engagement_rate')}
- Likes/Reactions: {platform_data.get('reactions') or platform_data.get('total_likes') or platform_data.get('likes')}
- Saves/Shares: {platform_data.get('shares') or platform_data.get('total_saves') or platform_data.get('saves')}
- Comments: {platform_data.get('total_comments') or platform_data.get('comments')}
- Followers: {platform_data.get('followers_count') or platform_data.get('followers') or platform_data.get('fan_count')}
- Content types: {platform_data.get('type_counts', {})}
- Weekly posts: {platform_data.get('weekly_posts', [])}
- Top post: "{platform_data.get('top_post', {}).get('caption', '')[:100]}" — {platform_data.get('top_post', {}).get('impressions') or platform_data.get('top_post', {}).get('reach')} impressions/reach

Answer questions about this data. Be concise, specific, and helpful.
If asked for strategy, give real actionable advice based on what the numbers show.
Keep answers under 60 words unless a detailed breakdown is asked for."""

    messages = [{"role": "system", "content": system}]
    # Add conversation history (last 6 messages)
    for h in history[-6:]:
        messages.append(h)
    messages.append({"role": "user", "content": question})

    res = client.chat.completions.create(
        model=MODEL,
        messages=messages,
        temperature=0.6,
        max_tokens=300,
    )
    return res.choices[0].message.content.strip()
