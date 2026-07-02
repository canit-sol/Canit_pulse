import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, Eye, Calendar, Building2, Trash2, AlertTriangle, X } from "lucide-react";
import AppSidebar from "../components/AppSidebar";
import { useSidebar } from "../context/SidebarContext";
import { usePermissions } from "../hooks/usePermissions";
import { authHeaders } from "../config/api";

export default function ReportsArchive() {
  const { collapsed } = useSidebar();
  const permissions = usePermissions();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const fetchReports = () => {
    setLoading(true);
    fetch("/api/reports", { headers: authHeaders() })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setReports(data.reports || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/reports/${deleteTarget.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev: any) => prev.filter((r: any) => r.id !== deleteTarget.id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className={`min-h-screen bg-transparent transition-[padding] duration-200 ease-in-out ${collapsed ? "pl-0 md:pl-[68px]" : "pl-0 md:pl-56"}`}>
      <AppSidebar />
      <main className="flex-1 p-4 pl-12 md:p-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-[#113a87]/10 rounded-xl text-[#113a87] shadow-soft">
              <FolderKanban size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Master Archive</h1>
              <p className="text-gray-500 font-medium">Secure vault of all generated client reports.</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-400 font-semibold animate-pulse">Loading vault...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-20 glass-card">
              <p className="text-gray-400 font-medium">No reports generated yet.</p>
            </div>
          ) : (
            <div className="glass-panel overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/20 border-b border-white/40 text-sm text-gray-500">
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Client Name</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Report Period</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Report ID</th>
                    <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report: any) => (
                    <tr key={report.id} className="border-b border-white/30 hover:bg-white/40 transition-colors group">
                      <td className="p-4">
                        <div className="flex items-center gap-2 font-bold text-gray-900">
                          <Building2 size={16} className="text-gray-400" />
                          {report.client_name}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-gray-600 font-medium">
                          <Calendar size={16} className="text-gray-400" />
                          {report.month} {report.year}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-400 font-mono">
                        {report.id.substring(0, 8)}…
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/report/${report.id}`)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white border border-white/80 rounded-lg text-xs font-bold text-[#113a87] transition-all shadow-soft active:scale-95"
                          >
                            <Eye size={14} /> View
                          </button>
                          {permissions.canDeleteReport && (
                            <button
                              onClick={() => setDeleteTarget(report)}
                              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/40 hover:bg-red-500 hover:text-white border border-white/60 hover:border-red-500 rounded-lg text-xs font-bold text-red-500 transition-all shadow-soft opacity-0 group-hover:opacity-100"
                              title="Delete report"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ── DELETE CONFIRMATION MODAL ──────────────────────────── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          style={{ animation: "fadeIn 0.15s ease-out" }}
        >
          <div
            className="bg-white/80 backdrop-blur-md rounded-3xl shadow-glass border border-white/50 p-7 w-full max-w-md mx-4"
            style={{ animation: "scaleIn 0.2s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-5">
              <div className="p-3 bg-red-50 rounded-xl text-red-500 shrink-0">
                <AlertTriangle size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-black text-gray-900 leading-none">
                  Delete Report
                </h3>
                <p className="text-sm text-gray-500 mt-2 font-medium">
                  Are you sure you want to permanently delete the report for{" "}
                  <span className="font-semibold text-gray-700">{deleteTarget.client_name}</span>{" "}
                  ({deleteTarget.month} {deleteTarget.year})? This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-white/50"
              >
                <X size={18} />
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/40">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-white/60 border border-white/80 hover:bg-white rounded-lg transition-all shadow-soft active:scale-95"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-soft active:scale-95"
              >
                {deleting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 size={13} /> Delete Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline keyframe animations for the modal */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}