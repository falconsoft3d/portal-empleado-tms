import { parseId, proxyOdooFile } from "@/lib/image-proxy";

export async function GET(_request: Request, ctx: RouteContext<"/api/resources/[id]/file">) {
  const id = parseId((await ctx.params).id);
  if (!id) return new Response("No encontrado", { status: 404 });
  return proxyOdooFile(`/tms/api/portal/resources/${id}/file`);
}
