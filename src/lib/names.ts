/** Iniciales para el avatar (máximo dos). */
export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Los nombres vienen como "APELLIDO Nombre": toma el primer nombre. */
export function firstName(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return words.find((word) => word !== word.toUpperCase()) ?? words[0] ?? "";
}
