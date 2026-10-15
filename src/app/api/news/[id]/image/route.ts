import { odooGetNewsImage } from "@/lib/odoo";
import { getSession } from "@/lib/session";

/** Reenvía la imagen de una noticia desde Odoo (las imágenes de Odoo requieren el token del empleado). */
export async function GET(_request: Request, ctx: RouteContext<"/api/news/[id]/image">) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const id = Number((await ctx.params).id);
  if (!Number.isInteger(id) || id <= 0) return new Response("No encontrado", { status: 404 });

  const image = await odooGetNewsImage(session.odooToken, id);
  if (!image?.body) return new Response("No encontrado", { status: 404 });

  return new Response(image.body, {
    headers: {
      "Content-Type": image.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
