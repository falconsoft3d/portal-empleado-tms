"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** `false` al renderizar en el servidor y en la hidratación; `true` después, ya en el navegador. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

const STATE_CLASSES: Record<string, string> = {
  open: "bg-accent-soft text-accent",
  repair: "bg-warning-soft text-ink",
  finalized: "bg-success-soft text-success",
  audit: "bg-accent-soft text-accent",
  rated: "bg-success-soft text-success",
  closed: "bg-surface-muted text-muted",
};

export function StateBadge({ state, label }: { state: string; label: string }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
        STATE_CLASSES[state] ?? "bg-surface-muted text-muted"
      }`}
    >
      {label}
    </span>
  );
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Fecha y hora en la zona horaria del navegador del empleado. En el servidor no se conoce,
 * así que se muestra después de hidratar.
 */
export function LocalDateTime({ iso, fallback = "—" }: { iso: string | null; fallback?: string }) {
  const hydrated = useHydrated();
  if (!iso) return <>{fallback}</>;
  return <time dateTime={iso}>{hydrated ? formatDateTime(iso) : "…"}</time>;
}

export function formatHours(hours: number) {
  return `${hours.toLocaleString("es-AR", { maximumFractionDigits: 2 })} h`;
}

export function RepairTypes({ types }: { types: string[] }) {
  if (types.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {types.map((type) => (
        <li key={type} className="rounded-full border border-line px-2 py-0.5 text-[11px] text-muted">
          {type}
        </li>
      ))}
    </ul>
  );
}
