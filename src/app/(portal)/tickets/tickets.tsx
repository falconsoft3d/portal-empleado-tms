"use client";

import { useActionState } from "react";
import { SpinnerIcon } from "@/components/icons";
import type { Tickets as TicketsData, TicketState } from "@/lib/odoo";
import { formatDate, inputClass } from "../vacaciones/vacations";
import { crearTicket } from "./actions";

const STATE_BADGES: Record<TicketState, { label: string; className: string }> = {
  nuevo: { label: "Nuevo", className: "bg-accent-soft text-accent" },
  en_proceso: { label: "En proceso", className: "bg-warning-soft text-ink" },
  resuelto: { label: "Resuelto", className: "bg-success-soft text-success" },
  cancelado: { label: "Cancelado", className: "bg-surface-muted text-muted" },
};

function TicketForm({ action, pending }: { action: (formData: FormData) => void; pending: boolean }) {
  return (
    <form action={action} className="mt-3 grid gap-3">
      <label>
        <span className="text-xs font-medium text-muted">Título</span>
        <input
          name="titulo"
          required
          maxLength={200}
          placeholder="Ej.: Consulta sobre mi recibo de sueldo"
          className={inputClass}
        />
      </label>
      <label>
        <span className="text-xs font-medium text-muted">Descripción</span>
        <textarea
          name="descripcion"
          rows={4}
          maxLength={2000}
          placeholder="Cuéntanos qué necesitas."
          className={`${inputClass} h-auto py-2`}
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
      >
        {pending && <SpinnerIcon className="size-4 animate-spin" />}
        {pending ? "Enviando…" : "Enviar ticket"}
      </button>
    </form>
  );
}

export function Tickets({ initial }: { initial: TicketsData }) {
  const [state, action, pending] = useActionState(crearTicket, { data: initial, version: 0 });
  const data = state.data ?? initial;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section className="h-fit rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Nuevo ticket</h2>
        {/* La clave cambia en cada envío correcto: el formulario se vacía. */}
        <TicketForm key={state.version} action={action} pending={pending} />
        {state.error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {state.error}
          </p>
        )}
        {state.success && !state.error && (
          <p className="mt-3 rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{state.success}</p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Mis tickets</h2>
        {data.tickets.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía no creaste tickets.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.tickets.map((ticket) => (
              <li key={ticket.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">{ticket.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATE_BADGES[ticket.state].className}`}
                  >
                    {STATE_BADGES[ticket.state].label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted">
                  {ticket.name} · {formatDate(ticket.date)}
                </p>
                {ticket.description && (
                  <p className="mt-1 line-clamp-3 whitespace-pre-line text-xs text-muted">{ticket.description}</p>
                )}
                {ticket.answer && (
                  <div className="mt-3 rounded-lg bg-surface-muted px-3 py-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Respuesta de RRHH</p>
                    <p className="mt-1 whitespace-pre-line text-xs text-ink">{ticket.answer}</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
