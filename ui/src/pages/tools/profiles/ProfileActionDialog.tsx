import { AlertTriangle } from "lucide-react";
import type { ToolProfileWithDetails } from "@paperclipai/shared";
import { useTranslation } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type ProfileActionDialogKind = "archive" | "delete" | "restore";

export function ProfileActionDialog({
  kind,
  profile,
  pending,
  onClose,
  onArchive,
  onRestore,
  onDelete,
}: {
  kind: ProfileActionDialogKind | null;
  profile: ToolProfileWithDetails | null;
  pending: boolean;
  onClose: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  const { t } = useTranslation();
  if (!kind || !profile) return null;

  const defaultDeleteBlocked = kind === "delete" && profile.summary.isCompanyDefault;
  const agentUnit =
    profile.summary.appliesToAgentCount === 1
      ? t("profileActionDialog.archive.agent", { defaultValue: "agent" })
      : t("profileActionDialog.archive.agents", { defaultValue: "agents" });
  const assignmentUnit =
    profile.summary.assignmentCount === 1
      ? t("profileActionDialog.delete.assignment", { defaultValue: "assignment" })
      : t("profileActionDialog.delete.assignments", { defaultValue: "assignments" });
  const copy = {
    archive: {
      title: t("profileActionDialog.archive.title", { defaultValue: "Archive profile" }),
      body: t("profileActionDialog.archive.body", {
        defaultValue:
          "This profile stops applying to {{agentCount}} {{unit}}. You can restore it later.",
        agentCount: profile.summary.appliesToAgentCount,
        unit: agentUnit,
      }),
      confirm: t("profileActionDialog.archive.confirm", { defaultValue: "Archive" }),
      action: onArchive,
    },
    restore: {
      title: t("profileActionDialog.restore.title", { defaultValue: "Restore profile" }),
      body: t("profileActionDialog.restore.body", {
        defaultValue: "This profile will be active again and can be assigned to agents.",
      }),
      confirm: t("profileActionDialog.restore.confirm", { defaultValue: "Restore" }),
      action: onRestore,
    },
    delete: {
      title: t("profileActionDialog.delete.title", { defaultValue: "Delete profile" }),
      body: defaultDeleteBlocked
        ? t("profileActionDialog.delete.bodyBlocked", {
            defaultValue:
              "This profile is the company default. Reassign the company default to another profile before deleting it.",
          })
        : t("profileActionDialog.delete.body", {
            defaultValue:
              "This permanently deletes the profile and removes {{assignmentCount}} {{unit}}.",
            assignmentCount: profile.summary.assignmentCount,
            unit: assignmentUnit,
          }),
      confirm: t("profileActionDialog.delete.confirm", { defaultValue: "Delete" }),
      action: onDelete,
    },
  }[kind];

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.body}</DialogDescription>
        </DialogHeader>
        {defaultDeleteBlocked ? (
          <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t("profileActionDialog.defaultBlockedWarning", {
                defaultValue:
                  "Choose another access profile and make it the company default first.",
              })}
            </span>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t("profileActionDialog.cancel", { defaultValue: "Cancel" })}
          </Button>
          <Button
            variant={kind === "delete" ? "destructive" : "default"}
            disabled={pending || defaultDeleteBlocked}
            onClick={copy.action}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
