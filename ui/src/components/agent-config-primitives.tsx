import { useState, useRef, useEffect, useCallback } from "react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HelpCircle, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { AGENT_ROLE_LABELS } from "@paperclipai/shared";
import { t, useTranslation } from "@/i18n";

/* ---- Help text for (?) tooltips ---- */
export const help: Record<string, string> = {
  name: t("agentConfigPrimitives.help.name", { defaultValue: "Display name for this agent." }),
  title: t("agentConfigPrimitives.help.title", { defaultValue: "Job title shown in the org chart." }),
  role: t("agentConfigPrimitives.help.role", { defaultValue: "Organizational role. Determines position and capabilities." }),
  reportsTo: t("agentConfigPrimitives.help.reportsTo", { defaultValue: "The agent this one reports to in the org hierarchy." }),
  capabilities: t("agentConfigPrimitives.help.capabilities", { defaultValue: "Describes what this agent can do. Shown in the org chart and used for task routing." }),
  adapterType: t("agentConfigPrimitives.help.adapterType", { defaultValue: "How this agent runs: local CLI (Claude/Codex/OpenCode), OpenClaw Gateway, spawned process, or generic HTTP webhook." }),
  cwd: t("agentConfigPrimitives.help.cwd", { defaultValue: "Deprecated legacy working directory fallback for local adapters. Existing agents may still carry this value, but new configurations should use project workspaces instead." }),
  // Contains literal {{ }} template-variable documentation; left unwrapped so
  // i18next interpolation does not strip the placeholders.
  promptTemplate: "Sent on every heartbeat. Keep this small and dynamic. Use it for current-task framing, not large static instructions. Supports {{ agent.id }}, {{ agent.name }}, {{ agent.role }} and other template variables.",
  model: t("agentConfigPrimitives.help.model", { defaultValue: "Override the default model used by the adapter." }),
  thinkingEffort: t("agentConfigPrimitives.help.thinkingEffort", { defaultValue: "Control model reasoning depth. Supported values vary by adapter/model." }),
  chrome: t("agentConfigPrimitives.help.chrome", { defaultValue: "Enable Claude's Chrome integration by passing --chrome." }),
  dangerouslySkipPermissions: t("agentConfigPrimitives.help.dangerouslySkipPermissions", { defaultValue: "Run unattended by auto-approving adapter permission prompts when supported." }),
  dangerouslyBypassSandbox: t("agentConfigPrimitives.help.dangerouslyBypassSandbox", { defaultValue: "Run Codex without sandbox restrictions. Required for filesystem/network access." }),
  search: t("agentConfigPrimitives.help.search", { defaultValue: "Enable Codex web search capability during runs." }),
  fastMode: t("agentConfigPrimitives.help.fastMode", { defaultValue: "Enable Codex Fast mode. This burns credits/tokens much faster and is supported on GPT-5.6, GPT-5.5, GPT-5.4, and manual Codex model IDs." }),
  workspaceStrategy: t("agentConfigPrimitives.help.workspaceStrategy", { defaultValue: "How Paperclip should realize an execution workspace for this agent. Keep project_primary for normal cwd execution, or use git_worktree for issue-scoped isolated checkouts." }),
  workspaceBaseRef: t("agentConfigPrimitives.help.workspaceBaseRef", { defaultValue: "Base git ref used when creating a worktree branch. Leave blank to use the resolved workspace ref or HEAD." }),
  // Contains literal {{ }} template-variable documentation; left unwrapped so
  // i18next interpolation does not strip the placeholders.
  workspaceBranchTemplate: "Template for naming derived branches. Supports {{issue.identifier}}, {{issue.title}}, {{agent.name}}, {{project.id}}, {{workspace.repoRef}}, and {{slug}}.",
  worktreeParentDir: t("agentConfigPrimitives.help.worktreeParentDir", { defaultValue: "Directory where derived worktrees should be created. Absolute, ~-prefixed, and repo-relative paths are supported." }),
  runtimeServicesJson: t("agentConfigPrimitives.help.runtimeServicesJson", { defaultValue: "Optional workspace runtime service definitions. Use this for shared app servers, workers, or other long-lived companion processes attached to the workspace." }),
  maxTurnsPerRun: t("agentConfigPrimitives.help.maxTurnsPerRun", { defaultValue: "Maximum number of agentic turns (tool calls) per heartbeat run." }),
  command: t("agentConfigPrimitives.help.command", { defaultValue: "The command to execute (e.g. node, python)." }),
  localCommand: t("agentConfigPrimitives.help.localCommand", { defaultValue: "Override the path to the CLI command you want the adapter to call (e.g. /usr/local/bin/claude, codex, opencode)." }),
  args: t("agentConfigPrimitives.help.args", { defaultValue: "Command-line arguments, comma-separated." }),
  extraArgs: t("agentConfigPrimitives.help.extraArgs", { defaultValue: "Extra CLI arguments for local adapters, comma-separated." }),
  envVars: t("agentConfigPrimitives.help.envVars", { defaultValue: "Environment variables injected into the adapter process. Use plain values or secret references." }),
  secretAccess:
    t("agentConfigPrimitives.help.secretAccess", { defaultValue: "Secrets this agent can reach. Env-var bindings are injected at run start; API-access bindings are fetched on demand via the run-bound agent API and never written to the environment." }),
  bootstrapPrompt: t("agentConfigPrimitives.help.bootstrapPrompt", { defaultValue: "Only sent when Paperclip starts a fresh session. Use this for stable setup guidance that should not be repeated on every heartbeat." }),
  payloadTemplateJson: t("agentConfigPrimitives.help.payloadTemplateJson", { defaultValue: "Optional JSON merged into remote adapter request payloads before Paperclip adds its standard wake and workspace fields." }),
  webhookUrl: t("agentConfigPrimitives.help.webhookUrl", { defaultValue: "The URL that receives POST requests when the agent is invoked." }),
  heartbeatInterval: t("agentConfigPrimitives.help.heartbeatInterval", { defaultValue: "Run this agent automatically on a timer. Useful for periodic tasks like checking for new work." }),
  intervalSec: t("agentConfigPrimitives.help.intervalSec", { defaultValue: "Seconds between automatic heartbeat invocations." }),
  timeoutSec: t("agentConfigPrimitives.help.timeoutSec", { defaultValue: "Maximum seconds a run can take before being terminated. 0 means no timeout." }),
  graceSec: t("agentConfigPrimitives.help.graceSec", { defaultValue: "Seconds to wait after sending interrupt before force-killing the process." }),
  wakeOnDemand: t("agentConfigPrimitives.help.wakeOnDemand", { defaultValue: "Allow this agent to be woken by assignments, API calls, UI actions, or automated systems." }),
  cooldownSec: t("agentConfigPrimitives.help.cooldownSec", { defaultValue: "Minimum seconds between consecutive heartbeat runs." }),
  maxConcurrentRuns: t("agentConfigPrimitives.help.maxConcurrentRuns", { defaultValue: "Maximum number of heartbeat runs that can execute simultaneously for this agent." }),
  maxTurnContinuationEnabled: t("agentConfigPrimitives.help.maxTurnContinuationEnabled", { defaultValue: "Automatically queue bounded continuation runs when an adapter stops because its per-run turn cap was exhausted." }),
  maxTurnContinuationMaxAttempts: t("agentConfigPrimitives.help.maxTurnContinuationMaxAttempts", { defaultValue: "Maximum automatic continuations after one max-turn stop. This is separate from max turns per run." }),
  maxTurnContinuationDelaySec: t("agentConfigPrimitives.help.maxTurnContinuationDelaySec", { defaultValue: "Seconds to wait before starting each max-turn continuation." }),
  budgetMonthlyCents: t("agentConfigPrimitives.help.budgetMonthlyCents", { defaultValue: "Monthly spending limit in cents. 0 means no limit." }),
};

