import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { hasLocale } from "next-intl";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { routing } from "@/lib/i18n/routing";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const t = await getTranslations({ locale: routing.defaultLocale, namespace: "metadata" });
    return {
      title: t("title"),
      description: t("description"),
    };
  } catch {
    return {
      title: "PortoLook — Personal Wealth & Asset Tracker",
      description: "Track your portfolio across stocks, crypto, gold, and more.",
    };
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const requestHeaders = await headers();
  const rawLocale = requestHeaders.get("x-next-intl-locale");
  const locale = hasLocale(routing.locales, rawLocale) ? rawLocale : routing.defaultLocale;

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-full bg-background text-foreground">{children}</body>
    </html>
  );
}