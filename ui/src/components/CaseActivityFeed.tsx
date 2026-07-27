import { useMemo, useState } from "react";
import { Link } from "@/lib/router";
import { Bot, User, Cog, ChevronDown, ListFilter } from "lucide-react";
import type { CaseEvent, CaseEventKind } from "@/api/cases";
import { Button } from "@/components/ui/button";
import { StatusIcon } from "@/components/StatusIcon";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/i18n";
import { cn, relativeTime } from "@/lib/utils";

type Translate = ReturnType<typeof useTranslation>["t"];

/** Human label for an event kind, localized. */
function eventLabel(t: Translate, kind: CaseEventKind): string {
  const labels: Record<CaseEventKind, string> = {
    created: t("caseActivityFeed.eventKind.created", { defaultValue: "created" }),
    updated: t("caseActivityFeed.eventKind.updated", { defaultValue: "updated" }),
    fields_changed: t("caseActivityFeed.eventKind.fieldsChanged", { defaultValue: "fields changed" }),
    status_changed: t("caseActivityFeed.eventKind.statusChanged", { defaultValue: "status changed" }),
    issue_linked: t("caseActivityFeed.eventKind.issueLinked", { defaultValue: "issue linked" }),
    issue_unlinked: t("caseActivityFeed.eventKind.issueUnlinked", { defaultValue: "issue unlinked" }),
    document_revised: t("caseActivityFeed.eventKind.documentRevised", { defaultValue: "document revised" }),
    child_linked: t("caseActivityFeed.eventKind.childLinked", { defaultValue: "child linked" }),
    attachment_added: t("caseActivityFeed.eventKind.attachmentAdded", { defaultValue: "attachment added" }),
    label_added: t("caseActivityFeed.eventKind.labelAdded", { defaultValue: "label added" }),
    label_removed: t("caseActivityFeed.eventKind.labelRemoved", { defaultValue: "label removed" }),
  };
  return labels[kind] ?? kind;
}

/** Human label for the actor, preferring the resolved agent name. */
function actorLabel(t: Translate, event: CaseEvent): string {
  if (event.actorType === "agent")
    return event.actorAgentName ?? t("caseActivityFeed.actor.agent", { defaultValue: "Agent" });
  if (event.actorType === "user") return t("caseActivityFeed.actor.user", { defaultValue: "User" });
  return t("caseActivityFeed.actor.system", { defaultValue: "System" });
}

function issueRelationLabel(t: Translate, event: CaseEvent): string {
  return event.kind === "issue_linked" || event.kind === "issue_unlinked"
    ? t("caseActivityFeed.relation.issue", { defaultValue: "issue" })
    : t("caseActivityFeed.relation.via", { defaultValue: "via" });
}

function ActorIcon({ event }: { event: CaseEvent }) {
  const Icon = event.actorType === "agent" ? Bot : event.actorType === "user" ? User : Cog;
  return <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />;
}

/** One event with actor + run→issue attribution (P4 §1). */
export function CaseEventRow({ event, compact = false }: { event: CaseEvent; compact?: boolean }) {
  const { t } = useTranslation();
  const detail =
    event.kind === "status_changed" && event.payload
      ? `${(event.payload.previousStatus as string) ?? "?"} → ${(event.payload.status as string) ?? "?"}`
      : "";
  return (
    <div className={cn("flex items-start gap-2 text-xs", compact ? "py-1.5" : "py-2")}>
      <span className="mt-1"><ActorIcon event={event} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="font-medium">{eventLabel(t, event.kind)}</span>
          {detail && <span className="text-muted-foreground">· {detail}</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-1.5 text-muted-foreground">
          <span>{actorLabel(t, event)}</span>
          {event.issue && (
            <>
              <span aria-hidden>·</span>
              <span>{issueRelationLabel(t, event)}</span>
              <Link
                to={`/issues/${event.issue.identifier}`}
                className="inline-flex min-w-0 items-center gap-1 text-foreground/80 hover:underline"
                title={event.issue.title}
              >
                <StatusIcon status={event.issue.status} size="sm" />
                <span className="shrink-0 font-mono">{event.issue.identifier}</span>
                <span className="min-w-0 truncate">{event.issue.title}</span>
              </Link>
            </>
          )}
          <span aria-hidden>·</span>
          <span>{relativeTime(event.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

/** The full activity feed with kind filters (detail-page Activity tab). */
export function CaseActivityFeed({ events }: { events: CaseEvent[] }) {
  const { t } = useTranslation();
  const [active, setActive] = useState<Set<CaseEventKind>>(new Set());

  // Only offer filters for kinds actually present, in first-seen order.
  const presentKinds = useMemo(() => {
    const seen: CaseEventKind[] = [];
    for (const e of events) if (!seen.includes(e.kind)) seen.push(e.kind);
    return seen;
  }, [events]);

  const filtered = useMemo(
    () => (active.size === 0 ? events : events.filter((e) => active.has(e.kind))),
    [events, active],
  );

  function toggle(kind: CaseEventKind) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  const filterLabel = active.size === 0
    ? t("caseActivityFeed.filter.all", { defaultValue: "All activity" })
    : active.size === 1
      ? eventLabel(t, [...active][0]!)
      : t("caseActivityFeed.filter.count", {
          defaultValue: "{{filterCount}} filters",
          filterCount: active.size,
        });

  if (events.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("caseActivityFeed.empty.noActivity", { defaultValue: "No activity yet." })}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {t("caseActivityFeed.eventCount", {
            defaultValue: "{{shown}} of {{total}} events",
            shown: filtered.length,
            total: events.length,
          })}
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              <ListFilter className="h-3.5 w-3.5" />
              {filterLabel}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              {t("caseActivityFeed.filter.label", { defaultValue: "Activity filter" })}
            </DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setActive(new Set())}>
              {t("caseActivityFeed.filter.all", { defaultValue: "All activity" })}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {presentKinds.map((kind) => (
              <DropdownMenuCheckboxItem
                key={kind}
                checked={active.has(kind)}
                onCheckedChange={() => toggle(kind)}
              >
                {eventLabel(t, kind)}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t("caseActivityFeed.empty.noMatch", { defaultValue: "No events match this filter." })}
        </p>
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((event) => (
            <CaseEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
