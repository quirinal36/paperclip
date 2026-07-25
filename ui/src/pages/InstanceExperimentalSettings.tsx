import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Clock, FlaskConical, Lock, Play, Search } from "lucide-react";
import type {
  InstanceExperimentalSettings,
  InstanceExperimentalSettingsWithManaged,
  IssueGraphLivenessAutoRecoveryPreview,
  ManagedSettingMetadata,
  PatchInstanceExperimentalSettings,
} from "@paperclipai/shared";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { getWorktreeInstanceId, isWorktreeRuntime } from "../lib/worktree-branding";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";

function issueHref(identifier: string | null, issueId: string) {
  if (!identifier) return `/issues/${issueId}`;
  const prefix = identifier.split("-")[0] || "PAP";
  return `/${prefix}/issues/${identifier}`;
}

function formatRecoveryState(state: string) {
  return state.replace(/_/g, " ");
}

type WorktreeRunExecutionDisplayState =
  | { kind: "off" }
  | { kind: "armed"; activatedAt: string }
  | { kind: "fail_closed"; reason: "missing_cutoff" | "missing_instance_id" | "instance_mismatch" };

/**
 * Mirror of the server's `resolveWorktreeRunExecutionActivation` fail-closed
 * ladder (server/src/services/instance-settings.ts) so the card never claims a
 * copied/legacy row is arming execution. The derived fields are display-only —
 * the PATCH the toggle sends still writes just the boolean.
 */
function resolveWorktreeRunExecutionDisplayState(
  settings:
    | Pick<
        InstanceExperimentalSettings,
        | "enableWorktreeRunExecution"
        | "worktreeRunExecutionActivatedAt"
        | "worktreeRunExecutionActivationInstanceId"
      >
    | undefined,
  currentInstanceId: string | null,
): WorktreeRunExecutionDisplayState {
  if (settings?.enableWorktreeRunExecution !== true) return { kind: "off" };
  if (!settings.worktreeRunExecutionActivatedAt) return { kind: "fail_closed", reason: "missing_cutoff" };
  if (!currentInstanceId) return { kind: "fail_closed", reason: "missing_instance_id" };
  if (settings.worktreeRunExecutionActivationInstanceId !== currentInstanceId) {
    return { kind: "fail_closed", reason: "instance_mismatch" };
  }
  return { kind: "armed", activatedAt: settings.worktreeRunExecutionActivatedAt };
}

function formatActivationTimestamp(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

// PAP-11233: keep Conference Room code intact, but hide the user-facing opt-in for now.
const SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING = false;

function ManagedByCloudBadge() {
  const { t } = useTranslation();
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Lock aria-hidden="true" />
      {t("instanceExperimentalSettings.managed.badge", { defaultValue: "Managed by Paperclip Cloud" })}
    </Badge>
  );
}

function ExperimentalToggleCard({
  title,
  experimental = false,
  description,
  footnote,
  checked,
  onCheckedChange,
  disabled,
  managed,
  ariaLabel,
}: {
  title: string;
  experimental?: boolean;
  description: string;
  footnote?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled: boolean;
  managed?: ManagedSettingMetadata;
  ariaLabel: string;
}) {
  const { t } = useTranslation();
  const isManaged = managed?.managed === true;
  return (
    <Card className="block p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-sm font-semibold">{title}</h2>
            {experimental ? (
              <Badge variant="secondary">
                {t("instanceExperimentalSettings.badges.experimental", { defaultValue: "Experimental" })}
              </Badge>
            ) : null}
            {isManaged ? <ManagedByCloudBadge /> : null}
          </div>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
          {footnote ? <p className="max-w-2xl text-xs text-muted-foreground">{footnote}</p> : null}
        </div>
        <ToggleSwitch
          checked={checked}
          onCheckedChange={(next) => {
            if (isManaged) return;
            onCheckedChange(next);
          }}
          disabled={disabled || isManaged}
          aria-label={ariaLabel}
        />
      </div>
    </Card>
  );
}

