import SettingsLayout from "../../components/SettingsLayout";
import { LifeBuoy, Mail, ShieldAlert, Sparkles } from "lucide-react";

export default function ContactSupport() {
  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
            <LifeBuoy size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight font-heading">
              Contact Support
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Assistance with access, metrics, and technical issues.
            </p>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Main Info Card */}
          <div className="md:col-span-2 glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300">
            <h2 className="text-sm font-bold mb-3 text-slate-800 font-heading flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#113a87]" /> Support Team
            </h2>
            <p className="text-xs leading-relaxed text-slate-500 font-medium mb-4">
              Our support team is here to assist with any questions regarding platform configurations
              and data integrations. For assistance, please contact your designated CANIT account manager
              or internal platform administrator.
            </p>
            <div className="bg-slate-50/50 rounded-xl p-3.5 border border-slate-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center border border-slate-150 shadow-sm shrink-0">
                <Mail className="w-4 h-4 text-[#113a87]" />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Managed By</div>
                <div className="text-xs font-bold text-slate-800">CANIT Solutions</div>
              </div>
            </div>
          </div>

          {/* Support Areas Card */}
          <div className="glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-heading flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-amber-500" /> Support Areas
              </h3>
              <ul className="text-xs leading-relaxed text-slate-500 font-semibold space-y-3">
                <li className="flex items-center gap-2 text-slate-600">
                  <span className="w-1.5 h-1.5 bg-[#113a87] rounded-full" />
                  Platform Access & Auth
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <span className="w-1.5 h-1.5 bg-[#113a87] rounded-full" />
                  Client Reports & Metrics
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <span className="w-1.5 h-1.5 bg-[#113a87] rounded-full" />
                  Social Media Integrations
                </li>
                <li className="flex items-center gap-2 text-slate-600">
                  <span className="w-1.5 h-1.5 bg-[#113a87] rounded-full" />
                  Technical Outages
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
