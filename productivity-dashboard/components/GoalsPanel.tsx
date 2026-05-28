"use client";

import { useState, useEffect } from "react";
import { Goal, GymLog } from "@/lib/types";
import { Plus, Trash2, DollarSign, Dumbbell, Target, TrendingUp, ChevronDown } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, subMonths } from "date-fns";

interface GoalsPanelProps {
  onUpdate?: () => void;
}

const ROTH_IRA_ANNUAL_LIMIT = 7000;

function GymCalendar({ logs }: { logs: GymLog[] }) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const loggedDates = logs.map((l) => l.workout_date.split("T")[0]);
  const firstDayOfWeek = startOfMonth(viewMonth).getDay();
  const workoutsThisMonth = days.filter((d) => loggedDates.includes(format(d, "yyyy-MM-dd"))).length;
  const consistencyRate = Math.round((workoutsThisMonth / days.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMonth(subMonths(viewMonth, 1))} className="p-1 rounded hover:opacity-70 transition-opacity text-xs font-mono" style={{ color: "var(--ink)" }}>←</button>
          <span className="text-sm font-mono" style={{ color: "var(--ink)" }}>{format(viewMonth, "MMMM yyyy")}</span>
          <button onClick={() => setViewMonth(new Date())} className="p-1 rounded hover:opacity-70 transition-opacity text-xs font-mono" style={{ color: "var(--ink)" }}>→</button>
        </div>
        <div className="text-xs font-mono text-sage">{workoutsThisMonth} sessions · {consistencyRate}%</div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-mono opacity-30 pb-1" style={{ color: "var(--ink)" }}>{d}</div>
        ))}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isLogged = loggedDates.includes(dateStr);
          const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
          return (
            <div key={dateStr} className={`aspect-square rounded flex items-center justify-center text-[11px] font-mono transition-all ${isLogged ? "text-white font-bold" : isToday ? "border font-bold" : "opacity-40"}`}
              style={{ background: isLogged ? "#7A9E7E" : isToday ? "transparent" : "transparent", borderColor: isToday ? "var(--amber)" : undefined, color: isLogged ? "white" : "var(--ink)" }}>
              {format(day, "d")}
              {isLogged && <span className="absolute text-[8px] -top-0.5 -right-0.5">💪</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RothIRACard({ goal, onLog }: { goal: Goal; onLog: (id: number, amount: number) => void }) {
  const [logAmount, setLogAmount] = useState("");
  const [showLog, setShowLog] = useState(false);
  const annualProgress = Math.min((goal.current_amount / ROTH_IRA_ANNUAL_LIMIT) * 100, 100);
  const monthlyProgress = goal.monthly_target ? Math.min(((goal.monthly_contributed || 0) / goal.monthly_target) * 100, 100) : 0;
  const remaining = ROTH_IRA_ANNUAL_LIMIT - goal.current_amount;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={14} className="text-amber-accent" />
            <span className="text-xs font-mono tracking-widest uppercase opacity-50" style={{ color: "var(--ink)" }}>Roth IRA</span>
          </div>
          <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>{goal.title}</h3>
        </div>
        <button onClick={() => setShowLog(!showLog)} className="text-xs px-3 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors">+ Log</button>
      </div>

      {showLog && (
        <div className="flex gap-2 animate-scale-in">
          <input type="number" placeholder="Amount ($)" value={logAmount} onChange={(e) => setLogAmount(e.target.value)} className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-accent" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          <button onClick={() => { if (logAmount) { onLog(goal.id, parseFloat(logAmount)); setLogAmount(""); setShowLog(false); }}} className="px-4 py-2 bg-amber-accent text-ink text-sm font-medium rounded-lg hover:bg-amber-warm transition-colors">Save</button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-muted)" }}>
          <div className="text-lg font-display text-amber-accent">${goal.current_amount.toLocaleString()}</div>
          <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>contributed</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-muted)" }}>
          <div className="text-lg font-display text-sage">${remaining.toLocaleString()}</div>
          <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>remaining</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-muted)" }}>
          <div className="text-lg font-display" style={{ color: "var(--ink)" }}>${goal.monthly_contributed?.toLocaleString() || 0}</div>
          <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>this month</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="opacity-40" style={{ color: "var(--ink)" }}>Annual ({annualProgress.toFixed(0)}%)</span>
          <span className="text-amber-accent">${goal.current_amount.toLocaleString()} / $7,000</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
          <div className="h-full rounded-full bg-amber-accent transition-all duration-700 relative overflow-hidden" style={{ width: `${annualProgress}%` }}>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
          </div>
        </div>
      </div>

      {goal.monthly_target && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="opacity-40" style={{ color: "var(--ink)" }}>Monthly goal ({monthlyProgress.toFixed(0)}%)</span>
            <span className="text-sage">${goal.monthly_contributed?.toLocaleString() || 0} / ${goal.monthly_target.toLocaleString()}</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
            <div className="h-full rounded-full bg-sage transition-all duration-700" style={{ width: `${monthlyProgress}%` }} />
          </div>
        </div>
      )}
    </div>
  );
}

