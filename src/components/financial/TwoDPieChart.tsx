"use client";

import { useState } from "react";

export interface PieSegment {
  label: string;
  value: number;
  color: string;
  darkColor?: string;
  glowColor?: string;
}

interface TwoDPieChartProps {
  data?: PieSegment[];
  currency?: string;
  totalValue?: number;
}

export default function TwoDPieChart({
  data = [],
  currency = "INR",
  totalValue = 0,
}: TwoDPieChartProps) {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  // Safe fallback to avoid "Cannot read properties of undefined (reading 'filter')"
  const cleanData = (data ?? []).filter((d) => d && typeof d.value === "number" && d.value > 0);
  const total = cleanData.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0 || cleanData.length === 0) {
    return (
      <div className="flex h-56 w-full flex-col items-center justify-center rounded-3xl border border-white/60 bg-white/40 p-6 text-center backdrop-blur-xl">
        <p className="text-xs font-semibold text-neutral-400">
          No recorded spending data yet
        </p>
      </div>
    );
  }

  // Pre-calculate angle slices
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

  const size = 260;
  const center = size / 2;
  const outerRadius = 100;
  const innerRadius = 66;

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
    <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
      {/* 2D Donut Chart Viewport */}
      <div className="relative flex h-64 w-64 sm:h-72 sm:w-72 shrink-0 items-center justify-center">
        {/* Soft Ambient Refraction Aura */}
        <div
          className="pointer-events-none absolute h-48 w-48 rounded-full blur-2xl transition-all duration-500"
          style={{
            backgroundColor: activeItem ? activeItem.color : "#10b981",
            opacity: 0.22,
          }}
        />

        <svg viewBox={`0 0 ${size} ${size}`} className="h-64 w-64 sm:h-72 sm:w-72 overflow-visible">
          {sectors.map((s) => {
            const isHovered = activeIdx === s.index;
            const isDimmed = activeIdx !== null && !isHovered;

            return (
              <path
                key={s.label}
                d={getDonutSlice(s.startAngle, s.endAngle, isHovered ? 6 : 0)}
                fill={s.color}
                onMouseEnter={() => setActiveIdx(s.index)}
                onMouseLeave={() => setActiveIdx(null)}
                onTouchStart={() => setActiveIdx(s.index)}
                className="cursor-pointer transition-all duration-300"
                style={{
                  opacity: isDimmed ? 0.35 : 1,
                  filter: isHovered
                    ? `drop-shadow(0 6px 14px ${s.color}66)`
                    : "drop-shadow(0 2px 4px rgba(0,0,0,0.04))",
                }}
              />
            );
          })}
        </svg>

        {/* Dynamic Center HUD Display */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-3">
          <div className="flex flex-col items-center justify-center rounded-full transition-all duration-300">
            {activeItem ? (
              <>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 max-w-[110px] truncate">
                  {activeItem.label}
                </span>
                <p className="text-base sm:text-lg font-black tracking-tight text-neutral-950 mt-0.5">
                  {currency} {new Intl.NumberFormat().format(activeItem.value)}
                </p>
                <span
                  className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-black text-white shadow-xs"
                  style={{ backgroundColor: activeItem.color }}
                >
                  {activeItem.percentage}%
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Total Monthly
                </span>
                <p className="text-base sm:text-lg font-black tracking-tight text-neutral-950 mt-0.5">
                  {currency} {new Intl.NumberFormat().format(totalValue)}
                </p>
                <span className="mt-0.5 text-[10px] font-semibold text-neutral-400">
                  Touch slice for details
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Legend with Glass Pills */}
      <div className="flex w-full flex-col gap-2.5">
        {sectors.map((item) => {
          const isSelected = activeIdx === item.index;

          return (
            <div
              key={item.label}
              onMouseEnter={() => setActiveIdx(item.index)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={() => setActiveIdx(item.index)}
              className={`flex cursor-pointer items-center justify-between rounded-2xl border p-3.5 transition-all duration-300 ${
                isSelected
                  ? "scale-[1.02] border-white/95 bg-white/90 shadow-[0_12px_28px_rgba(0,0,0,0.08)] backdrop-blur-2xl"
                  : "border-white/60 bg-white/45 backdrop-blur-xl hover:border-white/80 hover:bg-white/65"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3.5 w-3.5 rounded-lg transition-transform duration-300"
                  style={{
                    backgroundColor: item.color,
                    boxShadow: isSelected ? `0 0 12px ${item.color}` : "none",
                    transform: isSelected ? "scale(1.2)" : "scale(1)",
                  }}
                />
                <div>
                  <p className="text-xs font-bold text-neutral-900">{item.label}</p>
                  <p className="text-[11px] font-semibold text-neutral-500">
                    {item.percentage}% of verified inflow
                  </p>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-black text-neutral-900">
                  {currency} {new Intl.NumberFormat().format(item.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}