## Goal
- Complete AI chat UX improvements, BrandIntelligence per-platform data fetching, report feedback section for clients, chatbot on Gemini (`gemini-2.5-flash`) with all other AI features on Groq; diagnose and fix Render deployment build failure; cache Instagram/Facebook post thumbnails to Supabase Storage so they survive CDN URL expiry; migrate refresh token from localStorage to HttpOnly cookie; add Supabase usage analytics to settings page

## Constraints & Preferences
- **Must not** auto-speak AI responses; instead show a speaker icon per assistant message
- AI tone: professional sales-oriented, data-backed, adapts structure to the question (no forced 4-section framework)
- Suggested questions are context-aware, regenerated after each response based on the last user query topic, rendered as clickable chips below assistant message
- Cancel speech when chat is closed
- BrandIntelligence must fetch per platform (correct data per tab when switching)
- Report feedback: client-only editable, viewable by CSM/super_admin/admin, 5-star rating with optional text, "Clear rating" text link
- Chatbot uses Gemini (`gemini-2.5-flash`, `google-genai==2.10.0`) — all other AI features use Groq
- Competitor Brand Intelligence must not show fake follower counts or engagement rates (removed from backend and frontend)
- AI can answer questions about any platform regardless of which tab the user is on (all platform data included in context)
- History sent for context: 6 messages (3 full turns)
- **Do not push to GitHub without explicit approval**
- Uvicorn runs with `reload=True` (single worker)