function RecoveryPreviewDialog({
  preview,
  open,
  onOpenChange,
  onEnableOnly,
  onEnableAndRun,
  isPending,
}: {
  preview: IssueGraphLivenessAutoRecoveryPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnableOnly: () => void;
  onEnableAndRun: () => void;
  isPending: boolean;
}) {
  const { t } = useTranslation();
  const count = preview?.recoverableFindings ?? 0;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {t("instanceExperimentalSettings.recoveryDialog.title", { defaultValue: "Confirm auto-recovery" })}
          </DialogTitle>
          <DialogDescription>
            {preview
              ? count === 1
                ? t("instanceExperimentalSettings.recoveryDialog.matchOne", {
                    defaultValue: "{{count}} recovery task match the last {{lookbackHours}} hours.",
                    count,
                    lookbackHours: preview.lookbackHours,
                  })
                : t("instanceExperimentalSettings.recoveryDialog.matchOther", {
                    defaultValue: "{{count}} recovery tasks match the last {{lookbackHours}} hours.",
                    count,
                    lookbackHours: preview.lookbackHours,
                  })
              : t("instanceExperimentalSettings.recoveryDialog.checking", {
                  defaultValue: "Checking recovery candidates before enabling.",
                })}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-(--sz-calc-36) space-y-3 overflow-y-auto pr-1">
          {preview && preview.items.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
              {t("instanceExperimentalSettings.recoveryDialog.emptyState", {
                defaultValue:
                  "No recovery tasks would be created right now. Auto-recovery can still run for future liveness incidents in this window.",
              })}
            </div>
          ) : null}

          {preview?.items.map((item) => (
            <Card key={item.incidentKey} className="block px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={issueHref(item.identifier, item.issueId)}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  {item.identifier ?? item.issueId}
                </a>
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {formatRecoveryState(item.state)}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                {t("instanceExperimentalSettings.recoveryDialog.recoveryTarget", { defaultValue: "Recovery target:" })}{" "}
                <a
                  href={issueHref(item.recoveryIdentifier, item.recoveryIssueId)}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {item.recoveryIdentifier ?? item.recoveryIssueId}
                </a>
              </div>
            </Card>
          ))}
        </div>

        {preview && preview.skippedOutsideLookback > 0 ? (
          <p className="text-xs text-muted-foreground">
            {preview.skippedOutsideLookback === 1
              ? t("instanceExperimentalSettings.recoveryDialog.skippedOne", {
                  defaultValue: "{{count}} current finding is outside the configured lookback and will not be touched.",
                  count: preview.skippedOutsideLookback,
                })
              : t("instanceExperimentalSettings.recoveryDialog.skippedOther", {
                  defaultValue: "{{count}} current findings are outside the configured lookback and will not be touched.",
                  count: preview.skippedOutsideLookback,
                })}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {t("instanceExperimentalSettings.actions.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button variant="outline" onClick={onEnableOnly} disabled={isPending || !preview}>
            {t("instanceExperimentalSettings.actions.enableOnly", { defaultValue: "Enable only" })}
          </Button>
          <Button onClick={onEnableAndRun} disabled={isPending || !preview}>
            {count > 0
              ? t("instanceExperimentalSettings.actions.enableAndCreate", {
                  defaultValue: "Enable and create {{count}}",
                  count,
                })
              : t("instanceExperimentalSettings.actions.enable", { defaultValue: "Enable" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function InstanceExperimentalSettings() {
  const { t } = useTranslation();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [lookbackHoursDraft, setLookbackHoursDraft] = useState("24");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<IssueGraphLivenessAutoRecoveryPreview | null>(null);

  function closeRecoveryPreview() {
    setPreviewDialogOpen(false);
    setPendingPreview(null);
  }

  useEffect(() => {
    setBreadcrumbs([
      {
        label: t("instanceExperimentalSettings.breadcrumbs.settings", { defaultValue: "Settings" }),
        href: "/company/settings",
      },
      {
        label: t("instanceExperimentalSettings.breadcrumbs.instanceSettings", {
          defaultValue: "Instance settings",
        }),
        href: "/company/settings/instance/general",
      },
      { label: t("instanceExperimentalSettings.breadcrumbs.experimental", { defaultValue: "Experimental" }) },
    ]);
  }, [setBreadcrumbs, t]);

  const experimentalQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const toggleMutation = useMutation<
    InstanceExperimentalSettingsWithManaged,
    Error,
    PatchInstanceExperimentalSettings,
    { previousSettings?: InstanceExperimentalSettingsWithManaged }
  >({
    mutationFn: async (patch: PatchInstanceExperimentalSettings) =>
      instanceSettingsApi.updateExperimental(patch),
    onMutate: async (patch) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.instance.experimentalSettings });
      const previousSettings = queryClient.getQueryData<InstanceExperimentalSettingsWithManaged>(
        queryKeys.instance.experimentalSettings,
      );
      if (previousSettings) {
        queryClient.setQueryData<InstanceExperimentalSettingsWithManaged>(
          queryKeys.instance.experimentalSettings,
          { ...previousSettings, ...patch },
        );
      }
      return { previousSettings };
    },
    onSuccess: async (updatedSettings) => {
      setActionError(null);
      queryClient.setQueryData(queryKeys.instance.experimentalSettings, updatedSettings);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: ["built-in-agents"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error, _patch, context) => {
      if (context?.previousSettings) {
        queryClient.setQueryData(queryKeys.instance.experimentalSettings, context.previousSettings);
      }
      setActionError(
        error instanceof Error
          ? error.message
          : t("instanceExperimentalSettings.errors.updateFailed", {
              defaultValue: "Failed to update experimental settings.",
            }),
      );
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (lookbackHours: number) =>
      instanceSettingsApi.previewIssueGraphLivenessAutoRecovery({ lookbackHours }),
    onSuccess: (preview) => {
      setActionError(null);
      setPendingPreview(preview);
      setPreviewDialogOpen(true);
    },
    onError: (error) => {
      setActionError(
        error instanceof Error
          ? error.message
          : t("instanceExperimentalSettings.errors.previewFailed", {
              defaultValue: "Failed to preview recovery tasks.",
            }),
      );
    },
  });

  const runRecoveryMutation = useMutation({
    mutationFn: async (lookbackHours: number) =>
      instanceSettingsApi.runIssueGraphLivenessAutoRecovery({ lookbackHours }),
    onSuccess: async () => {
      setActionError(null);
      closeRecoveryPreview();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error) => {
      setActionError(
        error instanceof Error
          ? error.message
          : t("instanceExperimentalSettings.errors.runFailed", {
              defaultValue: "Failed to create recovery tasks.",
            }),
      );
    },
  });

  useEffect(() => {
    const next = experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours;
    if (typeof next === "number") {
      setLookbackHoursDraft(String(next));
    }
  }, [experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours]);

  const autoRecoveryManaged =
    experimentalQuery.data?.managedKeys?.enableIssueGraphLivenessAutoRecovery?.managed === true;

  // If refreshed settings mark auto-recovery as managed while the preview
  // dialog is open, close it so its confirmation actions cannot emit a PATCH.
  useEffect(() => {
    if (autoRecoveryManaged) {
      closeRecoveryPreview();
    }
  }, [autoRecoveryManaged]);

  if (experimentalQuery.isLoading) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("instanceExperimentalSettings.loading", { defaultValue: "Loading experimental settings..." })}
      </div>
    );
  }

  if (experimentalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {experimentalQuery.error instanceof Error
          ? experimentalQuery.error.message
          : t("instanceExperimentalSettings.errors.loadFailed", {
              defaultValue: "Failed to load experimental settings.",
            })}
      </div>
    );
  }

  const inWorktree = isWorktreeRuntime();
  // Present only on cloud-managed instances: keys the managed overlay controls
  // render locked with the "Managed by Paperclip Cloud" badge. Self-hosted
  // responses carry no `managedKeys`, so every card stays editable.
  const managedKeys = experimentalQuery.data?.managedKeys ?? {};
  const enableWorktreeRunExecution = experimentalQuery.data?.enableWorktreeRunExecution === true;
  const worktreeRunExecutionManaged = managedKeys.enableWorktreeRunExecution?.managed === true;
  const worktreeRunExecutionState = resolveWorktreeRunExecutionDisplayState(
    experimentalQuery.data,
    getWorktreeInstanceId(),
  );
  const enableEnvironments = experimentalQuery.data?.enableEnvironments === true;
  const enableIsolatedWorkspaces = experimentalQuery.data?.enableIsolatedWorkspaces === true;
  const enableApps = experimentalQuery.data?.enableApps === true;
  // Streamlined left navigation is now the standard sidebar (PAP-12472); the
  // experimental opt-out was retired, so it no longer surfaces a toggle here.
  const enableConferenceRoomChat = experimentalQuery.data?.enableConferenceRoomChat === true;
  const enableIssuePlanDecompositions =
    experimentalQuery.data?.enableIssuePlanDecompositions === true;
  const enableExperimentalFileViewer =
    experimentalQuery.data?.enableExperimentalFileViewer === true;
  const enableTaskWatchdogs = experimentalQuery.data?.enableTaskWatchdogs === true;
  const enableCloudSync = experimentalQuery.data?.enableCloudSync === true;
  const enableExternalObjects = experimentalQuery.data?.enableExternalObjects === true;
  const enableBuiltInAgents = experimentalQuery.data?.enableBuiltInAgents === true;
  const enableSummaries = experimentalQuery.data?.enableSummaries === true;
  const enableDecisions = experimentalQuery.data?.enableDecisions === true;
  const enableGoalsSidebarLink = experimentalQuery.data?.enableGoalsSidebarLink === true;
  const enableCases = experimentalQuery.data?.enableCases === true;
  const enableServerInfoDebugView = experimentalQuery.data?.enableServerInfoDebugView === true;
  const enableSmokeLab = experimentalQuery.data?.enableSmokeLab === true;
  const autoRestartDevServerWhenIdle = experimentalQuery.data?.autoRestartDevServerWhenIdle === true;
  const enableIssueGraphLivenessAutoRecovery =
    experimentalQuery.data?.enableIssueGraphLivenessAutoRecovery === true;
  const lookbackHours =
    experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours ?? 24;
  const parsedLookbackHours = Number.parseInt(lookbackHoursDraft, 10);
  const lookbackHoursIsValid =
    Number.isInteger(parsedLookbackHours) && parsedLookbackHours >= 1 && parsedLookbackHours <= 720;
  const recoveryActionPending =
    toggleMutation.isPending || previewMutation.isPending || runRecoveryMutation.isPending;

  function previewForEnable() {
    if (autoRecoveryManaged) return;
    if (!lookbackHoursIsValid) {
      setActionError(
        t("instanceExperimentalSettings.errors.lookbackRange", {
          defaultValue: "Lookback hours must be a whole number from 1 to 720.",
        }),
      );
      return;
    }
    closeRecoveryPreview();
    previewMutation.mutate(parsedLookbackHours);
  }

  function enableOnly() {
    if (autoRecoveryManaged) return;
    if (!lookbackHoursIsValid) return;
    closeRecoveryPreview();
    toggleMutation.mutate({
      enableIssueGraphLivenessAutoRecovery: true,
      issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
    });
  }

  function enableAndRun() {
    if (autoRecoveryManaged) return;
    if (!lookbackHoursIsValid) return;
    closeRecoveryPreview();
    toggleMutation.mutate({
      enableIssueGraphLivenessAutoRecovery: true,
      issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
    }, {
      onSuccess: () => runRecoveryMutation.mutate(parsedLookbackHours),
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">
            {t("instanceExperimentalSettings.heading.title", { defaultValue: "Experimental" })}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("instanceExperimentalSettings.heading.subtitle", {
            defaultValue:
              "Opt into features that are still being evaluated before they become default behavior.",
          })}
        </p>
      </div>

      <div
        role="alert"
        className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">
              {t("instanceExperimentalSettings.warning.title", {
                defaultValue: "Experimental features may break at any time.",
              })}
            </p>
            <p className="text-muted-foreground">
              {t("instanceExperimentalSettings.warning.body", {
                defaultValue:
                  "These features are opt-in and come with no compatibility guarantees. They may change, break, or be removed without notice. Avoid relying on them for critical or production workflows.",
              })}
            </p>
          </div>
        </div>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {inWorktree ? (
        <Card className="block p-5">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold">
                    {t("instanceExperimentalSettings.worktree.title", {
                      defaultValue: "Run tasks in this worktree",
                    })}
                  </h2>
                  {worktreeRunExecutionManaged ? <ManagedByCloudBadge /> : null}
                </div>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {t("instanceExperimentalSettings.worktree.description", {
                    defaultValue:
                      "This is an isolated git-worktree preview instance. Turn this on to let the scheduler execute runs here. Only tasks created after enabling will run automatically — copied/pre-existing tasks stay parked. Toggling off and on resets the cutoff.",
                  })}
                </p>
              </div>
              <ToggleSwitch
                checked={enableWorktreeRunExecution}
                onCheckedChange={(checked) => {
                  if (worktreeRunExecutionManaged) return;
                  toggleMutation.mutate({ enableWorktreeRunExecution: checked });
                }}
                disabled={toggleMutation.isPending || worktreeRunExecutionManaged}
                aria-label={t("instanceExperimentalSettings.worktree.toggleAriaLabel", {
                  defaultValue: "Toggle worktree run execution setting",
                })}
              />
            </div>

            {worktreeRunExecutionState.kind === "armed" ? (
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-foreground">
                <Play className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>
                  {t("instanceExperimentalSettings.worktree.armedPrefix", {
                    defaultValue: "Running tasks created after",
                  })}{" "}
                  <span className="font-medium">
                    {formatActivationTimestamp(worktreeRunExecutionState.activatedAt)}
                  </span>
                  .
                </span>
              </div>
            ) : null}

            {worktreeRunExecutionState.kind === "fail_closed" ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                <div className="space-y-0.5">
                  <p className="font-medium text-foreground">
                    {t("instanceExperimentalSettings.worktree.suppressedTitle", {
                      defaultValue: "Execution is suppressed — effectively off.",
                    })}
                  </p>
                  <p className="text-muted-foreground">
                    {worktreeRunExecutionState.reason === "instance_mismatch"
                      ? t("instanceExperimentalSettings.worktree.suppressedMismatch", {
                          defaultValue:
                            "This setting was armed in a different instance and copied here, so no tasks run automatically.",
                        })
                      : t("instanceExperimentalSettings.worktree.suppressedMissingCutoff", {
                          defaultValue:
                            "This setting is missing its activation cutoff, so no tasks run automatically.",
                        })}{" "}
                    {t("instanceExperimentalSettings.worktree.suppressedRetry", {
                      defaultValue: "Toggle it off and back on to arm execution for tasks created here.",
                    })}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </Card>
      ) : null}

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.apps.title", { defaultValue: "Apps" })}
        experimental
        description={t("instanceExperimentalSettings.cards.apps.description", {
          defaultValue:
            "Show the Apps navigation and allow access to app connections, gateways, and advanced app tooling.",
        })}
        checked={enableApps}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableApps: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableApps}
        ariaLabel={t("instanceExperimentalSettings.cards.apps.ariaLabel", {
          defaultValue: "Toggle apps experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.cases.title", { defaultValue: "Cases" })}
        experimental
        description={t("instanceExperimentalSettings.cards.cases.description", {
          defaultValue:
            "Durable work products (blog posts, tweet storms…) that tasks create and iterate on. Adds the Cases tab and the agent case API.",
        })}
        footnote={t("instanceExperimentalSettings.cards.cases.footnote", {
          defaultValue: "Turning Cases off hides the tab and blocks the case API; existing case data is kept.",
        })}
        checked={enableCases}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableCases: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableCases}
        ariaLabel={t("instanceExperimentalSettings.cards.cases.ariaLabel", {
          defaultValue: "Toggle cases experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.environments.title", {
          defaultValue: "Enable Environments",
        })}
        description={t("instanceExperimentalSettings.cards.environments.description", {
          defaultValue:
            "Show environment management in company settings and allow project and agent environment assignment controls.",
        })}
        checked={enableEnvironments}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableEnvironments: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableEnvironments}
        ariaLabel={t("instanceExperimentalSettings.cards.environments.ariaLabel", {
          defaultValue: "Toggle environments experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.builtInAgents.title", {
          defaultValue: "Built-in Agents",
        })}
        description={t("instanceExperimentalSettings.cards.builtInAgents.description", {
          defaultValue:
            "Show Paperclip-managed built-in agent surfaces, including built-in roster badges, the Built-in agents tab, and built-in agent setup controls.",
        })}
        checked={enableBuiltInAgents}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableBuiltInAgents: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableBuiltInAgents}
        ariaLabel={t("instanceExperimentalSettings.cards.builtInAgents.ariaLabel", {
          defaultValue: "Toggle built-in agents experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.summaries.title", { defaultValue: "Summaries" })}
        description={t("instanceExperimentalSettings.cards.summaries.description", {
          defaultValue:
            "Show Summarizer-generated status slots on project and workspace pages, with on-demand refresh and revision history. Existing summary data is kept when this is disabled.",
        })}
        checked={enableSummaries}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableSummaries: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableSummaries}
        ariaLabel={t("instanceExperimentalSettings.cards.summaries.ariaLabel", {
          defaultValue: "Toggle summaries experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.fileViewer.title", {
          defaultValue: "Experimental File Viewer",
        })}
        description={t("instanceExperimentalSettings.cards.fileViewer.description", {
          defaultValue:
            "Show task detail controls for browsing and previewing workspace files relative to a task.",
        })}
        checked={enableExperimentalFileViewer}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableExperimentalFileViewer: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableExperimentalFileViewer}
        ariaLabel={t("instanceExperimentalSettings.cards.fileViewer.ariaLabel", {
          defaultValue: "Toggle experimental file viewer setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.externalObjects.title", {
          defaultValue: "Enable External Objects",
        })}
        description={t("instanceExperimentalSettings.cards.externalObjects.description", {
          defaultValue:
            "Detect external URLs in issues and show resolved status for pull requests, tickets, and other referenced work objects.",
        })}
        checked={enableExternalObjects}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableExternalObjects: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableExternalObjects}
        ariaLabel={t("instanceExperimentalSettings.cards.externalObjects.ariaLabel", {
          defaultValue: "Toggle external objects experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.decisions.title", { defaultValue: "Decisions" })}
        description={t("instanceExperimentalSettings.cards.decisions.description", {
          defaultValue:
            "Show the Decisions item in the main sidebar — the attention home that surfaces the tasks awaiting your input — while the surface is still being evaluated.",
        })}
        checked={enableDecisions}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableDecisions: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableDecisions}
        ariaLabel={t("instanceExperimentalSettings.cards.decisions.ariaLabel", {
          defaultValue: "Toggle decisions experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.goalsSidebarLink.title", {
          defaultValue: "Goals Sidebar Link",
        })}
        description={t("instanceExperimentalSettings.cards.goalsSidebarLink.description", {
          defaultValue: "Restore the Goals item in the main sidebar while the goals surface is being evaluated.",
        })}
        checked={enableGoalsSidebarLink}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableGoalsSidebarLink: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableGoalsSidebarLink}
        ariaLabel={t("instanceExperimentalSettings.cards.goalsSidebarLink.ariaLabel", {
          defaultValue: "Toggle goals sidebar link experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.isolatedWorkspaces.title", {
          defaultValue: "Enable Isolated Workspaces",
        })}
        description={t("instanceExperimentalSettings.cards.isolatedWorkspaces.description", {
          defaultValue:
            "Show execution workspace controls in project configuration and allow isolated workspace behavior for new and existing task runs.",
        })}
        checked={enableIsolatedWorkspaces}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableIsolatedWorkspaces: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableIsolatedWorkspaces}
        ariaLabel={t("instanceExperimentalSettings.cards.isolatedWorkspaces.ariaLabel", {
          defaultValue: "Toggle isolated workspaces experimental setting",
        })}
      />

      {SHOW_CONFERENCE_ROOM_EXPERIMENTAL_SETTING ? (
        <ExperimentalToggleCard
          title={t("instanceExperimentalSettings.cards.conferenceRoomChat.title", {
            defaultValue: "Conference Room Chat",
          })}
          description={t("instanceExperimentalSettings.cards.conferenceRoomChat.description", {
            defaultValue:
              "Adds a Conference Room — one chat where you and your whole team work together — plus the live activity feed and the redesigned onboarding. Also restyles task threads as chat bubbles. Turn off anytime to restore the classic UI.",
          })}
          checked={enableConferenceRoomChat}
          onCheckedChange={(checked) => toggleMutation.mutate({ enableConferenceRoomChat: checked })}
          disabled={toggleMutation.isPending}
          managed={managedKeys.enableConferenceRoomChat}
          ariaLabel={t("instanceExperimentalSettings.cards.conferenceRoomChat.ariaLabel", {
            defaultValue: "Toggle conference room chat experimental setting",
          })}
        />
      ) : null}

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.planDecomposition.title", {
          defaultValue: "Task Plan Decomposition Panel",
        })}
        description={t("instanceExperimentalSettings.cards.planDecomposition.description", {
          defaultValue:
            "Show accepted-plan decomposition history on task detail pages. Intended for debugging and validating subtask creation behavior while the presentation is still being refined.",
        })}
        checked={enableIssuePlanDecompositions}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableIssuePlanDecompositions: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableIssuePlanDecompositions}
        ariaLabel={t("instanceExperimentalSettings.cards.planDecomposition.ariaLabel", {
          defaultValue: "Toggle task plan decomposition panel experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.taskWatchdogs.title", {
          defaultValue: "Task Watchdogs",
        })}
        description={t("instanceExperimentalSettings.cards.taskWatchdogs.description", {
          defaultValue:
            "Show task detail controls for configuring watchdog agents that verify stopped task subtrees and restore live paths when work should continue.",
        })}
        checked={enableTaskWatchdogs}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableTaskWatchdogs: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableTaskWatchdogs}
        ariaLabel={t("instanceExperimentalSettings.cards.taskWatchdogs.ariaLabel", {
          defaultValue: "Toggle task watchdogs experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.cloudSync.title", { defaultValue: "Cloud Sync" })}
        description={t("instanceExperimentalSettings.cards.cloudSync.description", {
          defaultValue:
            "Show local Paperclip Cloud upstream connection, preview, push, retry, and activation review surfaces. Saved connections and run history are preserved when this is disabled.",
        })}
        checked={enableCloudSync}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableCloudSync: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableCloudSync}
        ariaLabel={t("instanceExperimentalSettings.cards.cloudSync.ariaLabel", {
          defaultValue: "Toggle cloud sync experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.serverInfoDebug.title", {
          defaultValue: "Server Info Debug View",
        })}
        description={t("instanceExperimentalSettings.cards.serverInfoDebug.description", {
          defaultValue:
            'Show a "Server" section in the account drawer with the current server restart time and running commit.',
        })}
        checked={enableServerInfoDebugView}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableServerInfoDebugView: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableServerInfoDebugView}
        ariaLabel={t("instanceExperimentalSettings.cards.serverInfoDebug.ariaLabel", {
          defaultValue: "Toggle server info debug view experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.smokeLab.title", { defaultValue: "Smoke Lab" })}
        description={t("instanceExperimentalSettings.cards.smokeLab.description", {
          defaultValue:
            'Add a "Smoke Lab" tab under Apps → Developer and an "Integration smoke" card on the dashboard for exercising every integration path against deterministic local fixtures (fake OAuth provider + loopback MCP servers). Private (non-public) deployments only.',
        })}
        checked={enableSmokeLab}
        onCheckedChange={(checked) => toggleMutation.mutate({ enableSmokeLab: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.enableSmokeLab}
        ariaLabel={t("instanceExperimentalSettings.cards.smokeLab.ariaLabel", {
          defaultValue: "Toggle smoke lab experimental setting",
        })}
      />

      <ExperimentalToggleCard
        title={t("instanceExperimentalSettings.cards.autoRestartDev.title", {
          defaultValue: "Auto-Restart Dev Server When Idle",
        })}
        description={t("instanceExperimentalSettings.cards.autoRestartDev.description", {
          defaultValue:
            "In `pnpm dev:once`, wait for all queued and running local agent runs to finish, then restart the server automatically when backend changes or migrations make the current boot stale.",
        })}
        checked={autoRestartDevServerWhenIdle}
        onCheckedChange={(checked) => toggleMutation.mutate({ autoRestartDevServerWhenIdle: checked })}
        disabled={toggleMutation.isPending}
        managed={managedKeys.autoRestartDevServerWhenIdle}
        ariaLabel={t("instanceExperimentalSettings.cards.autoRestartDev.ariaLabel", {
          defaultValue: "Toggle guarded dev-server auto-restart",
        })}
      />

      <Card className="block p-5">
        <div className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">
                  {t("instanceExperimentalSettings.autoRecovery.title", {
                    defaultValue: "Auto-Create Recovery Tasks",
                  })}
                </h2>
                {autoRecoveryManaged ? <ManagedByCloudBadge /> : null}
              </div>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {t("instanceExperimentalSettings.autoRecovery.description", {
                  defaultValue:
                    "Let the heartbeat scheduler create recovery tasks for task dependency chains found inside the configured lookback window.",
                })}
              </p>
            </div>
            <ToggleSwitch
              checked={enableIssueGraphLivenessAutoRecovery}
              onCheckedChange={() => {
                if (autoRecoveryManaged) return;
                if (enableIssueGraphLivenessAutoRecovery) {
                  toggleMutation.mutate({ enableIssueGraphLivenessAutoRecovery: false });
                  return;
                }
                previewForEnable();
              }}
              disabled={recoveryActionPending || autoRecoveryManaged}
              aria-label={t("instanceExperimentalSettings.autoRecovery.toggleAriaLabel", {
                defaultValue: "Toggle task graph liveness auto-recovery",
              })}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-(--gtc-35) sm:items-end">
            <label className="space-y-1.5">
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {t("instanceExperimentalSettings.autoRecovery.lookbackHoursLabel", {
                  defaultValue: "Lookback hours",
                })}
              </span>
              <Input
                type="number"
                min={1}
                max={720}
                step={1}
                value={lookbackHoursDraft}
                onChange={(event) => setLookbackHoursDraft(event.target.value)}
                aria-invalid={!lookbackHoursIsValid}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!lookbackHoursIsValid) {
                    setActionError(
        t("instanceExperimentalSettings.errors.lookbackRange", {
          defaultValue: "Lookback hours must be a whole number from 1 to 720.",
        }),
      );
                    return;
                  }
                  toggleMutation.mutate({
                    issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
                  });
                }}
                disabled={recoveryActionPending || parsedLookbackHours === lookbackHours}
              >
                {t("instanceExperimentalSettings.autoRecovery.saveHours", { defaultValue: "Save hours" })}
              </Button>
              <Button
                variant="outline"
                onClick={previewForEnable}
                disabled={recoveryActionPending}
              >
                <Search className="h-4 w-4" />
                {t("instanceExperimentalSettings.autoRecovery.preview", { defaultValue: "Preview" })}
              </Button>
              <Button
                onClick={() => {
                  if (!lookbackHoursIsValid) {
                    setActionError(
        t("instanceExperimentalSettings.errors.lookbackRange", {
          defaultValue: "Lookback hours must be a whole number from 1 to 720.",
        }),
      );
                    return;
                  }
                  runRecoveryMutation.mutate(parsedLookbackHours);
                }}
                disabled={recoveryActionPending || !enableIssueGraphLivenessAutoRecovery}
              >
                <Play className="h-4 w-4" />
                {t("instanceExperimentalSettings.autoRecovery.runNow", { defaultValue: "Run now" })}
              </Button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {lookbackHours === 1
              ? t("instanceExperimentalSettings.autoRecovery.currentWindowOne", {
                  defaultValue: "Current window: last {{lookbackHours}} hour.",
                  lookbackHours,
                })
              : t("instanceExperimentalSettings.autoRecovery.currentWindowOther", {
                  defaultValue: "Current window: last {{lookbackHours}} hours.",
                  lookbackHours,
                })}
          </p>
        </div>
      </Card>

      {previewDialogOpen && !autoRecoveryManaged ? (
        <RecoveryPreviewDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              closeRecoveryPreview();
            }
          }}
          preview={pendingPreview}
          onEnableOnly={enableOnly}
          onEnableAndRun={enableAndRun}
          isPending={recoveryActionPending}
        />
      ) : null}
    </div>
  );
}
