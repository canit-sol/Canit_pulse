import SettingsLayout from "../../components/SettingsLayout";
import { Scale, FileText, CheckCircle, XCircle, AlertCircle, Shield } from "lucide-react";
import { Link } from "react-router-dom";

export default function TermsOfUse() {
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isSuperAdmin = currentUser.role === "super_admin" || currentUser.role === "admin";

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
            <Scale size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight font-heading">
              Terms of Use
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Platform rules and usage guidelines for internal operations.
            </p>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Main Info Card */}
          <div className="md:col-span-2 glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300">
            <h2 className="text-sm font-bold mb-2 text-slate-800 font-heading flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#113a87]" /> Overview
            </h2>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              CANIT Pulse is an internal analytics and reporting platform operated by{" "}
              <span className="font-bold text-slate-700">CANIT Solutions</span>. Access is strictly
              restricted to authorized employees and approved CANIT clients. By using this platform,
              you agree to abide by these guidelines and maintain the security of our data ecosystem.
            </p>
          </div>

          {/* Permitted Actions */}
          <div className="glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2 mb-3">
                <CheckCircle className="w-4 h-4 text-green-600" /> Permitted Activities
              </h3>
              <ul className="text-xs leading-relaxed text-slate-500 font-medium space-y-2.5 list-disc pl-4">
                <li>View platform reports, dashboards, and client metrics.</li>
                <li>Access connected analytics and intelligence dashboards.</li>
                <li>Use reporting tools to gather brand performance insights.</li>
              </ul>
            </div>
          </div>

          {/* Restricted Actions */}
          <div className="glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2 mb-3">
                <XCircle className="w-4 h-4 text-red-600" /> Prohibited Activities
              </h3>
              <ul className="text-xs leading-relaxed text-slate-500 font-medium space-y-2.5 list-disc pl-4">
                <li>Share credentials or login details with unauthorized individuals.</li>
                <li>Export confidential client information without explicit authorization.</li>
                <li>Attempt to bypass access controls or view another client's analytics.</li>
              </ul>
            </div>
          </div>

          {/* Advisory Notice */}
          <div className="md:col-span-2 glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300 bg-amber-50/20 border-amber-200/50">
            <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-amber-600" /> Advisory Notice
            </h3>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              All AI-generated insights, recommendations, and analytics suggestions are advisory in
              nature and should be used to support rather than replace professional decision-making processes.
            </p>
          </div>
        </div>

        {/* Platform Compliance & Support Section */}
        <div className="glass-panel p-6 shadow-soft mt-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-600">
              <Shield size={18} />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-[#1a1a1a] font-heading">Platform Compliance & Support</h2>
              <p className="text-[11px] text-gray-400 font-medium mt-0.5">Platform terms, privacy disclosures, support contact, and metadata.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Terms of Use", path: "/settings/terms", desc: "Access rules & permitted usage.", active: true },
              { label: "Privacy Policy", path: "/settings/privacy", desc: "Data processing & isolation details." },
              { label: "Contact Support", path: "/settings/support", desc: "Technical assistance info." },
              ...(isSuperAdmin ? [{ label: "Platform Info", path: "/settings/info", desc: "Version & environment details." }] : []),
            ].map((doc) => (
              <Link
                key={doc.path}
                to={doc.path}
                className={`glass-card p-3.5 text-left transition-all flex flex-col justify-between min-h-[110px] ${
                  doc.active
                    ? "border-[#113a87] bg-[#113a87]/5 cursor-default"
                    : "bg-white/40 border-white/50 hover:border-[#113a87] hover:bg-white/80"
                }`}
              >
                <div>
                  <div className="text-[11px] font-bold text-[#1a1a1a] font-heading mb-1">{doc.label}</div>
                  <div className="text-[10px] leading-relaxed text-gray-400 font-medium">{doc.desc}</div>
                </div>
                {!doc.active && (
                  <div className="text-[10px] text-[#113a87] font-bold mt-2 hover:underline">View Details &rarr;</div>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
