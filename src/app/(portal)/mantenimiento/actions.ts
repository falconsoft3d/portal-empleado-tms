"use server";

import { redirect } from "next/navigation";
import {
  odooMaintenanceLineAction,
  odooMaintenanceState,
  odooSaveMaintenanceOrder,
  type MaintenanceChanges,
  type MaintenanceLineChange,
  type MaintenanceOrderDetail,
  type MaintenanceResult,
} from "@/lib/odoo";
import { getSession } from "@/lib/session";

/** Resultado para la ficha: `data` es la ficha actualizada (también si falló el cambio de estado tras guardar). */
export type MaintenanceActionResult =
  | { ok: true; data: MaintenanceOrderDetail }
  | { ok: false; error: string; data?: MaintenanceOrderDetail };

const MAINTENANCE_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  forbidden: "Solo los Responsables de Mantenimiento pueden trabajar las fichas.",
  not_found: "Esta ficha ya no está disponible.",
  not_editable: "La ficha ya no se puede modificar en su estado actual.",
  invalid_value: "Algún dato no es válido. Revisa las fechas y vuelve a intentarlo.",
  invalid_action: "Esa acción no se puede realizar en el estado actual de la ficha. Recarga la página.",
  validation: "Odoo rechazó los cambios. Revisa los datos de la ficha.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

function errorMessage(result: Extract<MaintenanceResult<unknown>, { ok: false }>) {
  return (result.error === "validation" && result.message) || MAINTENANCE_ERRORS[result.error];
}

const isId = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0;

function cleanDate(value: unknown) {
  if (value === null || value === "") return null;
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return undefined;
  return new Date(value).toISOString();
}

/** Deja solo las claves conocidas y con el tipo correcto: los datos vienen del navegador. */
function sanitizeChanges(changes: unknown): MaintenanceChanges | null {
  if (!changes || typeof changes !== "object" || Array.isArray(changes)) return null;
  const input = changes as Record<string, unknown>;
  const clean: MaintenanceChanges = {};
  if (Array.isArray(input.lines)) {
    const lines: MaintenanceLineChange[] = [];
    for (const raw of input.lines.slice(0, 500)) {
      if (!raw || typeof raw !== "object") continue;
      const item = raw as Record<string, unknown>;
      if (!isId(item.id)) continue;
      const line: MaintenanceLineChange = { id: item.id };
      if (typeof item.is_pending === "boolean") line.is_pending = item.is_pending;
      if (typeof item.is_done === "boolean") line.is_done = item.is_done;
      if (item.employee_id === null || isId(item.employee_id)) line.employee_id = item.employee_id;
      for (const key of ["start", "end"] as const) {
        if (!(key in item)) continue;
        const date = cleanDate(item[key]);
        if (date === undefined) return null;
        line[key] = date;
      }
      lines.push(line);
    }
    clean.lines = lines;
  }
  if (typeof input.notes === "string") clean.notes = input.notes.slice(0, 5000);
  if (typeof input.productos_cargados === "boolean") clean.productos_cargados = input.productos_cargados;
  return clean;
}

async function token() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session.odooToken;
}

/** Guarda las tareas, notas y Productos Cargados de la ficha. */
export async function guardarFicha(orderId: number, changes: MaintenanceChanges): Promise<MaintenanceActionResult> {
  const odooToken = await token();
  const clean = sanitizeChanges(changes);
  if (!isId(orderId) || !clean) return { ok: false, error: MAINTENANCE_ERRORS.invalid_value };
  const result = await odooSaveMaintenanceOrder(odooToken, orderId, clean);
  return result.ok ? result : { ok: false, error: errorMessage(result) };
}

/** Iniciar (inicio = ahora) o Detener (fin = ahora) una tarea. */
export async function iniciarDetenerTarea(
  orderId: number,
  lineId: number,
  action: "start" | "stop",
): Promise<MaintenanceActionResult> {
  const odooToken = await token();
  if (!isId(orderId) || !isId(lineId) || (action !== "start" && action !== "stop")) {
    return { ok: false, error: MAINTENANCE_ERRORS.invalid_action };
  }
  const result = await odooMaintenanceLineAction(odooToken, orderId, lineId, action);
  return result.ok ? result : { ok: false, error: errorMessage(result) };
}

/**
 * Pasa la ficha a En Reparación o Finalizada. Si hay cambios sin guardar se guardan antes,
 * porque Odoo valida lo guardado (empleados asignados, Productos Cargados, fechas…).
 */
export async function cambiarEstadoFicha(
  orderId: number,
  action: "repair" | "finalize",
  changes: MaintenanceChanges | null,
): Promise<MaintenanceActionResult> {
  const odooToken = await token();
  if (!isId(orderId) || (action !== "repair" && action !== "finalize")) {
    return { ok: false, error: MAINTENANCE_ERRORS.invalid_action };
  }
  let saved: MaintenanceOrderDetail | undefined;
  if (changes) {
    const clean = sanitizeChanges(changes);
    if (!clean) return { ok: false, error: MAINTENANCE_ERRORS.invalid_value };
    const result = await odooSaveMaintenanceOrder(odooToken, orderId, clean);
    if (!result.ok) return { ok: false, error: errorMessage(result) };
    saved = result.data;
  }
  const result = await odooMaintenanceState(odooToken, orderId, action);
  return result.ok ? result : { ok: false, error: errorMessage(result), data: saved };
}
