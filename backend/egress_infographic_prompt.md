# Infographic: Solving Supabase Storage Egress

**Instructions for nano banana:** Copy the content below exactly as written. Style and design it as an infographic — use icons, sections, hierarchy, and visual ordering to make it scannable and client-friendly. Keep all technical terms but add the plain English explanations shown. Order the sections as they appear below.

---

## Section 1: The Problem

**Headline: Supabase blocked our storage — 21.49 GB used out of 5 GB free tier**

**Plain English:** We store client Instagram/Facebook post thumbnails on Supabase's cloud storage. Every time a client opens their portal, their browser downloads all 52 images from Supabase's servers. Over time, that added up to 21.49 GB of data sent out. Supabase's free plan only allows 5 GB. We hit the limit and got blocked.

**Technical detail:**
- `post-thumbnails` bucket: 52 files, 11.8 MB
- Each page load fetches all images (300-680 KB each)
- 21.49 GB egress vs 5 GB free tier cap
- Current status: 402 Payment Required — storage reads blocked

---

## Section 2: Why Quick Fixes Won't Last

**Headline: Band-aids that will tear**

Show each fix as a card with:
- Fix name
- Plain English explanation
- Why it fails

**Card 1: Use Instagram's original image URLs instead**
- **Plain English:** Instead of copying images to Supabase, just link to Instagram's CDN. Instagram pays for the bandwidth, not us. Sounds perfect, but...
- **Why it fails:** Instagram URLs expire after days or weeks. Old reports would show broken images. Not acceptable for a client-facing product.

**Card 2: Store images as base64 text inside the database**
- **Plain English:** Convert each image into a long text string and save it directly in the report's database row. The frontend already supports this. No storage reads needed.
- **Why it fails:** Each image becomes ~500 KB of text in the database. 15 clients × 1 monthly report × 10 posts = ~75 MB added per month. The free Supabase database is 500 MB. We'd fill it in 6 months.

**Card 3: Tell browsers to cache images locally**
- **Plain English:** Add headers telling the browser "save this image, don't re-download next time".
- **Why it fails:** Only helps returning visitors. 50 new clients = 50 full downloads. Plus Supabase blocks old traffic anyway.

**Card 4: Serve images through our own server with a cache**
- **Plain English:** Our backend fetches the image from Supabase once, saves it to temporary disk, and serves it from there. Supabase only gets hit once per image.
- **Why it fails:** Render's disk is wiped on every code deploy. Cache resets constantly. Images would re-download from Supabase repeatedly.

---

## Section 3: The Real Solutions

**Headline: Three paths forward**

Show each as a comparison card with: what it costs, what you get, what needs to change in code.

**Option A: Upgrade Supabase to Pro plan**
- **Cost:** $25/month
- **What you get:** 100 GB egress + 100 GB storage. Fits current usage and allows months of growth.
- **Code changes:** None. Everything works as-is.
- **Pros:** Zero engineering time. Instant fix. You already use Supabase.
- **Cons:** $300/year recurring cost. Still need to monitor usage.

**Option B: Use Cloudinary (image CDN)**
- **Cost:** Free tier — 25 GB egress/month + 10 GB storage
- **What you get:** Permanent image URLs from a global CDN. Auto-compression. Never worry about bandwidth.
- **Code changes:**
  - Replace `cache_platform_thumbnails` to upload to Cloudinary instead of Supabase Storage
  - Save Cloudinary URL as `media_url` in report data
  - One-time script to migrate existing 52 images
- **Pros:** Proper CDN designed for images. Free tier exceeds our lifetime usage. Auto-compression reduces sizes further.
- **Cons:** Small integration effort. New service to manage.

**Option C: Supabase Pro + code optimization (recommended)**
- **Cost:** $25/month
- **What you get:** 100 GB egress + 100 GB storage + stop wasteful uploads
- **Code changes:**
  - Stop `cache_platform_thumbnails` from rewriting `media_url` to Supabase URLs (line 64 of `thumbnail_cache.py`)
  - Keep the upload as a backup but don't point the frontend at it
  - Images load from Instagram CDN (free) when base64 isn't available
  - Only hit Supabase Storage when Instagram URLs expire
- **Pros:** Keeps Supabase as single provider. Reduces egress dramatically. Instagram CDN absorbs most traffic. Engineering change is one line of code.
- **Cons:** Old report images may eventually break. Instagram URL expiry is unpredictable.

---

## Section 4: What's Currently Stored

**Headline: Current database snapshot**

| Category | Detail | Size |
|---|---|---|
| Reports | 11 rows, 8 columns (id, client_id, month, year, raw_data, ai_insight, html_content, created_at) | 48.2 MB (47.4 MB in TOAST) |
| raw_data column | 23.1 MB total — 1 report has 19 MB alone | avg 2.1 MB/report |
| Storage images | 53 files — 52 thumbnails (jpeg) + 1 logo (png) | 11.9 MB |
| Instagram posts | 65 total across 11 reports | 49% have base64, 78% point to Supabase URL |
| Database total | Including indexes and system | 60 MB |

**Plain English:** The database is 60 MB total. The image storage is 12 MB. But we've transferred 21.49 GB because those 12 MB of images get downloaded over and over, every time anyone views a report.

---

## Section 5: Recommendation

**Headline: Recommended path — Option C (Supabase Pro + code fix)**

Three steps:

**Step 1 — Immediate (today):**
Delete `post["media_url"] = cached_url` in `thumbnail_cache.py:64`. This stops new reports from pointing thumbnails at Supabase Storage. New reports use Instagram CDN URLs for free.

**Step 2 — One-time (this week):**
Upgrade Supabase to Pro ($25/mo). This unblocks storage access and covers existing reports that still use Supabase URLs.

**Step 3 — Future (monitor):**
If Instagram URL expiry becomes a problem for old reports, implement a proper CDN (Cloudinary or similar). Until then, broken images are hidden by `onError` handlers already in the frontend.
