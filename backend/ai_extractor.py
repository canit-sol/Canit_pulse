"""
Uses Groq (free, fast) to extract structured report data from raw text.
Swap GROQ_API_KEY in your .env file.
"""
import os
import json
import re
import time
from urllib import response
import time
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
        model="qwen/qwen3.6-27b",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        temperature=0.2,
        max_tokens=2000,
    )

    raw_response = response.choices[0].message.content.strip()

    print("\n========== GROQ SEO RESPONSE ==========")
    print(raw_response)
    print("=======================================\n")

    # Clean up if model wraps in backticks anyway
    raw_response = re.sub(r"^```json\s*", "", raw_response)
    raw_response = re.sub(r"^```\s*", "", raw_response)
    raw_response = re.sub(r"\s*```$", "", raw_response)

    try:
        data = json.loads(raw_response)
    except json.JSONDecodeError as e:
        print("\n========== JSON PARSE ERROR ==========")
        print(str(e))
        print("=====================================\n")

    # Try to extract JSON from the response
    match = re.search(r'\{.*\}', raw_response, re.DOTALL)

    if match:
        json_text = match.group()

        print("\n========== RECOVERED JSON ==========")
        print(json_text)
        print("===================================\n")

        data = json.loads(json_text)
    else:
        raise ValueError("AI did not return valid JSON for SEO metrics.")
    # Override with user-provided values
    data["client_name"] = client_name
    data["month"] = month
    data["year"] = year

    return data


SEO_SYSTEM_PROMPT = """You are an expert SEO auditor and data extractor.
Your job is to read raw text from an uploaded SEO PDF report and extract key search marketing metrics.
Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.

Extract the following structure exactly (use null or reasonable numeric defaults like 0 / 0.0 if not found, never output unquoted N/A):
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
- If any value or metric is not found in the text, use null (or 0 / 0.0 for numbers) instead of writing N/A. Never output raw, unquoted N/A.
"""

def extract_seo_pdf_data(raw_text: str) -> dict:
    prompt = f"""Extract structured SEO report data from this raw text.

RAW TEXT:
---
{raw_text[:4000]}
---

Return ONLY the JSON structure as specified. No other text."""

    max_retries = 3
    delay = 1.0
    response = None
    last_err = None

    for attempt in range(max_retries):
        try:
            # Using JSON mode to guarantee valid JSON structure from Groq
            response = client.chat.completions.create(
                model="openai/gpt-oss-20b",
                messages=[
                    {"role": "system", "content": SEO_SYSTEM_PROMPT},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            break
        except Exception as e:
            last_err = e
            # Detect Rate Limit (429) errors
            is_429 = False
            err_class = e.__class__.__name__
            if "RateLimit" in err_class or "RateLimitError" in err_class:
                is_429 = True
            elif hasattr(e, "status_code") and e.status_code == 429:
                is_429 = True
            elif "429" in str(e):
                is_429 = True

            if is_429 and attempt < max_retries - 1:
                print(f"[Groq Client] 429 Rate Limit encountered. Retrying in {delay}s...")
                time.sleep(delay)
                delay *= 2
            else:
                break

    if response is None:
        is_429 = False
        if last_err:
            err_class = last_err.__class__.__name__
            if "RateLimit" in err_class or "RateLimitError" in err_class:
                is_429 = True
            elif hasattr(last_err, "status_code") and last_err.status_code == 429:
                is_429 = True
            elif "429" in str(last_err):
                is_429 = True

        if is_429:
            raise ValueError("The SEO analysis service is temporarily busy due to rate limits. Please wait a moment and try again.")
        else:
            raise ValueError(f"Failed to extract SEO metrics due to an AI service error: {str(last_err)}")

    raw_response = response.choices[0].message.content.strip()

    print("\n========== GROQ SEO RESPONSE ==========")
    print(raw_response)
    print("=======================================\n")

    # Clean up and sanitize the JSON string to fix common syntax errors (e.g. unquoted N/A)
    clean_response = raw_response
    clean_response = re.sub(r"^```json\s*", "", clean_response, flags=re.IGNORECASE)
    clean_response = re.sub(r"^```\s*", "", clean_response, flags=re.IGNORECASE)
    clean_response = re.sub(r"\s*```$", "", clean_response)
    clean_response = clean_response.strip()

    # Replace unquoted N/A, None, NaN, undefined values with null to keep JSON parseable
    clean_response = re.sub(r':\s*\bN/A\b', ': null', clean_response, flags=re.IGNORECASE)
    clean_response = re.sub(r':\s*\bNone\b', ': null', clean_response)
    clean_response = re.sub(r':\s*\bNaN\b', ': null', clean_response)
    clean_response = re.sub(r':\s*\bundefined\b', ': null', clean_response)

    # Fix trailing commas
    clean_response = re.sub(r',\s*\}', '}', clean_response)
    clean_response = re.sub(r',\s*\]', ']', clean_response)

    try:
        data = json.loads(clean_response)

    except json.JSONDecodeError as e:
        print("\n========== JSON PARSE ERROR ==========")
        print(str(e))
        print("======================================\n")

        match = re.search(r'\{.*\}', clean_response, re.DOTALL)

        if match:
            json_text = match.group()
            
            # Re-sanitize the recovered group
            json_text = re.sub(r':\s*\bN/A\b', ': null', json_text, flags=re.IGNORECASE)
            json_text = re.sub(r':\s*\bNone\b', ': null', json_text)
            json_text = re.sub(r':\s*\bNaN\b', ': null', json_text)

            print("\n========== RECOVERED JSON ==========")
            print(json_text)
            print("====================================\n")

            try:
                data = json.loads(json_text)
            except Exception as e_inner:
                print(f"[Sanitizer] Failed to parse recovered JSON: {e_inner}")
                raise ValueError(f"AI returned invalid JSON: {raw_response[:500]}")

        else:
            print("\n========== RAW RESPONSE ==========")
            print(raw_response)
            print("==================================\n")

            raise ValueError(
                f"AI returned invalid JSON: {raw_response[:500]}"
            )
            
    # Ensure all keys exist with correct coerced types to prevent frontend crashes
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
    
    coerced_data = {}
    for key, default_val in schema_defaults.items():
        val = data.get(key)
        if val is None or val == "N/A" or val == "n/a" or val == "None":
            coerced_data[key] = default_val
        else:
            try:
                if isinstance(default_val, int):
                    coerced_data[key] = int(float(str(val).replace(",", "").strip()))
                elif isinstance(default_val, float):
                    coerced_data[key] = float(str(val).replace("%", "").replace(",", "").strip())
                elif isinstance(default_val, list):
                    if isinstance(val, list):
                        if key == "keyword_rankings":
                            cleaned_list = []
                            for item in val:
                                if isinstance(item, dict):
                                    cleaned_list.append({
                                        "keyword": str(item.get("keyword", "N/A")),
                                        "position": int(float(str(item.get("position", 0)).replace(",", "").strip())) if item.get("position") is not None else 0,
                                        "change": str(item.get("change", "0"))
                                    })
                            coerced_data[key] = cleaned_list
                        else:
                            coerced_data[key] = val
                    else:
                        coerced_data[key] = default_val
                else:
                    coerced_data[key] = val
            except Exception:
                coerced_data[key] = default_val

    return coerced_data