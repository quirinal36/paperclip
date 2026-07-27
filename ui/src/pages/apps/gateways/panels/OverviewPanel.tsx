import { Copy } from "lucide-react";
import type { ToolMcpGatewayWithTokens, ToolProfileWithDetails } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import {
  activeTokenCount,
  allowedToolsLabel,
  expiringTokenCount,
  formatScope,
  type GatewayAppRow,
  gatewayAppDisplayName,
  isGatewayOn,
} from "../gateway-helpers";

export function OverviewPanel({
  gateway,
  profile,
  apps,
  agentNames,
  projectNames,
  toggleDisabled,
  onToggle,
}: {
  gateway: ToolMcpGatewayWithTokens;
  profile: ToolProfileWithDetails | undefined;
  apps: GatewayAppRow[];
  agentNames: Map<string, string>;
  projectNames: Map<string, string>;
  toggleDisabled: boolean;
  onToggle: () => void;
}) {
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const endpoint = `${typeof window !== "undefined" ? window.location.origin : ""}${gateway.endpointPath}`;
  const active = activeTokenCount(gateway);
  const expiring = expiringTokenCount(gateway);
  const needsAttention = apps.filter((app) => app.needsAttention);
  const on = isGatewayOn(gateway);

  const snippet = [
    "{",
    '  "mcpServers": {',
    `    "paperclip-${gateway.displaySlug}": {`,
    `      "url": "${endpoint}",`,
    '      "headers": { "Authorization": "Bearer pcgw_•••_TOKEN" }',
    "    }",
    "  }",
    "}",
  ].join("\n");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      pushToast({ title: t("overviewPanel.toast.copied", { defaultValue: "Copied" }), body: label, tone: "success" });
    } catch {
      pushToast({
        title: t("overviewPanel.toast.copyFailed", { defaultValue: "Copy failed" }),
        body: t("overviewPanel.toast.clipboardUnavailable", { defaultValue: "Clipboard access is unavailable." }),
        tone: "error",
      });
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <div className="text-xs font-medium text-muted-foreground">
            {on ? t("overviewPanel.status.on", { defaultValue: "On" }) : t("overviewPanel.status.off", { defaultValue: "Off" })}
          </div>
          <div className="mt-2">
            <ToggleSwitch
              checked={on}
              disabled={toggleDisabled}
              onCheckedChange={onToggle}
              aria-label={t("overviewPanel.toggle.ariaLabel", { defaultValue: "Toggle gateway" })}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("overviewPanel.toggle.hint", { defaultValue: "Toggle the whole gateway off here." })}
          </p>
        </div>
        <StatCard label={t("overviewPanel.stats.appsLabel", { defaultValue: "Apps" })}>
          {apps.length} {apps.length === 1 ? t("overviewPanel.stats.appSingular", { defaultValue: "app" }) : t("overviewPanel.stats.appPlural", { defaultValue: "apps" })}
          {profile ? ` · ${allowedToolsLabel(profile)}` : ""}
        </StatCard>
        <StatCard label={t("overviewPanel.stats.tokensLabel", { defaultValue: "Tokens" })}>
          {active} {t("overviewPanel.stats.active", { defaultValue: "active" })}
          {expiring > 0 ? ` · ${expiring} ${t("overviewPanel.stats.expiring", { defaultValue: "expiring" })}` : ""}
        </StatCard>
        <StatCard label={t("overviewPanel.stats.healthLabel", { defaultValue: "Health" })}>
          {needsAttention.length === 0
            ? t("overviewPanel.stats.allGreen", { defaultValue: "All green" })
            : t("overviewPanel.stats.needsAttentionCount", { defaultValue: "{{count}} needs attention", count: needsAttention.length })}
        </StatCard>
      </div>

      <section className="rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              {t("overviewPanel.access.title", { defaultValue: "Who can use it" })}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("overviewPanel.access.description", {
                defaultValue: "Anyone holding an active token below, restricted by the rules in the bound profile.",
              })}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Chip>
            {t("overviewPanel.access.scope", {
              defaultValue: "Scope · {{scope}}",
              scope: formatScope(gateway, projectNames, agentNames),
            })}
          </Chip>
          <Chip>
            {t("overviewPanel.access.profile", {
              defaultValue: "Profile · {{name}}",
              name: profile?.name ?? t("overviewPanel.access.profileUnavailable", { defaultValue: "Unavailable" }),
            })}
          </Chip>
          <Chip>
            {active} {t("overviewPanel.access.active", { defaultValue: "active" })}{" "}
            {active === 1
              ? t("overviewPanel.access.tokenSingular", { defaultValue: "token" })
              : t("overviewPanel.access.tokenPlural", { defaultValue: "tokens" })}
          </Chip>
        </div>
      </section>

      <section className="rounded-lg border border-border p-4">
        <h3 className="text-sm font-semibold text-foreground">
          {t("overviewPanel.appsSection.title", { defaultValue: "Apps in this gateway" })}
        </h3>
        {apps.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            {t("overviewPanel.appsSection.empty", {
              defaultValue: "This gateway’s profile doesn’t include any apps yet.",
            })}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {apps.map((app) => (
              <AppRow key={app.application.id} app={app} />
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">
            {t("overviewPanel.connect.title", { defaultValue: "How clients connect" })}
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void copy(snippet, t("overviewPanel.connect.clientConfig", { defaultValue: "Client config" }))}
          >
            <Copy className="mr-1 h-3.5 w-3.5" />
            {t("overviewPanel.connect.copy", { defaultValue: "Copy" })}
          </Button>
        </div>
        <pre className="mt-3 overflow-auto whitespace-pre-wrap break-words rounded bg-background p-3 font-mono text-xs text-muted-foreground">
          {snippet}
        </pre>
      </section>
    </div>
  );
}

function StatCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-sm font-semibold text-foreground">{children}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border px-3 py-1 text-xs font-medium text-foreground">
      {children}
    </span>
  );
}

function AppRow({ app }: { app: GatewayAppRow }) {
  const { t } = useTranslation();
  const href = app.connection ? `/apps/${app.connection.id}/setup` : `/apps/app/${app.application.id}/setup`;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <Link to={href} className="font-medium text-foreground hover:underline">
          {gatewayAppDisplayName(app)}
        </Link>
        <div className="text-xs text-muted-foreground">
          {app.toolCount} {app.toolCount === 1 ? t("overviewPanel.appRow.toolSingular", { defaultValue: "tool" }) : t("overviewPanel.appRow.toolPlural", { defaultValue: "tools" })}
          {app.needsAttention && app.attentionReason ? ` · ${app.attentionReason}` : ""}
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
          app.needsAttention
            ? "border-foreground bg-foreground text-background"
            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        )}
      >
        {app.needsAttention
          ? t("overviewPanel.appRow.needsAttention", { defaultValue: "Needs attention" })
          : t("overviewPanel.appRow.healthy", { defaultValue: "Healthy" })}
      </span>
    </li>
  );
}
