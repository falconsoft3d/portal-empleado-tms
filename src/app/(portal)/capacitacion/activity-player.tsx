"use client";

import { useState, useTransition, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDownIcon, ArrowUpIcon, CheckIcon, SpinnerIcon, XIcon } from "@/components/icons";
import type { ActivityAnswers, ActivityDetail, ActivityResult } from "@/lib/odoo";
import { enviarActividad } from "./actions";

const BLANK = /_{3,}/;
const OPTION_LETTERS = ["A", "B", "C"];

const inputClass =
  "h-9 rounded-lg border border-line bg-surface px-2 text-sm text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-70";

function choiceClass(selected: boolean) {
  return `rounded-xl border px-3 py-2.5 text-left text-sm transition disabled:cursor-default ${
    selected
      ? "border-accent bg-accent-soft font-medium text-accent"
      : "border-line bg-surface text-ink enabled:hover:border-accent"
  }`;
}

const DEFAULT_PASSED_MESSAGE = "¡Muy bien!";
const DEFAULT_FAILED_MESSAGE = "Revisá el contenido y volvé a intentarlo.";

const primaryLinkClass =
  "inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover";

const submitButtonClass =
  "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8";

/**
 * Tarjeta de una pregunta; tras corregir se marca en verde (acierto) o rojo (error) y, si RRHH la cargó,
 * muestra debajo la devolución de la pregunta.
 */
function QuestionCard({
  number,
  correct,
  feedback,
  children,
}: {
  number: number;
  correct?: boolean;
  feedback?: string;
  children: ReactNode;
}) {
  const border = correct === undefined ? "border-line" : correct ? "border-success" : "border-danger";
  return (
    <li className={`rounded-2xl border bg-surface p-4 ${border}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-muted">
          {number}
        </span>
        <div className="min-w-0 flex-1">
          {children}
          {feedback && correct !== undefined && (
            <p
              className={`mt-3 whitespace-pre-line rounded-lg px-3 py-2 text-sm ${
                correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
              }`}
            >
              {feedback}
            </p>
          )}
        </div>
        {correct !== undefined && (
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full ${
              correct ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
            }`}
            aria-label={correct ? "Correcta" : "Incorrecta"}
          >
            {correct ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
          </span>
        )}
      </div>
    </li>
  );
}

export function ActivityPlayer({ activity }: { activity: ActivityDetail }) {
  return activity.type === "respuesta_escrita" ? (
    <WrittenActivityPlayer activity={activity} />
  ) : (
    <ChoiceActivityPlayer activity={activity} />
  );
}

