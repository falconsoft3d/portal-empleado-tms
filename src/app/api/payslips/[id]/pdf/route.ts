import { parseId, proxyOdooFile } from "@/lib/image-proxy";

/**
 * PDF del recibo de sueldo (solo los del propio empleado, validados o pagados).
 * Con `?ver=1` se sirve "inline" para abrirlo en una pestaña; si no, se descarga.
 */
export async function GET(request: Request, ctx: RouteContext<"/api/payslips/[id]/pdf">) {
  const id = parseId((await ctx.params).id);
  if (!id) return new Response("No encontrado", { status: 404 });
  const res = await proxyOdooFile(`/tms/api/portal/payslips/${id}/pdf`, 60_000);
  if (new URL(request.url).searchParams.get("ver") === "1") {
    const disposition = res.headers.get("Content-Disposition");
    if (disposition) res.headers.set("Content-Disposition", disposition.replace(/^attachment/i, "inline"));
  }
  return res;
}
