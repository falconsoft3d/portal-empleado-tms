"use server";

import { redirect } from "next/navigation";
import { odooCreateVacationRequest, type Vacations } from "@/lib/odoo";
import { getSession } from "@/lib/session";

export type VacationFormState = {
  data?: Vacations;
  error?: string;
  success?: string;
  /** Cambia en cada envío correcto para reiniciar el formulario. */
  version: number;
};

const VACATION_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  invalid_dates: "Revisa las fechas: la fecha hasta no puede ser anterior a la fecha desde.",
  past_dates: "No puedes solicitar vacaciones que empiecen antes de hoy.",
  overlap: "Ya tienes una solicitud de vacaciones que se superpone con esas fechas.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export async function solicitarVacaciones(prev: VacationFormState, formData: FormData): Promise<VacationFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const start = String(formData.get("fecha_desde") ?? "");
  const end = String(formData.get("fecha_hasta") ?? "");
  const description = String(formData.get("descripcion") ?? "").trim().slice(0, 2000);
  if (!ISO_DATE.test(start) || !ISO_DATE.test(end) || end < start) {
    return { ...prev, success: undefined, error: VACATION_ERRORS.invalid_dates };
  }

  const result = await odooCreateVacationRequest(session.odooToken, {
    fecha_desde: start,
    fecha_hasta: end,
    descripcion: description,
  });
  if (!result.ok) return { ...prev, success: undefined, error: VACATION_ERRORS[result.error] };
  return {
    data: result.data,
    success: "Solicitud enviada. RRHH la revisará y verás aquí cuando esté aprobada.",
    version: prev.version + 1,
  };
}