/** Actividades con respuesta cerrada: se corrigen y muestran el resultado con su devolución. */
function ChoiceActivityPlayer({ activity }: { activity: ActivityDetail }) {
  const [answers, setAnswers] = useState<ActivityAnswers>({});
  // "Ordenar": ids de las preguntas en el orden que eligió el empleado (llegan mezcladas desde Odoo).
  const [order, setOrder] = useState(() => activity.questions.map((q) => q.id));
  const [result, setResult] = useState<ActivityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const done = result !== null;
  const setAnswer = (questionId: number, value: string | number | boolean) =>
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  const correctOf = (questionId: number) => result?.results[String(questionId)];
  const feedbackOf = (questionId: number) => result?.feedback?.[String(questionId)];

  const markMode = activity.type === "marcar_incorrectas";
  const finalAnswers: ActivityAnswers =
    activity.type === "ordenar"
      ? Object.fromEntries(order.map((id, index) => [String(id), index]))
      : markMode
        ? Object.fromEntries(activity.questions.map((q) => [String(q.id), answers[q.id] === true]))
        : answers;
  // En "marcar_incorrectas" dejar una imagen sin marcar también es una respuesta.
  const complete =
    activity.type === "ordenar" ||
    markMode ||
    activity.questions.every((q) => {
      const value = answers[q.id];
      return typeof value === "string" ? value.trim() !== "" : value !== undefined;
    });

  function submit() {
    setError(null);
    startTransition(async () => {
      const response = await enviarActividad(activity.id, finalAnswers);
      if (response.ok) setResult(response.result);
      else setError(response.error);
    });
  }

  // Vuelve a cargar la actividad sin respuestas.
  function retry() {
    setResult(null);
    setError(null);
    setAnswers({});
    setOrder(activity.questions.map((q) => q.id));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function move(index: number, delta: number) {
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }

  const questionsById = new Map(activity.questions.map((q) => [q.id, q]));
  const markedCount = activity.questions.filter((q) => answers[q.id] === true).length;

  return (
    <div className="flex flex-col gap-4">
      {markMode ? (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-muted">
            Toca las imágenes <b className="text-ink">incorrectas</b> para marcarlas. Marcadas: {markedCount} de{" "}
            {activity.questions.length}.
          </p>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {activity.questions.map((question, index) => {
              const marked = answers[question.id] === true;
              const correct = correctOf(question.id);
              const border =
                correct === undefined
                  ? marked
                    ? "border-danger ring-4 ring-danger/15"
                    : "border-line enabled:hover:border-accent"
                  : correct
                    ? "border-success"
                    : "border-danger";
              return (
                <li key={question.id}>
                  <button
                    type="button"
                    disabled={done}
                    aria-pressed={marked}
                    aria-label={`Imagen ${index + 1}${marked ? ", marcada como incorrecta" : ""}`}
                    onClick={() => setAnswer(question.id, !marked)}
                    className={`relative block w-full overflow-hidden rounded-xl border-2 transition disabled:cursor-default ${border}`}
                  >
                    <Image
                      src={`/api/activity-questions/${question.id}/image/1`}
                      alt={`Imagen ${index + 1}`}
                      width={256}
                      height={256}
                      unoptimized
                      className={`aspect-square w-full object-cover transition ${marked ? "opacity-60" : ""}`}
                    />
                    {marked && (
                      <span className="absolute inset-0 grid place-items-center">
                        <span className="grid size-10 place-items-center rounded-full bg-danger text-white shadow">
                          <XIcon className="size-6" />
                        </span>
                      </span>
                    )}
                    {correct !== undefined && (
                      <span
                        className={`absolute right-1.5 top-1.5 grid size-7 place-items-center rounded-full ${
                          correct ? "bg-success text-white" : "bg-danger text-white"
                        }`}
                        aria-label={correct ? "Bien clasificada" : "Mal clasificada"}
                      >
                        {correct ? <CheckIcon className="size-4" /> : <XIcon className="size-4" />}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : activity.type === "ordenar" ? (
        <ol className="space-y-2">
          {order.map((questionId, index) => (
            <QuestionCard key={questionId} number={index + 1} correct={correctOf(questionId)}>
              <div className="flex items-center gap-2">
                <p className="min-w-0 flex-1 text-sm text-ink">{questionsById.get(questionId)?.text}</p>
                <button
                  type="button"
                  disabled={done || index === 0}
                  onClick={() => move(index, -1)}
                  aria-label="Subir"
                  className="grid size-8 place-items-center rounded-lg border border-line text-muted transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40"
                >
                  <ArrowUpIcon className="size-4" />
                </button>
                <button
                  type="button"
                  disabled={done || index === order.length - 1}
                  onClick={() => move(index, 1)}
                  aria-label="Bajar"
                  className="grid size-8 place-items-center rounded-lg border border-line text-muted transition enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40"
                >
                  <ArrowDownIcon className="size-4" />
                </button>
              </div>
            </QuestionCard>
          ))}
        </ol>
      ) : (
        <ol className="space-y-3">
          {activity.questions.map((question, index) => {
            const value = answers[question.id];
            return (
              <QuestionCard
                key={question.id}
                number={index + 1}
                correct={correctOf(question.id)}
                feedback={feedbackOf(question.id)}
              >
                {activity.type === "completar" ? (
                  <p className="text-sm leading-9 text-ink">
                    {question.text.split(BLANK)[0]}
                    <input
                      type="text"
                      aria-label="Palabra que falta"
                      disabled={done}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => setAnswer(question.id, event.target.value)}
                      maxLength={200}
                      className={`${inputClass} mx-1 w-40 align-middle`}
                    />
                    {question.text.split(BLANK).slice(1).join("")}
                  </p>
                ) : (
                  <p className="text-sm font-medium text-ink">{question.text}</p>
                )}

                {activity.type === "examen" && (
                  <div className="mt-3 grid gap-2">
                    {question.options.map((option, optionIndex) => {
                      const key = String(optionIndex + 1);
                      return (
                        <button
                          key={key}
                          type="button"
                          disabled={done}
                          aria-pressed={value === key}
                          onClick={() => setAnswer(question.id, key)}
                          className={choiceClass(value === key)}
                        >
                          <span className="mr-2 font-semibold">{OPTION_LETTERS[optionIndex]}.</span>
                          {option}
                        </button>
                      );
                    })}
                  </div>
                )}

                {activity.type === "imagen" && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {["1", "2", "3"].map((key) => (
                      <button
                        key={key}
                        type="button"
                        disabled={done}
                        aria-pressed={value === key}
                        aria-label={`Imagen ${key}`}
                        onClick={() => setAnswer(question.id, key)}
                        className={`overflow-hidden rounded-xl border-2 transition disabled:cursor-default ${
                          value === key ? "border-accent ring-4 ring-accent/15" : "border-line enabled:hover:border-accent"
                        }`}
                      >
                        <Image
                          src={`/api/activity-questions/${question.id}/image/${key}`}
                          alt={`Imagen ${key}`}
                          width={256}
                          height={256}
                          unoptimized
                          className="aspect-square w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {activity.type === "verdadero_falso" && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {[true, false].map((option) => (
                      <button
                        key={String(option)}
                        type="button"
                        disabled={done}
                        aria-pressed={value === option}
                        onClick={() => setAnswer(question.id, option)}
                        className={`${choiceClass(value === option)} text-center`}
                      >
                        {option ? "Verdadero" : "Falso"}
                      </button>
                    ))}
                  </div>
                )}

                {activity.type === "relacionar" && (
                  <select
                    aria-label={`Pareja de ${question.text}`}
                    disabled={done}
                    value={typeof value === "number" ? value : ""}
                    onChange={(event) => setAnswer(question.id, Number(event.target.value))}
                    className={`${inputClass} mt-3 w-full`}
                  >
                    <option value="" disabled>
                      Elige la pareja…
                    </option>
                    {activity.pairs.map((pair) => (
                      <option key={pair.id} value={pair.id}>
                        {pair.text}
                      </option>
                    ))}
                  </select>
                )}
              </QuestionCard>
            );
          })}
        </ol>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {result ? (
        <div
          role="status"
          className={`rounded-2xl border p-5 ${
            result.passed ? "border-success bg-success-soft text-success" : "border-danger bg-danger-soft text-danger"
          }`}
        >
          <p className="flex items-center gap-2 text-lg font-semibold">
            {result.passed ? <CheckIcon className="size-5 shrink-0" /> : <XIcon className="size-5 shrink-0" />}
            {result.passed ? "¡Actividad aprobada!" : "Todavía no alcanzas el mínimo"} ({result.score}%)
          </p>
          <p className="mt-2 whitespace-pre-line text-sm">
            {result.message || (result.passed ? DEFAULT_PASSED_MESSAGE : DEFAULT_FAILED_MESSAGE)}
          </p>
          <p className="mt-2 text-xs opacity-80">
            Obtuviste {result.score}% (mínimo {result.min_score}%).
            {result.passed && activity.final && " Vuelve al curso para firmar y descargar tu certificado."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/capacitacion/${activity.course_id}`} className={primaryLinkClass}>
              Volver al curso
            </Link>
            {!result.passed && result.allow_retry !== false && (
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-10 items-center rounded-xl border border-line bg-surface px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                Volver a intentar
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <button type="button" disabled={!complete || pending} onClick={submit} className={submitButtonClass}>
            {pending && <SpinnerIcon className="size-4 animate-spin" />}
            {pending ? "Corrigiendo…" : "Enviar respuestas"}
          </button>
          {!complete && <p className="mt-2 text-xs text-muted">Responde todas las preguntas para enviar.</p>}
        </div>
      )}
    </div>
  );
}

/**
 * "Respuesta escrita": preguntas abiertas sin correctas ni incorrectas. Se aprueba al responder todas
 * respetando el mínimo de caracteres; si ya se respondió, se muestran las respuestas en solo lectura.
 */
function WrittenActivityPlayer({ activity }: { activity: ActivityDetail }) {
  const answered = activity.passed && Object.keys(activity.written_answers ?? {}).length > 0;
  const [texts, setTexts] = useState<Record<number, string>>(() =>
    Object.fromEntries(activity.questions.map((q) => [q.id, activity.written_answers?.[String(q.id)] ?? ""])),
  );
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const readOnly = answered || sent;
  const textOf = (questionId: number) => texts[questionId] ?? "";
  // Odoo descarta los espacios al principio y al final, y no acepta respuestas vacías.
  const meetsMinimum = (question: ActivityDetail["questions"][number]) =>
    textOf(question.id).trim().length >= Math.max(question.min_chars, 1);
  const complete = activity.questions.every(meetsMinimum);

  function submit() {
    setError(null);
    startTransition(async () => {
      const answers = Object.fromEntries(activity.questions.map((q) => [String(q.id), textOf(q.id).trim()]));
      const response = await enviarActividad(activity.id, answers);
      if (response.ok) setSent(true);
      else setError(response.error);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <ol className="space-y-3">
        {activity.questions.map((question, index) => {
          const text = textOf(question.id);
          const reached = meetsMinimum(question);
          return (
            <li key={question.id} className="rounded-2xl border border-line bg-surface p-4">
              <p className="text-xs font-semibold text-muted">
                Pregunta {index + 1} de {activity.questions.length}
              </p>
              <label htmlFor={`respuesta-${question.id}`} className="mt-1 block text-sm text-ink">
                {question.text}
              </label>
              <textarea
                id={`respuesta-${question.id}`}
                rows={5}
                disabled={readOnly}
                value={text}
                maxLength={question.max_chars}
                onChange={(event) =>
                  setTexts((prev) => ({ ...prev, [question.id]: event.target.value.slice(0, question.max_chars) }))
                }
                placeholder={readOnly ? "" : "Escribe tu respuesta…"}
                className="mt-3 w-full resize-y rounded-lg border border-line bg-surface p-3 text-sm leading-relaxed text-ink outline-none focus:border-accent focus:ring-4 focus:ring-accent/15 disabled:opacity-80"
              />
              {!readOnly && (
                <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                  <span className={reached ? "text-success" : "text-muted"}>
                    Mínimo {question.min_chars} caracteres
                  </span>
                  <span className="tabular-nums text-muted" aria-live="polite">
                    {text.length} / {question.max_chars}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {sent ? (
        <div role="status" className="rounded-2xl border border-success bg-success-soft p-5 text-success">
          <p className="flex items-center gap-2 text-lg font-semibold">
            <CheckIcon className="size-5 shrink-0" />
            ¡Gracias! Tu respuesta quedó registrada.
          </p>
          {activity.final && <p className="mt-2 text-sm">Vuelve al curso para firmar y descargar tu certificado.</p>}
          <div className="mt-4">
            <Link href={`/capacitacion/${activity.course_id}`} className={primaryLinkClass}>
              Volver al curso
            </Link>
          </div>
        </div>
      ) : (
        !answered && (
          <div className="flex flex-col items-stretch sm:items-end">
            <button type="button" disabled={!complete || pending} onClick={submit} className={submitButtonClass}>
              {pending && <SpinnerIcon className="size-4 animate-spin" />}
              {pending ? "Enviando…" : "Enviar respuesta"}
            </button>
            {!complete && (
              <p className="mt-2 text-xs text-muted">Escribe al menos el mínimo de caracteres en cada respuesta.</p>
            )}
          </div>
        )
      )}
    </div>
  );
}
