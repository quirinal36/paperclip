import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExecutionWorkspace } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { useTranslation } from "@/i18n";
import { Loader2 } from "lucide-react";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import { useToastActions } from "../context/ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { formatDateTime, issueUrl } from "../lib/utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type ExecutionWorkspaceCloseDialogProps = {
  workspaceId: string;
  workspaceName: string;
  currentStatus: ExecutionWorkspace["status"];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClosed?: (workspace: ExecutionWorkspace) => void;
};

function readinessTone(state: "ready" | "ready_with_warnings" | "blocked") {
  if (state === "blocked") {
    return "border-destructive/30 bg-destructive/5 text-destructive";
  }
  if (state === "ready_with_warnings") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300";
  }
  return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
}

export function ExecutionWorkspaceCloseDialog({
  workspaceId,
  workspaceName,
  currentStatus,
  open,
  onOpenChange,
  onClosed,
}: ExecutionWorkspaceCloseDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const actionLabel =
    currentStatus === "cleanup_failed"
      ? t("executionWorkspaceCloseDialog.actions.retryClose", { defaultValue: "Retry close" })
      : t("executionWorkspaceCloseDialog.actions.closeWorkspace", { defaultValue: "Close workspace" });

  const readinessQuery = useQuery({
    queryKey: queryKeys.executionWorkspaces.closeReadiness(workspaceId),
    queryFn: () => executionWorkspacesApi.getCloseReadiness(workspaceId),
    enabled: open,
  });

  const closeWorkspace = useMutation({
    mutationFn: () => executionWorkspacesApi.update(workspaceId, { status: "archived" }),
    onSuccess: (workspace) => {
      queryClient.setQueryData(queryKeys.executionWorkspaces.detail(workspace.id), workspace);
      queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.overview(workspace.companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.closeReadiness(workspace.id) });
      pushToast({
        title:
          currentStatus === "cleanup_failed"
            ? t("executionWorkspaceCloseDialog.toast.closeRetried", { defaultValue: "Workspace close retried" })
            : t("executionWorkspaceCloseDialog.toast.closed", { defaultValue: "Workspace closed" }),
        tone: "success",
      });
      onOpenChange(false);
      onClosed?.(workspace);
    },
    onError: (error) => {
      pushToast({
        title: t("executionWorkspaceCloseDialog.toast.closeFailed", { defaultValue: "Failed to close workspace" }),
        body: error instanceof Error ? error.message : t("executionWorkspaceCloseDialog.errors.unknown", { defaultValue: "Unknown error" }),
        tone: "error",
      });
    },
  });

  const readiness = readinessQuery.data ?? null;
  const blockingIssues = readiness?.linkedIssues.filter((issue) => !issue.isTerminal) ?? [];
  const otherLinkedIssues = readiness?.linkedIssues.filter((issue) => issue.isTerminal) ?? [];
  const confirmDisabled =
    currentStatus === "archived" ||
    closeWorkspace.isPending ||
    readinessQuery.isLoading ||
    readiness == null ||
    readiness.state === "blocked";

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      if (!closeWorkspace.isPending) onOpenChange(nextOpen);
    }}>
      <DialogContent className="max-h-(--sz-85vh) overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{actionLabel}</DialogTitle>
          <DialogDescription className="break-words">
            {t("executionWorkspaceCloseDialog.description.prefix", { defaultValue: "Archive " })}
            <span className="font-medium text-foreground">{workspaceName}</span>
            {t("executionWorkspaceCloseDialog.description.suffix", { defaultValue: " and clean up any owned workspace artifacts. Paperclip keeps the workspace record and task history, but removes it from active workspace views." })}
          </DialogDescription>
        </DialogHeader>

        {readinessQuery.isLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("executionWorkspaceCloseDialog.readiness.checking", { defaultValue: "Checking whether this workspace is safe to close..." })}
          </div>
        ) : readinessQuery.error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {readinessQuery.error instanceof Error ? readinessQuery.error.message : t("executionWorkspaceCloseDialog.readiness.inspectFailed", { defaultValue: "Failed to inspect workspace close readiness." })}
          </div>
        ) : readiness ? (
          <div className="space-y-4">
            <div className={`rounded-xl border px-4 py-3 text-sm ${readinessTone(readiness.state)}`}>
              <div className="font-medium">
                {readiness.state === "blocked"
                  ? t("executionWorkspaceCloseDialog.state.blocked", { defaultValue: "Close is blocked" })
                  : readiness.state === "ready_with_warnings"
                    ? t("executionWorkspaceCloseDialog.state.readyWithWarnings", { defaultValue: "Close is allowed with warnings" })
                    : t("executionWorkspaceCloseDialog.state.ready", { defaultValue: "Close is ready" })}
              </div>
              <div className="mt-1 text-xs opacity-80">
                {readiness.isSharedWorkspace
                  ? t("executionWorkspaceCloseDialog.detail.sharedWorkspace", { defaultValue: "This is a shared workspace session. Archiving it removes this session record but keeps the underlying project workspace." })
                  : readiness.git?.workspacePath && readiness.git.repoRoot && readiness.git.workspacePath !== readiness.git.repoRoot
                    ? t("executionWorkspaceCloseDialog.detail.ownCheckout", { defaultValue: "This execution workspace has its own checkout path and can be archived independently." })
                    : readiness.isProjectPrimaryWorkspace
                      ? t("executionWorkspaceCloseDialog.detail.primaryWorkspace", { defaultValue: "This execution workspace currently points at the project's primary workspace path." })
                      : t("executionWorkspaceCloseDialog.detail.disposable", { defaultValue: "This workspace is disposable and can be archived." })}
              </div>
            </div>

            {blockingIssues.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.blockingTasks", { defaultValue: "Blocking tasks" })}</h3>
                <div className="space-y-2">
                  {blockingIssues.map((issue) => (
                    <div key={issue.id} className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm">
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                        <Link to={issueUrl(issue)} className="min-w-0 break-words font-medium hover:underline">
                          {issue.identifier ?? issue.id} · {issue.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">{issue.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {readiness.blockingReasons.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.blockingReasons", { defaultValue: "Blocking reasons" })}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {readiness.blockingReasons.map((reason) => (
                    <li key={reason} className="break-words rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-destructive">
                      {reason}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {readiness.warnings.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.warnings", { defaultValue: "Warnings" })}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {readiness.warnings.map((warning) => (
                    <li key={warning} className="break-words rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                      {warning}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {readiness.git ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.gitStatus", { defaultValue: "Git status" })}</h3>
                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <div className="text-xs uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("executionWorkspaceCloseDialog.git.branch", { defaultValue: "Branch" })}</div>
                      <div className="font-mono text-xs">{readiness.git.branchName ?? t("executionWorkspaceCloseDialog.git.unknown", { defaultValue: "Unknown" })}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("executionWorkspaceCloseDialog.git.baseRef", { defaultValue: "Base ref" })}</div>
                      <div className="font-mono text-xs">{readiness.git.baseRef ?? t("executionWorkspaceCloseDialog.git.notSet", { defaultValue: "Not set" })}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("executionWorkspaceCloseDialog.git.mergedIntoBase", { defaultValue: "Merged into base" })}</div>
                      <div>{readiness.git.isMergedIntoBase == null ? t("executionWorkspaceCloseDialog.git.unknown", { defaultValue: "Unknown" }) : readiness.git.isMergedIntoBase ? t("executionWorkspaceCloseDialog.git.yes", { defaultValue: "Yes" }) : t("executionWorkspaceCloseDialog.git.no", { defaultValue: "No" })}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("executionWorkspaceCloseDialog.git.aheadBehind", { defaultValue: "Ahead / behind" })}</div>
                      <div>
                        {(readiness.git.aheadCount ?? 0).toString()} / {(readiness.git.behindCount ?? 0).toString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("executionWorkspaceCloseDialog.git.dirtyFiles", { defaultValue: "Dirty tracked files" })}</div>
                      <div>{readiness.git.dirtyEntryCount}</div>
                    </div>
                    <div>
                      <div className="text-xs uppercase tracking-(--tracking-eyebrow) text-muted-foreground">{t("executionWorkspaceCloseDialog.git.untrackedFiles", { defaultValue: "Untracked files" })}</div>
                      <div>{readiness.git.untrackedEntryCount}</div>
                    </div>
                  </div>
                </div>
              </section>
            ) : null}

            {otherLinkedIssues.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.otherLinkedTasks", { defaultValue: "Other linked tasks" })}</h3>
                <div className="space-y-2">
                  {otherLinkedIssues.map((issue) => (
                    <div key={issue.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                        <Link to={issueUrl(issue)} className="min-w-0 break-words font-medium hover:underline">
                          {issue.identifier ?? issue.id} · {issue.title}
                        </Link>
                        <span className="text-xs text-muted-foreground">{issue.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {readiness.runtimeServices.length > 0 ? (
              <section className="space-y-2">
                <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.runtimeServices", { defaultValue: "Attached runtime services" })}</h3>
                <div className="space-y-2">
                  {readiness.runtimeServices.map((service) => (
                    <div key={service.id} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                        <span className="font-medium">{service.serviceName}</span>
                        <span className="text-xs text-muted-foreground">{service.status} · {service.lifecycle}</span>
                      </div>
                      <div className="mt-1 break-words text-xs text-muted-foreground">
                        {service.url ?? service.command ?? service.cwd ?? t("executionWorkspaceCloseDialog.runtimeServices.noDetails", { defaultValue: "No additional details" })}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <h3 className="text-sm font-medium">{t("executionWorkspaceCloseDialog.sections.cleanupActions", { defaultValue: "Cleanup actions" })}</h3>
              <div className="space-y-2">
                {readiness.plannedActions.map((action, index) => (
                  <div key={`${action.kind}-${index}`} className="rounded-xl border border-border bg-background px-4 py-3 text-sm">
                    <div className="font-medium">{action.label}</div>
                    <div className="mt-1 break-words text-muted-foreground">{action.description}</div>
                    {action.command ? (
                      <pre className="mt-2 whitespace-pre-wrap break-all rounded-lg bg-background px-3 py-2 font-mono text-xs text-foreground">
                        {action.command}
                      </pre>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>

            {currentStatus === "cleanup_failed" ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
                {t("executionWorkspaceCloseDialog.messages.cleanupFailed", { defaultValue: "Cleanup previously failed on this workspace. Retrying close will rerun the cleanup flow and update the workspace status if it succeeds." })}
              </div>
            ) : null}

            {currentStatus === "archived" ? (
              <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                {t("executionWorkspaceCloseDialog.messages.alreadyArchived", { defaultValue: "This workspace is already archived." })}
              </div>
            ) : null}

            {readiness.git?.repoRoot ? (
              <div className="break-words text-xs text-muted-foreground">
                {t("executionWorkspaceCloseDialog.repo.root", { defaultValue: "Repo root: " })}<span className="font-mono break-all">{readiness.git.repoRoot}</span>
                {readiness.git.workspacePath ? (
                  <>
                    {" · "}{t("executionWorkspaceCloseDialog.repo.workspacePath", { defaultValue: "Workspace path: " })}<span className="font-mono break-all">{readiness.git.workspacePath}</span>
                  </>
                ) : null}
              </div>
            ) : null}

            <div className="text-xs text-muted-foreground">
              {t("executionWorkspaceCloseDialog.lastChecked", { defaultValue: "Last checked {{time}}", time: formatDateTime(new Date()) })}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={closeWorkspace.isPending}
          >
            {t("executionWorkspaceCloseDialog.actions.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant={currentStatus === "cleanup_failed" ? "default" : "destructive"}
            onClick={() => closeWorkspace.mutate()}
            disabled={confirmDisabled}
          >
            {closeWorkspace.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
