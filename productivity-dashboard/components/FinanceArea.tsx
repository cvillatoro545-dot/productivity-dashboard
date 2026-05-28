"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, TrendingUp, DollarSign, CreditCard, PieChart, Edit2, Check, X } from "lucide-react";
import { format } from "date-fns";

interface FinanceAccount {
  id: number; name: string; account_type: string; subtype: string;
  balance: number; target: number; monthly_contribution: number;
  color: string; institution: string; is_debt: boolean;
}
interface CreditCardData {
  id: number; name: string; balance: number; original_balance: number;
  credit_limit: number; color: string;
}
interface BudgetCategory {
  id: number; name: string; budgeted: number; spent: number; month: string; color: string;
}

const ACCOUNT_COLORS = ["#D4A853","#7A9E7E","#5B7FA6","#9B6B9E","#C4614A","#C4845A","#6B9E9E"];
const BUDGET_COLORS = ["#D4A853","#7A9E7E","#5B7FA6","#9B6B9E","#C4614A","#C4845A"];

function NetWorthCard({ summary }: { summary: any }) {
  if (!summary) return null;
  const { netWorth, totalAssets, totalDebt } = summary;
  const isPositive = netWorth >= 0;

  return (
    <div className="card p-6 space-y-4" style={{ borderTop: `3px solid ${isPositive ? "#7A9E7E" : "#C4614A"}` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>Net Worth</p>
          <div className={`font-display text-4xl mt-1 ${isPositive ? "text-sage" : "text-rust"}`}>
            {netWorth < 0 ? "-" : ""}${Math.abs(netWorth).toLocaleString()}
          </div>
        </div>
        <TrendingUp size={24} className={isPositive ? "text-sage" : "text-rust"} style={{ opacity: 0.5 }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
          <p className="text-[10px] font-mono uppercase tracking-wider opacity-40 mb-1" style={{ color: "var(--ink)" }}>Total Assets</p>
          <p className="font-display text-xl text-sage">${totalAssets.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
          <p className="text-[10px] font-mono uppercase tracking-wider opacity-40 mb-1" style={{ color: "var(--ink)" }}>Total Debt</p>
          <p className="font-display text-xl text-rust">${totalDebt.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

function AccountsSection({ accounts, onAdd, onUpdate, onDelete, onSnapshot }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [newAccount, setNewAccount] = useState({
    name: "", account_type: "investment", subtype: "", balance: "",
    target: "", monthly_contribution: "", color: "#D4A853", institution: "",
  });

  const investments = accounts.filter((a: FinanceAccount) => a.account_type === "investment");
  const savings = accounts.filter((a: FinanceAccount) => a.account_type === "savings");

  function AccountCard({ account }: { account: FinanceAccount }) {
    const progress = account.target ? Math.min((account.balance / account.target) * 100, 100) : null;
    const currentMonth = new Date().toISOString().slice(0, 7);
    const monthlyContributed = 0; // Would need snapshots to calculate

    return (
      <div className="p-4 rounded-xl space-y-3 group" style={{ background: "var(--bg-muted)", borderLeft: `3px solid ${account.color}` }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--ink)" }}>{account.name}</p>
            {account.institution && <p className="text-[10px] font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>{account.institution}</p>}
          </div>
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => { setEditId(account.id); setEditBalance(String(account.balance)); }}
              className="p-1 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>
              <Edit2 size={12} />
            </button>
            <button onClick={() => onDelete(account.id)} className="p-1 text-rust opacity-50 hover:opacity-100">
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {editId === account.id ? (
          <div className="flex gap-2">
            <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)}
              className="flex-1 text-sm rounded-lg px-3 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            <button onClick={() => { onSnapshot(account.id, parseFloat(editBalance)); setEditId(null); }}
              className="p-1.5 bg-sage text-white rounded-lg"><Check size={13} /></button>
            <button onClick={() => setEditId(null)} className="p-1.5 rounded-lg opacity-50" style={{ color: "var(--ink)" }}>
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="flex items-end justify-between">
            <div>
              <p className="font-display text-2xl" style={{ color: account.color }}>${Number(account.balance).toLocaleString()}</p>
              {account.target && (
                <p className="text-[10px] font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>
                  of ${Number(account.target).toLocaleString()} goal
                </p>
              )}
            </div>
            {account.monthly_contribution > 0 && (
              <p className="text-xs font-mono opacity-50" style={{ color: "var(--ink)" }}>
                +${Number(account.monthly_contribution).toLocaleString()}/mo
              </p>
            )}
          </div>
        )}

        {progress !== null && (
          <div className="space-y-1">
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-soft)" }}>
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progress}%`, background: account.color }} />
            </div>
            <p className="text-[10px] font-mono opacity-30 text-right" style={{ color: "var(--ink)" }}>{progress.toFixed(0)}%</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Investments */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-amber-accent" />
            <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Investments</h3>
          </div>
          <button onClick={() => { setShowAdd(true); setNewAccount({ ...newAccount, account_type: "investment" }); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
            style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <Plus size={12} /> Add
          </button>
        </div>
        {investments.length === 0 ? (
          <p className="text-sm font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No investment accounts yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {investments.map((a: FinanceAccount) => <AccountCard key={a.id} account={a} />)}
          </div>
        )}
      </div>

      {/* Savings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-sage" />
            <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Savings</h3>
          </div>
          <button onClick={() => { setShowAdd(true); setNewAccount({ ...newAccount, account_type: "savings" }); }}
            className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
            style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
            <Plus size={12} /> Add
          </button>
        </div>
        {savings.length === 0 ? (
          <p className="text-sm font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No savings accounts yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {savings.map((a: FinanceAccount) => <AccountCard key={a.id} account={a} />)}
          </div>
        )}
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="card p-4 animate-scale-in space-y-3">
          <p className="text-xs font-mono uppercase tracking-widest opacity-40" style={{ color: "var(--ink)" }}>Add Account</p>
          <input placeholder="Account name (e.g. Roth IRA)" value={newAccount.name}
            onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
            className="w-full bg-transparent border-b pb-1.5 text-sm focus:outline-none focus:border-amber-accent"
            style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <select value={newAccount.account_type} onChange={(e) => setNewAccount({ ...newAccount, account_type: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }}>
              <option value="investment">Investment</option>
              <option value="savings">Savings</option>
              <option value="checking">Checking</option>
            </select>
            <input placeholder="Institution (optional)" value={newAccount.institution}
              onChange={(e) => setNewAccount({ ...newAccount, institution: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input type="number" placeholder="Current balance" value={newAccount.balance}
              onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            <input type="number" placeholder="Target (optional)" value={newAccount.target}
              onChange={(e) => setNewAccount({ ...newAccount, target: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            <input type="number" placeholder="Monthly +$" value={newAccount.monthly_contribution}
              onChange={(e) => setNewAccount({ ...newAccount, monthly_contribution: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {ACCOUNT_COLORS.map((c) => (
              <button key={c} onClick={() => setNewAccount({ ...newAccount, color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${newAccount.color === c ? "scale-125" : "border-transparent hover:scale-110"}`}
                style={{ background: c, borderColor: newAccount.color === c ? "var(--ink)" : "transparent" }} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
            <button onClick={() => {
              if (newAccount.name.trim()) {
                onAdd({ ...newAccount, balance: parseFloat(newAccount.balance) || 0, target: parseFloat(newAccount.target) || null, monthly_contribution: parseFloat(newAccount.monthly_contribution) || 0 });
                setShowAdd(false);
                setNewAccount({ name: "", account_type: "investment", subtype: "", balance: "", target: "", monthly_contribution: "", color: "#D4A853", institution: "" });
              }
            }} className="text-xs px-4 py-1.5 bg-amber-accent text-ink font-medium rounded-lg hover:bg-amber-warm transition-colors">
              Add Account
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DebtSection({ creditCards, onAdd, onUpdate, onDelete }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [newCard, setNewCard] = useState({ name: "", balance: "", credit_limit: "", color: "#C4614A" });
  const CARD_COLORS = ["#C4614A","#D4A853","#7A9E7E","#5B7FA6","#9B6B9E","#C4845A"];
  const totalDebt = creditCards.reduce((s: number, c: any) => s + Number(c.balance), 0);
  const totalLimit = creditCards.reduce((s: number, c: any) => s + Number(c.credit_limit), 0);
  const utilization = totalLimit > 0 ? Math.round((totalDebt / totalLimit) * 100) : 0;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard size={14} className="text-rust" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Debt</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
          style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <Plus size={12} /> Add Card
        </button>
      </div>

      {creditCards.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
            <p className="text-2xl font-display text-rust">${totalDebt.toLocaleString()}</p>
            <p className="text-[10px] font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>total balance</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
            <p className="text-2xl font-display" style={{ color: utilization > 30 ? "#C4614A" : "#7A9E7E" }}>{utilization}%</p>
            <p className="text-[10px] font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>utilization</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
            <p className="text-2xl font-display" style={{ color: "var(--ink)" }}>{creditCards.length}</p>
            <p className="text-[10px] font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>cards</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="space-y-2 p-3 rounded-xl animate-scale-in" style={{ background: "var(--bg-muted)" }}>
          <input placeholder="Card name" value={newCard.name} onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
            className="w-full bg-transparent border-b pb-1.5 text-sm focus:outline-none" style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Current balance" value={newCard.balance} onChange={(e) => setNewCard({ ...newCard, balance: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            <input type="number" placeholder="Credit limit" value={newCard.credit_limit} onChange={(e) => setNewCard({ ...newCard, credit_limit: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none" style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          </div>
          <div className="flex gap-1.5">
            {CARD_COLORS.map((c) => (
              <button key={c} onClick={() => setNewCard({ ...newCard, color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${newCard.color === c ? "scale-125" : "border-transparent"}`}
                style={{ background: c, borderColor: newCard.color === c ? "var(--ink)" : "transparent" }} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
            <button onClick={() => { if (newCard.name.trim()) { onAdd({ name: newCard.name, balance: parseFloat(newCard.balance) || 0, credit_limit: parseFloat(newCard.credit_limit) || 0, color: newCard.color }); setNewCard({ name: "", balance: "", credit_limit: "", color: "#C4614A" }); setShowAdd(false); }}}
              className="text-xs px-4 py-1.5 bg-rust text-white font-medium rounded-lg hover:bg-rust-dark transition-colors">Add Card</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {creditCards.map((card: CreditCardData) => {
          const pct = card.credit_limit > 0 ? Math.round((card.balance / card.credit_limit) * 100) : 0;
          return (
            <div key={card.id} className="group space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: card.color }} />
                  <span className="text-sm" style={{ color: "var(--ink)" }}>{card.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {editId === card.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)}
                        className="w-20 text-xs rounded px-1.5 py-1 focus:outline-none text-right"
                        style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
                      <button onClick={() => { onUpdate(card.id, { balance: parseFloat(editBalance) || 0 }); setEditId(null); }}
                        className="text-xs px-2 py-1 bg-sage text-white rounded">✓</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditId(card.id); setEditBalance(String(card.balance)); }}
                      className="text-sm font-display" style={{ color: "var(--ink)" }}>
                      ${Number(card.balance).toLocaleString()}
                    </button>
                  )}
                  <button onClick={() => onDelete(card.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-opacity">
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: card.color }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono opacity-30" style={{ color: "var(--ink)" }}>
                <span>{pct}% used</span>
                <span>limit: ${Number(card.credit_limit).toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BudgetSection({ categories, onAdd, onUpdate, onDelete }: any) {
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ name: "", budgeted: "", spent: "", color: "#7A9E7E" });
  const [editId, setEditId] = useState<number | null>(null);
  const [editSpent, setEditSpent] = useState("");
  const currentMonth = format(new Date(), "MMMM yyyy");
  const totalBudgeted = categories.reduce((s: number, c: BudgetCategory) => s + Number(c.budgeted), 0);
  const totalSpent = categories.reduce((s: number, c: BudgetCategory) => s + Number(c.spent), 0);
  const remaining = totalBudgeted - totalSpent;

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart size={14} className="text-sage" />
          <h3 className="font-display text-lg" style={{ color: "var(--ink)" }}>Budget — {currentMonth}</h3>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="text-xs px-3 py-1.5 rounded-lg font-medium flex items-center gap-1"
          style={{ background: "var(--bg-muted)", color: "var(--ink)" }}>
          <Plus size={12} /> Add Category
        </button>
      </div>

      {categories.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
            <p className="font-display text-xl text-amber-accent">${totalBudgeted.toLocaleString()}</p>
            <p className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>budgeted</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
            <p className="font-display text-xl text-rust">${totalSpent.toLocaleString()}</p>
            <p className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>spent</p>
          </div>
          <div className="p-3 rounded-xl text-center" style={{ background: "var(--bg-muted)" }}>
            <p className={`font-display text-xl ${remaining >= 0 ? "text-sage" : "text-rust"}`}>${Math.abs(remaining).toLocaleString()}</p>
            <p className="text-[10px] font-mono opacity-40" style={{ color: "var(--ink)" }}>{remaining >= 0 ? "remaining" : "over budget"}</p>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="space-y-2 p-3 rounded-xl animate-scale-in" style={{ background: "var(--bg-muted)" }}>
          <input placeholder="Category name (e.g. Groceries)" value={newCat.name}
            onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
            className="w-full bg-transparent border-b pb-1.5 text-sm focus:outline-none"
            style={{ borderColor: "var(--border)", color: "var(--ink)" }} autoFocus />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" placeholder="Budget ($)" value={newCat.budgeted}
              onChange={(e) => setNewCat({ ...newCat, budgeted: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
            <input type="number" placeholder="Spent so far ($)" value={newCat.spent}
              onChange={(e) => setNewCat({ ...newCat, spent: e.target.value })}
              className="text-sm rounded-lg px-2 py-1.5 focus:outline-none"
              style={{ background: "var(--bg-soft)", border: "1px solid var(--border)", color: "var(--ink)" }} />
          </div>
          <div className="flex gap-1.5">
            {BUDGET_COLORS.map((c) => (
              <button key={c} onClick={() => setNewCat({ ...newCat, color: c })}
                className={`w-6 h-6 rounded-full border-2 transition-all ${newCat.color === c ? "scale-125" : "border-transparent"}`}
                style={{ background: c, borderColor: newCat.color === c ? "var(--ink)" : "transparent" }} />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 opacity-50 hover:opacity-100" style={{ color: "var(--ink)" }}>Cancel</button>
            <button onClick={() => { if (newCat.name.trim()) { onAdd({ name: newCat.name, budgeted: parseFloat(newCat.budgeted) || 0, spent: parseFloat(newCat.spent) || 0, color: newCat.color }); setNewCat({ name: "", budgeted: "", spent: "", color: "#7A9E7E" }); setShowAdd(false); }}}
              className="text-xs px-4 py-1.5 bg-sage text-white font-medium rounded-lg transition-colors">Add</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {categories.map((cat: BudgetCategory) => {
          const pct = cat.budgeted > 0 ? Math.min((cat.spent / cat.budgeted) * 100, 100) : 0;
          const over = cat.spent > cat.budgeted;
          return (
            <div key={cat.id} className="group space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                  <span className="text-sm" style={{ color: "var(--ink)" }}>{cat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {editId === cat.id ? (
                    <div className="flex items-center gap-1">
                      <input type="number" value={editSpent} onChange={(e) => setEditSpent(e.target.value)}
                        className="w-20 text-xs rounded px-1.5 py-1 focus:outline-none text-right"
                        style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--ink)" }} />
                      <button onClick={() => { onUpdate(cat.id, { spent: parseFloat(editSpent) || 0 }); setEditId(null); }}
                        className="text-xs px-2 py-1 bg-sage text-white rounded">✓</button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditId(cat.id); setEditSpent(String(cat.spent)); }}
                      className={`text-xs font-mono ${over ? "text-rust" : "opacity-60"}`} style={{ color: over ? undefined : "var(--ink)" }}>
                      ${Number(cat.spent).toLocaleString()} / ${Number(cat.budgeted).toLocaleString()}
                    </button>
                  )}
                  <button onClick={() => onDelete(cat.id)} className="opacity-0 group-hover:opacity-100 p-1 text-rust transition-opacity"><Trash2 size={11} /></button>
                </div>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: over ? "#C4614A" : cat.color }} />
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (
          <p className="text-sm font-mono opacity-30 py-2" style={{ color: "var(--ink)" }}>No budget categories yet.</p>
        )}
      </div>
    </div>
  );
}

export default function FinanceArea() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await fetch("/api/areas/finance");
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  async function addAccount(accountData: any) {
    await fetch("/api/areas/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "account", ...accountData }) });
    fetchData();
  }

  async function updateAccount(id: number, updates: any) {
    await fetch("/api/areas/finance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "account", id, ...updates }) });
    fetchData();
  }

  async function snapshotAccount(accountId: number, balance: number) {
    await fetch("/api/areas/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "snapshot", account_id: accountId, balance }) });
    fetchData();
  }

  async function deleteAccount(id: number) {
    await fetch(`/api/areas/finance?type=account&id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function addCreditCard(cardData: any) {
    await fetch("/api/quarter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "card", ...cardData }) });
    fetchData();
  }

  async function updateCreditCard(id: number, updates: any) {
    await fetch("/api/quarter", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "card", id, ...updates }) });
    fetchData();
  }

  async function deleteCreditCard(id: number) {
    await fetch(`/api/quarter?type=card&id=${id}`, { method: "DELETE" });
    fetchData();
  }

  async function addBudget(catData: any) {
    await fetch("/api/areas/finance", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "budget", ...catData }) });
    fetchData();
  }

  async function updateBudget(id: number, updates: any) {
    await fetch("/api/areas/finance", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "budget", id, ...updates }) });
    fetchData();
  }

  async function deleteBudget(id: number) {
    await fetch(`/api/areas/finance?type=budget&id=${id}`, { method: "DELETE" });
    fetchData();
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card h-32 animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl" style={{ color: "var(--ink)" }}>Finance</h2>
        <p className="text-xs font-mono opacity-40 mt-0.5" style={{ color: "var(--ink)" }}>Investments · Savings · Debt · Budget</p>
      </div>
      <NetWorthCard summary={data?.summary} />
      <AccountsSection
        accounts={data?.accounts || []}
        onAdd={addAccount}
        onUpdate={updateAccount}
        onDelete={deleteAccount}
        onSnapshot={snapshotAccount}
      />
      <DebtSection
        creditCards={data?.creditCards || []}
        onAdd={addCreditCard}
        onUpdate={updateCreditCard}
        onDelete={deleteCreditCard}
      />
      <BudgetSection
        categories={data?.budgetCategories || []}
        onAdd={addBudget}
        onUpdate={updateBudget}
        onDelete={deleteBudget}
      />
    </div>
  );
}
