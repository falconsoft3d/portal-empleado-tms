import { parseId, proxyOdooImage } from "@/lib/image-proxy";

export async function GET(_request: Request, ctx: RouteContext<"/api/activity-questions/[id]/image/[n]">) {
  const { id, n } = await ctx.params;
  const questionId = parseId(id);
  const index = parseId(n);
  if (!questionId || !index || index > 3) return new Response("No encontrado", { status: 404 });
  return proxyOdooImage(`/tms/api/portal/activity_questions/${questionId}/image/${index}`, 3600);
}
