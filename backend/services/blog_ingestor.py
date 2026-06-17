import logging
import feedparser
import httpx
from bs4 import BeautifulSoup
import trafilatura
from datetime import datetime
from urllib.parse import urljoin, urlparse
from sqlalchemy.orm import Session
from database import ClientBlog
# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def fetch_rss_feed(url: str):
    """Attempt to fetch and parse an RSS feed."""
    try:
        # httpx allows async fetching if needed, but feedparser.parse can also take a URL.
        # However, to control timeouts and headers, we use httpx.
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            response = await client.get(url)
            if response.status_code == 200:
                feed = feedparser.parse(response.text)
                if feed.entries:
                    return feed.entries
    except Exception as e:
        logger.debug(f"RSS fetch failed for {url}: {e}")
    return None

async def discover_and_parse_rss(website_url: str):
    """Try common RSS paths."""
    base_url = website_url.rstrip("/")
    common_paths = [
        "/feed",
        "/rss",
        "/blog/feed",
        "/blog/rss",
        "/feed.xml",
        "/rss.xml"
    ]
    for path in common_paths:
        url = f"{base_url}{path}"
        entries = await fetch_rss_feed(url)
        if entries:
            logger.info(f"Discovered valid RSS feed at {url}")
            return entries
    return None

async def scrape_blog_page(website_url: str):
    """Fallback: Scrape the blog page directly using BeautifulSoup & Trafilatura."""
    base_url = website_url.rstrip("/")
    blog_paths = ["/blog", "/news", "/articles", "/insights", "/"]
    
    scraped_entries = []
    
    async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
        for path in blog_paths:
            try:
                url = f"{base_url}{path}"
                response = await client.get(url)
                if response.status_code != 200:
                    continue
                
                soup = BeautifulSoup(response.text, "html.parser")
                # Find all links that might be articles
                links = soup.find_all("a", href=True)
                article_urls = set()
                
                for link in links:
                    href = link['href'].strip()
                    if href.startswith('#') or href.startswith('javascript:') or not href:
                        continue
                    full_url = urljoin(url, href)
                    
                    # Strip fragment / hash
                    parsed_href = urlparse(full_url)
                    if parsed_href.fragment:
                        parsed_href = parsed_href._replace(fragment="")
                    clean_url = parsed_href.geturl().strip()
                    
                    # Ignore common non-blog pages
                    path_lower = parsed_href.path.lower()
                    if any(x in path_lower for x in ["/contact", "/about", "/privacy", "/terms", "/help", "/faq", "/services", "/careers"]):
                        continue
                    
                    # Basic heuristic for an article link: longer path, contains date, or specific keywords
                    if parsed_href.netloc == urlparse(base_url).netloc:
                        path_parts = [p for p in parsed_href.path.split("/") if p]
                        if len(path_parts) > 1 and ("blog" in path_parts or "news" in path_parts or "article" in path_parts):
                            article_urls.add(clean_url)
                        elif len(path_parts) >= 1 and len(path_parts[-1]) > 15:
                            # Long slug heuristic
                            article_urls.add(clean_url)
                            
                # Process up to 5 recent articles to save time
                for article_url in list(article_urls)[:5]:
                    art_res = await client.get(article_url)
                    if art_res.status_code == 200:
                        downloaded = art_res.text
                        # Extract with Trafilatura
                        metadata = trafilatura.extract_metadata(downloaded)
                        text_content = trafilatura.extract(downloaded)
                        
                        if metadata and metadata.title:
                            scraped_entries.append({
                                "title": metadata.title,
                                "link": article_url,
                                "summary": metadata.description or (text_content[:200] + "..." if text_content else ""),
                                "published_parsed": None, # Complex to parse arbitrary dates reliably without feed
                                "image_url": metadata.image,
                            })
                            
                if scraped_entries:
                    logger.info(f"Successfully scraped {len(scraped_entries)} articles from {url}")
                    return scraped_entries

            except Exception as e:
                logger.debug(f"Scraping failed for {path}: {e}")
                
    return scraped_entries

async def fetch_client_blogs(client_id: str, website_url: str):
    """Main pipeline to fetch blogs for a client and save to DB."""
    if not website_url:
        logger.info(f"No website URL for client {client_id}, skipping.")
        return 0
        
    logger.info(f"Starting blog ingestion for client {client_id} at {website_url}")
    
    # 1. Try RSS
    entries = await discover_and_parse_rss(website_url)
    
    # 2. Fallback to scraping
    if not entries:
        logger.info(f"No RSS found for {website_url}. Falling back to scraping.")
        entries = await scrape_blog_page(website_url)
        
    if not entries:
        logger.info(f"No blog entries found for {website_url}.")
        return 0

    # Deduplicate entries list by clean URL and Title
    unique_entries = []
    seen_urls = set()
    seen_titles = set()
    for entry in entries:
        url = entry.get("link", "")
        parsed = urlparse(url)
        if parsed.fragment:
            parsed = parsed._replace(fragment="")
        clean_url = parsed.geturl().strip()
        entry["link"] = clean_url
        
        title = entry.get("title", "").strip()
        if not clean_url or not title:
            continue
        if clean_url in seen_urls or title.lower() in seen_titles:
            continue
        seen_urls.add(clean_url)
        seen_titles.add(title.lower())
        unique_entries.append(entry)
    
    raw_count = len(entries)
    entries = unique_entries
    logger.info(f"[BLOG INGESTOR] Raw scraped articles count: {raw_count} | Unique deduplicated count: {len(entries)}")

    saved_count = 0
    from database import SessionLocal
    db = SessionLocal()
    
    try:
        for entry in entries:
            # Normalize data depending on whether it came from feedparser or scraping
            title = entry.get("title", "").strip()
            url = entry.get("link", "")
            
            summary = entry.get("summary", "")
            if "description" in entry and not summary:
                summary = entry.get("description", "")
                
            # Strip HTML from summary if needed
            summary = BeautifulSoup(summary, "html.parser").get_text(separator=" ", strip=True)[:500]
            
            image_url = entry.get("image_url", None)
            # Check media_content from feedparser
            if not image_url and "media_content" in entry:
                for media in entry["media_content"]:
                    if "url" in media and "image" in media.get("type", ""):
                        image_url = media["url"]
                        break
                        
            published_at = datetime.utcnow()
            if entry.get("published_parsed"):
                try:
                    published_at = datetime(*entry["published_parsed"][:6])
                except Exception:
                    pass
                    
            # Deduplication check: check by clean url or same title
            existing = db.query(ClientBlog).filter(
                (ClientBlog.client_id == client_id) & 
                ((ClientBlog.url == url) | (ClientBlog.title == title))
            ).first()
            
            # Audit log
            print(f"[BLOG PARSE] extracted_url={url} article_title={title} publish_date={published_at.isoformat()}")
            
            if not existing:
                new_blog = ClientBlog(
                    client_id=client_id,
                    title=title,
                    excerpt=summary,
                    url=url,
                    image_url=image_url,
                    published_at=published_at
                )
                db.add(new_blog)
                saved_count += 1
                
        if saved_count > 0:
            db.commit()
            logger.info(f"Successfully saved {saved_count} new blogs for client {client_id}.")
    except Exception as e:
        db.rollback()
        logger.error(f"Database commit failed during blog ingestion for {client_id}: {e}")
    finally:
        db.close()
            
    return saved_count
