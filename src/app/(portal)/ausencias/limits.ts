/** Límites de los adjuntos de una ausencia (los mismos que valida Odoo). */
export const MAX_ATTACHMENTS = 3;
/** Vercel no acepta cuerpos de más de ~4,5 MB: el total de los adjuntos se limita a 4 MB. */
export const MAX_ATTACHMENTS_BYTES = 4 * 1024 * 1024;
