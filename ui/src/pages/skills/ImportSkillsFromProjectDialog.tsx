import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  FolderSearch,
  Layers,
  Link2,
  Loader2,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type {
  CompanySkill,
  CompanySkillProjectScanCandidate,
  CompanySkillProjectScanResult,
  Project,
  ProjectWorkspace,
} from "@paperclipai/shared";
import { normalizeAgentUrlKey } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { ApiError } from "../../api/client";
import { companySkillsApi } from "../../api/companySkills";
import { projectsApi } from "../../api/projects";
import { useToastActions } from "../../context/ToastContext";
import { queryKeys } from "../../lib/queryKeys";
import { skillStudioRoute } from "../../lib/company-skill-routes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "../../components/EmptyState";
import { cn } from "../../lib/utils";
import { t, useTranslation } from "@/i18n";

type Step = "pick" | "scanning" | "select" | "result";
export type SkillSelection = { workspaceId: string; path: string; slug?: string };

interface ImportSkillsFromProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  /** Opens the legacy "Import from path or URL" dialog (empty-state fallback). */
  onImportFromPath?: () => void;
}

/**
 * A representative slice of the well-known folders the server scans, shown
 * during the scanning step so users learn where to place skills. The full list
 * lives in PROJECT_SCAN_DIRECTORY_ROOTS server-side (~34 entries); we surface
 * the common ones plus a count of the rest.
 */
const HIGHLIGHTED_SCAN_FOLDERS = [
  "./skills",
  ".agents/skills",
  ".claude/skills",
  ".codex/skills",
  ".cursor/skills",
];
const APPROX_TOTAL_SCAN_FOLDERS = 34;

export function selectionKey(workspaceId: string, path: string): string {
  return `${workspaceId} ${path}`;
}

export function isScannableWorkspace(workspace: ProjectWorkspace): boolean {
  if (workspace.sourceType === "remote_managed") return false;
  return typeof workspace.cwd === "string" && workspace.cwd.trim().length > 0;
}

export function scannableWorkspaces(project: Project): ProjectWorkspace[] {
  return project.workspaces.filter(isScannableWorkspace);
}

function workspaceKindLabel(sourceType: ProjectWorkspace["sourceType"]): string {
  switch (sourceType) {
    case "git_repo":
      return t("importSkillsFromProjectDialog.workspaceKind.git", { defaultValue: "git" });
    case "local_path":
      return t("importSkillsFromProjectDialog.workspaceKind.local", { defaultValue: "local" });
    case "non_git_path":
      return t("importSkillsFromProjectDialog.workspaceKind.folder", { defaultValue: "folder" });
    case "remote_managed":
      return t("importSkillsFromProjectDialog.workspaceKind.remote", { defaultValue: "remote" });
    default:
      return sourceType;
  }
}

function summarizeWorkspaceKinds(workspaces: ProjectWorkspace[]): string {
  const kinds = Array.from(new Set(workspaces.map((ws) => workspaceKindLabel(ws.sourceType))));
  return kinds.join(", ");
}

/**
 * New skills and conflicts can be checked. Conflicts remain unchecked by
 * default and require an alternate slug before import.
 */
export function isSelectableCandidate(candidate: CompanySkillProjectScanCandidate): boolean {
  return candidate.status === "new" || candidate.status === "conflict";
}

export function filterCandidates(
  candidates: CompanySkillProjectScanCandidate[],
  filter: string,
): CompanySkillProjectScanCandidate[] {
  const query = filter.trim().toLowerCase();
  if (!query) return candidates;
  return candidates.filter((candidate) => [
    candidate.name,
    candidate.slug,
    candidate.description,
    candidate.relativePath,
    candidate.workspaceName,
    candidate.directoryRoot,
    candidate.status,
  ].some((value) => value?.toLowerCase().includes(query)));
}

export interface CandidateDirectoryGroup {
  key: string;
  directoryRoot: string;
  candidates: CompanySkillProjectScanCandidate[];
}

export interface CandidateWorkspaceGroup {
  key: string;
  workspaceId: string;
  workspaceName: string;
  isPrimary: boolean;
  directories: CandidateDirectoryGroup[];
}

