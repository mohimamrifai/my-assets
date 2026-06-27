import { betterFetch } from "@better-fetch/fetch";
import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import type { auth } from "@/lib/auth";
import { routing } from "@/lib/i18n/routing";

type Session = typeof auth.$Infer.Session;

const intlMiddleware = createIntlMiddleware(routing);

function extractLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|id)(?:\/|$)/);
  return match?.[1] ?? routing.defaultLocale;
}

function localized(path: string, locale: string): string {
  if (path.startsWith(`/${locale}/`) || path === `/${locale}`) return path;
  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  const { data: session } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get("cookie") || "",
      },
    },
  );

  const pathname = request.nextUrl.pathname;
  const locale = extractLocale(pathname);
  const isAuthPage = /\/login$/.test(pathname);

  if (!session) {
    if (!isAuthPage) {
      return NextResponse.redirect(new URL(localized("/login", locale), request.url));
    }
    return intlResponse;
  }

  if (isAuthPage) {
    return NextResponse.redirect(new URL(localized("/dashboard", locale), request.url));
  }

  return intlResponse;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};