"use client";

import React from "react";

interface PlanningCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export default function PlanningCard({
  title,
  description,
  icon,
}: PlanningCardProps) {
  return (
    <div className="group rounded-[28px] border border-neutral-200/90 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/80 hover:shadow-xl hover:shadow-neutral-900/5">
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#edf5f1] text-[#1f5c4a] transition-transform duration-300 group-hover:scale-110">
          {icon}
        </div>

        <div>
          <h3 className="font-bold text-neutral-950 text-base leading-snug">
            {title}
          </h3>

          <p className="mt-2 text-xs leading-5 text-neutral-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}