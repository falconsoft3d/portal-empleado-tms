"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { AlertIcon, CheckIcon, PlayIcon, PrinterIcon, SpinnerIcon, StopIcon, WrenchIcon } from "@/components/icons";
import type { MaintenanceChanges, MaintenanceLine, MaintenanceLineChange, MaintenanceOrderDetail } from "@/lib/odoo";
import { inputClass } from "../../vacaciones/vacations";
import { cambiarEstadoFicha, guardarFicha, iniciarDetenerTarea, type MaintenanceActionResult } from "../actions";
import { formatHours, LocalDateTime, RepairTypes, StateBadge, useHydrated } from "../shared";

type LineDraft = Pick<MaintenanceLine, "is_pending" | "is_done" | "employee_id" | "start" | "end">;

type Busy = "save" | "repair" | "finalize" | `line-${number}`;

function draftOf(line: MaintenanceLine): LineDraft {
  return { is_pending: line.is_pending, is_done: line.is_done, employee_id: line.employee_id, start: line.start, end: line.end };
}

function draftsOf(data: MaintenanceOrderDetail) {
  return Object.fromEntries(data.lines.map((line) => [line.id, draftOf(line)])) as Record<number, LineDraft>;
}

function sameDate(a: string | null, b: string | null) {
  return a === b || (a !== null && b !== null && Date.parse(a) === Date.parse(b));
}

/** ISO → valor de `<input type="datetime-local">` en la zona horaria del navegador. */
function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

/** Valor de `datetime-local` (hora local del navegador) → ISO en UTC. */
function fromLocalInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** Solo lo que cambió respecto de lo guardado en Odoo, o `null` si no hay cambios. */
function changesOf(
  data: MaintenanceOrderDetail,
  drafts: Record<number, LineDraft>,
  notes: string,
  productos: boolean,
): MaintenanceChanges | null {
  const changes: MaintenanceChanges = {};
  const lines: MaintenanceLineChange[] = [];
  for (const line of data.lines) {
    const draft = drafts[line.id];
    if (!draft) continue;
    const change: MaintenanceLineChange = { id: line.id };
    if (draft.is_pending !== line.is_pending) change.is_pending = draft.is_pending;
    if (draft.is_done !== line.is_done) change.is_done = draft.is_done;
    if (draft.employee_id !== line.employee_id) change.employee_id = draft.employee_id;
    if (!sameDate(draft.start, line.start)) change.start = draft.start;
    if (!sameDate(draft.end, line.end)) change.end = draft.end;
    if (Object.keys(change).length > 1) lines.push(change);
  }
  if (lines.length) changes.lines = lines;
  if (notes !== data.notes) changes.notes = notes;
  if (productos !== data.productos_cargados) changes.productos_cargados = productos;
  return Object.keys(changes).length ? changes : null;
}

