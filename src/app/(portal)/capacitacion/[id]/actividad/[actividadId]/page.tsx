import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeftIcon, PuzzleIcon } from "@/components/icons";
import { odooGetActivity } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../../../../portal-header";
import { ActivityPlayer } from "../../../activity-player";
import { ACTIVITY_TYPE_LABELS } from "../../../activity-types";

export const metadata: Metadata = {
  title: "Actividad · Portal del Empleado",
};

type Props = PageProps<"/capacitacion/[id]/actividad/[actividadId]">;

export default function ActivityPage({ params }: Props) {
  return (
    <Suspense fallback={<ActivitySkeleton />}>
      <ActivityView params={params} />
    </Suspense>
  );
}

async function ActivityView({ params }: Pick<Props, "params">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id, actividadId } = await params;
  const courseId = Number(id);
  const activityId = Number(actividadId);
  if (!Number.isInteger(activityId) || activityId <= 0) notFound();
  const activity = await odooGetActivity(session.odooToken, activityId);
  if (activity === "not_found" || (activity && activity.course_id !== courseId)) notFound();

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-2xl flex-col gap-6 p-4 sm:p-6">
        <Link
          href={`/capacitacion/${courseId}`}
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ChevronLeftIcon className="size-4" />
          Volver al curso
        </Link>

        {activity === null ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudo cargar la actividad. Vuelve a intentarlo en unos minutos.
          </p>
        ) : (
          <>
            <div className="flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                <PuzzleIcon className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted">
                  {activity.final ? "Examen final" : ACTIVITY_TYPE_LABELS[activity.type]}
                  {activity.content && ` · ${activity.content.name}`}
                </p>
                <h1 className="mt-0.5 text-2xl font-semibold tracking-tight text-ink">{activity.name}</h1>
                <p className="mt-1 text-xs text-muted">Necesitas {activity.min_score}% para aprobar.</p>
              </div>
            </div>

            {activity.passed && (
              <p className="rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
                Ya aprobaste esta actividad. Puedes repetirla si quieres practicar.
              </p>
            )}
            {activity.instructions && (
              <p className="whitespace-pre-line rounded-2xl border border-line bg-surface p-4 text-sm text-muted">
                {activity.instructions}
              </p>
            )}

            <ActivityPlayer activity={activity} />
          </>
        )}
      </main>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
        <div className="h-16 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
