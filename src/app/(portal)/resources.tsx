import { odooGetResources } from "@/lib/odoo";

function extension(filename: string) {
  const ext = filename.includes(".") ? filename.split(".").pop() ?? "" : "";
  return ext.slice(0, 4).toUpperCase() || "ARCH";
}

/** Recursos de la empresa (Planillas → Recursos): archivos para descargar. */
export async function Resources({ token }: { token: string }) {
  const resources = await odooGetResources(token);
  if (!resources?.length) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">Recursos de la empresa</h2>
      <ul className="space-y-1">
        {resources.map((resource) => (
          <li key={resource.id}>
            <a
              href={`/api/resources/${resource.id}/file`}
              download={resource.filename}
              className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface-muted"
              title={`Descargar ${resource.filename}`}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent-soft text-[10px] font-bold text-accent">
                {extension(resource.filename)}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-accent">{resource.name}</span>
                <span className="block truncate text-xs text-muted">{resource.filename}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