export function groupCandidates(
  candidates: CompanySkillProjectScanCandidate[],
  workspaces: ProjectWorkspace[] = [],
): CandidateWorkspaceGroup[] {
  const workspaceMetadata = new Map(workspaces.map((workspace) => [workspace.id, workspace]));
  const groups = new Map<string, CandidateWorkspaceGroup>();
  for (const candidate of candidates) {
    let group = groups.get(candidate.workspaceId);
    if (!group) {
      group = {
        key: candidate.workspaceId,
        workspaceId: candidate.workspaceId,
        workspaceName: candidate.workspaceName,
        isPrimary: workspaceMetadata.get(candidate.workspaceId)?.isPrimary ?? false,
        directories: [],
      };
      groups.set(candidate.workspaceId, group);
    }
    let directory = group.directories.find((entry) => entry.directoryRoot === candidate.directoryRoot);
    if (!directory) {
      directory = {
        key: `${candidate.workspaceId} ${candidate.directoryRoot}`,
        directoryRoot: candidate.directoryRoot,
        candidates: [],
      };
      group.directories.push(directory);
    }
    directory.candidates.push(candidate);
  }
  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      directories: group.directories.sort((a, b) => a.directoryRoot.localeCompare(b.directoryRoot)),
    }))
    .sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.workspaceName.localeCompare(b.workspaceName);
    });
}

export function defaultSelection(
  _candidates: CompanySkillProjectScanCandidate[],
): Map<string, SkillSelection> {
  return new Map();
}

export function selectAllSelection(
  candidates: CompanySkillProjectScanCandidate[],
): Map<string, SkillSelection> {
  const next = new Map<string, SkillSelection>();
  for (const candidate of candidates) {
    if (candidate.status !== "new") continue;
    next.set(selectionKey(candidate.workspaceId, candidate.relativePath), {
      workspaceId: candidate.workspaceId,
      path: candidate.relativePath,
    });
  }
  return next;
}

export function suggestedConflictSlug(candidate: CompanySkillProjectScanCandidate): string {
  return `${candidate.slug}-copy`;
}

export function isValidSelectionSlug(selection: SkillSelection): boolean {
  if (selection.slug === undefined) return true;
  const trimmed = selection.slug.trim();
  return Boolean(trimmed) && normalizeAgentUrlKey(trimmed) === trimmed;
}

function readableErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return (
      error.message ||
      t("importSkillsFromProjectDialog.errors.requestFailed", {
        defaultValue: "Request failed: {{status}}",
        status: error.status,
      })
    );
  }
  if (error instanceof Error) return error.message;
  return t("importSkillsFromProjectDialog.errors.unexpected", { defaultValue: "Unexpected error" });
}

export function isGrantError(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  return error.status === 403;
}

function CandidateStatusBadge({
  status,
}: {
  status: CompanySkillProjectScanCandidate["status"];
}) {
  const { t } = useTranslation();
  switch (status) {
    case "already_imported":
      return (
        <Badge
          variant="outline"
          className="gap-1 px-1.5 py-0 font-normal text-muted-foreground border-border/60"
        >
          <Link2 className="h-3 w-3" />{" "}
          {t("importSkillsFromProjectDialog.status.imported", { defaultValue: "Imported" })}
        </Badge>
      );
    case "conflict":
      return (
        <Badge
          variant="outline"
          className="gap-1 px-1.5 py-0 font-normal text-amber-600 border-amber-500/40 dark:text-amber-400"
        >
          <AlertTriangle className="h-3 w-3" />{" "}
          {t("importSkillsFromProjectDialog.status.conflict", { defaultValue: "Conflict" })}
        </Badge>
      );
    case "skipped":
      return (
        <Badge
          variant="outline"
          className="gap-1 px-1.5 py-0 font-normal text-muted-foreground border-border/60"
        >
          <FileWarning className="h-3 w-3" />{" "}
          {t("importSkillsFromProjectDialog.status.skipped", { defaultValue: "Skipped" })}
        </Badge>
      );
    case "new":
    default:
      return (
        <Badge
          variant="outline"
          className="gap-1 px-1.5 py-0 font-normal text-emerald-600 border-emerald-500/40 dark:text-emerald-400"
        >
          <CheckCircle2 className="h-3 w-3" />{" "}
          {t("importSkillsFromProjectDialog.status.new", { defaultValue: "New" })}
        </Badge>
      );
  }
}

