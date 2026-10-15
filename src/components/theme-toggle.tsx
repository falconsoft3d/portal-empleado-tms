"use client";

import { MoonIcon, SunIcon } from "./icons";

/** Alterna claro / oscuro y lo recuerda en este navegador. Sin elección, sigue al sistema. */
export function ThemeToggle({ className = "" }: { className?: string }) {
  function toggle() {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      // Sin almacenamiento (modo privado): el cambio dura hasta recargar.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Cambiar entre modo claro y oscuro"
      title="Modo claro / oscuro"
      className={`grid size-9 place-items-center rounded-lg border border-line text-muted transition hover:bg-surface-muted hover:text-ink ${className}`}
    >
      <MoonIcon className="size-4 dark:hidden" />
      <SunIcon className="hidden size-4 dark:block" />
    </button>
  );
}
