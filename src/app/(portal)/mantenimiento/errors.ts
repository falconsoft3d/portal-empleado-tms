import type { MaintenanceError } from "@/lib/odoo";

/** Mensaje cuando no se puede cargar la lista o una ficha. */
export function maintenanceLoadError(error: MaintenanceError) {
  if (error === "forbidden") {
    return "Esta sección es solo para los Responsables de Mantenimiento. Si deberías tener acceso, consulta con tu supervisor.";
  }
  if (error === "unauthorized") return "Tu sesión expiró. Cierra sesión y vuelve a entrar.";
  return "No se pudieron cargar las fichas de mantenimiento. Vuelve a intentarlo en unos minutos.";
}
