import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon } from "@/components/icons";
import { odooGetMaintenanceOrder } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../../portal-header";
import { maintenanceLoadError } from "../errors";
import { MaintenanceOrderForm } from "./order";

export const metadata: Metadata = {
  title: "Ficha mecánica · Portal del Empleado",
};

export default function MaintenanceOrderPage({ params }: PageProps<"/mantenimiento/[id]">) {
  return (
    <Suspense fallback={<OrderSkeleton />}>
      <OrderView params={params} />
    </Suspense>
  );
}

async function OrderView({ params }: Pick<PageProps<"/mantenimiento/[id]">, "params">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const result = await odooGetMaintenanceOrder(session.odooToken, id);
  if (!result.ok && result.error === "not_found") notFound();

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <Link
          href="/mantenimiento"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ChevronLeftIcon className="size-4" />
          Mantenimiento
        </Link>
        {result.ok ? (
          <MaintenanceOrderForm initial={result.data} />
        ) : (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            {maintenanceLoadError(result.error)}
          </p>
        )}
      </main>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-6">
        <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-72 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
