import type { ToolProfileWithDetails } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n";
import { allowedToolsLabel, type GatewayAppRow, gatewayAppDisplayName } from "../gateway-helpers";

/**
 * Apps & tools tab — which apps this gateway exposes and how many tools each
 * contributes, derived from the bound access profile. Missing credentials
 * surface as "Needs attention", carried from the connection health status.
 */
export function AppsToolsPanel({
  apps,
  profile,
}: {
  apps: GatewayAppRow[];
  profile: ToolProfileWithDetails | undefined;
}) {
  const { t } = useTranslation();
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {t("appsToolsPanel.description.intro", {
          defaultValue: "These apps go through this gateway. The bound profile",
        })}
        {profile
          ? t("appsToolsPanel.description.profileName", {
              defaultValue: " ({{name}})",
              name: profile.name,
            })
          : ""}
        {t("appsToolsPanel.description.allowedIntro", {
          defaultValue: " decides which tools are allowed",
        })}
        {profile
          ? t("appsToolsPanel.description.allowedTools", {
              defaultValue: " — {{label}}.",
              label: allowedToolsLabel(profile),
            })
          : "."}
        {t("appsToolsPanel.description.changeProfile", {
          defaultValue: " Change the profile under Advanced.",
        })}
      </p>

      {apps.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          {t("appsToolsPanel.empty", {
            defaultValue: "No apps are assigned to this gateway’s profile yet.",
          })}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-(--sz-32rem) text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-2.5">{t("appsToolsPanel.columns.app", { defaultValue: "App" })}</th>
                <th className="px-4 py-2.5">{t("appsToolsPanel.columns.tools", { defaultValue: "Tools" })}</th>
                <th className="px-4 py-2.5">{t("appsToolsPanel.columns.status", { defaultValue: "Status" })}</th>
                <th className="px-4 py-2.5 text-right" />
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => {
                const href = app.connection
                  ? `/apps/${app.connection.id}/setup`
                  : `/apps/app/${app.application.id}/setup`;
                return (
                  <tr key={app.application.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link to={href} className="font-medium text-foreground hover:underline">
                        {gatewayAppDisplayName(app)}
                      </Link>
                      {app.needsAttention && app.attentionReason ? (
                        <div className="text-xs text-muted-foreground">{app.attentionReason}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {app.toolCount}{" "}
                      {app.toolCount === 1
                        ? t("appsToolsPanel.tool.singular", { defaultValue: "tool" })
                        : t("appsToolsPanel.tool.plural", { defaultValue: "tools" })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                          app.needsAttention
                            ? "border-foreground bg-foreground text-background"
                            : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
                        )}
                      >
                        {app.needsAttention
                          ? t("appsToolsPanel.status.needsAttention", { defaultValue: "Needs attention" })
                          : t("appsToolsPanel.status.healthy", { defaultValue: "Healthy" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={href} className="text-xs font-medium text-primary hover:underline">
                        {t("appsToolsPanel.actions.open", { defaultValue: "Open →" })}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
