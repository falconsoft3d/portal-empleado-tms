import type { ActivityType } from "@/lib/odoo";

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  examen: "Examen",
  completar: "Completar la frase",
  imagen: "Elegir la imagen",
  verdadero_falso: "Verdadero o falso",
  ordenar: "Ordenar los pasos",
  relacionar: "Relacionar parejas",
};
