"use client";

import Image from "next/image";
import { useState } from "react";

/** Logo de la compañía del empleado (desde Odoo); si no tiene logo, muestra la marca del portal. */
export function CompanyBrand({ company }: { company: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {failed ? (
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-sm font-bold tracking-tight text-white">
          {(company || "T").charAt(0).toUpperCase()}
        </span>
      ) : (
        <Image
          src="/api/company/logo"
          alt={company}
          width={120}
          height={36}
          unoptimized
          onError={() => setFailed(true)}
          className="h-9 w-auto max-w-[120px] shrink-0 rounded-md bg-white object-contain p-0.5"
        />
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate text-sm font-semibold text-ink">{company || "TMS Energy"}</span>
        <span className="hidden text-xs text-muted sm:block">Portal del Empleado</span>
      </span>
    </div>
  );
}
