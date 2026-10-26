import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronDownIcon, ChevronLeftIcon, PaperclipIcon, PlayCircleIcon } from "@/components/icons";
import { odooGetCourse, type CourseContent, type CourseLink } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../../portal-header";

export const metadata: Metadata = {
  title: "Curso · Portal del Empleado",
};

export default function CoursePage({ params }: PageProps<"/capacitacion/[id]">) {
  return (
    <Suspense fallback={<CourseSkeleton />}>
      <CourseView params={params} />
    </Suspense>
  );
}

/** Solo se enlazan URLs http(s): el enlace lo escribe RRHH en Odoo, pero no debe poder ejecutar JavaScript. */
function safeUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : null;
  } catch {
    return null;
  }
}

async function CourseView({ params }: Pick<PageProps<"/capacitacion/[id]">, "params">) {
  const session = await getSession();
  if (!session) redirect("/login");
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const course = await odooGetCourse(session.odooToken, id);
  if (course === "not_found") notFound();

  // Las clases se numeran de corrido en todo el curso (C1, C2, …).
  let classNumber = 0;

  return (
    <div className="min-h-screen">
      <PortalHeader session={session} />
      <main className="mx-auto flex max-w-4xl flex-col gap-6 p-4 sm:p-6">
        <Link
          href="/capacitacion"
          className="inline-flex w-fit items-center gap-1 text-sm font-medium text-muted transition hover:text-ink"
        >
          <ChevronLeftIcon className="size-4" />
          Capacitación
        </Link>

        {course === null ? (
          <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
            No se pudo cargar el curso. Vuelve a intentarlo en unos minutos.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
              {course.has_image && (
                <Image
                  src={`/api/courses/${course.id}/image`}
                  alt={course.name}
                  width={512}
                  height={288}
                  unoptimized
                  priority
                  className="aspect-video w-full shrink-0 rounded-2xl border border-line object-cover sm:w-72"
                />
              )}
              <div className="min-w-0">
                <p className="text-sm text-muted">{course.career.name}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink">{course.name}</h1>
                {course.description && (
                  <p className="mt-2 whitespace-pre-line text-sm text-muted">{course.description}</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold tracking-tight text-ink">Contenido del curso</h2>
              <p className="mt-1 text-sm text-muted">
                {course.sections.length} {course.sections.length === 1 ? "tema" : "temas"}
              </p>
            </div>

            {course.sections.length === 0 && (
              <p className="rounded-2xl border border-line bg-surface p-6 text-sm text-muted">
                Este curso todavía no tiene contenido.
              </p>
            )}

            {course.sections.map((section, index) => (
              <details
                key={section.id}
                open={index === 0}
                className="group/section overflow-hidden rounded-2xl border border-line bg-surface"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-4 sm:px-6 [&::-webkit-details-marker]:hidden">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-success-soft text-xs font-semibold text-success">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 sm:flex sm:items-center sm:gap-3">
                    <span className="block font-semibold text-ink">{section.name}</span>
                    <span className="mt-1 inline-block rounded-full bg-surface-muted px-2 py-0.5 text-xs text-muted sm:mt-0">
                      {section.contents.length} {section.contents.length === 1 ? "clase" : "clases"}
                    </span>
                  </span>
                  <ChevronDownIcon className="size-5 shrink-0 text-muted transition group-open/section:rotate-180" />
                </summary>

                {section.description && (
                  <p className="border-t border-line px-4 py-3 whitespace-pre-line text-sm text-muted sm:px-6">
                    {section.description}
                  </p>
                )}
                <ul>
                  {section.contents.map((content) => (
                    <li key={content.id} className="border-t border-line">
                      <ContentRow content={content} number={++classNumber} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </>
        )}
      </main>
    </div>
  );
}

function ShowButton({ link }: { link: CourseLink }) {
  const href = safeUrl(link.url);
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={link.name}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent"
    >
      <PlayCircleIcon className="size-4" />
      Mostrar
    </a>
  );
}

function ContentRow({ content, number }: { content: CourseContent; number: number }) {
  const [firstLine] = content.lines;
  const hasDetail = content.description || content.lines.length > 1 || content.annexes.length > 0;

  const row = (
    <>
      <span className="grid h-7 min-w-9 shrink-0 place-items-center rounded-lg bg-surface-muted px-1.5 text-xs font-semibold text-muted">
        C{number}
      </span>
      <span className="min-w-0 flex-1 text-sm text-ink">{content.name}</span>
      {hasDetail && <ChevronDownIcon className="size-4 shrink-0 text-muted transition group-open/content:rotate-180" />}
      {firstLine && <ShowButton link={firstLine} />}
    </>
  );
  const rowClass = "flex items-center gap-3 px-4 py-3 transition hover:bg-success-soft sm:px-6";

  if (!hasDetail) return <div className={rowClass}>{row}</div>;

  return (
    <details className="group/content">
      <summary className={`${rowClass} cursor-pointer list-none [&::-webkit-details-marker]:hidden`}>{row}</summary>

      <div className="space-y-4 bg-canvas px-4 py-4 sm:px-6 sm:pl-[4.75rem]">
        {content.description && <p className="whitespace-pre-line text-sm text-muted">{content.description}</p>}

        {content.lines.length > 1 && (
          <ul className="space-y-2">
            {content.lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 text-sm text-ink">{line.name}</span>
                <ShowButton link={line} />
              </li>
            ))}
          </ul>
        )}

        {content.annexes.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Anexos</p>
            <ul className="space-y-1">
              {content.annexes.map((annex) => {
                const href = safeUrl(annex.url);
                return (
                  <li key={annex.id}>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
                      >
                        <PaperclipIcon className="size-4" />
                        {annex.name}
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-muted">
                        <PaperclipIcon className="size-4" />
                        {annex.name}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </details>
  );
}

function CourseSkeleton() {
  return (
    <div className="min-h-screen">
      <PortalHeaderSkeleton />
      <main className="mx-auto flex max-w-4xl flex-col gap-4 p-4 sm:p-6">
        <div className="h-16 animate-pulse rounded-2xl border border-line bg-surface" />
        <div className="h-72 animate-pulse rounded-2xl border border-line bg-surface" />
      </main>
    </div>
  );
}
