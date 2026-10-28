import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { odooGetTickets } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";
import { Tickets } from "./tickets";

export const metadata: Metadata = {
  title: "Tickets · Portal del Empleado",
};

export default function TicketsPage() {
  return (
    <Suspense fallback={<TicketsSkeleton />}>
      <TicketsView />
    </Suspense>
  );
}

async function TicketsView() {
  const session = await getSession();
  if (!session) redirect("/login");
  const result = await odooGetTickets(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Tickets</h1>
          <p className="mt-1 text-sm text-muted">Envía consultas o pedidos a RRHH y sigue su estado y respuesta.</p>
        </div>
        {result.ok ? (
          <Tickets initial={result.data} />
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudieron cargar tus tickets. Vuelve a intentarlo en unos minutos.
          </p>
        )}
      </main>
    </div>
  );
}

function TicketsSkeleton() {
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
