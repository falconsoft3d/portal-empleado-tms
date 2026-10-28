import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  CheckIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  GraduationCapIcon,
  LockIcon,
  PaperclipIcon,
  PlayCircleIcon,
  PuzzleIcon,
} from "@/components/icons";
import { odooGetCourse, type CourseContent, type CourseDetail, type CourseLink } from "@/lib/odoo";
import { getSession } from "@/lib/session";
import { PortalHeader, PortalHeaderSkeleton } from "../../portal-header";
import { ACTIVITY_TYPE_LABELS } from "../activity-types";
import { CertificateCard } from "../certificate-card";
import { CourseProgress } from "../course-progress";
import { FinishContentButton } from "../finish-content-button";

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

/**
 * URL del reproductor incrustable de un archivo de Google Drive (`/file/d/<id>/view`,
 * `open?id=<id>` o `uc?id=<id>`), o `null` si el enlace no es de Drive.
 */
function driveEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "drive.google.com") return null;
    const fileId = parsed.pathname.match(/^\/file\/d\/([\w-]+)/)?.[1] ?? parsed.searchParams.get("id");
    return fileId && /^[\w-]+$/.test(fileId) ? `https://drive.google.com/file/d/${fileId}/preview` : null;
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
                {course.content_count > 0 && (
                  <div className="mt-4 max-w-sm">
                    <CourseProgress done={course.done_count} total={course.content_count} />
                  </div>
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
                      <ContentRow courseId={course.id} content={content} number={++classNumber} />
                    </li>
                  ))}
                </ul>
              </details>
            ))}

            <FinalExamSection course={course} />
          </>
        )}
      </main>
    </div>
  );
}

