"use client";

import { useActionState, useState } from "react";
import { CheckIcon, SpinnerIcon } from "@/components/icons";
import type { VacationRequestState, Vacations as VacationsData } from "@/lib/odoo";
import { solicitarVacaciones } from "./actions";

const inputClass =
  "mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

const STEPS: { state: VacationRequestState; label: string }[] = [
  { state: "borrador", label: "Borrador" },
  { state: "solicitado", label: "Solicitado" },
  { state: "aprobado", label: "Aprobado" },
];

const STATE_BADGES: Record<VacationRequestState, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-surface-muted text-muted" },
  solicitado: { label: "En revisión", className: "bg-accent-soft text-accent" },
  aprobado: { label: "Aprobado", className: "bg-success-soft text-success" },
};

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatDays(days: number) {
  const value = Number.isInteger(days) ? String(days) : days.toFixed(1).replace(".", ",");
  return `${value} ${days === 1 ? "día" : "días"}`;
}

/** Días corridos entre dos fechas ISO, ambas incluidas (0 si el rango no es válido). */
function daysBetween(start: string, end: string) {
  if (!start || !end || end < start) return 0;
  return Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) + 1;
}

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

/** Seguimiento de la solicitud: Borrador → Solicitado → Aprobado. */
function Progress({ state }: { state: VacationRequestState }) {
  const current = STEPS.findIndex((step) => step.state === state);
  return (
    <ol className="mt-3 flex items-center gap-2" aria-label="Seguimiento">
      {STEPS.map((step, index) => {
        const done = index <= current;
        return (
          <li key={step.state} className="flex flex-1 items-center gap-2 last:flex-none">
            <span
              className={`grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold ${
                done ? "bg-success text-white" : "bg-surface-muted text-muted"
              }`}
              aria-current={index === current ? "step" : undefined}
            >
              {done ? <CheckIcon className="size-3.5" /> : index + 1}
            </span>
            <span className={`text-xs ${index === current ? "font-semibold text-ink" : "text-muted"}`}>
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className={`h-px flex-1 ${index < current ? "bg-success" : "bg-line"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function RequestForm({
  action,
  pending,
  available,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  available: number;
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const requestedDays = daysBetween(start, end);
  const today = localToday();

  return (
    <form action={action} className="mt-3 grid gap-3">
      <label>
        <span className="text-xs font-medium text-muted">Fecha desde</span>
        <input
          name="fecha_desde"
          type="date"
          required
          min={today}
          value={start}
          onChange={(event) => setStart(event.target.value)}
          className={inputClass}
        />
      </label>
      <label>
        <span className="text-xs font-medium text-muted">Fecha hasta</span>
        <input
          name="fecha_hasta"
          type="date"
          required
          min={start || today}
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className={inputClass}
        />
      </label>
      {requestedDays > 0 && (
        <p className={`text-xs ${requestedDays > available ? "text-danger" : "text-muted"}`}>
          Estás solicitando {formatDays(requestedDays)} corridos
          {requestedDays > available && ` (tienes ${formatDays(available)} disponibles)`}.
        </p>
      )}
      <label>
        <span className="text-xs font-medium text-muted">Descripción (opcional)</span>
        <textarea
          name="descripcion"
          rows={2}
          maxLength={2000}
          placeholder="Ej.: Vacaciones de invierno."
          className={`${inputClass} h-auto py-2`}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
      >
        {pending && <SpinnerIcon className="size-4 animate-spin" />}
        {pending ? "Enviando…" : "Enviar solicitud"}
      </button>
    </form>
  );
}

export function Vacations({ initial }: { initial: VacationsData }) {
  const [state, action, pending] = useActionState(solicitarVacaciones, { data: initial, version: 0 });
  const data = state.data ?? initial;
  const hasPrevious = data.periods.some((period) => period.previous);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <p className="text-sm text-muted">Vacaciones disponibles</p>
          <p className="mt-1 text-4xl font-semibold tracking-tight text-ink tabular-nums">
            {formatDays(data.available)}
          </p>
          {data.periods.length > 0 ? (
            <table className="mt-4 w-full border-t border-line text-sm">
              <thead>
                <tr className="text-xs text-muted">
                  <th className="pt-3 pb-1 text-left font-medium">Año</th>
                  <th className="pt-3 pb-1 text-right font-medium">Totales</th>
                  {hasPrevious && <th className="pt-3 pb-1 text-right font-medium">Anterior</th>}
                  <th className="pt-3 pb-1 text-right font-medium">Tomados</th>
                  <th className="pt-3 pb-1 text-right font-medium">Restan</th>
                </tr>
              </thead>
              <tbody className="tabular-nums">
                {data.periods.map((period) => (
                  <tr key={period.id} className={period.remaining ? "text-ink" : "text-muted"}>
                    <td className="py-1">{period.year}</td>
                    <td className="py-1 text-right">{period.entitled}</td>
                    {hasPrevious && <td className="py-1 text-right">{period.previous || ""}</td>}
                    <td className="py-1 text-right">{period.taken}</td>
                    <td className={`py-1 text-right font-semibold ${period.remaining < 0 ? "text-danger" : ""}`}>
                      {period.remaining}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="mt-3 text-xs text-muted">RRHH todavía no cargó tu configuración de vacaciones.</p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="text-sm font-semibold text-ink">Solicitar vacaciones</h2>
          {/* La clave cambia en cada envío correcto: el formulario se vacía. */}
          <RequestForm key={state.version} action={action} pending={pending} available={data.available} />
          {state.error && (
            <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
              {state.error}
            </p>
          )}
          {state.success && !state.error && (
            <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{state.success}</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Mis solicitudes</h2>
        {data.requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía no solicitaste vacaciones.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.requests.map((request) => (
              <li key={request.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {formatDate(request.start)} – {formatDate(request.end)}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_BADGES[request.state].className}`}
                  >
                    {STATE_BADGES[request.state].label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {request.name} · {formatDays(request.days)}
                </p>
                {request.description && <p className="mt-1 line-clamp-2 text-xs text-muted">{request.description}</p>}
                <Progress state={request.state} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
