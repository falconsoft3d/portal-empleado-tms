import { unstable_rethrow } from "next/navigation";

export type OdooEmployee = {
  id: number;
  name: string;
  job_title: string;
  department: string;
  company: string;
  work_email: string;
};

export type LoginResult =
  | { ok: true; employee: OdooEmployee; token: string }
  | { ok: false; error: "invalid_credentials" | "unavailable" };

/** Registro de Horas Portal. Fechas ISO en UTC. */
export type AttendanceRecord = { id: number; start: string; end: string | null };

export type Attendance = {
  open: AttendanceRecord | null;
  today: AttendanceRecord[];
};

export type AttendanceError = "unauthorized" | "already_checked_in" | "not_checked_in" | "unavailable";

export type AttendanceResult =
  | { ok: true; attendance: Attendance }
  | { ok: false; error: AttendanceError; attendance?: Attendance };

export type Coords = { latitude: number; longitude: number } | null;

function odooUrl(path: string) {
  const base = process.env.ODOO_URL;
  if (!base) throw new Error("ODOO_URL no está definida");
  const url = new URL(path, base);
  if (process.env.ODOO_DB) url.searchParams.set("db", process.env.ODOO_DB);
  return url;
}

function odooHeaders(token?: string): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.ODOO_PORTAL_API_KEY) headers["X-TMS-Portal-Key"] = process.env.ODOO_PORTAL_API_KEY;
  if (token) headers["X-TMS-Portal-Token"] = token;
  return headers;
}

async function odooFetch(path: string, init: RequestInit & { token?: string }) {
  const { token, ...rest } = init;
  const res = await fetch(odooUrl(path), {
    ...rest,
    headers: odooHeaders(token),
    signal: AbortSignal.timeout(10_000),
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

/** Valida las credenciales de la pestaña "TMS Portal" del empleado en Odoo. */
export async function odooPortalLogin(username: string, password: string): Promise<LoginResult> {
  try {
    const { res, data } = await odooFetch("/tms/api/portal/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    if (res.ok && data?.ok) return { ok: true, employee: data.employee, token: data.token };
    if (res.status === 401 && data?.error === "invalid_credentials") {
      return { ok: false, error: "invalid_credentials" };
    }
    console.error("[odoo] login: respuesta inesperada", res.status, data);
  } catch (error) {
    // Errores internos de Next (p. ej. fin del prerender) no se deben tragar.
    unstable_rethrow(error);
    console.error("[odoo] login: no se pudo conectar", error);
  }
  return { ok: false, error: "unavailable" };
}

async function attendanceRequest(path: string, token: string, init: RequestInit): Promise<AttendanceResult> {
  try {
    const { res, data } = await odooFetch(path, { ...init, token });
    if (res.ok && data?.ok) return { ok: true, attendance: data.attendance };
    if (res.status === 401) return { ok: false, error: "unauthorized" };
    if (res.status === 409 && (data?.error === "already_checked_in" || data?.error === "not_checked_in")) {
      return { ok: false, error: data.error, attendance: data.attendance };
    }
    console.error("[odoo] asistencia: respuesta inesperada", path, res.status, data);
  } catch (error) {
    // Errores internos de Next (p. ej. fin del prerender) no se deben tragar.
    unstable_rethrow(error);
    console.error("[odoo] asistencia: no se pudo conectar", path, error);
  }
  return { ok: false, error: "unavailable" };
}

/** Fichada abierta y registros de hoy del empleado. */
export function odooGetAttendance(token: string) {
  return attendanceRequest("/tms/api/portal/attendance", token, { method: "GET" });
}

/** Registra la entrada o la salida en Horas Portal. */
export function odooRegisterAttendance(token: string, kind: "check_in" | "check_out", coords: Coords) {
  return attendanceRequest(`/tms/api/portal/attendance/${kind}`, token, {
    method: "POST",
    body: JSON.stringify(coords ?? {}),
  });
}
