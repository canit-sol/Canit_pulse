import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, Plus, X, Edit2, Trash2, Sparkles, Loader2, Filter, CheckCircle2, AlertCircle, BarChart3, Calendar } from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import ClientCard from "@/components/ClientCard";
import { useSidebar } from "@/context/SidebarContext";
import { usePermissions } from "@/hooks/usePermissions";
import { getApiUrl, apiFetch } from "@/config/api";
interface Client {
  id: string;
  name: string;
  industry: string;
  instagram_handle?: string;
  website_url?: string;
  ig_user_id?: string;
  fb_page_id?: string;
  youtube_channel_id?: string;
  purpose?: string;
  completed_creatives?: number;
  status: "live" | "syncing";
  seo_pdf_filename?: string;
  seo_pdf_uploaded_at?: string;
  client_logo_url?: string;
}

interface MetaPage {
  fb_page_id: string;
  fb_page_name: string;
  fb_page_token: string;
  ig_account_id: string;
  ig_username: string;
  ig_followers: number;
  source?: string;
}

function authHeaders() {
  let token = null;
  try {
    token = localStorage.getItem("bento_token");
  } catch (e) {
    console.warn("localStorage blocked:", e);
  }
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { collapsed } = useSidebar();
  const permissions = usePermissions();
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [uploadingClientId, setUploadingClientId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", industry: "", website_url: "", purpose: "" });
  const [seoFile, setSeoFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // ── Page-Picker Modal State ──────────────────────────
  const [pagePickerClientId, setPagePickerClientId] = useState<string | null>(null);
  const [pagePickerClientName, setPagePickerClientName] = useState<string>("");
  const [metaPages, setMetaPages] = useState<MetaPage[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [linkingPage, setLinkingPage] = useState(false);
  const [linkSuccess, setLinkSuccess] = useState(false);
  const [selectedClientForPage, setSelectedClientForPage] = useState<Record<string, string>>({});
  const [successLinkedClientName, setSuccessLinkedClientName] = useState("");

  // Custom Alert and Confirmation Modal States
  const [customAlert, setCustomAlert] = useState<{ title: string; message: string; type: "success" | "error" | "warning" } | null>(null);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [deleteClientName, setDeleteClientName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const showCustomAlert = (message: string) => {
    const isSuccess = message.includes("✨") || message.includes("successfully") || message.includes("connected");
    const isWarning = message.includes("⚠️") || message.includes("warning");
    const type = isSuccess ? "success" : isWarning ? "warning" : "error";
    const cleanMsg = message.replace(/^[❌✨⚠️]\s*/, "");
    setCustomAlert({
      title: isSuccess ? "Success" : isWarning ? "Warning" : "Error",
      message: cleanMsg,
      type
    });
  };

  // Monthly SEO Report Upload Modal State
  const [seoUploadClientId, setSeoUploadClientId] = useState<string | null>(null);
  const [seoUploadClientName, setSeoUploadClientName] = useState<string>("");
  const [seoUploadMonth, setSeoUploadMonth] = useState<string>(new Date().toLocaleString("default", { month: "long" }));
  const [seoUploadYear, setSeoUploadYear] = useState<string>(new Date().getFullYear().toString());
  const [seoUploadFile, setSeoUploadFile] = useState<File | null>(null);
  const [isUploadingMonthlySeo, setIsUploadingMonthlySeo] = useState(false);

  const openMonthlySeoUploadModal = (clientId: string, clientName: string) => {
    setSeoUploadClientId(clientId);
    setSeoUploadClientName(clientName);
    setSeoUploadMonth(new Date().toLocaleString("default", { month: "long" }));
    setSeoUploadYear(new Date().getFullYear().toString());
    setSeoUploadFile(null);
  };

  // YouTube Channel connection validation states
  const [youtubePickerClientId, setYoutubePickerClientId] = useState<string | null>(null);
  const [youtubePickerClientName, setYoutubePickerClientName] = useState<string>("");
  const [youtubeChannelIdInput, setYoutubeChannelIdInput] = useState<string>("");
  const [youtubePreviewChannel, setYoutubePreviewChannel] = useState<any | null>(null);
  const [youtubePreviewLoading, setYoutubePreviewLoading] = useState<boolean>(false);
  const [youtubePreviewError, setYoutubePreviewError] = useState<string | null>(null);
  const [youtubeLinkingChannelId, setYoutubeLinkingChannelId] = useState<string | null>(null);
  const [youtubeLinkSuccess, setYoutubeLinkSuccess] = useState<boolean>(false);
  const [successLinkedYoutubeChannelName, setSuccessLinkedYoutubeChannelName] = useState<string>("");

  const openConnectYoutubeModal = (clientId: string, clientName: string) => {
    setYoutubePickerClientId(clientId);
    setYoutubePickerClientName(clientName);
    
    const currentChannelId = clients.find(c => c.id === clientId)?.youtube_channel_id || "";
    setYoutubeChannelIdInput(currentChannelId);
    
    setYoutubePreviewChannel(null);
    setYoutubePreviewError(null);
    setYoutubeLinkSuccess(false);
    setYoutubePreviewLoading(false);
  };

  const handleVerifyYoutubeChannel = async () => {
    if (!youtubeChannelIdInput.trim()) {
      setYoutubePreviewError("Please enter a YouTube Channel ID.");
      return;
    }
    setYoutubePreviewLoading(true);
    setYoutubePreviewError(null);
    setYoutubePreviewChannel(null);

    try {
      const res = await fetch(`/api/clients/${youtubePickerClientId}/youtube-channel-preview?channel_id=${encodeURIComponent(youtubeChannelIdInput.trim())}`, {
        headers: authHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setYoutubePreviewChannel(data);
      } else {
        const err = await res.json();
        setYoutubePreviewError(err.detail || "Channel not found");
      }
    } catch {
      setYoutubePreviewError("Network error while validating channel ID.");
    } finally {
      setYoutubePreviewLoading(false);
    }
  };

  const handleLinkYoutubeChannel = async () => {
    if (!youtubePickerClientId || !youtubePreviewChannel) return;
    setYoutubeLinkingChannelId(youtubePreviewChannel.channel_id);

    try {
      const res = await fetch(`/api/clients/${youtubePickerClientId}/connect-youtube`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          youtube_channel_id: youtubePreviewChannel.channel_id
        })
      });

      if (res.ok) {
        setSuccessLinkedYoutubeChannelName(youtubePreviewChannel.title);
        setYoutubeLinkSuccess(true);
        fetchClients();
      } else {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail || "Failed to connect YouTube channel."}`);
      }
    } catch {
      showCustomAlert("❌ Network error while connecting YouTube channel.");
    } finally {
      setYoutubeLinkingChannelId(null);
    }
  };

  const handleDisconnectYoutubeChannel = async () => {
    if (!youtubePickerClientId) return;
    setYoutubeLinkingChannelId("disconnect");

    try {
      const res = await fetch(`/api/clients/${youtubePickerClientId}/connect-youtube`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          youtube_channel_id: null
        })
      });

      if (res.ok) {
        showCustomAlert("✨ YouTube Channel disconnected successfully!");
        setYoutubePickerClientId(null);
        fetchClients();
      } else {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail || "Failed to disconnect YouTube channel."}`);
      }
    } catch {
      showCustomAlert("❌ Network error while disconnecting YouTube channel.");
    } finally {
      setYoutubeLinkingChannelId(null);
    }
  };

  const handleUploadMonthlySeo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seoUploadClientId || !seoUploadFile) {
      showCustomAlert("❌ Please select a PDF file first.");
      return;
    }

    setIsUploadingMonthlySeo(true);
    setUploadingClientId(seoUploadClientId);

    try {
      const formData = new FormData();
      formData.append("file", seoUploadFile);
      formData.append("month", seoUploadMonth);
      formData.append("year", seoUploadYear);

      let token = null;
      try {
        token = localStorage.getItem("bento_token");
      } catch (err) {
        console.warn("localStorage blocked:", err);
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/clients/${seoUploadClientId}/upload-monthly-seo`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.ok) {
        setSeoUploadClientId(null);
        setSeoUploadFile(null);
        showCustomAlert(`✨ Monthly SEO report uploaded successfully for ${seoUploadMonth} ${seoUploadYear}!`);
        fetchClients();
      } else {
        const data = await res.json();
        showCustomAlert(`❌ ${data.detail || "Could not upload monthly report."}`);
      }
    } catch (err) {
      console.error(err);
      showCustomAlert("❌ Network error uploading monthly SEO PDF.");
    } finally {
      setIsUploadingMonthlySeo(false);
      setUploadingClientId(null);
    }
  };

  // ── Competitor Modal State ──────────────────────────
  const [compClientId, setCompClientId] = useState<string | null>(null);
  const [compList, setCompList] = useState<any[]>([]);
  const [compLoading, setCompLoading] = useState(false);
  const [compName, setCompName] = useState("");
  const [compEngagement, setCompEngagement] = useState("");
  const [compRevenue, setCompRevenue] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState("");

  // ── Plan Content Modal State ────────────────────────
  const [planClientId, setPlanClientId] = useState<string | null>(null);
  const [planMonth, setPlanMonth] = useState<string>(new Date().toLocaleString('default', { month: 'long' }));
  const [planYear, setPlanYear] = useState<string>(new Date().getFullYear().toString());
  const [plannedDates, setPlannedDates] = useState<{day: number, type: string}[]>([]);
  const [originalPlannedDates, setOriginalPlannedDates] = useState<{day: number, type: string}[]>([]);
  const [activePickerDay, setActivePickerDay] = useState<number | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);

  useEffect(() => { fetchClients(); }, []);

  // Detect when Instagram Business OAuth redirects back with ?link_client=xxx
  useEffect(() => {
    const linkClientId = searchParams.get("link_client");
    const metaConnected = searchParams.get("meta_connected");
    const metaError = searchParams.get("meta_error");

    if (metaError) {
      showCustomAlert(`❌ Instagram Business connection failed: ${metaError}`);
      // Clean up URL
      setSearchParams({});
      return;
    }

    if (linkClientId && metaConnected === "true") {
      const storedName = localStorage.getItem("linking_client_name") || "";
      // Clean URL params immediately so a refresh doesn't re-trigger
      setSearchParams({});
      // Open the page-picker for this client
      openPagePicker(linkClientId, storedName);
    }
  }, [searchParams]);

  const openPagePicker = async (clientId: string, clientName?: string) => {
    setPagePickerClientId(clientId);
    const resolvedName = clients.find(c => c.id === clientId)?.name || clientName || "client";
    setPagePickerClientName(resolvedName);
    setMetaPages([]);
    setLinkSuccess(false);
    setPagesLoading(true);
    setIsFetchingMeta(true);
    setSelectedClientForPage({});

    try {
      const res = await fetch(`/api/clients/${clientId}/meta-pages`, {
        headers: authHeaders(),
      });

      if (!res.ok) {
        let errMsg = "Could not fetch Instagram Business accounts.";
        try {
          const errData = await res.json();
          errMsg = errData.detail || errMsg;
        } catch {}
        console.error(`❌ ${errMsg}`);
        setPagePickerClientId(null);
        setPagesLoading(false);
        setIsFetchingMeta(false);
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        setPagesLoading(false);
        setIsFetchingMeta(false);
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let hasData = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);

            // Catch streamed timeout / Meta errors silently without alert popups
            if (parsed.error) {
              console.warn("Meta page stream returned a silent warning:", parsed.error);
              setPagesLoading(false);
              setIsFetchingMeta(false);
              return;
            }

            if (parsed.pages && parsed.pages.length > 0) {
              hasData = true;
              setPagesLoading(false); // Stop loading indicator immediately as first results arrive

              setMetaPages((prev) => {
                const existing = new Set(prev.map(p => p.fb_page_id));
                const newPages = parsed.pages.filter((p: MetaPage) => !existing.has(p.fb_page_id));
                return [...prev, ...newPages];
              });

              setSelectedClientForPage((prev) => {
                const next = { ...prev };
                parsed.pages.forEach((page: MetaPage) => {
                  next[page.fb_page_id] = clientId;
                });
                return next;
              });
            }
          } catch (err) {
            console.error("Error parsing stream line:", err);
          }
        }
      }

      if (!hasData) {
        setPagesLoading(false);
      }
      setIsFetchingMeta(false);
    } catch (err) {
      console.error("❌ Could not fetch Instagram Business accounts:", err);
      setPagePickerClientId(null);
      setPagesLoading(false);
      setIsFetchingMeta(false);
    }
  };

  const [linkedPlatform, setLinkedPlatform] = useState<"both" | "facebook">("both");

  const handleLinkPage = async (page: MetaPage, overrideClientId?: string) => {
    // Column mappings verification:
    // - instagram_id is saved to clients table in the 'ig_user_id' column
    // - facebook_page_id is saved to clients table in the 'fb_page_id' column
    const targetClientId = overrideClientId || pagePickerClientId;
    if (!targetClientId) return;
    setLinkingPage(true);

    try {
      const res = await fetch(`/api/clients/${targetClientId}/link-page`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          fb_page_id: page.fb_page_id,
          fb_page_token: page.fb_page_token,
          ig_account_id: page.ig_account_id,
          ig_username: page.ig_username,
        }),
      });

      if (res.ok) {
        const targetName = clients.find(c => c.id === targetClientId)?.name || pagePickerClientName || "selected client";
        setSuccessLinkedClientName(targetName);
        setLinkedPlatform(page.ig_account_id ? "both" : "facebook");
        setLinkSuccess(true);
        fetchClients(); // Refresh so the card shows as connected
        setTimeout(() => {
          setPagePickerClientId(null);
          setLinkSuccess(false);
        }, 1800);
      } else {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail}`);
      }
    } catch {
      showCustomAlert("❌ Network error while linking page.");
    } finally {
      setLinkingPage(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/clients", { headers: authHeaders() });
      const data = await res.json();
      if (Array.isArray(data)) setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openPlanPanel = async (clientId: string) => {
    setPlanClientId(clientId);
    setPlannedDates([]);
    setOriginalPlannedDates([]);
    try {
      const m = new Date().toLocaleString('default', { month: 'long' });
      const y = new Date().getFullYear();
      setPlanMonth(m);
      setPlanYear(y.toString());

      const res = await fetch(`/api/calendar/${clientId}`, { headers: authHeaders() });
      const data = await res.json();

      if (data && data.content_calendar) {
        const monthMap: Record<string, string> = {
          "January": "01", "February": "02", "March": "03", "April": "04",
          "May": "05", "June": "06", "July": "07", "August": "08",
          "September": "09", "October": "10", "November": "11", "December": "12"
        };
        const mStr = monthMap[m] || "01";
        const prefix = `${y}-${mStr}-`;

        const dates = data.content_calendar
          .filter((d: any) => d.date && d.date.startsWith(prefix))
          .map((d: any) => ({
            day: parseInt(d.date.split('-')[2], 10),
            type: d.post_type || 'post'
          }));

        setPlannedDates(dates);
        setOriginalPlannedDates(dates);
      } else {
        setPlannedDates([]);
        setOriginalPlannedDates([]);
      }
    } catch { }
  };

  // ── Competitor handlers ─────────────────────────────
  const openCompetitorPanel = async (clientId: string) => {
    setCompClientId(clientId);
    setCompName(""); setCompEngagement(""); setCompRevenue("");
    setCompLoading(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/competitors`, { headers: authHeaders() });
      const data = await res.json();
      setCompList(data.competitors || []);
    } catch { setCompList([]); }
    finally { setCompLoading(false); }
  };

  const handleAddComp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!compClientId || !compName.trim()) return;
    try {
      await fetch(`/api/clients/${compClientId}/competitors`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ name: compName.trim(), engagement_est: Number(compEngagement) || 0, revenue_est: Number(compRevenue) || 0 }),
      });
      setCompName(""); setCompEngagement(""); setCompRevenue("");
      openCompetitorPanel(compClientId);
    } catch { showCustomAlert("❌ Failed to add competitor."); }
  };

  const handleDeleteComp = async (competitorId: string) => {
    if (!compClientId) return;
    try {
      await fetch(`/api/clients/${compClientId}/competitors/${competitorId}`, { method: "DELETE", headers: authHeaders() });
      openCompetitorPanel(compClientId);
    } catch { showCustomAlert("❌ Failed to delete."); }
  };

  const discoverCompetitors = async () => {
    if (!compClientId) return;
    setDiscovering(true);
    setDiscoverMsg("");
    try {
      const res = await fetch(`/api/clients/${compClientId}/competitors/discover`, {
        method: "POST", headers: authHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setDiscoverMsg(`✨ Found ${data.discovered} competitors automatically!`);
        openCompetitorPanel(compClientId);
      } else {
        setDiscoverMsg(`❌ ${data.detail || "Discovery failed. Try manual entry."}`);
      }
    } catch { setDiscoverMsg("❌ Network error during discovery."); }
    finally { setDiscovering(false); }
  };

  const handleGenerateReport = async (clientId: string) => {
    setGenerating(clientId);
    try {
      const res = await apiFetch(getApiUrl(`/api/clients/${clientId}/generate`), {
        method: "POST",
      });
      if (res.ok) {
        window.location.href = `/client/${clientId}`;
      } else {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail}`);
      }
    } catch {
      showCustomAlert("❌ Cannot reach backend.");
    } finally {
      setGenerating(null);
    }
  };

  const handleUploadSeoPdf = async (clientId: string, file: File) => {
    setUploadingClientId(clientId);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      let token = null;
      try {
        token = localStorage.getItem("bento_token");
      } catch (e) {
        console.warn("localStorage blocked:", e);
      }
      
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/clients/${clientId}/upload-seo`, {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        showCustomAlert("✨ SEO PDF uploaded and parsed successfully!");
        fetchClients(); // reload clients list
      } else {
        showCustomAlert(`❌ Failed to upload: ${data.detail || "Unknown error"}`);
      }
    } catch (err) {
      console.error(err);
      showCustomAlert("❌ Network error uploading SEO PDF.");
    } finally {
      setUploadingClientId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.website_url) {
      try {
        new URL(formData.website_url);
      } catch (_) {
        showCustomAlert("❌ Please enter a valid URL (starting with http:// or https://)");
        return;
      }
    }

    const method = editingId ? "PUT" : "POST";
    const url = editingId ? `/api/clients/${editingId}` : "/api/clients";

    try {
      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify({
          name: formData.name,
          industry: formData.industry,
          website_url: formData.website_url,
          purpose: formData.purpose,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail}`);
        return;
      }

      const data = await res.json();
      const savedClientId = editingId || data.id;

      let token = null;
      try {
        token = localStorage.getItem("bento_token");
      } catch (e) {
        console.warn("localStorage blocked:", e);
      }

      // 1. Upload SEO PDF if present
      if (seoFile) {
        const seoFormData = new FormData();
        seoFormData.append("file", seoFile);
        const seoRes = await fetch(`/api/clients/${savedClientId}/upload-seo`, {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: seoFormData
        });
        if (!seoRes.ok) {
          const seoErr = await seoRes.json();
          showCustomAlert(`⚠️ Brand saved, but SEO PDF upload failed: ${seoErr.detail || "Unknown error"}`);
        }
      }

      // 2. Upload Client Logo if present
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("file", logoFile);
        const logoRes = await fetch(`/api/clients/${savedClientId}/upload-logo`, {
          method: "POST",
          headers: token ? { "Authorization": `Bearer ${token}` } : {},
          body: logoFormData
        });
        if (!logoRes.ok) {
          const logoErr = await logoRes.json();
          showCustomAlert(`⚠️ Brand saved, but Logo upload failed: ${logoErr.detail || "Unknown error"}`);
        }
      }

      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: "", industry: "", website_url: "", purpose: "" });
      setSeoFile(null);
      setLogoFile(null);
      fetchClients();
    } catch (err) {
      console.error(err);
      showCustomAlert("❌ Network error saving brand details.");
    }
  };

  const handleAddCreative = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/creative`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setClients(clients.map(c =>
          c.id === clientId ? { ...c, completed_creatives: data.completed_creatives } : c
        ));
      } else {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail}`);
      }
    } catch {
      showCustomAlert("❌ Network error updating creative.");
    }
  };

  const handleDecrementCreative = async (clientId: string) => {
    try {
      const res = await fetch(`/api/clients/${clientId}/creative/decrement`, {
        method: "PATCH",
        headers: authHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setClients(clients.map(c =>
          c.id === clientId ? { ...c, completed_creatives: data.completed_creatives } : c
        ));
      } else {
        const err = await res.json();
        showCustomAlert(`❌ ${err.detail}`);
      }
    } catch {
      showCustomAlert("❌ Network error updating creative.");
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (res.ok) {
        setDeleteClientId(null);
        setDeleteClientName("");
        fetchClients();
      } else {
        const e = await res.json();
        showCustomAlert(`❌ ${e.detail}`);
      }
    } catch {
      showCustomAlert("❌ Network error.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Find the client name for the picker modal header
  const pickerClient = clients.find(c => c.id === pagePickerClientId);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.industry?.toLowerCase().includes(search.toLowerCase())
  );

  const togglePlatform = (dayNum: number, platform: 'li' | 'fb') => {
    setPlannedDates(prev => prev.map(d => {
      if (d.day === dayNum) {
        const typeStr = d.type.startsWith('blog') ? d.type : 'blog:li,fb';
        const parts = typeStr.split(':');
        const prefix = parts[0];
        const platformsList = parts[1] ? parts[1].split(',') : ['li', 'fb'];
        
        let nextPlatforms: string[] = [];
        if (platform === 'li') {
          if (platformsList.includes('li')) {
            nextPlatforms = platformsList.filter(p => p !== 'li');
          } else {
            nextPlatforms = [...platformsList, 'li'];
          }
        } else {
          if (platformsList.includes('fb')) {
            nextPlatforms = platformsList.filter(p => p !== 'fb');
          } else {
            nextPlatforms = [...platformsList, 'fb'];
          }
        }
        
        if (nextPlatforms.length === 0) {
          nextPlatforms = [platform];
        }
        
        return { ...d, type: `${prefix}:${nextPlatforms.join(',')}` };
      }
      return d;
    }));
  };

  return (
    <div className={`min-h-screen bg-transparent transition-[padding] duration-200 ease-in-out ${collapsed ? "pl-[68px]" : "pl-56"}`}>
      <AppSidebar />

      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 animate-fade-in">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#1a1a1a] font-heading bg-gradient-to-r from-[#113a87] to-[#1e56b8] bg-clip-text text-transparent">Active Clients</h1>
            <p className="text-xs font-medium text-gray-500 mt-1">Manage brands, social connections, and performance reports.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search brands..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2.5 rounded-xl bg-white/60 backdrop-blur-md border border-white/50 outline-none w-64 shadow-sm focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/8 text-xs transition-all font-medium text-[#1a1a1a] placeholder:text-gray-300"
              />
            </div>
            {permissions.canCreateClient && (
              <button
                onClick={() => {
                  setEditingId(null);
                  setFormData({ name: "", industry: "", website_url: "", purpose: "" });
                  setSeoFile(null);
                  setLogoFile(null);
                  setIsModalOpen(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#113a87] to-[#1e56b8] text-white px-4 py-2.5 rounded-xl font-bold shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-xs"
              >
                <Plus size={15} /> Add Brand
              </button>
            )}
          </div>
        </div>


        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-96 gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[#113a87]" />
            <p className="text-gray-400 text-sm font-medium">Loading brands...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            {filtered.map((client) => (
              <div key={client.id} className="relative group">
                <ClientCard
                  id={client.id}
                  name={client.name}
                  industry={client.industry}
                  handle={client.instagram_handle}
                  website_url={client.website_url}
                  isInstagramConnected={!!client.ig_user_id}
                  isFacebookConnected={!!client.fb_page_id}
                  isYoutubeConnected={!!client.youtube_channel_id}
                  isGenerating={generating === client.id}
                  onGenerate={() => handleGenerateReport(client.id)}
                  onClick={() => navigate(`/client/${client.id}`)}
                  seoPdfFilename={client.seo_pdf_filename}
                  seoPdfUploadedAt={client.seo_pdf_uploaded_at}
                  onUploadSeoPdf={() => openMonthlySeoUploadModal(client.id, client.name)}
                  onConnectYoutube={() => openConnectYoutubeModal(client.id, client.name)}
                  onConnectInstagram={() => openPagePicker(client.id, client.name)}
                  onConnectFacebook={() => openPagePicker(client.id, client.name)}
                  isUploadingSeo={uploadingClientId === client.id}
                  isHr={currentUser.role === 'hr'}
                  seoReports={(client as any).seo_reports || []}
                />
                {currentUser.role !== 'hr' && (
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-20">
                    {permissions.canEditClient && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(client.id);
                          setFormData({
                            name: client.name,
                            industry: client.industry,
                            website_url: client.website_url || "",
                            purpose: client.purpose || "",
                          });
                          setSeoFile(null);
                          setLogoFile(null);
                          setIsModalOpen(true);
                        }}
                        className="p-1 rounded-lg bg-white/60 hover:bg-gray-50 border border-white/40 text-gray-300 hover:text-gray-500 transition-colors duration-200"
                        title="Edit Brand"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {currentUser.role !== 'hr' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPlanPanel(client.id);
                        }}
                        className="p-1 rounded-lg bg-white/60 hover:bg-gray-50 border border-white/40 text-gray-300 hover:text-pink-600 transition-colors duration-200"
                        title="Plan Content"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {currentUser.role !== 'hr' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openCompetitorPanel(client.id);
                        }}
                        className="p-1 rounded-lg bg-white/60 hover:bg-gray-50 border border-white/40 text-gray-300 hover:text-green-600 transition-colors duration-200"
                        title="Manage Competitors"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {permissions.canDeleteClient && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteClientId(client.id);
                          setDeleteClientName(client.name);
                        }}
                        className="p-1 rounded-lg bg-white/60 hover:bg-gray-50 border border-white/40 text-gray-300 hover:text-red-500 transition-colors duration-200"
                        title="Delete Brand"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-full py-28 text-center border border-dashed border-gray-200/80 rounded-[28px] bg-white/30 backdrop-blur-sm">
                <Filter className="text-gray-300 mx-auto mb-3" size={36} />
                <p className="text-gray-400 font-medium text-sm">No brands found</p>
              </div>
            )}
          </div>
        )}
        </div>
      </main>

      {/* ── Add/Edit Brand Modal ─────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="glass-panel w-full max-w-md p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-7 right-7 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-1 font-heading text-[#1a1a1a]">
              {editingId ? "Edit Brand" : "Add New Brand"}
            </h2>
            <p className="text-gray-400 text-sm mb-7 font-medium">
              {editingId ? "Update brand details." : "Onboard a brand to the ecosystem."}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Brand Name", key: "name", placeholder: "Canit Solutions", type: "text" },
                { label: "Industry", key: "industry", placeholder: "Tech & SaaS", type: "text" },
                { label: "Purpose", key: "purpose", placeholder: "Lead Generation", type: "text" },
              ].map(({ label, key, placeholder, type }) => (
                <div key={key}>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                    {label}
                  </label>
                  <input
                    required
                    type={type}
                    value={formData[key as keyof typeof formData]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 rounded-2xl bg-white/40 border border-white/60 outline-none focus:bg-white/60 focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/8 transition-all font-medium text-sm placeholder:text-gray-300"
                  />
                </div>
              ))}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                  Website URL
                </label>
                <input
                  required
                  type="url"
                  value={formData.website_url}
                  onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-white/40 border border-white/60 outline-none focus:bg-white/60 focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/8 transition-all font-medium text-sm placeholder:text-gray-300"
                />
              </div>

              {/* Logo Preview if exists */}
              {editingId && clients.find(c => c.id === editingId)?.client_logo_url && (
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/30 border border-white/50 animate-fade-in">
                  <img
                    src={clients.find(c => c.id === editingId)?.client_logo_url}
                    alt="Current Logo"
                    className="h-8 max-w-[80px] object-contain rounded bg-slate-50/50 p-1 border border-white/40"
                  />
                  <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Current Client Logo Active</span>
                </div>
              )}

              {/* Client Logo Upload */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                  Client Logo Upload
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-white/40 border border-white/60 outline-none text-xs text-gray-500 rounded-2xl file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#113a87]/10 file:text-[#113a87] hover:file:bg-[#113a87]/20 file:transition-all"
                />
              </div>

              {/* SEO Report Upload */}
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                  SEO Report Upload (.pdf)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSeoFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 bg-white/40 border border-white/60 outline-none text-xs text-gray-500 rounded-2xl file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#113a87]/10 file:text-[#113a87] hover:file:bg-[#113a87]/20 file:transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#113a87] to-[#1e56b8] text-white py-3.5 rounded-2xl font-bold text-base mt-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 duration-300 font-heading"
              >
                {editingId ? "Save Changes" : "Deploy Client"} <Sparkles size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Instagram Business account picker (Meta OAuth) ── */}
      {pagePickerClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/15 backdrop-blur-[4px]">
          <div className="glass-panel w-full max-w-lg p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in">
            {!linkSuccess && (
              <button
                onClick={() => setPagePickerClientId(null)}
                className="absolute top-7 right-7 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            )}

            {linkSuccess ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-[#1a1a1a] font-heading">
                  {linkedPlatform === "both" ? "Instagram Business connected!" : "Facebook Page connected!"}
                </h2>
                <p className="text-gray-400 text-sm text-center font-medium">
                  {linkedPlatform === "both" 
                    ? `The Instagram account has been linked to ` 
                    : `No Instagram Business account was found. Facebook Page linked to `}
                  <strong>{successLinkedClientName}</strong>.
                  You can now generate reports.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-1 font-heading">
                    Link Facebook & Instagram Pages
                  </h2>
                  <p className="text-gray-400 text-sm font-medium">
                    Select a page and assign it to a client to save the mapping.
                  </p>
                </div>

                {pagesLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#113a87]" />
                    <p className="text-gray-400 text-sm font-medium">Fetching your Instagram Business accounts…</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 animate-fade-in">
                    {isFetchingMeta && (
                      <div className="flex items-center justify-center gap-2 py-2 text-[10px] text-gray-400 bg-gray-50/50 rounded-xl border border-gray-100/50 animate-pulse mb-1 select-none">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#113a87]" />
                        <span>Searching Business Accounts for additional pages...</span>
                      </div>
                    )}
                    {metaPages.map((page) => {
                      return (
                        <div
                          key={page.fb_page_id}
                          className="p-4 rounded-2xl border border-white/50 bg-white/40 hover:border-[#113a87]/20 transition-all duration-300 flex flex-col gap-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-bold text-[#1a1a1a] font-heading text-sm">
                                  {page.fb_page_name}
                                </p>
                                {page.source && (
                                  <span className="px-2 py-0.5 bg-white/60 border border-white/45 text-gray-500 text-[9px] font-bold rounded-full font-heading">
                                    {page.source.startsWith("business:") ? `via ${page.source.replace("business:", "")}` :
                                      page.source.startsWith("client_of:") ? `Client of ${page.source.replace("client_of:", "")}` :
                                        "Personal"}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                                FB Page ID: {page.fb_page_id}
                              </p>
                              {!page.ig_username && (
                                <p className="text-[11px] font-semibold text-orange-500 mt-1 font-heading">
                                  ⚠ No Instagram Business account linked to this page
                                </p>
                              )}
                            </div>
                            {page.ig_username && (
                              <div className="text-right shrink-0 ml-4">
                                <p className="text-sm font-bold text-green-600 font-heading">
                                  @{page.ig_username}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium">
                                  {(page.ig_followers ?? 0).toLocaleString()} followers
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100/50">
                            <span className="text-[11px] font-semibold text-gray-500 font-heading">
                              Connecting to: <span className="font-bold text-[#113a87]">{clients.find(c => c.id === pagePickerClientId)?.name || pagePickerClientName || "client"}</span>
                            </span>
                            <button
                              onClick={() => handleLinkPage(page, pagePickerClientId!)}
                              disabled={linkingPage}
                              className="px-4 py-1.5 bg-[#113a87] hover:bg-[#1e56b8] text-white text-xs font-bold rounded-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-heading shrink-0"
                            >
                              {linkingPage ? "Linking..." : "Link Page"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Competitor Management Modal ──────────────── */}
      {compClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/15 backdrop-blur-[4px]">
          <div className="glass-panel w-full max-w-lg p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setCompClientId(null)}
              className="absolute top-7 right-7 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center border border-green-500/20">
                <BarChart3 className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] font-heading">Competitors</h2>
            </div>
            <p className="text-gray-400 text-xs mb-6 font-medium font-body">
              for <strong>{clients.find(c => c.id === compClientId)?.name}</strong>
            </p>

            {/* Existing competitors list */}
            {compLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-[#113a87]" /></div>
            ) : compList.length === 0 ? (
              <div className="text-center py-8 bg-white/30 rounded-2xl border border-dashed border-gray-200/50 mb-5">
                <BarChart3 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider font-heading">No competitors yet</p>
              </div>
            ) : (
              <div className="space-y-2 mb-5 max-h-52 overflow-y-auto pr-1">
                {compList.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3.5 bg-white/40 rounded-2xl border border-white/50 shadow-soft hover:bg-white/60 transition-all duration-300">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-[#1a1a1a] text-sm font-heading">{c.name}</p>
                        {c.revenue_est > 0 && c.engagement_est > 0 && (
                          <span className="text-[9px] font-bold text-[#113a87] bg-[#113a87]/10 px-2 py-0.5 rounded-full font-heading border border-[#113a87]/15">
                            ✨ AI
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-semibold font-body">
                        Engagement: {c.engagement_est}% · Followers: {(c.revenue_est || 0).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteComp(c.id)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50/50 rounded-xl transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add competitor form */}
            <form onSubmit={handleAddComp} className="p-5 bg-white/35 rounded-2xl border border-white/50 space-y-3 shadow-soft">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-0.5 font-heading">Add Competitor</p>
              <input
                type="text" required value={compName} onChange={e => setCompName(e.target.value)}
                placeholder="Competitor Name (e.g. SwastikSust)"
                className="w-full px-4 py-2.5 text-xs border border-white/60 rounded-xl bg-white/50 outline-none focus:bg-white/80 focus:border-[#113a87] transition-all font-medium text-[#1a1a1a] placeholder:text-gray-300"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number" value={compEngagement} onChange={e => setCompEngagement(e.target.value)}
                  placeholder="Engagement %"
                  className="w-full px-4 py-2.5 text-xs border border-white/60 rounded-xl bg-white/50 outline-none focus:bg-white/80 focus:border-[#113a87] transition-all font-medium text-[#1a1a1a] placeholder:text-gray-300"
                />
                <input
                  type="number" value={compRevenue} onChange={e => setCompRevenue(e.target.value)}
                  placeholder="Est. Followers"
                  className="w-full px-4 py-2.5 text-xs border border-white/60 rounded-xl bg-white/50 outline-none focus:bg-white/80 focus:border-[#113a87] transition-all font-medium text-[#1a1a1a] placeholder:text-gray-300"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-[#113a87] text-white text-xs font-bold rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 duration-300 font-heading shadow-sm hover:shadow-md">
                <Plus size={14} /> Add Manually
              </button>
            </form>

            {/* Auto-Discover */}
            <div className="mt-4 space-y-2">
              <button
                onClick={discoverCompetitors}
                disabled={discovering}
                className="w-full py-3 bg-gradient-to-r from-[#113a87] to-purple-600 text-white text-xs font-bold rounded-xl hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-60 duration-300 font-heading shadow-sm hover:shadow-md"
              >
                {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {discovering ? "Discovering..." : "Auto-Discover Competitors"}
              </button>
              <p className="text-[10px] text-gray-400 text-center font-semibold font-body">Uses Llama AI to find real competitors in the same industry</p>
              {discoverMsg && (
                <p className="text-[11px] text-center font-bold text-[#113a87] mt-1">{discoverMsg}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Plan Content Modal ──────────────── */}
      {planClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/15 backdrop-blur-[4px]">
          <div className="glass-panel w-full max-w-lg p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in">
            <button
              onClick={() => setPlanClientId(null)}
              className="absolute top-7 right-7 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[#113a87]/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-[#113a87]" />
              </div>
              <h2 className="text-xl font-bold text-[#1a1a1a] font-heading">Plan Content</h2>
            </div>
            <p className="text-gray-400 text-xs mb-6 font-medium font-body">
              for <strong>{clients.find(c => c.id === planClientId)?.name}</strong>
            </p>

            {/* The 1-31 grid */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                const planObj = plannedDates.find(d => d.day === day);
                const isSelected = !!planObj;
                const isPickerActive = activePickerDay === day;
                
                let ringColor = "";
                if (planObj?.type === 'post') ringColor = "ring-[#113a87] text-[#113a87]";
                else if (planObj?.type === 'reel') ringColor = "ring-orange-500 text-orange-500";
                else if (planObj?.type?.startsWith('carousel')) ringColor = "ring-pink-500 text-pink-500";
                else if (planObj?.type?.startsWith('blog')) ringColor = "ring-amber-500 text-amber-500";
                else ringColor = "ring-[#113a87] text-[#113a87]";

                return (
                  <button
                    key={day}
                    onClick={(e) => {
                      e.preventDefault();
                      if (isSelected) {
                        if (isPickerActive) {
                          setPlannedDates(prev => prev.filter(d => d.day !== day));
                          setActivePickerDay(null);
                        } else {
                          setActivePickerDay(day);
                        }
                      } else {
                        setPlannedDates(prev => [...prev, {day, type: 'post'}].sort((a, b) => a.day - b.day));
                        setActivePickerDay(day);
                      }
                    }}
                    className={`w-10 h-10 rounded-full font-bold text-xs transition-all flex flex-col items-center justify-center relative
                      ${isSelected 
                         ? `ring-2 ring-offset-2 ${ringColor} shadow-sm` 
                         : "bg-white/40 border border-white/50 text-gray-500 hover:bg-white/70"}
                      ${isPickerActive ? "scale-110 shadow-md" : ""}`}
                  >
                    <span className={isSelected && planObj?.type?.startsWith('blog') ? "translate-y-[-2px] font-heading font-bold" : "font-heading font-bold"}>{day}</span>
                    {planObj?.type?.startsWith('blog') && (
                      <div className="absolute bottom-1 flex gap-0.5 z-10">
                        {(planObj.type.includes('li') || planObj.type === 'blog') && (
                          <div className="w-3 h-3 flex items-center justify-center rounded-full bg-[#0077b5] text-white text-[6px] font-extrabold ring-[0.5px] ring-white" title="LinkedIn">
                            in
                          </div>
                        )}
                        {(planObj.type.includes('fb') || planObj.type === 'blog') && (
                          <div className="w-3 h-3 flex items-center justify-center rounded-full bg-[#1877F2] text-white text-[6px] font-extrabold ring-[0.5px] ring-white" title="Facebook">
                            f
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Inline Picker */}
            {activePickerDay && (
              <div className="mb-6 p-5 bg-white/35 rounded-[24px] border border-white/50 space-y-4 animate-fade-in shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1a1a1a] font-heading">Type for {activePickerDay} {planMonth}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setPlannedDates(prev => prev.filter(d => d.day !== activePickerDay));
                      setActivePickerDay(null);
                    }}
                    className="text-xs font-bold text-red-500 hover:bg-red-50/50 px-2.5 py-1.5 rounded-xl transition-colors font-heading"
                  >
                    ✕ Remove
                  </button>
                </div>
                
                <div className="flex gap-2">
                  {[
                    { type: 'post', label: 'Post', bg: 'bg-[#113a87]' },
                    { type: 'reel', label: 'Reel', bg: 'bg-orange-500' },
                    { type: 'carousel', label: 'Carousel', bg: 'bg-pink-50' }, // Wait, let's keep button colors standard
                    { type: 'blog', label: 'Blogs', bg: 'bg-amber-500' },
                  ].map(opt => {
                    const planObj = plannedDates.find(d => d.day === activePickerDay);
                    // Use pink-500 for carousel option instead of pink-50
                    const realBg = opt.type === 'carousel' ? 'bg-pink-500' : opt.bg;
                    const isActive = planObj && (opt.type === 'blog' ? planObj.type.startsWith('blog') : planObj.type === opt.type);
                    
                    return (
                      <button
                        key={opt.type}
                        onClick={(e) => {
                          e.preventDefault();
                          if (opt.type === 'blog') {
                            setPlannedDates(prev => prev.map(d => d.day === activePickerDay ? { ...d, type: 'blog:li,fb' } : d));
                          } else {
                            setPlannedDates(prev => prev.map(d => d.day === activePickerDay ? { ...d, type: opt.type } : d));
                          }
                        }}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-sm ${realBg} ${
                          isActive ? 'ring-2 ring-offset-2 ring-gray-400 opacity-100 scale-105' : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                
                {/* Small platform toggles/indicators for Blogs */}
                {plannedDates.find(d => d.day === activePickerDay)?.type?.startsWith('blog') && (() => {
                  const typeStr = plannedDates.find(d => d.day === activePickerDay)?.type || 'blog:li,fb';
                  const hasLi = typeStr.includes('li');
                  const hasFb = typeStr.includes('fb');
                  
                  return (
                    <div className="pt-3 border-t border-white/50 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-heading">Publish Platforms:</span>
                      <div className="flex gap-4">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            togglePlatform(activePickerDay, 'li');
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                            hasLi 
                              ? "border-[#0077b5]/30 bg-[#0077b5]/10 text-[#0077b5] shadow-soft" 
                              : "border-white/50 bg-white/20 text-gray-400 hover:bg-white/40"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${hasLi ? 'bg-[#0077b5]' : 'bg-gray-300'}`} />
                          LinkedIn
                        </button>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            togglePlatform(activePickerDay, 'fb');
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                            hasFb 
                              ? "border-[#1877F2]/30 bg-[#1877F2]/10 text-[#1877F2] shadow-soft" 
                              : "border-white/50 bg-white/20 text-gray-400 hover:bg-white/40"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${hasFb ? 'bg-[#1877F2]' : 'bg-gray-300'}`} />
                          Facebook
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <button
              onClick={async () => {
                setSavingPlan(true);
                try {
                  const isoDates = plannedDates.map(item => {
                    const d = new Date(`${planMonth} ${item.day}, ${planYear} 12:00:00`);
                    return { date: d.toISOString().split('T')[0], post_type: item.type };
                  });
                  
                  const res = await fetch('/api/calendar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...authHeaders() },
                    body: JSON.stringify({ client_id: planClientId, dates: isoDates })
                  });
                  
                  if (!res.ok) {
                     const err = await res.json();
                     throw new Error(err.detail || "Failed to save dates");
                  }

                  setActivePickerDay(null);
                  setPlanClientId(null);
                  fetchClients();
                } catch (e: any) {
                  console.error(e);
                  showCustomAlert(`Error saving dates: ${e.message}`);
                } finally {
                  setSavingPlan(false);
                }
              }}
              disabled={savingPlan}
              className="w-full py-4 bg-gradient-to-r from-[#113a87] to-[#1e56b8] text-white font-bold rounded-2xl hover:opacity-90 hover:shadow-md transition flex items-center justify-center gap-2 duration-300 font-heading text-sm"
            >
              {savingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar size={15} />}
              {savingPlan ? "Saving..." : "Save Planned Dates"}
            </button>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in border border-gray-100" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4 font-heading text-[#1a1a1a]">
              Delete Brand
            </h2>
            <p className="text-gray-500 text-sm mb-7 font-medium font-body leading-relaxed">
              Are you sure you want to delete <span className="font-bold text-[#1a1a1a]">{deleteClientName}</span> and all associated reports? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeleteClientId(null);
                  setDeleteClientName("");
                }}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#113a87] hover:bg-[#0e2f6e] transition-colors shadow-sm font-heading"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteClientId)}
                disabled={isDeleting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm font-heading flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Alert Modal */}
      {customAlert && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm p-8 rounded-[28px] shadow-2xl relative animate-fade-in border border-gray-100 text-center" onClick={e => e.stopPropagation()}>
            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
              customAlert.type === "success" 
                ? "bg-green-50 text-green-600" 
                : customAlert.type === "warning"
                  ? "bg-amber-50 text-amber-600"
                  : "bg-red-50 text-red-600"
            }`}>
              {customAlert.type === "success" ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-lg font-bold text-[#1a1a1a] font-heading mb-2">{customAlert.title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-6 font-heading leading-relaxed">{customAlert.message}</p>
            <button
              onClick={() => setCustomAlert(null)}
              className="w-full py-2.5 rounded-xl font-bold text-white bg-[#113a87] hover:bg-[#0e2f6e] transition-all duration-200 shadow-sm font-heading"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* ── Monthly SEO Upload Modal ── */}
      {seoUploadClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
          <div className="bg-white w-full max-w-md p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in border border-gray-100" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSeoUploadClientId(null)}
              className="absolute top-7 right-7 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold mb-1 font-heading text-[#1a1a1a]">
              Upload SEO Report
            </h2>
            <p className="text-gray-400 text-sm mb-7 font-medium">
              for <strong>{seoUploadClientName}</strong>
            </p>

            <form onSubmit={handleUploadMonthlySeo} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                    Month
                  </label>
                  <select
                    value={seoUploadMonth}
                    onChange={(e) => setSeoUploadMonth(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/40 border border-white/60 outline-none focus:bg-white/60 focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/8 transition-all font-medium text-sm bg-white"
                  >
                    {[
                      "January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"
                    ].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                    Year
                  </label>
                  <select
                    value={seoUploadYear}
                    onChange={(e) => setSeoUploadYear(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white/40 border border-white/60 outline-none focus:bg-white/60 focus:border-[#113a87] focus:ring-4 focus:ring-[#113a87]/8 transition-all font-medium text-sm bg-white"
                  >
                    {["2024", "2025", "2026", "2027", "2028"].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                  SEO Report File (.pdf only)
                </label>
                <input
                  required
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setSeoUploadFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-3 bg-white/40 border border-white/60 outline-none text-xs text-gray-500 rounded-2xl file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#113a87]/10 file:text-[#113a87] hover:file:bg-[#113a87]/20 file:transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isUploadingMonthlySeo}
                className="w-full bg-gradient-to-r from-[#113a87] to-[#1e56b8] text-white py-3.5 rounded-2xl font-bold text-base mt-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 duration-300 font-heading disabled:opacity-55"
              >
                {isUploadingMonthlySeo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={16} />}
                {isUploadingMonthlySeo ? "Uploading..." : "Upload Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Link YouTube Channel Modal ── */}
      {youtubePickerClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/15 backdrop-blur-[4px]" onClick={() => setYoutubePickerClientId(null)}>
          <div className="glass-panel w-full max-w-md p-8 md:p-9 rounded-[32px] shadow-2xl relative animate-fade-in" onClick={e => e.stopPropagation()}>
            {!youtubeLinkSuccess && (
              <button
                onClick={() => setYoutubePickerClientId(null)}
                className="absolute top-7 right-7 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={youtubeLinkingChannelId !== null}
              >
                <X size={20} />
              </button>
            )}

            {youtubeLinkSuccess ? (
              /* Success State */
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <CheckCircle2 className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-[#1a1a1a] font-heading">
                  YouTube Channel linked!
                </h2>
                <p className="text-gray-400 text-sm text-center font-medium font-body font-normal">
                  YouTube channel <strong>{successLinkedYoutubeChannelName}</strong> has been linked to <strong>{youtubePickerClientName}</strong>.
                  You can now view metrics and generate reports.
                </p>
                <button
                  onClick={() => setYoutubePickerClientId(null)}
                  className="mt-4 px-6 py-2.5 bg-[#113a87] text-white text-sm font-bold rounded-xl hover:bg-[#1e56b8] transition duration-200 font-heading"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#1a1a1a] mb-1 font-heading">
                    Link YouTube Channel
                  </h2>
                  <p className="text-gray-400 text-sm font-medium font-body">
                    Enter the Channel ID manually to connect to <strong>{youtubePickerClientName}</strong>.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1.5 px-0.5 font-heading">
                      YouTube Channel ID
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. UCxG3kK5yO_xK_GgS4d4W_Jw"
                        value={youtubeChannelIdInput}
                        onChange={(e) => {
                          setYoutubeChannelIdInput(e.target.value);
                          setYoutubePreviewChannel(null);
                          setYoutubePreviewError(null);
                        }}
                        className="flex-1 px-4 py-3 rounded-2xl bg-white/40 border border-white/60 outline-none focus:bg-white/60 focus:border-[#FF0000] focus:ring-4 focus:ring-[#FF0000]/8 transition-all font-medium text-sm placeholder:text-gray-300 bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyYoutubeChannel}
                        disabled={youtubePreviewLoading || youtubeLinkingChannelId !== null}
                        className="px-5 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition duration-200 disabled:opacity-55 font-heading text-xs whitespace-nowrap shrink-0 flex items-center justify-center gap-1.5"
                      >
                        {youtubePreviewLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {youtubePreviewLoading ? "Verifying..." : "Verify"}
                      </button>
                    </div>
                  </div>

                  {/* Loading indicator */}
                  {youtubePreviewLoading && (
                    <div className="flex items-center justify-center gap-2 py-4 text-xs text-gray-400 font-medium font-body animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-[#FF0000]" />
                      <span>Validating channel ID...</span>
                    </div>
                  )}

                  {/* Error display */}
                  {youtubePreviewError && (
                    <div className="p-4 bg-red-50/50 border border-red-200/50 rounded-2xl text-red-600 text-xs font-bold font-body">
                      ❌ {youtubePreviewError}
                    </div>
                  )}

                  {/* Channel Preview Card */}
                  {youtubePreviewChannel && (
                    <div className="p-4 rounded-2xl border border-red-200/25 bg-red-50/5 flex flex-col gap-4 animate-fade-in">
                      <div className="flex items-center gap-3">
                        <img
                          src={youtubePreviewChannel.thumbnail}
                          alt={youtubePreviewChannel.title}
                          className="w-12 h-12 rounded-full object-cover border border-gray-100 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-[#1a1a1a] font-heading text-sm leading-tight">
                            {youtubePreviewChannel.title}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                            ID: {youtubePreviewChannel.channel_id}
                          </p>
                          <p className="text-[10px] text-gray-400 font-medium font-body mt-0.5">
                            {(youtubePreviewChannel.subscribers ?? 0).toLocaleString()} subscribers
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleLinkYoutubeChannel}
                        disabled={youtubeLinkingChannelId !== null}
                        className="w-full bg-[#FF0000] hover:bg-[#cc0000] text-white py-3.5 rounded-2xl font-bold transition-all duration-300 font-heading text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow-md disabled:opacity-55"
                      >
                        {youtubeLinkingChannelId === youtubePreviewChannel.channel_id && <Loader2 className="w-4 h-4 animate-spin" />}
                        {youtubeLinkingChannelId === youtubePreviewChannel.channel_id ? "Connecting..." : "Confirm & Link"}
                      </button>
                    </div>
                  )}

                  {/* Disconnect Option */}
                  {clients.find(c => c.id === youtubePickerClientId)?.youtube_channel_id && (
                    <div className="pt-4 border-t border-white/40 flex justify-end">
                      <button
                        onClick={handleDisconnectYoutubeChannel}
                        disabled={youtubeLinkingChannelId !== null}
                        className="px-4 py-2.5 bg-red-50/80 hover:bg-red-100/80 border border-red-200/30 text-red-600 text-xs font-bold rounded-xl transition duration-200 font-heading"
                      >
                        {youtubeLinkingChannelId === "disconnect" ? "Disconnecting..." : "Disconnect Channel"}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}