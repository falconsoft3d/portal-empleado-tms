import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { LogoutIcon } from "@/components/icons";
import { odooGetAttendance } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { logout } from "./actions";
import { TimeClock } from "./time-clock";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Los nombres vienen como "APELLIDO Nombre": toma el primer nombre. */
function firstName(name: string) {
  const words = name.split(/\s+/).filter(Boolean);
  return words.find((word) => word !== word.toUpperCase()) ?? words[0] ?? "";
}

async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  const attendance = await odooGetAttendance(session.odooToken);

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <Brand />
        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{session.name}</p>
            {session.jobTitle && <p className="text-xs text-muted">{session.jobTitle}</p>}
          </div>
          <span className="grid size-9 place-items-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
            {initials(session.name)}
          </span>
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

      <main className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <TimeClock
          initial={attendance.ok ? attendance.attendance : null}
          initialError={attendance.ok ? null : attendance.error}
        />
        <div>
          <section className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-sm text-muted">{session.company}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Hola, {firstName(session.name)} 👋
            </h1>
            <p className="mt-2 text-sm text-muted">
              Registra tu entrada al empezar la jornada y tu salida al terminarla. Pronto encontrarás aquí tus tareas,
              calendario y más.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <Brand />
        <span className="size-9 animate-pulse rounded-full bg-line" />
      </header>
      <main className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="h-56 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
