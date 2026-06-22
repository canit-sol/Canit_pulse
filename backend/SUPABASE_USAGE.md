# Supabase Usage

## Summary

| Category | Size |
|---|---|
| Database | 50.8 MB (60 MB with indexes) |
| Storage (files) | 11.9 MB |
| **Total stored** | **~72 MB** |
| **Bandwidth used** | **21.49 GB** |

Bandwidth is ~300x stored data — each thumbnail gets fetched many times over as users view reports.

## Database Tables (by size)

| Table | Rows | Index | Toast | Total |
|---|---|---|---|---|
| reports | 11 | 32 KB | 47.4 MB | 48.2 MB |
| refresh_tokens | 876 | 224 KB | 0 | 456 KB |
| objects (storage) | 53 | 80 KB | 0 | 168 KB |
| access_audit_logs | 217 | 40 KB | 0 | 104 KB |
| client_blogs | 74 | 16 KB | 0 | 104 KB |
| clients | 10 | 32 KB | 0 | 88 KB |
| supabase-auth tables | varies | varies | 0 | ~1 MB |
| **Total** | | | | **50.8 MB** |

### reports table detail

| Column | Type | Total Size |
|---|---|---|
| raw_data | json | 23.1 MB |
| ai_insight | text | 3.1 KB |
| html_content | text | 0 bytes |

**raw_data per row:**
- 1 row: **19 MB** (client `f3140857`)
- 1 row: **4.7 MB** (client `3b813bb0`)
- 9 rows: 579 bytes – 7.7 KB each

**ai_insight per row:** 232–322 bytes each

## Storage Buckets

| Bucket | Files | Size |
|---|---|---|
| post-thumbnails | 52 (jpeg) | 11.8 MB |
| client-logos | 1 (png) | 146 KB |
| seo-reports | 0 | 0 |
| SEO reports | 0 | 0 |
| client logos | 0 | 0 |
| **Total** | **53 files** | **11.9 MB** |

All 52 thumbnails are Instagram post images (300–680 KB each).

## Why 21.49 GB Egress?

Stored data is only 72 MB. Egress is specifically Supabase Storage downloads (database reads don't count toward this quota):

- **12 MB of thumbnails** downloaded ~1,800 times collectively → 21.49 GB

Every client portal page load fetches all 52 Instagram thumbnails from Supabase Storage. Over the lifetime of the app, those repeated fetches add up quickly.

Note: The 19 MB JSON blob in the database doesn't count toward storage egress — only the thumbnails do.

The free tier's 5 GB bandwidth cap is easily exceeded by any regular usage of the client portal.

Collected via `inspect_supabase.py` + `_inspect_deep.py` on June 17, 2026.
