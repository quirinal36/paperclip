import type { ReactNode } from "react";

import { Link } from "@/lib/router";
import { t, useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ResourceStatusChip, type ResourceStatusVariant } from "@/components/ResourceStatusChip";
import { cn } from "@/lib/utils";
import type {
  BuiltInAgentState,
  BuiltInManagedResourceKind,
  BuiltInManagedResourceState,
} from "@/api/builtInAgents";

/**
 * Bundle status panel for a bundle-backed built-in agent (Reflection Coach —
 * [PAP-13099], ux-spec §3–§8). Renders one row per managed resource
 * (adapter · skill · instructions · routine, dependency order) with a readiness
 * chip, drift chip, inline copy, and the wireable per-resource actions.
 *
 * Presentational: the parent owns queries/mutations and passes handlers. The
 * confirm-before-mutate dialogs and copy live here (ux-spec §8). Adapter
 * readiness is derived from the agent lifecycle `status` (there is no adapter
 * resource in `resources[]`); skill/instructions/routine come from
 * `state.resources`.
 *
 * Both "apply an available stock update" and "reset drifted edits" route
 * through the same scoped reset (`onResetResource(kind)` →
 * `built-in-agents/:key/reset { resources: [kind] }`), which re-materializes
 * that one resource to Paperclip's newest shipped default without touching
 * adapter credentials or the other resources.
 */

function findResource(
  resources: BuiltInManagedResourceState[] | undefined,
  kind: BuiltInManagedResourceKind,
): BuiltInManagedResourceState | undefined {
  return resources?.find((resource) => resource.resourceKind === kind);
}

/** Readiness chip for a materialized resource. */
function readinessVariant(resource: BuiltInManagedResourceState): ResourceStatusVariant {
  if (resource.stockStatus === "missing") return "missing";
  return "ready";
}

/** Drift chip shown alongside a `ready` readiness chip, or `null`. */
function driftVariant(resource: BuiltInManagedResourceState): ResourceStatusVariant | null {
  if (resource.stockStatus === "missing") return null; // readiness wins; drift suppressed
  if (resource.stockStatus === "stock_update_available") return "update_available";
  if (resource.stockStatus === "operator_modified") return "drifted";
  return null;
}

interface ResourceActionCopy {
  title: string;
  body: string;
  confirmLabel: string;
  triggerLabel: string;
}

/** Confirm-dialog copy per drift state (ux-spec §8 copy deck). */
function resourceActionCopy(
  resource: BuiltInManagedResourceState,
  label: string,
): ResourceActionCopy | null {
  if (resource.stockStatus === "stock_update_available") {
    return {
      title: t("builtInBundlePanel.resourceAction.update.title", {
        defaultValue: "Update {{label}} to the newest default?",
        label,
      }),
      body: t("builtInBundlePanel.resourceAction.update.body", {
        defaultValue:
          "You haven't edited this, so Paperclip will replace it with the newer shipped version. Nothing you customized is affected, and your adapter credentials and settings are not touched.",
      }),
      confirmLabel: t("builtInBundlePanel.resourceAction.update.confirmLabel", { defaultValue: "Update" }),
      triggerLabel: t("builtInBundlePanel.resourceAction.update.triggerLabel", { defaultValue: "Update" }),
    };
  }
  if (resource.stockStatus === "operator_modified") {
    return {
      title: t("builtInBundlePanel.resourceAction.reset.title", {
        defaultValue: "Reset {{label}} to the shipped default?",
        label,
      }),
      body: t("builtInBundlePanel.resourceAction.reset.body", {
        defaultValue:
          "This replaces your edited version with Paperclip's current default. Your edits can't be recovered. Adapter credentials and settings are not touched.",
      }),
      confirmLabel: t("builtInBundlePanel.resourceAction.reset.confirmLabel", {
        defaultValue: "Reset {{label}}",
        label,
      }),
      triggerLabel: t("builtInBundlePanel.resourceAction.reset.triggerLabel", { defaultValue: "Reset" }),
    };
  }
  if (resource.stockStatus === "missing") {
    return {
      title: t("builtInBundlePanel.resourceAction.recreate.title", {
        defaultValue: "Recreate {{label}}?",
        label,
      }),
      body: t("builtInBundlePanel.resourceAction.recreate.body", {
        defaultValue:
          "This resource is missing. Paperclip will recreate it from the shipped default. Adapter credentials and settings are not touched.",
      }),
      confirmLabel: t("builtInBundlePanel.resourceAction.recreate.confirmLabel", { defaultValue: "Recreate" }),
      triggerLabel: t("builtInBundlePanel.resourceAction.recreate.triggerLabel", { defaultValue: "Recreate" }),
    };
  }
  return null;
}

