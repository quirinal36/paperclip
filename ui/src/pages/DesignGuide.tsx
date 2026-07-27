import { useState } from "react";
import { useTranslation } from "@/i18n";
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  CircleDot,
  Command as CommandIcon,
  DollarSign,
  Hexagon,
  History,
  Inbox,
  LayoutDashboard,
  ListTodo,
  Mail,
  Plus,
  Search,
  Settings,
  Target,
  Trash2,
  Upload,
  User,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InlineBanner } from "@/components/InlineBanner";
import { BuiltInLifecycleChip } from "@/components/BuiltInAgentBadges";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable-panels";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuShortcut,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandInput,
  CommandList,
  CommandGroup,
  CommandItem,
  CommandEmpty,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar";
import { AgentCapsule, AGENT_GRADIENT_COUNT } from "@/components/AgentCapsule";
import { StatusBadge, IssueStatusBadge } from "@/components/StatusBadge";
import { StatusIcon } from "@/components/StatusIcon";
import { EnforcementBanner } from "@/components/EnforcementBanner";
import { ActionCard, ActionCardMobile, BindingsTable } from "@/components/actions/ActionCard";
import { PriorityIcon } from "@/components/PriorityIcon";
import { agentStatusDot, agentStatusDotDefault } from "@/lib/status-colors";
import { EntityRow } from "@/components/EntityRow";
import { EmptyState } from "@/components/EmptyState";
import { MetricCard } from "@/components/MetricCard";
import { FilterBar, type FilterValue } from "@/components/FilterBar";
import { InlineEditor } from "@/components/InlineEditor";
import { PageSkeleton } from "@/components/PageSkeleton";
import { Identity } from "@/components/Identity";
import { IssueReferencePill } from "@/components/IssueReferencePill";
import { MembershipAction } from "@/components/MembershipAction";
import { IssueOutputSection } from "@/components/issue-output/IssueOutputSection";
import { EnvironmentVariablesEditor } from "@/components/environment-variables-editor";
import type { CompanySecret, EnvBinding } from "@paperclipai/shared";
import {
  EnvInputsList,
  ExternalSourcesList,
  RequiredSkillsList,
  StepSkillPlan,
  StepSourcePolicy,
  TeamCard,
  TeamHierarchyPreview,
  TeamRow,
} from "@/pages/TeamCatalog";
import {
  currentInstalledState,
  onboardingTeams,
  optionalTeam,
  outOfDateInstalledState,
  sampleSkillPreparations,
  sampleTeam,
  warnTeam,
} from "@/pages/TeamCatalog.fixtures";
import type { IssueWorkProduct } from "@paperclipai/shared";

/* ------------------------------------------------------------------ */
/*  Sample data for the Issue Output surface showcase                  */
/* ------------------------------------------------------------------ */

function sampleOutput(
  id: string,
  attachmentId: string,
  contentType: string,
  filename: string,
  opts: { byteSize: number; isPrimary?: boolean; createdAt: string },
): IssueWorkProduct {
  const contentPath = `/api/attachments/${attachmentId}/content`;
  return {
    id,
    companyId: "demo-company",
    projectId: null,
    issueId: "demo-issue",
    executionWorkspaceId: null,
    runtimeServiceId: null,
    type: "artifact",
    provider: "paperclip",
    externalId: null,
    title: filename,
    url: null,
    status: "active",
    reviewState: "none",
    isPrimary: Boolean(opts.isPrimary),
    healthStatus: "unknown",
    summary: null,
    createdByRunId: null,
    createdAt: new Date(opts.createdAt),
    updatedAt: new Date(opts.createdAt),
    metadata: {
      attachmentId,
      contentType,
      byteSize: opts.byteSize,
      contentPath,
      openPath: contentPath,
      downloadPath: `${contentPath}?download=1`,
      originalFilename: filename,
    },
  } as IssueWorkProduct;
}

const DESIGN_GUIDE_OUTPUTS: IssueWorkProduct[] = [
  sampleOutput("wp-vid", "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "video/mp4", "q3-summary.mp4", {
    byteSize: 19_293_798,
    isPrimary: true,
    createdAt: "2026-05-30T12:00:00Z",
  }),
  sampleOutput("wp-pdf", "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "application/pdf", "talking-points.pdf", {
    byteSize: 421_888,
    createdAt: "2026-05-30T11:52:00Z",
  }),
];

