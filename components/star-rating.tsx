"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

function starsFor(value: number) {
  return [1, 2, 3, 4, 5].map((star) => ({
    star,
    filled: star <= Math.round(value),
  }));
}

export function StarRating({
  value,
  count,
  size = "md",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted">
      <span className="inline-flex items-center gap-0.5 text-accent" aria-hidden>
        {starsFor(value).map(({ star, filled }) => (
          <Star key={star} className={cn(icon, filled ? "fill-current" : "opacity-35")} />
        ))}
      </span>
      <span>
        {count ? `${value.toFixed(1)} (${count})` : value > 0 ? value.toFixed(1) : "No reviews yet"}
      </span>
    </p>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Star rating" className="flex flex-wrap gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const selected = star === value;
        const filled = star <= value;
        return (
          <button
            key={star}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
            className={cn(
              "grid h-11 w-11 place-items-center rounded-md border text-accent",
              filled ? "border-accent bg-accent/10" : "border-line bg-surface",
            )}
            onClick={() => onChange(star)}
          >
            <Star className={cn("h-5 w-5", filled ? "fill-current" : "opacity-40")} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
