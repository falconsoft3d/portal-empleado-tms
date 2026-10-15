export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-xl bg-primary text-sm font-bold tracking-tight text-white">
        T
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className="block text-sm font-semibold text-ink">TMS Energy</span>
          <span className="block text-xs text-muted">Portal del Empleado</span>
        </span>
      )}
    </div>
  );
}
