"use client";

import { useState } from "react";
import HelpPopover from "@/components/financial/HelpPopOver";

export interface ReserveSegment {
  label: string;
  value: number;
  color: string;
}

interface ReservesDistributionChartProps {
  savings: number;
  investments: number;
  emergencyFund: number;
  currency: string;
}

export default function ReservesDistributionChart({
  savings,
  investments,
  emergencyFund,
  currency,
}: ReservesDistributionChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const rawSegments: ReserveSegment[] = [
    { label: "Liquid Savings", value: Math.max(savings, 0), color: "#10b981" },
    { label: "Investments", value: Math.max(investments, 0), color: "#14b8a6" },
    { label: "Emergency Fund", value: Math.max(emergencyFund, 0), color: "#06b6d4" },
  ];

  const cleanData = rawSegments.filter((d) => d.value > 0);
  const total = cleanData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0 || cleanData.length === 0) {
    return (
      <div className="flex h-44 w-full flex-col items-center justify-center rounded-2xl border border-white/60 bg-white/40 p-4 text-center backdrop-blur-xl">
        <p className="text-xs font-semibold text-neutral-400">
          No accumulated reserves logged yet.
        </p>
        <p className="mt-1 text-[11px] text-neutral-400">
          Use the buttons below to deposit or set your balances.
        </p>
      </div>
    );
  }

  let currentAngle = 0;
  const sectors = cleanData.map((item, idx) => {
    const fraction = item.value / total;
    const angle = fraction * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    return {
      ...item,
      index: idx,
      startAngle,
      endAngle,
      percentage: Math.round(fraction * 100),
    };
  });

  const size = 180;
  const center = size / 2;
  const outerRadius = 76;
  const innerRadius = 52;

  function toRad(deg: number) {
    return (deg * Math.PI) / 180;
  }

  function getDonutSlice(startDeg: number, endDeg: number, expand = 0) {
    const safeEnd = endDeg - startDeg >= 360 ? startDeg + 359.99 : endDeg;
    const rOut = outerRadius + expand;
    const rIn = innerRadius - expand * 0.4;

    const a1 = toRad(startDeg - 90);
    const a2 = toRad(safeEnd - 90);

    const x1 = center + rOut * Math.cos(a1);
    const y1 = center + rOut * Math.sin(a1);
    const x2 = center + rOut * Math.cos(a2);
    const y2 = center + rOut * Math.sin(a2);

    const x3 = center + rIn * Math.cos(a2);
    const y3 = center + rIn * Math.sin(a2);
    const x4 = center + rIn * Math.cos(a1);
    const y4 = center + rIn * Math.sin(a1);

    const largeArc = safeEnd - startDeg > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  }

  const activeItem = activeIdx !== null ? sectors[activeIdx] : null;

  return (
    <div className="rounded-2xl border border-white/80 bg-white/60 p-4 shadow-xs backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-black/5 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
            Accumulated Wealth Mix
          </span>
          <HelpPopover
            title="Accumulated Wealth Mix"
            description="Unlike your monthly salary, this chart shows where your total saved wealth sits right now: between instant cash, invested assets, and emergency runway."
            example="If you have INR 5,000 in cash, INR 10,000 in stocks, and INR 15,000 in safety funds, this chart reflects that overall split."
          />
        </div>
        <span className="text-[11px] font-black text-neutral-900">
          {currency} {new Intl.NumberFormat().format(total)} Total
        </span>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Donut Graphic */}
        <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-44 w-44 overflow-visible">
            {sectors.map((s) => {
              const isHovered = activeIdx === s.index;
              const isDimmed = activeIdx !== null && !isHovered;

              return (
                <path
                  key={s.label}
                  d={getDonutSlice(s.startAngle, s.endAngle, isHovered ? 4 : 0)}
                  fill={s.color}
                  onMouseEnter={() => setActiveIdx(s.index)}
                  onMouseLeave={() => setActiveIdx(null)}
                  onTouchStart={() => setActiveIdx(s.index)}
                  className="cursor-pointer transition-all duration-300"
                  style={{
                    opacity: isDimmed ? 0.4 : 1,
                    filter: isHovered
                      ? `drop-shadow(0 4px 10px ${s.color}66)`
                      : "drop-shadow(0 1px 3px rgba(0,0,0,0.04))",
                  }}
                />
              );
            })}
          </svg>

          {/* Center Info */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-2">
            {activeItem ? (
              <>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400 max-w-[90px] truncate">
                  {activeItem.label}
                </span>
                <p className="text-xs font-black tracking-tight text-neutral-950 mt-0.5">
                  {activeItem.percentage}%
                </p>
              </>
            ) : (
              <>
                <span className="text-[9px] font-black uppercase tracking-wider text-neutral-400">
                  Reserves
                </span>
                <p className="text-[11px] font-black tracking-tight text-neutral-950 mt-0.5">
                  100%
                </p>
              </>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex w-full flex-col gap-1.5">
          {sectors.map((item) => {
            const isSelected = activeIdx === item.index;

            return (
              <div
                key={item.label}
                onMouseEnter={() => setActiveIdx(item.index)}
                onMouseLeave={() => setActiveIdx(null)}
                className={`flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 transition-all ${
                  isSelected
                    ? "bg-white shadow-xs"
                    : "hover:bg-white/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-bold text-neutral-700">
                    {item.label}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-black text-neutral-900">
                    {item.percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}