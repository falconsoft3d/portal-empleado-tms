"use client";

import { useState, useTransition } from "react";
import { CheckIcon, SpinnerIcon } from "@/components/icons";
import { terminarContenido } from "./actions";

/** Botón "Marcar como terminado" de un contenido; bloqueado mientras queden actividades sin aprobar. */
export function FinishContentButton({ contentId, pendingActivities }: { contentId: number; pendingActivities: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pendingActivities || pending}
        onClick={() => startTransition(async () => setError(await terminarContenido(contentId)))}
        className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? <SpinnerIcon className="size-4 animate-spin" /> : <CheckIcon className="size-4" />}
        Marcar como terminado
      </button>
      {pendingActivities && (
        <p className="mt-2 text-xs text-muted">Aprueba las actividades de este contenido para poder terminarlo.</p>
      )}
      {error && (
        <p role="alert" className="mt-2 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">{error}</p>
      )}
    </div>
  );
}
