import React from "react";
import AppSidebar from "./AppSidebar";
import { useSidebar } from "../context/SidebarContext";

interface StableLayoutProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  showSidebar?: boolean;
}

export default function StableLayout({
  children,
  headerContent,
  footerContent,
  showSidebar = false,
}: StableLayoutProps) {
  const sidebarContext = useSidebar();
  const collapsed = sidebarContext?.collapsed ?? false;

  // Compute responsive padding/left offset for sidebar
  const sidebarPaddingClass = showSidebar
    ? collapsed
      ? "pl-[68px]"
      : "pl-56"
    : "pl-0";

  const sidebarLeftClass = showSidebar
    ? collapsed
      ? "left-[68px]"
      : "left-56"
    : "left-0";

  return (
    <div className={`stable-layout min-h-screen flex flex-col bg-transparent font-body text-[#1a1b21] transition-[padding] duration-200 ease-in-out ${sidebarPaddingClass}`}>
      {/* Optionally render the sidebar */}
      {showSidebar && <AppSidebar />}

      {/* Sticky Header */}
      <header
        className="stable-header sticky top-0 z-30 transition-all duration-200 ease-in-out nav-glass shadow-sm border-b border-[#E7EDF5] bg-white/70 backdrop-blur-md"
      >
        <div className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {headerContent || (
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <span className="font-heading font-extrabold text-[#113a87] text-lg tracking-tight select-none">
                  CANIT Pulse
                </span>
                <span className="hidden sm:inline-block px-2.5 py-1 text-[9px] font-bold tracking-wider text-[#113a87] bg-[#113a87]/8 rounded-full uppercase">
                  Workspace
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <a
                  href="/admin/dashboard"
                  className="hover:text-[#113a87] transition-colors duration-200"
                >
                  Console
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main
        className="stable-main flex-1 transition-all duration-200 ease-in-out p-6 md:p-8"
      >
        {/* Centered container with max-width to prevent wobbling */}
        <div className="stable-content w-full max-w-[1200px] mx-auto relative">
          {children}
        </div>
      </main>

      {/* Fixed Footer */}
      <footer
        className={`stable-footer fixed bottom-0 right-0 z-30 transition-[left] duration-200 ease-in-out bg-white/90 backdrop-blur-md border-t border-[#E7EDF5]/80 py-3.5 shadow-md ${sidebarLeftClass}`}
      >
        <div className="w-full max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-semibold tracking-wide">
          {footerContent || (
            <>
              <div className="select-none">
                &copy; {new Date().getFullYear()} <span className="text-slate-500 font-brand font-bold">Canit Pulse</span>. All rights reserved.
              </div>
              <div className="flex gap-4">
                <a
                  href="/terms"
                  className="hover:text-[#113a87] hover:underline transition-all duration-200"
                >
                  Terms & Conditions
                </a>
                <span className="text-slate-200">|</span>
                <span className="text-slate-400/80">AI-Powered Brand Engine</span>
              </div>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
