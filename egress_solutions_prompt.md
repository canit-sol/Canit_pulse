# Supabase Storage Egress — Problem & Solutions

## Current Situation

The app stores Instagram/Facebook post thumbnails in Supabase Storage (`post-thumbnails` bucket). During report generation, `cache_platform_thumbnails` downloads each image from Instagram's CDN, uploads it to Supabase Storage, and rewrites `post["media_url"]` to the Supabase Storage public URL.

The frontend renders: `<img src={media_base64 || media_url} />`

When `media_base64` is empty (49% of posts have it), the browser fetches the image from Supabase Storage at 300-680 KB per image. 52 images × ~12 MB per page load. Over the app's lifetime, that's **21.49 GB egress** against a 5 GB free tier cap → already blocked with 402.

## Limitations of Quick Fixes

1. **Instagram CDN URLs (no upload)** — URLs expire in days to weeks. Old reports show broken images.
2. **base64 embed in JSON column** — ~75 MB/month growth for 15 clients. Fills 500 MB free DB in ~6 months.
3. **Browser Cache-Control headers** — Only helps repeat visits. 50 unique users = 50 full downloads.
4. **Proxy through Render with disk cache** — Cache wiped on every deploy.

## Desired Solution Preferences

- Prefer Supabase-based solutions (we already use Supabase)
- Must be permanent, not band-aid
- Should scale to 15+ clients with monthly reports
- Keep frontend code changes minimal (render pattern is `media_base64 || media_url`)

## Investigate & Propose These Options

### Option A: Supabase Pro ($25/mo)
- 100 GB egress + 100 GB storage
- No code changes needed — instant fix
- Check: does the existing flow work as-is?

### Option B: Supabase Storage + CDN (Cloudflare)
- Put Cloudflare free tier in front of `[project].supabase.co`
- Cache images at edge, reduce egress to zero
- Check: how to configure, any domain/DNS changes needed?

### Option C: Hybrid — base64 for recent reports, storage for old
- Keep `media_base64` populated for current month (auto-deletes after next report generation)
- Keep storage bucket for archive access
- Check: can we purge old base64 data from JSON?

### Option D: Pay-as-you-grow
- Implement the simplest fix (stop rewriting media_url, use Instagram CDN)
- Accept that old report images may break
- Add a graceful fallback placeholder when images fail
- Check: how long do Instagram CDN URLs actually live?

## Files to Review

- `backend/services/thumbnail_cache.py` — full file
- `backend/routes_v3.py` lines 148-152 — where cache is called
- `backend/main.py` lines 216-220, 368-372 — where cache is called
- `frontend/src/pages/ClientPortal.tsx` — search for `media_base64`, `media_url`, `supabase`
- `backend/database.py` — search for `MonthlySEOReport`, storage related models
- `backend/routes.py` lines 1105, 1237 — storage bucket operations

## Deliver

1. For each viable option: implementation steps + cost + trade-offs
2. A recommended path with clear reasoning
3. What existing code needs to change
