"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { odooFinishContent, odooSignCertificate, odooSubmitActivity, type ActivityAnswers } from "@/lib/odoo";
import { getSession } from "@/lib/session";

const FINISH_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  not_found: "Este contenido ya no está disponible.",
  activities_pending: "Aprueba las actividades de este contenido para poder terminarlo.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

/** Marca el contenido como terminado y refresca el curso. Devuelve el mensaje de error, si lo hay. */
export async function terminarContenido(contentId: number): Promise<string | null> {
  const session = await getSession();
  if (!session) redirect("/login");
  if (!Number.isInteger(contentId) || contentId <= 0) return FINISH_ERRORS.not_found;
  const result = await odooFinishContent(session.odooToken, contentId);
  if (!result.ok) return FINISH_ERRORS[result.error];
  refresh();
  return null;
}

const SUBMIT_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  not_found: "Esta actividad ya no está disponible.",
  invalid_data: "No se pudieron leer tus respuestas. Recarga la página e inténtalo de nuevo.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

function sanitizeAnswers(answers: unknown): ActivityAnswers | null {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return null;
  const clean: ActivityAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!/^\d+$/.test(key)) continue;
    if (typeof value === "string") clean[key] = value.slice(0, 200);
    else if (typeof value === "boolean" || (typeof value === "number" && Number.isInteger(value))) clean[key] = value;
  }
  return clean;
}

export async function enviarActividad(activityId: number, answers: ActivityAnswers) {
  const session = await getSession();
  if (!session) redirect("/login");
  const clean = sanitizeAnswers(answers);
  if (!Number.isInteger(activityId) || activityId <= 0 || !clean) {
    return { ok: false as const, error: SUBMIT_ERRORS.invalid_data };
  }
  const result = await odooSubmitActivity(session.odooToken, activityId, clean);
  return result.ok ? result : { ok: false as const, error: SUBMIT_ERRORS[result.error] };
}

const SIGN_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  not_found: "No encontramos tu certificado de este curso.",
  already_signed: "El certificado ya está firmado.",
  invalid_signature: "No se pudo leer la firma. Vuelve a dibujarla.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

const PNG_DATA_URL = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/;

/** Firma el certificado con la imagen dibujada (data URL PNG) y refresca el curso. */
export async function firmarCertificado(courseId: number, dataUrl: string): Promise<string | null> {
  const session = await getSession();
  if (!session) redirect("/login");
  const match = typeof dataUrl === "string" && dataUrl.length < 700_000 ? PNG_DATA_URL.exec(dataUrl) : null;
  if (!Number.isInteger(courseId) || courseId <= 0 || !match) return SIGN_ERRORS.invalid_signature;
  const result = await odooSignCertificate(session.odooToken, courseId, match[1]);
  if (!result.ok) return SIGN_ERRORS[result.error];
  refresh();
  return null;
}
