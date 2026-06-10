import { Loader2, BarChart2, FileCheck, UploadCloud } from "lucide-react";
import { getApiUrl } from "@/config/api";

interface ClientCardProps {
  id: string;
  name: string;
  industry: string;
  handle?: string;
  website_url?: string;
  isInstagramConnected: boolean;   // true when ig_user_id is set (Instagram Business linked)
  isFacebookConnected?: boolean;
  isYoutubeConnected?: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
  onClick: () => void;
  // Added properties for SEO PDF upload support
  seoPdfFilename?: string;
  seoPdfUploadedAt?: string;
  onUploadSeoPdf?: (clientId: string) => void;
  onConnectYoutube?: (clientId: string) => void;
  onConnectInstagram?: (clientId: string) => void;
  onConnectFacebook?: (clientId: string) => void;
  hasAgencyToken?: boolean;        // true when agency-level ig_access_token exists (Meta OAuth done)
  isUploadingSeo?: boolean;
  isHr?: boolean;
  seoReports?: any[];
}

// ── Brand Icons ──────────────────────────────────────────────────────────────
const InstagramIcon = ({ className = "w-[14px] h-[14px]" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.919-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = ({ className = "w-[14px] h-[14px]" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
);

const YoutubeIcon = ({ className = "w-[14px] h-[14px]" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function ClientCard({
  id,
  name,
  industry,
  handle,
  website_url,
  isInstagramConnected,
  isFacebookConnected,
  isYoutubeConnected,
  isGenerating,
  onGenerate,
  onClick,
  seoPdfFilename,
  seoPdfUploadedAt,
  onUploadSeoPdf,
  onConnectYoutube,
  onConnectInstagram,
  onConnectFacebook,
  hasAgencyToken = false,
  isUploadingSeo,
  isHr = false,
  seoReports,
}: ClientCardProps) {
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isHrRole = isHr || currentUser.role === 'hr';

  return (
    <div
      onClick={onClick}
      className="bg-white/75 backdrop-blur-md rounded-2xl p-4 border border-white/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_36px_-8px_rgba(17,58,135,0.12)] hover:-translate-y-1 hover:border-white/90 transition-all duration-300 ease-out cursor-pointer flex flex-col justify-between h-full group"
    >
      {/* ── Top Section: Client name, industry & website ── */}
      <div className="mb-2 pr-12">
        <h3 className="font-heading font-extrabold text-base text-[#1a1a1a] mb-0.5 leading-tight group-hover:text-[#113a87] transition-colors duration-300 truncate">
          {name}
        </h3>
        <p className="text-[9px] font-bold tracking-wider uppercase text-gray-400/80 mb-0.5 px-0.5 font-heading truncate">
          {industry || "No industry set"}
        </p>
        <p className="text-[11px] font-medium text-gray-400/60 px-0.5 truncate">
          {website_url ? website_url.replace(/^https?:\/\/(www\.)?/, '') : (handle ? `@${handle}` : "No website set")}
        </p>
      </div>

      {/* ── Middle: Connection Docks + Hint Text (Single row) ── */}
      <div className="flex items-center justify-between my-2.5 pt-2.5 border-t border-gray-100/60 select-none">
        
        {/* Left Docks */}
        <div className="flex items-center gap-1.5">
          {/* Instagram Connect Dock */}
          <div className="relative">
            {isHrRole ? (
              <div
                className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm ${
                  isInstagramConnected 
                    ? "bg-gradient-to-tr from-pink-500 to-indigo-600 text-white" 
                    : "bg-gray-100/50 text-gray-400"
                }`}
                title={isInstagramConnected ? "Instagram Business connected" : "Instagram not connected"}
              >
                <InstagramIcon className="w-3.5 h-3.5" />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasAgencyToken && onConnectInstagram) {
                    onConnectInstagram(id);
                  } else {
                    localStorage.setItem("linking_client_name", name);
                    window.location.href = getApiUrl(`/auth/instagram/connect/${id}`);
                  }
                }}
                className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                  isInstagramConnected 
                    ? "bg-gradient-to-tr from-pink-500 to-indigo-600 text-white hover:opacity-90 hover:scale-105" 
                    : "bg-gray-100/50 hover:bg-gray-100/80 text-gray-400 hover:text-gray-600"
                }`}
                title={isInstagramConnected ? "Instagram Business connected — click to reconnect" : hasAgencyToken ? "Link Instagram Business Page" : "Connect Instagram Business (Meta OAuth)"}
              >
                <InstagramIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white
                ${isInstagramConnected ? "bg-green-400 shadow-sm" : "bg-gray-300"}`}
            />
          </div>
 
          {/* Facebook Connection Dock */}
          <div className="relative">
            {isHrRole ? (
              <div
                className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm ${
                  isFacebookConnected 
                    ? "bg-[#1877F2] text-white" 
                    : "bg-gray-100/50 text-gray-400"
                }`}
                title={isFacebookConnected ? "Facebook Business connected" : "Facebook not connected"}
              >
                <FacebookIcon className="w-3.5 h-3.5" />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (hasAgencyToken && onConnectFacebook) {
                    onConnectFacebook(id);
                  } else {
                    localStorage.setItem("linking_client_name", name);
                    window.location.href = getApiUrl(`/auth/instagram/connect/${id}`);
                  }
                }}
                className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                  isFacebookConnected 
                    ? "bg-[#1877F2] text-white hover:opacity-90 hover:scale-105" 
                    : "bg-gray-100/50 hover:bg-gray-100/80 text-gray-400 hover:text-gray-600"
                }`}
                title={isFacebookConnected ? "Facebook Business connected" : hasAgencyToken ? "Link Facebook Page" : "Connect Facebook (Meta OAuth)"}
              >
                <FacebookIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white
                ${isFacebookConnected ? "bg-green-400 shadow-sm" : "bg-gray-300"}`}
            />
          </div>

          {/* YouTube Connection Dock */}
          <div className="relative">
            {isHrRole ? (
              <div
                className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm ${
                  isYoutubeConnected 
                    ? "bg-[#FF0000] text-white" 
                    : "bg-gray-100/50 text-gray-400"
                }`}
                title={isYoutubeConnected ? "YouTube channel connected" : "YouTube not connected"}
              >
                <YoutubeIcon className="w-3.5 h-3.5" />
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onConnectYoutube) {
                    onConnectYoutube(id);
                  }
                }}
                className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                  isYoutubeConnected 
                    ? "bg-[#FF0000] text-white hover:opacity-90 hover:scale-105" 
                    : "bg-gray-100/50 hover:bg-gray-100/80 text-gray-400 hover:text-gray-600"
                }`}
                title={isYoutubeConnected ? "YouTube channel connected — click to change" : "Connect YouTube Channel"}
              >
                <YoutubeIcon className="w-3.5 h-3.5" />
              </button>
            )}
            <span
              className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white
                ${isYoutubeConnected ? "bg-green-400 shadow-sm" : "bg-gray-300"}`}
            />
          </div>

          {/* SEO PDF Upload Dock */}
          {!isHrRole && (() => {
            const currentMonthName = new Date().toLocaleString("default", { month: "long" });
            const currentYearStr = new Date().getFullYear().toString();
            const hasCurrentMonthReport = seoReports?.some(r => r.month === currentMonthName && r.year === currentYearStr);

            return (
              <div className="relative">
                <button
                  type="button"
                  disabled={isUploadingSeo}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onUploadSeoPdf) {
                      onUploadSeoPdf(id);
                    }
                  }}
                  className={`w-[32px] h-[32px] rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 ${
                    hasCurrentMonthReport 
                      ? "bg-green-50 text-green-600 border border-green-200 hover:scale-105" 
                      : "bg-gray-100/50 hover:bg-gray-100/80 text-gray-400 hover:text-gray-600 hover:scale-105"
                  }`}
                  title={hasCurrentMonthReport ? `Monthly SEO PDF Uploaded (Click to update)` : "Upload Monthly SEO PDF"}
                >
                  {isUploadingSeo ? (
                    <Loader2 size={13} className="animate-spin text-[#113a87]" />
                  ) : hasCurrentMonthReport ? (
                    <FileCheck className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <UploadCloud className="w-3.5 h-3.5" />
                  )}
                </button>
                {hasCurrentMonthReport && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-green-500 shadow-sm" />
                )}
              </div>
            );
          })()}
        </div>

        {/* Right Hint Text / PDF Name */}
        {!isHrRole && (
          <div className="text-right shrink-0">
            {seoPdfFilename ? (
              <div className="flex flex-col gap-0.5 text-[8px] leading-tight text-gray-400 font-medium max-w-[130px] truncate">
                <span className="font-extrabold text-gray-700 truncate" title={seoPdfFilename}>
                  📄 {seoPdfFilename}
                </span>
              </div>
            ) : (
              <p className="text-[9px] text-gray-400 italic font-heading">
                Connect accounts via dock
              </p>
            )}
          </div>
        )}

      </div>

      {/* ── Bottom: Full-width compact Generate Report button ── */}
      {!isHrRole && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onGenerate();
          }}
          disabled={isGenerating}
          className="w-full py-2 bg-[#113a87] text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center justify-center gap-1.5 disabled:opacity-75"
        >
          {isGenerating ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              <span className="font-heading">Generating...</span>
            </>
          ) : (
            <>
              <BarChart2 size={13} />
              <span className="font-heading">Generate Report</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}