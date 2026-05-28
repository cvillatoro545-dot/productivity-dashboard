"use client";

import { useState, useEffect } from "react";
import { format, startOfWeek, subWeeks } from "date-fns";
import { Plus, Trash2, Check, ChevronLeft, ChevronRight, CreditCard, Trophy, Lightbulb, Target } from "lucide-react";
import { CreditCard as CreditCardType, QuarterlyGoal, Achievement, ParkingLotItem } from "@/lib/types";
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer } from "recharts";

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

function parseQuarter(key: string): { year: number; q: number } {
  const [year, q] = key.split("-Q");
  return { year: parseInt(year), q: parseInt(q) };
}

function shiftQuarter(key: string, delta: number): string {
  let { year, q } = parseQuarter(key);
  q += delta;
  while (q > 4) { q -= 4; year++; }
  while (q < 1) { q += 4; year--; }
  return `${year}-Q${q}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  Finance: "#D4A853",
  Health: "#7A9E7E",
  Business: "#5B7FA6",
  Personal: "#9B6B9E",
};

const CARD_COLORS = ["#D4A853","#C4614A","#7A9E7E","#5B7FA6","#9B6B9E","#C4845A"];

// ── Credit Cards Section ──────────────────────────────────────────────────────

function CreditCardsSection({ cards, onAdd, onUpdate, onDelete }: {
  cards: CreditCardType[];
  onAdd: (card: Partial<CreditCardType>) => void;
  onUpdate: (id: number, data: Partial<CreditCardType>) => void;
  onDelete: (id: number) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCard, setNewCard] = useState({ name: "", balance: "", credit_limit: "", color: "#D4A853" });
  const [editing, setEditing] = useState<number | null>(null);
  const [editBalance, setEditBalance] = useState("");

  const totalBalance = cards.reduce((s, c) => s + Number(c.balance), 0);
  const totalLimit = cards.reduce((s, c) => s + Number(c.credit_limit), 0);
  const utilization = totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : 0;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-amber-accent" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Credit Cards</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
          style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={12} /> Add Card
        </button>
      </div>

      {showAdd && (
        <div className="space-y-2 p-3 rounded-xl animate-scale-in" style={{ background: "var(--bg-muted)" }}>
          <input placeholder="Card name (e.g. Chase Freedom)" value={newCard.name} onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
            className="w-full bg-transparent text-sm pb-1 border-b focus:outline-none" style={{ borderColor: "var(--border)", color: "var(--ink)" }} />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Current balance ($)" value={newCard.balance} onChange={(e) => setNewCard({ ...newCard, balance: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            <input type="number" placeholder="Credit limit ($)" value={newCard.credit_limit} onChange={(e) => setNewCard({ ...newCard, credit_limit: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          </div>
          <div className="flex gap-1.5">
            {CARD_COLORS.map((c) => (
              <button key={c} onClick={() => setNewCard({ ...newCard, color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${newCard.color === c ? "scale-125" : "border-transparent"}`}
                style={{ background: c, borderColor: newCard.color === c ? "var(--ink)" : "transparent" }} />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
            <button onClick={() => { onAdd({ name: newCard.name, balance: parseFloat(newCard.balance) || 0, credit_limit: parseFloat(newCard.credit_limit) || 0, color: newCard.color }); setNewCard({ name: "", balance: "", credit_limit: "", color: "#D4A853" }); setShowAdd(false); }}
              className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors">
              Add
            </button>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="p-3 rounded-xl flex items-center justify-between" style={{ background: "var(--bg-muted)" }}>
          <div>
            <div className="text-2xl font-display text-rust">${totalBalance.toLocaleString()}</div>
            <div className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>total balance</div>
          </div>
          <div className="text-right">
            <div className="text-lg font-display" style={{ color: utilization > 30 ? "#C4614A" : "#7A9E7E" }}>{utilization}%</div>
            <div className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>utilization</div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {cards.map((card) => {
          const paidOff = Math.max(0, Number(card.original_balance) - Number(card.balance));
          const progress = card.original_balance > 0 ? Math.round((paidOff / Number(card.original_balance)) * 100) : 0;
          return (
            <div key={card.id} className="space-y-2 group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: card.color }} />
                  <span className="text-sm font-medium" style={{ color: "var(--ink)" }}>{card.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {editing === card.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs opacity-50" style={{ color: "var(--ink)" }}>$</span>
                      <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)}
                        className="w-20 text-xs rounded px-1.5 py-1 focus:outline-none text-right"
                        style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
                      <button onClick={() => { onUpdate(card.id, { balance: parseFloat(editBalance) || 0 }); setEditing(null); }}
                        className="text-xs px-2 py-1 bg-sage text-white rounded font-medium">✓</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditing(card.id); setEditBalance(String(card.balance)); }}
                      className="text-sm font-display" style={{ color: "var(--ink)" }}>
                      ${Number(card.balance).toLocaleString()}
                    </button>
                  )}
                  <button onClick={() => onDelete(card.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-opacity"><Trash2 size={11} /></button>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100 - (Number(card.balance) / (card.credit_limit || 1)) * 100, 100)}%`, background: card.color }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono opacity-30" style={{ color: "var(--ink)" }}>
                <span>Balance: ${Number(card.balance).toLocaleString()}</span>
                <span>Limit: ${Number(card.credit_limit).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Quarterly Goals Section ───────────────────────────────────────────────────

function GoalsSection({ goals, quarterKey, onAdd, onToggle, onDelete }: {
  goals: QuarterlyGoal[];
  quarterKey: string;
  onAdd: (category: string, text: string) => void;
  onToggle: (id: number, completed: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [showAdd, setShowAdd] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const categories = ["Finance", "Health", "Business", "Personal"];

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Target size={14} className="text-sage" />
        <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Quarterly Goals</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {categories.map((cat) => {
          const catGoals = goals.filter((g) => g.category === cat);
          const done = catGoals.filter((g) => g.completed).length;
          return (
            <div key={cat} className="p-3 rounded-xl space-y-2" style={{ background: "var(--bg-muted)", borderLeft: `3px solid ${CATEGORY_COLORS[cat]}` }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider" style={{ color: CATEGORY_COLORS[cat] }}>{cat}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{done}/{catGoals.length}</span>
                  <button onClick={() => setShowAdd(showAdd === cat ? null : cat)}
                    className="w-5 h-5 rounded flex items-center justify-center text-xs hover:opacity-70 transition-opacity"
                    style={{ background: CATEGORY_COLORS[cat] + "30", color: CATEGORY_COLORS[cat] }}>+</button>
                </div>
              </div>

              {showAdd === cat && (
                <div className="flex gap-1.5 animate-scale-in">
                  <input autoFocus placeholder="New goal..." value={newText} onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && newText.trim()) { onAdd(cat, newText); setNewText(""); setShowAdd(null); }}}
                    className="flex-1 text-xs bg-transparent border-b focus:outline-none pb-0.5"
                    style={{ borderColor: CATEGORY_COLORS[cat], color: "var(--ink)" }} />
                  <button onClick={() => { if (newText.trim()) { onAdd(cat, newText); setNewText(""); setShowAdd(null); }}}
                    className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: CATEGORY_COLORS[cat], color: "white" }}>Add</button>
                </div>
              )}

              <div className="space-y-1.5">
                {catGoals.map((goal) => (
                  <div key={goal.id} className="flex items-start gap-2 group">
                    <button onClick={() => onToggle(goal.id, !goal.completed)}
                      className={`mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all`}
                      style={{ background: goal.completed ? CATEGORY_COLORS[cat] : "transparent", borderColor: CATEGORY_COLORS[cat] }}>
                      {goal.completed && <Check size={9} strokeWidth={3} className="text-white" />}
                    </button>
                    <span className={`text-xs flex-1 leading-snug ${goal.completed ? "line-through opacity-40" : ""}`} style={{ color: "var(--ink)" }}>
                      {goal.text}
                    </span>
                    <button onClick={() => onDelete(goal.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-rust transition-opacity flex-shrink-0">
                      <Trash2 size={9} />
                    </button>
                  </div>
                ))}
                {catGoals.length === 0 && <p className="text-[10px] font-mono opacity-25 italic" style={{ color: "var(--ink)" }}>No goals yet</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Gym Chart ─────────────────────────────────────────────────────────────────

function GymConsistencyChart({ gymData }: { gymData: { week_start: string; count: number }[] }) {
  const chartData = gymData.map((d) => ({
    week: format(new Date(d.week_start), "M/d"),
    workouts: Number(d.count),
  }));

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Gym Consistency</h3>
        <span className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>Last 13 weeks</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
          <XAxis dataKey="week" tick={{ fontSize: 9, fill: "var(--ink)", opacity: 0.4, fontFamily: "var(--font-mono)" }} axisLine={false} tickLine={false} />
          <Tooltip formatter={(v) => [`${v} workouts`, ""]} contentStyle={{ background: "var(--bg-soft)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink)" }} />
          <Bar dataKey="workouts" fill="#C4614A" radius={[3, 3, 0, 0]} opacity={0.85} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Achievements + Parking Lot ────────────────────────────────────────────────

function AchievementsSection({ achievements, quarterKey, onAdd, onDelete }: {
  achievements: Achievement[]; quarterKey: string;
  onAdd: (text: string) => void; onDelete: (id: number) => void;
}) {
  const [text, setText] = useState("");
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Trophy size={14} className="text-amber-accent" />
        <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Achievements</h3>
      </div>
      <div className="flex gap-2">
        <input placeholder="Log a win..." value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onAdd(text); setText(""); }}}
          className="flex-1 text-sm bg-transparent border-b pb-1 focus:outline-none focus:border-amber-accent transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--ink)" }} />
        <button onClick={() => { if (text.trim()) { onAdd(text); setText(""); }}}
          className="text-xs px-3 py-1 bg-amber-accent text-ink rounded-lg font-medium hover:bg-amber-warm transition-colors">Add</button>
      </div>
      <div className="space-y-2">
        {achievements.map((a) => (
          <div key={a.id} className="flex items-start gap-2 group p-2 rounded-lg" style={{ background: "var(--bg-muted)" }}>
            <span className="text-amber-accent mt-0.5 flex-shrink-0">✦</span>
            <span className="text-sm flex-1" style={{ color: "var(--ink)" }}>{a.text}</span>
            <button onClick={() => onDelete(a.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-opacity"><Trash2 size={11} /></button>
          </div>
        ))}
        {achievements.length === 0 && <p className="text-xs font-mono opacity-30 italic" style={{ color: "var(--ink)" }}>No achievements logged yet</p>}
      </div>
    </div>
  );
}

function ParkingLotSection({ items, onAdd, onToggle, onDelete }: {
  items: ParkingLotItem[];
  onAdd: (text: string) => void;
  onToggle: (id: number, done: boolean) => void;
  onDelete: (id: number) => void;
}) {
  const [text, setText] = useState("");
  const active = items.filter((i) => !i.done);
  const done = items.filter((i) => i.done);
  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Lightbulb size={14} className="text-sage" />
        <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Parking Lot</h3>
        <span className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>ideas to revisit</span>
      </div>
      <div className="flex gap-2">
        <input placeholder="Capture an idea..." value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onAdd(text); setText(""); }}}
          className="flex-1 text-sm bg-transparent border-b pb-1 focus:outline-none focus:border-sage transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--ink)" }} />
        <button onClick={() => { if (text.trim()) { onAdd(text); setText(""); }}}
          className="text-xs px-3 py-1 bg-sage text-white rounded-lg font-medium hover:bg-sage-dark transition-colors">Add</button>
      </div>
      <div className="space-y-1.5">
        {active.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group p-2 rounded-lg" style={{ background: "var(--bg-muted)" }}>
            <button onClick={() => onToggle(item.id, true)} className="w-4 h-4 rounded border flex-shrink-0 hover:border-sage transition-colors" style={{ borderColor: "var(--border)" }} />
            <span className="text-sm flex-1" style={{ color: "var(--ink)" }}>{item.text}</span>
            <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-opacity"><Trash2 size={11} /></button>
          </div>
        ))}
        {done.map((item) => (
          <div key={item.id} className="flex items-center gap-2 group p-2 rounded-lg opacity-35">
            <Check size={14} className="text-sage flex-shrink-0" />
            <span className="text-sm line-through flex-1" style={{ color: "var(--ink)" }}>{item.text}</span>
            <button onClick={() => onDelete(item.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-opacity"><Trash2 size={11} /></button>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs font-mono opacity-30 italic" style={{ color: "var(--ink)" }}>No ideas yet</p>}
      </div>
    </div>
  );
}

// ── Main QuarterView ──────────────────────────────────────────────────────────

export default function QuarterView() {
  const [quarterKey, setQuarterKey] = useState(getCurrentQuarter());
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isCurrentQ = quarterKey === getCurrentQuarter();

  const fetchData = async () => {
    setLoading(true);
    const res = await fetch(`/api/quarter?q=${quarterKey}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [quarterKey]);

  async function post(type: string, payload: object) {
    await fetch("/api/quarter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, ...payload }) });
    fetchData();
  }

  async function patch(type: string, id: number, payload: object) {
    await fetch("/api/quarter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id, ...payload }) });
    fetchData();
  }

  async function del(type: string, id: number) {
    await fetch(`/api/quarter?type=${type}&id=${id}`, { method: "DELETE" });
    fetchData();
  }

  const { year, q } = parseQuarter(quarterKey);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Quarter Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setQuarterKey(shiftQuarter(quarterKey, -1))} className="p-2 rounded-lg hover:opacity-70 transition-opacity" style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <ChevronLeft size={16} />
          </button>
          <div>
            <h2 className="font-display text-2xl" style={{ color: "var(--ink)" }}>
              Q{q} {year} {isCurrentQ && <span className="text-amber-accent text-sm font-sans ml-1">current</span>}
            </h2>
            <p className="text-xs font-mono opacity-40" style={{ color: "var(--ink)" }}>
              {["Jan–Mar", "Apr–Jun", "Jul–Sep", "Oct–Dec"][q - 1]}
            </p>
          </div>
          <button onClick={() => setQuarterKey(shiftQuarter(quarterKey, 1))} className="p-2 rounded-lg hover:opacity-70 transition-opacity" style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <ChevronRight size={16} />
          </button>
        </div>
        {!isCurrentQ && (
          <button onClick={() => setQuarterKey(getCurrentQuarter())} className="text-xs font-mono px-3 py-1.5 rounded-lg opacity-60 hover:opacity-100 transition-opacity" style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            Current Quarter
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <CreditCardsSection
            cards={data?.cards || []}
            onAdd={(card) => post("card", card)}
            onUpdate={(id, d) => patch("card", id, d)}
            onDelete={(id) => del("card", id)}
          />
          <GymConsistencyChart gymData={data?.gymData || []} />
          <AchievementsSection
            achievements={data?.achievements || []}
            quarterKey={quarterKey}
            onAdd={(text) => post("achievement", { quarter_key: quarterKey, text })}
            onDelete={(id) => del("achievement", id)}
          />
        </div>
        <div className="space-y-5">
          <GoalsSection
            goals={data?.goals || []}
            quarterKey={quarterKey}
            onAdd={(category, text) => post("goal", { quarter_key: quarterKey, category, text })}
            onToggle={(id, completed) => patch("goal", id, { completed })}
            onDelete={(id) => del("goal", id)}
          />
          <ParkingLotSection
            items={data?.parking || []}
            onAdd={(text) => post("parking", { text })}
            onToggle={(id, done) => patch("parking", id, { done })}
            onDelete={(id) => del("parking", id)}
          />
        </div>
      </div>
    </div>
  );
}