import { getAdapterLabels } from "../adapters/adapter-display-registry";

export const adapterLabels = getAdapterLabels();

export const roleLabels = AGENT_ROLE_LABELS as Record<string, string>;

/* ---- Primitive components ---- */

export function HintIcon({ text }: { text: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex text-muted-foreground/50 hover:text-muted-foreground transition-colors">
          <HelpCircle className="h-3 w-3" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <HintIcon text={hint} />}
      </div>
      {children}
    </div>
  );
}

export function ToggleField({
  label,
  hint,
  checked,
  onChange,
  toggleTestId,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  toggleTestId?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-muted-foreground">{label}</span>
        {hint && <HintIcon text={hint} />}
      </div>
      {/* Gallery feedback r3: was a hand-rolled h-5 w-9 pill with a bg-green-600
          track — the app's second switch implementation. Converged on the one
          canonical ToggleSwitch (status-green on-state), DESIGN.md principle 1. */}
      <ToggleSwitch
        data-testid={toggleTestId}
        checked={checked}
        onCheckedChange={onChange}
      />
    </div>
  );
}

export function ToggleWithNumber({
  label,
  hint,
  checked,
  onCheckedChange,
  number,
  onNumberChange,
  numberLabel,
  numberHint,
  numberPrefix,
  showNumber,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  number: number;
  onNumberChange: (v: number) => void;
  numberLabel: string;
  numberHint?: string;
  numberPrefix?: string;
  showNumber: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          {hint && <HintIcon text={hint} />}
        </div>
        <ToggleSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
        />
      </div>
      {showNumber && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {numberPrefix && <span>{numberPrefix}</span>}
          <input
            type="number"
            className="w-16 rounded-md border border-border px-2 py-0.5 bg-transparent outline-none text-xs font-mono text-center"
            value={number}
            onChange={(e) => onNumberChange(Number(e.target.value))}
          />
          <span>{numberLabel}</span>
          {numberHint && <HintIcon text={numberHint} />}
        </div>
      )}
    </div>
  );
}

