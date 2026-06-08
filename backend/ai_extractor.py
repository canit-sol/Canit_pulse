"""
Uses Groq (free, fast) to extract structured report data from raw text.
Swap GROQ_API_KEY in your .env file.
"""
import os
import json
import re
from groq import Groq
from dotenv import load_dotenv, find_dotenv
load_dotenv(find_dotenv(), override=True)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """You are a digital marketing report data extractor.
Your job is to read raw report notes and extract structured data for a bento-style visual report.
Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.

Extract the following structure exactly:
{
  "client_name": "string",
  "month": "string",
  "year": "string",
  "tagline": "one sentence summary of the month",
  "metrics": [
    {"label": "Social Posts", "value": "11", "unit": "posting days", "icon": ""},
    {"label": "Blogs Written", "value": "3", "unit": "articles", "icon": ""}
  ],
  "platforms": [
    {"name": "Instagram", "percentage": 54},
    {"name": "LinkedIn", "percentage": 28}
  ],
  "content_formats": ["Reels", "Carousels", "Stories", "Static", "Blogs"],
  "top_post": {
    "title": "post title or headline",
    "impressions": "3.2K",
    "likes": "312",
    "saves": "87",
    "shares": "42"
  },
  "weekly_posts": [
    {"week": "Wk 1", "count": 3},
    {"week": "Wk 2", "count": 4},
    {"week": "Wk 3", "count": 3},
    {"week": "Wk 4", "count": 1}
  ],
  "active_days": [2,4,6,8,10,11,13,16,18,19,21,22,24,26,27,30,31],
  "follower_growth": "+247",
  "follower_growth_pct": "+12.4%",
  "engagement_rate": "8.3%",
  "total_reach": "24.6K",
  "highlights": ["key win 1", "key win 2", "key win 3"],
  "next_month_goals": ["goal 1", "goal 2"]
}

Rules:
- If a value is not found in the text, make a reasonable inference or use "N/A"
- Always output percentages as numbers (not strings) for platforms
- Keep metric values as strings with K/M formatting where appropriate
- Extract ALL numeric data you can find — impressions, reach, engagement, followers, posts, blogs, videos, saves, shares, comments
- active_days should be an array of day numbers (1-31) when posts were made
"""

def extract_report_data(raw_text: str, client_name: str, month: str, year: str) -> dict:
    prompt = f"""Extract structured report data from these raw notes.

Client: {client_name}
Month: {month} {year}

RAW REPORT NOTES:
---
{raw_text[:6000]}
---

Return ONLY the JSON structure as specified. No other text."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=2000,
    )

    raw_response = response.choices[0].message.content.strip()

    # Clean up if model wraps in backticks anyway
    raw_response = re.sub(r"^```json\s*", "", raw_response)
    raw_response = re.sub(r"^```\s*", "", raw_response)
    raw_response = re.sub(r"\s*```$", "", raw_response)

    try:
        data = json.loads(raw_response)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise ValueError("AI did not return valid JSON. Check your Groq API key and try again.")

    # Override with user-provided values
    data["client_name"] = client_name
    data["month"] = month
    data["year"] = year

    return data


SEO_SYSTEM_PROMPT = """You are an expert SEO auditor and data extractor.
Your job is to read raw text from an uploaded SEO PDF report and extract key search marketing metrics.
Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.

Extract the following structure exactly (use N/A or reasonable numeric defaults like 0 / 0.0 if not found):
{
  "sessions": 26981,
  "users": 21843,
  "new_users": 19500,
  "bounce_rate": 68.5,
  "key_events": 150,
  "avg_position": 4.2,
  "impressions": 125000,
  "clicks": 4500,
  "ctr": 3.6,
  "keyword_rankings": [
    {"keyword": "example keyword", "position": 1, "change": "+2"},
    {"keyword": "another keyword", "position": 5, "change": "-1"}
  ],
  "backlinks": 240,
  "recommendations": [
    "recommendation 1",
    "recommendation 2"
  ],
  "indexed_pages": 48,
  "top_keywords": ["keyword 1", "keyword 2"],
  "traffic_growth": 14.5,
  "traffic_source_trends": [
    {"date": "2024-01", "organic_search": 1200, "direct": 400, "organic_social": 100, "referral": 50}
  ],
  "acquisition_table": [
    {"channel": "Organic Search", "users": 15000, "new_users": 14000, "sessions": 16000, "avg_session_duration": 132.41, "bounce_rate": 45.2}
  ],
  "search_trends": [
    {"date": "2024-01", "clicks": 200, "impressions": 5000}
  ]
}

Rules:
- sessions must be an integer.
- users must be an integer.
- new_users must be an integer.
- bounce_rate must be a float (e.g. 68.5 for 68.5%).
- key_events must be an integer.
- avg_position must be a float.
- impressions must be an integer.
- clicks must be an integer.
- ctr must be a float (e.g. 3.6 for 3.6%).
- keyword_rankings must be a list of dicts with 'keyword' (str), 'position' (int), and 'change' (str, e.g. "+3", "-1", "0"). Include up to 3-5 top rankings.
- backlinks must be an integer.
- recommendations must be a list of actionable strings (minimum 2, maximum 4).
- indexed_pages must be an integer.
- top_keywords must be a list of strings representing the top search terms.
- traffic_growth must be a float (representing organic traffic growth percentage, e.g. 14.5 for 14.5%).
- traffic_source_trends must be a list of dicts mapping 'date' (str, e.g. month or day) to channel names with integer values (e.g. 'organic_search': 1200). Extrapolate time series data if available.
- acquisition_table must be a list of dicts mapping 'channel' (str), 'users' (int), 'new_users' (int), 'sessions' (int), 'avg_session_duration' (float), and 'bounce_rate' (float).
- search_trends must be a list of dicts mapping 'date' (str), 'clicks' (int), and 'impressions' (int). Extrapolate time series data if available.
"""

def extract_seo_pdf_data(raw_text: str) -> dict:
    prompt = f"""Extract structured SEO report data from this raw text.

RAW TEXT:
---
{raw_text[:8000]}
---

Return ONLY the JSON structure as specified. No other text."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SEO_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=2000,
    )

    raw_response = response.choices[0].message.content.strip()

    # Clean up if model wraps in backticks anyway
    raw_response = re.sub(r"^```json\s*", "", raw_response)
    raw_response = re.sub(r"^```\s*", "", raw_response)
    raw_response = re.sub(r"\s*```$", "", raw_response)

    try:
        data = json.loads(raw_response)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        match = re.search(r'\{.*\}', raw_response, re.DOTALL)
        if match:
            data = json.loads(match.group())
        else:
            raise ValueError("AI did not return valid JSON for SEO metrics.")
            
    # Ensure all keys exist with fallback defaults to prevent frontend crashes
    schema_defaults = {
        "sessions": 0,
        "users": 0,
        "new_users": 0,
        "bounce_rate": 0.0,
        "key_events": 0,
        "avg_position": 0.0,
        "impressions": 0,
        "clicks": 0,
        "ctr": 0.0,
        "keyword_rankings": [],
        "backlinks": 0,
        "recommendations": [],
        "indexed_pages": 0,
        "top_keywords": [],
        "traffic_growth": 0.0,
        "traffic_source_trends": [],
        "acquisition_table": [],
        "search_trends": []
    }
    for key, val in schema_defaults.items():
        if key not in data or data[key] is None:
            data[key] = val
            
    return data