function EmergencyFundCard({ goal, onLog }: { goal: Goal; onLog: (id: number, amount: number) => void }) {
  const [logAmount, setLogAmount] = useState("");
  const [showLog, setShowLog] = useState(false);
  const progress = goal.target_amount ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
  const months = goal.target_amount ? (goal.current_amount / (goal.target_amount / 6)).toFixed(1) : "0";

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <DollarSign size={14} className="text-sage" />
            <span className="text-xs font-mono tracking-widest uppercase opacity-50" style={{ color: "var(--ink)" }}>Emergency Fund</span>
          </div>
          <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>{goal.title}</h3>
        </div>
        <button onClick={() => setShowLog(!showLog)} className="text-xs px-3 py-1.5 bg-sage text-white font-medium rounded-lg hover:bg-sage-dark transition-colors">+ Add</button>
      </div>

      {showLog && (
        <div className="flex gap-2 animate-scale-in">
          <input type="number" placeholder="Amount ($)" value={logAmount} onChange={(e) => setLogAmount(e.target.value)} className="flex-1 text-sm rounded-lg px-3 py-2 focus:outline-none" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          <button onClick={() => { if (logAmount) { onLog(goal.id, parseFloat(logAmount)); setLogAmount(""); setShowLog(false); }}} className="px-4 py-2 bg-sage text-white text-sm font-medium rounded-lg hover:bg-sage-dark transition-colors">Save</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-muted)" }}>
          <div className="text-xl font-display text-sage">${goal.current_amount.toLocaleString()}</div>
          <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>saved</div>
        </div>
        <div className="text-center p-3 rounded-lg" style={{ background: "var(--bg-muted)" }}>
          <div className="text-xl font-display" style={{ color: "var(--ink)" }}>{months}mo</div>
          <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>of 6 months</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs font-mono">
          <span className="opacity-40" style={{ color: "var(--ink)" }}>Progress ({progress.toFixed(0)}%)</span>
          <span className="text-sage">${goal.current_amount.toLocaleString()} / ${goal.target_amount?.toLocaleString()}</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden relative" style={{ background: "var(--bg-muted)" }}>
          <div className="h-full rounded-full bg-sage transition-all duration-700 flex items-center justify-end pr-2" style={{ width: `${Math.max(progress, 2)}%` }}>
            {progress > 15 && <span className="text-[10px] text-white font-mono">{progress.toFixed(0)}%</span>}
          </div>
          {[1/6, 2/6, 3/6, 4/6, 5/6].map((p, i) => (
            <div key={i} className="absolute top-0 h-full w-px opacity-20" style={{ left: `${p * 100}%`, background: "var(--ink)" }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] font-mono opacity-30" style={{ color: "var(--ink)" }}>
          {["1mo","2mo","3mo","4mo","5mo","6mo"].map((m) => <span key={m}>{m}</span>)}
        </div>
      </div>
    </div>
  );
}

export default function GoalsPanel({ onUpdate }: GoalsPanelProps) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [gymLogs, setGymLogs] = useState<GymLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", category: "financial", goal_type: "roth_ira", target_amount: "", monthly_target: "" });
  const [loggingGym, setLoggingGym] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const [goalsRes, gymRes] = await Promise.all([fetch("/api/goals"), fetch("/api/gym")]);
    if (goalsRes.ok) setGoals(await goalsRes.json());
    if (gymRes.ok) setGymLogs(await gymRes.json());
    setLoading(false);
  }

  async function handleLogGoal(id: number, amount: number) {
    const res = await fetch(`/api/goals/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount }) });
    if (res.ok) fetchData();
  }

  async function handleLogGym() {
    setLoggingGym(true);
    try {
      const res = await fetch("/api/gym", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
      if (res.ok) fetchData();
    } finally { setLoggingGym(false); }
  }

  async function handleCreateGoal(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newGoal, target_amount: parseFloat(newGoal.target_amount) || null, monthly_target: parseFloat(newGoal.monthly_target) || null }) });
    if (res.ok) { fetchData(); setShowForm(false); setNewGoal({ title: "", category: "financial", goal_type: "roth_ira", target_amount: "", monthly_target: "" }); }
  }

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const workedOutToday = gymLogs.some((l) => l.workout_date.split("T")[0] === todayStr);
  const thisMonthWorkouts = gymLogs.filter((l) => l.workout_date.startsWith(format(new Date(), "yyyy-MM"))).length;

  const rothGoals = goals.filter((g) => g.goal_type === "roth_ira");
  const fundGoals = goals.filter((g) => g.goal_type === "emergency_fund");

  if (loading) return <div className="card p-10 text-center"><div className="text-4xl mb-3 opacity-30 animate-pulse">◆</div></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl" style={{ color: "var(--ink)" }}>Goals & Progress</h2>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium" style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={14} /> New Goal
        </button>
      </div>

      {showForm && (
        <div className="card p-4 animate-scale-in">
          <form onSubmit={handleCreateGoal} className="space-y-3">
            <input type="text" placeholder="Goal title..." value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })} className="w-full bg-transparent border-b pb-2 font-display text-lg focus:outline-none focus:border-amber-accent transition-colors" style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
            <div className="grid grid-cols-2 gap-3">
              <select value={newGoal.goal_type} onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })} className="text-sm rounded-lg px-3 py-2 focus:outline-none" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}>
                <option value="roth_ira">Roth IRA</option>
                <option value="emergency_fund">Emergency Fund</option>
                <option value="custom">Custom Goal</option>
              </select>
              <input type="number" placeholder="Target amount ($)" value={newGoal.target_amount} onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })} className="text-sm rounded-lg px-3 py-2 focus:outline-none" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            </div>
            {newGoal.goal_type === "roth_ira" && (
              <input type="number" placeholder="Monthly contribution target ($)" value={newGoal.monthly_target} onChange={(e) => setNewGoal({ ...newGoal, monthly_target: e.target.value })} className="w-full text-sm rounded-lg px-3 py-2 focus:outline-none" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            )}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowForm(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
              <button type="submit" className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors">Create Goal</button>
            </div>
          </form>
        </div>
      )}

      {/* Roth IRA Goals */}
      {rothGoals.map((goal) => <RothIRACard key={goal.id} goal={goal} onLog={handleLogGoal} />)}

      {/* Emergency Fund Goals */}
      {fundGoals.map((goal) => <EmergencyFundCard key={goal.id} goal={goal} onLog={handleLogGoal} />)}

      {/* Gym Consistency */}
      <div className="card p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Dumbbell size={14} className="text-rust" />
              <span className="text-xs font-mono tracking-widest uppercase opacity-50" style={{ color: "var(--ink)" }}>Gym Consistency</span>
            </div>
            <h3 className="font-display text-xl" style={{ color: "var(--ink)" }}>Workout Tracker</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-display text-rust">{thisMonthWorkouts}</div>
              <div className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>this month</div>
            </div>
            <button onClick={handleLogGym} disabled={loggingGym} className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${workedOutToday ? "bg-rust/20 text-rust border border-rust/30" : "bg-rust text-white hover:bg-rust-dark"}`}>
              {workedOutToday ? "✓ Logged" : loggingGym ? "..." : "Log Today"}
            </button>
          </div>
        </div>
        <GymCalendar logs={gymLogs} />
      </div>

      {goals.length === 0 && gymLogs.length === 0 && (
        <div className="text-center py-6">
          <p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>Add your first financial goal above to get started.</p>
        </div>
      )}
    </div>
  );
}