export function CollapsibleSection({
  title,
  icon,
  open,
  onToggle,
  bordered,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  bordered?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn(bordered && "border-t border-border")}>
      <button
        className="flex items-center gap-2 w-full px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-accent/30 transition-colors"
        onClick={onToggle}
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {icon}
        {title}
      </button>
      {open && <div className="px-4 pb-3">{children}</div>}
    </div>
  );
}

export function AutoExpandTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  minRows,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minRows?: number;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rows = minRows ?? 3;
  const lineHeight = 20;
  const minHeight = rows * lineHeight;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);

  useEffect(() => { adjustHeight(); }, [value, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      style={{ minHeight }}
    />
  );
}

/**
 * Text input that manages internal draft state.
 * Calls `onCommit` on blur (and optionally on every change if `immediate` is set).
 */
export function DraftInput({
  value,
  onCommit,
  immediate,
  className,
  ...props
}: {
  value: string;
  onCommit: (v: string) => void;
  immediate?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className">) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  return (
    <input
      className={className}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      {...props}
    />
  );
}

/**
 * Auto-expanding textarea with draft state and blur-commit.
 */
export function DraftTextarea({
  value,
  onCommit,
  immediate,
  placeholder,
  minRows,
}: {
  value: string;
  onCommit: (v: string) => void;
  immediate?: boolean;
  placeholder?: string;
  minRows?: number;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const rows = minRows ?? 3;
  const lineHeight = 20;
  const minHeight = rows * lineHeight;

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [minHeight]);

  useEffect(() => { adjustHeight(); }, [draft, adjustHeight]);

  return (
    <textarea
      ref={textareaRef}
      className="w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40 resize-none overflow-hidden"
      placeholder={placeholder}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(e.target.value);
      }}
      onBlur={() => {
        if (draft !== value) onCommit(draft);
      }}
      style={{ minHeight }}
    />
  );
}

/**
 * Number input with draft state and blur-commit.
 */