export function MaintenanceOrderForm({ initial }: { initial: MaintenanceOrderDetail }) {
  const hydrated = useHydrated();
  const [data, setData] = useState(initial);
  const [drafts, setDrafts] = useState(() => draftsOf(initial));
  const [notes, setNotes] = useState(initial.notes);
  const [productos, setProductos] = useState(initial.productos_cargados);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [busy, setBusy] = useState<Busy | null>(null);
  const [pending, startTransition] = useTransition();

  const editable = data.editable;
  const changes = editable ? changesOf(data, drafts, notes, productos) : null;
  const dirty = changes !== null;

  // Aviso del navegador al salir con cambios sin guardar.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  /** Toma la ficha que devuelve Odoo y descarta los borradores (todo quedó guardado). */
  function reset(next: MaintenanceOrderDetail) {
    setData(next);
    setDrafts(draftsOf(next));
    setNotes(next.notes);
    setProductos(next.productos_cargados);
  }

  function run(key: Busy, action: () => Promise<MaintenanceActionResult>, onOk: (next: MaintenanceOrderDetail) => void, ok: string) {
    setError(null);
    setSuccess(null);
    setBusy(key);
    startTransition(async () => {
      const result = await action();
      setBusy(null);
      if (result.ok) {
        onOk(result.data);
        setSuccess(ok);
      } else {
        if (result.data) reset(result.data);
        setError(result.error);
      }
    });
  }

  function updateDraft(lineId: number, patch: Partial<LineDraft>) {
    setSuccess(null);
    setDrafts((current) => ({ ...current, [lineId]: { ...current[lineId], ...patch } }));
  }

  function save() {
    if (!changes) return;
    run("save", () => guardarFicha(data.id, changes), reset, "Cambios guardados.");
  }

  function startStop(line: MaintenanceLine, action: "start" | "stop") {
    run(
      `line-${line.id}`,
      () => iniciarDetenerTarea(data.id, line.id, action),
      (next) => {
        // Solo cambian el inicio y el fin de esa tarea: se conservan los demás cambios sin guardar.
        setData(next);
        const updated = next.lines.find((l) => l.id === line.id);
        setDrafts((current) => {
          const merged = { ...draftsOf(next), ...current };
          if (updated) merged[line.id] = { ...merged[line.id], start: updated.start, end: updated.end };
          return merged;
        });
      },
      action === "start" ? `Tarea «${line.task}» iniciada.` : `Tarea «${line.task}» detenida.`,
    );
  }

  function changeState(action: "repair" | "finalize") {
    if (
      action === "finalize" &&
      !window.confirm("¿Finalizar la ficha? Después ya no vas a poder modificarla desde el portal.")
    ) {
      return;
    }
    run(
      action,
      () => cambiarEstadoFicha(data.id, action, changes),
      reset,
      action === "repair" ? "La ficha pasó a En Reparación." : "Ficha finalizada.",
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight text-ink">{data.name}</h1>
              <StateBadge state={data.state} label={data.state_label} />
            </div>
            {data.record_type && <p className="mt-0.5 text-sm text-muted">{data.record_type}</p>}
          </div>
          <a
            href={`/api/maintenance/${data.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink transition hover:bg-surface-muted"
          >
            <PrinterIcon className="size-4" />
            Imprimir
          </a>
        </div>

        <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Vehículo" value={data.vehicle} />
          <Field label="Patente" value={data.license_plate} />
          <Field label="Odómetro" value={data.odometer ? `${data.odometer.toLocaleString("es-AR")} km` : ""} />
          <Field label="Chofer" value={data.driver} />
          <Field label="Fecha de apertura" value={<LocalDateTime iso={data.date_open} />} />
          <Field label="Categoría" value={data.category} />
        </dl>
        {data.repair_types.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted">Tipos de reparación</p>
            <div className="mt-1.5">
              <RepairTypes types={data.repair_types} />
            </div>
          </div>
        )}
        {data.description && (
          <div className="mt-4">
            <p className="text-xs font-medium text-muted">Descripción</p>
            <p className="mt-1 whitespace-pre-line text-sm text-ink">{data.description}</p>
          </div>
        )}
        {data.control_warning && (
          <p
            role="status"
            className="mt-4 flex items-start gap-2 rounded-xl border border-orange-300 bg-orange-50 px-3 py-2 text-sm text-orange-800 dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-200"
          >
            <AlertIcon className="mt-0.5 size-4 shrink-0" />
            La última realización de alguna tarea fue hace menos días de lo estipulado (Tiempo de Control). Revise el
            historial.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-ink">Tareas</h2>
          <span className="text-xs text-muted">
            {data.tasks_done}/{data.tasks_total} hechas
            {data.tasks_pending > 0 && ` · ${data.tasks_pending} ${data.tasks_pending === 1 ? "pendiente" : "pendientes"}`}
          </span>
        </div>
        {!editable && (
          <p className="mt-2 text-xs text-muted">La ficha está {data.state_label.toLowerCase()}: solo se puede consultar.</p>
        )}
        {data.lines.length === 0 ? (
          <p className="mt-2 text-sm text-muted">La ficha no tiene tareas.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.lines.map((line) => (
              <TaskRow
                key={line.id}
                line={line}
                draft={drafts[line.id] ?? draftOf(line)}
                employees={data.employees}
                editable={editable}
                hydrated={hydrated}
                disabled={pending}
                busy={busy === `line-${line.id}`}
                onChange={(patch) => updateDraft(line.id, patch)}
                onStartStop={(action) => startStop(line, action)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-semibold text-ink">Notas</h2>
        {editable ? (
          <>
            <textarea
              value={notes}
              onChange={(event) => {
                setSuccess(null);
                setNotes(event.target.value);
              }}
              rows={4}
              maxLength={5000}
              placeholder="Observaciones del trabajo realizado."
              className={`${inputClass} h-auto py-2`}
            />
            <label className="mt-3 flex w-fit cursor-pointer items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={productos}
                onChange={(event) => {
                  setSuccess(null);
                  setProductos(event.target.checked);
                }}
                className="size-4 accent-accent"
              />
              Productos Cargados
            </label>
          </>
        ) : (
          <>
            <p className="mt-2 whitespace-pre-line text-sm text-ink">{data.notes || <span className="text-muted">Sin notas.</span>}</p>
            <p className="mt-3 flex items-center gap-2 text-sm text-ink">
              {data.productos_cargados ? (
                <CheckIcon className="size-4 text-success" />
              ) : (
                <span className="size-4 rounded border border-line" />
              )}
              Productos Cargados
            </p>
          </>
        )}
      </section>

      {error && (
        <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">
          <AlertIcon className="mt-0.5 size-4 shrink-0" />
          <p className="whitespace-pre-line">{error}</p>
        </div>
      )}
      {success && !error && (
        <p role="status" className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
          {success}
        </p>
      )}

      {editable && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "save" && <SpinnerIcon className="size-4 animate-spin" />}
            {busy === "save" ? "Guardando…" : "Guardar"}
          </button>
          {data.can_repair && (
            <button
              type="button"
              onClick={() => changeState("repair")}
              disabled={pending}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-line px-5 text-sm font-medium text-ink transition hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "repair" ? <SpinnerIcon className="size-4 animate-spin" /> : <WrenchIcon className="size-4" />}
              Pasar a En Reparación
            </button>
          )}
          {data.can_finalize && (
            <button
              type="button"
              onClick={() => changeState("finalize")}
              disabled={pending}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-success px-5 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === "finalize" ? <SpinnerIcon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
              Finalizar
            </button>
          )}
          {dirty && <span className="text-xs text-muted sm:ml-1">Tienes cambios sin guardar.</span>}
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-ink">{value || "—"}</dd>
    </div>
  );
}

const toggleClass = (on: boolean, tone: "success" | "warning") =>
  `inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
    on
      ? tone === "success"
        ? "border-transparent bg-success-soft text-success"
        : "border-transparent bg-warning-soft text-ink"
      : "border-line text-muted hover:bg-surface-muted hover:text-ink"
  }`;

function TaskRow({
  line,
  draft,
  employees,
  editable,
  hydrated,
  disabled,
  busy,
  onChange,
  onStartStop,
}: {
  line: MaintenanceLine;
  draft: LineDraft;
  employees: { id: number; name: string }[];
  editable: boolean;
  hydrated: boolean;
  disabled: boolean;
  busy: boolean;
  onChange: (patch: Partial<LineDraft>) => void;
  onStartStop: (action: "start" | "stop") => void;
}) {
  // Iniciar / Detener actúan sobre lo guardado en Odoo.
  const running = Boolean(line.start && !line.end);
  const status = draft.is_done ? "Hecho" : draft.is_pending ? "Pendiente" : null;

  return (
    <li className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 text-sm font-semibold text-ink">{line.task || "Tarea sin nombre"}</span>
        <div className="flex shrink-0 items-center gap-2">
          {running && (
            <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
              <span className="size-1.5 animate-pulse rounded-full bg-accent" />
              En curso
            </span>
          )}
          <span className="text-xs tabular-nums text-muted">{formatHours(line.hours)}</span>
        </div>
      </div>

      {editable ? (
        <div className="mt-3 grid gap-3 md:grid-cols-[auto_minmax(0,1fr)] md:items-end">
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={draft.is_pending}
              disabled={disabled}
              onClick={() => onChange({ is_pending: !draft.is_pending, is_done: draft.is_pending ? draft.is_done : false })}
              className={toggleClass(draft.is_pending, "warning")}
            >
              Pendiente
            </button>
            <button
              type="button"
              aria-pressed={draft.is_done}
              disabled={disabled}
              onClick={() => onChange({ is_done: !draft.is_done, is_pending: draft.is_done ? draft.is_pending : false })}
              className={toggleClass(draft.is_done, "success")}
            >
              {draft.is_done && <CheckIcon className="size-4" />}
              Hecho
            </button>
          </div>
          <label className="min-w-0">
            <span className="text-xs font-medium text-muted">Empleado</span>
            <select
              value={draft.employee_id ?? ""}
              disabled={disabled}
              onChange={(event) => onChange({ employee_id: event.target.value ? Number(event.target.value) : null })}
              className={inputClass}
            >
              <option value="">Sin asignar</option>
              {/* Si el empleado asignado no está en la lista (otra empresa), se muestra igual. */}
              {line.employee_id && !employees.some((e) => e.id === line.employee_id) && (
                <option value={line.employee_id}>{line.employee_name}</option>
              )}
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end md:col-span-2">
            <label className="min-w-0">
              <span className="text-xs font-medium text-muted">Inicio</span>
              <input
                type="datetime-local"
                value={hydrated ? toLocalInput(draft.start) : ""}
                disabled={disabled || !hydrated}
                onChange={(event) => onChange({ start: fromLocalInput(event.target.value) })}
                className={inputClass}
              />
            </label>
            <label className="min-w-0">
              <span className="text-xs font-medium text-muted">Fin</span>
              <input
                type="datetime-local"
                value={hydrated ? toLocalInput(draft.end) : ""}
                disabled={disabled || !hydrated}
                onChange={(event) => onChange({ end: fromLocalInput(event.target.value) })}
                className={inputClass}
              />
            </label>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStartStop(running ? "stop" : "start")}
              className={`flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
                running
                  ? "bg-danger-soft text-danger hover:opacity-90"
                  : "border border-line text-ink hover:bg-surface-muted"
              }`}
            >
              {busy ? (
                <SpinnerIcon className="size-4 animate-spin" />
              ) : running ? (
                <StopIcon className="size-4" />
              ) : (
                <PlayIcon className="size-4" />
              )}
              {running ? "Detener" : "Iniciar"}
            </button>
          </div>
        </div>
      ) : (
        <dl className="mt-3 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Estado"
            value={
              status && (
                <span className={draft.is_done ? "text-success" : undefined}>{status}</span>
              )
            }
          />
          <Field label="Empleado" value={line.employee_name} />
          <Field label="Inicio" value={line.start && <LocalDateTime iso={line.start} />} />
          <Field label="Fin" value={line.end && <LocalDateTime iso={line.end} />} />
        </dl>
      )}
    </li>
  );
}
