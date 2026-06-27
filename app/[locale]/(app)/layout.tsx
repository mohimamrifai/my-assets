import { Sidebar } from "@/components/app-shell/Sidebar";
import { Header } from "@/components/app-shell/Header";
import { LocaleSwitcher } from "@/components/app-shell/LocaleSwitcher";
import { CurrencySwitcher } from "@/components/app-shell/CurrencySwitcher";
import { ThemeToggle } from "@/components/app-shell/ThemeToggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-60">
        <div className="sticky top-0 z-30 hidden md:flex items-center justify-end gap-1 px-8 h-14 border-b border-border bg-background/80 backdrop-blur-md">
          <CurrencySwitcher />
          <LocaleSwitcher />
          <ThemeToggle />
        </div>
        <Header />
        <main className="p-4 md:p-8 pb-16">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}