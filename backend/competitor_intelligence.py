import os
import json
import re
import requests
from typing import Dict
from dotenv import load_dotenv, find_dotenv
from google import genai
from google.genai import types

load_dotenv(find_dotenv(), override=True)

gemini_client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")

_COMPETITORS_CACHE: Dict[str, dict] = {}
_CACHE_FILE = os.path.join(os.path.dirname(__file__), "competitors_cache.json")


def _load_cache():
    global _COMPETITORS_CACHE
    try:
        if os.path.exists(_CACHE_FILE):
            with open(_CACHE_FILE, "r") as f:
                _COMPETITORS_CACHE = json.load(f)
    except Exception as e:
        print(f"competitor_intelligence: Failed to load cache: {e}")
        _COMPETITORS_CACHE = {}


def _save_cache():
    try:
        with open(_CACHE_FILE, "w") as f:
            json.dump(_COMPETITORS_CACHE, f)
    except Exception as e:
        print(f"competitor_intelligence: Failed to save cache: {e}")


_load_cache()


def _verify_handle(handle: str, brand_name: str = "", min_followers: int = 1000) -> dict | None:
    """Check if an Instagram handle belongs to the claimed brand.
    Uses Instagram's internal web API — returns 404 for non-existent handles.
    Verifies: handle exists, follower count >= min_followers, and
    profile full_name or biography matches the brand name.
    Returns the user dict on success, None on failure."""
    handle = handle.strip().lstrip("@")
    if not handle:
        return None
    try:
        url = f"https://www.instagram.com/api/v1/users/web_profile_info/?username={handle}"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
            "X-IG-App-ID": "936619743392459",
            "X-Requested-With": "XMLHttpRequest",
            "Referer": "https://www.instagram.com/",
        }
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code == 404:
            return None
        if r.status_code != 200:
            print(f"competitor_intelligence: handle check @{handle} returned {r.status_code}")
            return None
        data = r.json()
        user = data.get("data", {}).get("user", {})
        if not user or user.get("username", "").lower() != handle.lower():
            return None
        followers = (user.get("edge_followed_by", {}) or {}).get("count", 0)
        if followers < min_followers:
            print(f"competitor_intelligence: @{handle} has {followers} followers (min {min_followers})")
            return None
        # Verify brand name match in full_name or biography
        profile_name = (user.get("full_name", "") or "").lower()
        biography = (user.get("biography", "") or "").lower()
        brand_lower = brand_name.lower().strip()
        if brand_lower and brand_lower not in profile_name and brand_lower not in biography:
            # Try matching just the first word of brand name
            brand_first_word = brand_lower.split()[0] if brand_lower.split() else ""
            if not brand_first_word or (brand_first_word not in profile_name and brand_first_word not in biography):
                print(f"competitor_intelligence: @{handle} profile name '{profile_name}' doesn't match brand '{brand_name}'")
                return None
        user["_followers"] = followers
        return user
    except Exception as e:
        print(f"competitor_intelligence: handle verification failed for @{handle}: {e}")
        return None


