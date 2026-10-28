"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarIcon, DashboardIcon, GraduationCapIcon, UserIcon } from "@/components/icons";

const ITEMS = [
  { href: "/", label: "Dashboard", Icon: DashboardIcon },
  { href: "/capacitacion", label: "Capacitación", Icon: GraduationCapIcon },
  { href: "/vacaciones", label: "Vacaciones", Icon: CalendarIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
] as const;

/** La ruta raíz solo se marca activa en sí misma; el resto también en sus subpáginas. */
function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Menú del portal: barra lateral en escritorio y barra de pestañas inferior en móvil.
 * `usePathname` se suspende al prerenderizar rutas con parámetros dinámicos (p. ej. /capacitacion/[id]),
 * así que mientras tanto se muestra el mismo menú sin ítem activo.
 */
export function SidebarNav() {
  return (
    <Suspense fallback={<Nav pathname={null} />}>
      <ActiveNav />
    </Suspense>
  );
}

function ActiveNav() {
  return <Nav pathname={usePathname()} />;
}

function Nav({ pathname }: { pathname: string | null }) {
  return (
    <>
      <nav
        aria-label="Menú principal"
        className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-surface px-3 py-4 lg:flex lg:sidebar-hidden:hidden"
      >
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Menú</p>
        <ul className="space-y-1">
          {ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface-muted hover:text-ink"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <nav
        aria-label="Menú principal"
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-surface/95 backdrop-blur lg:hidden"
      >
        {ITEMS.map(({ href, label, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${
                active ? "text-accent" : "text-muted"
              }`}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
