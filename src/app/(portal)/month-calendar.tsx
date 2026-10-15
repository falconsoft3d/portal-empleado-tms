"use client";

import { useState, useTransition } from "react";
import { ChevronDownIcon, SpinnerIcon } from "@/components/icons";
import type { AttendanceMonth } from "@/lib/odoo";
import { obtenerMes } from "./actions";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];

function formatHours(hours: number) {
  const minutes = Math.round(hours * 60);
  return `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`;
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Intensidad del día según las horas imputadas. */
function dayTone(hours: number) {
  if (hours <= 0) return "";
  if (hours < 4) return "bg-accent-soft text-ink";
  if (hours < 8) return "bg-accent/35 text-ink";
  return "bg-accent/70 text-white";
}

export function MonthCalendar({ initial }: { initial: AttendanceMonth }) {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<string | null>(initial.days[initial.today] ? initial.today : null);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const [year, month] = data.month.split("-").map(Number);
  const monthName = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("es-AR", {
    month: "long",
    timeZone: "UTC",
  });
  const title = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${year}`;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const leading = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const total = Object.values(data.days).reduce((acc, day) => acc + day.hours, 0);
  const workedDays = Object.values(data.days).filter((day) => day.records.length > 0).length;
  const selectedDay = selected ? data.days[selected] : undefined;

  function go(delta: number) {
    const target = shiftMonth(data.month, delta);
    startTransition(async () => {
      const next = await obtenerMes(target);
      if (next) {
        setData(next);
        setSelected(null);
        setError(false);
      } else {
        setError(true);
      }
    });
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">Mi calendario</h2>
        {pending && <SpinnerIcon className="size-4 animate-spin text-muted" />}
      </div>

      <div className="mb-3 flex items-center gap-4 rounded-xl border border-line px-3 py-2">
        <div>
          <p className="text-lg font-semibold tabular-nums text-ink">{formatHours(total)}</p>
          <p className="text-[11px] text-muted">Horas del mes</p>
        </div>
        <span className="h-8 w-px bg-line" />
        <div>
          <p className="text-lg font-semibold tabular-nums text-ink">{workedDays}</p>
          <p className="text-[11px] text-muted">Días con fichadas</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={pending}
          aria-label="Mes anterior"
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-ink"
        >
          <ChevronDownIcon className="size-4 rotate-90" />
        </button>
        <p className="text-sm font-semibold text-ink">{title}</p>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={pending}
          aria-label="Mes siguiente"
          className="grid size-8 place-items-center rounded-lg text-muted transition hover:bg-surface-muted hover:text-ink"
        >
          <ChevronDownIcon className="size-4 -rotate-90" />
        </button>
      </div>

      <div className={`mt-2 grid grid-cols-7 gap-1 text-center ${pending ? "opacity-60" : ""}`}>
        {WEEKDAYS.map((weekday) => (
          <span key={weekday} className="py-1 text-[11px] font-medium text-muted">
            {weekday}
          </span>
        ))}
        {Array.from({ length: leading }, (_, i) => (
          <span key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const dayNumber = i + 1;
          const key = `${data.month}-${String(dayNumber).padStart(2, "0")}`;
          const day = data.days[key];
          const hours = day?.hours ?? 0;
          const isToday = key === data.today;
          const isSelected = key === selected;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(day ? key : null)}
              title={day ? `${formatHours(hours)} h` : undefined}
              className={`flex aspect-square flex-col items-center justify-center rounded-lg text-xs transition ${
                dayTone(hours) || "text-ink hover:bg-surface-muted"
              } ${isToday ? "ring-1 ring-accent" : ""} ${isSelected ? "ring-2 ring-primary" : ""} ${
                day ? "cursor-pointer" : "cursor-default"
              }`}
            >
              <span className="leading-none">{dayNumber}</span>
              {day && <span className="mt-0.5 text-[9px] leading-none tabular-nums opacity-90">{formatHours(hours)}</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="mt-3 text-xs text-danger">No se pudo cargar el mes.</p>}

      {selected && selectedDay && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="mb-2 text-xs font-semibold text-ink">
            {new Date(`${selected}T12:00:00Z`).toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            })}{" "}
            · {formatHours(selectedDay.hours)} h
          </p>
          <ul className="space-y-1.5">
            {selectedDay.records.map((record) => (
              <li key={record.id} className="rounded-lg border border-line px-2.5 py-1.5 text-xs">
                <span className="tabular-nums text-ink">
                  {formatHour(record.start)} → {record.end ? formatHour(record.end) : "en curso"}
                </span>
                {record.task && <span className="block truncate text-muted">{record.task.name}</span>}
                {record.comment && (
                  <span className="block truncate italic text-muted" title={record.comment}>
                    “{record.comment}”
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
