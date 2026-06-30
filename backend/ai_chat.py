"""
AI Synopsis generator + AI chat interface for report data.
Uses Groq for synopsis, Gemini for chat.
"""
import os
import json
from typing import Optional
from groq import Groq
from google import genai
from google.genai import types
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
GROQ_MODEL  = "qwen/qwen3.6-27b"

gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
GEMINI_MODEL = "gemini-2.5-flash"

# Simple counter for Gemini chat API calls (resets on server restart)
gemini_chat_calls = 0


def generate_synopsis(report_data: dict, instagram_data: dict, facebook_data: Optional[dict] = None) -> str:
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

    res = groq_client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=200,
    )
    return res.choices[0].message.content.strip() if res.choices[0].message.content else ""


def chat_with_report(question: str, report_data: dict, platform_data: dict, history: list, context_str: Optional[str] = None) -> str:
    """
    Answer questions about the report data.
    history = list of {"role": "user"/"assistant", "content": "..."}
    """
    global gemini_chat_calls
    gemini_chat_calls += 1
    client_name = report_data.get("client_name", "the client")
    month = report_data.get("month", "")
    year  = report_data.get("year", "")

    system = f"""You are a senior social media strategist analyzing {client_name}'s {month} {year} report.

{context_str if context_str else ""}

Use the data above to answer questions directly. Keep responses natural and conversational — avoid repeating the same structure every time. Match the tone and depth to what the user asked. If they ask a specific question, give a specific answer. If they ask for a broad analysis, give a structured breakdown. Always cite numbers from the data."""

    contents = []
    for h in history[-6:]:
        role = "user" if h["role"] == "user" else "model"
        contents.append(types.Content(role=role, parts=[types.Part.from_text(text=h["content"])]))
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=question)]))

    res = gemini_client.models.generate_content(
        model=GEMINI_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            systemInstruction=system,
            temperature=0.6,
        ),
    )
    try:
        return res.text.strip() if res.text else ""
    except (ValueError, AttributeError):
        return ""
