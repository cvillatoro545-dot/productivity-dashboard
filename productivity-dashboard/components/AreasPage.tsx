"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Check, ChevronRight, ChevronDown, Target, Folder, CheckSquare } from "lucide-react";
import FinanceArea from "./FinanceArea";
import HealthArea from "./HealthArea";

const AREAS = [
  { key: "Finance",       color: "#D4A853", emoji: "💰" },
  { key: "Health",        color: "#C4614A", emoji: "💪" },
  { key: "Career",        color: "#5B7FA6", emoji: "🎯" },
  { key: "Business",      color: "#7A9E7E", emoji: "🏢" },
  { key: "Relationships", color: "#9B6B9E", emoji: "🤝" },
  { key: "Growth",        color: "#C4845A", emoji: "🌱" },
  { key: "Experiences",   color: "#6B9E9E", emoji: "✈️" },
];

interface Goal {
  id: number; title: string; area: string; year: number; quarter: string;
  status: string; description: string; color: string;
}
interface Project {
  id: number; title: string; goal_id: number; area: string;
  status: string; description: string; goal_title: string;
}

function GoalHierarchy({ area }: { area: string }) {
  const [data, setData] = useState<{ goals: Goal[]; projects: Project[] }>({ goals: [], projects: [] });
  const [expanded, setExpanded] = useState<number[]>([]);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddProject, setShowAddProject] = useState<number | null>(null);
  const [newGoal, setNewGoal] = useState({ title: "", description: "", quarter: "" });
  const [newProject, setNewProject] = useState({ title: "", description: "" });
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/goals_v2?area=${area}&year=${currentYear}`)
      .then((r) => r.ok && r.json())
      .then(setData)
      .catch(() => {});
  }, [area]);

  async function addGoal() {
    if (!newGoal.title.trim()) return;
    const res = await fetch("/api/goals_v2", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "goal", title: newGoal.title, area, year: currentYear, description: newGoal.description, quarter: newGoal.quarter || null }),
    });
    if (res.ok) {
      const goal = await res.json();
      setData((d) => ({ ...d, goals: [...d.goals, goal] }));
      setNewGoal({ title: "", description: "", quarter: "" });
      setShowAddGoal(false);
    }
  }

  async function addProject(goalId: number) {
    if (!newProject.title.trim()) return;
    const res = await fetch("/api/goals_v2", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "project", title: newProject.title, goal_id: goalId, area, description: newProject.description }),
    });
    if (res.ok) {
      const project = await res.json();
      setData((d) => ({ ...d, projects: [...d.projects, { ...project, goal_title: "" }] }));
      setNewProject({ title: "", description: "" });
      setShowAddProject(null);
    }
  }

  async function toggleGoalStatus(goal: Goal) {
    const newStatus = goal.status === "completed" ? "active" : "completed";
    await fetch(`/api/goals_v2/${goal.id}?type=goal`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "goal", status: newStatus }),
    });
    setData((d) => ({ ...d, goals: d.goals.map((g) => g.id === goal.id ? { ...g, status: newStatus } : g) }));
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/goals_v2/${id}?type=goal`, { method: "DELETE" });
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id), projects: d.projects.filter((p) => p.goal_id !== id) }));
  }

  async function deleteProject(id: number) {
    await fetch(`/api/goals_v2/${id}?type=project`, { method: "DELETE" });
    setData((d) => ({ ...d, projects: d.projects.filter((p) => p.id !== id) }));
  }

  const areaInfo = AREAS.find((a) => a.key === area)!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>
          {currentYear} Goals
        </p>
        <button onClick={() => setShowAddGoal(!showAddGoal)}
          className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1 transition-all"
          style={{ background: areaInfo.color + "20", color: areaInfo.color }}>
          <Plus size={12} /> Add Goal
        </button>
      </div>

      {showAddGoal && (
        <div className="card p-4 animate-scale-in space-y-2" style={{ borderLeft: `3px solid ${areaInfo.color}` }}>
          <input placeholder="Goal title..." value={newGoal.title} onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
            className="w-full bg-transparent border-b pb-1.5 text-sm focus:outline-none focus:border-amber-accent"
            style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
          <input placeholder="Description (optional)" value={newGoal.description} onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
            className="w-full bg-transparent text-xs focus:outline-none opacity-60" style={{ color: "var(--ink)" }} />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowAddGoal(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
            <button onClick={addGoal} className="text-xs px-4 py-1.5 font-medium rounded-lg text-white transition-colors"
              style={{ background: areaInfo.color }}>Add Goal</button>
          </div>
        </div>
      )}

      {data.goals.length === 0 && !showAddGoal ? (
        <p className="text-sm font-mono opacity-25 py-3" style={{ color: "var(--ink)" }}>No goals yet for this area.</p>
      ) : (
        <div className="space-y-2">
          {data.goals.map((goal) => {
            const goalProjects = data.projects.filter((p) => p.goal_id === goal.id);
            const isExpanded = expanded.includes(goal.id);
            const isDone = goal.status === "completed";

            return (
              <div key={goal.id} className="space-y-1">
                <div className="flex items-start gap-2 group p-3 rounded-xl transition-all"
                  style={{ background: "var(--bg-muted)", borderLeft: `3px solid ${isDone ? "#7A9E7E" : areaInfo.color}` }}>
                  <button onClick={() => toggleGoalStatus(goal)}
                    className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={{ borderColor: isDone ? "#7A9E7E" : areaInfo.color, background: isDone ? "#7A9E7E" : "transparent" }}>
                    {isDone && <Check size={10} strokeWidth={3} className="text-white" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`text-sm font-medium ${isDone ? "line-through opacity-40" : ""}`} style={{ color: "var(--ink)" }}>{goal.title}</p>
                        {goal.description && <p className="text-xs opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>{goal.description}</p>}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={() => setExpanded((e) => isExpanded ? e.filter((id) => id !== goal.id) : [...e, goal.id])}
                          className="p-1 opacity-50 hover:opacity-100 transition-opacity" style={{ color: "var(--ink)" }}>
                          {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                        <button onClick={() => deleteGoal(goal.id)} className="p-1 text-rust opacity-50 hover:opacity-100 transition-opacity">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* Projects */}
                    {isExpanded && (
                      <div className="mt-3 space-y-1.5 pl-2">
                        {goalProjects.map((project) => (
                          <div key={project.id} className="flex items-center gap-2 group/proj p-2 rounded-lg"
                            style={{ background: "var(--bg-soft)" }}>
                            <Folder size={12} className="flex-shrink-0 opacity-40" style={{ color: areaInfo.color }} />
                            <span className="text-xs flex-1" style={{ color: "var(--ink)" }}>{project.title}</span>
                            <button onClick={() => deleteProject(project.id)}
                              className="opacity-0 group-hover/proj:opacity-100 p-0.5 text-rust transition-opacity">
                              <Trash2 size={10} />
                            </button>
                          </div>
                        ))}

                        {showAddProject === goal.id ? (
                          <div className="flex gap-1.5 animate-scale-in">
                            <input autoFocus placeholder="Project name..." value={newProject.title}
                              onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                              onKeyDown={(e) => { if (e.key === "Enter") addProject(goal.id); if (e.key === "Escape") setShowAddProject(null); }}
                              className="flex-1 text-xs bg-transparent border-b pb-0.5 focus:outline-none"
                              style={{ borderColor: areaInfo.color, color: "var(--ink)" }} />
                            <button onClick={() => addProject(goal.id)}
                              className="text-[10px] px-2 py-0.5 rounded font-medium text-white" style={{ background: areaInfo.color }}>+</button>
                          </div>
                        ) : (
                          <button onClick={() => setShowAddProject(goal.id)}
                            className="text-[10px] font-mono opacity-30 hover:opacity-60 transition-opacity flex items-center gap-1"
                            style={{ color: "var(--ink)" }}>
                            <Plus size={10} /> Add project
                          </button>
                        )}
                      </div>
                    )}

                    {goalProjects.length > 0 && !isExpanded && (
                      <button onClick={() => setExpanded((e) => [...e, goal.id])}
                        className="text-[10px] font-mono opacity-30 hover:opacity-60 mt-1 transition-opacity"
                        style={{ color: "var(--ink)" }}>
                        {goalProjects.length} project{goalProjects.length > 1 ? "s" : ""}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function AreasPage() {
  const [activeArea, setActiveArea] = useState("Finance");

  const areaInfo = AREAS.find((a) => a.key === activeArea)!;

  return (
    <div className="space-y-6">
      {/* Area Selector */}
      <div>
        <h2 className="font-display text-2xl mb-1" style={{ color: "var(--ink)" }}>Areas</h2>
        <p className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>Life domains · Goals · Projects</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {AREAS.map((area) => (
          <button key={area.key} onClick={() => setActiveArea(area.key)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all"
            style={{
              background: activeArea === area.key ? area.color : "var(--bg-muted)",
              color: activeArea === area.key ? "white" : "var(--ink)",
              opacity: activeArea === area.key ? 1 : 0.6,
            }}>
            <span>{area.emoji}</span>
            {area.key}
          </button>
        ))}
      </div>

      <div className="ornament-divider opacity-15"><span>◆</span></div>

      {/* Area Content */}
      {activeArea === "Finance" && (
        <div className="space-y-6">
          <FinanceArea />
          <GoalHierarchy area="Finance" />
        </div>
      )}
      {activeArea === "Health" && (
        <div className="space-y-6">
          <HealthArea />
          <GoalHierarchy area="Health" />
        </div>
      )}
      {!["Finance", "Health"].includes(activeArea) && (
        <div className="space-y-6">
          <div className="card p-8 text-center space-y-3">
            <div className="text-4xl">{areaInfo.emoji}</div>
            <p className="font-display text-xl" style={{ color: "var(--ink)" }}>{activeArea}</p>
            <p className="text-sm font-mono opacity-40" style={{ color: "var(--ink)" }}>
              Full {activeArea} dashboard coming in Phase 3
            </p>
          </div>
          <GoalHierarchy area={activeArea} />
        </div>
      )}
    </div>
  );
}
