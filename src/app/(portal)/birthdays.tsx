import Image from "next/image";
import { odooGetBirthdays } from "@/lib/odoo";
import { initials } from "@/lib/names";

export async function Birthdays({ token }: { token: string }) {
  const birthdays = await odooGetBirthdays(token);

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">Cumpleaños de hoy 🎂</h2>
      {birthdays === null ? (
        <p className="text-sm text-muted">No se pudieron cargar los cumpleaños.</p>
      ) : birthdays.length === 0 ? (
        <p className="text-sm text-muted">Hoy nadie cumple años.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-3">
          {birthdays.map((person) => (
            <li key={person.id} className="flex flex-col items-center text-center">
              {person.image ? (
                <Image
                  src={person.image}
                  alt={person.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="size-16 rounded-full object-cover ring-2 ring-accent-soft"
                />
              ) : (
                <span className="grid size-16 place-items-center rounded-full bg-accent-soft text-lg font-semibold text-accent">
                  {initials(person.name)}
                </span>
              )}
              <span className="mt-2 line-clamp-2 text-xs font-medium text-ink">{person.name}</span>
              {person.job_title && <span className="line-clamp-1 text-[11px] text-muted">{person.job_title}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function BirthdaysSkeleton() {
  return <div className="h-40 animate-pulse rounded-2xl border border-line bg-surface" />;
}
