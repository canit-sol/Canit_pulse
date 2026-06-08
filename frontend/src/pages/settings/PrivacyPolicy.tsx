import SettingsLayout from "../../components/SettingsLayout";
import { Shield, Database, Users, Sparkles, CheckCircle2 } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
            <Shield size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight font-heading">
              Privacy Policy
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              How data is processed, stored, and protected within CANIT Pulse.
            </p>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Main Statement Card */}
          <div className="md:col-span-2 glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300">
            <h2 className="text-sm font-bold mb-2 text-slate-800 font-heading flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5 text-[#113a87]" /> Our Commitment
            </h2>
            <p className="text-xs leading-relaxed text-slate-500 font-medium">
              CANIT Pulse is built with a zero-trust architecture. We prioritize client confidentiality.
              We do not sell client data under any circumstances. Access to data is solely for
              analytics, reporting, and brand intelligence.
            </p>
          </div>

          {/* Stored Data Elements */}
          <div className="glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300">
            <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-[#113a87]" /> Stored Data Elements
            </h3>
            <ul className="text-xs leading-relaxed text-slate-500 font-medium space-y-2.5 list-disc pl-4">
              <li>Client brand analytics and performance metrics.</li>
              <li>Connected social media profile insights via authorized API integrations.</li>
              <li>Generated intelligence reports and archive files.</li>
              <li>Platform permission rules and role-based access logs.</li>
              <li>AI assistant generated suggestions and dashboard insights.</li>
            </ul>
          </div>

          {/* Access & Safety */}
          <div className="glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-[#113a87]" /> Access Restrictions
              </h3>
              <p className="text-xs leading-relaxed text-slate-500 font-medium">
                Data access is restricted according to strict role-based permission profiles. Clients
                only have visibility into their specific tenant workspace, while internal managers and
                administrators access dashboard statistics on a need-to-know basis.
              </p>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100/50 flex items-center gap-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Multi-Tenant Isolation Enabled
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