## Progress
### Done
- Installed `react-joyride` in `frontend/`
- Built `TourGuide.tsx` with custom-themed tooltips, dynamic steps, platform-specific sub-steps
- Added "Take Tour" button in ClientPortal header; wired `runTour` state, `tourKey` counter, `tourOriginRef`
- Added all Joyride target classes to DOM elements
- Fixed ESM import: `{ Joyride as ReactJoyride }` named import
- Fixed beacon→tooltip: `disableBeacon` → `skipBeacon` on all steps
- Fixed X button: `closeButtonAction: "skip"` per-step (top-level prop ignored)
- Fixed tour restart: `key={tourKey}` forces fresh mount instead of `run` transition
- Disabled auto-scroll on header steps, enabled scroll on content steps
- **Converted to controlled mode**: local `stepIndex` state, passed via `stepIndex` prop, advanced/retreated manually in callback
- **Centralized tab-switching**: removed `before` hooks from step definitions; attached `data: { platform: string }` to platform-dependent steps; single `STEP_AFTER` handler reads `steps[nextIndex].data.platform` and switches before advancing
- **Fixed prop name**: joyride calls `onEvent`, not `callback`
- **Fixed skip handler**: skip fires via `STATUS.SKIPPED` (not `EVENTS.SKIP`)
- **Fixed `before` return value**: returns `Promise<void>` (removed `flushSync` which caused `undefined.then()` TypeError)
- **Added AI Brand Intelligence tour step** with `.joyride-ai-brand-intelligence` target class
- **Added `waitForElement` helper**: polls via `requestAnimationFrame` until target element exists with non-zero dimensions (5s timeout)
- **Added `before` hooks** to all deep-dive steps that wait for the target element
- **Fixed industry news query**: replaced `f"{industry} {name}"` with `f"{industry} India"`
- **Fixed tour getting stuck on deliverables**: changed step to target `.joyride-deliverables-header` (always present) instead of `.joyride-deliverables-progress` (conditional)
- **Removed "Task Management" tour step**, folded into "Deliverables Panel" step
- **Added back-to-top button**: fixed bottom-right, appears on scroll > 200px, smooth scrolls to top
- **AI chat audio fixes**: added `Volume2` import, `speakingIndex` state, cancel-speech-on-close `useEffect`; removed auto-speak from `sendChat()`; added per-message speaker icon button
- **AI response formatting**: added `formatMessage()` helper (bold → `<strong>`, list lines → `<li>`)
- **AI context prompt updated**: includes full report data, sales-oriented tone, data-backed justifications per bullet
- **Suggested questions generated locally**: `buildSuggestedQuestions()` creates context-aware suggestions from metrics (not parsed from AI response)
- **Suggested questions rendered outside bubble**: separate clickable chips below assistant message
- **BrandIntelligence per-platform fetch**: added `platform` back to `useEffect` dependency array
- **ClientPortal reports deduplication**: dedup by month+year, keeps newest report
- **Report month dropdown sorted**: latest month on top (year desc, then month desc)
- **Login error message**: changed to "Refresh and try again within 20 seconds"
- **AI prompt enhanced then relaxed**: added 4-section analytical framework (What Worked, What Didn't, Competitive Position, Actionable Recommendations) — later removed forced framework; AI now adapts structure to the question
- **Report Feedback feature**: added `ReportFeedback` model in backend database, `/report-feedback` GET/PUT endpoints (client-only edit, CSM/super_admin/admin view), UI in DeliverablesPanel with "Required" badge, 5-star rating system, "Clear rating" text link
- **Chatbot model**: `gemini-2.5-flash` (switched from `gemini-2.0-flash` which was shut down June 1, 2026)
- **Updated `google-genai`**: from `1.0.0` to `2.10.0` in requirements.txt (version 1.0.0 didn't support `gemini-2.5-flash`)
- **Chat `max_tokens`**: increased from 300 to 1000 (was cutting off synopsis responses)
- **History increased**: from `[-2]` to `[-6]` (3 full turns) for better conversation context
- **Gemini health check**: added `/api/settings/health` with 60s cache; uses `gemini-2.5-flash` model, checks `candidates[0].finish_reason == 1` instead of `res.text`
- **Frontend settings page**: "Gemini AI Engine" IntegrationCard with status/latency from `health?.gemini`; added "Gemini API Usage" quota card with live `gemini_chat_calls` counter and free tier limits (10 RPM, 250K TPM, 1,500 RPD)
- **Gemini chat call counter**: module-level `gemini_chat_calls` in `ai_chat.py`, incremented per call, exposed via `/api/settings/quota` as `gemini_chat_calls`
- **Uvicorn**: `reload=True` (single worker), removed `workers=4`
- **Synopsis generation**: uses Groq `qwen/qwen3.6-27b` (replaced from `llama-3.3-70b-versatile`)
- **Competitor Brand Intelligence**: uses Groq `qwen/qwen3.6-27b` (replaced from `llama-3.3-70b-versatile`)
- **Competitor stats removed**: fake `followers`, `posts`, `engagement_score` removed from backend response (`competitor_intelligence.py`) and frontend display (`BrandIntelligence.tsx` CompetitorIntelCard)
- **JSON parsing reverted**: original regex-based extraction restored in `competitor_intelligence.py`
- **Security audit completed**: identified gaps — no HTTPS enforcement, no CSP, no security headers, refresh token in localStorage, no rate limiting (MEDIUM-HIGH risk if XSS exists)
- **Removed duplicate Groq chat endpoint**: `main.py`'s `@app.post("/api/reports/{report_id}/chat")` removed (was shadowing `routes_v3.py`'s Gemini-powered endpoint)
- **Fixed Gemini format**: `ai_chat.py` now uses proper `types.Content` array with `systemInstruction` parameter instead of flat string concatenation
- **Stripped `suggestions` from history**: frontend now destructures out `suggestions` field before sending history payload (`map(({ suggestions: _, ...rest }) => rest)`)
- **Context-aware suggested questions**: `buildSuggestedQuestions(lastQuery)` detects topic keywords (reach, engagement, followers, competitors, performance, content) and generates relevant follow-ups; falls back to metric-based questions
- **Platform constraint removed**: AI context now includes data from ALL platforms (Instagram, Facebook, YouTube, X), not just the active tab; "Keep responses focused on X" instruction removed
- **AI response structure freed**: no more forced "all 4 sections every response"; AI decides format based on the question
- **Backend system prompt simplified**: `ai_chat.py` no longer duplicates data or adds conflicting instructions; frontend's `contextStr` is the sole data source
- **Groq model swap**: All 9 usages of `llama-3.3-70b-versatile` replaced with `qwen/qwen3.6-27b` across `ai_chat.py`, `html_generator.py`, `ai_extractor.py`, `competitor_intelligence.py`, `main.py`, `news_api.py`, `routes.py`
- **Fixed Facebook Page Insights deprecated metrics**: `page_impressions_unique` with `period=month` is not supported in Graph API v25.0, changed to `period=days_28`; `page_posts_impressions`/`page_posts_impressions_organic` deprecated, replaced with `page_impressions`/`page_impressions_organic`
- **Diagnosed Render deployment build failure**: Root cause — dependency conflicts in `backend/requirements.txt`. Fixed: `pydantic==2.7.1`→`2.13.4`, `pydantic_core==2.18.2`→`2.46.4`, removed `supafunc==0.2.3`; `gotrue` stays at `2.12.4`; all deps now resolve cleanly
- **Instagram post thumbnails cached**: added `_upload_post_thumbnail()` in `instagram.py` — downloads each post image and uploads to Supabase `post-thumbnails` bucket; stores Supabase public URL in `media_base64` field
- **Facebook post thumbnails cached**: same logic in `facebook.py` — downloads `full_picture`, caches to `post-thumbnails` as `fb_{post_id}.jpg`, stores in `media_base64`
- **Created `scripts/regenerate_reports.py`**: Python script to regenerate May/June 2026 reports for all clients via the API; reads `.env` to create admin token; deletes existing report before regenerating; counts cached thumbnails after generation; skips if all thumbnails already cached
- **Supabase usage analytics added**: `GET /api/settings/supabase-usage` endpoint — fetches plan from org-level Management API, DB size from Postgres, tables/rows count. Frontend card in Settings integrations tab showing Plan, DB Size, Tables, Total Rows
- **Token leak fix 1** (`PUT /api/clients/{id}`): returns safe fields only (`id`, `name`, `industry`, `website_url`, `instagram_handle`, `client_type`, `platform`, `brand_color`) instead of full ORM object (excludes `ig_access_token`, `fb_page_token`, `x_token`)
- **Token leak fix 2** (`GET /meta-pages`): three `fb_page_token` builder lines changed from `page.get("access_token", token)` to `page.get("access_token", "")` — no longer falls back to leaking `ig_access_token`
- **Token leak fix 3 (HttpOnly cookie auth) — COMPLETE**: Backend login/refresh/logout endpoints set `bento_refresh_token` as HttpOnly cookie (`httponly=True`, `samesite="lax"`, `secure=IS_PRODUCTION`, `path="/api/auth"`, `max_age=7 days`). Refresh endpoint reads cookie first, falls back to body. Frontend: created `src/lib/auth.ts` module-scoped token holder (`setAccessToken`, `getAccessToken`, `clearAccessToken`, `authHeaders`, `setUser`, `getUser`, `clearAuth`, `refreshSession`). Updated `api.ts`, `LoginPage.tsx`, `App.tsx`, `AppSidebar.tsx`, `ClientPortal.tsx`, `AdminDashboard.tsx`, `ReportsArchive.tsx`, `ClientsPage.tsx`, `SettingsPage.tsx`, `UsersPage.tsx`, `ReportView.tsx`, `BrandIntelligence.tsx`, `PerformanceBenchmark.tsx`, `UserManagementPanel.tsx`, `AdPerformanceView.tsx`, `AdSpendsPanel.tsx`, `DeliverablesPanel.tsx`. All ~17 `localStorage.getItem("bento_token")` and 2 `localStorage.getItem("bento_refresh_token")` reads replaced. `bento_user` kept in localStorage (non-sensitive user metadata for synchronous rendering). `IS_PRODUCTION` set from `RAILWAY_ENVIRONMENT` or `VERCEL_ENV` env vars.
- **Pushed commits**: `8d8f12c` (thumbnail caching + month sort), `2872cb6` (supabase usage analytics), `b606093` (token leak fixes — rebased after pull)

### Pending
- **`vercel.json` still references Render** (`canit-pulse.onrender.com`) — needs updating to Railway URL before Render is deleted
- **Railway build**: "railpack exited" — needs Root Directory set to `backend/` in Railway dashboard settings

### Blocked
- Supabase free tier egress limit (10GB/month) causes stored client logos to become inaccessible after limit is exceeded; re-uploading temporarily restores access; upgrade to Pro plan or implement image compression + CDN caching to resolve
- Facebook Page Insights still failing with `(#100) The value must be a valid insights metric` — both `page_impressions_unique` and `page_impressions,page_impressions_organic` return this error; likely the Page Access Token lacks `pages_read_engagement` permission (not a code bug)

## Key Decisions
- Removed `flushSync` usage — caused `undefined.then()` TypeError with joyride
- `waitForElement` uses `requestAnimationFrame` polling instead of `MutationObserver` — simpler, works with React's commit timing
- Industry news uses `f"{industry} India"` query — client name was polluting search
- AI chat audio cancellation via `useEffect` watching `chatOpen` — covers all close paths
- Speaker icon per assistant message instead of auto-speak — user controls playback
- Suggested questions generated locally from metrics — no dependency on AI response format
- Suggested questions rendered outside message bubble — separate visual element
- BrandIntelligence re-fetches per platform via `platform` in dependency array — correct data per tab
- Reports deduplication by month+year (keeps last) — removes backend duplicates
- Report month dropdown sorted with latest month first (year desc, month desc)
- Report Feedback: backend enforces `role == "client"` for edit; frontend uses `canViewFeedback` check for visibility
- Chatbot on Gemini `gemini-2.5-flash` — all other AI features (synopsis, competitor intelligence, SEO extraction, HTML generation, news API) remain on Groq
- Gemini free tier limits (10 RPM, 250K TPM, 1,500 RPD) — adequate for ~2-3 concurrent users; paid tier needed for scale
- Competitor stats (followers, posts, engagement) removed entirely — all were fabricated due to missing RapidAPI key
- Uvicorn single worker with `reload=True` for development — multi-worker only needed for production concurrency
- History increased to 6 messages (3 turns) — gives Gemini enough context for coherent conversation
- All platform data included in chat context — AI can answer across platforms regardless of active tab
- Forced 4-section analytical framework removed — AI adapts response structure to the question naturally
- Groq model `llama-3.3-70b-versatile` replaced with `qwen/qwen3.6-27b` across all 9 usages — newer model with significantly better reasoning (+80%), GPQA (+70%), 5x better HLE, 11x better TerminalBench, though 5x more expensive on output tokens ($3.00/M vs $0.71/M) and slower (56 tok/s vs 93 tok/s)
- Groq free tier has no per-token billing — gated only by rate limits (30 RPM, 1K RPD, 8K TPM, 200K TPD); credit card only needed to upgrade to Developer plan for higher limits
- `openai/gpt-oss-20b` is a valid Groq model — `groq==0.9.0` works fine with it (model names are just strings passed to API)
- `page_impressions_unique` with `period=days_28` used instead of `period=month` (unsupported in v25.0) — gives genuine 28-day unique reach
- `page_impressions`/`page_impressions_organic` replace deprecated `page_posts_impressions`/`page_posts_impressions_organic`
- Instagram/Facebook post thumbnails stored as raw CDN URLs (`media_url`) — they expire; now cached to Supabase `post-thumbnails` bucket via `media_base64` field
- Bucket creation changed from silent `except Exception: pass` to `try-get-bucket then try-create-bucket` — prevents 400 noise when bucket already exists
- Supabase plan is fetched from org-level `/v1/organizations/{slug}` (project endpoint has no `plan` field)
- Supabase analytics endpoints (`/daily-stats`, `/api/usage`, `/analytics/endpoints/*`) all return 404 — not exposed via v1 Management API with PAT; egress and API request stats unavailable
- Token leak fixes 1+2+3 complete. Fix 3 uses module-scoped access token (`src/lib/auth.ts`) instead of localStorage — access token never touches disk. Refresh token stored as HttpOnly cookie (not accessible via JS). `bento_user` kept in localStorage (non-sensitive metadata only).
- Refresh token cookie uses `path="/api/auth"` — only sent on auth endpoints; `secure` flag set by `IS_PRODUCTION` env check

## Next Steps
1. **Update `vercel.json`** to point to Railway URL before deleting Render
2. Set Railway Root Directory to `backend/` to fix "railpack exited" build failure
3. Reconnect Facebook page OAuth with `pages_read_engagement` scope to fix Page Insights
4. Run report regeneration scripts for any missing months
5. Decide on hosting: Supabase Pro + Railway Hobby ($30/mo, zero code changes) vs Railway Pro only ($20/mo, needs migration)

## Critical Context
- `page_impressions_unique` w/ `period=month` not supported in Graph API v25.0 — using `period=days_28` instead
- `page_posts_impressions`/`page_posts_impressions_organic` deprecated in v25.0 — replaced with `page_impressions`/`page_impressions_organic`
- Facebook Page Insights also returning `(#100) The value must be a valid insights metric` for BOTH metric sets — likely the Page Access Token lacks `pages_read_engagement` permission
- Instagram/Facebook post `media_url` is a raw CDN URL with an expiry signature — must cache to Supabase Storage; frontend already checks `media_base64 || media_url`
- `post-thumbnails` bucket was created manually by the user (the `create_bucket` 400 was due to bucket already existing)
- Backend refresh token cookie: `httponly=True`, `samesite="lax"`, `secure=IS_PRODUCTION`, `path="/api/auth"`, `max_age=7 days`
- `IS_PRODUCTION` set from `RAILWAY_ENVIRONMENT` or `VERCEL_ENV` env vars
- `scripts/regenerate_reports.py` (unpushed) — regenerates May+June 2026, deletes existing, counts thumbnails, skips if complete
- `scripts/regenerate_missing.py` (unpushed) — Omnevum + CLF June 2026 only
- Vercel at `pulse.canit.in` rewrites `/api/*` to the Railway backend; same-origin from browser's perspective so `credentials: "include"` not needed
- `vercel.json` still references `https://canit-pulse.onrender.com/api/:path*` — must update before deleting Render
- Supabase v1 Management API: project info at `/v1/projects/{ref}` (no `plan` field), org info at `/v1/organizations/{slug}` (has `plan`), analytics endpoints all 404
- Groq models used: `qwen/qwen3.6-27b` (synopsis, competitor intelligence, SEO extraction, HTML generation, news API, competitor discovery), `openai/gpt-oss-20b` (brand intelligence extraction, health check), `openai/gpt-oss-120b` (health check)
- All 8 standalone `authHeaders()` definitions removed and replaced with shared import from `src/lib/auth.ts` (re-exported via `src/config/api.ts`)

## Relevant Files
- `frontend/src/components/TourGuide.tsx`: Tour component with `stepIndex` controlled mode, `waitForElement` helper, `before` hooks, centralized `STEP_AFTER` tab-switching
- `frontend/src/pages/ClientPortal.tsx`: Tour button/state, Joyride target classes, back-to-top button, AI chat speak/cancel logic, `formatMessage`, `sendChat` with `buildSuggestedQuestions(lastQuery)` (context-aware keyword branching), `contextStr` with all platforms data, `chatMessages.slice(-6)` for history, stripped `suggestions` from payload; report month dropdown sorted by year desc then month desc
- `frontend/src/components/BrandIntelligence.tsx`: `platform` in useEffect deps for per-platform fetch; `authHeaders` imported from `../lib/auth`; **removed fake competitor stats**
- `frontend/src/components/DeliverablesPanel.tsx`: Report feedback section with 5-star rating, "Clear rating" text link, "Required" badge; `handleRatingChange`, `handleFeedbackChange` with debounced PUT; `canViewFeedback`/`isClient` role checks
- `frontend/src/pages/SettingsPage.tsx`: "Gemini AI Engine" IntegrationCard (`health?.gemini`), "Gemini API Usage" quota card with live chat call count and free tier limits; Supabase usage IntegrationCard with Plan, DB Size, Tables, Rows
- `frontend/src/pages/LoginPage.tsx`: Login form — stores access token via `setAccessToken()` (module-scoped), user info in `localStorage.setItem("bento_user", ...)`. **No longer stores `bento_refresh_token` in localStorage** (HttpOnly cookie).
- `frontend/src/App.tsx`: `TokenRefresher` component — uses `getAccessToken()`, `setAccessToken()`, `setUser()`, `clearAuth()`; `ProtectedRoute` and `RootRedirect` use `getAccessToken()` and `getUser()`; **no localStorage reads for tokens**
- `frontend/src/config/api.ts`: `apiFetch()` with 401 auto-refresh using `refreshAccessToken()` which POSTs to `/api/auth/refresh` with no body (cookie auto-sent); imports/exports `authHeaders` from `../lib/auth`
- `frontend/src/lib/auth.ts`: Module-scoped token holder — `setAccessToken`, `getAccessToken`, `clearAccessToken`, `authHeaders`, `setUser`, `getUser`, `clearAuth`, `refreshSession`. Access token never touches disk. User metadata stored in `localStorage("bento_user")`.
- `backend/database.py`: `ReportFeedback` model (rating, content, client_id, month, year)
- `backend/routes.py`: `/report-feedback` GET/PUT endpoints; competitor discovery `/compete` endpoint (now uses `qwen/qwen3.6-27b`); **login/refresh/logout now set HttpOnly cookie**; refresh endpoint reads cookie first then body; Fix 2 applied — `fb_page_token` no longer falls back to `ig_access_token`
- `backend/main.py`: Gemini health check in `/api/settings/health` (cached 60s, `gemini-2.5-flash`); `/api/settings/quota` returns `gemini_chat_calls`, rate limits; `/api/settings/supabase-usage` returns plan/DB size/tables/rows; Fix 1 applied — `PUT /clients/{id}` returns safe fields only; **removed duplicate Groq chat endpoint**; uses `qwen/qwen3.6-27b` for growth strategies and report chunk generation; `openai/gpt-oss-20b` and `openai/gpt-oss-120b` for health checks
- `backend/ai_chat.py`: `gemini_client` (`google-genai`, `gemini-2.5-flash`) for chatbot; `groq_client` (`qwen/qwen3.6-27b`) for synopsis; `gemini_chat_calls` counter; `history[-6:]` truncation; `max_tokens=1000`; uses `types.Content` array + `systemInstruction` format; simplified system prompt (no duplicate data, no conflicting instructions)
- `backend/competitor_intelligence.py`: Uses Groq `qwen/qwen3.6-27b` (replaced from `llama-3.3-70b-versatile`); competitor objects contain only name, handle, style_summary
- `backend/ai_extractor.py`: SEO extraction uses `qwen/qwen3.6-27b`; brand intelligence uses `openai/gpt-oss-20b`
- `backend/news_api.py`: News generation uses `qwen/qwen3.6-27b` (replaced from `llama-3.3-70b-versatile`)
- `backend/html_generator.py`: HTML report synopsis uses `qwen/qwen3.6-27b` (`GROQ_MODEL`)
- `backend/routes_v3.py`: Gemini-powered chat endpoint `@router_v3.post("/reports/{report_id}/chat")` — the sole chat handler (Groq duplicate removed from main.py); `/reports/generate` endpoint for report generation
- `backend/requirements.txt`: `google-genai==2.10.0`; `pydantic==2.13.4`, `pydantic_core==2.46.4`, `gotrue==2.12.4`, `httpx==0.28.1`; all deps resolve cleanly for Render build
- `backend/facebook.py`: `_get_page_insights()` — fixed deprecated metrics for Graph API v25.0 (`page_impressions_unique` period `month`→`days_28`, `page_posts_impressions`→`page_impressions`, `page_posts_impressions_organic`→`page_impressions_organic`); added thumbnail caching to Supabase `post-thumbnails` bucket (`fb_{post_id}.jpg`); Page Insights currently failing with `(#100) The value must be a valid insights metric`
- `backend/instagram.py`: Added `_upload_post_thumbnail()` — downloads post image, uploads to Supabase `post-thumbnails` bucket, stores permanent URL in `media_base64`; bucket creation changed to `try-get-bucket then try-create-bucket` pattern
- `scripts/regenerate_reports.py`: Standalone script to regenerate May+June 2026 reports for all clients via `POST /api/reports/generate`; reads `.env` for admin token; deletes existing report before regenerating; counts and reports cached thumbnails; skips if all thumbnails already cached (not pushed)
- `scripts/regenerate_missing.py`: One-off script for Omnevum + CLF June 2026 only (not pushed)
- `frontend/vercel.json`: Rewrites `/api/*` to `https://canit-pulse.onrender.com/api/:path*` — **needs updating to Railway URL before Render is deleted**
- `runtime.txt`: `python-3.11.9` (root directory — sets Python version for Render/Railway build)
- `tour_script.md`: Tutorial script documenting all Client Portal tour steps