export function ImportSkillsFromProjectDialog({
  open,
  onOpenChange,
  companyId,
  onImportFromPath,
}: ImportSkillsFromProjectDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const toast = useToastActions();

  const [step, setStep] = useState<Step>("pick");
  const [projectFilter, setProjectFilter] = useState("");
  const [candidateFilter, setCandidateFilter] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [scanResult, setScanResult] = useState<CompanySkillProjectScanResult | null>(null);
  const [scanError, setScanError] = useState<unknown>(null);
  const [selection, setSelection] = useState<Map<string, SkillSelection>>(new Map());
  const [importResult, setImportResult] = useState<CompanySkillProjectScanResult | null>(null);
  const scanTokenRef = useRef(0);

  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(companyId),
    queryFn: () => projectsApi.list(companyId),
    enabled: open,
  });

  // Reset all local state on each open transition.
  useEffect(() => {
    if (!open) return;
    setStep("pick");
    setProjectFilter("");
    setCandidateFilter("");
    setSelectedProject(null);
    setScanResult(null);
    setScanError(null);
    setSelection(new Map());
    setImportResult(null);
    scanTokenRef.current += 1;
  }, [open]);

  const projects = projectsQuery.data ?? [];
  const filteredProjects = useMemo(() => {
    const query = projectFilter.trim().toLowerCase();
    const sorted = [...projects].sort((a, b) => a.name.localeCompare(b.name));
    if (!query) return sorted;
    return sorted.filter((project) => project.name.toLowerCase().includes(query));
  }, [projects, projectFilter]);

  function startScan(project: Project) {
    setSelectedProject(project);
    setScanResult(null);
    setScanError(null);
    setSelection(new Map());
    setStep("scanning");
    const token = ++scanTokenRef.current;
    companySkillsApi
      .scanProjects(companyId, { projectIds: [project.id], mode: "preview" })
      .then((result) => {
        if (token !== scanTokenRef.current) return;
        setScanResult(result);
        setSelection(defaultSelection(result.candidates));
        setStep("select");
      })
      .catch((error) => {
        if (token !== scanTokenRef.current) return;
        setScanError(error);
        setStep("select");
      });
  }

  const importMutation = useMutation({
    mutationFn: () => {
      if (!selectedProject)
        throw new Error(
          t("importSkillsFromProjectDialog.errors.noProjectSelected", {
            defaultValue: "No project selected.",
          }),
        );
      const selectionInput = Array.from(selection.values());
      return companySkillsApi.scanProjects(companyId, {
        projectIds: [selectedProject.id],
        mode: "import",
        selection: selectionInput,
      });
    },
    onSuccess: async (result) => {
      setImportResult(result);
      setStep("result");
      await queryClient.invalidateQueries({
        queryKey: queryKeys.companySkills.list(companyId),
      });
      const importedCount = result.imported.length;
      const projectName =
        selectedProject?.name ??
        t("importSkillsFromProjectDialog.toast.projectFallback", { defaultValue: "the project" });
      toast.pushToast({
        tone: importedCount > 0 ? "success" : "warn",
        title:
          importedCount > 0
            ? t("importSkillsFromProjectDialog.toast.importedTitle", {
                defaultValue: "Skills imported",
              })
            : t("importSkillsFromProjectDialog.toast.nothingImportedTitle", {
                defaultValue: "Nothing imported",
              }),
        body:
          importedCount > 0
            ? t(
                importedCount === 1
                  ? "importSkillsFromProjectDialog.toast.importedBodySingular"
                  : "importSkillsFromProjectDialog.toast.importedBodyPlural",
                {
                  defaultValue:
                    importedCount === 1
                      ? "{{count}} skill imported as references from {{project}}."
                      : "{{count}} skills imported as references from {{project}}.",
                  count: importedCount,
                  project: projectName,
                },
              )
            : t("importSkillsFromProjectDialog.toast.nothingImportedBody", {
                defaultValue: "No skills were imported.",
              }),
      });
    },
    onError: (error) => {
      toast.pushToast({
        tone: "error",
        title: t("importSkillsFromProjectDialog.toast.importFailedTitle", {
          defaultValue: "Import failed",
        }),
        body: readableErrorMessage(error),
      });
    },
  });

  const candidates = scanResult?.candidates ?? [];
  const selectableCandidates = useMemo(
    () => candidates.filter(isSelectableCandidate),
    [candidates],
  );
  const filteredCandidates = useMemo(
    () => filterCandidates(candidates, candidateFilter),
    [candidateFilter, candidates],
  );
  const groups = useMemo(
    () => groupCandidates(filteredCandidates, selectedProject?.workspaces ?? []),
    [filteredCandidates, selectedProject],
  );
  const selectedCount = selection.size;
  const hasInvalidSelection = Array.from(selection.values()).some(
    (selected) => !isValidSelectionSlug(selected),
  );

  function toggleCandidate(candidate: CompanySkillProjectScanCandidate) {
    if (!isSelectableCandidate(candidate)) return;
    setSelection((prev) => {
      const next = new Map(prev);
      const key = selectionKey(candidate.workspaceId, candidate.relativePath);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.set(key, {
          workspaceId: candidate.workspaceId,
          path: candidate.relativePath,
          ...(candidate.status === "conflict" ? { slug: suggestedConflictSlug(candidate) } : {}),
        });
      }
      return next;
    });
  }

  function renameCandidate(candidate: CompanySkillProjectScanCandidate, slug: string) {
    setSelection((prev) => {
      const next = new Map(prev);
      const key = selectionKey(candidate.workspaceId, candidate.relativePath);
      const selected = next.get(key);
      if (!selected) return prev;
      next.set(key, { ...selected, slug });
      return next;
    });
  }

  function selectAll() {
    setSelection(selectAllSelection(candidates));
  }

  function deselectAll() {
    setSelection(new Map());
  }

  function handleClose() {
    if (importMutation.isPending) return;
    onOpenChange(false);
  }

  function backToPick() {
    scanTokenRef.current += 1;
    setSelectedProject(null);
    setScanResult(null);
    setScanError(null);
    setCandidateFilter("");
    setSelection(new Map());
    setStep("pick");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) onOpenChange(true);
        else handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-(--sz-85vh) flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        data-testid="import-skills-from-project-dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
          <div className="flex flex-col gap-1">
            <DialogTitle className="text-base font-semibold">
              {t("importSkillsFromProjectDialog.title", {
                defaultValue: "Import skills from project",
              })}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {t("importSkillsFromProjectDialog.description", {
                defaultValue:
                  "Pick a project, scan its workspaces for skills, and import them as references.",
              })}
            </DialogDescription>
          </div>
          <button
            type="button"
            className="rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100"
            onClick={handleClose}
            aria-label={t("importSkillsFromProjectDialog.close.ariaLabel", {
              defaultValue: "Close import dialog",
            })}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden" aria-live="polite">
          {step === "pick" && (
            <PickProjectStep
              loading={projectsQuery.isLoading}
              error={projectsQuery.error}
              projects={filteredProjects}
              totalProjects={projects.length}
              filter={projectFilter}
              onFilterChange={setProjectFilter}
              onPick={startScan}
            />
          )}
          {step === "scanning" && <ScanningStep projectName={selectedProject?.name ?? ""} />}
          {step === "select" && (
            <SelectStep
              scanError={scanError}
              onRetry={() => selectedProject && startScan(selectedProject)}
              onImportFromPath={onImportFromPath}
              groups={groups}
              totalCandidates={candidates.length}
              filter={candidateFilter}
              onFilterChange={setCandidateFilter}
              selection={selection}
              toggleCandidate={toggleCandidate}
              renameCandidate={renameCandidate}
            />
          )}
          {step === "result" && importResult && <ResultStep result={importResult} />}
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-border/60 bg-muted/20 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          {step === "select" && !scanError && candidates.length > 0 ? (
            <div className="min-w-0 flex-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Link2 className="h-3.5 w-3.5 shrink-0" />
                {t("importSkillsFromProjectDialog.footer.filesStayNote", {
                  defaultValue: "Files stay in the project — Studio edits save directly to them.",
                })}
              </span>
            </div>
          ) : (
            <div className="hidden min-w-0 flex-1 sm:block" />
          )}
          <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
            {step === "select" && (
              <>
                {!scanError && candidates.length > 0 && (
                  <div className="mr-1 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAll}
                      disabled={selectableCandidates.length === 0}
                      data-testid="select-all"
                    >
                      {t("importSkillsFromProjectDialog.actions.selectAll", {
                        defaultValue: "Select all",
                      })}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={deselectAll}
                      disabled={selectedCount === 0}
                      data-testid="deselect-all"
                    >
                      {t("importSkillsFromProjectDialog.actions.deselectAll", {
                        defaultValue: "Deselect all",
                      })}
                    </Button>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={backToPick}>
                  <ArrowLeft className="mr-1 h-3.5 w-3.5" />{" "}
                  {t("importSkillsFromProjectDialog.actions.back", { defaultValue: "Back" })}
                </Button>
                {!scanError && candidates.length > 0 && (
                  <Button
                    size="sm"
                    onClick={() => importMutation.mutate()}
                    disabled={selectedCount === 0 || hasInvalidSelection || importMutation.isPending}
                    data-testid="import-skills"
                  >
                    {importMutation.isPending ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />{" "}
                        {t("importSkillsFromProjectDialog.actions.importing", {
                          defaultValue: "Importing…",
                        })}
                      </>
                    ) : (
                      t(
                        selectedCount === 1
                          ? "importSkillsFromProjectDialog.actions.importSkillsSingular"
                          : "importSkillsFromProjectDialog.actions.importSkillsPlural",
                        {
                          defaultValue:
                            selectedCount === 1
                              ? "Import {{count}} skill"
                              : "Import {{count}} skills",
                          count: selectedCount,
                        },
                      )
                    )}
                  </Button>
                )}
              </>
            )}
            {step === "pick" && (
              <Button variant="ghost" size="sm" onClick={handleClose}>
                {t("importSkillsFromProjectDialog.actions.cancel", { defaultValue: "Cancel" })}
              </Button>
            )}
            {step === "result" && (
              <Button size="sm" onClick={handleClose}>
                {t("importSkillsFromProjectDialog.actions.done", { defaultValue: "Done" })}
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

interface PickProjectStepProps {
  loading: boolean;
  error: unknown;
  projects: Project[];
  totalProjects: number;
  filter: string;
  onFilterChange: (value: string) => void;
  onPick: (project: Project) => void;
}

function PickProjectStep({
  loading,
  error,
  projects,
  totalProjects,
  filter,
  onFilterChange,
  onPick,
}: PickProjectStepProps) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-5 py-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder={t("importSkillsFromProjectDialog.pickProject.filterPlaceholder", {
              defaultValue: "Filter projects",
            })}
            className="pl-7 text-xs"
            aria-label={t("importSkillsFromProjectDialog.pickProject.filterAriaLabel", {
              defaultValue: "Filter projects",
            })}
            data-testid="project-filter"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            {t("importSkillsFromProjectDialog.pickProject.loading", {
              defaultValue: "Loading projects…",
            })}
          </div>
        ) : error ? (
          <div
            className="m-5 flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
            role="alert"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{readableErrorMessage(error)}</div>
          </div>
        ) : totalProjects === 0 ? (
          <EmptyState
            icon={Layers}
            message={t("importSkillsFromProjectDialog.pickProject.emptyNoProjects", {
              defaultValue: "This company has no projects yet.",
            })}
          />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Search}
            message={t("importSkillsFromProjectDialog.pickProject.noMatch", {
              defaultValue: 'No projects match "{{filter}}".',
              filter,
            })}
          />
        ) : (
          <ul className="divide-y divide-border/60" data-testid="project-list">
            {projects.map((project) => {
              const scannable = scannableWorkspaces(project);
              const disabled = scannable.length === 0;
              const kinds = summarizeWorkspaceKinds(project.workspaces);
              return (
                <li key={project.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 px-5 py-3 text-left transition-colors",
                      disabled
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-accent/40",
                    )}
                    onClick={() => !disabled && onPick(project)}
                    disabled={disabled}
                    aria-disabled={disabled}
                    data-testid={`project-row-${project.id}`}
                    data-disabled={disabled ? "true" : "false"}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{project.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {project.workspaces.length === 1
                          ? t("importSkillsFromProjectDialog.pickProject.workspaceCountSingular", {
                              defaultValue: "{{count}} workspace",
                              count: project.workspaces.length,
                            })
                          : t("importSkillsFromProjectDialog.pickProject.workspaceCountPlural", {
                              defaultValue: "{{count}} workspaces",
                              count: project.workspaces.length,
                            })}
                        {kinds ? ` · ${kinds}` : ""}
                      </div>
                      {disabled && (
                        <div className="mt-1 text-(length:--text-micro) text-muted-foreground">
                          {t("importSkillsFromProjectDialog.pickProject.remoteOnly", {
                            defaultValue:
                              "Remote-only project — no locally scannable workspaces to import from.",
                          })}
                        </div>
                      )}
                    </div>
                    {!disabled && (
                      <Badge variant="outline" className="shrink-0 px-1.5 py-0 font-normal">
                        {t("importSkillsFromProjectDialog.pickProject.scannableBadge", {
                          defaultValue: "{{count}} scannable",
                          count: scannable.length,
                        })}
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function ScanningStep({ projectName }: { projectName: string }) {
  const { t } = useTranslation();
  return (
    <div
      className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 p-8 text-center"
      data-testid="scanning-step"
    >
      <div className="flex flex-col items-center gap-3">
        <FolderSearch className="h-10 w-10 text-muted-foreground/60" />
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">
          {t("importSkillsFromProjectDialog.scanning.title", {
            defaultValue: "Scanning {{project}} for skills…",
            project:
              projectName ||
              t("importSkillsFromProjectDialog.scanning.projectFallback", {
                defaultValue: "project",
              }),
          })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("importSkillsFromProjectDialog.scanning.subtitle", {
            defaultValue: "Looking in well-known skill folders across each workspace.",
          })}
        </p>
      </div>
      <div className="flex max-w-md flex-wrap justify-center gap-1.5">
        {HIGHLIGHTED_SCAN_FOLDERS.map((folder) => (
          <Badge
            key={folder}
            variant="outline"
            className="px-1.5 py-0 font-mono text-(length:--text-micro) font-normal text-muted-foreground"
          >
            {folder}
          </Badge>
        ))}
        <Badge
          variant="outline"
          className="px-1.5 py-0 text-(length:--text-micro) font-normal text-muted-foreground"
        >
          {t("importSkillsFromProjectDialog.scanning.moreFolders", {
            defaultValue: "+{{count}} more",
            count: APPROX_TOTAL_SCAN_FOLDERS - HIGHLIGHTED_SCAN_FOLDERS.length,
          })}
        </Badge>
      </div>
    </div>
  );
}

interface SelectStepProps {
  scanError: unknown;
  onRetry: () => void;
  onImportFromPath?: () => void;
  groups: CandidateWorkspaceGroup[];
  totalCandidates: number;
  filter: string;
  onFilterChange: (value: string) => void;
  selection: Map<string, SkillSelection>;
  toggleCandidate: (candidate: CompanySkillProjectScanCandidate) => void;
  renameCandidate: (candidate: CompanySkillProjectScanCandidate, slug: string) => void;
}

function SelectStep({
  scanError,
  onRetry,
  onImportFromPath,
  groups,
  totalCandidates,
  filter,
  onFilterChange,
  selection,
  toggleCandidate,
  renameCandidate,
}: SelectStepProps) {
  const { t } = useTranslation();
  if (scanError) {
    const grant = isGrantError(scanError);
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center p-6" data-testid="scan-error">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 w-fit bg-muted/50 p-4">
            {grant ? (
              <ShieldAlert className="h-10 w-10 text-muted-foreground/60" />
            ) : (
              <AlertCircle className="h-10 w-10 text-muted-foreground/60" />
            )}
          </div>
          <p className="text-base font-semibold">
            {grant
              ? t("importSkillsFromProjectDialog.selectStep.grantTitle", {
                  defaultValue: "You can't import skills here",
                })
              : t("importSkillsFromProjectDialog.selectStep.scanFailedTitle", {
                  defaultValue: "Scan failed",
                })}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {grant
              ? t("importSkillsFromProjectDialog.selectStep.grantBody", {
                  defaultValue:
                    "Your account doesn't have permission to add skills to this company. Ask an owner to grant the skills permission, then try again.",
                })
              : readableErrorMessage(scanError)}
          </p>
          {!grant && (
            <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
              {t("importSkillsFromProjectDialog.selectStep.tryAgain", {
                defaultValue: "Try again",
              })}
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (totalCandidates === 0) {
    return (
      <div
        className="flex min-h-0 flex-1 items-center justify-center p-6"
        data-testid="select-empty"
      >
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 w-fit bg-muted/50 p-4">
            <FolderSearch className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-base font-semibold">
            {t("importSkillsFromProjectDialog.selectStep.emptyTitle", {
              defaultValue: "No skills found",
            })}
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {t("importSkillsFromProjectDialog.selectStep.emptyBodyBefore", {
              defaultValue:
                "None of the well-known skill folders in this project's workspaces contain a ",
            })}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">SKILL.md</code>
            {t("importSkillsFromProjectDialog.selectStep.emptyBodyAfter", {
              defaultValue: ". We searched {{folders}} and {{count}} other agent-harness folders.",
              folders: HIGHLIGHTED_SCAN_FOLDERS.join(", "),
              count: APPROX_TOTAL_SCAN_FOLDERS - HIGHLIGHTED_SCAN_FOLDERS.length,
            })}
          </p>
          {onImportFromPath && (
            <p className="mt-3 text-sm text-muted-foreground">
              {t("importSkillsFromProjectDialog.selectStep.nonStandardPrefix", {
                defaultValue: "For skills in non-standard folders, use ",
              })}
              <button
                type="button"
                className="font-medium text-foreground underline underline-offset-2"
                onClick={onImportFromPath}
              >
                {t("importSkillsFromProjectDialog.selectStep.importFromPathAction", {
                  defaultValue: "Import from path or URL",
                })}
              </button>
              {t("importSkillsFromProjectDialog.selectStep.nonStandardSuffix", {
                defaultValue: ".",
              })}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="candidate-list">
      <div className="shrink-0 border-b border-border/60 px-5 py-2.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(event) => onFilterChange(event.target.value)}
            placeholder={t("importSkillsFromProjectDialog.selectStep.searchPlaceholder", {
              defaultValue: "Search discovered skills…",
            })}
            className="h-8 pl-8 text-xs"
            aria-label={t("importSkillsFromProjectDialog.selectStep.searchAriaLabel", {
              defaultValue: "Search discovered skills",
            })}
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {groups.length === 0 ? (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            {t("importSkillsFromProjectDialog.selectStep.noMatchFilter", {
              defaultValue: "No skills match “{{filter}}”.",
              filter: filter.trim(),
            })}
          </div>
        ) : (
          groups.map((group, groupIndex) => (
            <section key={group.key}>
              {groupIndex > 0 && !group.isPrimary && groups[groupIndex - 1]?.isPrimary && (
                <header className="border-y border-border/60 bg-muted/30 px-5 py-2 text-xs uppercase tracking-wide text-muted-foreground">
                  {t("importSkillsFromProjectDialog.selectStep.otherWorkspaces", {
                    defaultValue: "Other Workspaces",
                  })}
                </header>
              )}
              <header className="sticky top-0 z-10 border-b border-border/60 bg-background px-5 py-2 text-sm font-medium text-foreground">
                {group.workspaceName}
              </header>
              {group.directories.map((directory) => (
                <div key={directory.key}>
                  <div className="bg-muted/30 px-5 py-1.5 font-mono text-(length:--text-micro) text-muted-foreground">
                    {directory.directoryRoot}
                  </div>
                  <ul className="divide-y divide-border/60">
                    {directory.candidates.map((candidate) => {
                      const selectable = isSelectableCandidate(candidate);
                      const key = selectionKey(candidate.workspaceId, candidate.relativePath);
                      const isSelected = selection.has(key);
                      const selectedValue = selection.get(key);
                      return (
                        <li
                          key={`${candidate.workspaceId} ${candidate.relativePath}`}
                          className={cn(
                            "flex items-start gap-3 px-5 py-2.5 transition-colors",
                            selectable ? "cursor-pointer hover:bg-accent/40" : "opacity-70",
                            isSelected && "bg-accent/50",
                          )}
                          onClick={() => toggleCandidate(candidate)}
                          data-testid={`candidate-${candidate.relativePath}`}
                          data-status={candidate.status}
                          data-selected={isSelected ? "true" : "false"}
                        >
                          <div className="pt-0.5" onClick={(event) => event.stopPropagation()}>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleCandidate(candidate)}
                              disabled={!selectable}
                              aria-label={t(
                                "importSkillsFromProjectDialog.selectStep.selectCandidateAria",
                                { defaultValue: "Select {{name}}", name: candidate.name },
                              )}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <span className="min-w-0 truncate text-sm font-medium">
                                {candidate.name}
                              </span>
                              <CandidateStatusBadge status={candidate.status} />
                            </div>
                            {candidate.description && (
                              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                {candidate.description}
                              </p>
                            )}
                            <p className="mt-0.5 font-mono text-(length:--text-micro) text-muted-foreground">
                              {candidate.relativePath}
                            </p>
                            {candidate.reason && (
                              <p
                                className={cn(
                                  "mt-0.5 text-(length:--text-micro)",
                                  candidate.status === "conflict"
                                    ? "text-amber-600 dark:text-amber-400"
                                    : "text-muted-foreground",
                                )}
                              >
                                {candidate.reason}
                              </p>
                            )}
                            {candidate.status === "conflict" && isSelected && (
                              <div
                                className="mt-2 flex flex-wrap items-center gap-2"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <label
                                  htmlFor={`rename-${candidate.workspaceId}-${candidate.slug}`}
                                  className="shrink-0 text-xs text-muted-foreground"
                                >
                                  {t("importSkillsFromProjectDialog.selectStep.importAsLabel", {
                                    defaultValue: "Import as",
                                  })}
                                </label>
                                <Input
                                  id={`rename-${candidate.workspaceId}-${candidate.slug}`}
                                  value={selectedValue?.slug ?? ""}
                                  onChange={(event) =>
                                    renameCandidate(candidate, event.target.value)
                                  }
                                  className="h-7 max-w-xs font-mono text-xs"
                                  aria-label={t(
                                    "importSkillsFromProjectDialog.selectStep.renameCandidateAria",
                                    { defaultValue: "Rename {{name}}", name: candidate.name },
                                  )}
                                  aria-invalid={
                                    selectedValue
                                      ? !isValidSelectionSlug(selectedValue)
                                      : undefined
                                  }
                                />
                                {selectedValue && !isValidSelectionSlug(selectedValue) && (
                                  <span className="text-xs text-destructive">
                                    {t("importSkillsFromProjectDialog.selectStep.invalidSlug", {
                                      defaultValue: "Use a lowercase URL-safe slug.",
                                    })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </div>
  );
}

interface ResultStepProps {
  result: CompanySkillProjectScanResult;
}

function ResultStep({ result }: ResultStepProps) {
  const { t } = useTranslation();
  const importedSkills: CompanySkill[] = useMemo(
    () => [...result.imported, ...result.updated],
    [result],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-border/60 px-5 py-4" data-testid="result-summary">
        <div className="flex items-start gap-3 rounded-md border border-emerald-500/30 bg-emerald-500/5 p-3">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <div className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">
              {t("importSkillsFromProjectDialog.resultStep.noFilesCopied", {
                defaultValue: "No files were copied.",
              })}
            </span>{" "}
            {t("importSkillsFromProjectDialog.resultStep.referenceNote", {
              defaultValue:
                "These skills reference the files in the project workspace — editing them in Skill Studio saves directly back to those files.",
            })}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="text-emerald-600 dark:text-emerald-400">
            {t("importSkillsFromProjectDialog.resultStep.importedCount", {
              defaultValue: "✓ {{count}} imported",
              count: result.imported.length,
            })}
          </span>
          {result.updated.length > 0 && (
            <span>
              {t("importSkillsFromProjectDialog.resultStep.updatedCount", {
                defaultValue: "↻ {{count}} updated",
                count: result.updated.length,
              })}
            </span>
          )}
          {result.skipped.length > 0 && (
            <span>
              {t("importSkillsFromProjectDialog.resultStep.skippedCount", {
                defaultValue: "⊘ {{count}} skipped",
                count: result.skipped.length,
              })}
            </span>
          )}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {importedSkills.length > 0 && (
          <section>
            <header className="bg-muted/30 px-5 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              {t("importSkillsFromProjectDialog.resultStep.importedHeader", {
                defaultValue: "Imported · {{count}}",
                count: importedSkills.length,
              })}
            </header>
            <ul className="divide-y divide-border/60" data-testid="result-imported">
              {importedSkills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex items-center gap-3 px-5 py-2.5 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{skill.name}</div>
                    {skill.description && (
                      <div className="truncate text-xs text-muted-foreground">
                        {skill.description}
                      </div>
                    )}
                  </div>
                  <Link
                    to={skillStudioRoute(skill.id)}
                    className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-foreground no-underline hover:underline"
                  >
                    {t("importSkillsFromProjectDialog.resultStep.open", { defaultValue: "Open" })}{" "}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
        {result.skipped.length > 0 && (
          <section>
            <header className="bg-muted/30 px-5 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              {t("importSkillsFromProjectDialog.resultStep.skippedHeader", {
                defaultValue: "Skipped · {{count}}",
                count: result.skipped.length,
              })}
            </header>
            <ul className="divide-y divide-border/60" data-testid="result-skipped">
              {result.skipped.map((row, index) => (
                <li
                  key={`${row.workspaceId ?? "?"}-${row.path ?? index}`}
                  className="flex items-start gap-2 px-5 py-2.5 text-xs"
                >
                  <FileWarning className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <span className="font-mono text-muted-foreground">{row.path ?? "—"}</span>
                    {row.reason && (
                      <span className="ml-2 text-muted-foreground">{row.reason}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
        {result.warnings.length > 0 && (
          <section>
            <header className="bg-muted/30 px-5 py-1.5 text-xs uppercase tracking-wide text-muted-foreground">
              {t("importSkillsFromProjectDialog.resultStep.warningsHeader", {
                defaultValue: "Warnings · {{count}}",
                count: result.warnings.length,
              })}
            </header>
            <ul className="divide-y divide-border/60" data-testid="result-warnings">
              {result.warnings.map((warning, index) => (
                <li key={index} className="flex items-start gap-2 px-5 py-2.5 text-xs">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="text-muted-foreground">{warning}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