const DESIGN_GUIDE_DEGRADED_OUTPUTS: IssueWorkProduct[] = [
  {
    ...sampleOutput("wp-broken", "cccccccc-cccc-4ccc-8ccc-cccccccccccc", "video/mp4", "corrupt-output.mp4", {
      byteSize: 0,
      isPrimary: true,
      createdAt: "2026-05-30T12:01:00Z",
    }),
    // Strip the path metadata so it fails the shared artifact schema.
    metadata: { attachmentId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc", contentType: "video/mp4" },
  } as IssueWorkProduct,
];

/* ------------------------------------------------------------------ */
/*  Section wrapper                                                    */
/* ------------------------------------------------------------------ */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h3>
      <Separator />
      {children}
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

// Onboarding seam (design §6 + §12.5): the TeamCard tile in its "Pick a starter
// team" 3-col grid, with the first defaultInstall tile selected.
function TeamCardShowcase() {
  const [selectedId, setSelectedId] = useState(onboardingTeams[0]?.id ?? null);
  return (
    <div className="grid max-w-2xl gap-4 md:grid-cols-2 lg:grid-cols-3">
      {onboardingTeams.map((team) => (
        <TeamCard
          key={team.id}
          team={team}
          selected={team.id === selectedId}
          onSelect={() => setSelectedId(team.id)}
        />
      ))}
    </div>
  );
}

// Reusable environment-variables editor: one shared grid, in-field source
// switch, fuzzy secret picker, sensitive-value detection, inline health.
const DESIGN_GUIDE_SECRETS: CompanySecret[] = [
  {
    id: "dg-github",
    companyId: "dg",
    scope: "company",
    ownerUserId: null,
    userSecretDefinitionId: null,
    key: "github_token",
    name: "GITHUB_TOKEN",
    provider: "local_encrypted",
    status: "active",
    managedMode: "paperclip_managed",
    externalRef: null,
    providerConfigId: null,
    providerMetadata: null,
    latestVersion: 3,
    description: null,
    lastResolvedAt: null,
    lastRotatedAt: null,
    deletedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  },
  {
    id: "dg-db",
    companyId: "dg",
    scope: "company",
    ownerUserId: null,
    userSecretDefinitionId: null,
    key: "db_connection",
    name: "DB_CONNECTION",
    provider: "local_encrypted",
    status: "active",
    managedMode: "paperclip_managed",
    externalRef: null,
    providerConfigId: null,
    providerMetadata: null,
    latestVersion: 3,
    description: null,
    lastResolvedAt: null,
    lastRotatedAt: null,
    deletedAt: null,
    createdByAgentId: null,
    createdByUserId: null,
    createdAt: new Date("2026-03-01T10:00:00.000Z"),
    updatedAt: new Date("2026-03-01T10:00:00.000Z"),
  },
];

function EnvironmentVariablesEditorShowcase() {
  const [env, setEnv] = useState<Record<string, EnvBinding>>({
    NODE_ENV: { type: "plain", value: "production" },
    GH_TOKEN: { type: "secret_ref", secretId: "dg-github", version: "latest" },
    DB_URL: { type: "secret_ref", secretId: "dg-db", version: 3 },
    STRIPE_API_KEY: { type: "plain", value: "sk-live-51H8xL0aBcDeFgHiJkLmNoPq" },
  });
  return (
    <div className="max-w-(--sz-640px) rounded-md border border-border p-4">
      <EnvironmentVariablesEditor
        value={env}
        secrets={DESIGN_GUIDE_SECRETS}
        onChange={(next) => setEnv(next ?? {})}
        onCreateSecret={async (name) => ({
          ...DESIGN_GUIDE_SECRETS[0]!,
          id: `dg-${name}`,
          key: name,
          name: name.toUpperCase(),
          latestVersion: 1,
        })}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Color swatch                                                       */
/* ------------------------------------------------------------------ */

function Swatch({ name, cssVar }: { name: string; cssVar: string }) {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-8 w-8 rounded-md border border-border shrink-0"
        style={{ backgroundColor: `var(${cssVar})` }}
      />
      <div>
        <p className="text-xs font-mono">{cssVar}</p>
        <p className="text-xs text-muted-foreground">{name}</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export function DesignGuide() {
  const { t } = useTranslation();
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [selectValue, setSelectValue] = useState("in_progress");
  const [menuChecked, setMenuChecked] = useState(true);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [inlineText, setInlineText] = useState(
    t("designGuide.formElements.inlineTextValue", { defaultValue: "Click to edit this text" })
  );
  const [inlineTitle, setInlineTitle] = useState(
    t("designGuide.formElements.inlineTitleValue", { defaultValue: "Editable Title" })
  );
  const [inlineDesc, setInlineDesc] = useState(
    t("designGuide.formElements.inlineDescValue", {
      defaultValue:
        "This is an editable description. Click to edit it — the textarea auto-sizes to fit the content without layout shift.",
    })
  );
  const [filters, setFilters] = useState<FilterValue[]>([
    { key: "status", label: t("designGuide.filterBar.statusLabel", { defaultValue: "Status" }), value: t("designGuide.filterBar.activeValue", { defaultValue: "Active" }) },
    { key: "priority", label: t("designGuide.filterBar.priorityLabel", { defaultValue: "Priority" }), value: t("designGuide.filterBar.highValue", { defaultValue: "High" }) },
  ]);
  const [allowExternal, setAllowExternal] = useState(false);
  const [allowUnpinned, setAllowUnpinned] = useState(false);
  const [allowLocalPath, setAllowLocalPath] = useState(false);

  return (
    <div className="space-y-10 max-w-4xl">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-bold">{t("designGuide.page.title", { defaultValue: "Design Guide" })}</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {t("designGuide.page.subtitle", { defaultValue: "Every component, style, and pattern used across Paperclip." })}
        </p>
      </div>

      {/* ============================================================ */}
      {/*  COVERAGE                                                     */}
      {/* ============================================================ */}
      <Section title={t("designGuide.coverage.title", { defaultValue: "Component Coverage" })}>
        <p className="text-sm text-muted-foreground">
          {t("designGuide.coverage.description", { defaultValue: "This page should be updated when new UI primitives or app-level patterns ship." })}
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={t("designGuide.coverage.uiPrimitives", { defaultValue: "UI primitives" })}>
            <div className="flex flex-wrap gap-2">
              {[
                "avatar", "badge", "breadcrumb", "button", "card", "checkbox", "collapsible",
                "command", "dialog", "dropdown-menu", "input", "label", "popover", "resizable-panels",
                "scroll-area", "select", "separator", "sheet", "skeleton", "tabs", "textarea", "tooltip",
              ].map((name) => (
                <Badge key={name} variant="outline" className="font-mono text-(length:--text-nano)">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
          <SubSection title={t("designGuide.coverage.appComponents", { defaultValue: "App components" })}>
            <div className="flex flex-wrap gap-2">
              {[
                "StatusBadge", "StatusIcon", "PriorityIcon", "EntityRow", "EmptyState", "MetricCard",
                "FilterBar", "InlineEditor", "PageSkeleton", "Identity", "CommentThread", "MarkdownEditor",
                "PropertiesPanel", "Sidebar", "CommandPalette", "EnvironmentVariablesEditor",
                "InlineBanner", "BuiltInAgentGate", "BuiltInLifecycleChip",
              ].map((name) => (
                <Badge key={name} variant="ghost" className="font-mono text-(length:--text-nano)">
                  {name}
                </Badge>
              ))}
            </div>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COLORS                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.colors.title", { defaultValue: "Colors" })}>
        <SubSection title={t("designGuide.colors.core", { defaultValue: "Core" })}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name={t("designGuide.colors.swatch.background", { defaultValue: "Background" })} cssVar="--background" />
            <Swatch name={t("designGuide.colors.swatch.foreground", { defaultValue: "Foreground" })} cssVar="--foreground" />
            <Swatch name={t("designGuide.colors.swatch.card", { defaultValue: "Card" })} cssVar="--card" />
            <Swatch name={t("designGuide.colors.swatch.primary", { defaultValue: "Primary" })} cssVar="--primary" />
            <Swatch name={t("designGuide.colors.swatch.primaryForeground", { defaultValue: "Primary foreground" })} cssVar="--primary-foreground" />
            <Swatch name={t("designGuide.colors.swatch.secondary", { defaultValue: "Secondary" })} cssVar="--secondary" />
            <Swatch name={t("designGuide.colors.swatch.muted", { defaultValue: "Muted" })} cssVar="--muted" />
            <Swatch name={t("designGuide.colors.swatch.mutedForeground", { defaultValue: "Muted foreground" })} cssVar="--muted-foreground" />
            <Swatch name={t("designGuide.colors.swatch.accent", { defaultValue: "Accent" })} cssVar="--accent" />
            <Swatch name={t("designGuide.colors.swatch.destructive", { defaultValue: "Destructive" })} cssVar="--destructive" />
            <Swatch name={t("designGuide.colors.swatch.border", { defaultValue: "Border" })} cssVar="--border" />
            <Swatch name={t("designGuide.colors.swatch.ring", { defaultValue: "Ring" })} cssVar="--ring" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.colors.sidebar", { defaultValue: "Sidebar" })}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name={t("designGuide.colors.swatch.sidebar", { defaultValue: "Sidebar" })} cssVar="--sidebar" />
            <Swatch name={t("designGuide.colors.swatch.sidebarBorder", { defaultValue: "Sidebar border" })} cssVar="--sidebar-border" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.colors.chart", { defaultValue: "Chart" })}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Swatch name={t("designGuide.colors.swatch.chart1", { defaultValue: "Chart 1" })} cssVar="--chart-1" />
            <Swatch name={t("designGuide.colors.swatch.chart2", { defaultValue: "Chart 2" })} cssVar="--chart-2" />
            <Swatch name={t("designGuide.colors.swatch.chart3", { defaultValue: "Chart 3" })} cssVar="--chart-3" />
            <Swatch name={t("designGuide.colors.swatch.chart4", { defaultValue: "Chart 4" })} cssVar="--chart-4" />
            <Swatch name={t("designGuide.colors.swatch.chart5", { defaultValue: "Chart 5" })} cssVar="--chart-5" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TYPOGRAPHY                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.typography.title", { defaultValue: "Typography" })}>
        <div className="space-y-3">
          <h2 className="text-xl font-bold">{t("designGuide.typography.pageTitle", { defaultValue: "Page Title — text-xl font-bold" })}</h2>
          <h2 className="text-lg font-semibold">{t("designGuide.typography.sectionTitle", { defaultValue: "Section Title — text-lg font-semibold" })}</h2>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t("designGuide.typography.sectionHeading", { defaultValue: "Section Heading — text-sm font-semibold uppercase tracking-wide" })}
          </h3>
          <p className="text-sm font-medium">{t("designGuide.typography.cardTitle", { defaultValue: "Card Title — text-sm font-medium" })}</p>
          <p className="text-sm font-semibold">{t("designGuide.typography.cardTitleAlt", { defaultValue: "Card Title Alt — text-sm font-semibold" })}</p>
          <p className="text-sm">{t("designGuide.typography.bodyText", { defaultValue: "Body text — text-sm" })}</p>
          <p className="text-sm text-muted-foreground">
            {t("designGuide.typography.mutedDescription", { defaultValue: "Muted description — text-sm text-muted-foreground" })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("designGuide.typography.tinyLabel", { defaultValue: "Tiny label — text-xs text-muted-foreground" })}
          </p>
          <p className="text-sm font-mono text-muted-foreground">
            {t("designGuide.typography.monoIdentifier", { defaultValue: "Mono identifier — text-sm font-mono text-muted-foreground" })}
          </p>
          <p className="text-2xl font-bold">{t("designGuide.typography.largeStat", { defaultValue: "Large stat — text-2xl font-bold" })}</p>
          <p className="font-mono text-xs">{t("designGuide.typography.logCodeText", { defaultValue: "Log/code text — font-mono text-xs" })}</p>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SPACING & RADIUS                                             */}
      {/* ============================================================ */}
      <Section title={t("designGuide.radius.title", { defaultValue: "Radius" })}>
        <div className="flex items-end gap-4 flex-wrap">
          {[
            ["sm", "var(--radius-sm)"],
            ["md", "var(--radius-md)"],
            ["lg", "var(--radius-lg)"],
            ["xl", "var(--radius-xl)"],
            ["full", "9999px"],
          ].map(([label, radius]) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div
                className="h-12 w-12 bg-primary"
                style={{ borderRadius: radius }}
              />
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BUTTONS                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.buttons.title", { defaultValue: "Buttons" })}>
        <SubSection title={t("designGuide.buttons.variants", { defaultValue: "Variants" })}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="default">Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.buttons.sizes", { defaultValue: "Sizes" })}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="xs">Extra Small</Button>
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.buttons.iconButtons", { defaultValue: "Icon buttons" })}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="ghost" size="icon-xs"><Search /></Button>
            <Button variant="ghost" size="icon-sm"><Search /></Button>
            <Button variant="outline" size="icon"><Search /></Button>
            <Button variant="outline" size="icon-lg"><Search /></Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.buttons.withIcons", { defaultValue: "With icons" })}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button><Plus /> {t("designGuide.buttons.newIssue", { defaultValue: "New Issue" })}</Button>
            <Button variant="outline"><Upload /> {t("designGuide.buttons.upload", { defaultValue: "Upload" })}</Button>
            <Button variant="destructive"><Trash2 /> {t("designGuide.buttons.delete", { defaultValue: "Delete" })}</Button>
            <Button size="sm"><Plus /> {t("designGuide.buttons.add", { defaultValue: "Add" })}</Button>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.buttons.states", { defaultValue: "States" })}>
          <div className="flex items-center gap-2 flex-wrap">
            <Button disabled>Disabled</Button>
            <Button variant="outline" disabled>Disabled Outline</Button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  BADGES                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.badges.title", { defaultValue: "Badges" })}>
        <SubSection title={t("designGuide.badges.variants", { defaultValue: "Variants" })}>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="ghost">Ghost</Badge>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  STATUS BADGES & ICONS                                        */}
      {/* ============================================================ */}
      <Section title={t("designGuide.status.title", { defaultValue: "Status System" })}>
        <SubSection title={t("designGuide.status.statusBadgeAll", { defaultValue: "StatusBadge (all statuses)" })}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              "active", "running", "paused", "idle", "archived", "planned",
              "achieved", "completed", "failed", "timed_out", "succeeded", "error",
              "pending_approval", "backlog", "todo", "in_progress", "in_review", "blocked",
              "done", "terminated", "cancelled", "pending", "revision_requested",
              "approved", "rejected",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </SubSection>

        <SubSection title={t("designGuide.status.issueStatusBadge", { defaultValue: "IssueStatusBadge (brand chip + glyph — PAP-75)" })}>
          <div className="flex items-center gap-2 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "blocked", "cancelled"].map(
              (s) => (
                <IssueStatusBadge key={s} status={s} />
              )
            )}
          </div>
        </SubSection>

        <SubSection title={t("designGuide.status.statusIconInteractive", { defaultValue: "StatusIcon (interactive)" })}>
          <div className="flex items-center gap-3 flex-wrap">
            {["backlog", "todo", "in_progress", "in_review", "done", "cancelled", "blocked"].map(
              (s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <StatusIcon status={s} />
                  <span className="text-xs text-muted-foreground">{s}</span>
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <StatusIcon status={status} onChange={setStatus} />
            <span className="text-sm">{t("designGuide.status.statusIconHint", { defaultValue: "Click the icon to change status (current: {{status}})", status })}</span>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.status.priorityIconInteractive", { defaultValue: "PriorityIcon (interactive)" })}>
          <div className="flex items-center gap-3 flex-wrap">
            {["critical", "high", "medium", "low"].map((p) => (
              <div key={p} className="flex items-center gap-1.5">
                <PriorityIcon priority={p} />
                <span className="text-xs text-muted-foreground">{p}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <PriorityIcon priority={priority} onChange={setPriority} />
            <span className="text-sm">{t("designGuide.status.priorityIconHint", { defaultValue: "Click the icon to change (current: {{priority}})", priority })}</span>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.status.agentStatusDots", { defaultValue: "Agent status dots" })}>
          <div className="flex items-center gap-4 flex-wrap">
            {(["running", "active", "paused", "error", "archived"] as const).map((label) => (
              <div key={label} className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`inline-flex h-full w-full rounded-full ${agentStatusDot[label] ?? agentStatusDotDefault}`} />
                </span>
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </SubSection>

        <SubSection title={t("designGuide.status.runInvocationBadges", { defaultValue: "Run invocation badges" })}>
          <div className="flex items-center gap-2 flex-wrap">
            {[
              ["timer", "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"],
              ["assignment", "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"],
              ["on_demand", "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"],
              ["automation", "bg-muted text-muted-foreground"],
            ].map(([label, cls]) => (
              <Badge variant="ghost" key={label} className={`px-1.5 text-(length:--text-nano) ${cls}`}>
                {label}
              </Badge>
            ))}
          </div>
        </SubSection>

        <SubSection title="IssueReferencePill">
          <p className="text-xs text-muted-foreground">
            {t("designGuide.status.issueReferencePill.desc1", { defaultValue: "Used wherever a task is referenced — in markdown, the Related Work tab, and activity summaries. Pass" })}{" "}
            <code className="font-mono">status</code>{" "}
            {t("designGuide.status.issueReferencePill.desc2", { defaultValue: "to show the target issue's state at a glance. Use" })}{" "}
            <code className="font-mono">strikethrough</code>{" "}
            {t("designGuide.status.issueReferencePill.desc3", { defaultValue: "for \"removed\" contexts." })}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <IssueReferencePill issue={{ id: "demo-1", identifier: "PAP-123", title: t("designGuide.status.pill.identifierOnly", { defaultValue: "Identifier only — no status yet" }) }} />
            <IssueReferencePill issue={{ id: "demo-2", identifier: "PAP-456", title: t("designGuide.status.pill.withInProgress", { defaultValue: "With in_progress status" }), status: "in_progress" }} />
            <IssueReferencePill issue={{ id: "demo-3", identifier: "PAP-789", title: t("designGuide.status.pill.done", { defaultValue: "Done status" }), status: "done" }} />
            <IssueReferencePill issue={{ id: "demo-4", identifier: "PAP-101", title: t("designGuide.status.pill.blocked", { defaultValue: "Blocked status" }), status: "blocked" }} />
            <IssueReferencePill strikethrough issue={{ id: "demo-5", identifier: "PAP-202", title: t("designGuide.status.pill.removed", { defaultValue: "Removed (strikethrough)" }), status: "todo" }} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  AGENT CAPSULE                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.agentCapsule.title", { defaultValue: "Agent Capsule" })}>
        <p className="text-sm text-muted-foreground max-w-prose">
          {t("designGuide.agentCapsule.desc1", { defaultValue: "The brand \"capsule is the agent\" motif. A single agent reads as a tall pill that moves through three states as it comes to life. The online fill uses the live brand agent-gradient tokens (" })}
          <code className="font-mono">--agent-Na</code> → <code className="font-mono">--agent-Nb</code>);{" "}
          <code className="font-mono">prefers-reduced-motion</code>{" "}
          {t("designGuide.agentCapsule.desc2", { defaultValue: "skips the liquid rise and pulses and renders the final state." })}
        </p>
        <SubSection title={t("designGuide.agentCapsule.states", { defaultValue: "States" })}>
          <div className="flex items-end gap-10">
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="slot" />
              <span className="text-xs text-muted-foreground">slot</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="configured" />
              <span className="text-xs text-muted-foreground">configured</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" gradient={5} />
              <span className="text-xs text-muted-foreground">online</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" gradient={5} glow="blue" />
              <span className="text-xs text-muted-foreground">online · blue glow</span>
            </div>
          </div>
        </SubSection>
        <SubSection title={t("designGuide.agentCapsule.sizes", { defaultValue: "Sizes" })}>
          <div className="flex items-end gap-8">
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="sm" gradient={1} />
              <span className="text-xs text-muted-foreground">sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="md" gradient={4} />
              <span className="text-xs text-muted-foreground">md</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size="lg" gradient={8} />
              <span className="text-xs text-muted-foreground">lg</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <AgentCapsule state="online" size={{ width: 28, height: 96 }} gradient={6} />
              <span className="text-xs text-muted-foreground">custom px</span>
            </div>
          </div>
        </SubSection>
        <SubSection title={t("designGuide.agentCapsule.gradients", { defaultValue: "Gradients" })}>
          <div className="flex items-end gap-3 flex-wrap">
            {Array.from({ length: AGENT_GRADIENT_COUNT }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5">
                <AgentCapsule state="online" size="sm" gradient={i + 1} />
                <span className="text-(length:--text-nano) font-mono text-muted-foreground">{i + 1}</span>
              </div>
            ))}
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FORM ELEMENTS                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.formElements.title", { defaultValue: "Form Elements" })}>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={t("designGuide.formElements.input", { defaultValue: "Input" })}>
            <Input placeholder={t("designGuide.formElements.inputDefaultPlaceholder", { defaultValue: "Default input" })} />
            <Input placeholder={t("designGuide.formElements.inputDisabledPlaceholder", { defaultValue: "Disabled input" })} disabled className="mt-2" />
          </SubSection>

          <SubSection title={t("designGuide.formElements.textarea", { defaultValue: "Textarea" })}>
            <Textarea placeholder={t("designGuide.formElements.textareaPlaceholder", { defaultValue: "Write something..." })} />
          </SubSection>

          <SubSection title={t("designGuide.formElements.checkboxLabel", { defaultValue: "Checkbox & Label" })}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox id="check1" defaultChecked />
                <Label htmlFor="check1">{t("designGuide.formElements.checkedItem", { defaultValue: "Checked item" })}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check2" />
                <Label htmlFor="check2">{t("designGuide.formElements.uncheckedItem", { defaultValue: "Unchecked item" })}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="check3" disabled />
                <Label htmlFor="check3">{t("designGuide.formElements.disabledItem", { defaultValue: "Disabled item" })}</Label>
              </div>
            </div>
          </SubSection>

          <SubSection title={t("designGuide.formElements.inlineEditor", { defaultValue: "Inline Editor" })}>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("designGuide.formElements.titleSingleLine", { defaultValue: "Title (single-line)" })}</p>
                <InlineEditor
                  value={inlineTitle}
                  onSave={setInlineTitle}
                  as="h2"
                  className="text-xl font-bold"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("designGuide.formElements.bodyTextSingleLine", { defaultValue: "Body text (single-line)" })}</p>
                <InlineEditor
                  value={inlineText}
                  onSave={setInlineText}
                  as="p"
                  className="text-sm"
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">{t("designGuide.formElements.descriptionMultiline", { defaultValue: "Description (multiline, auto-sizing)" })}</p>
                <InlineEditor
                  value={inlineDesc}
                  onSave={setInlineDesc}
                  as="p"
                  className="text-sm text-muted-foreground"
                  placeholder={t("designGuide.formElements.addDescriptionPlaceholder", { defaultValue: "Add a description..." })}
                  multiline
                />
              </div>
            </div>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SELECT                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.select.title", { defaultValue: "Select" })}>
        <div className="grid gap-6 md:grid-cols-2">
          <SubSection title={t("designGuide.select.defaultSize", { defaultValue: "Default size" })}>
            <Select value={selectValue} onValueChange={setSelectValue}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t("designGuide.select.statusPlaceholder", { defaultValue: "Select status" })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">{t("designGuide.select.backlog", { defaultValue: "Backlog" })}</SelectItem>
                <SelectItem value="todo">{t("designGuide.select.todo", { defaultValue: "Todo" })}</SelectItem>
                <SelectItem value="in_progress">{t("designGuide.select.inProgress", { defaultValue: "In Progress" })}</SelectItem>
                <SelectItem value="in_review">{t("designGuide.select.inReview", { defaultValue: "In Review" })}</SelectItem>
                <SelectItem value="done">{t("designGuide.select.done", { defaultValue: "Done" })}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("designGuide.select.currentValue", { defaultValue: "Current value: {{value}}", value: selectValue })}</p>
          </SubSection>
          <SubSection title={t("designGuide.select.smallTrigger", { defaultValue: "Small trigger" })}>
            <Select defaultValue="high">
              <SelectTrigger size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">{t("designGuide.select.critical", { defaultValue: "Critical" })}</SelectItem>
                <SelectItem value="high">{t("designGuide.select.high", { defaultValue: "High" })}</SelectItem>
                <SelectItem value="medium">{t("designGuide.select.medium", { defaultValue: "Medium" })}</SelectItem>
                <SelectItem value="low">{t("designGuide.select.low", { defaultValue: "Low" })}</SelectItem>
              </SelectContent>
            </Select>
          </SubSection>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DROPDOWN MENU                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.dropdownMenu.title", { defaultValue: "Dropdown Menu" })}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {t("designGuide.dropdownMenu.quickActions", { defaultValue: "Quick Actions" })}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuItem>
              <Check className="h-4 w-4" />
              {t("designGuide.dropdownMenu.markAsDone", { defaultValue: "Mark as done" })}
              <DropdownMenuShortcut>⌘D</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <BookOpen className="h-4 w-4" />
              {t("designGuide.dropdownMenu.openDocs", { defaultValue: "Open docs" })}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={menuChecked}
              onCheckedChange={(value) => setMenuChecked(value === true)}
            >
              {t("designGuide.dropdownMenu.watchIssue", { defaultValue: "Watch issue" })}
            </DropdownMenuCheckboxItem>
            <DropdownMenuItem variant="destructive">
              <Trash2 className="h-4 w-4" />
              {t("designGuide.dropdownMenu.deleteIssue", { defaultValue: "Delete issue" })}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Section>

      {/* ============================================================ */}
      {/*  POPOVER                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.popover.title", { defaultValue: "Popover" })}>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">{t("designGuide.popover.open", { defaultValue: "Open Popover" })}</Button>
          </PopoverTrigger>
          <PopoverContent className="space-y-2">
            <p className="text-sm font-medium">{t("designGuide.popover.agentHeartbeat", { defaultValue: "Agent heartbeat" })}</p>
            <p className="text-xs text-muted-foreground">
              {t("designGuide.popover.heartbeatDetail", { defaultValue: "Last run succeeded 24s ago. Next timer run in 9m." })}
            </p>
            <Button size="xs">{t("designGuide.popover.wakeNow", { defaultValue: "Wake now" })}</Button>
          </PopoverContent>
        </Popover>
      </Section>

      {/* ============================================================ */}
      {/*  COLLAPSIBLE                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.collapsible.title", { defaultValue: "Collapsible" })}>
        <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="space-y-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {collapsibleOpen
                ? t("designGuide.collapsible.hideFilters", { defaultValue: "Hide advanced filters" })
                : t("designGuide.collapsible.showFilters", { defaultValue: "Show advanced filters" })}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="rounded-md border border-border p-3">
            <div className="space-y-2">
              <Label htmlFor="owner-filter">{t("designGuide.collapsible.owner", { defaultValue: "Owner" })}</Label>
              <Input id="owner-filter" placeholder={t("designGuide.collapsible.filterPlaceholder", { defaultValue: "Filter by agent name" })} />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </Section>

      {/* ============================================================ */}
      {/*  SHEET                                                        */}
      {/* ============================================================ */}
      <Section title={t("designGuide.sheet.title", { defaultValue: "Sheet" })}>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">{t("designGuide.sheet.openSidePanel", { defaultValue: "Open Side Panel" })}</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>{t("designGuide.sheet.issueProperties", { defaultValue: "Issue Properties" })}</SheetTitle>
              <SheetDescription>{t("designGuide.sheet.description", { defaultValue: "Edit metadata without leaving the current page." })}</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 px-4">
              <div className="space-y-1">
                <Label htmlFor="sheet-title">{t("designGuide.sheet.titleLabel", { defaultValue: "Title" })}</Label>
                <Input id="sheet-title" defaultValue={t("designGuide.sheet.titleValue", { defaultValue: "Improve onboarding docs" })} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sheet-description">{t("designGuide.sheet.descriptionLabel", { defaultValue: "Description" })}</Label>
                <Textarea id="sheet-description" defaultValue={t("designGuide.sheet.descriptionValue", { defaultValue: "Capture setup pitfalls and screenshots." })} />
              </div>
            </div>
            <SheetFooter>
              <Button variant="outline">{t("designGuide.sheet.cancel", { defaultValue: "Cancel" })}</Button>
              <Button>{t("designGuide.sheet.save", { defaultValue: "Save" })}</Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </Section>

      {/* ============================================================ */}
      {/*  SCROLL AREA                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.scrollArea.title", { defaultValue: "Scroll Area" })}>
        <ScrollArea className="h-36 rounded-md border border-border">
          <div className="space-y-2 p-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-md border border-border p-2 text-sm">
                {t("designGuide.scrollArea.heartbeatRun", { defaultValue: "Heartbeat run #{{n}}: completed successfully", n: i + 1 })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </Section>

      {/* ============================================================ */}
      {/*  COMMAND                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.command.title", { defaultValue: "Command (CMDK)" })}>
        <div className="rounded-md border border-border">
          <Command>
            <CommandInput placeholder={t("designGuide.command.inputPlaceholder", { defaultValue: "Type a command or search..." })} />
            <CommandList>
              <CommandEmpty>{t("designGuide.command.noResults", { defaultValue: "No results found." })}</CommandEmpty>
              <CommandGroup heading={t("designGuide.command.pages", { defaultValue: "Pages" })}>
                <CommandItem>
                  <LayoutDashboard className="h-4 w-4" />
                  {t("designGuide.command.dashboard", { defaultValue: "Dashboard" })}
                </CommandItem>
                <CommandItem>
                  <CircleDot className="h-4 w-4" />
                  {t("designGuide.command.issues", { defaultValue: "Issues" })}
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading={t("designGuide.command.actions", { defaultValue: "Actions" })}>
                <CommandItem>
                  <CommandIcon className="h-4 w-4" />
                  {t("designGuide.command.openCommandPalette", { defaultValue: "Open command palette" })}
                </CommandItem>
                <CommandItem>
                  <Plus className="h-4 w-4" />
                  {t("designGuide.command.createNewIssue", { defaultValue: "Create new issue" })}
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  BREADCRUMB                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.breadcrumb.title", { defaultValue: "Breadcrumb" })}>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{t("designGuide.breadcrumb.projects", { defaultValue: "Projects" })}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="#">{t("designGuide.breadcrumb.paperclipApp", { defaultValue: "Paperclip App" })}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t("designGuide.breadcrumb.issueList", { defaultValue: "Issue List" })}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </Section>

      {/* ============================================================ */}
      {/*  CARDS                                                        */}
      {/* ============================================================ */}
      <Section title={t("designGuide.cards.title", { defaultValue: "Cards" })}>
        <SubSection title={t("designGuide.cards.standardCard", { defaultValue: "Standard Card" })}>
          <Card>
            <CardHeader>
              <CardTitle>{t("designGuide.cards.cardTitle", { defaultValue: "Card Title" })}</CardTitle>
              <CardDescription>{t("designGuide.cards.cardDescription", { defaultValue: "Card description with supporting text." })}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{t("designGuide.cards.cardContent", { defaultValue: "Card content goes here. This is the main body area." })}</p>
            </CardContent>
            <CardFooter className="gap-2">
              <Button size="sm">{t("designGuide.cards.action", { defaultValue: "Action" })}</Button>
              <Button variant="outline" size="sm">{t("designGuide.cards.cancel", { defaultValue: "Cancel" })}</Button>
            </CardFooter>
          </Card>
        </SubSection>

        <SubSection title={t("designGuide.cards.metricCards", { defaultValue: "Metric Cards" })}>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard icon={Bot} value={12} label={t("designGuide.cards.activeAgents", { defaultValue: "Active Agents" })} description={t("designGuide.cards.plus3ThisWeek", { defaultValue: "+3 this week" })} />
            <MetricCard icon={CircleDot} value={48} label={t("designGuide.cards.openIssues", { defaultValue: "Open Issues" })} />
            <MetricCard icon={DollarSign} value="$1,234" label={t("designGuide.cards.monthlyCost", { defaultValue: "Monthly Cost" })} description={t("designGuide.cards.underBudget", { defaultValue: "Under budget" })} />
            <MetricCard icon={Zap} value="99.9%" label={t("designGuide.cards.uptime", { defaultValue: "Uptime" })} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TABS                                                         */}
      {/* ============================================================ */}
      <Section title={t("designGuide.tabs.title", { defaultValue: "Tabs" })}>
        <SubSection title={t("designGuide.tabs.defaultVariant", { defaultValue: "Default (pill) variant" })}>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">{t("designGuide.tabs.overview", { defaultValue: "Overview" })}</TabsTrigger>
              <TabsTrigger value="runs">{t("designGuide.tabs.runs", { defaultValue: "Runs" })}</TabsTrigger>
              <TabsTrigger value="config">{t("designGuide.tabs.config", { defaultValue: "Config" })}</TabsTrigger>
              <TabsTrigger value="costs">{t("designGuide.tabs.costs", { defaultValue: "Costs" })}</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.overviewContent", { defaultValue: "Overview tab content." })}</p>
            </TabsContent>
            <TabsContent value="runs">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.runsContent", { defaultValue: "Runs tab content." })}</p>
            </TabsContent>
            <TabsContent value="config">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.configContent", { defaultValue: "Config tab content." })}</p>
            </TabsContent>
            <TabsContent value="costs">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.costsContent", { defaultValue: "Costs tab content." })}</p>
            </TabsContent>
          </Tabs>
        </SubSection>

        <SubSection title={t("designGuide.tabs.lineVariant", { defaultValue: "Line variant" })}>
          <Tabs defaultValue="summary">
            <TabsList variant="line">
              <TabsTrigger value="summary">{t("designGuide.tabs.summary", { defaultValue: "Summary" })}</TabsTrigger>
              <TabsTrigger value="details">{t("designGuide.tabs.details", { defaultValue: "Details" })}</TabsTrigger>
              <TabsTrigger value="comments">{t("designGuide.tabs.comments", { defaultValue: "Comments" })}</TabsTrigger>
            </TabsList>
            <TabsContent value="summary">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.summaryContent", { defaultValue: "Summary content with underline tabs." })}</p>
            </TabsContent>
            <TabsContent value="details">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.detailsContent", { defaultValue: "Details content." })}</p>
            </TabsContent>
            <TabsContent value="comments">
              <p className="text-sm text-muted-foreground py-4">{t("designGuide.tabs.commentsContent", { defaultValue: "Comments content." })}</p>
            </TabsContent>
          </Tabs>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  ENTITY ROWS                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.entityRows.title", { defaultValue: "Entity Rows" })}>
        <div className="border border-border rounded-md">
          <EntityRow
            leading={
              <>
                <StatusIcon status="in_progress" />
                <PriorityIcon priority="high" />
              </>
            }
            identifier="PAP-001"
            title={t("designGuide.entityRows.row1Title", { defaultValue: "Implement authentication flow" })}
            subtitle={t("designGuide.entityRows.row1Subtitle", { defaultValue: "Responsible: Agent Alpha" })}
            trailing={<IssueStatusBadge status="in_progress" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="done" />
                <PriorityIcon priority="medium" />
              </>
            }
            identifier="PAP-002"
            title={t("designGuide.entityRows.row2Title", { defaultValue: "Set up CI/CD pipeline" })}
            subtitle={t("designGuide.entityRows.row2Subtitle", { defaultValue: "Completed 2 days ago" })}
            trailing={<IssueStatusBadge status="done" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="todo" />
                <PriorityIcon priority="low" />
              </>
            }
            identifier="PAP-003"
            title={t("designGuide.entityRows.row3Title", { defaultValue: "Write API documentation" })}
            trailing={<IssueStatusBadge status="todo" />}
            onClick={() => {}}
          />
          <EntityRow
            leading={
              <>
                <StatusIcon status="blocked" />
                <PriorityIcon priority="critical" />
              </>
            }
            identifier="PAP-004"
            title={t("designGuide.entityRows.row4Title", { defaultValue: "Deploy to production" })}
            subtitle={t("designGuide.entityRows.row4Subtitle", { defaultValue: "Blocked by PAP-001" })}
            trailing={<IssueStatusBadge status="blocked" />}
            selected
          />
        </div>
        <SubSection title={t("designGuide.entityRows.membershipAction", { defaultValue: "Membership action" })}>
          <div className="border border-border rounded-md">
            <EntityRow
              title={t("designGuide.entityRows.joinedResource", { defaultValue: "Joined resource" })}
              subtitle={t("designGuide.entityRows.joinedSubtitle", { defaultValue: "Hover or focus the row to reveal the reserved action slot." })}
              className="group"
              trailing={
                <MembershipAction
                  state="joined"
                  resourceName={t("designGuide.entityRows.joinedResource", { defaultValue: "Joined resource" })}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={t("designGuide.entityRows.leftResource", { defaultValue: "Left resource" })}
              subtitle={t("designGuide.entityRows.leftSubtitle", { defaultValue: "Persistent action with dimmed row content." })}
              className="group text-foreground/55"
              trailing={
                <MembershipAction
                  state="left"
                  resourceName={t("designGuide.entityRows.leftResource", { defaultValue: "Left resource" })}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={t("designGuide.entityRows.leavingResource", { defaultValue: "Leaving resource" })}
              subtitle={t("designGuide.entityRows.leavingSubtitle", { defaultValue: "Disabled while the optimistic mutation is pending." })}
              className="group text-foreground/55"
              trailing={
                <MembershipAction
                  state="left"
                  pending
                  pendingState="left"
                  resourceName={t("designGuide.entityRows.leavingResource", { defaultValue: "Leaving resource" })}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
            <EntityRow
              title={t("designGuide.entityRows.joiningResource", { defaultValue: "Joining resource" })}
              subtitle={t("designGuide.entityRows.joiningSubtitle", { defaultValue: "The target state is visible immediately while the server confirms." })}
              className="group"
              trailing={
                <MembershipAction
                  state="joined"
                  pending
                  pendingState="joined"
                  resourceName={t("designGuide.entityRows.joiningResource", { defaultValue: "Joining resource" })}
                  onJoin={() => {}}
                  onLeave={() => {}}
                />
              }
            />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  FILTER BAR                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.filterBar.title", { defaultValue: "Filter Bar" })}>
        <FilterBar
          filters={filters}
          onRemove={(key) => setFilters((f) => f.filter((x) => x.key !== key))}
          onClear={() => setFilters([])}
        />
        {filters.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFilters([
                { key: "status", label: t("designGuide.filterBar.statusLabel", { defaultValue: "Status" }), value: t("designGuide.filterBar.activeValue", { defaultValue: "Active" }) },
                { key: "priority", label: t("designGuide.filterBar.priorityLabel", { defaultValue: "Priority" }), value: t("designGuide.filterBar.highValue", { defaultValue: "High" }) },
              ])
            }
          >
            {t("designGuide.filterBar.resetFilters", { defaultValue: "Reset filters" })}
          </Button>
        )}
      </Section>

      {/* ============================================================ */}
      {/*  AVATARS                                                      */}
      {/* ============================================================ */}
      <Section title={t("designGuide.avatars.title", { defaultValue: "Avatars" })}>
        <SubSection title={t("designGuide.avatars.sizes", { defaultValue: "Sizes" })}>
          <div className="flex items-center gap-3">
            <Avatar size="sm"><AvatarFallback>SM</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>DF</AvatarFallback></Avatar>
            <Avatar size="lg"><AvatarFallback>LG</AvatarFallback></Avatar>
          </div>
        </SubSection>

        <SubSection title={t("designGuide.avatars.group", { defaultValue: "Group" })}>
          <AvatarGroup>
            <Avatar><AvatarFallback>A1</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A2</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>A3</AvatarFallback></Avatar>
            <AvatarGroupCount>+5</AvatarGroupCount>
          </AvatarGroup>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  IDENTITY                                                     */}
      {/* ============================================================ */}
      <Section title={t("designGuide.identity.title", { defaultValue: "Identity" })}>
        <SubSection title={t("designGuide.identity.sizes", { defaultValue: "Sizes" })}>
          <div className="flex items-center gap-6">
            <Identity name="Agent Alpha" size="sm" />
            <Identity name="Agent Alpha" />
            <Identity name="Agent Alpha" size="lg" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.identity.initialsDerivation", { defaultValue: "Initials derivation" })}>
          <div className="flex flex-col gap-2">
            <Identity name="CEO Agent" size="sm" />
            <Identity name="Alpha" size="sm" />
            <Identity name="Quality Assurance Lead" size="sm" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.identity.customInitials", { defaultValue: "Custom initials" })}>
          <Identity name="Backend Service" initials="BS" size="sm" />
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLTIPS                                                     */}
      {/* ============================================================ */}
      <Section title={t("designGuide.tooltips.title", { defaultValue: "Tooltips" })}>
        <div className="flex items-center gap-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">{t("designGuide.tooltips.hoverMe", { defaultValue: "Hover me" })}</Button>
            </TooltipTrigger>
            <TooltipContent>{t("designGuide.tooltips.tooltipText", { defaultValue: "This is a tooltip" })}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm"><Settings /></Button>
            </TooltipTrigger>
            <TooltipContent>{t("designGuide.tooltips.settings", { defaultValue: "Settings" })}</TooltipContent>
          </Tooltip>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  DIALOG                                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.dialog.title", { defaultValue: "Dialog" })}>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">{t("designGuide.dialog.open", { defaultValue: "Open Dialog" })}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("designGuide.dialog.dialogTitle", { defaultValue: "Dialog Title" })}</DialogTitle>
              <DialogDescription>
                {t("designGuide.dialog.dialogDescription", { defaultValue: "This is a sample dialog showing the standard layout with header, content, and footer." })}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>{t("designGuide.dialog.name", { defaultValue: "Name" })}</Label>
                <Input placeholder={t("designGuide.dialog.namePlaceholder", { defaultValue: "Enter a name" })} className="mt-1.5" />
              </div>
              <div>
                <Label>{t("designGuide.dialog.descriptionLabel", { defaultValue: "Description" })}</Label>
                <Textarea placeholder={t("designGuide.dialog.describePlaceholder", { defaultValue: "Describe..." })} className="mt-1.5" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline">{t("designGuide.dialog.cancel", { defaultValue: "Cancel" })}</Button>
              <Button>{t("designGuide.dialog.save", { defaultValue: "Save" })}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      {/* ============================================================ */}
      {/*  EMPTY STATE                                                  */}
      {/* ============================================================ */}
      <Section title={t("designGuide.emptyState.title", { defaultValue: "Empty State" })}>
        <div className="border border-border rounded-md">
          <EmptyState
            icon={Inbox}
            message={t("designGuide.emptyState.message", { defaultValue: "No items to show. Create your first one to get started." })}
            action={t("designGuide.emptyState.action", { defaultValue: "Create Item" })}
            onAction={() => {}}
          />
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROGRESS BARS                                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.progress.title", { defaultValue: "Progress Bars (Budget)" })}>
        <div className="space-y-3">
          {[
            { label: t("designGuide.progress.underBudget", { defaultValue: "Under budget (40%)" }), pct: 40, color: "bg-green-400" },
            { label: t("designGuide.progress.warning", { defaultValue: "Warning (75%)" }), pct: 75, color: "bg-yellow-400" },
            { label: t("designGuide.progress.overBudget", { defaultValue: "Over budget (95%)" }), pct: 95, color: "bg-red-400" },
          ].map(({ label, pct, color }) => (
            <div key={label} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-mono">{pct}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-(--tp-width-background-color) duration-150 ${color}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  LOG VIEWER                                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.logViewer.title", { defaultValue: "Log Viewer" })}>
        <div className="bg-neutral-950 rounded-lg p-3 font-mono text-xs max-h-80 overflow-y-auto">
          <div className="text-foreground">[12:00:01] INFO  Agent started successfully</div>
          <div className="text-foreground">[12:00:02] INFO  Processing task PAP-001</div>
          <div className="text-yellow-400">[12:00:05] WARN  Rate limit approaching (80%)</div>
          <div className="text-foreground">[12:00:08] INFO  Task PAP-001 completed</div>
          <div className="text-red-400">[12:00:12] ERROR Connection timeout to upstream service</div>
          <div className="text-blue-300">[12:00:12] SYS   Retrying connection in 5s...</div>
          <div className="text-foreground">[12:00:17] INFO  Reconnected successfully</div>
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-blue-400 animate-pulse" />
              <span className="inline-flex h-full w-full rounded-full bg-blue-500" />
            </span>
            <span className="text-blue-600 dark:text-blue-400">{t("designGuide.logViewer.live", { defaultValue: "Live" })}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  PROPERTY ROW PATTERN                                         */}
      {/* ============================================================ */}
      <Section title={t("designGuide.propertyRow.title", { defaultValue: "Property Row Pattern" })}>
        <div className="border border-border rounded-md p-4 space-y-1 max-w-sm">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.propertyRow.status", { defaultValue: "Status" })}</span>
            <StatusBadge status="active" />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.propertyRow.priority", { defaultValue: "Priority" })}</span>
            <PriorityIcon priority="high" />
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.propertyRow.responsible", { defaultValue: "Responsible" })}</span>
            <div className="flex items-center gap-1.5">
              <Avatar size="sm"><AvatarFallback>A</AvatarFallback></Avatar>
              <span className="text-xs">Agent Alpha</span>
            </div>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-xs text-muted-foreground">{t("designGuide.propertyRow.created", { defaultValue: "Created" })}</span>
            <span className="text-xs">Jan 15, 2025</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  NAVIGATION PATTERNS                                          */}
      {/* ============================================================ */}
      <Section title={t("designGuide.navigation.title", { defaultValue: "Navigation Patterns" })}>
        <SubSection title={t("designGuide.navigation.sidebarNavItems", { defaultValue: "Sidebar nav items" })}>
          <Card className="block w-60 p-3 space-y-0.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium bg-accent text-accent-foreground">
              <LayoutDashboard className="h-4 w-4" />
              {t("designGuide.navigation.dashboard", { defaultValue: "Dashboard" })}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <CircleDot className="h-4 w-4" />
              {t("designGuide.navigation.issues", { defaultValue: "Issues" })}
              <Badge variant="ghost" className="ml-auto bg-primary text-primary-foreground px-1.5">
                12
              </Badge>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Bot className="h-4 w-4" />
              {t("designGuide.navigation.agents", { defaultValue: "Agents" })}
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground cursor-pointer">
              <Hexagon className="h-4 w-4" />
              {t("designGuide.navigation.projects", { defaultValue: "Projects" })}
            </div>
          </Card>
        </SubSection>

        <SubSection title={t("designGuide.navigation.viewToggle", { defaultValue: "View toggle" })}>
          <div className="flex items-center border border-border rounded-md w-fit">
            <button className="px-3 py-1.5 text-xs font-medium bg-accent text-foreground rounded-l-md">
              <ListTodo className="h-3.5 w-3.5 inline mr-1" />
              {t("designGuide.navigation.list", { defaultValue: "List" })}
            </button>
            <button className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent/50 rounded-r-md">
              <Target className="h-3.5 w-3.5 inline mr-1" />
              {t("designGuide.navigation.org", { defaultValue: "Org" })}
            </button>
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  GROUPED LIST (Issues pattern)                                */}
      {/* ============================================================ */}
      <Section title={t("designGuide.groupedList.title", { defaultValue: "Grouped List (Issues pattern)" })}>
        <div>
          <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-t-md">
            <StatusIcon status="in_progress" />
            <span className="text-sm font-medium">{t("designGuide.groupedList.inProgress", { defaultValue: "In Progress" })}</span>
            <span className="text-xs text-muted-foreground ml-1">2</span>
          </div>
          <div className="border border-border rounded-b-md">
            <EntityRow
              leading={<PriorityIcon priority="high" />}
              identifier="PAP-101"
              title={t("designGuide.groupedList.row1Title", { defaultValue: "Build agent heartbeat system" })}
              onClick={() => {}}
            />
            <EntityRow
              leading={<PriorityIcon priority="medium" />}
              identifier="PAP-102"
              title={t("designGuide.groupedList.row2Title", { defaultValue: "Add cost tracking dashboard" })}
              onClick={() => {}}
            />
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COMMENT THREAD PATTERN                                       */}
      {/* ============================================================ */}
      <Section title={t("designGuide.commentThread.title", { defaultValue: "Comment Thread Pattern" })}>
        <div className="space-y-3 max-w-2xl">
          <h3 className="text-sm font-semibold">{t("designGuide.commentThread.commentsCount", { defaultValue: "Comments (2)" })}</h3>
          <div className="space-y-3">
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{t("designGuide.commentThread.agent", { defaultValue: "Agent" })}</span>
                <span className="text-xs text-muted-foreground">Jan 15, 2025</span>
              </div>
              <p className="text-sm">{t("designGuide.commentThread.comment1", { defaultValue: "Started working on the authentication module. Will need API keys configured." })}</p>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-muted-foreground">{t("designGuide.commentThread.human", { defaultValue: "Human" })}</span>
                <span className="text-xs text-muted-foreground">Jan 16, 2025</span>
              </div>
              <p className="text-sm">{t("designGuide.commentThread.comment2", { defaultValue: "API keys have been added to the vault. Please proceed." })}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Textarea placeholder={t("designGuide.commentThread.placeholder", { defaultValue: "Leave a comment..." })} rows={3} />
            <Button size="sm">{t("designGuide.commentThread.comment", { defaultValue: "Comment" })}</Button>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  COST TABLE PATTERN                                           */}
      {/* ============================================================ */}
      <Section title={t("designGuide.costTable.title", { defaultValue: "Cost Table Pattern" })}>
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead className="border-b border-border bg-accent/20">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("designGuide.costTable.model", { defaultValue: "Model" })}</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("designGuide.costTable.tokens", { defaultValue: "Tokens" })}</th>
                <th className="text-left px-3 py-2 font-medium text-muted-foreground">{t("designGuide.costTable.cost", { defaultValue: "Cost" })}</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-sonnet-4-20250514</td>
                <td className="px-3 py-2 font-mono">1.2M</td>
                <td className="px-3 py-2 font-mono">$18.00</td>
              </tr>
              <tr className="border-b border-border">
                <td className="px-3 py-2">claude-haiku-4-20250506</td>
                <td className="px-3 py-2 font-mono">500k</td>
                <td className="px-3 py-2 font-mono">$1.25</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium">{t("designGuide.costTable.total", { defaultValue: "Total" })}</td>
                <td className="px-3 py-2 font-mono">1.7M</td>
                <td className="px-3 py-2 font-mono font-medium">$19.25</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  SKELETONS                                                    */}
      {/* ============================================================ */}
      <Section title={t("designGuide.skeletons.title", { defaultValue: "Skeletons" })}>
        <SubSection title={t("designGuide.skeletons.individual", { defaultValue: "Individual" })}>
          <div className="space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-20 w-full" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.skeletons.pageList", { defaultValue: "Page Skeleton (list)" })}>
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="list" />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.skeletons.pageDetail", { defaultValue: "Page Skeleton (detail)" })}>
          <div className="border border-border rounded-md p-4">
            <PageSkeleton variant="detail" />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  SEPARATOR                                                    */}
      {/* ============================================================ */}
      <Section title={t("designGuide.separator.title", { defaultValue: "Separator" })}>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">{t("designGuide.separator.horizontal", { defaultValue: "Horizontal" })}</p>
          <Separator />
          <div className="flex items-center gap-4 h-8">
            <span className="text-sm">{t("designGuide.separator.left", { defaultValue: "Left" })}</span>
            <Separator orientation="vertical" />
            <span className="text-sm">{t("designGuide.separator.right", { defaultValue: "Right" })}</span>
          </div>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  ICON REFERENCE                                               */}
      {/* ============================================================ */}
      {/*  TEAM CATALOG                                                 */}
      {/* ============================================================ */}
      <Section title={t("designGuide.teamCatalog.title", { defaultValue: "Team Catalog" })}>
        <p className="text-sm text-muted-foreground">
          {t("designGuide.teamCatalog.desc1", { defaultValue: "Components from the Team Catalog browse/install surface (" })}<code className="font-mono text-xs">/teams-catalog</code>{t("designGuide.teamCatalog.desc2", { defaultValue: "). Fixtures are shared with the Storybook stories." })}
        </p>

        <SubSection title={t("designGuide.teamCatalog.teamRow", { defaultValue: "TeamRow (browse list)" })}>
          <div className="w-(--sz-28rem) rounded-md border border-border">
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">
              {t("designGuide.teamCatalog.bundled", { defaultValue: "Bundled · 1" })}
            </div>
            <TeamRow team={sampleTeam} selected onSelect={() => {}} />
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">
              {t("designGuide.teamCatalog.optional", { defaultValue: "Optional · 2" })}
            </div>
            <TeamRow team={optionalTeam} selected={false} onSelect={() => {}} />
            <div className="px-3 py-2 text-(length:--text-micro) font-semibold uppercase tracking-wide text-muted-foreground">
              {t("designGuide.teamCatalog.installed", { defaultValue: "Installed · 2" })}
            </div>
            <TeamRow team={sampleTeam} selected={false} onSelect={() => {}} installed={outOfDateInstalledState} />
            <TeamRow team={warnTeam} selected={false} onSelect={() => {}} installed={currentInstalledState} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.teamCatalog.teamRowDesc1", { defaultValue: "Installed teams collapse under" })}{" "}
            <code className="font-mono">INSTALLED · N</code>{t("designGuide.teamCatalog.teamRowDesc2", { defaultValue: "; an out-of-date install (server" })}{" "}
            <code className="font-mono">originHash</code> {t("designGuide.teamCatalog.teamRowDesc3", { defaultValue: "≠ catalog" })} <code className="font-mono">contentHash</code>{t("designGuide.teamCatalog.teamRowDesc4", { defaultValue: ") shows the amber" })}{" "}
            <code className="font-mono">↑</code> {t("designGuide.teamCatalog.teamRowDesc5", { defaultValue: "badge (PAP-10256)." })}
          </p>
        </SubSection>

        <SubSection title={t("designGuide.teamCatalog.teamCard", { defaultValue: "TeamCard (onboarding grid)" })}>
          <p className="text-xs text-muted-foreground">
            {t("designGuide.teamCatalog.teamCardDesc1", { defaultValue: "Square tile for the onboarding “Pick a starter team” grid. Selected tile gets" })}{" "}
            <code className="font-mono">ring-2 ring-ring</code>{t("designGuide.teamCatalog.teamCardDesc2", { defaultValue: ". Drives the" })}{" "}
            <code className="font-mono">useInstallTeamCatalogEntry</code> {t("designGuide.teamCatalog.teamCardDesc3", { defaultValue: "simplified flow." })}
          </p>
          <TeamCardShowcase />
        </SubSection>

        <SubSection title="TeamHierarchyPreview">
          <div className="max-w-md">
            <TeamHierarchyPreview team={sampleTeam} />
          </div>
        </SubSection>

        <SubSection title="RequiredSkillsList">
          <div className="max-w-xl">
            <RequiredSkillsList skills={sampleTeam.requiredSkills} />
          </div>
        </SubSection>

        <SubSection title="EnvInputsList">
          <div className="max-w-xl">
            <EnvInputsList inputs={sampleTeam.envInputs} />
          </div>
        </SubSection>

        <SubSection title="ExternalSourcesList">
          <div className="max-w-xl">
            <ExternalSourcesList sources={sampleTeam.sourceRefs} />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.teamCatalog.sourcePolicyStep", { defaultValue: "Source policy step (StepSourcePolicy)" })}>
          <div className="max-w-xl rounded-md border border-border p-4">
            <StepSourcePolicy
              team={warnTeam}
              allowExternalSources={allowExternal}
              allowUnpinnedOptionalSources={allowUnpinned}
              allowLocalPathSources={allowLocalPath}
              onChange={(key, value) => {
                if (key === "external") setAllowExternal(value);
                if (key === "unpinned") setAllowUnpinned(value);
                if (key === "localPath") setAllowLocalPath(value);
              }}
            />
          </div>
        </SubSection>

        <SubSection title={t("designGuide.teamCatalog.skillPlanStep", { defaultValue: "Skill plan step (StepSkillPlan)" })}>
          <div className="max-w-xl rounded-md border border-border p-4">
            <StepSkillPlan team={sampleTeam} preparations={sampleSkillPreparations} />
          </div>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      <Section title={t("designGuide.icons.title", { defaultValue: "Common Icons (Lucide)" })}>
        <div className="grid grid-cols-4 md:grid-cols-6 gap-4">
          {[
            ["Inbox", Inbox],
            ["ListTodo", ListTodo],
            ["CircleDot", CircleDot],
            ["Hexagon", Hexagon],
            ["Target", Target],
            ["LayoutDashboard", LayoutDashboard],
            ["Bot", Bot],
            ["DollarSign", DollarSign],
            ["History", History],
            ["Search", Search],
            ["Plus", Plus],
            ["Trash2", Trash2],
            ["Settings", Settings],
            ["User", User],
            ["Mail", Mail],
            ["Upload", Upload],
            ["Zap", Zap],
          ].map(([name, Icon]) => {
            const LucideIcon = Icon as React.FC<{ className?: string }>;
            return (
              <div key={name as string} className="flex flex-col items-center gap-1.5 p-2">
                <LucideIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-(length:--text-nano) text-muted-foreground font-mono">{name as string}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  KEYBOARD SHORTCUTS                                           */}
      {/* ============================================================ */}
      <Section title={t("designGuide.keyboardShortcuts.title", { defaultValue: "Keyboard Shortcuts" })}>
        <div className="border border-border rounded-md divide-y divide-border text-sm">
          {[
            ["Cmd+K / Ctrl+K", t("designGuide.keyboardShortcuts.openCommandPalette", { defaultValue: "Open Command Palette" })],
            ["C", t("designGuide.keyboardShortcuts.newIssue", { defaultValue: "New Issue (outside inputs)" })],
            ["[", t("designGuide.keyboardShortcuts.toggleSidebar", { defaultValue: "Toggle Sidebar" })],
            ["]", t("designGuide.keyboardShortcuts.togglePropertiesPanel", { defaultValue: "Toggle Properties Panel" })],

            ["Cmd+Enter / Ctrl+Enter", t("designGuide.keyboardShortcuts.submitComment", { defaultValue: "Submit markdown comment" })],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between px-4 py-2">
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="px-2 py-0.5 text-xs font-mono bg-muted rounded border border-border">
                {key}
              </kbd>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("designGuide.issueOutput.title", { defaultValue: "Issue Output Surface" })}>
        <SubSection title={t("designGuide.issueOutput.multipleOutputs", { defaultValue: "Multiple outputs (primary video + 'Also produced')" })}>
          <IssueOutputSection workProducts={DESIGN_GUIDE_OUTPUTS} />
        </SubSection>
        <SubSection title={t("designGuide.issueOutput.degradedOutput", { defaultValue: "Degraded output (invalid / failed attachment metadata)" })}>
          <IssueOutputSection workProducts={DESIGN_GUIDE_DEGRADED_OUTPUTS} />
        </SubSection>
        <SubSection title={t("designGuide.issueOutput.emptyState", { defaultValue: "Empty state" })}>
          <p className="text-xs text-muted-foreground">
            {t("designGuide.issueOutput.emptyDescription", { defaultValue: "When an issue has produced no artifact work products, the Output section renders nothing at all (no placeholder card)." })}
          </p>
        </SubSection>
      </Section>

      {/* ============================================================ */}
      {/*  TOOLS & ACCESS (PAP-10389)                                   */}
      {/* ============================================================ */}
      <Section title={t("designGuide.toolsAccess.title", { defaultValue: "Tools & Access" })}>
        <SubSection title={t("designGuide.toolsAccess.enforcementDefault", { defaultValue: "EnforcementBanner — default / denied-detected" })}>
          <div className="space-y-3">
            <EnforcementBanner companyId="" forceVariant="default" recentDenialCount={0} />
            <EnforcementBanner companyId="" forceVariant="denied-detected" recentDenialCount={3} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.toolsAccess.enforcementDefaultDesc1", { defaultValue: "Persistent at the top of the Tools & Access surface. Tints to" })} <code>denied-detected</code> {t("designGuide.toolsAccess.enforcementDefaultDesc2", { defaultValue: "when governed tool calls were denied or failed in the last hour. Observability only — enforcement lives in the tool gateway." })}
          </p>
        </SubSection>

        <SubSection title={t("designGuide.toolsAccess.enforcementTones", { defaultValue: "EnforcementBanner — presentational tones (info / warning / error)" })}>
          <div className="space-y-3">
            <EnforcementBanner
              tone="info"
              title={t("designGuide.toolsAccess.effectiveAccessTitle", { defaultValue: "Effective access — server resolved." })}
              body={t("designGuide.toolsAccess.effectiveAccessBody", { defaultValue: "This is exactly what the tool gateway will accept. Profile and policy edits reflect within ~5s; the prompt cannot expand it." })}
            />
            <EnforcementBanner
              tone="warning"
              title={t("designGuide.toolsAccess.localStdioTitle", { defaultValue: "Local stdio is local code execution, not a security sandbox." })}
              body={t("designGuide.toolsAccess.localStdioBody", { defaultValue: "A local-stdio slot runs with the orchestrator's privileges. Only bind trusted commands; quarantine anything you would not run yourself." })}
            />
            <EnforcementBanner
              tone="error"
              title={t("designGuide.toolsAccess.runtimeFailedTitle", { defaultValue: "Runtime failed closed." })}
              body={t("designGuide.toolsAccess.runtimeFailedBody", { defaultValue: "The supervisor is restarting (attempt 2/3). The gateway returns runtime-error and the agent does not see partial output." })}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.toolsAccess.enforcementTonesDesc1", { defaultValue: "Static governance copy with a tone. Used for the PAP-10400 trust-tier banner on Runtime and the effective-access banner on Agent → Tools. Pass" })} <code>title</code>/<code>body</code> {t("designGuide.toolsAccess.enforcementTonesDesc2", { defaultValue: "and an optional" })}{" "}
            <code>icon</code>.
          </p>
        </SubSection>

        <SubSection title={t("designGuide.toolsAccess.actionCardPending", { defaultValue: "Action approval card — pending / stale (surfaces 11/12)" })}>
          <div className="grid gap-4 lg:grid-cols-2">
            <ActionCard
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉", unfurl_links: false }}
              reason={t("designGuide.toolsAccess.actionReason", { defaultValue: "This tool can write to your workspace, so a human signs off before the agent posts." })}
              policyNumber={7}
              expiresInLabel={t("designGuide.toolsAccess.expires23h", { defaultValue: "expires in 23h 51m" })}
            />
            <ActionCard
              variant="stale"
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:7d793037a0760186574b0282f2f435e7a4b1b2b0b822cd15d6c15b0f00a0e3f1",
                previousCatalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉", unfurl_links: false }}
              reason={t("designGuide.toolsAccess.actionReason", { defaultValue: "This tool can write to your workspace, so a human signs off before the agent posts." })}
              policyNumber={7}
              expiresInLabel={t("designGuide.toolsAccess.expires18h", { defaultValue: "expires in 18h 02m" })}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.toolsAccess.actionCardPendingDesc1", { defaultValue: "Signed payload sha256 + expiry surface on every variant (PAP-10400). The" })}{" "}
            <code>stale</code> {t("designGuide.toolsAccess.actionCardPendingDesc2", { defaultValue: "variant tints the border amber, banners the catalog-hash mismatch, strikes through the previous hash next to the current one, and renders" })} <code>Approve</code> {t("designGuide.toolsAccess.actionCardPendingDesc3", { defaultValue: "disabled until the request is re-issued." })}
          </p>
        </SubSection>

        <SubSection title={t("designGuide.toolsAccess.actionCardMobile", { defaultValue: "Action approval card — mobile (390×844, surface 99)" })}>
          <div className="w-(--sz-390px) max-w-full rounded-xl border border-border bg-background p-3">
            <ActionCardMobile
              toolName="slack.post_message"
              risk="medium"
              isWrite
              binding={{
                application: "Slack",
                manifestVersion: "2.4.1",
                connection: "https://slack.com/api · acme-workspace",
                catalogSha256: "sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
                payloadSha256: "sha256:2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae",
              }}
              input={{ channel: "#launch", text: "Deploy v2 is live 🎉" }}
              reason={t("designGuide.toolsAccess.actionReason", { defaultValue: "This tool can write to your workspace, so a human signs off before the agent posts." })}
              policyNumber={7}
              expiresInLabel={t("designGuide.toolsAccess.expires23h", { defaultValue: "expires in 23h 51m" })}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.toolsAccess.actionCardMobileDesc", { defaultValue: "Identical content; the three buttons stack full-width in the order Approve / Deny / Edit & re-sign, and the bindings table uses a 70px label column." })}
          </p>
        </SubSection>

        <SubSection title={t("designGuide.toolsAccess.bindingsTable", { defaultValue: "BindingsTable (reused in the audit row drilldown)" })}>
          <BindingsTable
            rows={[
              { label: t("designGuide.toolsAccess.bindingApplication", { defaultValue: "Application" }), value: "Slack · manifest v2.4.1" },
              { label: t("designGuide.toolsAccess.bindingConnection", { defaultValue: "Connection" }), value: "https://slack.com/api · acme-workspace", mono: true },
              { label: t("designGuide.toolsAccess.bindingCatalog", { defaultValue: "Catalog" }), value: "sha256:9f86d081…f00a08", mono: true },
              { label: t("designGuide.toolsAccess.bindingPayload", { defaultValue: "Payload" }), value: "sha256:2c26b46b…66e7ae", mono: true },
            ]}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.toolsAccess.bindingsTableDesc1", { defaultValue: "Two-column key/value block with mono values. Lives inside" })} <code>ActionCard</code> {t("designGuide.toolsAccess.bindingsTableDesc2", { defaultValue: "and is reused standalone in the audit row drilldown." })}
          </p>
        </SubSection>

        <SubSection title={t("designGuide.toolsAccess.statusKeys", { defaultValue: "Tool-access status keys (StatusBadge)" })}>
          <div className="flex flex-wrap items-center gap-2">
            {[
              "allowed", "denied", "block", "require-approval", "redacted", "rate-limit",
              "deferred", "hidden", "quarantined", "healthy", "degraded", "runtime-error", "unchecked",
            ].map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("designGuide.toolsAccess.statusKeysDesc1", { defaultValue: "Policy decisions, connection/runtime health, and catalog quarantine all route through the canonical" })}{" "}
            <code>StatusBadge</code> {t("designGuide.toolsAccess.statusKeysDesc2", { defaultValue: "keys defined in" })} <code>lib/status-colors</code>.
          </p>
        </SubSection>

        <SubSection title={t("designGuide.toolsAccess.emptyStateCanonical", { defaultValue: "EmptyState (canonical, with description + action)" })}>
          <EmptyState
            icon={Inbox}
            message={t("designGuide.toolsAccess.noConnections", { defaultValue: "No connections yet" })}
            description={t("designGuide.toolsAccess.noConnectionsDesc", { defaultValue: "Add a connection to an application to configure credentials and discover its tools." })}
            action={t("designGuide.toolsAccess.newConnection", { defaultValue: "New connection" })}
            onAction={() => {}}
          />
        </SubSection>
      </Section>

      <Section title={t("designGuide.envVars.title", { defaultValue: "Environment Variables Editor" })}>
        <p className="text-sm text-muted-foreground">
          {t("designGuide.envVars.desc1", { defaultValue: "Reusable env-var editor (agents, projects, environments, routines). One shared grid, an in-field Text/Secret source switch, a fuzzy secret picker with a pinned “Create secret” item, automatic sensitive-value detection, and inline secret-health warnings. See the Storybook" })}{" "}
          <span className="font-mono">Product/Environment Variables Editor</span>{" "}
          {t("designGuide.envVars.desc2", { defaultValue: "stories for all 10 states." })}
        </p>
        <EnvironmentVariablesEditorShowcase />
      </Section>

      <Section title={t("designGuide.resizablePanels.title", { defaultValue: "Resizable Panels" })}>
        <p className="text-sm text-muted-foreground">
          {t("designGuide.resizablePanels.desc1", { defaultValue: "Design-system wrapper over" })}{" "}
          <span className="font-mono">react-resizable-panels</span>{" "}
          {t("designGuide.resizablePanels.desc2", { defaultValue: "(Skill Studio D2). Drag a handle to resize; panels accept percentage or pixel (" })}<span className="font-mono">minSize="240px"</span>{t("designGuide.resizablePanels.desc3", { defaultValue: ") constraints and the middle panel is collapsible. Use anywhere a split view is needed." })}
        </p>
        <div className="h-48 max-w-2xl overflow-hidden rounded-md border border-border">
          <ResizablePanelGroup>
            <ResizablePanel id="a" minSize="120px" className="bg-muted/30">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {t("designGuide.resizablePanels.panelA", { defaultValue: "Panel A" })}
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="b" minSize="120px" collapsible collapsedSize="40px" className="bg-muted/10">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {t("designGuide.resizablePanels.panelB", { defaultValue: "Panel B (collapsible)" })}
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="c" minSize="120px" className="bg-muted/30">
              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                {t("designGuide.resizablePanels.panelC", { defaultValue: "Panel C" })}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </Section>

      {/* ============================================================ */}
      {/*  INLINE BANNER + BUILT-IN AGENTS                              */}
      {/* ============================================================ */}
      <Section title={t("designGuide.inlineBanner.title", { defaultValue: "Inline Banner" })}>
        <p className="text-sm text-muted-foreground">
          {t("designGuide.inlineBanner.desc1", { defaultValue: "Token-backed full-width notice (" })}<span className="font-mono">brandBanner</span> {t("designGuide.inlineBanner.desc2", { defaultValue: "tones). Use" })}{" "}
          <span className="font-mono">info</span> {t("designGuide.inlineBanner.desc3", { defaultValue: "for provenance/context and" })}{" "}
          <span className="font-mono">warning</span> {t("designGuide.inlineBanner.desc4", { defaultValue: "for paused/attention. Supports an optional bold title and a trailing actions slot. Replaces hand-rolled" })}{" "}
          <span className="font-mono">bg-yellow-*</span>/<span className="font-mono">bg-blue-*</span>{" "}
          {t("designGuide.inlineBanner.desc5", { defaultValue: "banners." })}
        </p>
        <div className="space-y-3">
          <InlineBanner
            tone="info"
            title={t("designGuide.inlineBanner.builtInAgentTitle", { defaultValue: "Built-in agent" })}
            actions={<Button variant="outline" size="sm">{t("designGuide.inlineBanner.resetToDefaults", { defaultValue: "Reset to defaults" })}</Button>}
          >
            {t("designGuide.inlineBanner.builtInBody1", { defaultValue: "Ships with Paperclip and powers" })} <strong>Briefs</strong>{t("designGuide.inlineBanner.builtInBody2", { defaultValue: ". It can be paused but not deleted." })}
          </InlineBanner>
          <InlineBanner
            tone="warning"
            title={t("designGuide.inlineBanner.briefsPausedTitle", { defaultValue: "Briefs is paused." })}
            actions={
              <>
                <Button variant="ghost" size="sm">{t("designGuide.inlineBanner.viewAgent", { defaultValue: "View agent" })}</Button>
                <Button size="sm">{t("designGuide.inlineBanner.resumeAgent", { defaultValue: "Resume agent" })}</Button>
              </>
            }
          >
            {t("designGuide.inlineBanner.briefsPausedBody", { defaultValue: "Its built-in agent was paused 2 days ago, so new briefs aren't being generated." })}
          </InlineBanner>
          <InlineBanner
            tone="danger"
            title={t("designGuide.inlineBanner.summaryFailedTitle", { defaultValue: "Summary generation failed." })}
            actions={<Button size="sm">{t("designGuide.inlineBanner.retry", { defaultValue: "Retry" })}</Button>}
          >
            {t("designGuide.inlineBanner.summaryFailedBody", { defaultValue: "The linked issue reached a terminal state before a summary was written." })}
          </InlineBanner>
          <InlineBanner tone="info" compact>
            {t("designGuide.inlineBanner.compactBody", { defaultValue: "Compact variant for embedding inside dialogs and modals." })}
          </InlineBanner>
        </div>
      </Section>

      <Section title={t("designGuide.builtInChips.title", { defaultValue: "Built-in Agent Lifecycle Chips" })}>
        <p className="text-sm text-muted-foreground">
          {t("designGuide.builtInChips.desc1", { defaultValue: "A derived lifecycle chip (amber) for attention states. The lifecycle chip is separate from the agent status vocabulary and only shows for" })}{" "}
          <span className="font-mono">needs_setup</span> / <span className="font-mono">pending_approval</span>.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <BuiltInLifecycleChip status="needs_setup" />
          <BuiltInLifecycleChip status="pending_approval" />
          <BuiltInLifecycleChip status="needs_setup" compact />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          <span className="font-mono">&lt;BuiltInAgentGate agentKey&gt;</span> {t("designGuide.builtInChips.desc2", { defaultValue: "composes" })}{" "}
          <span className="font-mono">PageSkeleton</span> + <span className="font-mono">EmptyState</span>{" "}
          + <span className="font-mono">InlineBanner</span> {t("designGuide.builtInChips.desc3", { defaultValue: "to render the loading / setup / pending-approval / paused / ready states of a feature that depends on a built-in agent." })}
        </p>
      </Section>
    </div>
  );
}
