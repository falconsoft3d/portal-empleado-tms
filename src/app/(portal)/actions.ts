"use server";

import { redirect } from "next/navigation";
import {
  odooCreateConceptRequest,
  odooRegisterAttendance,
  type AttendanceResult,
  type ConceptRequests,
  type Coords,
} from "@/lib/odoo";
import { deleteSession, getSession } from "@/lib/session";

export async function logout() {
  await deleteSession();
  redirect("/login");
}

function sanitizeCoords(coords: Coords): Coords {
  if (!coords) return null;
  const { latitude, longitude } = coords;
  const valid =
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
  return valid ? { latitude, longitude } : null;
}

async function registerAttendance(
  kind: "check_in" | "check_out",
  coords: Coords,
  taskId: number | null,
): Promise<AttendanceResult> {
  const session = await getSession();
  if (!session) redirect("/login");
  const task = Number.isInteger(taskId) && taskId! > 0 ? taskId : null;
  return odooRegisterAttendance(session.odooToken, kind, sanitizeCoords(coords), task);
}

export async function registrarEntrada(coords: Coords, taskId: number | null) {
  return registerAttendance("check_in", coords, taskId);
}

export async function registrarSalida(coords: Coords, taskId: number | null) {
  return registerAttendance("check_out", coords, taskId);
}

export type ConceptRequestFormState = {
  data?: ConceptRequests;
  error?: string;
  success?: string;
  /** Cambia en cada envío correcto para reiniciar el formulario. */
  version: number;
};

const CONCEPT_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  invalid_concept: "Elige un concepto válido.",
  invalid_quantity: "La cantidad debe ser mayor a cero.",
  invalid_data: "Revisa los datos de la solicitud.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

export async function solicitarConcepto(
  prev: ConceptRequestFormState,
  formData: FormData,
): Promise<ConceptRequestFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const conceptId = Number(formData.get("concepto_id"));
  const quantity = Number(String(formData.get("cantidad") ?? "").replace(",", "."));
  const date = String(formData.get("fecha") ?? "");
  const note = String(formData.get("nota") ?? "").trim();

  if (!Number.isInteger(conceptId) || conceptId <= 0) return { ...prev, success: undefined, error: CONCEPT_ERRORS.invalid_concept };
  if (!Number.isFinite(quantity) || quantity <= 0) return { ...prev, success: undefined, error: CONCEPT_ERRORS.invalid_quantity };

  const result = await odooCreateConceptRequest(session.odooToken, {
    concepto_id: conceptId,
    cantidad: quantity,
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null,
    nota: note,
  });
  if (!result.ok) return { ...prev, success: undefined, error: CONCEPT_ERRORS[result.error] };
  return { data: result.data, success: "Solicitud enviada. Te avisaremos cuando la revisen.", version: prev.version + 1 };
}
