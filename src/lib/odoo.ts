export type OdooEmployee = {
  id: number;
  name: string;
  job_title: string;
  department: string;
  company: string;
  work_email: string;
};

export type LoginResult =
  | { ok: true; employee: OdooEmployee }
  | { ok: false; error: "invalid_credentials" | "unavailable" };

function odooUrl(path: string) {
  const base = process.env.ODOO_URL;
  if (!base) throw new Error("ODOO_URL no está definida");
  const url = new URL(path, base);
  if (process.env.ODOO_DB) url.searchParams.set("db", process.env.ODOO_DB);
  return url;
}

function odooHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ODOO_PORTAL_API_KEY) headers["X-TMS-Portal-Key"] = process.env.ODOO_PORTAL_API_KEY;
  return headers;
}

/** Valida las credenciales de la pestaña "TMS Portal" del empleado en Odoo. */
export async function odooPortalLogin(username: string, password: string): Promise<LoginResult> {
  let res: Response;
  try {
    res = await fetch(odooUrl("/tms/api/portal/login"), {
      method: "POST",
      headers: odooHeaders(),
      body: JSON.stringify({ username, password }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    console.error("[odoo] login: no se pudo conectar", error);
    return { ok: false, error: "unavailable" };
  }

  const data = await res.json().catch(() => null);
  if (res.ok && data?.ok) return { ok: true, employee: data.employee };
  if (res.status === 401 && data?.error === "invalid_credentials") {
    return { ok: false, error: "invalid_credentials" };
  }
  console.error("[odoo] login: respuesta inesperada", res.status, data);
  return { ok: false, error: "unavailable" };
}
