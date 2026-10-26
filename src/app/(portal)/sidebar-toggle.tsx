"use client";

import { MenuIcon } from "@/components/icons";

/** Oculta / muestra el menú lateral (solo escritorio) y lo recuerda en este navegador. */
export function SidebarToggle() {
  function toggle() {
    const root = document.documentElement;
    const hidden = root.dataset.sidebar === "hidden";
    if (hidden) delete root.dataset.sidebar;
    else root.dataset.sidebar = "hidden";
    try {
      localStorage.setItem("sidebar", hidden ? "visible" : "hidden");
    } catch {
      // Sin almacenamiento (modo privado): el cambio dura hasta recargar.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Ocultar o mostrar el menú lateral"
      title="Ocultar / mostrar menú"
      className="hidden size-9 shrink-0 place-items-center rounded-lg border border-line text-muted transition hover:bg-surface-muted hover:text-ink lg:grid"
    >
      <MenuIcon className="size-4" />
    </button>
  );
}
