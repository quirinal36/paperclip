import { useState } from "react";
import type { IssueBlockerAttention } from "@paperclipai/shared";
import { cn } from "../lib/utils";
import { StatusGlyph, type StatusGlyphSize } from "./StatusGlyph";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

const allStatuses = ["backlog", "todo", "in_progress", "in_review", "done", "cancelled", "blocked"];

function statusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface StatusIconProps {
  status: string;
  blockerAttention?: IssueBlockerAttention | null;
  onChange?: (status: string) => void;
  className?: string;
  showLabel?: boolean;
  /** Glyph size (PAP-243a). Default `md` (16px); lists/detail/mentions use `lg` (20px). */
  size?: StatusGlyphSize;
}

function blockedAttentionLabel(blockerAttention: IssueBlockerAttention | null | undefined) {
  if (!blockerAttention || blockerAttention.state === "none")
    return t("statusIcon.blocked.label", { defaultValue: "Blocked" });

  if (blockerAttention.reason === "active_child") {
    const count = blockerAttention.coveredBlockerCount;
    if (count === 1 && blockerAttention.sampleBlockerIdentifier) {
      return t("statusIcon.blocked.waitingOnActiveSubTask", {
        defaultValue: "Blocked · waiting on active sub-task {{identifier}}",
        identifier: blockerAttention.sampleBlockerIdentifier,
      });
    }
    if (count === 1)
      return t("statusIcon.blocked.waitingOnOneActiveSubTask", {
        defaultValue: "Blocked · waiting on 1 active sub-task",
      });
    return t("statusIcon.blocked.waitingOnActiveSubTasks", {
      defaultValue: "Blocked · waiting on {{num}} active sub-tasks",
      num: count,
    });
  }

  if (blockerAttention.reason === "active_dependency") {
    const count = blockerAttention.coveredBlockerCount;
    if (count === 1 && blockerAttention.sampleBlockerIdentifier) {
      return t("statusIcon.blocked.coveredByActiveDependency", {
        defaultValue: "Blocked · covered by active dependency {{identifier}}",
        identifier: blockerAttention.sampleBlockerIdentifier,
      });
    }
    if (count === 1)
      return t("statusIcon.blocked.coveredByOneActiveDependency", {
        defaultValue: "Blocked · covered by 1 active dependency",
      });
    return t("statusIcon.blocked.coveredByActiveDependencies", {
      defaultValue: "Blocked · covered by {{num}} active dependencies",
      num: count,
    });
  }

  if (blockerAttention.reason === "stalled_review") {
    const count = blockerAttention.stalledBlockerCount;
    const leaf = blockerAttention.sampleStalledBlockerIdentifier ?? blockerAttention.sampleBlockerIdentifier;
    if (count === 1 && leaf)
      return t("statusIcon.blocked.reviewStalledOn", {
        defaultValue: "Blocked · review stalled on {{identifier}}",
        identifier: leaf,
      });
    if (count === 1)
      return t("statusIcon.blocked.reviewStalledNoNextStep", {
        defaultValue: "Blocked · review stalled with no clear next step",
      });
    return t("statusIcon.blocked.reviewsStalledNoNextStep", {
      defaultValue: "Blocked · {{num}} reviews stalled with no clear next step",
      num: count,
    });
  }

  if (blockerAttention.reason === "attention_required") {
    const count = blockerAttention.attentionBlockerCount || blockerAttention.unresolvedBlockerCount;
    const coveredCount = blockerAttention.coveredBlockerCount;
    if (count === 1) {
      if (coveredCount > 0) {
        return t("statusIcon.blocked.attentionRequiredOneCovered", {
          defaultValue: "Blocked · 1 blocker needs attention; {{covered}} covered by active work",
          covered: coveredCount,
        });
      }
      return t("statusIcon.blocked.attentionRequiredOne", {
        defaultValue: "Blocked · 1 blocker needs attention",
      });
    }
    if (coveredCount > 0) {
      return t("statusIcon.blocked.attentionRequiredManyCovered", {
        defaultValue: "Blocked · {{num}} blockers need attention; {{covered}} covered by active work",
        num: count,
        covered: coveredCount,
      });
    }
    return t("statusIcon.blocked.attentionRequiredMany", {
      defaultValue: "Blocked · {{num}} blockers need attention",
      num: count,
    });
  }

  return t("statusIcon.blocked.label", { defaultValue: "Blocked" });
}

/**
 * Task/issue status indicator — renders the unified, color-blind-safe
 * {@link StatusGlyph} (one distinct shape per status). With `onChange` it also
 * acts as a status picker (popover). This one component drives every standalone
 * status surface: list, kanban, detail header, properties row + picker flyout,
 * sub-task / blocked-by pills, blocked inbox, quicklook, sibling nav, filters,
 * search, columns, dashboard.
 *
 * A "covered" blocked task (waiting on active work) maps to the `in_queue`
 * glyph — the blocked shape recoloured blue — while the full blocked reason
 * still rides on the accessible label.
 */
export function StatusIcon({ status, blockerAttention, onChange, className, showLabel, size = "md" }: StatusIconProps) {
  const [open, setOpen] = useState(false);
  const isCoveredBlocked = status === "blocked" && blockerAttention?.state === "covered";
  const ariaLabel = status === "blocked" ? blockedAttentionLabel(blockerAttention) : statusLabel(status);
  const glyphStatus = isCoveredBlocked ? "in_queue" : status;

  const glyph = (
    <StatusGlyph
      status={glyphStatus}
      size={size}
      className={cn(onChange && !showLabel && "cursor-pointer", className)}
      title={ariaLabel}
    />
  );

  if (!onChange) {
    return showLabel ? (
      <span className="inline-flex items-center gap-1.5">
        {glyph}
        <span className="text-sm">{statusLabel(status)}</span>
      </span>
    ) : (
      glyph
    );
  }

  const trigger = showLabel ? (
    <button className="inline-flex min-h-5 items-center gap-1.5 cursor-pointer hover:bg-accent/50 rounded px-1 -mx-1 py-0.5 transition-colors">
      {glyph}
      <span className="text-sm">{statusLabel(status)}</span>
    </button>
  ) : (
    glyph
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {allStatuses.map((s) => (
          <Button
            key={s}
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start gap-2 text-xs", s === status && "bg-accent")}
            onClick={() => {
              onChange(s);
              setOpen(false);
            }}
          >
            <StatusIcon status={s} size="lg" />
            {statusLabel(s)}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
