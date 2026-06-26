import os
import json
import re
import time
from typing import Dict, List
from groq import Groq
from dotenv import load_dotenv, find_dotenv
from public_fetcher import fetch_public_profile
load_dotenv(find_dotenv(), override=True)

# Simple 24-hour caching mechanism to protect API rate limits
_COMPETITORS_CACHE: Dict[str, Dict] = {}
CACHE_DURATION_SECS = 24 * 60 * 60

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        return Groq(api_key=api_key)
    except Exception as e:
        print("competitor_intelligence: Failed to initialize Groq client:", e)
        return None

def fetch_automatic_competitors(client_handle: str, industry: str) -> dict:
    now = time.time()
    sanitized_handle = client_handle.strip().lstrip("@")
    sanitized_industry = industry.strip()
    cache_key = f"{sanitized_handle.lower()}:{sanitized_industry.lower()}"
    
    if cache_key in _COMPETITORS_CACHE:
        entry = _COMPETITORS_CACHE[cache_key]
        if now - entry["timestamp"] < CACHE_DURATION_SECS:
            print(f"competitor_intelligence: Serving cached results for '{sanitized_handle}'")
            return entry["data"]
            
    print(f"competitor_intelligence: Running automatic analysis for '{sanitized_handle}' in '{sanitized_industry}'")
    
    client = get_groq_client()
    if not client:
        print("competitor_intelligence: GROQ_API_KEY is not configured. Serving dynamic fallback data.")
        fallback_data = generate_mock_competitor_intelligence(sanitized_handle, sanitized_industry)
        return fallback_data

    # Step 1: Discover top 3 competitor handles using Llama
    discovery_system_prompt = """You are a senior social intelligence analyst.
Your job is to discover exactly 3 similar, real-world competitor brands or public accounts on Instagram based on a client's handle and industry.
Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.

Example JSON Output format:
{
  "niche_analysis": "Provide a 2-sentence summary analyzing the client's industry niche and content ecosystem.",
  "competitors": [
    {
      "handle": "instagram_handle_1",
      "name": "Brand Name 1",
      "style_summary": "Short 1-sentence description of their content style and visual approach."
    },
    {
      "handle": "instagram_handle_2",
      "name": "Brand Name 2",
      "style_summary": "Short 1-sentence description."
    },
    {
      "handle": "instagram_handle_3",
      "name": "Brand Name 3",
      "style_summary": "Short 1-sentence description."
    }
  ]
}

Rules:
1. Handles must be realistic Instagram usernames (lowercase, alphanumeric, periods/underscores, no @ prefix).
2. The brands must be real and highly relevant to the specified industry. E.g., if Wellness: brands like @yoga_journal, @mindbodygreen, @headspace, @lululemon.
"""
    
    discovery_user_prompt = f"""Discover exactly 3 Instagram competitors for:
Client Handle: @{sanitized_handle}
Client Industry: {sanitized_industry}

Analyze the client's niche and output exactly 3 relevant competitor profiles in the specified JSON format.
"""
    
    try:
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": discovery_system_prompt},
                {"role": "user", "content": discovery_user_prompt}
            ],
            temperature=0.4,
            max_tokens=600,
        )
        raw_res = res.choices[0].message.content.strip()
        raw_res = re.sub(r"^```json\s*", "", raw_res)
        raw_res = re.sub(r"^```\s*", "", raw_res)
        raw_res = re.sub(r"\s*```$", "", raw_res)
        
        try:
            discovery_data = json.loads(raw_res)
        except Exception:
            match = re.search(r'\{.*\}', raw_res, re.DOTALL)
            if match:
                discovery_data = json.loads(match.group())
            else:
                raise ValueError("JSON parsing failed")
    except Exception as e:
        print("competitor_intelligence discovery error, falling back to mock:", e)
        fallback_data = generate_mock_competitor_intelligence(sanitized_handle, sanitized_industry)
        return fallback_data

    niche_analysis = discovery_data.get("niche_analysis", f"Focuses on premium {sanitized_industry} audience engagement.")
    discovered_comps = discovery_data.get("competitors", [])
    if len(discovered_comps) < 3:
        discovered_comps = get_default_competitors(sanitized_industry)

    # Step 2: Fetch public activity signals (followers, following, posts) for client and competitors
    client_profile = fetch_public_profile(sanitized_handle)
    comp_profiles = []
    for c in discovered_comps:
        c_handle = c.get("handle", "").strip().lstrip("@")
        profile = fetch_public_profile(c_handle)
        profile["name"] = c.get("name", profile.get("name", c_handle))
        profile["style_summary"] = c.get("style_summary", "Shares visual updates and interactive social campaigns.")
        comp_profiles.append(profile)

    # Step 3: Use LLM to generate AI-inferred comparative social-content behavior metrics
    comparison_system_prompt = """You are a senior social intelligence engine.
Your task is to generate highly realistic, comparative social-content behavior metrics and tactical notes for a client and their top 3 competitors.
Always respond with ONLY valid JSON — no markdown, no explanation, no backticks.

Compare ONLY these 5 social-content behaviors:
- posting_consistency: Frequency and schedule consistency (score 0-100)
- engagement_behavior: Interactivity, replies, and community metrics (score 0-100)
- reel_usage: Frequency and creativity of reels/video formats (score 0-100)
- content_activity: Overall weekly content output volume (score 0-100)
- virality_estimation: Propensity of posts to hit explore page or trend (score 0-100)

Do NOT compare SEO, ads, websites, business revenue, or financial data. This is a social-content platform.

Standard Output JSON Structure:
{
  "comparison_metrics": {
    "posting_consistency": {
      "client": {"score": 75, "note": "Weekly postings are consistent but lack weekend coverage."},
      "competitor1": {"score": 88, "note": "Daily structured postings with high predictability."},
      "competitor2": {"score": 62, "note": "Infrequent but high-quality thematic drop series."},
      "competitor3": {"score": 92, "note": "High-frequency multi-daily automated feed pushes."}
    },
    "engagement_behavior": {
      "client": {"score": 80, "note": "Strong audience interaction in comment threads."},
      "competitor1": {"score": 70, "note": "Mainly broadcasts with moderate dialogue."},
      "competitor2": {"score": 85, "note": "Excellent comment response speed and community vibe."},
      "competitor3": {"score": 60, "note": "Standard corporate broadcast profile."}
    },
    "reel_usage": {
      "client": {"score": 65, "note": "Utilizes reels occasionally; needs trend alignment."},
      "competitor1": {"score": 90, "note": "Reel-first visual focus utilizing viral sound bytes."},
      "competitor2": {"score": 80, "note": "Highly polished instructional videos and guides."},
      "competitor3": {"score": 50, "note": "Relies mostly on static carousels and graphic sheets."}
    },
    "content_activity": {
      "client": {"score": 70, "note": "Steady activity level, averaging 3-4 posts per week."},
      "competitor1": {"score": 95, "note": "Extremely active daily calendar scheduling."},
      "competitor2": {"score": 55, "note": "Low output volume focusing on boutique items."},
      "competitor3": {"score": 88, "note": "Aggressive cross-channel posting consistency."}
    },
    "virality_estimation": {
      "client": {"score": 58, "note": "Moderate shareability, mostly localized reach."},
      "competitor1": {"score": 85, "note": "High organic discovery driven by aesthetic reels."},
      "competitor2": {"score": 90, "note": "Niche authority content yielding frequent saves."},
      "competitor3": {"score": 70, "note": "Medium virality reliant on large follower seed base."}
    }
  },
  "niche_ecosystem_analysis": "Comprehensive 3-sentence summary of the overall competitive social landscape in this niche, highlighting current trends and strategic opportunities for the client."
}

Rules:
1. Ensure the scores are realistic based on the followers, post counts, and engagement rate provided. E.g., if a competitor has massive followers and high post counts, they should score higher in content_activity/virality.
2. The labels under comparison_metrics MUST correspond to the exact handles passed. E.g. 'client', 'competitor1', 'competitor2', 'competitor3'.
3. Keep scores strictly as integers between 0 and 100.
"""

    comparison_user_prompt = f"""Generate comparative social-content metrics for:

1. Client Profile (Label: 'client')
- Handle: @{sanitized_handle}
- Followers: {client_profile.get('followers')}
- Post Count: {client_profile.get('post_count')}
- Source: {client_profile.get('source')}

2. Competitor 1 (Label: 'competitor1')
- Handle: @{comp_profiles[0].get('handle')}
- Name: {comp_profiles[0].get('name')}
- Followers: {comp_profiles[0].get('followers')}
- Post Count: {comp_profiles[0].get('post_count')}
- Style: {comp_profiles[0].get('style_summary')}

3. Competitor 2 (Label: 'competitor2')
- Handle: @{comp_profiles[1].get('handle')}
- Name: {comp_profiles[1].get('name')}
- Followers: {comp_profiles[1].get('followers')}
- Post Count: {comp_profiles[1].get('post_count')}
- Style: {comp_profiles[1].get('style_summary')}

4. Competitor 3 (Label: 'competitor3')
- Handle: @{comp_profiles[2].get('handle')}
- Name: {comp_profiles[2].get('name')}
- Followers: {comp_profiles[2].get('followers')}
- Post Count: {comp_profiles[2].get('post_count')}
- Style: {comp_profiles[2].get('style_summary')}

Output ONLY valid JSON according to the specified structure.
"""

    try:
        res = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": comparison_system_prompt},
                {"role": "user", "content": comparison_user_prompt}
            ],
            temperature=0.3,
            max_tokens=1500,
        )
        raw_res = res.choices[0].message.content.strip()
        raw_res = re.sub(r"^```json\s*", "", raw_res)
        raw_res = re.sub(r"^```\s*", "", raw_res)
        raw_res = re.sub(r"\s*```$", "", raw_res)
        
        try:
            comparison_data = json.loads(raw_res)
        except Exception:
            match = re.search(r'\{.*\}', raw_res, re.DOTALL)
            if match:
                comparison_data = json.loads(match.group())
            else:
                raise ValueError("JSON parsing failed")
                
    except Exception as e:
        print("competitor_intelligence metrics generation failed, falling back to mock:", e)
        fallback_data = generate_mock_competitor_intelligence(sanitized_handle, sanitized_industry, client_profile, comp_profiles, niche_analysis)
        return fallback_data

    # Standardize result object
    result = {
        "client": {
            "handle": sanitized_handle,
            "name": client_profile.get("name", sanitized_handle.title()),
            "followers": client_profile.get("followers", 0),
            "posts": client_profile.get("post_count", 0),
            "engagement_score": client_profile.get("engagement_score", 0),
        },
        "competitors": [
            {
                "handle": comp_profiles[0].get("handle"),
                "name": comp_profiles[0].get("name"),
                "style_summary": comp_profiles[0].get("style_summary"),
                "key": "competitor1"
            },
            {
                "handle": comp_profiles[1].get("handle"),
                "name": comp_profiles[1].get("name"),
                "style_summary": comp_profiles[1].get("style_summary"),
                "key": "competitor2"
            },
            {
                "handle": comp_profiles[2].get("handle"),
                "name": comp_profiles[2].get("name"),
                "style_summary": comp_profiles[2].get("style_summary"),
                "key": "competitor3"
            }
        ],
        "metrics": comparison_data.get("comparison_metrics", {}),
        "niche_ecosystem_analysis": comparison_data.get("niche_ecosystem_analysis", niche_analysis)
    }

    _COMPETITORS_CACHE[cache_key] = {
        "timestamp": now,
        "data": result
    }
    
    return result

