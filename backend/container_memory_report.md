INFO:     Started server process [663]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
[OOM SIMULATION] Memory limit set to 512MB
[LIVE] t=10s  RSS=110MB  peak=110MB  (limit: 512MB)  active=[idle]
[LIVE] t=20s  RSS=135MB  peak=135MB  (limit: 512MB)  active=[idle]
[ENTER] startup_event   RSS=136.1MB  t=20s  active=[startup_event]
Supabase Storage Policies initialized.
Database tables initialized in Supabase.
Canit Sol was already seeded; skipping auto-creation to respect deletion.
[EXIT]  startup_event   RSS=137.0MB  dur=7.6s  process_peak=137MB  active=[startup_event~]
[LIVE] t=30s  RSS=137MB  peak=137MB  (limit: 512MB)  active=[idle]
[ENTER] login   RSS=137.3MB  t=30s  active=[login]
[DEBUG] Login lookup - Identifier: 'Jaishree', User found: True, ClientAccess found: False
[EXIT]  login   RSS=138.5MB  dur=4.3s  process_peak=138MB  active=[login~]
INFO:     172.17.0.1:33988 - "POST /api/auth/login HTTP/1.1" 200 OK
[ENTER] list_clients   RSS=138.5MB  t=35s  active=[list_clients+login~]
[EXIT]  list_clients   RSS=138.8MB  dur=2.9s  process_peak=139MB  active=[list_clients~]
INFO:     172.17.0.1:34084 - "GET /api/clients HTTP/1.1" 200 OK
[LIVE] t=40s  RSS=139MB  peak=139MB  (limit: 512MB)  active=[idle]
[ENTER] get_client_reports   RSS=139.0MB  t=41s  active=[get_client_reports]
[ENTER] get_automatic_competitors   RSS=139.5MB  t=41s  active=[get_automatic_competitors+get_client_reports]
[ENTER] get_brand_intelligence   RSS=139.5MB  t=41s  active=[get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] get_client_blogs   RSS=139.5MB  t=42s  active=[get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
[ENTER] fetch_automatic_competitors   RSS=139.5MB  t=42s  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
competitor_intelligence: Running automatic analysis for 'omnevum' in 'Spiritual & Mental wellness'
[EXIT]  get_client_blogs   RSS=140.6MB  dur=0.3s  process_peak=141MB  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs~+get_client_reports]
INFO:     172.17.0.1:34090 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client e43ee24b-1d87-4570-8337-ecd6f348855b at https://omnevum.com/blog/
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed "HTTP/1.1 301 Moved Permanently"
INFO:httpx:HTTP Request: POST https://api.groq.com/openai/v1/chat/completions "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: POST https://api.groq.com/openai/v1/chat/completions "HTTP/1.1 200 OK"
INFO:services.blog_ingestor:Discovered valid RSS feed at https://omnevum.com/blog/feed
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 9 | Unique deduplicated count: 9
[ENTER] fetch_client_blogs   RSS=140.6MB  t=42s  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_client_blogs~+get_client_reports]
[ENTER] fetch_public_profile   RSS=157.2MB  t=44s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  fetch_public_profile   RSS=157.2MB  dur=0.0s  process_peak=157MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] fetch_public_profile   RSS=157.2MB  t=44s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  fetch_public_profile   RSS=157.2MB  dur=0.0s  process_peak=157MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] fetch_public_profile   RSS=157.2MB  t=44s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  fetch_public_profile   RSS=157.2MB  dur=0.0s  process_peak=157MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] fetch_public_profile   RSS=157.2MB  t=44s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  fetch_public_profile   RSS=157.2MB  dur=0.0s  process_peak=157MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  fetch_automatic_competitors   RSS=189.8MB  dur=5.8s  process_peak=190MB  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  get_automatic_competitors   RSS=189.8MB  dur=5.9s  process_peak=190MB  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors~+get_brand_intelligence+get_client_reports]
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/why-every-home-needs-energy-alignment-for-better-living/ article_title=Why Every Home Needs Energy Alignment for Better Living publish_date=2026-05-25T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/reconnecting-with-prakruthi-why-nature-alignment-is-essential-for-human-and-planetary-balance/ article_title=Reconnecting with Prakruthi: Why Nature Alignment Is Essential for Human and Planetary Balance publish_date=2026-05-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/beyond-religion-a-unified-approach-to-human-consciousness-and-collective-evolution/ article_title=Beyond Religion: A Unified Approach to Human Consciousness and Collective Evolution publish_date=2026-05-15T09:22:43
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/beyond-the-physical-understanding-subtle-technologies-and-environmental-fields/ article_title=Beyond the Physical: Understanding Subtle Technologies and Environmental Fields publish_date=2026-04-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/ground-to-growth-how-nature-and-earth-based-systems-create-environmental-stability/ article_title=Ground to Growth: How Nature and Earth-Based Systems Create Environmental Stability publish_date=2026-04-17T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/universal-recalibration-restoring-balance-in-an-interconnected-world/ article_title=Universal Recalibration: Restoring Balance in an Interconnected World publish_date=2026-04-10T11:04:06
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/how-your-environment-affects-your-mood-and-productivity/ article_title=How Your Environment Affects Your Mood and Productivity publish_date=2026-03-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/why-alignment-matters-more-than-motivation/ article_title=Why Alignment Matters More Than Motivation publish_date=2026-03-16T09:12:49
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/what-does-omnevum-mean-in-modern-life/ article_title=What Does Omnevum Mean in Modern Life? publish_date=2026-03-06T09:50:53
[EXIT]  fetch_client_blogs   RSS=202.7MB  dur=7.2s  process_peak=202MB  active=[fetch_client_blogs~+get_brand_intelligence+get_client_reports]
INFO:     172.17.0.1:34098 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/automatic-competitors HTTP/1.1" 200 OK
[LIVE] t=50s  RSS=215MB  peak=215MB  (limit: 512MB)  active=[get_brand_intelligence+get_client_reports]
[ENTER] compute_brand_health   RSS=242.8MB  t=55s  active=[compute_brand_health+get_brand_intelligence+get_client_reports]
[EXIT]  compute_brand_health   RSS=242.8MB  dur=0.0s  process_peak=261MB  active=[compute_brand_health~+get_brand_intelligence+get_client_reports]
[EXIT]  get_client_reports   RSS=242.8MB  dur=14.5s  process_peak=261MB  active=[compute_brand_health~+get_brand_intelligence+get_client_reports~]
INFO:     172.17.0.1:34088 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/reports HTTP/1.1" 200 OK
[ENTER] get_calendar_data   RSS=268.9MB  t=60s  active=[get_brand_intelligence+get_calendar_data]
[ENTER] get_brand_intelligence   RSS=268.9MB  t=60s  active=[get_brand_intelligence+get_calendar_data]
[LIVE] t=60s  RSS=269MB  peak=315MB  (limit: 512MB)  active=[get_brand_intelligence+get_calendar_data]
[ENTER] generate_insights   RSS=316.7MB  t=63s  active=[generate_insights+get_brand_intelligence+get_calendar_data]
[ENTER] parse_platform_metrics   RSS=316.7MB  t=63s  active=[generate_insights+get_brand_intelligence+get_calendar_data+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=316.7MB  dur=0.0s  process_peak=317MB  active=[generate_insights+get_brand_intelligence+get_calendar_data+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=316.7MB  dur=0.0s  process_peak=317MB  active=[generate_insights~+get_brand_intelligence+get_calendar_data+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=318.8MB  t=64s  active=[compute_gauges+generate_insights~+get_brand_intelligence+get_calendar_data+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=318.8MB  dur=0.0s  process_peak=319MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+get_calendar_data+parse_platform_metrics~]
[ENTER] download_report   RSS=319.2MB  t=64s  active=[compute_gauges~+download_report+generate_insights~+get_brand_intelligence+get_calendar_data+parse_platform_metrics~]
[ENTER] generate_report_pdf   RSS=326.1MB  t=66s  active=[download_report+generate_report_pdf+get_brand_intelligence+get_calendar_data]
[ENTER] generate_report_html_stream   RSS=326.1MB  t=66s  active=[download_report+generate_report_html_stream+generate_report_pdf+get_brand_intelligence+get_calendar_data]
[EXIT]  generate_report_html_stream   RSS=326.1MB  dur=0.0s  process_peak=325MB  active=[download_report+generate_report_html_stream~+generate_report_pdf+get_brand_intelligence+get_calendar_data]
[LIVE] t=72s  RSS=347MB  peak=347MB  (limit: 512MB)  active=[download_report+generate_report_pdf+get_brand_intelligence+get_calendar_data]
[EXIT]  get_calendar_data   RSS=367.3MB  dur=13.5s  process_peak=367MB  active=[download_report+generate_report_pdf+get_brand_intelligence+get_calendar_data~]
[ENTER] compute_brand_health   RSS=367.5MB  t=74s  active=[compute_brand_health+download_report+generate_report_pdf+get_brand_intelligence+get_calendar_data~]
[EXIT]  compute_brand_health   RSS=367.5MB  dur=0.0s  process_peak=367MB  active=[compute_brand_health~+download_report+generate_report_pdf+get_brand_intelligence+get_calendar_data~]
INFO:     172.17.0.1:39604 - "GET /api/calendar/e43ee24b-1d87-4570-8337-ecd6f348855b HTTP/1.1" 200 OK
[EXIT]  get_brand_intelligence   RSS=377.0MB  dur=37.8s  process_peak=409MB  active=[download_report+generate_report_pdf+get_brand_intelligence~]
INFO:     172.17.0.1:34114 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=380.0MB  t=80s  active=[download_report+generate_report_pdf+get_brand_intelligence]
[ENTER] generate_insights   RSS=380.1MB  t=81s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=380.1MB  t=81s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=380.1MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=380.1MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=380.4MB  t=81s  active=[compute_gauges+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=380.4MB  dur=0.0s  process_peak=409MB  active=[compute_gauges~+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[LIVE] t=82s  RSS=382MB  peak=409MB  (limit: 512MB)  active=[download_report+generate_report_pdf+get_brand_intelligence]
[EXIT]  get_brand_intelligence   RSS=333.4MB  dur=23.0s  process_peak=409MB  active=[download_report+generate_report_pdf+get_brand_intelligence~]
INFO:     172.17.0.1:39596 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=333.7MB  t=84s  active=[download_report+generate_report_pdf+get_brand_intelligence+get_brand_intelligence~]
[ENTER] compute_brand_health   RSS=336.3MB  t=85s  active=[compute_brand_health+download_report+generate_report_pdf+get_brand_intelligence]
[EXIT]  compute_brand_health   RSS=336.3MB  dur=0.0s  process_peak=409MB  active=[compute_brand_health~+download_report+generate_report_pdf+get_brand_intelligence]
[ENTER] compute_brand_health   RSS=389.7MB  t=89s  active=[compute_brand_health+download_report+generate_report_pdf+get_brand_intelligence]
[EXIT]  compute_brand_health   RSS=389.7MB  dur=0.0s  process_peak=409MB  active=[compute_brand_health~+download_report+generate_report_pdf+get_brand_intelligence]
[ENTER] generate_insights   RSS=394.4MB  t=91s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=394.4MB  t=91s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=394.4MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=394.4MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=394.5MB  t=91s  active=[compute_gauges+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=394.5MB  dur=0.0s  process_peak=409MB  active=[compute_gauges~+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[LIVE] t=92s  RSS=395MB  peak=409MB  (limit: 512MB)  active=[download_report+generate_report_pdf+get_brand_intelligence]
[EXIT]  get_brand_intelligence   RSS=400.2MB  dur=13.1s  process_peak=409MB  active=[download_report+generate_report_pdf+get_brand_intelligence~]
INFO:     172.17.0.1:38156 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] generate_insights   RSS=400.9MB  t=94s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence~]
[ENTER] parse_platform_metrics   RSS=400.9MB  t=94s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence~+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=400.9MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=400.9MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights~+generate_report_pdf+get_brand_intelligence~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=400.9MB  t=94s  active=[compute_gauges+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=400.9MB  dur=0.0s  process_peak=409MB  active=[compute_gauges~+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence~+parse_platform_metrics~]
[ENTER] get_brand_intelligence   RSS=400.9MB  t=95s  active=[compute_gauges~+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=348.8MB  dur=13.1s  process_peak=409MB  active=[download_report+generate_report_pdf+get_brand_intelligence~]
INFO:     172.17.0.1:58714 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
ERROR:weasyprint:Failed to load image at 'https://zmfscsvwvbzdaokywzrr.supabase.co/storage/v1/object/public/client-logos/e43ee24b-1d87-4570-8337-ecd6f348855b/omnevum.png': HTTPError: HTTP Error 402: Payment Required
ERROR:weasyprint:Failed to load image at 'https://zmfscsvwvbzdaokywzrr.supabase.co/storage/v1/object/public/post-thumbnails/e43ee24b-1d87-4570-8337-ecd6f348855b/18177520492367081.jpg': HTTPError: HTTP Error 402: Payment Required
ERROR:weasyprint:Failed to load image at 'https://zmfscsvwvbzdaokywzrr.supabase.co/storage/v1/object/public/post-thumbnails/e43ee24b-1d87-4570-8337-ecd6f348855b/18100914368156661.jpg': HTTPError: HTTP Error 402: Payment Required
ERROR:weasyprint:Failed to load image at 'https://zmfscsvwvbzdaokywzrr.supabase.co/storage/v1/object/public/post-thumbnails/e43ee24b-1d87-4570-8337-ecd6f348855b/18089773442580347.jpg': HTTPError: HTTP Error 402: Payment Required
ERROR:weasyprint:Failed to load image at 'https://zmfscsvwvbzdaokywzrr.supabase.co/storage/v1/object/public/post-thumbnails/e43ee24b-1d87-4570-8337-ecd6f348855b/997793373416350_122113864797286716.jpg': HTTPError: HTTP Error 402: Payment Required
[ENTER] get_brand_intelligence   RSS=349.7MB  t=98s  active=[download_report+generate_report_pdf+get_brand_intelligence]
[ENTER] compute_brand_health   RSS=350.0MB  t=99s  active=[compute_brand_health+download_report+generate_report_pdf+get_brand_intelligence]
[EXIT]  compute_brand_health   RSS=350.0MB  dur=0.0s  process_peak=409MB  active=[compute_brand_health~+download_report+generate_report_pdf+get_brand_intelligence]
[LIVE] t=102s  RSS=361MB  peak=409MB  (limit: 512MB)  active=[download_report+generate_report_pdf+get_brand_intelligence]
[ENTER] compute_brand_health   RSS=401.3MB  t=104s  active=[compute_brand_health+download_report+generate_report_pdf+get_brand_intelligence]
[EXIT]  compute_brand_health   RSS=401.3MB  dur=0.1s  process_peak=409MB  active=[compute_brand_health~+download_report+generate_report_pdf+get_brand_intelligence]
[ENTER] generate_insights   RSS=402.0MB  t=105s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=402.0MB  t=105s  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=402.0MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=402.0MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=402.0MB  t=105s  active=[compute_gauges+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=402.0MB  dur=0.0s  process_peak=409MB  active=[compute_gauges~+download_report+generate_insights~+generate_report_pdf+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=406.1MB  dur=13.2s  process_peak=409MB  active=[download_report+generate_report_pdf+get_brand_intelligence~]
INFO:     172.17.0.1:37492 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] generate_insights   RSS=406.2MB  t=109s  active=[download_report+generate_insights+generate_report_pdf]
[ENTER] parse_platform_metrics   RSS=406.2MB  t=109s  active=[download_report+generate_insights+generate_report_pdf+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=406.2MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights+generate_report_pdf+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=406.2MB  dur=0.0s  process_peak=409MB  active=[download_report+generate_insights~+generate_report_pdf+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=406.2MB  t=110s  active=[compute_gauges+download_report+generate_insights~+generate_report_pdf+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=406.2MB  dur=0.0s  process_peak=409MB  active=[compute_gauges~+download_report+generate_insights~+generate_report_pdf+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=354.0MB  dur=13.9s  process_peak=409MB  active=[download_report+generate_report_pdf+get_brand_intelligence~]
INFO:     172.17.0.1:37494 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[LIVE] t=112s  RSS=354MB  peak=409MB  (limit: 512MB)  active=[download_report+generate_report_pdf+get_brand_intelligence~]
[EXIT]  generate_report_pdf   RSS=354.2MB  dur=54.5s  process_peak=409MB  active=[download_report+generate_report_pdf~]
[DOWNLOAD-PDF CRASH] 'super' object has no attribute 'transform'
Traceback (most recent call last):
  File "/app/routes_v3.py", line 636, in download_report
    pdf_bytes = generate_report_pdf(
                ^^^^^^^^^^^^^^^^^^^^
  File "/app/memory_monitor.py", line 229, in sync_wrapper
    result = func(*args, **kwargs)
             ^^^^^^^^^^^^^^^^^^^^^
  File "/app/html_generator.py", line 697, in generate_report_pdf
    result = HTML(string=html).write_pdf()
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/weasyprint/__init__.py", line 259, in write_pdf
    self.render(font_config, counter_style, **options)
  File "/usr/local/lib/python3.12/site-packages/weasyprint/document.py", line 400, in write_pdf
    pdf = generate_pdf(self, target, zoom, **options)
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "/usr/local/lib/python3.12/site-packages/weasyprint/pdf/__init__.py", line 166, in generate_pdf
    stream.transform(d=-1, f=(page.height * scale))
  File "/usr/local/lib/python3.12/site-packages/weasyprint/pdf/stream.py", line 246, in transform
    super().transform(a, b, c, d, e, f)
    ^^^^^^^^^^^^^^^^^
AttributeError: 'super' object has no attribute 'transform'

[EXIT]  download_report   RSS=354.5MB  dur=56.6s  process_peak=409MB  active=[download_report~+generate_report_pdf~]
INFO:     172.17.0.1:43186 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/download-report?month=June&year=2026 HTTP/1.1" 500 Internal Server Error
[LIVE] t=122s  RSS=354MB  peak=409MB  (limit: 512MB)  active=[idle]
[ENTER] get_brand_intelligence   RSS=354.6MB  t=131s  active=[get_brand_intelligence]
[LIVE] t=132s  RSS=368MB  peak=409MB  (limit: 512MB)  active=[get_brand_intelligence]
[ENTER] compute_brand_health   RSS=414.7MB  t=135s  active=[compute_brand_health+get_brand_intelligence]
[EXIT]  compute_brand_health   RSS=414.7MB  dur=0.0s  process_peak=415MB  active=[compute_brand_health~+get_brand_intelligence]
[ENTER] generate_insights   RSS=433.4MB  t=141s  active=[generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=433.4MB  t=141s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=433.4MB  dur=0.0s  process_peak=433MB  active=[generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=433.4MB  dur=0.0s  process_peak=433MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=433.4MB  t=141s  active=[compute_gauges+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=433.4MB  dur=0.0s  process_peak=433MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[LIVE] t=142s  RSS=433MB  peak=433MB  (limit: 512MB)  active=[get_brand_intelligence]
[EXIT]  get_brand_intelligence   RSS=408.5MB  dur=12.1s  process_peak=433MB  active=[get_brand_intelligence~]
INFO:     172.17.0.1:36586 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[LIVE] t=152s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=162s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=172s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=186s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=196s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=206s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=216s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=226s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=236s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=246s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=256s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=266s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=276s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=286s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=296s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=306s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=316s  RSS=408MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=326s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=336s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=346s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=356s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=366s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=376s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=386s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=396s  RSS=409MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=406s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=416s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=426s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=436s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=446s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=456s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=466s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=476s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=486s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=496s  RSS=410MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=506s  RSS=411MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=516s  RSS=411MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=526s  RSS=411MB  peak=433MB  (limit: 512MB)  active=[idle]
[ENTER] list_clients   RSS=410.8MB  t=529s  active=[list_clients]
[EXIT]  list_clients   RSS=410.8MB  dur=2.8s  process_peak=433MB  active=[list_clients~]
INFO:     172.17.0.1:55996 - "GET /api/clients HTTP/1.1" 200 OK
[LIVE] t=536s  RSS=411MB  peak=433MB  (limit: 512MB)  active=[idle]
[LIVE] t=546s  RSS=411MB  peak=433MB  (limit: 512MB)  active=[idle]
[ENTER] get_client_reports   RSS=411.0MB  t=551s  active=[get_client_reports]
[ENTER] get_brand_intelligence   RSS=411.0MB  t=552s  active=[get_brand_intelligence+get_client_reports]
[ENTER] get_automatic_competitors   RSS=411.0MB  t=552s  active=[get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] get_client_blogs   RSS=411.0MB  t=552s  active=[get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
[ENTER] fetch_automatic_competitors   RSS=411.0MB  t=552s  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
competitor_intelligence: Running automatic analysis for 'thegoodweight' in 'Weight loss training'
[EXIT]  get_client_reports   RSS=411.0MB  dur=2.9s  process_peak=433MB  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports~]
[EXIT]  get_client_blogs   RSS=411.0MB  dur=2.5s  process_peak=433MB  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs~+get_client_reports~]
INFO:     172.17.0.1:54498 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/reports HTTP/1.1" 200 OK
[ENTER] compute_brand_health   RSS=411.0MB  t=555s  active=[compute_brand_health+fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs~+get_client_reports~]
[EXIT]  compute_brand_health   RSS=411.0MB  dur=0.3s  process_peak=433MB  active=[compute_brand_health~+fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence]
INFO:     172.17.0.1:54516 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client eca3a2d1-30d6-4163-a70a-ec7b703e269d at https://thegoodweight.com/
INFO:httpx:HTTP Request: GET https://thegoodweight.com/feed "HTTP/1.1 301 Moved Permanently"
INFO:httpx:HTTP Request: GET https://thegoodweight.com/feed/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: POST https://api.groq.com/openai/v1/chat/completions "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: POST https://api.groq.com/openai/v1/chat/completions "HTTP/1.1 200 OK"
[LIVE] t=556s  RSS=411MB  peak=433MB  (limit: 512MB)  active=[compute_brand_health~+fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence]
[ENTER] fetch_client_blogs   RSS=411.0MB  t=556s  active=[compute_brand_health~+fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence]
[ENTER] get_industry_news   RSS=411.7MB  t=565s  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_industry_news]
[LIVE] t=566s  RSS=412MB  peak=433MB  (limit: 512MB)  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_industry_news]
[ENTER] refresh_token   RSS=411.8MB  t=567s  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] get_brand_intelligence   RSS=412.0MB  t=569s  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] compute_brand_health   RSS=412.2MB  t=572s  active=[compute_brand_health+fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[EXIT]  compute_brand_health   RSS=412.2MB  dur=0.0s  process_peak=433MB  active=[compute_brand_health~+fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] get_calendar_data   RSS=412.2MB  t=572s  active=[compute_brand_health~+fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_calendar_data+get_industry_news+refresh_token]
[EXIT]  get_calendar_data   RSS=412.3MB  dur=2.1s  process_peak=433MB  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_calendar_data~+get_industry_news+refresh_token]
[ENTER] fetch_public_profile   RSS=412.4MB  t=576s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[EXIT]  fetch_public_profile   RSS=412.4MB  dur=0.0s  process_peak=433MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] fetch_public_profile   RSS=412.4MB  t=576s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[EXIT]  fetch_public_profile   RSS=412.4MB  dur=0.0s  process_peak=433MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] fetch_public_profile   RSS=412.4MB  t=576s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[EXIT]  fetch_public_profile   RSS=412.4MB  dur=0.1s  process_peak=433MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] fetch_public_profile   RSS=412.4MB  t=576s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
news_api: Fetching with query: 'Weight loss training Good weight'
[EXIT]  fetch_public_profile   RSS=412.4MB  dur=0.0s  process_peak=433MB  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[LIVE] t=577s  RSS=412MB  peak=433MB  (limit: 512MB)  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[ENTER] fetch_industry_news_modular   RSS=412.4MB  t=577s  active=[fetch_automatic_competitors+fetch_client_blogs+fetch_industry_news_modular+fetch_public_profile~+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
news_api: Fetching fresh news for 'Weight loss training Good weight'
GNewsSource: No API key found in env.
[EXIT]  fetch_automatic_competitors   RSS=412.4MB  dur=28.7s  process_peak=433MB  active=[fetch_automatic_competitors~+fetch_client_blogs+fetch_industry_news_modular+get_automatic_competitors+get_brand_intelligence+get_industry_news+refresh_token]
[EXIT]  get_automatic_competitors   RSS=412.4MB  dur=29.0s  process_peak=433MB  active=[fetch_automatic_competitors~+fetch_client_blogs+fetch_industry_news_modular+get_automatic_competitors~+get_brand_intelligence+get_industry_news+refresh_token]
[LIVE] t=587s  RSS=412MB  peak=433MB  (limit: 512MB)  active=[fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news+refresh_token]
INFO:     172.17.0.1:40180 - "GET /api/calendar/eca3a2d1-30d6-4163-a70a-ec7b703e269d HTTP/1.1" 200 OK
INFO:     172.17.0.1:54506 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/automatic-competitors HTTP/1.1" 200 OK
[EXIT]  refresh_token   RSS=412.4MB  dur=25.9s  process_peak=433MB  active=[fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news+refresh_token~]
INFO:     172.17.0.1:52862 - "POST /api/auth/refresh HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Discovered valid RSS feed at https://thegoodweight.com/feed
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 10 | Unique deduplicated count: 10
[LIVE] t=605s  RSS=412MB  peak=433MB  (limit: 512MB)  active=[fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[LIVE] t=645s  RSS=485MB  peak=485MB  (limit: 512MB)  active=[fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[ENTER] generate_insights   RSS=442.6MB  t=649s  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news]
[ENTER] parse_platform_metrics   RSS=442.6MB  t=649s  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics]
[ENTER] generate_insights   RSS=443.1MB  t=649s  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=444.1MB  dur=0.1s  process_peak=485MB  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] parse_platform_metrics   RSS=444.7MB  t=650s  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=444.8MB  dur=0.1s  process_peak=485MB  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=444.8MB  dur=4.1s  process_peak=485MB  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=444.8MB  dur=4.5s  process_peak=485MB  active=[fetch_client_blogs+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=446.7MB  t=654s  active=[compute_gauges+fetch_client_blogs+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=446.8MB  dur=0.0s  process_peak=485MB  active=[compute_gauges~+fetch_client_blogs+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=446.6MB  t=655s  active=[compute_gauges+compute_gauges~+fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[EXIT]  compute_gauges   RSS=447.5MB  dur=0.0s  process_peak=485MB  active=[compute_gauges~+fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[LIVE] t=655s  RSS=447MB  peak=485MB  (limit: 512MB)  active=[compute_gauges~+fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[EXIT]  get_brand_intelligence   RSS=447.6MB  dur=104.0s  process_peak=485MB  active=[compute_gauges~+fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence~+get_industry_news]
[EXIT]  get_brand_intelligence   RSS=447.6MB  dur=86.5s  process_peak=485MB  active=[compute_gauges~+fetch_client_blogs+fetch_industry_news_modular+get_brand_intelligence~+get_industry_news]
[BLOG PARSE] extracted_url=https://thegoodweight.com/dr-neha-shah/ article_title=Dr Neha Shah — India’s Leading Obesity Specialist publish_date=2026-06-05T11:16:17
[BLOG PARSE] extracted_url=https://thegoodweight.com/evidence-based-diet-plan-steps-2/ article_title=7 Evidence-Based Steps to Build a Diet Plan That Actually Works publish_date=2026-06-05T07:35:31
[BLOG PARSE] extracted_url=https://thegoodweight.com/elementor-14530/ article_title=Elementor #14530 publish_date=2026-06-04T10:32:28
[EXIT]  fetch_industry_news_modular   RSS=449.8MB  dur=80.5s  process_peak=485MB  active=[fetch_client_blogs+fetch_industry_news_modular~+get_industry_news]
news_api: Successfully fetched 6 articles for 'Weight loss training Good weight'
[EXIT]  get_industry_news   RSS=449.8MB  dur=91.9s  process_peak=485MB  active=[fetch_client_blogs+fetch_industry_news_modular~+get_industry_news~]
[BLOG PARSE] extracted_url=https://thegoodweight.com/sustainable-weight-management-tips-chennai-2/ article_title=10 Practical Tips for Sustainable Weight Management in Chennai publish_date=2026-06-04T10:05:56
[BLOG PARSE] extracted_url=https://thegoodweight.com/weight-loss-injection-chennai-glp1-programs-2/ article_title=Weight Loss Injection in Chennai: 7 Reasons to Choose Doctor‑Led GLP‑1 Programs publish_date=2026-06-04T10:02:44
[BLOG PARSE] extracted_url=https://thegoodweight.com/indian-diet-plan-for-weight-loss-guide-2/ article_title=Diet Plan for Weight Loss: Data-Backed Indian Guide for Sustainable Results publish_date=2026-06-03T10:08:12
[BLOG PARSE] extracted_url=https://thegoodweight.com/online-weight-loss-coaching-india-guide-2/ article_title=Your Definitive Guide to Online Weight Loss Coaching in India publish_date=2026-06-03T07:46:42
[BLOG PARSE] extracted_url=https://thegoodweight.com/diabetic-weight-loss-diet-guide-for-seniors-with-indian-meals-2/ article_title=Diabetic Weight Loss Diet Guide for Seniors with Indian Meals publish_date=2026-06-03T07:45:13
[BLOG PARSE] extracted_url=https://thegoodweight.com/pcos-weight-loss-diet-guide-indian-working-women-2/ article_title=PCOS Weight Loss Diet: A Symptom‑First, Clinically Grounded Guide for Working Women in India publish_date=2026-04-28T09:49:38
[BLOG PARSE] extracted_url=https://thegoodweight.com/evidence-backed-diet-plan-strategies-2/ article_title=7 Evidence‑Backed Diet Plan Strategies That Truly Deliver Lasting Results publish_date=2026-04-18T20:34:22
[EXIT]  fetch_client_blogs   RSS=449.8MB  dur=102.0s  process_peak=485MB  active=[fetch_client_blogs~+fetch_industry_news_modular~+get_industry_news~]
[ENTER] get_brand_intelligence   RSS=449.8MB  t=658s  active=[fetch_client_blogs~+fetch_industry_news_modular~+get_brand_intelligence+get_industry_news~]
INFO:     172.17.0.1:54530 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram HTTP/1.1" 200 OK
INFO:     172.17.0.1:40154 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:40168 - "GET /api/industry-news?industry=Weight%20loss%20training&client_id=eca3a2d1-30d6-4163-a70a-ec7b703e269d HTTP/1.1" 200 OK
[ENTER] get_calendar_data   RSS=449.8MB  t=658s  active=[fetch_client_blogs~+get_brand_intelligence+get_calendar_data]
[ENTER] get_brand_intelligence   RSS=449.8MB  t=658s  active=[fetch_client_blogs~+get_brand_intelligence+get_calendar_data]
[ENTER] get_brand_intelligence   RSS=449.8MB  t=659s  active=[fetch_client_blogs~+get_brand_intelligence+get_calendar_data]
[ENTER] get_brand_intelligence   RSS=449.8MB  t=659s  active=[fetch_client_blogs~+get_brand_intelligence+get_calendar_data]
[ENTER] get_automatic_competitors   RSS=449.8MB  t=659s  active=[fetch_client_blogs~+get_automatic_competitors+get_brand_intelligence+get_calendar_data]
[EXIT]  get_calendar_data   RSS=449.8MB  dur=0.3s  process_peak=485MB  active=[fetch_client_blogs~+get_automatic_competitors+get_brand_intelligence+get_calendar_data~]
[ENTER] compute_brand_health   RSS=449.8MB  t=659s  active=[compute_brand_health+fetch_client_blogs~+get_automatic_competitors+get_brand_intelligence+get_calendar_data~]
[EXIT]  compute_brand_health   RSS=449.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+fetch_client_blogs~+get_automatic_competitors+get_brand_intelligence+get_calendar_data~]
INFO:     172.17.0.1:46094 - "GET /api/calendar/eca3a2d1-30d6-4163-a70a-ec7b703e269d HTTP/1.1" 200 OK
[ENTER] fetch_automatic_competitors   RSS=449.8MB  t=659s  active=[compute_brand_health~+fetch_automatic_competitors+fetch_client_blogs~+get_automatic_competitors+get_brand_intelligence+get_calendar_data~]
competitor_intelligence: Serving cached results for 'thegoodweight'
[EXIT]  fetch_automatic_competitors   RSS=449.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors+get_brand_intelligence+get_calendar_data~]
[EXIT]  get_automatic_competitors   RSS=449.8MB  dur=0.1s  process_peak=485MB  active=[compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~]
[ENTER] compute_brand_health   RSS=449.8MB  t=659s  active=[compute_brand_health+compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~]
[EXIT]  compute_brand_health   RSS=449.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~]
INFO:     172.17.0.1:41890 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/automatic-competitors HTTP/1.1" 200 OK
[ENTER] get_client_reports   RSS=449.8MB  t=659s  active=[compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports]
[ENTER] compute_brand_health   RSS=449.8MB  t=659s  active=[compute_brand_health+compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports]
[EXIT]  compute_brand_health   RSS=449.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+fetch_automatic_competitors~+fetch_client_blogs~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports]
[ENTER] compute_brand_health   RSS=449.8MB  t=659s  active=[compute_brand_health+compute_brand_health~+fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports]
[EXIT]  compute_brand_health   RSS=449.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports]
[ENTER] get_brand_intelligence   RSS=449.8MB  t=659s  active=[compute_brand_health~+fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports]
[EXIT]  get_client_reports   RSS=449.8MB  dur=0.6s  process_peak=485MB  active=[compute_brand_health~+fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_calendar_data~+get_client_reports~]
INFO:     172.17.0.1:41894 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/reports HTTP/1.1" 200 OK
[ENTER] compute_brand_health   RSS=449.8MB  t=660s  active=[compute_brand_health+compute_brand_health~+get_brand_intelligence+get_client_reports~]
[EXIT]  compute_brand_health   RSS=449.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+get_brand_intelligence+get_client_reports~]
[ENTER] get_client_blogs   RSS=449.8MB  t=660s  active=[compute_brand_health~+get_brand_intelligence+get_client_blogs+get_client_reports~]
[EXIT]  get_client_blogs   RSS=449.8MB  dur=0.4s  process_peak=485MB  active=[compute_brand_health~+get_brand_intelligence+get_client_blogs~]
INFO:     172.17.0.1:41900 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client eca3a2d1-30d6-4163-a70a-ec7b703e269d at https://thegoodweight.com/
INFO:httpx:HTTP Request: GET https://thegoodweight.com/feed "HTTP/1.1 301 Moved Permanently"
INFO:httpx:HTTP Request: GET https://thegoodweight.com/feed/ "HTTP/1.1 200 OK"
INFO:services.blog_ingestor:Discovered valid RSS feed at https://thegoodweight.com/feed
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 10 | Unique deduplicated count: 10
[ENTER] fetch_client_blogs   RSS=449.8MB  t=661s  active=[fetch_client_blogs+get_brand_intelligence+get_client_blogs~]
[LIVE] t=666s  RSS=450MB  peak=485MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence]
[ENTER] get_calendar_data   RSS=450.0MB  t=666s  active=[fetch_client_blogs+get_brand_intelligence+get_calendar_data]
[EXIT]  get_calendar_data   RSS=450.0MB  dur=0.4s  process_peak=485MB  active=[fetch_client_blogs+get_brand_intelligence+get_calendar_data~]
[ENTER] generate_insights   RSS=460.6MB  t=669s  active=[fetch_client_blogs+generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=460.6MB  t=669s  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=460.6MB  dur=0.1s  process_peak=485MB  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=460.6MB  dur=0.2s  process_peak=485MB  active=[fetch_client_blogs+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=460.6MB  t=670s  active=[compute_gauges+fetch_client_blogs+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=460.6MB  dur=0.0s  process_peak=485MB  active=[compute_gauges~+fetch_client_blogs+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=460.6MB  dur=13.5s  process_peak=485MB  active=[fetch_client_blogs+get_brand_intelligence~]
[LIVE] t=692s  RSS=461MB  peak=485MB  (limit: 512MB)  active=[fetch_client_blogs]
[BLOG PARSE] extracted_url=https://thegoodweight.com/dr-neha-shah/ article_title=Dr Neha Shah — India’s Leading Obesity Specialist publish_date=2026-06-05T11:16:17
[BLOG PARSE] extracted_url=https://thegoodweight.com/evidence-based-diet-plan-steps-2/ article_title=7 Evidence-Based Steps to Build a Diet Plan That Actually Works publish_date=2026-06-05T07:35:31
[BLOG PARSE] extracted_url=https://thegoodweight.com/elementor-14530/ article_title=Elementor #14530 publish_date=2026-06-04T10:32:28
[BLOG PARSE] extracted_url=https://thegoodweight.com/sustainable-weight-management-tips-chennai-2/ article_title=10 Practical Tips for Sustainable Weight Management in Chennai publish_date=2026-06-04T10:05:56
[BLOG PARSE] extracted_url=https://thegoodweight.com/weight-loss-injection-chennai-glp1-programs-2/ article_title=Weight Loss Injection in Chennai: 7 Reasons to Choose Doctor‑Led GLP‑1 Programs publish_date=2026-06-04T10:02:44
[BLOG PARSE] extracted_url=https://thegoodweight.com/indian-diet-plan-for-weight-loss-guide-2/ article_title=Diet Plan for Weight Loss: Data-Backed Indian Guide for Sustainable Results publish_date=2026-06-03T10:08:12
[BLOG PARSE] extracted_url=https://thegoodweight.com/online-weight-loss-coaching-india-guide-2/ article_title=Your Definitive Guide to Online Weight Loss Coaching in India publish_date=2026-06-03T07:46:42
[BLOG PARSE] extracted_url=https://thegoodweight.com/diabetic-weight-loss-diet-guide-for-seniors-with-indian-meals-2/ article_title=Diabetic Weight Loss Diet Guide for Seniors with Indian Meals publish_date=2026-06-03T07:45:13
[BLOG PARSE] extracted_url=https://thegoodweight.com/pcos-weight-loss-diet-guide-indian-working-women-2/ article_title=PCOS Weight Loss Diet: A Symptom‑First, Clinically Grounded Guide for Working Women in India publish_date=2026-04-28T09:49:38
[BLOG PARSE] extracted_url=https://thegoodweight.com/evidence-backed-diet-plan-strategies-2/ article_title=7 Evidence‑Backed Diet Plan Strategies That Truly Deliver Lasting Results publish_date=2026-04-18T20:34:22
[EXIT]  fetch_client_blogs   RSS=460.6MB  dur=40.4s  process_peak=485MB  active=[fetch_client_blogs~]
[LIVE] t=702s  RSS=461MB  peak=485MB  (limit: 512MB)  active=[fetch_client_blogs~]
INFO:     172.17.0.1:41880 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:41906 - "GET /api/calendar/eca3a2d1-30d6-4163-a70a-ec7b703e269d HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=460.6MB  t=703s  active=[get_brand_intelligence]
[ENTER] get_calendar_data   RSS=460.6MB  t=703s  active=[get_brand_intelligence+get_calendar_data]
[EXIT]  get_calendar_data   RSS=460.6MB  dur=0.4s  process_peak=485MB  active=[get_brand_intelligence+get_calendar_data~]
[ENTER] compute_brand_health   RSS=460.6MB  t=704s  active=[compute_brand_health+get_brand_intelligence+get_calendar_data~]
[EXIT]  compute_brand_health   RSS=460.6MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+get_brand_intelligence+get_calendar_data~]
INFO:     172.17.0.1:55500 - "GET /api/calendar/eca3a2d1-30d6-4163-a70a-ec7b703e269d HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=460.6MB  t=704s  active=[compute_brand_health~+get_brand_intelligence+get_calendar_data~]
[ENTER] compute_brand_health   RSS=462.6MB  t=706s  active=[compute_brand_health+get_brand_intelligence]
[EXIT]  compute_brand_health   RSS=462.8MB  dur=0.0s  process_peak=485MB  active=[compute_brand_health~+get_brand_intelligence]
[LIVE] t=746s  RSS=476MB  peak=485MB  (limit: 512MB)  active=[get_brand_intelligence]
[LIVE] t=799s  RSS=512MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence]
[LIVE] t=810s  RSS=506MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence]
[ENTER] generate_insights   RSS=313.4MB  t=815s  active=[generate_insights+get_brand_intelligence]
[ENTER] generate_insights   RSS=313.4MB  t=815s  active=[generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=313.4MB  t=815s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[ENTER] parse_platform_metrics   RSS=313.4MB  t=815s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=313.4MB  dur=0.0s  process_peak=512MB  active=[generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=313.4MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=313.5MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=313.6MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] generate_insights   RSS=314.1MB  t=816s  active=[generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] parse_platform_metrics   RSS=314.3MB  t=816s  active=[generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[ENTER] generate_insights   RSS=314.4MB  t=816s  active=[generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[ENTER] parse_platform_metrics   RSS=314.4MB  t=816s  active=[generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=314.4MB  dur=0.0s  process_peak=512MB  active=[generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=314.4MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=314.4MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=314.4MB  dur=0.1s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=314.4MB  t=816s  active=[compute_gauges+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=314.5MB  dur=0.1s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] generate_insights   RSS=314.5MB  t=816s  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] parse_platform_metrics   RSS=314.5MB  t=816s  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=314.5MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=314.5MB  dur=0.1s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] generate_insights   RSS=314.5MB  t=816s  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=314.5MB  t=816s  active=[compute_gauges+compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=314.5MB  t=816s  active=[compute_gauges+compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] parse_platform_metrics   RSS=314.5MB  t=816s  active=[compute_gauges+compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=314.5MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=314.5MB  t=816s  active=[compute_gauges+compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=314.5MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=314.5MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=314.5MB  dur=0.1s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=314.5MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=314.5MB  t=816s  active=[compute_gauges+compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=314.5MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=314.5MB  dur=111.8s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=315.0MB  t=816s  active=[compute_gauges+compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=315.5MB  dur=157.7s  process_peak=512MB  active=[compute_gauges+compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=315.4MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=315.4MB  dur=113.5s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=315.5MB  dur=157.1s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=316.0MB  dur=158.1s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=300.7MB  dur=158.7s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
INFO:     172.17.0.1:55486 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:57226 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:41896 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram HTTP/1.1" 200 OK
INFO:     172.17.0.1:45848 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:41878 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:46092 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] get_calendar_data   RSS=289.9MB  t=818s  active=[get_calendar_data]
[ENTER] get_brand_intelligence   RSS=289.9MB  t=818s  active=[get_brand_intelligence+get_calendar_data]
[ENTER] get_brand_intelligence   RSS=289.9MB  t=818s  active=[get_brand_intelligence+get_calendar_data]
[EXIT]  get_calendar_data   RSS=290.1MB  dur=0.3s  process_peak=512MB  active=[get_brand_intelligence+get_calendar_data~]
INFO:     172.17.0.1:51852 - "GET /api/calendar/eca3a2d1-30d6-4163-a70a-ec7b703e269d HTTP/1.1" 200 OK
[ENTER] compute_brand_health   RSS=290.1MB  t=819s  active=[compute_brand_health+get_brand_intelligence+get_calendar_data~]
[EXIT]  compute_brand_health   RSS=290.1MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+get_brand_intelligence+get_calendar_data~]
[ENTER] compute_brand_health   RSS=290.1MB  t=819s  active=[compute_brand_health+compute_brand_health~+get_brand_intelligence+get_calendar_data~]
[EXIT]  compute_brand_health   RSS=290.1MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+get_brand_intelligence+get_calendar_data~]
[LIVE] t=820s  RSS=291MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence]
[ENTER] generate_insights   RSS=296.1MB  t=826s  active=[generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=296.1MB  t=826s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=296.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=296.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=296.1MB  t=826s  active=[compute_gauges+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=296.1MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=296.1MB  dur=7.8s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
INFO:     172.17.0.1:51854 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=296.1MB  t=826s  active=[compute_gauges~+generate_insights~+get_brand_intelligence+get_brand_intelligence~+parse_platform_metrics~]
[ENTER] compute_brand_health   RSS=296.1MB  t=827s  active=[compute_brand_health+get_brand_intelligence+get_brand_intelligence~]
[EXIT]  compute_brand_health   RSS=296.1MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+get_brand_intelligence+get_brand_intelligence~]
[LIVE] t=830s  RSS=299MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence]
[ENTER] generate_insights   RSS=299.1MB  t=830s  active=[generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=299.1MB  t=830s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=299.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=299.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=299.1MB  t=830s  active=[compute_gauges+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=299.1MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=299.1MB  dur=12.8s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
INFO:     172.17.0.1:51876 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] generate_insights   RSS=300.1MB  t=832s  active=[generate_insights+get_brand_intelligence~]
[ENTER] parse_platform_metrics   RSS=300.1MB  t=832s  active=[generate_insights+get_brand_intelligence~+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=300.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights+get_brand_intelligence~+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=300.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=300.1MB  t=832s  active=[compute_gauges+generate_insights~+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=300.1MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=300.1MB  dur=5.9s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
INFO:     172.17.0.1:54840 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=300.1MB  t=833s  active=[compute_gauges~+generate_insights~+get_brand_intelligence+get_brand_intelligence~+parse_platform_metrics~]
[ENTER] compute_brand_health   RSS=300.1MB  t=833s  active=[compute_brand_health+get_brand_intelligence+get_brand_intelligence~]
[EXIT]  compute_brand_health   RSS=300.1MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+get_brand_intelligence+get_brand_intelligence~]
[ENTER] generate_insights   RSS=300.7MB  t=838s  active=[generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=300.7MB  t=838s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=300.7MB  dur=0.0s  process_peak=512MB  active=[generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=300.7MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=300.7MB  t=838s  active=[compute_gauges+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=300.7MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=300.7MB  dur=6.1s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence~+parse_platform_metrics~]
INFO:     172.17.0.1:54846 - "GET /api/clients/eca3a2d1-30d6-4163-a70a-ec7b703e269d/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[LIVE] t=840s  RSS=301MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence~]
[LIVE] t=850s  RSS=301MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=860s  RSS=301MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=870s  RSS=301MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=880s  RSS=302MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=890s  RSS=302MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=900s  RSS=302MB  peak=512MB  (limit: 512MB)  active=[idle]
[ENTER] list_clients   RSS=246.9MB  t=903s  active=[list_clients]
[EXIT]  list_clients   RSS=247.5MB  dur=2.7s  process_peak=512MB  active=[list_clients~]
INFO:     172.17.0.1:50930 - "GET /api/clients HTTP/1.1" 200 OK
[LIVE] t=910s  RSS=248MB  peak=512MB  (limit: 512MB)  active=[idle]
[ENTER] get_automatic_competitors   RSS=247.8MB  t=910s  active=[get_automatic_competitors]
[ENTER] get_brand_intelligence   RSS=247.8MB  t=910s  active=[get_automatic_competitors+get_brand_intelligence]
[ENTER] get_client_reports   RSS=247.8MB  t=910s  active=[get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] fetch_automatic_competitors   RSS=247.8MB  t=910s  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_reports]
competitor_intelligence: Serving cached results for 'omnevum'
[EXIT]  fetch_automatic_competitors   RSS=247.8MB  dur=0.0s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[EXIT]  get_automatic_competitors   RSS=247.8MB  dur=0.4s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_client_reports]
[ENTER] get_client_blogs   RSS=247.8MB  t=910s  active=[fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_client_blogs+get_client_reports]
INFO:     172.17.0.1:50350 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/automatic-competitors HTTP/1.1" 200 OK
[EXIT]  get_client_blogs   RSS=247.9MB  dur=0.3s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_client_blogs~+get_client_reports]
INFO:     172.17.0.1:50360 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client e43ee24b-1d87-4570-8337-ecd6f348855b at https://omnevum.com/blog/
[ENTER] fetch_client_blogs   RSS=247.9MB  t=911s  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors~+get_brand_intelligence+get_client_blogs~+get_client_reports]
[LIVE] t=920s  RSS=249MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports]
[ENTER] get_automatic_competitors   RSS=267.9MB  t=929s  active=[fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_client_reports]
[ENTER] get_client_blogs   RSS=271.9MB  t=929s  active=[fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
[ENTER] fetch_automatic_competitors   RSS=271.9MB  t=929s  active=[fetch_automatic_competitors+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
competitor_intelligence: Serving cached results for 'omnevum'
[EXIT]  fetch_automatic_competitors   RSS=271.9MB  dur=0.0s  process_peak=512MB  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
[EXIT]  get_automatic_competitors   RSS=272.2MB  dur=0.5s  process_peak=512MB  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors~+get_brand_intelligence+get_client_blogs+get_client_reports]
[EXIT]  get_client_blogs   RSS=272.4MB  dur=0.5s  process_peak=512MB  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors~+get_brand_intelligence+get_client_blogs~+get_client_reports]
[LIVE] t=930s  RSS=273MB  peak=512MB  (limit: 512MB)  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors~+get_brand_intelligence+get_client_blogs~+get_client_reports]
INFO:     172.17.0.1:51766 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/automatic-competitors HTTP/1.1" 200 OK
INFO:     172.17.0.1:45012 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client e43ee24b-1d87-4570-8337-ecd6f348855b at https://omnevum.com/blog/
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed "HTTP/1.1 301 Moved Permanently"
[ENTER] fetch_client_blogs   RSS=285.6MB  t=932s  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports]
[ENTER] compute_brand_health   RSS=379.4MB  t=939s  active=[compute_brand_health+fetch_client_blogs+get_brand_intelligence+get_client_reports]
[EXIT]  compute_brand_health   RSS=379.4MB  dur=0.1s  process_peak=512MB  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+get_client_reports]
[EXIT]  get_client_reports   RSS=379.4MB  dur=29.0s  process_peak=512MB  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+get_client_reports~]
[LIVE] t=946s  RSS=425MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence]
INFO:     172.17.0.1:50338 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/reports HTTP/1.1" 200 OK
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed/ "HTTP/1.1 200 OK"
INFO:services.blog_ingestor:Discovered valid RSS feed at https://omnevum.com/blog/feed
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 9 | Unique deduplicated count: 9
[ENTER] get_client_reports   RSS=366.7MB  t=948s  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports]
[ENTER] get_brand_intelligence   RSS=366.7MB  t=948s  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports]
[ENTER] generate_insights   RSS=367.7MB  t=955s  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+get_client_reports]
[ENTER] parse_platform_metrics   RSS=367.8MB  t=955s  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+get_client_reports+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=367.8MB  dur=0.1s  process_peak=512MB  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+get_client_reports+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=367.8MB  dur=0.2s  process_peak=512MB  active=[fetch_client_blogs+generate_insights~+get_brand_intelligence+get_client_reports+parse_platform_metrics~]
[LIVE] t=957s  RSS=368MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+generate_insights~+get_brand_intelligence+get_client_reports]
[ENTER] compute_gauges   RSS=368.3MB  t=959s  active=[compute_gauges+fetch_client_blogs+get_brand_intelligence+get_client_reports]
[EXIT]  compute_gauges   RSS=368.3MB  dur=0.2s  process_peak=512MB  active=[compute_gauges~+fetch_client_blogs+get_brand_intelligence+get_client_reports]
[LIVE] t=967s  RSS=370MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports]
[EXIT]  get_brand_intelligence   RSS=370.3MB  dur=63.9s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence~+get_client_reports]
[LIVE] t=977s  RSS=371MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_client_reports]
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/why-every-home-needs-energy-alignment-for-better-living/ article_title=Why Every Home Needs Energy Alignment for Better Living publish_date=2026-05-25T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/reconnecting-with-prakruthi-why-nature-alignment-is-essential-for-human-and-planetary-balance/ article_title=Reconnecting with Prakruthi: Why Nature Alignment Is Essential for Human and Planetary Balance publish_date=2026-05-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/beyond-religion-a-unified-approach-to-human-consciousness-and-collective-evolution/ article_title=Beyond Religion: A Unified Approach to Human Consciousness and Collective Evolution publish_date=2026-05-15T09:22:43
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/beyond-the-physical-understanding-subtle-technologies-and-environmental-fields/ article_title=Beyond the Physical: Understanding Subtle Technologies and Environmental Fields publish_date=2026-04-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/ground-to-growth-how-nature-and-earth-based-systems-create-environmental-stability/ article_title=Ground to Growth: How Nature and Earth-Based Systems Create Environmental Stability publish_date=2026-04-17T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/universal-recalibration-restoring-balance-in-an-interconnected-world/ article_title=Universal Recalibration: Restoring Balance in an Interconnected World publish_date=2026-04-10T11:04:06
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/how-your-environment-affects-your-mood-and-productivity/ article_title=How Your Environment Affects Your Mood and Productivity publish_date=2026-03-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/why-alignment-matters-more-than-motivation/ article_title=Why Alignment Matters More Than Motivation publish_date=2026-03-16T09:12:49
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/what-does-omnevum-mean-in-modern-life/ article_title=What Does Omnevum Mean in Modern Life? publish_date=2026-03-06T09:50:53
[EXIT]  fetch_client_blogs   RSS=377.2MB  dur=75.0s  process_peak=512MB  active=[fetch_client_blogs~+get_client_reports]
[LIVE] t=987s  RSS=379MB  peak=512MB  (limit: 512MB)  active=[get_client_reports]
[EXIT]  get_client_reports   RSS=417.6MB  dur=45.4s  process_peak=512MB  active=[get_client_reports~]
[ENTER] get_automatic_competitors   RSS=417.6MB  t=994s  active=[get_automatic_competitors+get_client_reports~]
[ENTER] get_client_blogs   RSS=417.6MB  t=994s  active=[get_automatic_competitors+get_client_blogs+get_client_reports~]
[ENTER] fetch_automatic_competitors   RSS=417.6MB  t=995s  active=[fetch_automatic_competitors+get_automatic_competitors+get_client_blogs+get_client_reports~]
competitor_intelligence: Serving cached results for 'omnevum'
[EXIT]  fetch_automatic_competitors   RSS=417.6MB  dur=0.0s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors+get_client_blogs+get_client_reports~]
[EXIT]  get_automatic_competitors   RSS=417.6MB  dur=0.8s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors~+get_client_blogs+get_client_reports~]
[LIVE] t=1001s  RSS=464MB  peak=512MB  (limit: 512MB)  active=[get_client_blogs]
[EXIT]  get_client_blogs   RSS=440.9MB  dur=8.5s  process_peak=512MB  active=[get_client_blogs~]
INFO:     172.17.0.1:50346 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram HTTP/1.1" 200 OK
INFO:     172.17.0.1:49098 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/automatic-competitors HTTP/1.1" 200 OK
INFO:     172.17.0.1:45246 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/reports HTTP/1.1" 200 OK
INFO:     172.17.0.1:49112 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client e43ee24b-1d87-4570-8337-ecd6f348855b at https://omnevum.com/blog/
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/blog/rss "HTTP/1.1 404 Not Found"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed "HTTP/1.1 301 Moved Permanently"
[ENTER] fetch_client_blogs   RSS=381.3MB  t=1005s  active=[fetch_client_blogs]
[ENTER] get_client_reports   RSS=381.6MB  t=1008s  active=[fetch_client_blogs+get_client_reports]
[ENTER] refresh_token   RSS=381.6MB  t=1008s  active=[fetch_client_blogs+get_client_reports+refresh_token]
[ENTER] list_clients   RSS=381.7MB  t=1010s  active=[fetch_client_blogs+get_client_reports+list_clients+refresh_token]
[ENTER] get_brand_intelligence   RSS=382.3MB  t=1010s  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports+list_clients+refresh_token]
[ENTER] list_clients   RSS=386.5MB  t=1011s  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports+list_clients+refresh_token]
[LIVE] t=1014s  RSS=396MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports+list_clients+refresh_token]
[EXIT]  get_client_reports   RSS=465.1MB  dur=13.8s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence+get_client_reports~+list_clients+refresh_token]
[LIVE] t=1024s  RSS=465MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence+list_clients+refresh_token]
[EXIT]  list_clients   RSS=499.3MB  dur=74.6s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[LIVE] t=1087s  RSS=501MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[ENTER] compute_brand_health   RSS=501.7MB  t=1088s  active=[compute_brand_health+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[ENTER] compute_brand_health   RSS=501.7MB  t=1088s  active=[compute_brand_health+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[EXIT]  compute_brand_health   RSS=502.0MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[EXIT]  compute_brand_health   RSS=502.1MB  dur=0.3s  process_peak=512MB  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[EXIT]  list_clients   RSS=500.1MB  dur=77.4s  process_peak=512MB  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token]
[EXIT]  refresh_token   RSS=501.5MB  dur=80.0s  process_peak=512MB  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token~]
[ENTER] refresh_token   RSS=496.3MB  t=1089s  active=[compute_brand_health~+fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token+refresh_token~]
[EXIT]  refresh_token   RSS=497.5MB  dur=0.4s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence+list_clients~+refresh_token~]
INFO:     172.17.0.1:40318 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/reports HTTP/1.1" 200 OK
INFO:     172.17.0.1:56080 - "GET /api/clients HTTP/1.1" 200 OK
INFO:     172.17.0.1:56108 - "GET /api/clients HTTP/1.1" 200 OK
INFO:     172.17.0.1:56094 - "POST /api/auth/refresh HTTP/1.1" 200 OK
[ENTER] logout   RSS=436.9MB  t=1095s  active=[fetch_client_blogs+get_brand_intelligence+logout]
[ENTER] login   RSS=455.8MB  t=1096s  active=[fetch_client_blogs+get_brand_intelligence+login+logout]
INFO:     172.17.0.1:56124 - "POST /api/auth/refresh HTTP/1.1" 401 Unauthorized
[ENTER] list_clients   RSS=438.1MB  t=1096s  active=[fetch_client_blogs+get_brand_intelligence+list_clients+login+logout]
[ENTER] generate_insights   RSS=438.1MB  t=1097s  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+list_clients+login+logout]
[ENTER] parse_platform_metrics   RSS=438.1MB  t=1097s  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+list_clients+login+logout+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=438.3MB  dur=0.0s  process_peak=512MB  active=[fetch_client_blogs+generate_insights+get_brand_intelligence+list_clients+login+logout+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=438.3MB  dur=0.2s  process_peak=512MB  active=[fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+logout+parse_platform_metrics~]
[LIVE] t=1097s  RSS=438MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+logout+parse_platform_metrics~]
[EXIT]  logout   RSS=438.6MB  dur=1.9s  process_peak=512MB  active=[fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+logout~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=438.6MB  t=1097s  active=[compute_gauges+fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+logout~+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=438.6MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+logout~+parse_platform_metrics~]
[DEBUG] Login lookup - Identifier: 'Jaishree', User found: True, ClientAccess found: False
INFO:     172.17.0.1:50674 - "POST /api/auth/logout HTTP/1.1" 200 OK
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/rss "HTTP/1.1 301 Moved Permanently"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/rss.xml "HTTP/1.1 404 Not Found"
INFO:services.blog_ingestor:No RSS found for https://omnevum.com/blog/. Falling back to scraping.
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed/ "HTTP/1.1 200 OK"
[ENTER] generate_insights   RSS=438.8MB  t=1098s  active=[compute_gauges~+fetch_client_blogs+generate_insights+get_brand_intelligence+list_clients+login+logout~]
[ENTER] parse_platform_metrics   RSS=438.8MB  t=1098s  active=[compute_gauges~+fetch_client_blogs+generate_insights+get_brand_intelligence+list_clients+login+logout~+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=438.8MB  dur=0.1s  process_peak=512MB  active=[compute_gauges~+fetch_client_blogs+generate_insights+get_brand_intelligence+list_clients+login+logout~+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=438.8MB  dur=0.2s  process_peak=512MB  active=[compute_gauges~+fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+logout~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=438.8MB  t=1099s  active=[compute_gauges+fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=438.8MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+fetch_client_blogs+generate_insights~+get_brand_intelligence+list_clients+login+parse_platform_metrics~]
[EXIT]  list_clients   RSS=439.2MB  dur=4.2s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence+list_clients~+login]
INFO:     172.17.0.1:56128 - "GET /api/clients HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Discovered valid RSS feed at https://omnevum.com/blog/rss
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 9 | Unique deduplicated count: 9
[EXIT]  login   RSS=439.6MB  dur=11.4s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence+login~]
[LIVE] t=1107s  RSS=440MB  peak=512MB  (limit: 512MB)  active=[fetch_client_blogs+get_brand_intelligence+login~]
[EXIT]  get_brand_intelligence   RSS=439.9MB  dur=163.7s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence~]
[EXIT]  get_brand_intelligence   RSS=439.9MB  dur=101.8s  process_peak=512MB  active=[fetch_client_blogs+get_brand_intelligence~]
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/why-every-home-needs-energy-alignment-for-better-living/ article_title=Why Every Home Needs Energy Alignment for Better Living publish_date=2026-05-25T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/reconnecting-with-prakruthi-why-nature-alignment-is-essential-for-human-and-planetary-balance/ article_title=Reconnecting with Prakruthi: Why Nature Alignment Is Essential for Human and Planetary Balance publish_date=2026-05-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/beyond-religion-a-unified-approach-to-human-consciousness-and-collective-evolution/ article_title=Beyond Religion: A Unified Approach to Human Consciousness and Collective Evolution publish_date=2026-05-15T09:22:43
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/beyond-the-physical-understanding-subtle-technologies-and-environmental-fields/ article_title=Beyond the Physical: Understanding Subtle Technologies and Environmental Fields publish_date=2026-04-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/ground-to-growth-how-nature-and-earth-based-systems-create-environmental-stability/ article_title=Ground to Growth: How Nature and Earth-Based Systems Create Environmental Stability publish_date=2026-04-17T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/universal-recalibration-restoring-balance-in-an-interconnected-world/ article_title=Universal Recalibration: Restoring Balance in an Interconnected World publish_date=2026-04-10T11:04:06
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/how-your-environment-affects-your-mood-and-productivity/ article_title=How Your Environment Affects Your Mood and Productivity publish_date=2026-03-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/why-alignment-matters-more-than-motivation/ article_title=Why Alignment Matters More Than Motivation publish_date=2026-03-16T09:12:49
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/what-does-omnevum-mean-in-modern-life/ article_title=What Does Omnevum Mean in Modern Life? publish_date=2026-03-06T09:50:53
[EXIT]  fetch_client_blogs   RSS=439.9MB  dur=108.5s  process_peak=512MB  active=[fetch_client_blogs~]
INFO:     172.17.0.1:33776 - "POST /api/auth/login HTTP/1.1" 200 OK
INFO:     172.17.0.1:56064 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram HTTP/1.1" 200 OK
INFO:     172.17.0.1:45252 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram HTTP/1.1" 200 OK
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/news "HTTP/1.1 404 Not Found"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/articles "HTTP/1.1 404 Not Found"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/insights "HTTP/1.1 404 Not Found"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://omnevum.com/2026/04/universal-recalibration-restoring-balance-in-an-interconnected-world/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://omnevum.com/2026/03/why-alignment-matters-more-than-motivation/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://omnevum.com/2026/05/why-every-home-needs-energy-alignment-for-better-living/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://omnevum.com/materialistic-manifestation/ "HTTP/1.1 200 OK"
INFO:httpx:HTTP Request: GET https://omnevum.com/2026/03/how-your-environment-affects-your-mood-and-productivity/ "HTTP/1.1 200 OK"
INFO:services.blog_ingestor:Successfully scraped 5 articles from https://omnevum.com/blog/
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 5 | Unique deduplicated count: 5
INFO:services.blog_ingestor:Successfully saved 1 new blogs for client e43ee24b-1d87-4570-8337-ecd6f348855b.
[LIVE] t=1117s  RSS=424MB  peak=512MB  (limit: 512MB)  active=[idle]
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/universal-recalibration-restoring-balance-in-an-interconnected-world/ article_title=Universal Recalibration: A New Balance in a Connected World - Omnevum publish_date=2026-06-17T09:27:02.509742
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/why-alignment-matters-more-than-motivation/ article_title=Why Alignment Matters More Than Motivation - Omnevum publish_date=2026-06-17T09:27:02.745333
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/why-every-home-needs-energy-alignment-for-better-living/ article_title=Why Every Home Needs Energy Alignment - Omnevum publish_date=2026-06-17T09:27:02.859123
[BLOG PARSE] extracted_url=https://omnevum.com/materialistic-manifestation/ article_title=Materialistic Manifestation - Omnevum publish_date=2026-06-17T09:27:02.973506
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/how-your-environment-affects-your-mood-and-productivity/ article_title=How Your Environment Affects Your Mood and Productivity - Omnevum publish_date=2026-06-17T09:27:03.090364
[EXIT]  fetch_client_blogs   RSS=427.3MB  dur=189.9s  process_peak=512MB  active=[fetch_client_blogs~]
[LIVE] t=1127s  RSS=427MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=1137s  RSS=427MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=1147s  RSS=428MB  peak=512MB  (limit: 512MB)  active=[idle]
[LIVE] t=1157s  RSS=428MB  peak=512MB  (limit: 512MB)  active=[idle]
[ENTER] login   RSS=367.5MB  t=1164s  active=[login]
[DEBUG] Login lookup - Identifier: 'Jaishree', User found: True, ClientAccess found: False
[LIVE] t=1167s  RSS=342MB  peak=512MB  (limit: 512MB)  active=[login]
[EXIT]  login   RSS=342.5MB  dur=4.8s  process_peak=512MB  active=[login~]
INFO:     172.17.0.1:34678 - "POST /api/auth/login HTTP/1.1" 200 OK
[ENTER] list_clients   RSS=342.5MB  t=1169s  active=[list_clients+login~]
[EXIT]  list_clients   RSS=342.5MB  dur=2.4s  process_peak=512MB  active=[list_clients~]
INFO:     172.17.0.1:34694 - "GET /api/clients HTTP/1.1" 200 OK
[LIVE] t=1177s  RSS=342MB  peak=512MB  (limit: 512MB)  active=[idle]
[ENTER] get_automatic_competitors   RSS=342.7MB  t=1181s  active=[get_automatic_competitors]
[ENTER] get_client_blogs   RSS=342.7MB  t=1181s  active=[get_automatic_competitors+get_client_blogs]
[ENTER] get_brand_intelligence   RSS=342.7MB  t=1181s  active=[get_automatic_competitors+get_brand_intelligence+get_client_blogs]
[ENTER] get_client_reports   RSS=342.7MB  t=1181s  active=[get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
[ENTER] fetch_automatic_competitors   RSS=342.8MB  t=1181s  active=[fetch_automatic_competitors+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
competitor_intelligence: Serving cached results for 'omnevum'
[EXIT]  fetch_automatic_competitors   RSS=342.8MB  dur=0.0s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors+get_brand_intelligence+get_client_blogs+get_client_reports]
[EXIT]  get_automatic_competitors   RSS=342.8MB  dur=0.1s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_client_blogs+get_client_reports]
INFO:     172.17.0.1:59346 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/automatic-competitors HTTP/1.1" 200 OK
[EXIT]  get_client_blogs   RSS=342.8MB  dur=0.3s  process_peak=512MB  active=[fetch_automatic_competitors~+get_automatic_competitors~+get_brand_intelligence+get_client_blogs~+get_client_reports]
INFO:     172.17.0.1:59348 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/blogs HTTP/1.1" 200 OK
INFO:services.blog_ingestor:Starting blog ingestion for client e43ee24b-1d87-4570-8337-ecd6f348855b at https://omnevum.com/blog/
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed "HTTP/1.1 301 Moved Permanently"
INFO:httpx:HTTP Request: GET https://omnevum.com/blog/feed/ "HTTP/1.1 200 OK"
INFO:services.blog_ingestor:Discovered valid RSS feed at https://omnevum.com/blog/feed
INFO:services.blog_ingestor:[BLOG INGESTOR] Raw scraped articles count: 9 | Unique deduplicated count: 9
[ENTER] fetch_client_blogs   RSS=343.0MB  t=1181s  active=[fetch_automatic_competitors~+fetch_client_blogs+get_automatic_competitors~+get_brand_intelligence+get_client_blogs~+get_client_reports]
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/why-every-home-needs-energy-alignment-for-better-living/ article_title=Why Every Home Needs Energy Alignment for Better Living publish_date=2026-05-25T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/reconnecting-with-prakruthi-why-nature-alignment-is-essential-for-human-and-planetary-balance/ article_title=Reconnecting with Prakruthi: Why Nature Alignment Is Essential for Human and Planetary Balance publish_date=2026-05-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/05/beyond-religion-a-unified-approach-to-human-consciousness-and-collective-evolution/ article_title=Beyond Religion: A Unified Approach to Human Consciousness and Collective Evolution publish_date=2026-05-15T09:22:43
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/beyond-the-physical-understanding-subtle-technologies-and-environmental-fields/ article_title=Beyond the Physical: Understanding Subtle Technologies and Environmental Fields publish_date=2026-04-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/ground-to-growth-how-nature-and-earth-based-systems-create-environmental-stability/ article_title=Ground to Growth: How Nature and Earth-Based Systems Create Environmental Stability publish_date=2026-04-17T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/04/universal-recalibration-restoring-balance-in-an-interconnected-world/ article_title=Universal Recalibration: Restoring Balance in an Interconnected World publish_date=2026-04-10T11:04:06
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/how-your-environment-affects-your-mood-and-productivity/ article_title=How Your Environment Affects Your Mood and Productivity publish_date=2026-03-20T03:30:00
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/why-alignment-matters-more-than-motivation/ article_title=Why Alignment Matters More Than Motivation publish_date=2026-03-16T09:12:49
[BLOG PARSE] extracted_url=https://omnevum.com/2026/03/what-does-omnevum-mean-in-modern-life/ article_title=What Does Omnevum Mean in Modern Life? publish_date=2026-03-06T09:50:53
[EXIT]  fetch_client_blogs   RSS=343.0MB  dur=4.5s  process_peak=512MB  active=[fetch_client_blogs~+get_brand_intelligence+get_client_reports]
[LIVE] t=1187s  RSS=343MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence+get_client_reports]
[LIVE] t=1197s  RSS=345MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence+get_client_reports]
[ENTER] compute_brand_health   RSS=384.8MB  t=1204s  active=[compute_brand_health+get_brand_intelligence+get_client_reports]
[EXIT]  compute_brand_health   RSS=384.8MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+get_brand_intelligence+get_client_reports]
[EXIT]  get_client_reports   RSS=384.8MB  dur=23.1s  process_peak=512MB  active=[compute_brand_health~+get_brand_intelligence+get_client_reports~]
[LIVE] t=1211s  RSS=436MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence]
INFO:     172.17.0.1:59332 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/reports HTTP/1.1" 200 OK
[ENTER] generate_insights   RSS=357.3MB  t=1212s  active=[generate_insights+get_brand_intelligence]
[ENTER] parse_platform_metrics   RSS=357.3MB  t=1212s  active=[generate_insights+get_brand_intelligence+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=357.3MB  dur=0.0s  process_peak=512MB  active=[generate_insights+get_brand_intelligence+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=357.3MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+get_brand_intelligence+parse_platform_metrics~]
[ENTER] get_industry_news   RSS=357.3MB  t=1212s  active=[generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=357.3MB  t=1212s  active=[compute_gauges+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=357.3MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] get_brand_intelligence   RSS=357.3MB  t=1212s  active=[compute_gauges~+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] get_calendar_data   RSS=357.3MB  t=1212s  active=[compute_gauges~+generate_insights~+get_brand_intelligence+get_calendar_data+get_industry_news+parse_platform_metrics~]
[LIVE] t=1221s  RSS=363MB  peak=512MB  (limit: 512MB)  active=[get_brand_intelligence+get_calendar_data+get_industry_news]
[EXIT]  get_calendar_data   RSS=358.0MB  dur=12.0s  process_peak=512MB  active=[get_brand_intelligence+get_calendar_data~+get_industry_news]
INFO:     172.17.0.1:47584 - "GET /api/calendar/e43ee24b-1d87-4570-8337-ecd6f348855b HTTP/1.1" 200 OK
[EXIT]  get_brand_intelligence   RSS=358.0MB  dur=45.5s  process_peak=512MB  active=[get_brand_intelligence~+get_industry_news]
INFO:     172.17.0.1:59360 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram HTTP/1.1" 200 OK
[ENTER] list_clients   RSS=358.3MB  t=1229s  active=[get_industry_news+list_clients]
[LIVE] t=1231s  RSS=358MB  peak=512MB  (limit: 512MB)  active=[get_industry_news+list_clients]
[EXIT]  list_clients   RSS=358.3MB  dur=3.2s  process_peak=512MB  active=[get_industry_news+list_clients~]
INFO:     172.17.0.1:55632 - "GET /api/clients HTTP/1.1" 200 OK
[ENTER] get_brand_intelligence   RSS=358.3MB  t=1233s  active=[get_brand_intelligence+get_industry_news+list_clients~]
news_api: Fetching with query: 'Spiritual & Mental wellness Omnevum'
[ENTER] fetch_industry_news_modular   RSS=427.1MB  t=1237s  active=[fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
news_api: Fetching fresh news for 'Spiritual & Mental wellness Omnevum'
GNewsSource: No API key found in env.
[ENTER] compute_brand_health   RSS=456.5MB  t=1242s  active=[compute_brand_health+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[LIVE] t=1242s  RSS=456MB  peak=512MB  (limit: 512MB)  active=[compute_brand_health+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[EXIT]  compute_brand_health   RSS=456.6MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[ENTER] compute_brand_health   RSS=456.9MB  t=1242s  active=[compute_brand_health+compute_brand_health~+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[EXIT]  compute_brand_health   RSS=456.9MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
news_api: Both GNews and RSS returned empty, falling back to Llama LLM.
[EXIT]  fetch_industry_news_modular   RSS=457.9MB  dur=6.7s  process_peak=512MB  active=[fetch_industry_news_modular~+get_brand_intelligence+get_industry_news]
news_api: Fetch for 'Spiritual & Mental wellness Omnevum' failed: cannot import name 'groq_client' from 'routes' (/app/routes.py)
news_api: Fetching with query: 'Spiritual & Mental wellness'
[ENTER] fetch_industry_news_modular   RSS=457.9MB  t=1244s  active=[fetch_industry_news_modular+fetch_industry_news_modular~+get_brand_intelligence+get_industry_news]
news_api: Fetching fresh news for 'Spiritual & Mental wellness'
GNewsSource: No API key found in env.
[ENTER] get_brand_intelligence   RSS=426.2MB  t=1251s  active=[fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[ENTER] get_brand_intelligence   RSS=426.2MB  t=1251s  active=[fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[LIVE] t=1252s  RSS=426MB  peak=512MB  (limit: 512MB)  active=[fetch_industry_news_modular+get_brand_intelligence+get_industry_news]
[ENTER] generate_insights   RSS=428.2MB  t=1254s  active=[fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news]
[ENTER] parse_platform_metrics   RSS=428.2MB  t=1254s  active=[fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=428.2MB  dur=0.0s  process_peak=512MB  active=[fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=428.4MB  dur=0.2s  process_peak=512MB  active=[fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] generate_insights   RSS=444.1MB  t=1257s  active=[fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news]
[ENTER] compute_gauges   RSS=444.1MB  t=1257s  active=[compute_gauges+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news]
[EXIT]  compute_gauges   RSS=444.1MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news]
[ENTER] parse_platform_metrics   RSS=444.3MB  t=1257s  active=[compute_gauges~+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=444.3MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+fetch_industry_news_modular+generate_insights+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=444.3MB  dur=0.1s  process_peak=512MB  active=[compute_gauges~+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=444.3MB  t=1257s  active=[compute_gauges+compute_gauges~+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=444.3MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+fetch_industry_news_modular+generate_insights~+get_brand_intelligence+get_industry_news+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=395.9MB  dur=28.8s  process_peak=512MB  active=[fetch_industry_news_modular+get_brand_intelligence~+get_industry_news]
[LIVE] t=1262s  RSS=397MB  peak=512MB  (limit: 512MB)  active=[fetch_industry_news_modular+get_brand_intelligence~+get_industry_news]
[EXIT]  get_brand_intelligence   RSS=395.6MB  dur=50.8s  process_peak=512MB  active=[fetch_industry_news_modular+get_brand_intelligence~+get_industry_news]
INFO:     172.17.0.1:55642 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
INFO:     172.17.0.1:47570 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[EXIT]  fetch_industry_news_modular   RSS=445.7MB  dur=23.6s  process_peak=512MB  active=[fetch_industry_news_modular~+get_industry_news]
news_api: Successfully fetched 6 articles for 'Spiritual & Mental wellness'
[EXIT]  get_industry_news   RSS=445.7MB  dur=55.2s  process_peak=512MB  active=[fetch_industry_news_modular~+get_industry_news~]
[ENTER] compute_brand_health   RSS=445.7MB  t=1267s  active=[compute_brand_health+fetch_industry_news_modular~+get_industry_news~]
[EXIT]  compute_brand_health   RSS=445.7MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+fetch_industry_news_modular~+get_industry_news~]
[ENTER] compute_brand_health   RSS=445.7MB  t=1267s  active=[compute_brand_health+compute_brand_health~+fetch_industry_news_modular~+get_industry_news~]
[EXIT]  compute_brand_health   RSS=445.7MB  dur=0.0s  process_peak=512MB  active=[compute_brand_health~+fetch_industry_news_modular~+get_industry_news~]
INFO:     172.17.0.1:47576 - "GET /api/industry-news?industry=Spiritual%20%26%20Mental%20wellness&client_id=e43ee24b-1d87-4570-8337-ecd6f348855b HTTP/1.1" 200 OK
[LIVE] t=1272s  RSS=452MB  peak=512MB  (limit: 512MB)  active=[idle]
[ENTER] generate_insights   RSS=452.1MB  t=1273s  active=[generate_insights]
[ENTER] parse_platform_metrics   RSS=452.1MB  t=1273s  active=[generate_insights+parse_platform_metrics]
[EXIT]  parse_platform_metrics   RSS=452.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=452.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+parse_platform_metrics~]
[ENTER] generate_insights   RSS=452.1MB  t=1273s  active=[generate_insights+generate_insights~+parse_platform_metrics~]
[ENTER] parse_platform_metrics   RSS=452.1MB  t=1273s  active=[generate_insights+generate_insights~+parse_platform_metrics+parse_platform_metrics~]
[EXIT]  parse_platform_metrics   RSS=452.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights+generate_insights~+parse_platform_metrics~]
[EXIT]  generate_insights   RSS=452.1MB  dur=0.0s  process_peak=512MB  active=[generate_insights~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=452.1MB  t=1273s  active=[compute_gauges+generate_insights~+parse_platform_metrics~]
[ENTER] compute_gauges   RSS=452.1MB  t=1273s  active=[compute_gauges+generate_insights~+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=452.1MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+parse_platform_metrics~]
[EXIT]  compute_gauges   RSS=452.1MB  dur=0.0s  process_peak=512MB  active=[compute_gauges~+generate_insights~+parse_platform_metrics~]
[EXIT]  get_brand_intelligence   RSS=452.1MB  dur=23.5s  process_peak=512MB  active=[get_brand_intelligence~]
INFO:     172.17.0.1:50310 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
[EXIT]  get_brand_intelligence   RSS=402.6MB  dur=23.7s  process_peak=512MB  active=[get_brand_intelligence~]
INFO:     172.17.0.1:50308 - "GET /api/clients/e43ee24b-1d87-4570-8337-ecd6f348855b/intelligence?platform=instagram&month=June&year=2026 HTTP/1.1" 200 OK