def _discover_via_gemini(client_handle: str, industry: str) -> dict | None:
    """Use Gemini with Google Search grounding to find real Instagram competitor handles.
    Returns dict with competitors, niche_ecosystem_analysis, and client handle, or None on failure."""
    if not os.environ.get("GEMINI_API_KEY"):
        return None
    try:
        json_format = '{"competitors": [{"name": "Brand Name", "instagram_url": "https://www.instagram.com/realhandle/", "style_summary": "Brief 1-line description of their content style"}], "niche_ecosystem_analysis": "2-3 sentence analysis"}'
        prompt = (
            f"Search Google to find exactly 3 real Indian competitor brands similar to '{client_handle}', "
            f"a company in the '{industry}' industry. "
            f"For each competitor, find their ACTUAL Instagram profile URL (must start with https://www.instagram.com/). "
            f"ONLY return brands whose Instagram profile you can confirm exists through search results. "
            f"Prioritize accounts with at least 1000 followers. "
            f"Do NOT make up or guess Instagram handles. "
            f"Return ONLY valid JSON (no markdown, no code fences, no backticks) in this exact structure: {json_format}"
        )
        response = gemini_client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(
                tools=[types.Tool(google_search=types.GoogleSearch())]
            )
        )
        raw = response.text.strip()
        raw = re.sub(r"^```json\s*", "", raw)
        raw = re.sub(r"^```\s*", "", raw)
        raw = re.sub(r"\s*```$", "", raw)
        data = json.loads(raw)
        raw_competitors = data.get("competitors", [])
        competitors = []
        for c in raw_competitors:
            url = c.get("instagram_url", "")
            # Extract handle from URL
            match = re.search(r"instagram\.com/([a-zA-Z0-9_.]+)", url)
            handle = match.group(1) if match else ""
            if not handle:
                # Try using handle field if url was missing
                handle = c.get("handle", "").strip().lstrip("@")
            if not handle:
                continue
            handle = handle.strip().lstrip("@").lower()
            brand_name = c.get("name", "")
            # Verify the handle actually belongs to the claimed brand
            user_data = _verify_handle(handle, brand_name)
            if user_data:
                real_name = user_data.get("full_name", brand_name)
                competitors.append({
                    "handle": handle,
                    "name": real_name,
                    "style_summary": c.get("style_summary", ""),
                })
                print(f"competitor_intelligence: VERIFIED @{handle} -> {real_name}")
            else:
                print(f"competitor_intelligence: REJECTED @{handle} (not matching brand '{brand_name}')")
        niche = data.get("niche_ecosystem_analysis", f"Competitor landscape in the {industry} space.")
        print(f"competitor_intelligence: Gemini discovered {len(competitors)} verified competitors for '{client_handle}'")
        for c in competitors:
            print(f"  - @{c['handle']} ({c.get('name', '?')})")
        return {
            "competitors": competitors[:3],
            "niche_ecosystem_analysis": niche,
            "client": {"handle": client_handle.strip().lstrip("@")},
        }
    except json.JSONDecodeError as e:
        print(f"competitor_intelligence: Gemini response was not valid JSON: {e}")
        return None
    except Exception as e:
        print(f"competitor_intelligence: Gemini discovery failed: {e}")
        return None


def fetch_automatic_competitors(client_handle: str, industry: str, ig_token: str = None, ig_user_id: str = None, refresh: bool = False) -> dict:
    """Discover Instagram competitors via Gemini Google Search grounding.
    Results are cached indefinitely — only refreshed when refresh=True."""
    sanitized_handle = client_handle.strip().lstrip("@")
    sanitized_industry = industry.strip()
    cache_key = f"{sanitized_handle.lower()}:{sanitized_industry.lower()}"

    # Only refresh on explicit request — otherwise serve cached or empty
    if cache_key in _COMPETITORS_CACHE:
        print(f"competitor_intelligence: Serving cached competitors for '{sanitized_handle}'")
        return _COMPETITORS_CACHE[cache_key]

    if not refresh:
        print(f"competitor_intelligence: No cached data for '{sanitized_handle}', returning empty (click Refresh to discover)")
        return {"client": {"handle": sanitized_handle}, "competitors": [], "niche_ecosystem_analysis": ""}

    print(f"competitor_intelligence: Discovering competitors for '{sanitized_handle}' ({sanitized_industry})")

    # Phase 1: Gemini Google Search (returns verified-real handles, no hallucination)
    result = _discover_via_gemini(sanitized_handle, sanitized_industry)

    # Phase 2: Pad with curated defaults if fewer than 3 verified competitors
    verified = result.get("competitors", []) if result else []
    if len(verified) < 3:
        default_comps = get_default_competitors(sanitized_industry)
        defaults = default_comps or [
            {"handle": "tatasteel", "name": "Tata Steel", "style_summary": "Indian industrial leader."},
            {"handle": "adani_wires", "name": "Adani Wires", "style_summary": "Indian wire manufacturing leader."},
            {"handle": "hindalco", "name": "Hindalco", "style_summary": "Indian metals and mining leader."},
        ]
        existing_handles = {c["handle"].lower() for c in verified}
        for d in defaults:
            if len(verified) >= 3:
                break
            if d["handle"].lower() not in existing_handles:
                verified.append(d)
        niche = (result or {}).get("niche_ecosystem_analysis", f"Competitor landscape in the {sanitized_industry} space.")
        result = {
            "client": {"handle": sanitized_handle},
            "competitors": verified[:3],
            "niche_ecosystem_analysis": niche,
        }

    # Cache permanently
    _COMPETITORS_CACHE[cache_key] = result
    _save_cache()
    return result


