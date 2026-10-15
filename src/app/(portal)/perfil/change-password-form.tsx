"use client";

import { useActionState } from "react";
import { SpinnerIcon } from "@/components/icons";
import { cambiarContrasena } from "./actions";

const inputClass =
  "mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/15";

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(cambiarContrasena, undefined);

  return (
    <form action={action} className="mt-4 space-y-4">
      {state?.error && (
        <p role="alert" className="rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">{state.success}</p>
      )}
      <label className="block">
        <span className="text-sm font-medium text-ink">Contraseña actual</span>
        <input name="current" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink">Nueva contraseña</span>
        <input name="new" type="password" autoComplete="new-password" required minLength={6} className={inputClass} />
      </label>
      <label className="block">
        <span className="text-sm font-medium text-ink">Repite la nueva contraseña</span>
        <input name="confirm" type="password" autoComplete="new-password" required minLength={6} className={inputClass} />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-wait disabled:opacity-80"
      >
        {pending && <SpinnerIcon className="size-4 animate-spin" />}
        {pending ? "Guardando…" : "Cambiar contraseña"}
      </button>
    </form>
  );
}
