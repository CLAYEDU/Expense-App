"use client";

interface PlanningCardProps {
  title: string;
  description: string;
  icon?: string;
}

export default function PlanningCard({
  title,
  description,
  icon = "✦",
}: PlanningCardProps) {
  return (
    <div className="rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-neutral-100 text-sm">
          {icon}
        </div>

        <div>
          <h3 className="font-semibold text-neutral-900">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-neutral-600">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}