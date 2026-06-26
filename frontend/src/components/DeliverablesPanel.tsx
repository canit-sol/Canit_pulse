import React, { useState, useEffect, useRef } from "react";
import { Loader2, ClipboardList, Check, Star, X } from "lucide-react";
import { usePermissions } from "../hooks/usePermissions";

interface Deliverable {
  id: string;
  localKey?: string;
  client_id: string;
  month: string;
  year: string;
  title: string;
  platform: string;
  status: string; // "todo", "done"
  internal_notes?: string;
  assigned_to?: string;
}

const CUTE_PLACEHOLDERS = [
  "Plan social media grids...",
  "Schedule brand photoshoot...",
  "Draft creative copywriting...",
  "Define marketing goals...",
  "Review designer moodboard...",
  "Send email newsletter...",
  "Add a new task...",
  "Outline campaign metrics..."
];

export default function DeliverablesPanel({ clientId, month, year }: { clientId: string; month: string; year: string }) {
  const permissions = usePermissions();
  const canEdit = permissions.role === "super_admin" || permissions.role === "csm" || permissions.role === "admin";
  const canEditNotes = permissions.role === "super_admin" || permissions.role === "admin" || permissions.role === "client";
  const isClient = permissions.role === "client";
  const canViewFeedback = permissions.role === "client" || permissions.role === "csm" || permissions.role === "super_admin" || permissions.role === "admin";

  const [items, setItems] = useState<Deliverable[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [notesLoading, setNotesLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const notesSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const feedbackSaveTimer = useRef<NodeJS.Timeout | null>(null);

  const saveTimeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});

  const fetchDeliverables = async () => {
    try {
      const res = await fetch(`/api/deliverables?clientId=${clientId}&month=${month}&year=${year}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bento_token")}`,
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Map database items with localKeys so React transitions are smooth and stable
        const itemsWithKeys = data.map((x: any) => ({ ...x, localKey: x.id }));
        setItems(itemsWithKeys);
      }
    } catch (err) {
      console.error("Failed to fetch deliverables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setNotesLoading(true);
    fetchDeliverables();
  }, [clientId, month, year]);

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const res = await fetch(`/api/client-notes?clientId=${clientId}&month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setNotes(data.content || "");
        }
      } catch (err) {
        console.error("Failed to fetch notes", err);
      } finally {
        setNotesLoading(false);
      }
    };
    fetchNotes();
  }, [clientId, month, year]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const res = await fetch(`/api/report-feedback?clientId=${clientId}&month=${month}&year=${year}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
        });
        if (res.ok) {
          const data = await res.json();
          setFeedback(data.content || "");
          setFeedbackRating(data.rating);
        }
      } catch (err) {
        console.error("Failed to fetch report feedback", err);
      } finally {
        setFeedbackLoading(false);
      }
    };
    fetchFeedback();
  }, [clientId, month, year]);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
    notesSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/client-notes`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
          body: JSON.stringify({ clientId, month, year, content: val }),
        });
      } catch (err) {
        console.error("Failed to save notes", err);
      }
    }, 800);
  };

  const handleFeedbackChange = (val: string) => {
    setFeedback(val);
    if (feedbackSaveTimer.current) clearTimeout(feedbackSaveTimer.current);
    feedbackSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/report-feedback`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
          body: JSON.stringify({ clientId, month, year, content: val, rating: feedbackRating }),
        });
      } catch (err) {
        console.error("Failed to save report feedback", err);
      }
    }, 800);
  };

  const handleRatingChange = (rating: number) => {
    setFeedbackRating(rating);
    if (feedbackSaveTimer.current) clearTimeout(feedbackSaveTimer.current);
    feedbackSaveTimer.current = setTimeout(async () => {
      try {
        await fetch(`/api/report-feedback`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("bento_token")}` },
          body: JSON.stringify({ clientId, month, year, rating: rating === 0 ? null : rating }),
        });
      } catch (err) {
        console.error("Failed to save rating", err);
      }
    }, 300);
  };

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      Object.keys(saveTimeoutsRef.current).forEach((id) => {
        clearTimeout(saveTimeoutsRef.current[id]);
      });
      if (notesSaveTimer.current) clearTimeout(notesSaveTimer.current);
      if (feedbackSaveTimer.current) clearTimeout(feedbackSaveTimer.current);
    };
  }, []);

  // Handle focus behavior immediately when focusItemId changes
  useEffect(() => {
    if (focusItemId) {
      const el = document.getElementById(`input-${focusItemId}`);
      if (el) {
        el.focus();
        if (el instanceof HTMLInputElement) {
          const len = el.value.length;
          el.setSelectionRange(len, len);
        }
      }
      setFocusItemId(null);
    }
  }, [items, focusItemId]);

  const handleAddNewItem = () => {
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newItem: Deliverable = {
      id: tempId,
      localKey: tempId,
      client_id: clientId,
      month: month,
      year: year,
      title: "",
      platform: "General",
      status: "todo",
    };

    // Optimistically update the UI instantly
    setItems(prev => [...prev, newItem]);
    setFocusItemId(tempId);

    // Save in background
    fetch(`/api/deliverables`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("bento_token")}`,
      },
      body: JSON.stringify({
        clientId,
        month,
        year,
        title: "",
        platform: "General",
        status: "todo",
        internal_notes: "",
        assigned_to: "",
      }),
    })
      .then(res => {
        if (res.ok) return res.json();
        throw new Error("Failed to save background item");
      })
      .then(savedItem => {
        // Swap temp ID with real ID in background, keeping localKey same so no refocusses/remounts happen
        setItems(prev => prev.map(x => x.localKey === tempId ? { ...x, id: savedItem.id } : x));
      })
      .catch(err => {
        console.error("Background create failed", err);
      });
  };

  const triggerDebouncedSave = (id: string, title: string) => {
    if (saveTimeoutsRef.current[id]) {
      clearTimeout(saveTimeoutsRef.current[id]);
    }
    saveTimeoutsRef.current[id] = setTimeout(async () => {
      // Find the current item to check if it has been updated with a real ID
      const currentItems = await new Promise<Deliverable[]>(resolve => {
        setItems(prev => {
          resolve(prev);
          return prev;
        });
      });
      const item = currentItems.find(x => x.localKey === id || x.id === id);
      if (!item) return;

      // If it still hasn't completed saving on the server, retry in 100ms
      if (item.id.startsWith("temp-")) {
        triggerDebouncedSave(id, title);
        return;
      }

      try {
        await fetch(`/api/deliverables/${item.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("bento_token")}`,
          },
          body: JSON.stringify({ title }),
        });
        delete saveTimeoutsRef.current[id];
      } catch (err) {
        console.error("Auto-save failed", err);
      }
    }, 500);
  };

  const saveImmediately = async (id: string, title: string) => {
    if (saveTimeoutsRef.current[id]) {
      clearTimeout(saveTimeoutsRef.current[id]);
      delete saveTimeoutsRef.current[id];
    }

    if (id.startsWith("temp-")) {
      setTimeout(() => {
        setItems(prev => {
          const item = prev.find(x => x.localKey === id);
          if (item && !item.id.startsWith("temp-")) {
            saveImmediately(item.id, title);
          }
          return prev;
        });
      }, 50);
      return;
    }

    try {
      await fetch(`/api/deliverables/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bento_token")}`,
        },
        body: JSON.stringify({ title }),
      });
    } catch (err) {
      console.error("Immediate save failed", err);
    }
  };

  const handleTitleChange = (id: string, newTitle: string) => {
    setItems(prev => prev.map(item => item.localKey === id || item.id === id ? { ...item, title: newTitle } : item));
    triggerDebouncedSave(id, newTitle);
  };

  const handleToggle = async (item: Deliverable) => {
    if (!canEdit) return;
    const nextStatus = item.status === "done" ? "todo" : "done";
    setItems(prev => prev.map(x => x.localKey === item.localKey || x.id === item.id ? { ...x, status: nextStatus } : x));

    const idToUse = item.localKey || item.id;
    if (saveTimeoutsRef.current[idToUse]) {
      clearTimeout(saveTimeoutsRef.current[idToUse]);
      delete saveTimeoutsRef.current[idToUse];
    }

    // Wait until it has a real database ID
    if (item.id.startsWith("temp-")) {
      setTimeout(() => {
        setItems(prev => {
          const found = prev.find(x => x.localKey === item.localKey);
          if (found && !found.id.startsWith("temp-")) {
            handleToggle(found);
          }
          return prev;
        });
      }, 50);
      return;
    }

    try {
      await fetch(`/api/deliverables/${item.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("bento_token")}`,
        },
        body: JSON.stringify({ title: item.title, status: nextStatus }),
      });
    } catch (err) {
      console.error("Toggle status failed", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (saveTimeoutsRef.current[id]) {
      clearTimeout(saveTimeoutsRef.current[id]);
      delete saveTimeoutsRef.current[id];
    }
    setItems(prev => prev.filter(x => x.localKey !== id && x.id !== id));

    if (id.startsWith("temp-")) {
      return;
    }

    try {
      await fetch(`/api/deliverables/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("bento_token")}`,
        }
      });
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>, item: Deliverable, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      await saveImmediately(item.id, item.title);
      if (index === items.length - 1) {
        handleAddNewItem();
      } else {
        const nextItem = items[index + 1];
        setFocusItemId(nextItem.localKey || nextItem.id);
      }
    } else if (e.key === "Backspace" && item.title === "") {
      e.preventDefault();
      await handleDelete(item.localKey || item.id);
      if (index > 0) {
        const prevItem = items[index - 1];
        setFocusItemId(prevItem.localKey || prevItem.id);
      }
    } else if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      const prevItem = items[index - 1];
      setFocusItemId(prevItem.localKey || prevItem.id);
    } else if (e.key === "ArrowDown" && index < items.length - 1) {
      e.preventDefault();
      const nextItem = items[index + 1];
      setFocusItemId(nextItem.localKey || nextItem.id);
    }
  };

  const handleBlur = (item: Deliverable) => {
    saveImmediately(item.id, item.title);
  };

  const handleContainerClick = (e: React.MouseEvent) => {
    if (canEdit && e.target === e.currentTarget) {
      if (items.length === 0) {
        handleAddNewItem();
      } else {
        const lastItem = items[items.length - 1];
        if (lastItem.title.trim() === "") {
          setFocusItemId(lastItem.localKey || lastItem.id);
        } else {
          handleAddNewItem();
        }
      }
    }
  };

  const totalCount = items.length;
  const doneCount = items.filter(x => x.status === "done").length;
  const percentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(17,58,135,0.05)] transition-all duration-300 animate-fade-in flex flex-col h-full min-h-[400px]">
      {/* Header */}
      <div className="joyride-deliverables-header flex items-center gap-3 mb-5 select-none">
        <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center text-violet-500 shadow-sm border border-violet-100/50">
          <ClipboardList className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-extrabold font-heading text-slate-800 leading-tight">Deliverables</h2>
          <p className="text-[10px] text-violet-500/80 font-bold tracking-wider uppercase mt-0.5">Monthly deliverables tracking</p>
        </div>
      </div>

      {/* Progress Bar */}
      {totalCount > 0 && (
        <div className="joyride-deliverables-progress mb-5 bg-slate-50/50 border border-slate-100/60 rounded-2xl p-3.5 animate-fade-in select-none">
          <div className="flex justify-between items-center text-[10px] font-bold tracking-wide uppercase text-slate-400 mb-1.5 px-0.5">
            <span>Completion Progress</span>
            <span className="text-violet-500 font-extrabold">{doneCount}/{totalCount} Completed</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 transition-all duration-500 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className="text-[10px] font-semibold text-slate-400/85 mt-2 px-0.5 italic flex items-center gap-1">
            {percentage === 100
              ? "All deliverables completed."
              : `${percentage}% of deliverables completed.`}
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600/80" />
        </div>
      ) : (
        <div
          onClick={handleContainerClick}
          className={`flex-1 overflow-y-auto pr-1 min-h-[250px] space-y-2 ${canEdit ? 'cursor-text' : ''}`}
        >
          {items.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center select-none pointer-events-none animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-violet-50/80 flex items-center justify-center text-lg mb-4 shadow-sm border border-violet-100/30 text-violet-500">
                <ClipboardList className="w-7 h-7" />
              </div>
              <p className="text-slate-500 font-bold text-sm">No deliverables yet</p>
              {canEdit ? (
                <p className="text-slate-400 text-[11px] mt-1.5 font-medium">Click anywhere inside the box to start typing.</p>
              ) : (
                <p className="text-slate-400 text-[11px] mt-1.5 font-medium">No deliverables scheduled for this month yet.</p>
              )}
            </div>
          )}

          <div className="joyride-deliverables-tasks space-y-1">
            {items.map((item, index) => (
              <div
                key={item.localKey || item.id}
                className="flex items-center gap-3 py-1.5 px-3 hover:bg-slate-50/70 rounded-xl group relative transition-colors duration-200"
              >
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(item)}
                  disabled={!canEdit}
                  className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-300 shrink-0 ${item.status === "done"
                    ? "bg-emerald-400 border-emerald-400 text-white scale-95 shadow-[0_2px_10px_rgba(52,211,153,0.4)]"
                    : "border-slate-300 hover:border-violet-400 bg-white hover:scale-105 active:scale-95"
                    } ${!canEdit ? "cursor-default" : "cursor-pointer"}`}
                >
                  {item.status === "done" && <Check className="w-3.5 h-3.5 stroke-[3.5px]" />}
                </button>

                {/* Title Input / Text */}
                {canEdit ? (
                  <input
                    id={`input-${item.localKey || item.id}`}
                    type="text"
                    value={item.title}
                    onChange={(e) => handleTitleChange(item.localKey || item.id, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, item, index)}
                    onBlur={() => handleBlur(item)}
                    placeholder={CUTE_PLACEHOLDERS[index % CUTE_PLACEHOLDERS.length]}
                    className={`deliverable-input flex-1 bg-transparent border-none outline-none font-medium text-sm py-0.5 text-slate-700 placeholder-slate-300/80 transition-all duration-200 ${item.status === "done" ? "line-through text-slate-400/80 font-normal" : ""
                      }`}
                  />
                ) : (
                  <span
                    className={`flex-1 py-0.5 font-medium text-sm text-slate-700 select-none ${item.status === "done" ? "line-through text-slate-400/80 font-normal" : ""
                      }`}
                  >
                    {item.title || "Untitled deliverable"}
                  </span>
                )}

                {/* Delete Icon Button */}
                {canEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item.localKey || item.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="Delete item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Any Further Changes */}
      <div className="joyride-deliverables-notes tour-further-changes bg-white/60 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(17,58,135,0.05)] transition-all duration-300 animate-fade-in flex flex-col">
        <div className="flex items-center gap-3 mb-4 select-none">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100/50">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-extrabold font-heading text-slate-800 leading-tight">Additional Notes</h2>
            <p className="text-[10px] text-amber-500/80 font-bold tracking-wider uppercase mt-0.5">Submit change requests &amp; additional notes</p>
          </div>
        </div>
        {notesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600/60" />
          </div>
        ) : (
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add any further changes or requests here..."
            readOnly={!canEditNotes}
            rows={4}
            className={`w-full resize-none rounded-xl border text-sm font-medium p-4 transition-all duration-200 outline-none ${canEditNotes
              ? "bg-white border-slate-200/80 text-slate-700 focus:border-amber-400 focus:ring-4 focus:ring-amber-100 placeholder:text-slate-300"
              : "bg-slate-50/50 border-slate-100/60 text-slate-500 cursor-default select-none"
              }`}
          />
        )}
      </div>

      {/* Report Feedback (Client edits, Client/CSM/Super Admin views) */}
      {canViewFeedback && (
        <div className="bg-white/60 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_36px_-8px_rgba(17,58,135,0.05)] transition-all duration-300 animate-fade-in flex flex-col">
          <div className="flex items-center gap-3 mb-4 select-none">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm border border-rose-100/50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-extrabold font-heading text-slate-800 leading-tight flex items-center gap-2">
                Report Feedback
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider ${
                  isClient ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"
                }`}>
                  {isClient ? "Required" : "View Only"}
                </span>
              </h2>
              <p className="text-[10px] text-rose-500/80 font-bold tracking-wider uppercase mt-0.5">
                {isClient ? "Share your thoughts on this month's report" : "Client feedback on this month's report"}
              </p>
            </div>
          </div>
          {feedbackLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-rose-600/60" />
            </div>
          ) : (
            <>
              {/* Star Rating */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Your Rating</label>
                <div className="flex items-center gap-2">
                  {[1,2,3,4,5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRatingChange(star)}
                      disabled={!isClient}
                      className={`p-1 transition-colors ${star <= (feedbackRating || 0) ? "text-yellow-400" : "text-gray-300"} hover:text-yellow-400 focus:outline-none`}
                      aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    >
                      <Star className="w-6 h-6 fill-current" />
                    </button>
                  ))}
                  {isClient && feedbackRating && (
                    <button
                      type="button"
                      onClick={() => handleRatingChange(0)}
                      className="ml-2 text-sm text-gray-500 underline hover:text-rose-500 hover:underline-offset-2 transition-colors"
                      aria-label="Clear rating"
                    >
                      Clear rating
                    </button>
                  )}
                </div>
              </div>

              {/* Text Feedback */}
              <textarea
                value={feedback}
                onChange={(e) => handleFeedbackChange(e.target.value)}
                placeholder="How was this month's report? What did you find most valuable? What could be improved? (Optional)"
                rows={4}
                readOnly={!isClient}
                className={`w-full resize-none rounded-xl border text-sm font-medium p-4 transition-all duration-200 outline-none ${
                  isClient
                    ? "bg-white border-slate-200/80 text-slate-700 focus:border-rose-400 focus:ring-4 focus:ring-rose-100 placeholder:text-slate-300"
                    : "bg-slate-50/50 border-slate-100/60 text-slate-500 cursor-default select-none"
                }`}
              />
            </>
          )}
          <p className={`text-[10px] font-medium mt-2 flex items-center gap-1.5 ${isClient ? "text-rose-500/80" : "text-amber-500/80"}`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${isClient ? "bg-rose-500" : "bg-amber-500"}`} />
            {isClient
              ? "Rating required. Text feedback optional."
              : "Client feedback (view only)"}
          </p>
        </div>
      )}

    </div>
  );
}
