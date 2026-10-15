import type { Metadata } from "next";
import { Brand } from "@/components/brand";
import { BuildingIcon, CheckIcon, HomeIcon, PlayIcon } from "@/components/icons";
import { LiveClock } from "@/components/live-clock";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión · Portal del Empleado",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-5xl grid-cols-1 overflow-hidden rounded-3xl border border-line bg-surface shadow-[0_24px_60px_-30px_rgba(28,34,48,0.25)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="flex flex-col p-6 sm:p-12">
          <Brand />
          <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 lg:mx-0">
            <h1 className="text-2xl font-semibold tracking-tight text-ink">Bienvenido de nuevo</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Accede a tu portal con el usuario y la contraseña que te ha asignado Recursos Humanos.
            </p>
            <LoginForm />
          </div>
          <p className="text-xs text-muted">TMS Energy · Portal del Empleado</p>
        </section>

        <aside className="relative hidden flex-col justify-center gap-4 bg-accent-soft p-10 lg:flex" aria-hidden="true">
          <div className="mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Tu día a día</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">
              Jornada, tareas y ausencias en un solo lugar
            </h2>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] gap-4">
            <PreviewCard title="Cronómetro">
              <div className="rounded-xl border border-line p-3 text-center">
                <LiveClock className="text-xl font-semibold tabular-nums text-ink" />
                <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-muted">
                  <BuildingIcon className="size-3" /> En la oficina
                </p>
                <div className="mt-3 flex justify-center gap-1.5">
                  <span className="grid size-7 place-items-center rounded-lg bg-accent-soft text-accent">
                    <BuildingIcon className="size-3.5" />
                  </span>
                  <span className="grid size-7 place-items-center rounded-lg border border-line text-muted">
                    <HomeIcon className="size-3.5" />
                  </span>
                </div>
                <span className="mt-2 flex h-7 items-center justify-center gap-1 whitespace-nowrap rounded-lg bg-primary text-[11px] font-medium text-white">
                  <PlayIcon className="size-3" /> Iniciar jornada
                </span>
              </div>
            </PreviewCard>

            <PreviewCard title="Mis tareas">
              <ul className="space-y-2">
                <TaskRow label="Checklist del camión" />
                <TaskRow label="Parte diario" done />
                <TaskRow label="Ticket de gasoil" />
              </ul>
            </PreviewCard>
          </div>

          <PreviewCard title="Mi calendario">
            <div className="flex items-center gap-4">
              <div className="flex flex-1 items-center gap-6 rounded-xl border border-line px-4 py-3">
                <Stat value="12d" label="Disponible" />
                <span className="h-8 w-px bg-line" />
                <Stat value="3d" label="Pendiente" />
              </div>
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted">
                {Array.from({ length: 14 }, (_, i) => (
                  <span
                    key={i}
                    className={`grid size-5 place-items-center rounded ${
                      i >= 8 && i <= 11 ? "bg-warning-soft text-ink" : i === 3 ? "bg-success-soft text-success" : ""
                    }`}
                  >
                    {i + 10}
                  </span>
                ))}
              </div>
            </div>
          </PreviewCard>
        </aside>
      </div>
    </main>
  );
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-ink">{title}</p>
      {children}
    </div>
  );
}

function TaskRow({ label, done = false }: { label: string; done?: boolean }) {
  return (
    <li className="flex items-center gap-2 rounded-lg border border-line px-2.5 py-2">
      <span
        className={`grid size-4 shrink-0 place-items-center rounded-full border ${
          done ? "border-success bg-success text-white" : "border-accent/40"
        }`}
      >
        {done && <CheckIcon className="size-2.5" />}
      </span>
      <span className={`flex-1 truncate text-xs ${done ? "text-muted line-through" : "text-ink"}`}>{label}</span>
      <span className="rounded-md border border-line px-1.5 py-0.5 text-[10px] text-muted">
        {done ? "Deshacer" : "Completar"}
      </span>
    </li>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-lg font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
