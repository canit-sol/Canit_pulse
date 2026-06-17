import os
import time
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict
# Simple in-memory cache system:
# { industry_query: { "timestamp": float_time, "articles": [...] } }
_NEWS_CACHE: Dict[str, Dict] = {}
CACHE_DURATION_SECS = 24 * 60 * 60 # 24 hours cache

class NewsSource:
    def fetch(self, query: str) -> List[Dict]:
        raise NotImplementedError("Subclasses must implement fetch")

class GNewsSource(NewsSource):
    def fetch(self, query: str) -> List[Dict]:
        api_key = os.getenv("GNEWS_API_KEY")
        if not api_key:
            print("GNewsSource: No API key found in env.")
            return []
        
        # Clean query: replace "&" with "and" for clean search formatting
        cleaned_query = query.replace("&", "and").strip()
        import urllib.parse
        encoded_query = urllib.parse.quote(cleaned_query)
        url = f"https://gnews.io/api/v4/search?q={encoded_query}&lang=en&max=10&apikey={api_key}"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        try:
            response = requests.get(url, headers=headers, timeout=10)
            if response.status_code == 200:
                data = response.json()
                articles = []
                for art in data.get("articles", []):
                    articles.append({
                        "title": art.get("title", ""),
                        "description": art.get("description", ""),
                        "image": art.get("image", ""),
                        "publishedAt": art.get("publishedAt", ""),
                        "url": art.get("url", ""),
                        "source": art.get("source", {}).get("name", "GNews")
                    })
                return articles
            else:
                print(f"GNewsSource: status code {response.status_code}, response: {response.text}")
        except Exception as e:
            print("GNewsSource error:", e)
        return []

class RSSNewsSource(NewsSource):
    """
    RSS feed search aggregator (future-ready & functional!).
    Fetches generic industry news using Google News RSS search which is free and keyless!
    """
    def fetch(self, query: str) -> List[Dict]:
        # Clean query: replace "&" with "and" for clean search formatting
        cleaned_query = query.replace("&", "and").strip()
        import urllib.parse
        encoded_query = urllib.parse.quote(cleaned_query)
        rss_url = f"https://news.google.com/rss/search?q={encoded_query}&hl=en-US&gl=US&ceid=US:en"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        try:
            response = requests.get(rss_url, headers=headers, timeout=10)
            if response.status_code == 200:
                root = ET.fromstring(response.content)
                articles = []
                for item in root.findall(".//item")[:10]:
                    title = item.find("title").text if item.find("title") is not None else ""
                    url = item.find("link").text if item.find("link") is not None else ""
                    
                    source_name = "RSS Feed"
                    if " - " in title:
                        parts = title.rsplit(" - ", 1)
                        title = parts[0]
                        source_name = parts[1]
                        
                    pub_date_raw = item.find("pubDate").text if item.find("pubDate") is not None else ""
                    published_at = datetime.now().isoformat()
                    if pub_date_raw:
                        try:
                            # Standard RSS pubDate parsing
                            parsed_date = datetime.strptime(pub_date_raw, "%a, %d %b %Y %H:%M:%S %Z")
                            published_at = parsed_date.isoformat() + "Z"
                        except Exception:
                            try:
                                parsed_date = datetime.strptime(pub_date_raw, "%a, %d %b %Y %H:%M:%S %z")
                                published_at = parsed_date.isoformat()
                            except Exception:
                                pass
                                
                    description = ""
                    desc_element = item.find("description")
                    if desc_element is not None and desc_element.text:
                        import re
                        description = re.sub(r'<[^>]*>', '', desc_element.text)
                    
                    articles.append({
                        "title": title,
                        "description": description or f"Latest updates on {query}.",
                        "image": "",  
                        "publishedAt": published_at,
                        "url": url,
                        "source": source_name
                    })
                return articles
        except Exception as e:
            print("RSSNewsSource error:", e)
        return []

def get_curated_unsplash_image(industry: str) -> str:
    """Helper to return a beautifully curated Unsplash image for fallback."""
    industry_lower = industry.lower()
    if "wellness" in industry_lower or "health" in industry_lower or "fitness" in industry_lower:
        return "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80"
    if "marketing" in industry_lower or "digital" in industry_lower or "social" in industry_lower:
        return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
    if "tech" in industry_lower or "software" in industry_lower or "digital" in industry_lower:
        return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    if "vehicle" in industry_lower or "car" in industry_lower or "auto" in industry_lower or "service" in industry_lower:
        return "https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80"
    return "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"

