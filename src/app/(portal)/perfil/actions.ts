"use server";

import { redirect } from "next/navigation";
import { odooChangePassword } from "@/lib/odoo";
import { getSession } from "@/lib/session";

export type ChangePasswordState = { error?: string; success?: string } | undefined;

const ERRORS = {
  unauthorized: "Tu sesión expiró. Cierra sesión y vuelve a entrar.",
  wrong_password: "La contraseña actual no es correcta.",
  too_short: "La nueva contraseña debe tener al menos 6 caracteres.",
  same_password: "La nueva contraseña debe ser distinta de la actual.",
  unavailable: "No se pudo conectar con el servidor. Inténtalo de nuevo.",
} as const;

export async function cambiarContrasena(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("new") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!current || !next) return { error: "Completa todos los campos." };
  if (next.length < 6) return { error: ERRORS.too_short };
  if (next !== confirm) return { error: "Las contraseñas nuevas no coinciden." };

  const result = await odooChangePassword(session.odooToken, current, next);
  if (!result.ok) return { error: ERRORS[result.error] };
  return { success: "Contraseña actualizada. Úsala la próxima vez que inicies sesión." };
}