def get_default_competitors(industry: str) -> list:
    ind_lower = industry.lower()
    if "dental" in ind_lower or "dentist" in ind_lower:
        return [
            {"handle": "invisalign", "name": "Invisalign", "style_summary": "Clear aligner brand with patient transformation stories."},
            {"handle": "colgate", "name": "Colgate", "style_summary": "Global oral care leader with educational content."},
            {"handle": "oralb", "name": "Oral-B", "style_summary": "Dental hygiene product brand with how-to guides."},
        ]
    if "hospital" in ind_lower or "medical" in ind_lower or "healthcare" in ind_lower:
        return [
            {"handle": "apollohospitals", "name": "Apollo Hospitals", "style_summary": "India's leading healthcare brand sharing medical insights."},
            {"handle": "fortisnh", "name": "Fortis Healthcare", "style_summary": "Indian healthcare network with patient stories and health education."},
            {"handle": "maxhealthcare", "name": "Max Healthcare", "style_summary": "Premier Indian hospital chain with expert medical content."},
        ]
    if "wellness" in ind_lower or "health" in ind_lower or "fitness" in ind_lower:
        return [
            {"handle": "yoga_journal", "name": "Yoga Journal", "style_summary": "Focuses on instructional poses and premium video guides."},
            {"handle": "mindbodygreen", "name": "MindBodyGreen", "style_summary": "Wellness lifestyle hub with high-quality quote carousels."},
            {"handle": "cultfit", "name": "CultFit", "style_summary": "Interactive fitness and wellness content for India."},
        ]
    if "tech" in ind_lower or "software" in ind_lower or "drone" in ind_lower or "robotics" in ind_lower or "aerial" in ind_lower:
        return [
            {"handle": "techcrunch", "name": "TechCrunch", "style_summary": "High-speed reporting on tech updates and modern aesthetics."},
            {"handle": "wired", "name": "Wired", "style_summary": "Deep technological coverage using sleek high-contrast images."},
            {"handle": "producthunt", "name": "ProductHunt", "style_summary": "Interactive daily releases with community voting highlights."},
        ]
    if "marketing" in ind_lower or "digital" in ind_lower:
        return [
            {"handle": "socialmediatoday", "name": "Social Media Today", "style_summary": "Shares platform updates and functional info-graphics."},
            {"handle": "hubspot", "name": "HubSpot", "style_summary": "Aesthetic business memes and actionable marketing carousels."},
            {"handle": "latermedia", "name": "Later Media", "style_summary": "Sleek, pastel-colored social media scheduling insights."},
        ]
    if "fashion" in ind_lower or "style" in ind_lower:
        return [
            {"handle": "nykaafashion", "name": "Nykaa Fashion", "style_summary": "Indian fashion marketplace with trend-driven content."},
            {"handle": "myntra", "name": "Myntra", "style_summary": "Leading Indian fashion e-commerce brand."},
            {"handle": "ajio", "name": "AJIO", "style_summary": "Trendy Indian fashion and lifestyle brand."},
        ]
    if "education" in ind_lower or "edtech" in ind_lower or "college" in ind_lower or "university" in ind_lower or "science" in ind_lower or "arts" in ind_lower:
        return [
            {"handle": "byjus", "name": "Byju's", "style_summary": "India's largest edtech company with engaging learning content."},
            {"handle": "unacademy", "name": "Unacademy", "style_summary": "Indian online education platform for exam prep."},
            {"handle": "vedantu", "name": "Vedantu", "style_summary": "Live online tutoring platform with interactive classes."},
        ]
    if "restaurant" in ind_lower or "food" in ind_lower:
        return [
            {"handle": "zomatato", "name": "Zomato", "style_summary": "Food delivery and restaurant discovery platform."},
            {"handle": "swiggyindia", "name": "Swiggy", "style_summary": "Indian food delivery leader with vibrant content."},
            {"handle": "eatfit", "name": "EatFit", "style_summary": "Healthy food brand targeting fitness-conscious consumers."},
        ]
    if "spiritual" in ind_lower or "meditation" in ind_lower or "yoga" in ind_lower or "mindfulness" in ind_lower:
        return [
            {"handle": "sadhguru", "name": "Sadhguru", "style_summary": "Indian spiritual leader with wisdom and mindfulness content."},
            {"handle": "artofliving", "name": "Art of Living", "style_summary": "Global spiritual wellness organization with meditation content."},
            {"handle": "yogawithadriene", "name": "Yoga With Adriene", "style_summary": "Popular yoga instruction with accessible wellness content."},
        ]
    if "beauty" in ind_lower or "cosmetic" in ind_lower or "skincare" in ind_lower:
        return [
            {"handle": "nykaabeauty", "name": "Nykaa Beauty", "style_summary": "India's leading beauty retailer with product tutorials and reviews."},
            {"handle": "sugarfreebeauty", "name": "Sugar Cosmetics", "style_summary": "Indian cruelty-free makeup brand with vibrant tutorials."},
            {"handle": "mamaearth", "name": "Mamaearth", "style_summary": "Indian natural skincare brand with toxin-free content."},
        ]
    if "real estate" in ind_lower or "property" in ind_lower or "realestate" in ind_lower or "homes" in ind_lower:
        return [
            {"handle": "magicbricks", "name": "MagicBricks", "style_summary": "Indian real estate platform with property listings and insights."},
            {"handle": "housing", "name": "Housing.com", "style_summary": "Indian real estate discovery with modern home content."},
            {"handle": "squareyards", "name": "Square Yards", "style_summary": "Indian real estate consultancy with market trends."},
        ]
    if "automotive" in ind_lower or "car" in ind_lower or "auto" in ind_lower or "vehicle" in ind_lower:
        return [
            {"handle": "tata_motors", "name": "Tata Motors", "style_summary": "Indian automotive leader showcasing vehicles and innovation."},
            {"handle": "mahindralive", "name": "Mahindra", "style_summary": "Indian auto major with SUV and farm equipment content."},
            {"handle": "bharatbenz", "name": "BharatBenz", "style_summary": "Indian commercial vehicle brand with engineering content."},
        ]
    if "plywood" in ind_lower or "wood" in ind_lower or "lumber" in ind_lower or "timber" in ind_lower:
        return [
            {"handle": "greenply", "name": "Greenply", "style_summary": "Indian plywood leader with interior design and wood solutions."},
            {"handle": "centuryply", "name": "CenturyPly", "style_summary": "India's trusted plywood brand showcasing premium wood products."},
            {"handle": "kitply", "name": "Kitply", "style_summary": "Indian plywood and panel products with industry insights."},
        ]
    if "manufacturing" in ind_lower or "industrial" in ind_lower or "steel" in ind_lower or "metal" in ind_lower or "wire" in ind_lower or "factory" in ind_lower or "engineering" in ind_lower or "construction" in ind_lower or "building" in ind_lower or "material" in ind_lower:
        return [
            {"handle": "tatasteel", "name": "Tata Steel", "style_summary": "Indian steel giant showcasing industrial innovation and sustainability."},
            {"handle": "adani_wires", "name": "Adani Wires", "style_summary": "Indian wire manufacturing leader with engineering-focused content."},
            {"handle": "hindalco", "name": "Hindalco", "style_summary": "Indian metals and mining leader with industrial insights."},
        ]
    return [
        {"handle": "culture", "name": "Culture", "style_summary": "Industry insights and creative visual content."},
        {"handle": "creators", "name": "Creator Intelligence", "style_summary": "Actionable visual analytics and growth insights."},
        {"handle": "trending", "name": "Trending Hub", "style_summary": "Industry updates and viral trend reporting."},
    ]
