import { Suspense } from "react";
import { redirect } from "next/navigation";
import { odooGetAttendance, odooGetAttendanceMonth, odooGetConceptRequests } from "@/lib/odoo";
import { firstName } from "@/lib/names";
import { getSession } from "@/lib/session";
import { Birthdays, BirthdaysSkeleton } from "./birthdays";
import { ConceptRequests } from "./concept-requests";
import { MonthCalendar } from "./month-calendar";
import { Resources } from "./resources";
import { NewsBoard } from "./news-board";
import { PortalHeader, PortalHeaderSkeleton } from "./portal-header";
import { TimeClock } from "./time-clock";

export default function HomePage() {
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home />
    </Suspense>
  );
}

async function Home() {
  const session = await getSession();
  if (!session) redirect("/login");
  const attendance = await odooGetAttendance(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />

      <main className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <TimeClock
            initial={attendance.ok ? attendance.attendance : null}
            initialError={attendance.ok ? null : attendance.error}
          />
          <Suspense fallback={<div className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />}>
            <MonthCalendarSection token={session.odooToken} />
          </Suspense>
          <Suspense fallback={<div className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />}>
            <Resources token={session.odooToken} />
          </Suspense>
        </div>
        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border border-line bg-surface p-6">
            <p className="text-sm text-muted">{session.company}</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">
              Hola, {firstName(session.name)} 👋
            </h1>
            <p className="mt-2 text-sm text-muted">
              Registra tu entrada al empezar la jornada y tu salida al terminarla. Pronto encontrarás aquí tus tareas,
              calendario y más.
            </p>
          </section>
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl border border-line bg-surface" />}>
            <NewsBoard token={session.odooToken} />
          </Suspense>
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />}>
            <ConceptRequestsSection token={session.odooToken} />
          </Suspense>
          <Suspense fallback={<BirthdaysSkeleton />}>
            <Birthdays token={session.odooToken} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}

async function MonthCalendarSection({ token }: { token: string }) {
  const month = await odooGetAttendanceMonth(token);
  if (!month) return null;
  // La clave cambia cuando hay fichadas nuevas: el calendario se reinicia con los datos frescos.
  const records = Object.values(month.days).flatMap((day) => day.records.map((r) => `${r.id}:${r.end ?? ""}`));
  return <MonthCalendar key={`${month.month}|${records.join(",")}`} initial={month} />;
}

async function ConceptRequestsSection({ token }: { token: string }) {
  const result = await odooGetConceptRequests(token);
  return result.ok ? <ConceptRequests initial={result.data} /> : null;
}

function HomeSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto grid max-w-6xl gap-4 p-4 sm:p-6 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
        <div className="h-56 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
