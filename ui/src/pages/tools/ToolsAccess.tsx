import { useEffect } from "react";
import { Settings2, Wrench } from "lucide-react";
import { Link, Navigate, useParams } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { ProfilesIndex } from "./profiles/ProfilesIndex";
import { PoliciesTab } from "./PoliciesTab";
import { RuntimeTab } from "./RuntimeTab";
import { AuditTab } from "./AuditTab";
import { GatewaysTab } from "./GatewaysTab";
import { PasteConfigTab } from "./PasteConfigTab";
import { RunYourOwnTab } from "./RunYourOwnTab";
import { SmokeLabTab } from "./SmokeLabTab";
import {
  ADVANCED_TABS,
  TOOL_TABS,
  advancedTabHref,
  isAdvancedSetupTab,
  type ToolTabKey,
} from "./tool-tabs";

function renderTab(tab: ToolTabKey, companyId: string) {
  switch (tab) {
    case "profiles":
      return <ProfilesIndex companyId={companyId} />;
    case "policies":
      return <PoliciesTab companyId={companyId} />;
    case "runtime":
      return <RuntimeTab companyId={companyId} />;
    case "audit":
      return <AuditTab companyId={companyId} />;
    case "gateways":
      return <GatewaysTab companyId={companyId} />;
    case "smoke-lab":
      return <SmokeLabTab companyId={companyId} />;
    case "paste-config":
      return <PasteConfigTab companyId={companyId} />;
    case "run-your-own":
    default:
      return <RunYourOwnTab companyId={companyId} />;
  }
}

export function ToolsAccess() {
  const { t } = useTranslation();
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const params = useParams<{ tab?: string }>();
  const activeTab = (TOOL_TABS.find((t) => t.key === params.tab)?.key ?? "run-your-own") as ToolTabKey;
  const advanced = isAdvancedSetupTab(activeTab);
  const tabLabel = TOOL_TABS.find((t) => t.key === activeTab)?.label;

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? t("toolsAccess.breadcrumbs.company", { defaultValue: "Company" }), href: "/dashboard" },
      { label: t("toolsAccess.breadcrumbs.apps", { defaultValue: "Apps" }), href: "/apps" },
      ...(advanced
        ? [{ label: t("toolsAccess.breadcrumbs.advancedSetup", { defaultValue: "Advanced setup" }) }]
        : [
            { label: t("toolsAccess.breadcrumbs.advancedSetup", { defaultValue: "Advanced setup" }), href: advancedTabHref("run-your-own") },
            { label: tabLabel ?? t("toolsAccess.breadcrumbs.developerTools", { defaultValue: "Developer tools" }) },
          ]),
    ]);
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, selectedCompany?.name, advanced, tabLabel, t]);

  if (!selectedCompanyId) {
    return <div className="p-6 text-sm text-muted-foreground">{t("toolsAccess.selectCompany", { defaultValue: "Select a company to open advanced setup." })}</div>;
  }

  // Retired developer tabs (PAP-10915/PAP-10928) — keep old links working.
  if (
    params.tab === "applications" ||
    params.tab === "connections" ||
    params.tab === "overview" ||
    params.tab === "examples"
  ) {
    return <Navigate to="/apps" replace />;
  }

  if (advanced) {
    // M8a/M8b chrome (PAP-10839 wires): Advanced badge, plain-words subtitle,
    // and a two-tab switcher. The developer surface stays behind a quiet link.
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 p-4 sm:p-6">
        <header>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold text-foreground">{t("toolsAccess.advanced.title", { defaultValue: "Advanced setup" })}</h1>
            <span className="inline-flex items-center rounded-full bg-foreground px-2.5 py-0.5 text-(length:--text-micro) font-bold text-background">
              {t("toolsAccess.advanced.badge", { defaultValue: "Advanced" })}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("toolsAccess.advanced.subtitle", { defaultValue: "For tools that aren't in the gallery. You'll need details from the tool's documentation. Most people never need this — if the app you want is in the gallery," })}{" "}
            <Link to="/apps" className="font-medium text-primary hover:underline">
              {t("toolsAccess.advanced.connectLink", { defaultValue: "connect it there instead" })}
            </Link>
            .
          </p>
        </header>

        <nav className="flex items-center gap-6 border-b border-border">
          {ADVANCED_TABS.map((tab) => (
            <Link
              key={tab.key}
              to={advancedTabHref(tab.key)}
              className={cn(
                "-mb-px border-b-2 pb-2 text-sm transition-colors",
                tab.key === activeTab
                  ? "border-foreground font-bold text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>

        <div className="min-h-(--sz-300px)">{renderTab(activeTab, selectedCompanyId)}</div>

        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Wrench className="h-3.5 w-3.5" />
          {t("toolsAccess.developerSurface.prompt", { defaultValue: "Looking for the developer surface?" })}{" "}
          <Link to={advancedTabHref("profiles")} className="font-medium text-primary hover:underline">
            {t("toolsAccess.developerSurface.openLink", { defaultValue: "Open developer tools" })}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 p-4 sm:p-6">
      <div>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-xl font-bold text-foreground">{t("toolsAccess.developer.title", { defaultValue: "Developer tools" })}</h1>
        </div>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          {t("toolsAccess.developer.description", { defaultValue: "Apps is the simple way to connect tools. This Developer area is for wiring your own servers, tokens, and rules by hand — most teams never need it." })}
        </p>
      </div>

      <div className="min-h-(--sz-300px)">{renderTab(activeTab, selectedCompanyId)}</div>
    </div>
  );
}
