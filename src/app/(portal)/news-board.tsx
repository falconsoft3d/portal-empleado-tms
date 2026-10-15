import Image from "next/image";
import { odooGetNews } from "@/lib/odoo";

function formatDate(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

/** Tablón de anuncios: últimas noticias publicadas desde Odoo (Planillas → Noticias). */
export async function NewsBoard({ token }: { token: string }) {
  const news = await odooGetNews(token);
  if (!news?.length) return null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-4">
      <h2 className="mb-3 text-sm font-semibold text-ink">Tablón de anuncios</h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {news.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-xl border border-line">
            {item.has_image && (
              <Image
                src={`/api/news/${item.id}/image`}
                alt={item.name}
                width={512}
                height={288}
                unoptimized
                className="aspect-video w-full object-cover"
              />
            )}
            <div className="p-3">
              <h3 className="font-semibold text-ink">{item.name}</h3>
              <p className="text-xs text-muted">{formatDate(item.date)}</p>
              {item.text &&
                (item.text.length > 220 ? (
                  <details className="group mt-2 text-sm text-ink">
                    <summary className="cursor-pointer list-none">
                      <span className="line-clamp-3 whitespace-pre-line group-open:hidden">{item.text}</span>
                      <span className="mt-1 inline-block text-xs font-medium text-accent group-open:hidden">Leer más</span>
                    </summary>
                    <p className="whitespace-pre-line">{item.text}</p>
                  </details>
                ) : (
                  <p className="mt-2 whitespace-pre-line text-sm text-ink">{item.text}</p>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
