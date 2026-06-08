import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, Settings, LogOut,
  ChevronLeft, ChevronRight, FolderKanban, UsersRound,
  FileText
} from "lucide-react";
import { useSidebar } from "../context/SidebarContext";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "./ui/tooltip";
import { usePermissions } from "../hooks/usePermissions";

export default function AppSidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const currentUser = JSON.parse(localStorage.getItem("bento_user") || "{}");
  const user = {
      name: currentUser.name || "User",
      role: permissions.displayName
  };
  const isInternalStaff = ["super_admin", "csm", "hr", "employee", "admin"].includes(currentUser.role);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard", end: true, show: currentUser.role !== 'employee' },
    { icon: Users,           label: "Clients",   path: "/admin/clients", end: false, show: currentUser.role !== 'hr' && permissions.canViewAllClients },
    { icon: FolderKanban,    label: "Archive",    path: "/admin/reports", end: false, show: permissions.canViewArchive },
    { icon: UsersRound,      label: "Users",      path: "/admin/users", end: false, show: permissions.canManageUsers },
    { icon: Settings,        label: "Settings",   path: "/admin/settings", end: false, show: permissions.canAccessSettings },
    { icon: FileText,        label: "Terms & Conditions", path: "/settings/terms", end: false, show: isInternalStaff },
  ].filter(item => item.show);

  const handleSignOut = async () => {
    const refreshToken = localStorage.getItem("bento_refresh_token");
    if (refreshToken) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });
      } catch (err) {
        console.error("Logout API call failed:", err);
      }
    }
    localStorage.removeItem("bento_token");
    localStorage.removeItem("bento_refresh_token");
    localStorage.removeItem("bento_user");
    navigate("/login");
  };

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  // Render elements with explicit transitions and exact cubic-bezier timing
  const logoSection = (
    <div
      onClick={() => {
        if (isInternalStaff) {
          navigate("/admin/dashboard");
        }
      }}
      className={`px-4 pt-5 pb-4 flex items-center justify-center min-h-[120px] relative overflow-hidden shrink-0 select-none ${
        isInternalStaff ? "cursor-pointer" : ""
      }`}
    >
      {/* Full Logo (visible when expanded) */}
      <div
        className={`absolute flex flex-col items-center justify-center transition-[opacity,transform,max-width] duration-200 ease-in-out ${
          collapsed ? "opacity-0 scale-75 max-w-0 pointer-events-none" : "opacity-100 scale-100 max-w-56"
        }`}
      >
        <img
          src="/cai.png"
          alt="Canit Logo"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
          className="h-14 w-auto object-contain shrink-0 select-none"
        />
        <div className="flex flex-col items-center mt-1.5 whitespace-nowrap">
          <span className="font-heading font-extrabold text-sm tracking-wide text-[#113a87]">CANIT Pulse</span>
          <span className="font-heading font-bold text-[9px] tracking-wider text-slate-400 uppercase mt-0.5">AI Brand Intelligence Suite</span>
        </div>
      </div>

      {/* CP Initials Avatar Logo (visible when collapsed) */}
      <div
        className={`transition-[opacity,transform] duration-200 ease-in-out ${
          collapsed ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm select-none">
          <span className="font-heading font-extrabold text-[11px] tracking-wider text-[#113a87] uppercase">CP</span>
        </div>
      </div>
    </div>
  );

  const profilePanel = (
    <div className="flex items-center rounded-xl p-2 bg-slate-50/50 border border-slate-100/60 shadow-sm transition-[padding,background-color] duration-200 ease-in-out">
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#113a87] to-[#1e56b8] text-white flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-sm">
        {initials}
      </div>
      <div
        className={`transition-[opacity,max-width,margin] duration-200 ease-in-out overflow-hidden whitespace-nowrap flex flex-col justify-center min-w-0 ${
          collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-40 opacity-100 ml-3"
        }`}
      >
        <span className="font-bold text-xs text-slate-800 truncate">{user.name}</span>
        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none mt-0.5 truncate">{user.role}</span>
      </div>
    </div>
  );

  const signOutButton = (
    <button
      onClick={handleSignOut}
      className={`w-full flex items-center rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50/50 hover:text-red-600 transition-[background-color,color,padding,justify-content] duration-200 ease-in-out group ${
        collapsed ? "justify-center px-3 py-3" : "px-3 py-3"
      }`}
    >
      <LogOut className="w-5 h-5 shrink-0 group-hover:-translate-x-0.5 transition-transform duration-200" />
      <span
        className={`font-heading transition-[opacity,max-width,margin] duration-200 ease-in-out overflow-hidden whitespace-nowrap ${
          collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-40 opacity-100 ml-3"
        }`}
      >
        Sign Out
      </span>
    </button>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-[width,background-color,border-color,box-shadow] duration-200 ease-in-out bg-[#FBFDFE]/25 backdrop-blur-3xl border-r border-slate-100/40 shadow-none ${
          collapsed ? "w-[68px]" : "w-56"
        }`}
      >
        {/* Logo Section */}
        {logoSection}

        {/* Navigation Section */}
        <nav className="flex-1 pt-4 pb-6 px-3 space-y-1.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const navLink = (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center rounded-xl text-sm font-medium transition-[background-color,color,border-color,padding,justify-content] duration-200 ease-in-out
                  ${isActive
                    ? "bg-[#113a87]/8 text-[#113a87] border-l-4 border-[#113a87] font-semibold"
                    : "text-gray-500 hover:bg-gray-100/40 hover:text-[#1a1a1a]"
                  }
                  ${collapsed ? "justify-center px-3 py-3" : "px-3 py-3"}`
                }
              >
                <item.icon className="w-5 h-5 shrink-0" />
                <span
                  className={`font-heading transition-[opacity,max-width,margin] duration-200 ease-in-out overflow-hidden whitespace-nowrap ${
                    collapsed ? "max-w-0 opacity-0 ml-0" : "max-w-40 opacity-100 ml-3"
                  }`}
                >
                  {item.label}
                </span>
              </NavLink>
            );

            return collapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{navLink}</TooltipTrigger>
                <TooltipContent side="right" className="font-heading font-medium text-xs">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              navLink
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-3 border-t border-white/40 space-y-2 bg-white/30 backdrop-blur-sm shrink-0">
          {/* User Profile Info Panel */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{profilePanel}</TooltipTrigger>
              <TooltipContent side="right" className="font-heading font-medium text-xs">
                <div className="font-bold">{user.name}</div>
                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{user.role}</div>
              </TooltipContent>
            </Tooltip>
          ) : (
            profilePanel
          )}

          {/* Sign Out Action Button */}
          {collapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>{signOutButton}</TooltipTrigger>
              <TooltipContent side="right" className="font-heading font-medium text-xs">
                Sign Out
              </TooltipContent>
            </Tooltip>
          ) : (
            signOutButton
          )}

          {/* Footer Text */}
          <div
            className={`text-center text-[9px] text-slate-400/50 font-medium font-heading tracking-wide transition-[opacity,max-height,padding] duration-200 ease-in-out overflow-hidden whitespace-nowrap ${
              collapsed ? "max-h-0 opacity-0 py-0" : "max-h-6 opacity-100 py-1"
            }`}
          >
            Powered by Canit Solutions
          </div>

          {/* Toggle Sidebar Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2.5 rounded-xl text-gray-400 hover:bg-gray-100/40 transition-[background-color,color] duration-200 ease-in-out"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  );
}