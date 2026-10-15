import Link from "next/link";
import { Brand } from "@/components/brand";
import { LogoutIcon } from "@/components/icons";
import type { SessionPayload } from "@/lib/jwt";
import { initials } from "@/lib/names";
import { logout } from "./actions";

export function PortalHeader({ session }: { session: SessionPayload }) {
  return (
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
      <Link href="/" aria-label="Inicio">
        <Brand />
      </Link>
      <div className="flex items-center gap-3">
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
    <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
      <Brand />
      <span className="size-9 animate-pulse rounded-full bg-line" />
    </header>
  );
}
