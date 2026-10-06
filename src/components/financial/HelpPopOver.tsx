"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { HelpCircle, X, Info } from "lucide-react";

interface HelpPopoverProps {
  title: string;
  description: string;
  example?: string;
  className?: string;
}

export default function HelpPopover({
  title,
  description,
  example,
  className = "",
}: HelpPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when pressing the Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modalContent = isOpen && mounted ? (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Background Dim / Blur */}
      <div
        className="fixed inset-0 bg-neutral-950/40 backdrop-blur-sm transition-opacity"
        onClick={() => setIsOpen(false)}
      />

      {/* Floating Centered Dialog Box */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[28px] border border-white/80 bg-white p-6 shadow-2xl backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex items-center justify-between border-b border-black/5 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-800">
              <Info size={18} />
            </div>
            <h3 className="text-base font-black text-neutral-950">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-full p-1.5 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <p className="text-xs sm:text-sm font-medium leading-relaxed text-neutral-600 whitespace-pre-line">
            {description}
          </p>

          {example && (
            <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/80 p-3.5 text-xs text-emerald-950">
              <span className="font-bold">Example: </span>
              <span className="leading-relaxed">{example}</span>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="rounded-xl bg-[#173d32] px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1f5c4a] active:scale-95"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(true);
        }}
        aria-label={`Learn more about ${title}`}
        className={`inline-flex items-center justify-center rounded-full p-1 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700 active:scale-90 ${className}`}
      >
        <HelpCircle size={15} />
      </button>

      {/* Render outside of the card directly into the HTML body */}
      {mounted && createPortal(modalContent, document.body)}
    </>
  );
}