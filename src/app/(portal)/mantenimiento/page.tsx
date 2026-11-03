import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, PrinterIcon } from "@/components/icons";
import { odooGetMaintenance, type MaintenanceOrder } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";
import { maintenanceLoadError } from "./errors";
import { LocalDateTime, RepairTypes, StateBadge } from "./shared";

export const metadata: Metadata = {
  title: "Mantenimiento · Portal del Empleado",
};

export default function MaintenancePage() {
  return (
    <Suspense fallback={<MaintenanceSkeleton />}>
      <MaintenanceView />
    </Suspense>
  );
}

async function MaintenanceView() {
  const session = await getSession();
  if (!session) redirect("/login");
  const result = await odooGetMaintenance(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Mantenimiento</h1>
          <p className="mt-1 text-sm text-muted">
            Trabaja las fichas mecánicas que tienes asignadas como responsable y consulta tu historial.
          </p>
        </div>
        {result.ok ? (
          <>
            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">Fichas asignadas</h2>
              {result.data.active.length === 0 ? (
                <p className="mt-2 text-sm text-muted">No tienes fichas abiertas ni en reparación.</p>
              ) : (
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {result.data.active.map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="text-sm font-semibold text-ink">Historial</h2>
              {result.data.history.length === 0 ? (
                <p className="mt-2 text-sm text-muted">Todavía no tienes fichas finalizadas.</p>
              ) : (
                <ul className="mt-3 grid gap-3 md:grid-cols-2">
                  {result.data.history.map((order) => (
                    <OrderCard key={order.id} order={order} printable />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            {maintenanceLoadError(result.error)}
          </p>
        )}
      </main>
    </div>
  );
}

function OrderCard({ order, printable = false }: { order: MaintenanceOrder; printable?: boolean }) {
  const progress = order.tasks_total ? Math.round((order.tasks_done / order.tasks_total) * 100) : 0;
  return (
    <li className="flex flex-col rounded-xl border border-line p-4">
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold text-ink">{order.name}</span>
        <StateBadge state={order.state} label={order.state_label} />
      </div>
      <p className="mt-0.5 text-xs text-muted">
        {order.vehicle || "Sin vehículo"}
        {order.license_plate && ` · ${order.license_plate}`}
      </p>
      <p className="mt-0.5 text-xs text-muted">
        Apertura: <LocalDateTime iso={order.date_open} />
      </p>
      {order.repair_types.length > 0 && (
        <div className="mt-2">
          <RepairTypes types={order.repair_types} />
        </div>
      )}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-muted">
          <span>
            {order.tasks_done}/{order.tasks_total} hechas
          </span>
          {order.tasks_pending > 0 && (
            <span>
              {order.tasks_pending} {order.tasks_pending === 1 ? "pendiente" : "pendientes"}
            </span>
          )}
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full bg-success" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 pt-1">
        <Link
          href={`/mantenimiento/${order.id}`}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          {printable ? "Ver ficha" : "Abrir ficha"}
          <ArrowRightIcon className="size-4" />
        </Link>
        {printable && (
          <a
            href={`/api/maintenance/${order.id}/pdf`}
            target="_blank"
            rel="noopener"
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3 text-sm font-medium text-ink transition hover:bg-surface-muted"
          >
            <PrinterIcon className="size-4" />
            Imprimir
          </a>
        )}
      </div>
    </li>
  );
}

function MaintenanceSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-6">
        <div className="h-56 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-56 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
