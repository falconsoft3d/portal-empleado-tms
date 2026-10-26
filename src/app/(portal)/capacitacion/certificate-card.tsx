"use client";

import { useRef, useState, useTransition, type PointerEvent } from "react";
import { CheckIcon, SpinnerIcon } from "@/components/icons";
import type { Certificate } from "@/lib/odoo";
import { firmarCertificado } from "./actions";

// La firma se imprime sobre el PDF blanco: se dibuja siempre en tinta oscura, sea cual sea el tema.
const INK = "#111827";

function SignaturePad({ onSign, pending }: { onSign: (dataUrl: string) => void; pending: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [empty, setEmpty] = useState(true);

  function context() {
    const canvas = canvasRef.current!;
    // El lienzo se dimensiona al tamaño real en pantalla (y la densidad de píxeles) al empezar a firmar.
    const ratio = window.devicePixelRatio || 1;
    const { width, height } = canvas.getBoundingClientRect();
    if (canvas.width !== Math.round(width * ratio)) {
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
    return ctx;
  }

  function point(event: PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function start(event: PointerEvent<HTMLCanvasElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = true;
    const ctx = context();
    const { x, y } = point(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + 0.1, y + 0.1);
    ctx.stroke();
    setEmpty(false);
  }

  function draw(event: PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const { x, y } = point(event);
    ctx.lineTo(x, y);
    ctx.stroke();
  }

  function clear() {
    const canvas = canvasRef.current!;
    canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
    setEmpty(true);
  }

  return (
    <div>
      <canvas
        ref={canvasRef}
        aria-label="Dibuja tu firma"
        onPointerDown={start}
        onPointerMove={draw}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
        className="h-40 w-full touch-none rounded-xl border border-dashed border-line bg-white"
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={empty || pending}
          onClick={() => onSign(canvasRef.current!.toDataURL("image/png"))}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending && <SpinnerIcon className="size-4 animate-spin" />}
          Firmar certificado
        </button>
        <button
          type="button"
          disabled={empty || pending}
          onClick={clear}
          className="inline-flex h-10 items-center rounded-xl border border-line bg-surface px-5 text-sm font-medium text-ink transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          Borrar
        </button>
      </div>
    </div>
  );
}

/** Certificado del curso: firmarlo online y descargarlo cuando también lo firmó el profesor. */
export function CertificateCard({ courseId, certificate }: { courseId: number; certificate: Certificate }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function sign(dataUrl: string) {
    setError(null);
    startTransition(async () => setError(await firmarCertificado(courseId, dataUrl)));
  }

  return (
    <div className="mt-4 rounded-xl border border-line bg-canvas p-4">
      <p className="text-sm font-semibold text-ink">Certificado {certificate.number}</p>

      {!certificate.signed ? (
        <>
          <p className="mt-1 mb-3 text-sm text-muted">
            Dibuja tu firma con el dedo o el ratón. Aparecerá en tu certificado digital junto a la del profesor.
          </p>
          <SignaturePad onSign={sign} pending={pending} />
        </>
      ) : certificate.downloadable ? (
        <a
          href={`/api/courses/${courseId}/certificate`}
          download
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-white transition hover:bg-primary-hover"
        >
          <CheckIcon className="size-4" />
          Descargar certificado (PDF)
        </a>
      ) : (
        <p className="mt-1 text-sm text-muted">
          Ya firmaste tu certificado. Podrás descargarlo cuando el profesor del curso lo firme.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
