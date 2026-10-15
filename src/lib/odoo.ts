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
export type AttendanceRecord = {
  id: number;
  start: string;
  end: string | null;
  task: { id: number; name: string } | null;
};

/** Tarea que el empleado puede elegir: asignada a él (`mine`) o para todos. */
export type AttendanceTask = { id: number; name: string; mine: boolean };

export type Attendance = {
  open: AttendanceRecord | null;
  today: AttendanceRecord[];
  tasks: AttendanceTask[];
};

export type Birthday = { id: number; name: string; job_title: string; day: number; has_image: boolean };

/** Cumpleaños del mes: `date` es hoy (YYYY-MM-DD) según la zona horaria del empleado. */
export type Birthdays = { date: string; today: Birthday[]; month: Birthday[] };

export type ConceptRequestState = "solicitado" | "aprobado" | "rechazado";

export type ConceptRequest = {
  id: number;
  name: string;
  concept: string;
  date: string;
  quantity: number;
  note: string;
  state: ConceptRequestState;
};

/** Conceptos que se pueden solicitar y últimas solicitudes del empleado. */
export type ConceptRequests = { concepts: { id: number; name: string }[]; requests: ConceptRequest[] };

export type ConceptRequestError = "unauthorized" | "invalid_concept" | "invalid_quantity" | "invalid_data" | "unavailable";

export type NewConceptRequest = { concepto_id: number; fecha: string | null; cantidad: number; nota: string };

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

/** Registra la entrada o la salida en Horas Portal, con la tarea elegida (opcional). */
export function odooRegisterAttendance(
  token: string,
  kind: "check_in" | "check_out",
  coords: Coords,
  taskId: number | null,
) {
  return attendanceRequest(`/tms/api/portal/attendance/${kind}`, token, {
    method: "POST",
    body: JSON.stringify({ ...coords, tarea_id: taskId }),
  });
}

/** Cumpleaños de hoy y del resto del mes. */
export async function odooGetBirthdays(token: string): Promise<Birthdays | null> {
  try {
    const { res, data } = await odooFetch("/tms/api/portal/birthdays", { method: "GET", token });
    if (res.ok && data?.ok) return { date: data.date, today: data.today, month: data.month };
    console.error("[odoo] cumpleaños: respuesta inesperada", res.status, data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[odoo] cumpleaños: no se pudo conectar", error);
  }
  return null;
}

async function conceptRequest(
  token: string,
  init: RequestInit,
): Promise<{ ok: true; data: ConceptRequests } | { ok: false; error: ConceptRequestError }> {
  try {
    const { res, data } = await odooFetch("/tms/api/portal/concept_requests", { ...init, token });
    if (res.ok && data?.ok) return { ok: true, data: data.data };
    if (res.status === 401) return { ok: false, error: "unauthorized" };
    if (res.status === 400 && ["invalid_concept", "invalid_quantity", "invalid_data"].includes(data?.error)) {
      return { ok: false, error: data.error };
    }
    console.error("[odoo] conceptos: respuesta inesperada", res.status, data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[odoo] conceptos: no se pudo conectar", error);
  }
  return { ok: false, error: "unavailable" };
}

export function odooGetConceptRequests(token: string) {
  return conceptRequest(token, { method: "GET" });
}

export function odooCreateConceptRequest(token: string, request: NewConceptRequest) {
  return conceptRequest(token, { method: "POST", body: JSON.stringify(request) });
}

export type NewsItem = { id: number; name: string; date: string; text: string; has_image: boolean };

/** Últimas noticias publicadas (Tablón de anuncios). */
export async function odooGetNews(token: string): Promise<NewsItem[] | null> {
  try {
    const { res, data } = await odooFetch("/tms/api/portal/news", { method: "GET", token });
    if (res.ok && data?.ok) return data.news;
    console.error("[odoo] noticias: respuesta inesperada", res.status, data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[odoo] noticias: no se pudo conectar", error);
  }
  return null;
}

/** Archivo binario de Odoo (imágenes) pedido con el token del empleado, o null si no existe. */
export async function odooGetBinary(token: string, path: string): Promise<Response | null> {
  try {
    const res = await fetch(odooUrl(path), {
      headers: odooHeaders(token),
      signal: AbortSignal.timeout(10_000),
    });
    return res.ok ? res : null;
  } catch (error) {
    console.error("[odoo] binario: no se pudo conectar", path, error);
    return null;
  }
}

export type ChangePasswordError = "unauthorized" | "wrong_password" | "too_short" | "same_password" | "unavailable";

/** Cambia la contraseña del portal (pestaña TMS Portal del empleado). */
export async function odooChangePassword(
  token: string,
  currentPassword: string,
  newPassword: string,
): Promise<{ ok: true } | { ok: false; error: ChangePasswordError }> {
  try {
    const { res, data } = await odooFetch("/tms/api/portal/change_password", {
      method: "POST",
      token,
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
    if (res.ok && data?.ok) return { ok: true };
    if (res.status === 401) return { ok: false, error: "unauthorized" };
    if (res.status === 400 && ["wrong_password", "too_short", "same_password"].includes(data?.error)) {
      return { ok: false, error: data.error };
    }
    console.error("[odoo] cambio de contraseña: respuesta inesperada", res.status, data);
  } catch (error) {
    unstable_rethrow(error);
    console.error("[odoo] cambio de contraseña: no se pudo conectar", error);
  }
  return { ok: false, error: "unavailable" };
}
