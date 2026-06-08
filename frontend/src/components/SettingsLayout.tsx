import React from "react";
import { Link } from "react-router-dom";
import StableLayout from "./StableLayout";
import { ArrowLeft } from "lucide-react";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const isInternalStaff = ["super_admin", "csm", "hr", "employee", "admin"].includes(currentUser.role);
  const clientId = currentUser.client_id;

  const backPath = isInternalStaff ? "/admin/settings" : (clientId ? `/client/${clientId}` : "/");
  const backLabel = isInternalStaff ? "Back to Settings" : "Back to Report";

  return (
    <StableLayout showSidebar={isInternalStaff}>
      <div className="w-full max-w-4xl mx-auto pb-16 animate-fade-in">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to={backPath}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-[#113a87] transition-colors duration-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {backLabel}
          </Link>
        </div>

        {/* Content Card / List */}
        <div className="w-full">
          {children}
        </div>
      </div>
    </StableLayout>
  );
}
