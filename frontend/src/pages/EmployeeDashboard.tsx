import React, { useState } from "react";
import { 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  MessageSquare, 
  Award, 
  Clock, 
  ArrowRight, 
  Plus, 
  Send, 
  Flame, 
  ThumbsUp, 
  Zap, 
  User, 
  Check, 
  PlusCircle, 
  Smile, 
  Coffee, 
  Terminal, 
  Target, 
  BookOpen, 
  FolderPlus,
  HelpCircle,
  LogOut,
  Bell
} from "lucide-react";

// Types
interface Task {
  id: string;
  title: string;
  category: "Design" | "Copywriting" | "Dev" | "Strategy";
  priority: "High" | "Medium" | "Low";
  completed: boolean;
  deadline: string;
}

interface Activity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  time: string;
  type: "kudos" | "update" | "standup";
  detail?: string;
  sticker?: string;
}

interface Achievement {
  id: string;
  title: string;
  desc: string;
  icon: string;
  color: string;
  date: string;
}

export default function EmployeeDashboard() {
  // ── STATE ──
  const [currentVibe, setCurrentVibe] = useState("⚡ In the Zone");
  const [showVibeDropdown, setShowVibeDropdown] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", title: "Refine landing page layout for Client Indigo", category: "Design", priority: "High", completed: false, deadline: "Today, 5:00 PM" },
    { id: "2", title: "Draft email sequence copy for Summer Campaign", category: "Copywriting", priority: "Medium", completed: false, deadline: "Tomorrow" },
    { id: "3", title: "Build interaction animations for client dashboard", category: "Dev", priority: "High", completed: true, deadline: "Today, 2:00 PM" },
    { id: "4", title: "Competitor research presentation & deck preparation", category: "Strategy", priority: "Low", completed: false, deadline: "June 20" },
  ]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"Design" | "Copywriting" | "Dev" | "Strategy">("Design");
  
  // Standup State
  const [yesterdayText, setYesterdayText] = useState("");
  const [todayText, setTodayText] = useState("");
  const [blockerText, setBlockerText] = useState("");
  const [standupSubmitted, setStandupSubmitted] = useState(false);
  
  // Blocker Widget State
  const [blockerAlert, setBlockerAlert] = useState<{ id: string; description: string; timestamp: string } | null>({
    id: "b1",
    description: "Waiting for assets on Indigo Landing Page. Sent request to Account Lead.",
    timestamp: "10:30 AM Today"
  });
  const [newBlockerInput, setNewBlockerInput] = useState("");

  // Kudos / Activity State
  const [activities, setActivities] = useState<Activity[]>([
    { id: "act1", user: "Marcus (Design Lead)", avatar: "🎨", action: "awarded Kudos to Sarah", time: "10m ago", type: "kudos", sticker: "👑 Pixel Perfect", detail: "The animations are clean, Sarah!" },
    { id: "act2", user: "Jessica (CSM)", avatar: "📈", action: "uploaded brief for Client Neon", time: "1h ago", type: "update", detail: "Added client goals and target assets folder." },
    { id: "act3", user: "David (Copywriter)", avatar: "✍️", action: "submitted daily standup", time: "2h ago", type: "standup", detail: "Drafting ad text today. Ready for review." },
  ]);
  
  const [kudosRecipient, setKudosRecipient] = useState("Sarah");
  const [kudosSticker, setKudosSticker] = useState("👑 Pixel Perfect");
  const [kudosMsg, setKudosMsg] = useState("");

  // Achievements
  const achievements: Achievement[] = [
    { id: "a1", title: "Blocker Slayer", desc: "Resolved 5 workflow obstacles this week", icon: "🛡️", color: "bg-[#E6FFFA] border-[#319795]", date: "June 16" },
    { id: "a2", title: "Streak Master", desc: "Submitted Standup 5 days in a row", icon: "🔥", color: "bg-[#FFF5F5] border-[#E53E3E]", date: "June 14" },
    { id: "a3", title: "Creative Engine", desc: "Earned 10 public Kudos from Design Team", icon: "🚀", color: "bg-[#EBF8FF] border-[#3182CE]", date: "June 12" },
  ];

  // Vibes list
  const vibeOptions = [
    "⚡ In the Zone",
    "☕ Coffee-Powered",
    "🎨 Creative Flow",
    "🧘 Deep Focus",
    "🌈 Idea Generator",
    "🛌 Needs Recharge"
  ];

  // Handlers
  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      category: newTaskCategory,
      priority: "Medium",
      completed: false,
      deadline: "June 22"
    };
    setTasks([...tasks, newTask]);
    setNewTaskTitle("");
  };

  const handleStandupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!yesterdayText.trim() || !todayText.trim()) return;
    setStandupSubmitted(true);
    
    // Add to activity feed
    const newActivity: Activity = {
      id: Date.now().toString(),
      user: "You (Developer)",
      avatar: "💻",
      action: "submitted daily standup",
      time: "Just now",
      type: "standup",
      detail: `Today: ${todayText}`
    };
    setActivities([newActivity, ...activities]);
  };

  const handleSendKudos = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kudosMsg.trim()) return;
    const newKudos: Activity = {
      id: Date.now().toString(),
      user: "You (Developer)",
      avatar: "💻",
      action: `awarded Kudos to ${kudosRecipient}`,
      time: "Just now",
      type: "kudos",
      sticker: kudosSticker,
      detail: kudosMsg
    };
    setActivities([newKudos, ...activities]);
    setKudosMsg("");
  };

  const handleRaiseBlocker = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockerInput.trim()) return;
    setBlockerAlert({
      id: Date.now().toString(),
      description: newBlockerInput,
      timestamp: "Just now"
    });
    setNewBlockerInput("");
  };

  const handleResolveBlocker = () => {
    setBlockerAlert(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans p-6 md:p-8">
      {/* ── HEADER NAVIGATION ── */}
      <header className="max-w-7xl mx-auto mb-8 bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0px_#0f172a] flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-[#D8D8FF] border-2 border-slate-900 rounded-xl flex items-center justify-center shadow-[2px_2px_0px_#0f172a] font-bold text-xl">
            C⚡
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">CANIT Cloud</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Employee Workspace</p>
          </div>
        </div>

        {/* Vibe Selector & Profile Panel */}
        <div className="flex flex-wrap items-center gap-4">
          {/* Daily vibe button */}
          <div className="relative">
            <button 
              onClick={() => setShowVibeDropdown(!showVibeDropdown)}
              className="bg-[#FFF0D4] border-2 border-slate-900 rounded-xl px-4 py-2 text-sm font-bold shadow-[3px_3px_0px_#0f172a] flex items-center gap-2 hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all"
            >
              <span>Vibe:</span>
              <span className="bg-white px-2 py-0.5 border border-slate-900 rounded text-xs">{currentVibe}</span>
            </button>

            {showVibeDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-slate-900 rounded-xl shadow-[4px_4px_0px_#0f172a] z-50 overflow-hidden">
                <div className="p-2 bg-slate-100 border-b-2 border-slate-900 text-xs font-black uppercase text-slate-500">
                  Choose your vibe today
                </div>
                {vibeOptions.map((vibe) => (
                  <button
                    key={vibe}
                    onClick={() => {
                      setCurrentVibe(vibe);
                      setShowVibeDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-[#EEF2FF] border-b border-slate-100 last:border-0 transition-colors flex items-center justify-between"
                  >
                    <span>{vibe}</span>
                    {currentVibe === vibe && <Check className="w-3 h-3 text-emerald-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Summary badges */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border-2 border-slate-900 rounded-xl px-3 py-1.5 text-xs font-bold shadow-[2px_2px_0px_#0f172a]">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-slate-900 animate-pulse"></span>
            <span>Agency Delivery Pulse: Stable</span>
          </div>

          {/* Avatar and notification button */}
          <div className="flex items-center gap-2">
            <button className="p-2 border-2 border-slate-900 rounded-xl bg-white hover:bg-slate-50 shadow-[2px_2px_0px_#0f172a] transition-all relative">
              <Bell className="w-4 h-4 text-slate-900" />
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 border-2 border-slate-900 rounded-full flex items-center justify-center text-[8px] font-black text-white">2</span>
            </button>
            <div className="flex items-center gap-2 bg-[#D2F5E3] border-2 border-slate-900 rounded-xl p-1.5 pr-3 shadow-[2px_2px_0px_#0f172a]">
              <div className="w-7 h-7 bg-white border-2 border-slate-900 rounded-lg flex items-center justify-center font-bold text-sm">
                🧑‍💻
              </div>
              <div className="text-left leading-none">
                <p className="text-[10px] font-black text-slate-500 uppercase">Employee</p>
                <p className="text-xs font-bold text-slate-900">Alex Rivers</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT GRID ── */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT & CENTER PANEL (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* 1. Daily Greeting Section */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_#0f172a] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD2E8] border-l-4 border-b-4 border-slate-900 -mr-6 -mt-6 rotate-12 -z-10"></div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#FFD2E8] border-2 border-slate-900 text-slate-900 text-xs font-extrabold px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#0f172a]">
                    Hello, Alex! 👋
                  </span>
                  <span className="text-xs font-medium text-slate-400">June 17, 2026</span>
                </div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                  Let's make today creative and productive.
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                  You have <span className="font-bold text-slate-900">{tasks.filter(t => !t.completed).length} open tasks</span> remaining on your desk.
                </p>
              </div>
              
              <div className="flex gap-2">
                <div className="bg-[#EEF2FF] border-2 border-slate-900 rounded-xl p-3 text-center shadow-[3px_3px_0px_#0f172a] min-w-[80px]">
                  <p className="text-2xl font-black text-indigo-700">75%</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Completed</p>
                </div>
                <div className="bg-[#ECFDF5] border-2 border-slate-900 rounded-xl p-3 text-center shadow-[3px_3px_0px_#0f172a] min-w-[80px]">
                  <p className="text-2xl font-black text-emerald-700">3/4</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Tasks Done</p>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Blocker Alert Widget */}
          {blockerAlert && (
            <section className="bg-rose-50 border-4 border-rose-900 rounded-2xl p-5 shadow-[6px_6px_0px_#e11d48] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-all">
              <div className="flex gap-3 items-start">
                <div className="p-2.5 bg-rose-200 border-2 border-rose-900 rounded-xl flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-rose-700" />
                </div>
                <div>
                  <h3 className="font-black text-rose-900 text-lg">Active Roadblock Flagged</h3>
                  <p className="text-rose-800 text-sm font-medium mt-1">{blockerAlert.description}</p>
                  <span className="text-xs text-rose-500 font-bold block mt-1">Reported: {blockerAlert.timestamp}</span>
                </div>
              </div>
              <button 
                onClick={handleResolveBlocker}
                className="bg-white border-2 border-rose-900 hover:bg-rose-100 text-rose-900 px-4 py-2 text-xs font-black rounded-xl shadow-[3px_3px_0px_#e11d48] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#e11d48] transition-all whitespace-nowrap"
              >
                Mark Resolved ✔️
              </button>
            </section>
          )}

          {/* 3. Daily Standups Section */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_#0f172a]">
            <div className="flex justify-between items-center mb-4 border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FFF0D4] border-2 border-slate-900 rounded-lg flex items-center justify-center">
                  <Coffee className="w-4 h-4 text-slate-800" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Asynchronous Daily Standup</h3>
              </div>
              {standupSubmitted ? (
                <span className="bg-[#D2F5E3] border-2 border-slate-900 text-emerald-800 text-xs font-extrabold px-3 py-1 rounded-lg">
                  Submitted Today
                </span>
              ) : (
                <span className="bg-[#FFF0D4] border-2 border-slate-900 text-amber-800 text-xs font-extrabold px-3 py-1 rounded-lg animate-pulse">
                  Pending Check-in
                </span>
              )}
            </div>

            {standupSubmitted ? (
              <div className="bg-[#ECFDF5] border-2 border-slate-900 rounded-xl p-4 flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-slate-800">Your standup update has been broadcast to the agency feed!</p>
                  <p className="text-xs text-slate-500 mt-0.5">Managers and team members can now see your progress and support requests.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleStandupSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">1. What did you work on yesterday?</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Finished Indigo dashboard screens, attended sync call" 
                      value={yesterdayText}
                      onChange={(e) => setYesterdayText(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">2. What are you shipping today?</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Coding React app page, sending copy draft" 
                      value={todayText}
                      onChange={(e) => setTodayText(e.target.value)}
                      className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">3. Any roadblocks or blockers?</label>
                  <input 
                    type="text" 
                    placeholder="e.g., None! (or describe if you need support)" 
                    value={blockerText}
                    onChange={(e) => setBlockerText(e.target.value)}
                    className="w-full bg-slate-50 border-2 border-slate-900 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div className="flex justify-between items-center pt-2">
                  <p className="text-slate-400 text-xs font-semibold">Broadcasting to Design & Strategy feed</p>
                  <button 
                    type="submit" 
                    className="bg-[#D2F5E3] border-2 border-slate-900 text-slate-900 px-5 py-2 text-xs font-black rounded-xl shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all flex items-center gap-1.5"
                  >
                    <span>Submit Update</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* 4. Today's Tasks Summary */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-6 shadow-[6px_6px_0px_#0f172a]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5 border-b-2 border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#D8D8FF] border-2 border-slate-900 rounded-lg flex items-center justify-center">
                  <Target className="w-4 h-4 text-slate-800" />
                </div>
                <h3 className="text-lg font-black text-slate-900">Today's Deliverable Board</h3>
              </div>
              
              {/* Category selector */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400">Quick Add:</span>
                <form onSubmit={handleAddTask} className="flex gap-1.5">
                  <input 
                    type="text" 
                    placeholder="Add task details..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    className="bg-slate-50 border border-slate-900 rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
                  />
                  <select 
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="bg-slate-50 border border-slate-900 rounded-lg px-1 py-1 text-xs font-bold focus:outline-none"
                  >
                    <option value="Design">Design</option>
                    <option value="Copywriting">Copy</option>
                    <option value="Dev">Dev</option>
                    <option value="Strategy">Strategy</option>
                  </select>
                  <button type="submit" className="bg-[#D2F5E3] border border-slate-900 rounded-lg p-1 hover:bg-emerald-100">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Task Checklist */}
            <div className="space-y-3">
              {tasks.map((task) => (
                <div 
                  key={task.id}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl border-2 border-slate-900 transition-all ${
                    task.completed ? "bg-slate-50 border-slate-300 opacity-70" : "bg-[#FDFDFD]"
                  }`}
                >
                  <div className="flex gap-3 items-center">
                    <button 
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-6 h-6 border-2 border-slate-900 rounded-md flex items-center justify-center transition-all ${
                        task.completed ? "bg-emerald-400" : "bg-white"
                      }`}
                    >
                      {task.completed && <Check className="w-4 h-4 text-slate-950 font-black" />}
                    </button>
                    <div>
                      <p className={`text-sm font-bold text-slate-900 ${task.completed ? "line-through text-slate-400" : ""}`}>
                        {task.title}
                      </p>
                      <div className="flex gap-2 items-center mt-1">
                        <span className="text-[10px] font-black uppercase bg-[#EEF2FF] border border-slate-400 px-1.5 py-0.2 rounded">
                          {task.category}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.2 rounded border ${
                          task.priority === "High" ? "bg-rose-50 border-rose-300 text-rose-700" :
                          task.priority === "Medium" ? "bg-amber-50 border-amber-300 text-amber-700" :
                          "bg-slate-50 border-slate-300 text-slate-600"
                        }`}>
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-2 sm:mt-0 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{task.deadline}</span>
                    </div>
                    
                    {!task.completed && (
                      <button 
                        onClick={() => {
                          setBlockerAlert({
                            id: Date.now().toString(),
                            description: `Blocker reported on: ${task.title}. Needs immediate asset review.`,
                            timestamp: "Just now"
                          });
                        }}
                        className="bg-rose-100 hover:bg-rose-200 border border-rose-900 text-rose-700 rounded-lg px-2 py-0.5 text-[10px] font-black"
                      >
                        Flag Blocker
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* RIGHT PANEL (4 Columns) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* A. Quick Access Cards */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-lg font-black text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
              Creative Vault Quick Links
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href="#templates" 
                className="bg-[#FFD2E8] border-2 border-slate-900 rounded-xl p-3.5 shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all flex flex-col justify-between min-h-[90px]"
              >
                <BookOpen className="w-6 h-6 text-pink-700" />
                <span className="text-xs font-black text-slate-900 mt-2">Brand Books & Styleguides</span>
              </a>
              <a 
                href="#moodboard" 
                className="bg-[#D8D8FF] border-2 border-slate-900 rounded-xl p-3.5 shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all flex flex-col justify-between min-h-[90px]"
              >
                <Sparkles className="w-6 h-6 text-indigo-700" />
                <span className="text-xs font-black text-slate-900 mt-2">Agency Moodboard</span>
              </a>
              <a 
                href="#assets" 
                className="bg-[#D2F5E3] border-2 border-slate-900 rounded-xl p-3.5 shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all flex flex-col justify-between min-h-[90px]"
              >
                <FolderPlus className="w-6 h-6 text-emerald-700" />
                <span className="text-xs font-black text-slate-900 mt-2">Asset Uploader</span>
              </a>
              <div 
                className="bg-[#FFF0D4] border-2 border-slate-900 rounded-xl p-3.5 shadow-[3px_3px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#0f172a] transition-all flex flex-col justify-between min-h-[90px]"
              >
                <Terminal className="w-6 h-6 text-amber-700" />
                <span className="text-xs font-black text-slate-900 mt-2">API Documentation</span>
              </div>
            </div>
          </section>

          {/* B. Blocker Alert Raising Panel */}
          <section className="bg-[#FFF0D4] border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-1.5">
              <span>Flag a Blocker</span>
            </h3>
            <p className="text-xs text-slate-600 font-bold mb-3">
              Need assistance? Submitting a blocker places it on the Team board instantly so peers or managers can step in.
            </p>
            <form onSubmit={handleRaiseBlocker} className="space-y-3">
              <textarea 
                placeholder="What is holding you up? (e.g. Waiting for copywriter assets, API down...)"
                value={newBlockerInput}
                onChange={(e) => setNewBlockerInput(e.target.value)}
                className="w-full bg-white border-2 border-slate-900 rounded-xl p-2.5 text-xs font-bold focus:outline-none"
                rows={2}
                required
              />
              <button 
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-600 border-2 border-slate-900 text-white py-2 text-xs font-black rounded-xl shadow-[3px_3px_0px_#0f172a] transition-all"
              >
                Publish Blocker Flag 🚨
              </button>
            </form>
          </section>

          {/* C. Kudos sticker dispatcher (Playful Y2K element) */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-md font-black text-slate-900 mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Send Kudos Sticker</span>
            </h3>
            <form onSubmit={handleSendKudos} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-0.5">Teammate</label>
                  <select 
                    value={kudosRecipient} 
                    onChange={(e) => setKudosRecipient(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-900 rounded-lg p-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="Sarah">Sarah (Design)</option>
                    <option value="David">David (Copywriter)</option>
                    <option value="Marcus">Marcus (Design Lead)</option>
                    <option value="Jessica">Jessica (CSM)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase mb-0.5">Sticker</label>
                  <select 
                    value={kudosSticker} 
                    onChange={(e) => setKudosSticker(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-900 rounded-lg p-1.5 text-xs font-bold focus:outline-none"
                  >
                    <option value="👑 Pixel Perfect">👑 Pixel Perfect</option>
                    <option value="🔥 Blocker Slayer">🔥 Blocker Slayer</option>
                    <option value="⚡ Bug Crusher">⚡ Bug Crusher</option>
                    <option value="💡 Brainstormer">💡 Brainstormer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-0.5">Appreciation Note</label>
                <input 
                  type="text" 
                  placeholder="You crushed that layout update!" 
                  value={kudosMsg}
                  onChange={(e) => setKudosMsg(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-900 rounded-lg p-2 text-xs font-bold focus:outline-none"
                  required
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-[#FFD2E8] border-2 border-slate-900 hover:bg-pink-100 text-slate-900 py-1.5 text-xs font-black rounded-xl shadow-[2px_2px_0px_#0f172a] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[3px_3px_0px_#0f172a] transition-all"
              >
                Award Sticker ✨
              </button>
            </form>
          </section>

          {/* D. Recent Achievements */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-lg font-black text-slate-900 mb-4 border-b-2 border-slate-900 pb-2 flex items-center gap-1.5">
              <Award className="w-5 h-5 text-indigo-600" />
              <span>Weekly Achievements</span>
            </h3>
            <div className="space-y-3">
              {achievements.map((ach) => (
                <div key={ach.id} className={`flex gap-3 items-center p-2.5 rounded-xl border-2 border-slate-900 ${ach.color}`}>
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{ach.title}</h4>
                    <p className="text-[10px] font-bold text-slate-500">{ach.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* E. Recent Activity Feed Preview */}
          <section className="bg-white border-4 border-slate-900 rounded-2xl p-5 shadow-[6px_6px_0px_#0f172a]">
            <h3 className="text-lg font-black text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
              Recent Activity Feed
            </h3>
            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-2 items-center">
                      <span className="text-lg">{act.avatar}</span>
                      <div>
                        <span className="text-xs font-black text-slate-800">{act.user}</span>
                        <p className="text-[10px] font-bold text-slate-500">{act.action}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{act.time}</span>
                  </div>
                  {act.sticker && (
                    <span className="inline-block bg-pink-50 border border-pink-300 text-pink-700 text-[10px] font-black px-2 py-0.5 rounded mt-1.5">
                      {act.sticker}
                    </span>
                  )}
                  {act.detail && (
                    <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 mt-1.5 italic font-medium">
                      "{act.detail}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
