import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { DownloadIcon, ReceiptIcon } from "@/components/icons";
import { odooGetPayslips, type Payslip } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";

export const metadata: Metadata = {
  title: "Recibos de sueldo · Portal del Empleado",
};

export default function PayslipsPage() {
  return (
    <Suspense fallback={<PayslipsSkeleton />}>
      <PayslipsView />
    </Suspense>
  );
}

async function PayslipsView() {
  const session = await getSession();
  if (!session) redirect("/login");
  const payslips = await odooGetPayslips(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-5xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Recibos de sueldo</h1>
          <p className="mt-1 text-sm text-muted">Consulta y descarga tus recibos de haberes liquidados.</p>
        </div>
        {payslips === null ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudieron cargar los recibos. Intenta de nuevo en unos minutos.
          </p>
        ) : payslips.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            Todavía no tienes recibos de sueldo liquidados.
          </p>
        ) : (
          <section className="rounded-2xl border border-line bg-surface p-2 sm:p-4">
            <ul className="divide-y divide-line">
              {payslips.map((payslip) => (
                <PayslipRow key={payslip.id} payslip={payslip} />
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}

function formatAmount(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(value);
  } catch {
    return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  }
}

function PayslipRow({ payslip }: { payslip: Payslip }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-2 py-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
        <ReceiptIcon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{payslip.period || payslip.name}</p>
        <p className="truncate text-xs text-muted">
          Recibo N.º {payslip.number}
          {payslip.company && ` · ${payslip.company}`}
        </p>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{formatAmount(payslip.net, payslip.currency)}</p>
        <p className="text-xs text-muted">{payslip.paid ? "Pagado" : "Neto a cobrar"}</p>
      </div>
      <div className="flex w-full gap-2 sm:w-auto">
        <a
          href={`/api/payslips/${payslip.id}/pdf?ver=1`}
          target="_blank"
          rel="noopener"
          className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-line px-3 text-sm font-medium text-ink transition hover:bg-surface-muted sm:flex-none"
        >
          Ver
        </a>
        <a
          href={`/api/payslips/${payslip.id}/pdf`}
          download
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 text-sm font-medium text-white transition hover:bg-primary-hover sm:flex-none"
        >
          <DownloadIcon className="size-4" />
          Descargar
        </a>
      </div>
    </li>
  );
}

function PayslipsSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto flex max-w-5xl flex-col gap-4 p-4 sm:p-6">
        <div className="h-72 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
