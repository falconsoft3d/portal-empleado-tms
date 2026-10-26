/** Barra de avance: contenidos terminados sobre el total del curso. */
export function CourseProgress({ done, total }: { done: number; total: number }) {
  const percent = total ? Math.round((100 * done) / total) : 0;
  return (
    <span className="block">
      <span className="flex items-center justify-between text-xs text-muted">
        <span>
          {done} de {total} {total === 1 ? "clase terminada" : "clases terminadas"}
        </span>
        <span className="tabular-nums">{percent}%</span>
      </span>
      <span
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-surface-muted"
      >
        <span className="block h-full rounded-full bg-success transition-all" style={{ width: `${percent}%` }} />
      </span>
    </span>
  );
}
