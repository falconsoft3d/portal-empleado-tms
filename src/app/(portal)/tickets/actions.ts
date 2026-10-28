"use server";

import { redirect } from "next/navigation";
import { odooCreateTicket, type Tickets } from "@/lib/odoo";
import { getSession } from "@/lib/session";

export type TicketFormState = {
  data?: Tickets;
  error?: string;
  success?: string;
  /** Cambia en cada envío correcto para reiniciar el formulario. */
  version: number;
};

const TICKET_ERRORS: Record<string, string> = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  missing_title: "Escribe un título para el ticket.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
};

export async function crearTicket(prev: TicketFormState, formData: FormData): Promise<TicketFormState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const title = String(formData.get("titulo") ?? "").trim().slice(0, 200);
  const description = String(formData.get("descripcion") ?? "").trim().slice(0, 2000);
  if (!title) return { ...prev, success: undefined, error: TICKET_ERRORS.missing_title };

  const result = await odooCreateTicket(session.odooToken, { titulo: title, descripcion: description });
  if (!result.ok) return { ...prev, success: undefined, error: TICKET_ERRORS[result.error] };
  return {
    data: result.data,
    success: "Ticket enviado. RRHH lo revisará y verás aquí su respuesta.",
    version: prev.version + 1,
  };
}