def get_default_competitors(industry: str) -> list:
    ind_lower = industry.lower()
    if "wellness" in ind_lower or "health" in ind_lower:
        return [
            {"handle": "headspace", "name": "Headspace", "style_summary": "Shares clean visual illustrations and mindfulness tips."},
            {"handle": "mindbodygreen", "name": "MindBodyGreen", "style_summary": "Wellness lifestyle hub with high-quality quote carousels."},
            {"handle": "yoga_journal", "name": "Yoga Journal", "style_summary": "Focuses on instructional poses and premium video guides."}
        ]
    elif "tech" in ind_lower or "software" in ind_lower:
        return [
            {"handle": "techcrunch", "name": "TechCrunch", "style_summary": "High-speed reporting on tech updates and modern aesthetics."},
            {"handle": "wired", "name": "Wired", "style_summary": "Deep technological coverage using sleek high-contrast images."},
            {"handle": "producthunt", "name": "ProductHunt", "style_summary": "Interactive daily releases with community voting highlights."}
        ]
    elif "marketing" in ind_lower or "digital" in ind_lower:
        return [
            {"handle": "socialmediatoday", "name": "Social Media Today", "style_summary": "Shares platform updates and functional info-graphics."},
            {"handle": "hubspot", "name": "HubSpot", "style_summary": "Aesthetic business memes and actionable marketing carousels."},
            {"handle": "latermedia", "name": "Later Media", "style_summary": "Sleek, pastel-colored social media scheduling insights."}
        ]
    else:
        return [
            {"handle": "instagram", "name": "Instagram Creators", "style_summary": "Platform tips and reels creation guides."},
            {"handle": "creators", "name": "Creator Intelligence", "style_summary": "Actionable visual analytics and growth insights."},
            {"handle": "socialmedia", "name": "Social Media Hub", "style_summary": "Industry updates and viral trend reporting."}
        ]