export function DraftNumberInput({
  value,
  onCommit,
  immediate,
  className,
  ...props
}: {
  value: number;
  onCommit: (v: number) => void;
  immediate?: boolean;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className" | "type">) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <input
      type="number"
      className={className}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value);
        if (immediate) onCommit(Number(e.target.value) || 0);
      }}
      onBlur={() => {
        const num = Number(draft) || 0;
        if (num !== value) onCommit(num);
      }}
      {...props}
    />
  );
}

/**
 * "Choose" button that opens a dialog explaining the user must manually
 * type the path due to browser security limitations.
 */
export function ChoosePathButton() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors shrink-0"
        onClick={() => setOpen(true)}
      >
        {t("agentConfigPrimitives.choosePath.button", { defaultValue: "Choose" })}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("agentConfigPrimitives.choosePath.title", { defaultValue: "Specify path manually" })}</DialogTitle>
            <DialogDescription>
              {t("agentConfigPrimitives.choosePath.description", { defaultValue: "Browser security blocks apps from reading full local paths via a file picker. Copy the absolute path and paste it into the input." })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <section className="space-y-1.5">
              <p className="font-medium">{t("agentConfigPrimitives.choosePath.macos.heading", { defaultValue: "macOS (Finder)" })}</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>{t("agentConfigPrimitives.choosePath.macos.step1", { defaultValue: "Find the folder in Finder." })}</li>
                <li>{t("agentConfigPrimitives.choosePath.holdPrefix", { defaultValue: "Hold " })}<kbd>Option</kbd>{t("agentConfigPrimitives.choosePath.rightClickFolder", { defaultValue: " and right-click the folder." })}</li>
                <li>{t("agentConfigPrimitives.choosePath.macos.step3", { defaultValue: 'Click "Copy <folder name> as Pathname".' })}</li>
                <li>{t("agentConfigPrimitives.choosePath.pasteResult", { defaultValue: "Paste the result into the path input." })}</li>
              </ol>
              <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                /Users/yourname/Documents/project
              </p>
            </section>
            <section className="space-y-1.5">
              <p className="font-medium">{t("agentConfigPrimitives.choosePath.windows.heading", { defaultValue: "Windows (File Explorer)" })}</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>{t("agentConfigPrimitives.choosePath.windows.step1", { defaultValue: "Find the folder in File Explorer." })}</li>
                <li>{t("agentConfigPrimitives.choosePath.holdPrefix", { defaultValue: "Hold " })}<kbd>Shift</kbd>{t("agentConfigPrimitives.choosePath.rightClickFolder", { defaultValue: " and right-click the folder." })}</li>
                <li>{t("agentConfigPrimitives.choosePath.windows.step3", { defaultValue: 'Click "Copy as path".' })}</li>
                <li>{t("agentConfigPrimitives.choosePath.pasteResult", { defaultValue: "Paste the result into the path input." })}</li>
              </ol>
              <p className="rounded-md bg-muted px-2 py-1 font-mono text-xs">
                C:\Users\yourname\Documents\project
              </p>
            </section>
            <section className="space-y-1.5">
              <p className="font-medium">{t("agentConfigPrimitives.choosePath.terminal.heading", { defaultValue: "Terminal fallback (macOS/Linux)" })}</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>{t("agentConfigPrimitives.choosePath.runPrefix", { defaultValue: "Run " })}<code>cd /path/to/folder</code>{t("agentConfigPrimitives.choosePath.runSuffix", { defaultValue: "." })}</li>
                <li>{t("agentConfigPrimitives.choosePath.runPrefix", { defaultValue: "Run " })}<code>pwd</code>{t("agentConfigPrimitives.choosePath.runSuffix", { defaultValue: "." })}</li>
                <li>{t("agentConfigPrimitives.choosePath.terminal.step3", { defaultValue: "Copy the output and paste it into the path input." })}</li>
              </ol>
            </section>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t("agentConfigPrimitives.choosePath.ok", { defaultValue: "OK" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Label + input rendered on the same line (inline layout for compact fields).
 */
export function InlineField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <label className="text-xs text-muted-foreground">{label}</label>
        {hint && <HintIcon text={hint} />}
      </div>
      <div className="w-24 ml-auto">{children}</div>
    </div>
  );
}
