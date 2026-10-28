import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { odooGetVacations } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";
import { Vacations } from "./vacations";

export const metadata: Metadata = {
  title: "Vacaciones · Portal del Empleado",
};

export default function VacationsPage() {
  return (
    <Suspense fallback={<VacationsSkeleton />}>
      <VacationsView />
    </Suspense>
  );
}

async function VacationsView() {
  const session = await getSession();
  if (!session) redirect("/login");
  const result = await odooGetVacations(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Vacaciones</h1>
          <p className="mt-1 text-sm text-muted">Consulta tus días disponibles, solicita vacaciones y sigue su estado.</p>
        </div>
        {result.ok ? (
          <Vacations initial={result.data} />
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudieron cargar tus vacaciones. Vuelve a intentarlo en unos minutos.
          </p>
        )}
      </main>
    </div>
  );
}

function VacationsSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto grid max-w-5xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