function ResourceActionButton({
  resource,
  label,
  onConfirm,
  pending,
}: {
  resource: BuiltInManagedResourceState;
  label: string;
  onConfirm: () => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const copy = resourceActionCopy(resource, label);
  if (!copy) return null;
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          {pending ? t("builtInBundlePanel.common.working", { defaultValue: "Working…" }) : copy.triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{copy.title}</AlertDialogTitle>
          <AlertDialogDescription>{copy.body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("builtInBundlePanel.common.cancel", { defaultValue: "Cancel" })}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{copy.confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ConfirmActionButton({
  title,
  body,
  triggerLabel,
  confirmLabel,
  pending,
  onConfirm,
}: {
  title: string;
  body: string;
  triggerLabel: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={pending}>
          {pending ? t("builtInBundlePanel.common.working", { defaultValue: "Working…" }) : triggerLabel}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{body}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("builtInBundlePanel.common.cancel", { defaultValue: "Cancel" })}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{confirmLabel}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

interface BundleRowProps {
  label: string;
  secondary?: string;
  chips: ReactNode;
  detail?: ReactNode;
  detailTone?: "muted" | "error";
  actions?: ReactNode;
}

function BundleRow({ label, secondary, chips, detail, detailTone = "muted", actions }: BundleRowProps) {
  return (
    <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{label}</span>
          {secondary && (
            <span className="text-(length:--text-micro) text-muted-foreground">{secondary}</span>
          )}
          {chips}
        </div>
        {detail && (
          <p
            className={cn(
              "text-(length:--text-micro) leading-snug",
              detailTone === "error" ? "text-red-600 dark:text-red-400" : "text-muted-foreground",
            )}
          >
            {detail}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

function driftDetail(resource: BuiltInManagedResourceState): string | undefined {
  switch (resource.stockStatus) {
    case "operator_modified":
      return t("builtInBundlePanel.driftDetail.operatorModified", {
        defaultValue: "You've edited this. Your changes are kept until you reset.",
      });
    case "stock_update_available":
      return t("builtInBundlePanel.driftDetail.stockUpdateAvailable", {
        defaultValue: "Paperclip shipped a newer default.",
      });
    case "missing":
      return t("builtInBundlePanel.driftDetail.missing", {
        defaultValue: "Not materialized yet — recreate it from the shipped default.",
      });
    default:
      return undefined;
  }
}

export interface BuiltInBundlePanelProps {
  state: BuiltInAgentState;
  /** Route ref used to link View › actions to the agent's tabs. */
  agentRef: string;
  /** Opens the adapter configure modal. */
  onConfigure: () => void;
  /** Scoped reset for one resource (apply update / reset drift / recreate). */
  onResetResource: (kind: BuiltInManagedResourceKind) => void;
  /** Trigger the managed routine once without enabling its weekly schedule. */
  onRunRoutine?: (routineKey: string) => void;
  /** Enable the managed routine's weekly schedule. */
  onEnableSchedule?: (routineKey: string) => void;
  /** Disable the managed routine's weekly schedule. */
  onDisableSchedule?: (routineKey: string) => void;
  /** The resource kind whose reset is currently in flight, if any. */
  resettingResource?: BuiltInManagedResourceKind | null;
  routineActionPending?: "run" | "enable" | "disable" | null;
  className?: string;
}

export function BuiltInBundlePanel({
  state,
  agentRef,
  onConfigure,
  onResetResource,
  onRunRoutine,
  onEnableSchedule,
  onDisableSchedule,
  resettingResource = null,
  routineActionPending = null,
  className,
}: BuiltInBundlePanelProps) {
  const { t } = useTranslation();
  const { status, definition, resources } = state;
  const bundle = definition.bundle;
  if (!bundle) return null;

  const adapterReady = status === "ready" || status === "paused";

  // --- Adapter row (derived from the agent lifecycle status) -----------------
  let adapterChip: ResourceStatusVariant = "ready";
  let adapterDetail: string | undefined;
  if (status === "pending_approval") {
    adapterChip = "pending_approval";
    adapterDetail = t("builtInBundlePanel.adapter.pendingApprovalDetail", {
      defaultValue: "Waiting on board hire approval before this coach can run.",
    });
  } else if (!adapterReady) {
    adapterChip = "needs_setup";
    adapterDetail = t("builtInBundlePanel.adapter.needsSetupDetail", {
      defaultValue: "Pick an adapter this coach can run on.",
    });
  }

  const skill = findResource(resources, "skill");
  const instructions = findResource(resources, "instructions");
  const routine = findResource(resources, "routine");
  const scheduleEnabled = routine?.scheduleEnabled === true;
  const routineKey = bundle.routine.routineKey;
  const scheduleLabel =
    bundle.routine.scheduleLabel ??
    t("builtInBundlePanel.routine.weeklyScheduleLabel", { defaultValue: "Weekly schedule" });
  const proposalIssueRef = routine?.pendingUpdateIssueIdentifier ?? routine?.pendingUpdateIssueId ?? null;
  const proposalHref = proposalIssueRef && routine?.pendingUpdateInteractionId
    ? `/issues/${proposalIssueRef}#interaction-${routine.pendingUpdateInteractionId}`
    : null;

  const renderResourceRow = (
    kind: BuiltInManagedResourceKind,
    label: string,
    secondary: string,
    viewHref: string,
    resource: BuiltInManagedResourceState,
  ) => {
    const drift = driftVariant(resource);
    return (
      <BundleRow
        key={kind}
        label={label}
        secondary={secondary}
        chips={
          <>
            <ResourceStatusChip variant={readinessVariant(resource)} />
            {drift && <ResourceStatusChip variant={drift} />}
          </>
        }
        detail={driftDetail(resource)}
        actions={
          <>
            <Button asChild variant="link" size="sm">
              <Link to={viewHref}>{t("builtInBundlePanel.common.view", { defaultValue: "View" })}</Link>
            </Button>
            <ResourceActionButton
              resource={resource}
              label={label}
              onConfirm={() => onResetResource(kind)}
              pending={resettingResource === kind}
            />
          </>
        }
      />
    );
  };

  return (
    <section
      className={cn("space-y-2", className)}
      aria-label={t("builtInBundlePanel.bundleStatus.ariaLabel", { defaultValue: "Bundle status" })}
    >
      <h3 className="text-sm font-medium">
        {t("builtInBundlePanel.bundleStatus.title", { defaultValue: "Bundle status" })}
      </h3>

      <div className="divide-y rounded-lg border px-4">
        {/* Adapter — no resource entry; readiness is the agent lifecycle. */}
        <BundleRow
          label={t("builtInBundlePanel.resources.adapter", { defaultValue: "Adapter" })}
          chips={<ResourceStatusChip variant={adapterChip} />}
          detail={adapterDetail}
          actions={
            <Button variant="outline" size="sm" onClick={onConfigure}>
              {t("builtInBundlePanel.adapter.configure", { defaultValue: "Configure" })}
            </Button>
          }
        />

        {skill &&
          renderResourceRow(
            "skill",
            t("builtInBundlePanel.resources.skill", { defaultValue: "Skill" }),
            bundle.skill.displayName || skill.resourceKey,
            `/agents/${agentRef}/skills`,
            skill,
          )}

        {instructions &&
          renderResourceRow(
            "instructions",
            t("builtInBundlePanel.resources.instructions", { defaultValue: "Instructions" }),
            bundle.instructions.entryFile,
            `/agents/${agentRef}/instructions`,
            instructions,
          )}

        {/* Routine — zero-token-by-default; the weekly schedule ships off. */}
        <BundleRow
          label={t("builtInBundlePanel.resources.routine", { defaultValue: "Routine" })}
          secondary={bundle.routine.title}
          chips={
            <>
              <ResourceStatusChip
                variant={scheduleEnabled ? "schedule_on" : "schedule_off"}
                label={scheduleEnabled ? scheduleLabel : undefined}
              />
              {routine && driftVariant(routine) && (
                <ResourceStatusChip variant={driftVariant(routine)!} />
              )}
            </>
          }
          detail={
            scheduleEnabled
              ? t("builtInBundlePanel.routine.scheduleEnabledDetail", {
                  defaultValue: "The weekly schedule is enabled and can create background work.",
                })
              : t("builtInBundlePanel.routine.scheduleDisabledDetail", {
                  defaultValue:
                    "Nothing runs until you enable the weekly schedule — it costs zero tokens by default.",
                })
          }
          actions={
            routine ? (
              <>
                {onRunRoutine && (
                  <ConfirmActionButton
                    title={t("builtInBundlePanel.routine.runOnce.title", {
                      defaultValue: "Run Reflection Coach once?",
                    })}
                    body={t("builtInBundlePanel.routine.runOnce.body", {
                      defaultValue:
                        "Paperclip will create one routine task now. This does not enable the weekly schedule or turn on background work.",
                    })}
                    triggerLabel={t("builtInBundlePanel.routine.runOnce.triggerLabel", {
                      defaultValue: "Run once",
                    })}
                    confirmLabel={t("builtInBundlePanel.routine.runOnce.confirmLabel", {
                      defaultValue: "Run once",
                    })}
                    pending={routineActionPending === "run"}
                    onConfirm={() => onRunRoutine(routineKey)}
                  />
                )}
                {scheduleEnabled
                  ? onDisableSchedule && (
                    <ConfirmActionButton
                      title={t("builtInBundlePanel.routine.disable.title", {
                        defaultValue: "Disable the weekly schedule?",
                      })}
                      body={t("builtInBundlePanel.routine.disable.body", {
                        defaultValue:
                          "Paperclip will stop future scheduled Reflection Coach runs. Manual Run once remains available.",
                      })}
                      triggerLabel={t("builtInBundlePanel.routine.disable.triggerLabel", {
                        defaultValue: "Disable schedule",
                      })}
                      confirmLabel={t("builtInBundlePanel.routine.disable.confirmLabel", {
                        defaultValue: "Disable schedule",
                      })}
                      pending={routineActionPending === "disable"}
                      onConfirm={() => onDisableSchedule(routineKey)}
                    />
                  )
                  : onEnableSchedule && (
                    <ConfirmActionButton
                      title={t("builtInBundlePanel.routine.enable.title", {
                        defaultValue: "Enable the weekly schedule?",
                      })}
                      body={t("builtInBundlePanel.routine.enable.body", {
                        defaultValue:
                          "Paperclip will allow Reflection Coach to create routine tasks on the weekly schedule. It can spend tokens when those tasks run.",
                      })}
                      triggerLabel={t("builtInBundlePanel.routine.enable.triggerLabel", {
                        defaultValue: "Enable weekly",
                      })}
                      confirmLabel={t("builtInBundlePanel.routine.enable.confirmLabel", {
                        defaultValue: "Enable weekly",
                      })}
                      pending={routineActionPending === "enable"}
                      onConfirm={() => onEnableSchedule(routineKey)}
                    />
                  )}
                {driftVariant(routine) && (
                  <ResourceActionButton
                    resource={routine}
                    label={t("builtInBundlePanel.resources.routineLower", { defaultValue: "routine" })}
                    onConfirm={() => onResetResource("routine")}
                    pending={resettingResource === "routine"}
                  />
                )}
              </>
            ) : undefined
          }
        />
        {proposalHref && (
          <BundleRow
            label={t("builtInBundlePanel.resources.proposal", { defaultValue: "Proposal" })}
            chips={<ResourceStatusChip variant="proposal_pending" />}
            detail={t("builtInBundlePanel.proposal.detail", {
              defaultValue: "A proposed Reflection Coach update is waiting for review.",
            })}
            actions={
              <Button asChild variant="link" size="sm">
                <Link to={proposalHref}>
                  {t("builtInBundlePanel.proposal.review", { defaultValue: "Review proposal" })}
                </Link>
              </Button>
            }
          />
        )}
      </div>
    </section>
  );
}