function FinalExamSection({ course }: { course: CourseDetail }) {
  const exam = course.final_exam;
  if (!exam) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
            exam.passed ? "bg-success-soft text-success" : "bg-accent-soft text-accent"
          }`}
        >
          {exam.available ? <GraduationCapIcon className="size-5" /> : <LockIcon className="size-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-ink">{exam.name}</h2>
          <p className="text-xs text-muted">
            {exam.question_count} {exam.question_count === 1 ? "pregunta" : "preguntas"} · necesitas {exam.min_score}% para
            aprobar y obtener tu certificado
          </p>
        </div>
        {exam.passed && (
          <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success">
            Aprobado
          </span>
        )}
      </div>

      {!exam.available && (
        <p className="mt-3 text-sm text-muted">Termina todos los contenidos del curso para habilitar el examen final.</p>
      )}
      {exam.available && !exam.passed && (
        <Link
          href={`/capacitacion/${course.id}/actividad/${exam.id}`}
          className="mt-4 inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          Comenzar examen final
        </Link>
      )}
      {course.certificate && <CertificateCard courseId={course.id} certificate={course.certificate} />}
    </section>
  );
}

const SHOW_BUTTON_CLASS =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-accent hover:text-accent";

function ShowButton({ link }: { link: CourseLink }) {
  // Los videos de Drive se ven dentro del contenido: el botón solo lo despliega (clic en el summary).
  if (driveEmbedUrl(link.url)) {
    return (
      <span title={link.name} className={SHOW_BUTTON_CLASS}>
        <PlayCircleIcon className="size-4" />
        Mostrar
      </span>
    );
  }
  const href = safeUrl(link.url);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" title={link.name} className={SHOW_BUTTON_CLASS}>
      <PlayCircleIcon className="size-4" />
      Mostrar
    </a>
  );
}

function DriveVideo({ link, src, showName }: { link: CourseLink; src: string; showName: boolean }) {
  return (
    <figure className="space-y-2">
      {showName && <figcaption className="text-sm font-medium text-ink">{link.name}</figcaption>}
      <iframe
        src={src}
        title={link.name}
        allow="autoplay; fullscreen"
        allowFullScreen
        loading="lazy"
        className="aspect-video w-full rounded-xl border border-line bg-black"
      />
    </figure>
  );
}

function ContentRow({ courseId, content, number }: { courseId: number; content: CourseContent; number: number }) {
  const rowClass = "flex items-center gap-3 px-4 py-3 sm:px-6";

  if (content.locked) {
    return (
      <div className={`${rowClass} opacity-60`} title="Aprueba la actividad anterior para desbloquear este contenido">
        <span className="grid h-7 min-w-9 shrink-0 place-items-center rounded-lg bg-surface-muted px-1.5 text-muted">
          <LockIcon className="size-3.5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm text-ink">{content.name}</span>
          <span className="block text-xs text-muted">Aprueba la actividad anterior para desbloquearlo</span>
        </span>
      </div>
    );
  }

  const [firstLine] = content.lines;
  const videos = content.lines.flatMap((line) => {
    const src = driveEmbedUrl(line.url);
    return src ? [{ line, src }] : [];
  });
  const otherLines = content.lines.filter((line) => !driveEmbedUrl(line.url));
  const pendingActivities = content.activities.filter((activity) => !activity.passed).length;

  return (
    <details className="group/content">
      <summary
        className={`${rowClass} cursor-pointer list-none transition hover:bg-success-soft [&::-webkit-details-marker]:hidden`}
      >
        <span
          className={`grid h-7 min-w-9 shrink-0 place-items-center rounded-lg px-1.5 text-xs font-semibold ${
            content.done ? "bg-success-soft text-success" : "bg-surface-muted text-muted"
          }`}
          title={content.done ? "Terminado" : undefined}
        >
          {content.done ? <CheckIcon className="size-4" /> : `C${number}`}
        </span>
        <span className="min-w-0 flex-1 text-sm text-ink">{content.name}</span>
        {pendingActivities > 0 && (
          <span className="hidden shrink-0 items-center gap-1 rounded-full bg-warning-soft px-2 py-0.5 text-xs font-medium text-ink sm:inline-flex">
            <PuzzleIcon className="size-3.5" />
            {pendingActivities === 1 ? "Actividad pendiente" : `${pendingActivities} actividades pendientes`}
          </span>
        )}
        <ChevronDownIcon className="size-4 shrink-0 text-muted transition group-open/content:rotate-180" />
        {firstLine && <ShowButton link={firstLine} />}
      </summary>

      <div className="space-y-4 bg-canvas px-4 py-4 sm:px-6 sm:pl-[4.75rem]">
        {content.description && <p className="whitespace-pre-line text-sm text-muted">{content.description}</p>}

        {videos.map(({ line, src }) => (
          <DriveVideo key={line.id} link={line} src={src} showName={content.lines.length > 1} />
        ))}

        {content.lines.length > 1 && otherLines.length > 0 && (
          <ul className="space-y-2">
            {otherLines.map((line) => (
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

        {content.activities.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Actividades</p>
            <ul className="space-y-2">
              {content.activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent-soft text-accent">
                    <PuzzleIcon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-ink">{activity.name}</span>
                    <span className="block text-xs text-muted">{ACTIVITY_TYPE_LABELS[activity.type]}</span>
                  </span>
                  {activity.passed && (
                    <span className="hidden shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success sm:inline">
                      Aprobada
                    </span>
                  )}
                  <Link
                    href={`/capacitacion/${courseId}/actividad/${activity.id}`}
                    className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activity.passed
                        ? "border border-line bg-surface-muted text-ink hover:border-accent hover:text-accent"
                        : "bg-primary text-white hover:bg-primary-hover"
                    }`}
                  >
                    {activity.passed ? "Repetir" : "Realizar"}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {content.done ? (
          <p className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-sm font-medium text-success">
            <CheckIcon className="size-4" />
            Terminado
          </p>
        ) : (
          <FinishContentButton contentId={content.id} pendingActivities={pendingActivities > 0} />
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
