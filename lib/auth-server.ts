import { auth } from "./auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export type UserSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export async function getSessionOrRedirect(locale?: string): Promise<UserSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    const loc = locale ?? (await getLocale());
    redirect(`/${loc}/login`);
  }
  return session;
}

export async function getOptionalSession(): Promise<UserSession | null> {
  return auth.api.getSession({ headers: await headers() });
}