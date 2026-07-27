import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "@/i18n";
import type { AgentPermissions, TrustPreset } from "@paperclipai/shared";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, CollapsibleSection } from "./agent-config-primitives";
import {
  buildPermissionsForTrustPreset,
  clearSingleLowTrustBoundaryTarget,
  getLowTrustBoundary,
  getSingleLowTrustBoundaryTarget,
  getTrustPreset,
  isCeLowTrustBoundaryEditable,
  lowTrustBoundaryHasScope,
  setSingleLowTrustBoundaryTarget,
  summarizeLowTrustBoundaryTarget,
  TRUST_PRESET_DESCRIPTIONS,
  TRUST_PRESET_LABELS,
  type LowTrustBoundaryTarget,
} from "../lib/trust-policy-ui";
import { cn } from "../lib/utils";

const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

function formatCount(value: readonly unknown[] | undefined, singular: string, plural: string) {
  const count = value?.length ?? 0;
  if (count === 0) return "-";
  return `${count} ${count === 1 ? singular : plural}`;
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="shrink-0 text-xs text-muted-foreground">{label}</span>
      <span className={cn("min-w-0 text-right", value === "-" && "text-muted-foreground")}>{value}</span>
    </div>
  );
}

export interface LowTrustBoundaryCandidate {
  id: string;
  label: string;
}

type LowTrustBoundaryTargetType = LowTrustBoundaryTarget["type"];

