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

/** Tarjeta de una pregunta; tras corregir se marca en verde (acierto) o rojo (error). */
function QuestionCard({ number, correct, children }: { number: number; correct?: boolean; children: ReactNode }) {
  const border = correct === undefined ? "border-line" : correct ? "border-success" : "border-danger";
  return (
    <li className={`rounded-2xl border bg-surface p-4 ${border}`}>
      <div className="flex items-start gap-3">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-muted">
          {number}
        </span>
        <div className="min-w-0 flex-1">{children}</div>
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

  const finalAnswers: ActivityAnswers =
    activity.type === "ordenar" ? Object.fromEntries(order.map((id, index) => [String(id), index])) : answers;
  const complete =
    activity.type === "ordenar" ||
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

  function retry() {
    setResult(null);
    setAnswers({});
  }

  function move(index: number, delta: number) {
    setOrder((prev) => {
      const next = [...prev];
      [next[index], next[index + delta]] = [next[index + delta], next[index]];
      return next;
    });
  }

  const questionsById = new Map(activity.questions.map((q) => [q.id, q]));

  return (
    <div className="flex flex-col gap-4">
      {activity.type === "ordenar" ? (
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
              <QuestionCard key={question.id} number={index + 1} correct={correctOf(question.id)}>
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
          className={`rounded-2xl p-5 ${result.passed ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
        >
          <p className="text-lg font-semibold">
            {result.passed ? "¡Actividad aprobada!" : "Todavía no alcanzas el mínimo"}
          </p>
          <p className="mt-1 text-sm">
            Obtuviste {result.score}% (mínimo {result.min_score}%).
            {result.passed && activity.final && " Vuelve al curso para firmar y descargar tu certificado."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={`/capacitacion/${activity.course_id}`}
              className="inline-flex h-10 items-center rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover"
            >
              Volver al curso
            </Link>
            {!result.passed && (
              <button
                type="button"
                onClick={retry}
                className="inline-flex h-10 items-center rounded-xl border border-line bg-surface px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent"
              >
                Intentar de nuevo
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            disabled={!complete || pending}
            onClick={submit}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
          >
            {pending && <SpinnerIcon className="size-4 animate-spin" />}
            {pending ? "Corrigiendo…" : "Enviar respuestas"}
          </button>
          {!complete && <p className="mt-2 text-xs text-muted">Responde todas las preguntas para enviar.</p>}
        </div>
      )}
    </div>
  );
}
