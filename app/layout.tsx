import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import { CurrencyProvider } from "@/components/providers/CurrencyProvider";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PortoLook | My Wealth & Asset Tracker",
  description: "Personal Wealth & Asset Tracker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="font-sans min-h-full flex flex-col bg-background text-foreground">
        <CurrencyProvider>
          {children}
        </CurrencyProvider>
        <Toaster />
      </body>
    </html>
  );
}
