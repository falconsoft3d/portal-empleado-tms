"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarIcon,
  DashboardIcon,
  GraduationCapIcon,
  ReceiptIcon,
  TicketIcon,
  UserIcon,
  UserXIcon,
  WrenchIcon,
} from "@/components/icons";

type NavItem = {
  href: string;
  label: string;
  /** Texto de la barra inferior en móvil, si el nombre completo no entra. */
  shortLabel?: string;
  Icon: typeof DashboardIcon;
};

const ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", Icon: DashboardIcon },
  { href: "/capacitacion", label: "Capacitación", Icon: GraduationCapIcon },
  { href: "/vacaciones", label: "Vacaciones", Icon: CalendarIcon },
  { href: "/ausencias", label: "Ausencias", Icon: UserXIcon },
  { href: "/recibos", label: "Recibos de sueldo", shortLabel: "Recibos", Icon: ReceiptIcon },
  { href: "/tickets", label: "Tickets", Icon: TicketIcon },
  { href: "/perfil", label: "Perfil", Icon: UserIcon },
];

/** Solo para los Responsables de Mantenimiento; va antes de Perfil. */
const MAINTENANCE_ITEM: NavItem = { href: "/mantenimiento", label: "Mantenimiento", shortLabel: "Mant.", Icon: WrenchIcon };

function navItems(maintenance: boolean) {
  return maintenance ? [...ITEMS.slice(0, -1), MAINTENANCE_ITEM, ...ITEMS.slice(-1)] : ITEMS;
}

/** Columnas de la barra inferior en móvil (clases literales para Tailwind). */
const MOBILE_COLS: Record<number, string> = { 6: "grid-cols-6", 7: "grid-cols-7", 8: "grid-cols-8" };

/** La ruta raíz solo se marca activa en sí misma; el resto también en sus subpáginas. */
function isActive(pathname: string | null, href: string) {
  if (pathname === null) return false;
  return href === "/" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Menú del portal: barra lateral en escritorio y barra de pestañas inferior en móvil.
 * `usePathname` se suspende al prerenderizar rutas con parámetros dinámicos (p. ej. /capacitacion/[id]),
 * así que mientras tanto se muestra el mismo menú sin ítem activo.
 * `maintenance` agrega la entrada Mantenimiento (empleados Responsables de Mantenimiento).
 */
export function SidebarNav({ maintenance = false }: { maintenance?: boolean }) {
  const items = navItems(maintenance);
  return (
    <Suspense fallback={<Nav items={items} pathname={null} />}>
      <ActiveNav items={items} />
    </Suspense>
  );
}

function ActiveNav({ items }: { items: NavItem[] }) {
  return <Nav items={items} pathname={usePathname()} />;
}

function Nav({ items, pathname }: { items: NavItem[]; pathname: string | null }) {
  return (
    <>
      <nav
        aria-label="Menú principal"
        className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-line bg-surface px-3 py-4 lg:flex lg:sidebar-hidden:hidden"
      >
        <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted">Menú</p>
        <ul className="space-y-1">
          {items.map(({ href, label, Icon }) => {
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
        className={`fixed inset-x-0 bottom-0 z-40 grid border-t border-line bg-surface/95 backdrop-blur lg:hidden ${
          MOBILE_COLS[items.length] ?? "grid-cols-8"
        }`}
      >
        {items.map(({ href, label, shortLabel, Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={shortLabel ? label : undefined}
              title={shortLabel ? label : undefined}
              className={`flex min-w-0 flex-col items-center gap-1 py-2.5 font-medium sm:text-[11px] ${
                items.length > 6 ? "px-0 text-[9px] tracking-tight" : "px-0.5 text-[10px]"
              } ${active ? "text-accent" : "text-muted"}`}
            >
              <Icon className="size-5" />
              <span className="max-w-full truncate">{shortLabel ?? label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
