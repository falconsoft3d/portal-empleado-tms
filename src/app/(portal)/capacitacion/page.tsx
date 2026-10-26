import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRightIcon, GraduationCapIcon } from "@/components/icons";
import { odooGetCourses, type Course } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../portal-header";

export const metadata: Metadata = {
  title: "Capacitación · Portal del Empleado",
};

export default function TrainingPage() {
  return (
    <Suspense fallback={<TrainingSkeleton />}>
      <Training />
    </Suspense>
  );
}

/** Cursos agrupados por carrera, en el orden en que llegan de Odoo. */
function byCareer(courses: Course[]) {
  const groups = new Map<number, { career: Course["career"]; courses: Course[] }>();
  for (const course of courses) {
    const group = groups.get(course.career.id) ?? { career: course.career, courses: [] };
    group.courses.push(course);
    groups.set(course.career.id, group);
  }
  return [...groups.entries()];
}

async function Training() {
  const session = await getSession();
  if (!session) redirect("/login");
  const courses = await odooGetCourses(session.odooToken);

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Capacitación</h1>
          <p className="mt-1 text-sm text-muted">Cursos de tus carreras y cursos en los que estás inscrito.</p>
        </div>

        {courses === null && (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudieron cargar los cursos. Vuelve a intentarlo en unos minutos.
          </p>
        )}
        {courses?.length === 0 && (
          <div className="rounded-2xl border border-line bg-surface p-8 text-center">
            <GraduationCapIcon className="mx-auto size-8 text-muted" />
            <p className="mt-3 text-sm text-muted">Todavía no tienes cursos asignados.</p>
          </div>
        )}

        {courses &&
          byCareer(courses).map(([careerId, { career, courses: careerCourses }]) => (
            <section key={careerId}>
              <div className="mb-3 flex items-center gap-3">
                {career.has_image && (
                  <Image
                    src={`/api/careers/${career.id}/image`}
                    alt={career.name}
                    width={96}
                    height={96}
                    unoptimized
                    className="size-12 shrink-0 rounded-xl border border-line object-cover"
                  />
                )}
                <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{career.name}</h2>
              </div>
              <ul className="grid gap-3 sm:grid-cols-2">
                {careerCourses.map((course) => (
                  <li key={course.id}>
                    <Link
                      href={`/capacitacion/${course.id}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:border-accent"
                    >
                      {course.has_image && (
                        <Image
                          src={`/api/courses/${course.id}/image`}
                          alt={course.name}
                          width={512}
                          height={288}
                          unoptimized
                          className="aspect-video w-full object-cover"
                        />
                      )}
                      <span className="flex flex-1 flex-col p-5">
                        <span className="flex items-start gap-3">
                          {!course.has_image && (
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                              <GraduationCapIcon className="size-5" />
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold text-ink">{course.name}</span>
                            <span className="mt-0.5 block text-xs text-muted">
                              {course.section_count} {course.section_count === 1 ? "tema" : "temas"} ·{" "}
                              {course.content_count} {course.content_count === 1 ? "clase" : "clases"}
                            </span>
                          </span>
                          <ArrowRightIcon className="size-4 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-accent" />
                        </span>
                        {course.description && (
                          <span className="mt-3 line-clamp-3 text-sm text-muted">{course.description}</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </main>
    </div>
  );
}

function TrainingSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto grid max-w-4xl gap-3 p-4 sm:grid-cols-2 sm:p-6">
        <div className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-32 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