def extract_og_image(url: str) -> str:
    """Scrape the Open Graph or Twitter Card image from an article's raw HTML."""
    if not url or url == "#":
        return ""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        # Fetch only a stream chunk to get metadata tags in the head section quickly
        response = requests.get(url, headers=headers, timeout=3, stream=True)
        if response.status_code != 200:
            return ""
        # Read the first 100KB which contains metadata
        content_bytes = response.raw.read(102400)
        html = content_bytes.decode('utf-8', errors='ignore')
        
        import re
        # Match og:image: property="..." content="..."
        og_match = re.search(r'<meta\s+[^>]*property=["\']og:image["\']\s+[^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if not og_match:
            # Try content="..." property="og:image"
            og_match = re.search(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*property=["\']og:image["\']', html, re.IGNORECASE)
        if og_match:
            return og_match.group(1).strip()
            
        # Match twitter:image: name="..." content="..."
        tw_match = re.search(r'<meta\s+[^>]*name=["\']twitter:image["\']\s+[^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
        if not tw_match:
            # Try content="..." name="twitter:image"
            tw_match = re.search(r'<meta\s+[^>]*content=["\']([^"\']+)["\']\s+[^>]*name=["\']twitter:image["\']', html, re.IGNORECASE)
        if tw_match:
            return tw_match.group(1).strip()
    except Exception as e:
        print(f"news_api: extract_og_image failed for {url}: {e}")
    return ""

def enrich_article_image(art: Dict, industry: str) -> Dict:
    """Check if the article lacks an image, and fetch via OG or assign fallback."""
    img = art.get("image")
    if not img or not img.startswith("http"):
        scraped = extract_og_image(art["url"])
        if scraped and scraped.startswith("http"):
            art["image"] = scraped
        else:
            art["image"] = get_curated_unsplash_image(industry)
    return art

def fetch_industry_news_modular(industry: str) -> List[Dict]:
    """
    Main aggregator controller:
    1. Checks the cache (survives for 24 hours).
    2. Runs sources: GNews (primary), RSS Feed (fallback/supplementary).
    3. Handles deduplication.
    4. Curates high-resolution images.
    """
    now = time.time()
    cache_key = industry.lower().strip()
    
    if cache_key in _NEWS_CACHE:
        entry = _NEWS_CACHE[cache_key]
        if now - entry["timestamp"] < CACHE_DURATION_SECS:
            print(f"news_api: Serving cache for '{industry}'")
            return entry["articles"]
            
    print(f"news_api: Fetching fresh news for '{industry}'")
    articles = []
    seen_titles = set()
    seen_urls = set()
    
    sources = [GNewsSource(), RSSNewsSource()]
    
    for src in sources:
        try:
            fetched = src.fetch(industry)
            for art in fetched:
                title = art["title"].strip()
                url = art["url"].strip()
                
                # Normalization for deduplication
                norm_title = "".join(c for c in title.lower() if c.isalnum())
                if norm_title in seen_titles or url in seen_urls:
                    continue
                    
                seen_titles.add(norm_title)
                seen_urls.add(url)
                
                img = art.get("image")
                # Do not inject stock placeholder image
                if not img or not img.startswith("http"):
                    img = ""
                    
                articles.append({
                    "title": title,
                    "description": art.get("description", "") or f"Live updates on {industry}.",
                    "image": img,
                    "publishedAt": art.get("publishedAt", datetime.now().isoformat()),
                    "url": url,
                    "source": art.get("source", "Industry News")
                })
        except Exception as e:
            print(f"Source {src.__class__.__name__} failed: {e}")
            
    if not articles:
        print("news_api: Both GNews and RSS returned empty, falling back to Llama LLM.")
        articles = fetch_llama_fallback_news(industry)
        
    final_articles = articles[:6]
    
    # Concurrent image enrichment using ThreadPoolExecutor
    from concurrent.futures import ThreadPoolExecutor
    try:
        with ThreadPoolExecutor(max_workers=6) as executor:
            futures = [executor.submit(enrich_article_image, art, industry) for art in final_articles]
            final_articles = [fut.result() for fut in futures]
    except Exception as e:
        print("news_api: ThreadPoolExecutor enrichment failed, running sequentially:", e)
        final_articles = [enrich_article_image(art, industry) for art in final_articles]
        
    _NEWS_CACHE[cache_key] = {
        "timestamp": now,
        "articles": final_articles
    }
    
    return final_articles

def fetch_llama_fallback_news(industry: str) -> List[Dict]:
    # Import routes objects dynamically to avoid circular imports
    from routes import groq_client
    import json
    articles = []
    try:
        prompt = f"""Generate 6 realistic, premium, and professional industry news articles for the '{industry}' industry.
Format your response STRICTLY as a valid JSON array of objects. Do not include markdown codeblocks or extra text.
Each object must have the following keys:
- 'title': A compelling, professional headline.
- 'description': A short executive summary of the article (15-30 words).
- 'image': An Unsplash image URL that represents this specific news item beautifully. (Use a high-quality Unsplash image search or path, e.g. https://images.unsplash.com/photo-1544367567-0f2fcb009e0b for wellness, etc. Generate highly relevant high-resolution image URLs).
- 'publishedAt': A realistic recent date/time string (e.g. '2026-05-20T10:00:00Z').
- 'url': A realistic external source URL (e.g. a link to TechCrunch, Forbes, or industry-specific blogs).
"""
        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        raw_content = completion.choices[0].message.content.strip()
        
        if raw_content.startswith("```"):
            lines = raw_content.splitlines()
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines[-1].startswith("```"):
                lines = lines[:-1]
            raw_content = "\n".join(lines).strip()
            
        parsed = json.loads(raw_content)
        if isinstance(parsed, list):
            for item in parsed:
                img = item.get("image") or item.get("thumbnail") or item.get("thumbnail_url") or ""
                # Prioritize real image or keep empty, do not use Unsplash fallback
                articles.append({
                    "title": item.get("title", ""),
                    "description": item.get("description", ""),
                    "image": img if img.startswith("http") else "",
                    "publishedAt": item.get("publishedAt", datetime.now().isoformat()),
                    "url": item.get("url", "#"),
                    "source": "Llama Intel"
                })
    except Exception as e:
        print("news_api: LLM fallback failed:", e)
        articles = get_static_fallback_news(industry)
    return articles

def get_static_fallback_news(industry: str) -> List[Dict]:
    return [
        {
            "title": f"The Evolution of the {industry} Industry in 2026",
            "description": f"How digital transformations and new standards are reshaping modern client expectations in {industry}.",
            "image": "",
            "publishedAt": datetime.now().isoformat(),
            "url": "#",
            "source": "Bento Intel"
        },
        {
            "title": f"Key Trends Driving Growth in {industry} for Q3",
            "description": "Executive insights reveal shifting consumer behaviors and major opportunities for strategic investment.",
            "image": "",
            "publishedAt": datetime.now().isoformat(),
            "url": "#",
            "source": "Bento Intel"
        }
    ]
