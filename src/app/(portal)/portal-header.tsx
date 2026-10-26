import Link from "next/link";
import { Brand } from "@/components/brand";
import { CompanyBrand } from "@/components/company-brand";
import { LogoutIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";
import { SidebarToggle } from "./sidebar-toggle";
import type { SessionPayload } from "@/lib/jwt";
import { initials } from "@/lib/names";
import { logout } from "./actions";

export function PortalHeader({ session }: { session: SessionPayload }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <SidebarToggle />
        <Link href="/" aria-label="Inicio" className="min-w-0">
          <CompanyBrand company={session.company} />
        </Link>
      </div>
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        <Link href="/perfil" className="flex items-center gap-3 rounded-xl p-1 transition hover:bg-surface-muted" title="Mi perfil">
          <span className="hidden text-right sm:block">
            <span className="block text-sm font-medium text-ink">{session.name}</span>
            {session.jobTitle && <span className="block text-xs text-muted">{session.jobTitle}</span>}
          </span>
          <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {initials(session.name)}
          </span>
        </Link>
        <form action={logout}>
          <button
            type="submit"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className="grid size-9 place-items-center rounded-lg border border-line text-muted transition hover:bg-surface-muted hover:text-ink"
          >
            <LogoutIcon className="size-4" />
          </button>
        </form>
      </div>
    </header>
  );
}

export function PortalHeaderSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur sm:px-6">
      <Brand />
      <span className="size-9 animate-pulse rounded-full bg-line" />
    </header>
  );
}
