import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/jwt";

const PUBLIC_ROUTES = ["/login"];
/** Páginas abiertas con o sin sesión (p. ej. la verificación del QR de los certificados). */
const OPEN_PREFIXES = ["/verificar/"];

// Comprobación optimista: las páginas vuelven a validar la sesión en el servidor.
export async function proxy(request: NextRequest) {
  if (OPEN_PREFIXES.some((prefix) => request.nextUrl.pathname.startsWith(prefix))) return NextResponse.next();
  const isPublic = PUBLIC_ROUTES.includes(request.nextUrl.pathname);
  const session = await decrypt(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isPublic && !session) {
    return NextResponse.redirect(new URL("/login", request.nextUrl));
  }
  if (isPublic && session) {
    return NextResponse.redirect(new URL("/", request.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
