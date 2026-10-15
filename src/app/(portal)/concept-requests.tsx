"use client";

import { useActionState, useEffect, useRef } from "react";
import { SpinnerIcon } from "@/components/icons";
import type { ConceptRequestState, ConceptRequests as ConceptRequestsData } from "@/lib/odoo";
import { solicitarConcepto } from "./actions";

const STATE_LABELS: Record<ConceptRequestState, { label: string; className: string }> = {
  solicitado: { label: "Solicitado", className: "bg-accent-soft text-accent" },
  aprobado: { label: "Aprobado", className: "bg-success-soft text-success" },
  rechazado: { label: "Rechazado", className: "bg-danger-soft text-danger" },
};

const inputClass =
  "mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15";

function localToday() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function ConceptRequests({ initial }: { initial: ConceptRequestsData }) {
  const [state, action, pending] = useActionState(solicitarConcepto, { data: initial, version: 0 });
  const dateRef = useRef<HTMLInputElement>(null);
  const data = state.data ?? initial;

  // La fecha por defecto es "hoy" del navegador (se calcula en el cliente para evitar desfases de zona horaria).
  useEffect(() => {
    if (dateRef.current && !dateRef.current.value) dateRef.current.value = localToday();
  }, [state.version]);

  if (!data.concepts.length && !data.requests.length) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold text-ink">Solicitar concepto</h2>
      <p className="mt-1 text-xs text-muted">Informa horas extras u otros conceptos para que RRHH los apruebe.</p>

      {data.concepts.length > 0 && (
        <form key={state.version} action={action} className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className="sm:col-span-3">
            <span className="text-xs font-medium text-muted">Concepto</span>
            <select name="concepto_id" required defaultValue="" className={inputClass}>
              <option value="" disabled>
                Elige un concepto…
              </option>
              {data.concepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-xs font-medium text-muted">Cantidad</span>
            <input name="cantidad" type="number" inputMode="decimal" min="0.01" step="0.01" required
                   placeholder="Ej.: 5" className={inputClass} />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs font-medium text-muted">Fecha</span>
            <input ref={dateRef} name="fecha" type="date" required className={inputClass} />
          </label>
          <label className="sm:col-span-3">
            <span className="text-xs font-medium text-muted">Nota (opcional)</span>
            <textarea name="nota" rows={2} maxLength={2000} placeholder="Ej.: Realicé 5 horas extras por descarga en planta."
                      className={`${inputClass} h-auto py-2`} />
          </label>
          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={pending}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70 sm:w-auto sm:px-6"
            >
              {pending && <SpinnerIcon className="size-4 animate-spin" />}
              {pending ? "Enviando…" : "Enviar solicitud"}
            </button>
          </div>
        </form>
      )}

      {state.error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{state.error}</p>
      )}
      {state.success && !state.error && (
        <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{state.success}</p>
      )}

      {data.requests.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Mis solicitudes</h3>
          <ul className="space-y-2">
            {data.requests.map((request) => (
              <li key={request.id} className="rounded-lg border border-line px-3 py-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-ink">
                    {request.concept} · <span className="tabular-nums">{request.quantity}</span>
                  </span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_LABELS[request.state].className}`}>
                    {STATE_LABELS[request.state].label}
                  </span>
                </div>
                <p className="text-xs text-muted">
                  {formatDate(request.date)} · {request.name}
                </p>
                {request.note && <p className="mt-1 line-clamp-2 text-xs text-muted">{request.note}</p>}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
