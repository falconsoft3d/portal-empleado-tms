import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckIcon, XIcon } from "@/components/icons";
import { odooVerifyCertificate } from "@/lib/odoo";

export const metadata: Metadata = {
  title: "Verificar certificado · Portal del Empleado",
};

type Props = PageProps<"/verificar/[codigo]">;

/** Página pública a la que apunta el QR de los certificados: no requiere sesión. */
export default function VerifyPage({ params }: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-lg rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-surface-muted" />}>
          <Verification params={params} />
        </Suspense>
      </div>
    </main>
  );
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

async function Verification({ params }: Pick<Props, "params">) {
  const { codigo } = await params;
  const certificate = /^[a-f0-9]{32}$/.test(codigo) ? await odooVerifyCertificate(codigo) : "not_found";

  if (certificate === null) {
    return <p className="text-sm text-muted">No se pudo verificar el certificado en este momento. Inténtalo más tarde.</p>;
  }

  if (certificate === "not_found") {
    return (
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-danger-soft text-danger">
          <XIcon className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Certificado no válido</h1>
        <p className="mt-2 text-sm text-muted">
          No existe un certificado firmado con este código. Revisa que el QR o el enlace estén completos.
        </p>
      </div>
    );
  }

  const rows = [
    ["Empleado", certificate.employee],
    ["Curso", certificate.course],
    ["Carrera", certificate.career],
    ["Profesor", certificate.teacher],
    ["Empresa", certificate.company],
    ["Fecha de emisión", formatDate(certificate.date)],
    ["Calificación", `${certificate.score}%`],
    ["Número", certificate.number],
  ].filter(([, value]) => value);

  return (
    <div>
      <div className="text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-success-soft text-success">
          <CheckIcon className="size-7" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink">Certificado válido</h1>
        <p className="mt-1 text-sm text-muted">Este certificado fue emitido y firmado digitalmente.</p>
      </div>
      <dl className="mt-6 divide-y divide-line rounded-2xl border border-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 px-4 py-3 text-sm">
            <dt className="w-36 shrink-0 text-muted">{label}</dt>
            <dd className="min-w-0 font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