export function TrustPresetSection({
  permissions,
  onChange,
  disabled,
  companyId,
  projectCandidates = [],
  issueCandidates = [],
  candidatesLoading,
}: {
  permissions: Partial<AgentPermissions> | null | undefined;
  onChange: (permissions: Partial<AgentPermissions>) => void;
  disabled?: boolean;
  companyId?: string | null;
  projectCandidates?: LowTrustBoundaryCandidate[];
  issueCandidates?: LowTrustBoundaryCandidate[];
  candidatesLoading?: boolean;
}) {
  const { t } = useTranslation();
  const boundaryTargetLabels: Record<LowTrustBoundaryTargetType, string> = {
    project: t("trustPresetSection.boundaryTarget.project", { defaultValue: "Project" }),
    root_issue: t("trustPresetSection.boundaryTarget.rootIssue", { defaultValue: "Root issue" }),
    issue: t("trustPresetSection.boundaryTarget.issue", { defaultValue: "Issue" }),
  };
  const [policyOpen, setPolicyOpen] = useState(false);
  const preset = getTrustPreset(permissions);
  const boundary = getLowTrustBoundary(permissions);
  const boundaryTarget = getSingleLowTrustBoundaryTarget(boundary);
  const [targetType, setTargetType] = useState<LowTrustBoundaryTargetType>(boundaryTarget?.type ?? "project");
  const lowTrust = preset === "low_trust_review";
  const hasScope = lowTrustBoundaryHasScope(boundary);
  const boundaryEditable = isCeLowTrustBoundaryEditable(boundary);
  const policy = permissions?.authorizationPolicy ?? null;
  const managedPermissions = useMemo(
    () => buildPermissionsForTrustPreset(permissions, preset),
    [permissions, preset],
  );

  useEffect(() => {
    if (boundaryTarget) setTargetType(boundaryTarget.type);
  }, [boundaryTarget?.type]);

  function handlePresetChange(value: string) {
    const nextPreset: TrustPreset = value === "low_trust_review" ? "low_trust_review" : "standard";
    onChange(buildPermissionsForTrustPreset(permissions, nextPreset));
  }

  function handleBoundaryTargetChange(targetId: string) {
    if (!companyId || !targetId) return;
    onChange(setSingleLowTrustBoundaryTarget(permissions, companyId, { type: targetType, id: targetId }));
  }

  function handleClearBoundary() {
    onChange(clearSingleLowTrustBoundaryTarget(permissions));
  }

  const targetCandidates = targetType === "project" ? projectCandidates : issueCandidates;
  const boundaryValue = boundaryTarget?.type === targetType ? boundaryTarget.id : "";

  return (
    <div>
      <h3 className="mb-3 text-sm font-medium">{t("trustPresetSection.title", { defaultValue: "Trust" })}</h3>
      <div className="rounded-lg border border-border p-4 space-y-3">
        <Field
          label={t("trustPresetSection.trustPreset.label", { defaultValue: "Trust preset" })}
          hint={t("trustPresetSection.trustPreset.hint", { defaultValue: "Choose how broadly this agent can read and act on Paperclip work objects." })}
        >
          <select
            className={inputClass}
            value={preset}
            onChange={(event) => handlePresetChange(event.target.value)}
            disabled={disabled}
          >
            <option value="standard">{TRUST_PRESET_LABELS.standard}</option>
            <option value="low_trust_review">{TRUST_PRESET_LABELS.low_trust_review}</option>
          </select>
        </Field>
        <p className="text-xs text-muted-foreground">{TRUST_PRESET_DESCRIPTIONS[preset]}</p>

        {lowTrust ? (
          <div
            role={hasScope ? "status" : "alert"}
            aria-live="polite"
            className={cn(
              "rounded-md border px-3 py-2.5 text-sm flex gap-2",
              hasScope
                ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-100"
                : "border-destructive/30 bg-destructive/10 text-destructive",
            )}
          >
            {hasScope ? (
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Lock className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <div>
                <p className="font-medium">
                  {hasScope
                    ? t("trustPresetSection.containment.active", { defaultValue: "Containment active" })
                    : t("trustPresetSection.containment.notConfigured", { defaultValue: "Containment not configured" })}
                </p>
                <p className="mt-1 text-xs leading-5">
                  {hasScope
                    ? t("trustPresetSection.containment.activeDescription", { defaultValue: "This agent can only read and mutate work inside its assigned review boundary. Raw output is quarantined from higher-trust agents until a trusted reviewer promotes it." })
                    : t("trustPresetSection.containment.notConfiguredDescription", { defaultValue: "This agent is set to low-trust review, but no project, root issue, or issue scope is set in the core policy. Add a scope before this agent can run without denial." })}
                </p>
              </div>
              {boundaryEditable ? (
                <div className="rounded-md border border-border/70 bg-background/70 p-3 text-foreground space-y-3">
                  <div className="grid gap-3 sm:grid-cols-(--gtc-12)">
                    <Field label={t("trustPresetSection.boundaryType.label", { defaultValue: "Boundary type" })}>
                      <select
                        className={inputClass}
                        value={targetType}
                        onChange={(event) => setTargetType(event.target.value as LowTrustBoundaryTargetType)}
                        disabled={disabled}
                      >
                        <option value="project">{t("trustPresetSection.boundaryTarget.project", { defaultValue: "Project" })}</option>
                        <option value="root_issue">{t("trustPresetSection.boundaryTarget.rootIssue", { defaultValue: "Root issue" })}</option>
                        <option value="issue">{t("trustPresetSection.boundaryTarget.issue", { defaultValue: "Issue" })}</option>
                      </select>
                    </Field>
                    <Field label={boundaryTargetLabels[targetType]}>
                      <select
                        className={inputClass}
                        value={boundaryValue}
                        onChange={(event) => handleBoundaryTargetChange(event.target.value)}
                        disabled={disabled || !companyId || candidatesLoading || targetCandidates.length === 0}
                      >
                        <option value="">
                          {candidatesLoading
                            ? t("trustPresetSection.boundarySelect.loading", { defaultValue: "Loading…" })
                            : targetCandidates.length === 0
                              ? targetType === "project"
                                ? t("trustPresetSection.boundarySelect.noProjectsAvailable", { defaultValue: "No projects available" })
                                : t("trustPresetSection.boundarySelect.noIssuesAvailable", { defaultValue: "No issues available" })
                              : t("trustPresetSection.boundarySelect.placeholder", { defaultValue: "Select boundary" })}
                        </option>
                        {targetCandidates.map((candidate) => (
                          <option key={candidate.id} value={candidate.id}>
                            {candidate.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      {t("trustPresetSection.ceBoundaryNote", { defaultValue: "CE saves one containment boundary at a time. Saved policies include this company id." })}
                    </p>
                    {boundaryTarget ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={handleClearBoundary}
                        disabled={disabled}
                      >
                        {t("trustPresetSection.actions.clearBoundary", { defaultValue: "Clear boundary" })}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="rounded-md border border-border/70 bg-background/70 p-3 text-foreground">
                  <p className="text-sm font-medium">{t("trustPresetSection.managedByEeApi.title", { defaultValue: "Managed by EE/API" })}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t("trustPresetSection.managedByEeApi.description", { defaultValue: "This policy has {{summary}} and cannot be edited by the CE single-boundary editor.", summary: summarizeLowTrustBoundaryTarget(boundary).toLowerCase() })}
                  </p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                {t("trustPresetSection.eeUpsell.question", { defaultValue: "Want to set more than one containment boundary?" })}{" "}
                <a
                  className="underline underline-offset-2 hover:text-foreground"
                  href="https://paperclip.ing/ee"
                  target="_blank"
                  rel="noreferrer"
                >
                  {t("trustPresetSection.eeUpsell.link", { defaultValue: "Get Paperclip EE." })}
                </a>
              </p>
              <CollapsibleSection
                title={t("trustPresetSection.viewPolicy.title", { defaultValue: "View policy" })}
                open={policyOpen}
                onToggle={() => setPolicyOpen((open) => !open)}
              >
                <div className="divide-y divide-border/60 text-foreground">
                  <PolicyRow label={t("trustPresetSection.policy.preset", { defaultValue: "Preset" })} value={t("trustPresetSection.policy.presetValue", { defaultValue: "Low-trust review v1" })} />
                  <PolicyRow label={t("trustPresetSection.policy.rawOutput", { defaultValue: "Raw output" })} value={t("trustPresetSection.policy.rawOutputValue", { defaultValue: "Quarantined from higher-trust agents" })} />
                  <PolicyRow label={t("trustPresetSection.policy.projects", { defaultValue: "Projects" })} value={formatCount(boundary?.projectIds, t("trustPresetSection.units.project", { defaultValue: "project" }), t("trustPresetSection.units.projects", { defaultValue: "projects" }))} />
                  <PolicyRow label={t("trustPresetSection.policy.rootIssue", { defaultValue: "Root issue" })} value={boundary?.rootIssueId ? boundary.rootIssueId.slice(0, 8) : "-"} />
                  <PolicyRow label={t("trustPresetSection.policy.explicitIssues", { defaultValue: "Explicit issues" })} value={formatCount(boundary?.issueIds, t("trustPresetSection.units.issue", { defaultValue: "issue" }), t("trustPresetSection.units.issues", { defaultValue: "issues" }))} />
                  <PolicyRow label={t("trustPresetSection.policy.allowedAgents", { defaultValue: "Allowed agents" })} value={formatCount(boundary?.allowedAgentIds, t("trustPresetSection.units.agent", { defaultValue: "agent" }), t("trustPresetSection.units.agents", { defaultValue: "agents" }))} />
                  <PolicyRow label={t("trustPresetSection.policy.allowedTools", { defaultValue: "Allowed tools" })} value={boundary?.allowedToolClasses?.join(" · ") || "-"} />
                  <PolicyRow label={t("trustPresetSection.policy.allowedSecrets", { defaultValue: "Allowed secrets" })} value={formatCount(boundary?.allowedSecretBindingIds, t("trustPresetSection.units.binding", { defaultValue: "binding" }), t("trustPresetSection.units.bindings", { defaultValue: "bindings" }))} />
                  <PolicyRow label={t("trustPresetSection.policy.promotionTarget", { defaultValue: "Promotion target" })} value={boundary?.outputPromotionTarget?.issueId?.slice(0, 8) ?? "-"} />
                  <PolicyRow
                    label={t("trustPresetSection.policy.eeFields", { defaultValue: "EE fields" })}
                    value={Object.keys(policy ?? {}).some((key) => !["trustPreset", "reviewPreset", "trustBoundary"].includes(key))
                      ? t("trustPresetSection.policy.eeFieldsPreserved", { defaultValue: "Custom advanced policy fields preserved" })
                      : "-"}
                  />
                </div>
              </CollapsibleSection>
            </div>
          </div>
        ) : null}

        {managedPermissions.authorizationPolicy?.reviewPreset ? null : (
          <p className="text-xs text-muted-foreground">
            {t("trustPresetSection.advancedPermissionsNote", { defaultValue: "Advanced permissions remain editable through the EE permissions extension when installed." })}
          </p>
        )}
      </div>
    </div>
  );
}