def generate_mock_competitor_intelligence(client_handle: str, industry: str, client_profile=None, comp_profiles=None, niche_analysis=None) -> dict:
    if not client_profile:
        client_profile = fetch_public_profile(client_handle)
    if not comp_profiles:
        default_comps = get_default_competitors(industry)
        comp_profiles = []
        for c in default_comps:
            profile = fetch_public_profile(c["handle"])
            profile["name"] = c["name"]
            profile["style_summary"] = c["style_summary"]
            comp_profiles.append(profile)
    if not niche_analysis:
        niche_analysis = f"The {industry} landscape shows intensive competition with a visual shift toward highly interactive educational carousel cards."

    result = {
        "client": {
            "handle": client_handle,
            "name": client_profile.get("name") or client_handle.title(),
            "followers": client_profile.get("followers") or 8450,
            "posts": client_profile.get("post_count") or 112,
            "engagement_score": client_profile.get("engagement_score") or 4.2,
        },
        "competitors": [
            {
                "handle": comp_profiles[0].get("handle"),
                "name": comp_profiles[0].get("name"),
                "style_summary": comp_profiles[0].get("style_summary"),
                "key": "competitor1"
            },
            {
                "handle": comp_profiles[1].get("handle"),
                "name": comp_profiles[1].get("name"),
                "style_summary": comp_profiles[1].get("style_summary"),
                "key": "competitor2"
            },
            {
                "handle": comp_profiles[2].get("handle"),
                "name": comp_profiles[2].get("name"),
                "style_summary": comp_profiles[2].get("style_summary"),
                "key": "competitor3"
            }
        ],
        "metrics": {
            "posting_consistency": {
                "client": {"score": 70, "note": "Stable calendar posting schedule but lacks daily presence."},
                "competitor1": {"score": 85, "note": "Strict schedule, publishing daily at morning peaks."},
                "competitor2": {"score": 95, "note": "Extremely consistent multi-post daily cadence."},
                "competitor3": {"score": 60, "note": "Boutique posting rhythm, prioritizing heavy drops."}
            },
            "engagement_behavior": {
                "client": {"score": 82, "note": "Excellent comment response rate and community discussion."},
                "competitor1": {"score": 65, "note": "Moderate comment threads with low reply rates."},
                "competitor2": {"score": 72, "note": "Standard customer query replies, lacks conversational style."},
                "competitor3": {"score": 88, "note": "High engagement through interactive stickers and polls."}
            },
            "reel_usage": {
                "client": {"score": 60, "note": "Utilizes video formats occasionally; needs trend alignment."},
                "competitor1": {"score": 90, "note": "Reel-first visual focus utilizing viral sound bytes."},
                "competitor2": {"score": 80, "note": "Highly polished instructional videos and guides."},
                "competitor3": {"score": 45, "note": "Relies mostly on static carousels and quote cards."}
            },
            "content_activity": {
                "client": {"score": 68, "note": "Moderate output, averaging 3 active posts per week."},
                "competitor1": {"score": 88, "note": "High calendar saturation and frequent story loops."},
                "competitor2": {"score": 94, "note": "Continuous content pipeline across all visual formats."},
                "competitor3": {"score": 55, "note": "Boutique volume focusing strictly on premium quality."}
            },
            "virality_estimation": {
                "client": {"score": 52, "note": "Niche sharing. Needs trending audio strategies."},
                "competitor1": {"score": 82, "note": "Aesthetic Reels frequently enter explore page loops."},
                "competitor2": {"score": 88, "note": "High viral scale, supported by large initial follower pool."},
                "competitor3": {"score": 75, "note": "Highly shareable infographics drive recurring spikes."}
            }
        },
        "niche_ecosystem_analysis": niche_analysis
    }
    return result
