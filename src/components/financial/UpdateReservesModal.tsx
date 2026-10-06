"use client";

import { useState, useEffect } from "react";
import { updateFinancialReserves, type ReserveUpdates } from "@/lib/financial-profile";
import { ShieldCheck, TrendingUp, PiggyBank, Receipt, X, Check } from "lucide-react";

export type ReserveTab = "savings" | "investment" | "emergency" | "emi";

interface UpdateReservesModalProps {
  uid: string;
  currency: string;
  initialTab?: ReserveTab;
  currentSavings: number;
  currentEmergencyFund: number;
  currentInvestments: number;
  currentEmi: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (appliedUpdates?: ReserveUpdates) => void;
}

export default function UpdateReservesModal({
  uid,
  currency,
  initialTab = "savings",
  currentSavings,
  currentEmergencyFund,
  currentInvestments,
  currentEmi,
  isOpen,
  onClose,
  onSuccess,
}: UpdateReservesModalProps) {
  const [activeTab, setActiveTab] = useState<ReserveTab>(initialTab);
  const [amount, setAmount] = useState<string>("");
  const [mode, setMode] = useState<"topup" | "set">("topup");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
    setAmount("");
    if (initialTab === "emi") {
      setMode("set");
    } else {
      setMode("topup");
    }
  }, [initialTab, isOpen]);

  if (!isOpen) return null;

  const getCurrentVal = () => {
    switch (activeTab) {
      case "savings":
        return Number(currentSavings) || 0;
      case "investment":
        return Number(currentInvestments) || 0;
      case "emergency":
        return Number(currentEmergencyFund) || 0;
      case "emi":
        return Number(currentEmi) || 0;
      default:
        return 0;
    }
  };

  const getTabMeta = () => {
    switch (activeTab) {
      case "savings":
        return {
          title: "Liquid Savings",
          icon: <PiggyBank size={20} className="text-emerald-700" />,
          bg: "bg-emerald-500/15",
        };
      case "investment":
        return {
          title: "Investments",
          icon: <TrendingUp size={20} className="text-teal-700" />,
          bg: "bg-teal-500/15",
        };
      case "emergency":
        return {
          title: "Emergency Fund",
          icon: <ShieldCheck size={20} className="text-cyan-700" />,
          bg: "bg-cyan-500/15",
        };
      case "emi":
        return {
          title: "Monthly EMIs",
          icon: <Receipt size={20} className="text-amber-700" />,
          bg: "bg-amber-500/15",
        };
    }
  };

  const meta = getTabMeta();
  const currentVal = getCurrentVal();

  const quickAmounts = currency === "INR" ? [1000, 5000, 10000, 25000] : [100, 500, 1000, 2500];

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const val = parseFloat(amount);
    if (isNaN(val) || val < 0) {
      setError("Please enter a valid amount.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const baseVal = getCurrentVal();
      const finalValue = mode === "topup" ? baseVal + val : val;
      const updates: Parameters<typeof updateFinancialReserves>[1] = {};

      if (activeTab === "savings") {
        updates.currentSavings = finalValue;
      } else if (activeTab === "investment") {
        updates.currentInvestments = finalValue;
      } else if (activeTab === "emergency") {
        updates.currentEmergencyFund = finalValue;
      } else if (activeTab === "emi") {
        updates.emiAmount = finalValue;
      }

      await updateFinancialReserves(uid, updates);

      // Trigger immediate UI refresh
      onSuccess(updates);
      onClose();
    } catch (err: any) {
      console.error("Failed to update reserve balance:", err);
      setError(err?.message || "Failed to update reserve balance.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/80 bg-white/95 p-6 sm:p-8 shadow-2xl backdrop-blur-2xl">
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${meta.bg}`}>
              {meta.icon}
            </div>
            <div>
              <h3 className="text-base font-black text-neutral-950">{meta.title}</h3>
              <p className="text-[11px] font-semibold text-neutral-500">
                Current: {currency} {Math.round(currentVal).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={16} />
          </button>
        </div>

        {/* 4-Tab Switcher */}
        <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-neutral-100/80 p-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("savings");
              setMode("topup");
              setAmount("");
            }}
            className={`rounded-xl py-2 text-[10px] sm:text-xs font-bold transition ${
              activeTab === "savings"
                ? "bg-white text-emerald-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Savings
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("investment");
              setMode("topup");
              setAmount("");
            }}
            className={`rounded-xl py-2 text-[10px] sm:text-xs font-bold transition ${
              activeTab === "investment"
                ? "bg-white text-teal-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Invest
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("emergency");
              setMode("topup");
              setAmount("");
            }}
            className={`rounded-xl py-2 text-[10px] sm:text-xs font-bold transition ${
              activeTab === "emergency"
                ? "bg-white text-cyan-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Runway
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("emi");
              setMode("set");
              setAmount("");
            }}
            className={`rounded-xl py-2 text-[10px] sm:text-xs font-bold transition ${
              activeTab === "emi"
                ? "bg-white text-amber-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            EMI
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {error}
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
            <span>Action Mode:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("topup")}
                className={`rounded-lg px-2.5 py-1 ${
                  mode === "topup"
                    ? "bg-[#173d32] text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                + Add / Deposit
              </button>
              <button
                type="button"
                onClick={() => setMode("set")}
                className={`rounded-lg px-2.5 py-1 ${
                  mode === "set"
                    ? "bg-[#173d32] text-white"
                    : "bg-neutral-100 text-neutral-600"
                }`}
              >
                Set Fixed Total
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5">
              {mode === "topup" ? "Deposit / Add Amount" : "New Total Balance"} ({currency})
            </label>
            <input
              type="number"
              step="any"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-2xl border border-white/80 bg-white/70 px-4 py-3 text-sm font-semibold text-neutral-900 shadow-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* Quick Amounts */}
          {mode === "topup" && (
            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(String(q))}
                  className="rounded-xl border border-white/90 bg-white/70 px-2.5 py-1 text-xs font-bold text-neutral-700 shadow-xs hover:bg-white active:scale-95 transition"
                >
                  +{q.toLocaleString()}
                </button>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/90 bg-white/70 px-4 py-2.5 text-xs font-bold text-neutral-700 shadow-xs hover:bg-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-[#173d32] px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-[#173d32]/25 transition hover:bg-[#1f5c4a] disabled:opacity-60"
            >
              <Check size={14} />
              <span>{loading ? "Saving..." : "Save Changes"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}