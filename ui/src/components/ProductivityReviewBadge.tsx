import { Eye } from "lucide-react";
import type { IssueProductivityReview } from "@paperclipai/shared";
import { t, useTranslation } from "@/i18n";
import { Link } from "../lib/router";
import { cn } from "../lib/utils";
import { createIssueDetailPath } from "../lib/issueDetailBreadcrumb";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

export function productivityReviewTriggerLabel(
  trigger: IssueProductivityReview["trigger"],
): string {
  const fallback = t("productivityReviewBadge.trigger.fallback", {
    defaultValue: "Productivity review",
  });
  if (!trigger) return fallback;
  const labels: Record<string, string> = {
    no_comment_streak: t("productivityReviewBadge.triggers.noCommentStreak", {
      defaultValue: "No-comment streak",
    }),
    long_active_duration: t("productivityReviewBadge.triggers.longActiveDuration", {
      defaultValue: "Long active duration",
    }),
    high_churn: t("productivityReviewBadge.triggers.highChurn", {
      defaultValue: "High churn",
    }),
  };
  return labels[trigger] ?? fallback;
}

export function ProductivityReviewBadge({
  review,
  className,
  hideLabel = false,
}: {
  review: IssueProductivityReview;
  className?: string;
  hideLabel?: boolean;
}) {
  const { t } = useTranslation();
  const label = productivityReviewTriggerLabel(review.trigger);
  const reviewIdentifier = review.reviewIdentifier ?? review.reviewIssueId.slice(0, 8);
  const reviewPath = createIssueDetailPath(review.reviewIdentifier ?? review.reviewIssueId);
  const statusLabels: Record<string, string> = {
    todo: t("productivityReviewBadge.status.open", { defaultValue: "Open" }),
    in_progress: t("productivityReviewBadge.status.inProgress", { defaultValue: "In progress" }),
    in_review: t("productivityReviewBadge.status.inReview", { defaultValue: "In review" }),
    blocked: t("productivityReviewBadge.status.blocked", { defaultValue: "Blocked" }),
    backlog: t("productivityReviewBadge.status.open", { defaultValue: "Open" }),
  };
  const statusLabel = statusLabels[review.status] ?? review.status.replace(/_/g, " ");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={reviewPath}
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-(length:--text-nano) font-medium text-amber-700 dark:text-amber-300 shrink-0 hover:bg-amber-500/20 transition-colors",
            className,
          )}
          aria-label={t("productivityReviewBadge.badge.ariaLabel", {
            defaultValue: "Under review · productivity review {{reviewIdentifier}} ({{label}})",
            reviewIdentifier,
            label,
          })}
        >
          <Eye className="h-3 w-3" aria-hidden />
          {hideLabel ? null : (
            <span>
              {t("productivityReviewBadge.badge.underReview", { defaultValue: "Under review" })}
            </span>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-1 text-xs">
          <div className="font-semibold">
            {t("productivityReviewBadge.tooltip.title", {
              defaultValue: "Productivity review open",
            })}
          </div>
          <div>
            <span className="text-muted-foreground">
              {t("productivityReviewBadge.tooltip.triggerLabel", { defaultValue: "Trigger:" })}
            </span>{" "}
            {label}
          </div>
          {typeof review.noCommentStreak === "number" && review.noCommentStreak > 0 ? (
            <div>
              <span className="text-muted-foreground">
                {t("productivityReviewBadge.tooltip.noCommentStreakLabel", {
                  defaultValue: "No-comment streak:",
                })}
              </span>{" "}
              {t("productivityReviewBadge.tooltip.runs", {
                defaultValue: "{{runs}} runs",
                runs: review.noCommentStreak,
              })}
            </div>
          ) : null}
          <div>
            <span className="text-muted-foreground">
              {t("productivityReviewBadge.tooltip.reviewLabel", { defaultValue: "Review:" })}
            </span>{" "}
            {reviewIdentifier} ({statusLabel})
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
