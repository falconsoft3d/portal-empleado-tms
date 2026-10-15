"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BuildingIcon, LogoutIcon, MapPinIcon, PlayIcon, SpinnerIcon } from "@/components/icons";
import type { Attendance, AttendanceError, AttendanceRecord, Coords } from "@/lib/odoo";
import { registrarEntrada, registrarSalida } from "./actions";

const ERRORS: Record<AttendanceError, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  already_checked_in: "Ya tenías una entrada registrada.",
  not_checked_in: "No hay una entrada abierta para registrar la salida.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 1000);
  return () => clearInterval(id);
}

/** Segundos actuales; null durante el render en servidor. */
function useNowSeconds() {
  return useSyncExternalStore(subscribe, () => Math.floor(Date.now() / 1000), () => null);
}

function seconds(iso: string) {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function formatDuration(total: number) {
  const s = Math.max(0, total);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor((s % 3600) / 60))}:${pad(s % 60)}`;
}

function formatHour(iso: string) {
  return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function recordSeconds(record: AttendanceRecord, now: number) {
  return (record.end ? seconds(record.end) : now) - seconds(record.start);
}

function getPosition(): Promise<Coords> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
}

export function TimeClock({
  initial,
  initialError,
}: {
  initial: Attendance | null;
  initialError: AttendanceError | null;
}) {
  const [attendance, setAttendance] = useState(initial);
  const [locating, setLocating] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(initialError ? ERRORS[initialError] : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [taskId, setTaskId] = useState<string>(initial?.open?.task ? String(initial.open.task.id) : "");
  const [comment, setComment] = useState("");
  const now = useNowSeconds();
  const router = useRouter();

  const open = attendance?.open ?? null;
  const today = attendance?.today ?? [];
  const tasks = attendance?.tasks ?? [];
  const myTasks = tasks.filter((task) => task.mine);
  const sharedTasks = tasks.filter((task) => !task.mine);
  const busy = locating || pending;

  function applyAttendance(next: Attendance) {
    setAttendance(next);
    setTaskId(next.open?.task ? String(next.open.task.id) : "");
  }

  const display =
    now === null
      ? "--:--:--"
      : formatDuration(open ? now - seconds(open.start) : today.reduce((acc, r) => acc + recordSeconds(r, now), 0));

  async function handleClick() {
    setError(null);
    setNotice(null);
    setLocating(true);
    const coords = await getPosition();
    setLocating(false);
    startTransition(async () => {
      const task = taskId ? Number(taskId) : null;
      const result = await (open ? registrarSalida(coords, task, comment) : registrarEntrada(coords, task, comment));
      if (result.ok) {
        applyAttendance(result.attendance);
        setComment("");
        router.refresh(); // actualiza el calendario mensual
        if (!coords) setNotice("Registrado sin ubicación: no se pudo obtener tu posición.");
      } else {
        if (result.attendance) applyAttendance(result.attendance);
        setError(ERRORS[result.error]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Cronómetro</h2>
        <div className="rounded-xl border border-line p-4 text-center">
          <p className="text-3xl font-semibold tabular-nums tracking-tight text-ink" suppressHydrationWarning>
            {display}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
            {open ? (
              <>
                <span className="size-2 rounded-full bg-success" /> En jornada desde {formatHour(open.start)}
              </>
            ) : today.length ? (
              "Total trabajado hoy"
            ) : (
              "Sin registros hoy"
            )}
          </p>

          {tasks.length > 0 && (
            <label className="mt-4 block text-left">
              <span className="text-xs font-medium text-muted">
                {open ? "¿En qué tarea trabajaste?" : "¿En qué tarea vas a trabajar?"} (opcional)
              </span>
              <select
                value={taskId}
                onChange={(event) => setTaskId(event.target.value)}
                disabled={busy}
                className="mt-1 h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15"
              >
                <option value="">Sin tarea</option>
                {myTasks.length > 0 && (
                  <optgroup label="Mis tareas">
                    {myTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </optgroup>
                )}
                {sharedTasks.length > 0 && (
                  <optgroup label="Para todos">
                    {sharedTasks.map((task) => (
                      <option key={task.id} value={task.id}>
                        {task.name}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </label>
          )}

          <label className="mt-3 block text-left">
            <span className="text-xs font-medium text-muted">Comentario (opcional)</span>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              disabled={busy || !attendance}
              rows={2}
              maxLength={1000}
              placeholder={open ? "Ej.: Terminé la carga sin novedades." : "Ej.: Empiezo en planta norte."}
              className="mt-1 w-full resize-none rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-accent focus:ring-4 focus:ring-accent/15"
            />
          </label>

          <div className="mt-4 flex items-center gap-2">
            <span
              className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                open ? "bg-accent-soft text-accent" : "border border-line text-muted"
              }`}
              title={open ? "En jornada" : "Fuera de jornada"}
            >
              <BuildingIcon className="size-4" />
            </span>
            <button
              type="button"
              onClick={handleClick}
              disabled={busy || !attendance}
              className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-xl text-sm font-medium transition disabled:cursor-wait disabled:opacity-70 ${
                open
                  ? "border border-danger/30 bg-danger-soft text-danger hover:bg-danger/10"
                  : "bg-primary text-white hover:bg-primary-hover"
              }`}
            >
              {busy ? (
                <SpinnerIcon className="size-4 animate-spin" />
              ) : open ? (
                <LogoutIcon className="size-4" />
              ) : (
                <PlayIcon className="size-4" />
              )}
              {locating ? "Obteniendo ubicación…" : pending ? "Registrando…" : open ? "Registrar salida" : "Registrar entrada"}
            </button>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
            {error}
          </p>
        )}
        {notice && !error && (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-warning-soft px-3 py-2 text-xs text-ink">
            <MapPinIcon className="size-3.5 shrink-0" /> {notice}
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Mis registros de hoy</h2>
        {today.length ? (
          <ul className="space-y-2">
            {today.map((record) => (
              <li
                key={record.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block tabular-nums text-ink">
                    {formatHour(record.start)} → {record.end ? formatHour(record.end) : "en curso"}
                  </span>
                  {record.task && <span className="block truncate text-xs text-muted">{record.task.name}</span>}
                  {record.comment && (
                    <span className="block truncate text-xs italic text-muted" title={record.comment}>
                      “{record.comment}”
                    </span>
                  )}
                </span>
                <span className="shrink-0 whitespace-nowrap tabular-nums text-xs text-muted" suppressHydrationWarning>
                  {now === null ? "" : formatDuration(recordSeconds(record, now)).slice(0, 5)} h
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">Todavía no registraste entradas hoy.</p>
        )}
      </section>
    </div>
  );
}
