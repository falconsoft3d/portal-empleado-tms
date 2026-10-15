"use server";

import { redirect } from "next/navigation";
import { odooPortalLogin } from "@/lib/odoo";
import { createSession } from "@/lib/session";

export type LoginState = { error: string; username: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Introduce tu usuario y contraseña.", username };
  }

  const result = await odooPortalLogin(username, password);
  if (!result.ok) {
    return {
      error:
        result.error === "invalid_credentials"
          ? "Usuario o contraseña incorrectos."
          : "No se pudo conectar con el servidor. Inténtalo de nuevo en unos minutos.",
      username,
    };
  }

  const { employee } = result;
  await createSession({
    employeeId: employee.id,
    name: employee.name,
    jobTitle: employee.job_title,
    company: employee.company,
  });
  redirect("/");
}
