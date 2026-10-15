import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";
import { ChangePasswordForm } from "./change-password-form";

export const metadata: Metadata = {
  title: "Mi perfil · Portal del Empleado",
};

export default function ProfilePage() {
  return (
    <Suspense fallback={<PortalHeaderSkeleton />}>
      <Profile />
    </Suspense>
  );
}

async function Profile() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-xl flex-col gap-4 p-4 sm:p-6">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">{session.company}</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">{session.name}</h1>
          {session.jobTitle && <p className="text-sm text-muted">{session.jobTitle}</p>}
        </section>
        <section className="rounded-2xl border border-line bg-surface p-6">
          <h2 className="text-sm font-semibold text-ink">Cambiar contraseña</h2>
          <p className="mt-1 text-xs text-muted">Es la contraseña con la que entras a este portal.</p>
          <ChangePasswordForm />
        </section>
      </main>
    </div>
  );
}
