import { Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export default function AssetsPage() {
  const t = useTranslations("nav");
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{t("assets")}</h1>
          <p className="text-sm text-muted-foreground">Manage all your assets in one place.</p>
        </div>
        <Button asChild>
          <Link href="/assets/new">
            <PlusCircle size={16} className="mr-2" />
            {t("newAsset")}
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-border bg-card/50 p-12 text-center">
        <div className="mx-auto size-12 rounded-full bg-muted flex items-center justify-center mb-4">
          <Briefcase size={20} className="text-muted-foreground" />
        </div>
        <h2 className="text-base font-medium mb-1">Assets list coming soon</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          A dedicated assets browser with filtering, sorting, and bulk actions is planned for Phase 2.
        </p>
      </div>
    </div>
  );
}