import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "tms_portal_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8;

export type SessionPayload = {
  employeeId: number;
  name: string;
  jobTitle: string;
  company: string;
  /** Token firmado por Odoo para las llamadas del empleado. */
  odooToken: string;
};

function secretKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET debe definirse con al menos 32 caracteres");
  }
  return new TextEncoder().encode(secret);
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function decrypt(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const key = secretKey();
  try {
    const { payload } = await jwtVerify<SessionPayload>(token, key, { algorithms: ["HS256"] });
    // Sesiones anteriores sin token de Odoo: obligan a volver a iniciar sesión.
    if (typeof payload.odooToken !== "string") return null;
    return {
      employeeId: payload.employeeId,
      name: payload.name,
      jobTitle: payload.jobTitle,
      company: payload.company,
      odooToken: payload.odooToken,
    };
  } catch {
    return null;
  }
}
