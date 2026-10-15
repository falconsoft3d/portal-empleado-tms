import { odooGetBinary } from "./odoo";
import { getSession } from "./session";

/**
 * Reenvía una imagen de Odoo al navegador. Las imágenes de Odoo requieren el token del empleado,
 * que solo vive en la sesión (cookie httpOnly), así que se piden desde el servidor.
 */
export async function proxyOdooImage(odooPath: string, maxAgeSeconds: number) {
  const session = await getSession();
  if (!session) return new Response("No autorizado", { status: 401 });

  const image = await odooGetBinary(session.odooToken, odooPath);
  if (!image?.body) return new Response("No encontrado", { status: 404 });

  return new Response(image.body, {
    headers: {
      "Content-Type": image.headers.get("Content-Type") ?? "image/png",
      "Cache-Control": `private, max-age=${maxAgeSeconds}`,
    },
  });
}

export function parseId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}
