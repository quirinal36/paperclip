import { useEffect } from "react";
import { ArrowLeft, RadioTower } from "lucide-react";
import { Link } from "@/lib/router";
import { useTranslation } from "@/i18n";
import { ActiveAgentsPanel } from "../components/ActiveAgentsPanel";
import { EmptyState } from "../components/EmptyState";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";

const DASHBOARD_LIVE_RUN_LIMIT = 50;

export function DashboardLive() {
  const { t } = useTranslation();
  const { selectedCompanyId, companies } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();

  useEffect(() => {
    setBreadcrumbs([
      { label: t("dashboardLive.breadcrumbs.dashboard", { defaultValue: "Dashboard" }), href: "/dashboard" },
      { label: t("dashboardLive.breadcrumbs.liveRuns", { defaultValue: "Live runs" }) },
    ]);
  }, [setBreadcrumbs, t]);

  if (!selectedCompanyId) {
    return (
      <EmptyState
        icon={RadioTower}
        message={companies.length === 0 ? t("dashboardLive.empty.noCompany", { defaultValue: "Create a company to view live runs." }) : t("dashboardLive.empty.selectCompany", { defaultValue: "Select a company to view live runs." })}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("dashboardLive.backToDashboard", { defaultValue: "Dashboard" })}
          </Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-normal text-foreground">{t("dashboardLive.title", { defaultValue: "Live agent runs" })}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("dashboardLive.subtitle", { defaultValue: "Active runs first, followed by the most recent completed runs." })}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">{t("dashboardLive.showingUpTo", { defaultValue: "Showing up to {{limit}}", limit: DASHBOARD_LIVE_RUN_LIMIT })}</div>
      </div>

      <ActiveAgentsPanel
        companyId={selectedCompanyId}
        title={t("dashboardLive.activePanel.title", { defaultValue: "Active / recent" })}
        minRunCount={DASHBOARD_LIVE_RUN_LIMIT}
        fetchLimit={DASHBOARD_LIVE_RUN_LIMIT}
        cardLimit={DASHBOARD_LIVE_RUN_LIMIT}
        gridClassName="gap-3 md:grid-cols-2 2xl:grid-cols-3"
        cardClassName="h-(--sz-420px)"
        emptyMessage={t("dashboardLive.activePanel.emptyMessage", { defaultValue: "No active or recent agent runs." })}
        queryScope="dashboard-live"
        showMoreLink={false}
      />
    </div>
  );
}
