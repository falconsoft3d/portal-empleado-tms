import Image from "next/image";
import { odooGetBirthdays, type Birthday } from "@/lib/odoo";
import { initials } from "@/lib/names";

function Avatar({ person, size }: { person: Birthday; size: "lg" | "sm" }) {
  const box = size === "lg" ? "size-16 text-lg" : "size-8 text-xs";
  return person.has_image ? (
    <Image
      src={`/api/employees/${person.id}/avatar`}
      alt={person.name}
      width={size === "lg" ? 64 : 32}
      height={size === "lg" ? 64 : 32}
      unoptimized
      className={`${box} shrink-0 rounded-full object-cover ${size === "lg" ? "ring-2 ring-accent-soft" : ""}`}
    />
  ) : (
    <span className={`${box} grid shrink-0 place-items-center rounded-full bg-accent-soft font-semibold text-accent`}>
      {initials(person.name)}
    </span>
  );
}

export async function Birthdays({ token }: { token: string }) {
  const data = await odooGetBirthdays(token);

  const [year, month, day] = data ? data.date.split("-").map(Number) : [0, 0, 0];
  const monthName = data
    ? new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" })
    : "";
  const shortMonth = monthName.slice(0, 3);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">Cumpleaños de hoy 🎂</h2>
      {data === null ? (
        <p className="text-sm text-muted">No se pudieron cargar los cumpleaños.</p>
      ) : data.today.length === 0 ? (
        <p className="text-sm text-muted">Hoy nadie cumple años.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
          {data.today.map((person) => (
            <li key={person.id} className="flex flex-col items-center text-center">
              <Avatar person={person} size="lg" />
              <span className="mt-2 line-clamp-2 text-xs font-medium text-ink">{person.name}</span>
              {person.job_title && <span className="line-clamp-1 text-[11px] text-muted">{person.job_title}</span>}
            </li>
          ))}
        </ul>
      )}

      {data && data.month.length > 0 && (
        <>
          <h3 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Este mes · {monthName}
          </h3>
          <ul className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {data.month.map((person) => {
              const past = person.day < day;
              return (
                <li key={person.id} className={`flex items-center gap-2 py-1 ${past ? "opacity-50" : ""}`}>
                  <Avatar person={person} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-xs text-ink">{person.name}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted">
                    {person.day} {shortMonth}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}

export function BirthdaysSkeleton() {
  return <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />;
}
