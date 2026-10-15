import { parseId, proxyOdooImage } from "@/lib/image-proxy";

export async function GET(_request: Request, ctx: RouteContext<"/api/news/[id]/image">) {
  const id = parseId((await ctx.params).id);
  if (!id) return new Response("No encontrado", { status: 404 });
  return proxyOdooImage(`/tms/api/portal/news/${id}/image`, 3600);
}
