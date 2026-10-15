import { NextResponse, type NextRequest } from "next/server";
import { decrypt, SESSION_COOKIE } from "@/lib/jwt";

const PUBLIC_ROUTES = ["/login"];

// Comprobación optimista: las páginas vuelven a validar la sesión en el servidor.
export async function proxy(request: NextRequest) {
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
