import { NextResponse, type NextRequest } from "next/server";
import { odooPortalSso } from "@/lib/odoo";
import { createSession } from "@/lib/session";

/** Autologin desde Odoo: `/sso?ticket=...` abre la sesión del empleado y entra al portal. */
export async function GET(request: NextRequest) {
  const ticket = request.nextUrl.searchParams.get("ticket") ?? "";
  const result = ticket ? await odooPortalSso(ticket) : null;
  if (!result?.ok) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }

  const { employee, token } = result;
  await createSession({
    employeeId: employee.id,
    name: employee.name,
    jobTitle: employee.job_title,
    company: employee.company,
    odooToken: token,
  });
  return NextResponse.redirect(new URL("/", request.nextUrl));
}
