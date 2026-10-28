import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { odooGetAbsences } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";
import { Absences } from "./absences";

export const metadata: Metadata = {
  title: "Ausencias · Portal del Empleado",
};

export default function AbsencesPage() {
  return (
    <Suspense fallback={<AbsencesSkeleton />}>
      <AbsencesView />
    </Suspense>
  );
}

async function AbsencesView() {
  const session = await getSession();
  if (!session) redirect("/login");
  const result = await odooGetAbsences(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Ausencias</h1>
          <p className="mt-1 text-sm text-muted">
            Solicita ausencias (enfermedad, exámenes, trámites…), adjunta la documentación y sigue su estado.
          </p>
        </div>
        {result.ok ? (
          <Absences initial={result.data} />
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudieron cargar tus ausencias. Vuelve a intentarlo en unos minutos.
          </p>
        )}
      </main>
    </div>
  );
}

function AbsencesSkeleton() {
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
