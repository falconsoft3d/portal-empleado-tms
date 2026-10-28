"use server";

import { redirect } from "next/navigation";
import { odooCreateAbsenceRequest, type AbsenceAttachment, type Absences } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { MAX_ATTACHMENTS, MAX_ATTACHMENTS_BYTES } from "./limits";

export type AbsenceFormState = {
  data?: Absences;
  error?: string;
  success?: string;
  /** Cambia en cada envío correcto para reiniciar el formulario. */
  version: number;
};

const ABSENCE_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  invalid_type: "Elige el tipo de ausencia.",
  invalid_dates: "Revisa las fechas: la fecha hasta no puede ser anterior a la fecha desde.",
  invalid_attachment: `Los adjuntos deben ser PDF o imágenes: hasta ${MAX_ATTACHMENTS} archivos y 4 MB en total.`,
  overlap: "Ya tienes una solicitud de ausencia o de vacaciones que se superpone con esas fechas.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isAllowedFile(file: File) {
  return file.type === "application/pdf" || file.type.startsWith("image/");
}

export async function solicitarAusencia(prev: AbsenceFormState, formData: FormData): Promise<AbsenceFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const conceptId = Number(formData.get("concepto_id"));
  const start = String(formData.get("fecha_desde") ?? "");
  const end = String(formData.get("fecha_hasta") ?? "");
  const description = String(formData.get("descripcion") ?? "").trim().slice(0, 2000);
  // Un input de archivo vacío envía un File sin nombre ni contenido.
  const files = formData.getAll("adjuntos").filter((file): file is File => file instanceof File && file.size > 0);

  if (!Number.isInteger(conceptId) || conceptId <= 0) {
    return { ...prev, success: undefined, error: ABSENCE_ERRORS.invalid_type };
  }
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || end < start) {
    return { ...prev, success: undefined, error: ABSENCE_ERRORS.invalid_dates };
  }
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (files.length > MAX_ATTACHMENTS || totalBytes > MAX_ATTACHMENTS_BYTES || !files.every(isAllowedFile)) {
    return { ...prev, success: undefined, error: ABSENCE_ERRORS.invalid_attachment };
  }

  const adjuntos: AbsenceAttachment[] = await Promise.all(
    files.map(async (file) => ({ nombre: file.name, datos: Buffer.from(await file.arrayBuffer()).toString("base64") })),
  );
  const result = await odooCreateAbsenceRequest(session.odooToken, {
    concepto_id: conceptId,
    fecha_desde: start,
    fecha_hasta: end,
    descripcion: description,
    adjuntos,
  });
  if (!result.ok) return { ...prev, success: undefined, error: ABSENCE_ERRORS[result.error] };
  return {
    data: result.data,
    success: "Solicitud enviada. RRHH la revisará y verás aquí cuando esté aprobada.",
    version: prev.version + 1,
  };
}
