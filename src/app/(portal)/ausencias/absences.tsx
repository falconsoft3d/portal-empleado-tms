"use client";

import { useActionState, useState } from "react";
import { PaperclipIcon, SpinnerIcon } from "@/components/icons";
import type { AbsenceRequestState, Absences as AbsencesData } from "@/lib/odoo";
import { daysBetween, formatDate, formatDays, inputClass, Progress } from "../vacaciones/vacations";
import { solicitarAusencia } from "./actions";
import { MAX_ATTACHMENTS, MAX_ATTACHMENTS_BYTES } from "./limits";

const STATE_BADGES: Record<AbsenceRequestState, { label: string; className: string }> = {
  borrador: { label: "Borrador", className: "bg-surface-muted text-muted" },
  solicitado: { label: "En revisión", className: "bg-accent-soft text-accent" },
  aprobado: { label: "Aprobado", className: "bg-success-soft text-success" },
};

function RequestForm({
  action,
  pending,
  types,
}: {
  action: (formData: FormData) => void;
  pending: boolean;
  types: AbsencesData["types"];
}) {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [fileError, setFileError] = useState("");
  const requestedDays = daysBetween(start, end);

  function checkFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    const total = files.reduce((sum, file) => sum + file.size, 0);
    const invalid = files.length > MAX_ATTACHMENTS || total > MAX_ATTACHMENTS_BYTES;
    setFileError(invalid ? `Hasta ${MAX_ATTACHMENTS} archivos y 4 MB en total.` : "");
    if (invalid) event.target.value = "";
  }

  return (
    <form action={action} className="mt-3 grid gap-3">
      <label>
        <span className="text-xs font-medium text-muted">Tipo de ausencia</span>
        <select name="concepto_id" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Elige un tipo…
          </option>
          {types.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span className="text-xs font-medium text-muted">Fecha desde</span>
        <input
          name="fecha_desde"
          type="date"
          required
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
          min={start || undefined}
          value={end}
          onChange={(event) => setEnd(event.target.value)}
          className={inputClass}
        />
      </label>
      {requestedDays > 0 && <p className="text-xs text-muted">Son {formatDays(requestedDays)} corridos.</p>}
      <label>
        <span className="text-xs font-medium text-muted">Descripción (opcional)</span>
        <textarea
          name="descripcion"
          rows={2}
          maxLength={2000}
          placeholder="Ej.: Turno médico."
          className={`${inputClass} h-auto py-2`}
        />
      </label>
      <label>
        <span className="text-xs font-medium text-muted">Adjunto (opcional)</span>
        <input
          name="adjuntos"
          type="file"
          multiple
          accept="application/pdf,image/*"
          onChange={checkFiles}
          className="mt-1 block w-full text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-surface-muted file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink hover:file:bg-accent-soft"
        />
        <span className={`mt-1 block text-[11px] ${fileError ? "text-danger" : "text-muted"}`}>
          {fileError || `PDF o imagen (p. ej. certificado médico). Hasta ${MAX_ATTACHMENTS} archivos y 4 MB en total.`}
        </span>
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

export function Absences({ initial }: { initial: AbsencesData }) {
  const [state, action, pending] = useActionState(solicitarAusencia, { data: initial, version: 0 });
  const data = state.data ?? initial;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <section className="h-fit rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Solicitar ausencia</h2>
        {data.types.length === 0 ? (
          <p className="mt-2 text-sm text-muted">RRHH todavía no configuró los tipos de ausencia.</p>
        ) : (
          // La clave cambia en cada envío correcto: el formulario se vacía.
          <RequestForm key={state.version} action={action} pending={pending} types={data.types} />
        )}
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
        <h2 className="text-sm font-semibold text-ink">Mis solicitudes</h2>
        {data.requests.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Todavía no solicitaste ausencias.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.requests.map((request) => (
              <li key={request.id} className="rounded-xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-ink">
                    {request.type} · {formatDate(request.start)} – {formatDate(request.end)}
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
                {request.attachments.length > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                    <PaperclipIcon className="size-3.5 shrink-0" />
                    <span className="truncate">{request.attachments.join(", ")}</span>
                  </p>
                )}
                <Progress state={request.state} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
