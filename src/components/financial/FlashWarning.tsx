"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X, ShieldAlert } from "lucide-react";

interface FlashWarningProps {
  monthlyIncome: number;
  totalExpenses: number;
  emiAmount: number;
  emergencyFund: number;
  emergencyTarget: number;
  currency: string;
}

export default function FlashWarning({
  monthlyIncome,
  totalExpenses,
  emiAmount,
  emergencyFund,
  emergencyTarget,
  currency,
}: FlashWarningProps) {
  const [activeWarning, setActiveWarning] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // 1. Check if user was already notified during this browser session
    const alreadyShown = sessionStorage.getItem("finora_warning_dismissed");
    if (alreadyShown) return;

    // 2. Evaluate warning rules
    const netBuffer = monthlyIncome - totalExpenses;
    const emiRatio = monthlyIncome > 0 ? (emiAmount / monthlyIncome) * 100 : 0;
    const runwayRatio = emergencyTarget > 0 ? (emergencyFund / emergencyTarget) * 100 : 100;

    let warningMessage: string | null = null;

    if (netBuffer < 0) {
      warningMessage = `Your recorded spending exceeds your monthly income by ${currency} ${Math.abs(
        Math.round(netBuffer)
      ).toLocaleString()}. You are currently running in a cash deficit.`;
    } else if (emiRatio > 40) {
      warningMessage = `Your monthly EMIs consume ${Math.round(
        emiRatio
      )}% of your income. Financial guidelines recommend keeping total debt servicing under 40%.`;
    } else if (runwayRatio < 25 && emergencyTarget > 0) {
      warningMessage = `Your emergency runway is below 25% of your 3-month safety target (${currency} ${Math.round(
        emergencyFund
      ).toLocaleString()} of ${currency} ${Math.round(
        emergencyTarget
      ).toLocaleString()}). Consider prioritizing a liquid safety net.`;
    }

    if (warningMessage) {
      setActiveWarning(warningMessage);
      setIsOpen(true);
      // Mark as seen for this session
      sessionStorage.setItem("finora_warning_dismissed", "true");
    }
  }, [monthlyIncome, totalExpenses, emiAmount, emergencyFund, emergencyTarget, currency]);

  if (!isOpen || !activeWarning) return null;

  return (
    <div className="fixed top-5 left-1/2 z-[9999] w-[92%] max-w-xl -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-amber-300/80 bg-amber-50/95 p-4 shadow-xl backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-900">
            <AlertTriangle size={18} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-amber-950">
              Financial Alert
            </h4>
            <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-900">
              {activeWarning}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="rounded-lg p-1 text-amber-700 hover:bg-amber-200/50 transition"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}