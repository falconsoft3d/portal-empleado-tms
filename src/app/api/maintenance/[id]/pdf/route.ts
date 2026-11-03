import { parseId, proxyOdooFile } from "@/lib/image-proxy";

/**
 * PDF de la Ficha Mecánica (solo para su Responsable de Mantenimiento).
 * Se sirve "inline" para que el botón Imprimir lo abra en una pestaña nueva en lugar de descargarlo.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/maintenance/[id]/pdf">) {
  const id = parseId((await ctx.params).id);
  if (!id) return new Response("No encontrado", { status: 404 });
  const res = await proxyOdooFile(`/tms/api/portal/maintenance/${id}/pdf`, 60_000);
  const disposition = res.headers.get("Content-Disposition");
  if (disposition) res.headers.set("Content-Disposition", disposition.replace(/^attachment/i, "inline"));
  return res;
}
