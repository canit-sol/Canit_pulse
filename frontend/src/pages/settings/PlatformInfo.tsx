import { Navigate } from "react-router-dom";
import SettingsLayout from "../../components/SettingsLayout";
import { Info, Cpu, Calendar, Monitor, Tag, Users } from "lucide-react";
import packageJson from "../../../package.json";

export default function PlatformInfo() {
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isSuperAdmin = currentUser.role === "super_admin" || currentUser.role === "admin";

  if (!isSuperAdmin) {
    return <Navigate to="/settings/terms" replace />;
  }

  // Get dynamic environment and metadata
  const environment = import.meta.env.MODE === "production" ? "Production" : "Development";
  const version = packageJson.version || "1.0.0-stable";
  
  // Dynamic build timestamp: using the document's last modified time as a dynamic metadata indicator
  const buildTimestamp = new Date(document.lastModified).toLocaleString();

  return (
    <SettingsLayout>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-[#113a87] to-[#1e56b8] rounded-xl text-white shadow-lg shadow-[#113a87]/15">
            <Info size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-[#1a1a1a] tracking-tight font-heading">
              Platform Information
            </h1>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Technical metadata and operational status of CANIT Pulse.
            </p>
          </div>
        </div>

        {/* Content Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Metadata Card */}
          <div className="md:col-span-2 glass-panel p-6 shadow-soft hover:shadow-glass hover:border-slate-300 transition-all duration-300">
            <h2 className="text-sm font-bold mb-4 text-slate-800 font-heading flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#113a87]" /> Technical Metadata
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Platform Name
                </span>
                <span className="font-bold text-slate-800">CANIT Pulse</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold flex items-center gap-2">
                  <Monitor className="w-3.5 h-3.5" /> Type
                </span>
                <span className="font-bold text-slate-850">Internal Analytics & Intelligence Platform</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" /> Owner
                </span>
                <span className="font-bold text-slate-800">CANIT Solutions</span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5" /> Environment
                </span>
                <span className="font-bold px-2 py-0.5 rounded bg-[#113a87]/8 text-[#113a87] uppercase text-[10px]">
                  {environment}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pb-2.5 border-b border-slate-100/50">
                <span className="text-slate-400 font-semibold flex items-center gap-2">
                  <Tag className="w-3.5 h-3.5" /> Version
                </span>
                <span className="font-bold text-slate-800">{version}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Last Updated (Build)
                </span>
                <span className="font-bold text-slate-800">{buildTimestamp}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
}
