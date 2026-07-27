import { DollarSign } from "lucide-react";

import { useTranslation } from "@/i18n";

export type BudgetSidebarMarkerLevel = "healthy" | "warning" | "critical";

const levelClasses: Record<BudgetSidebarMarkerLevel, string> = {
  healthy: "bg-emerald-500/90 text-white",
  warning: "bg-amber-500/95 text-amber-950",
  critical: "bg-red-500/90 text-white",
};

export function BudgetSidebarMarker({
  title,
  level = "critical",
}: {
  title?: string;
  level?: BudgetSidebarMarkerLevel;
}) {
  const { t } = useTranslation();

  const defaultTitles: Record<BudgetSidebarMarkerLevel, string> = {
    healthy: t("budgetSidebarMarker.defaultTitles.healthy", { defaultValue: "Budget healthy" }),
    warning: t("budgetSidebarMarker.defaultTitles.warning", { defaultValue: "Budget warning" }),
    critical: t("budgetSidebarMarker.defaultTitles.critical", { defaultValue: "Paused by budget" }),
  };

  const accessibleTitle = title ?? defaultTitles[level];

  return (
    <span
      title={accessibleTitle}
      aria-label={accessibleTitle}
      className={`ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full shadow-(--shadow-extract-3) ${levelClasses[level]}`}
    >
      <DollarSign className="h-3 w-3" />
    </span>
  );
}
