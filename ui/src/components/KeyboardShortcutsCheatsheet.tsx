import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTranslation } from "@/i18n";

interface ShortcutEntry {
  keys: string[];
  label: string;
  /** Render keys as a simultaneous chord (joined with "+") rather than a
   *  "then" sequence. */
  combo?: boolean;
}

// Platform-appropriate label for the Cmd/Ctrl modifier so the cheatsheet shows
// the same key the user actually presses (re-pointed in the collapsible sidebar
// work — Cmd/Ctrl+B toggles the rail).
function getPlatformLabel() {
  if (typeof navigator === "undefined") return "";
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return nav.userAgentData?.platform || navigator.userAgent || "";
}

const META_KEY = /Mac|iPhone|iPad|iPod/.test(getPlatformLabel()) ? "⌘" : "Ctrl";

interface ShortcutSection {
  title: string;
  shortcuts: ShortcutEntry[];
}

function KeyCap({ children }: { children: string }) {
  return (
    <kbd className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 font-mono text-xs font-medium text-foreground shadow-(--shadow-extract-10)">
      {children}
    </kbd>
  );
}

export function KeyboardShortcutsCheatsheetContent() {
  const { t } = useTranslation();
  const sections: ShortcutSection[] = [
    {
      title: t("keyboardShortcutsCheatsheet.sections.inbox.title", { defaultValue: "Inbox" }),
      shortcuts: [
        { keys: ["j"], label: t("keyboardShortcutsCheatsheet.sections.inbox.moveDown", { defaultValue: "Move down" }) },
        { keys: ["↓"], label: t("keyboardShortcutsCheatsheet.sections.inbox.moveDown", { defaultValue: "Move down" }) },
        { keys: ["k"], label: t("keyboardShortcutsCheatsheet.sections.inbox.moveUp", { defaultValue: "Move up" }) },
        { keys: ["↑"], label: t("keyboardShortcutsCheatsheet.sections.inbox.moveUp", { defaultValue: "Move up" }) },
        { keys: ["←"], label: t("keyboardShortcutsCheatsheet.sections.inbox.collapseGroup", { defaultValue: "Collapse selected group" }) },
        { keys: ["→"], label: t("keyboardShortcutsCheatsheet.sections.inbox.expandGroup", { defaultValue: "Expand selected group" }) },
        { keys: ["Enter"], label: t("keyboardShortcutsCheatsheet.sections.inbox.openItem", { defaultValue: "Open selected item" }) },
        { keys: ["a"], label: t("keyboardShortcutsCheatsheet.sections.inbox.archiveItem", { defaultValue: "Archive item" }) },
        { keys: ["y"], label: t("keyboardShortcutsCheatsheet.sections.inbox.archiveItem", { defaultValue: "Archive item" }) },
        { keys: ["r"], label: t("keyboardShortcutsCheatsheet.sections.inbox.markRead", { defaultValue: "Mark as read" }) },
        { keys: ["U"], label: t("keyboardShortcutsCheatsheet.sections.inbox.markUnread", { defaultValue: "Mark as unread" }) },
      ],
    },
    {
      title: t("keyboardShortcutsCheatsheet.sections.taskDetail.title", { defaultValue: "Task detail" }),
      shortcuts: [
        { keys: ["y"], label: t("keyboardShortcutsCheatsheet.sections.taskDetail.quickArchive", { defaultValue: "Quick-archive back to inbox" }) },
        { keys: ["g", "i"], label: t("keyboardShortcutsCheatsheet.sections.taskDetail.goToInbox", { defaultValue: "Go to inbox" }) },
        { keys: ["g", "c"], label: t("keyboardShortcutsCheatsheet.sections.taskDetail.focusComment", { defaultValue: "Focus comment composer" }) },
      ],
    },
    {
      title: t("keyboardShortcutsCheatsheet.sections.decisions.title", { defaultValue: "Decisions" }),
      shortcuts: [
        { keys: ["j"], label: t("keyboardShortcutsCheatsheet.sections.decisions.moveDown", { defaultValue: "Move down" }) },
        { keys: ["↓"], label: t("keyboardShortcutsCheatsheet.sections.decisions.moveDown", { defaultValue: "Move down" }) },
        { keys: ["k"], label: t("keyboardShortcutsCheatsheet.sections.decisions.moveUp", { defaultValue: "Move up" }) },
        { keys: ["↑"], label: t("keyboardShortcutsCheatsheet.sections.decisions.moveUp", { defaultValue: "Move up" }) },
        { keys: ["Enter"], label: t("keyboardShortcutsCheatsheet.sections.decisions.openClose", { defaultValue: "Open or close selected decision" }) },
        { keys: ["x"], label: t("keyboardShortcutsCheatsheet.sections.decisions.dismiss", { defaultValue: "Dismiss selected decision" }) },
      ],
    },
    {
      title: t("keyboardShortcutsCheatsheet.sections.global.title", { defaultValue: "Global" }),
      shortcuts: [
        { keys: ["/"], label: t("keyboardShortcutsCheatsheet.sections.global.search", { defaultValue: "Search current page or quick search" }) },
        { keys: ["c"], label: t("keyboardShortcutsCheatsheet.sections.global.newTask", { defaultValue: "New task" }) },
        { keys: ["["], label: t("keyboardShortcutsCheatsheet.sections.global.toggleSidebar", { defaultValue: "Toggle sidebar" }) },
        { keys: [META_KEY, "B"], label: t("keyboardShortcutsCheatsheet.sections.global.collapseExpandSidebar", { defaultValue: "Collapse or expand sidebar" }), combo: true },
        { keys: ["]"], label: t("keyboardShortcutsCheatsheet.sections.global.togglePanel", { defaultValue: "Toggle panel" }) },
        { keys: ["?"], label: t("keyboardShortcutsCheatsheet.sections.global.showShortcuts", { defaultValue: "Show keyboard shortcuts" }) },
      ],
    },
  ];
  return (
    <>
      <div className="divide-y divide-border border-t border-border">
        {sections.map((section) => (
          <div key={section.title} className="px-5 py-3">
            <h3 className="mb-2 text-(length:--text-micro) font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </h3>
            <div className="space-y-1.5">
              {section.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.label + shortcut.keys.join()}
                  className="flex items-center justify-between gap-4"
                >
                  <span className="text-sm text-foreground/90">{shortcut.label}</span>
                  <div className="flex items-center gap-1">
                    {shortcut.keys.map((key, i) => (
                      <span key={key} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-xs text-muted-foreground">
                            {shortcut.combo
                              ? "+"
                              : t("keyboardShortcutsCheatsheet.connector.then", { defaultValue: "then" })}
                          </span>
                        )}
                        <KeyCap>{key}</KeyCap>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-border px-5 py-3">
        <p className="text-xs text-muted-foreground">
          {t("keyboardShortcutsCheatsheet.footer.press", { defaultValue: "Press " })}
          <KeyCap>Esc</KeyCap>
          {t("keyboardShortcutsCheatsheet.footer.closeHint", {
            defaultValue: " to close · Shortcuts are disabled in text fields",
          })}
        </p>
      </div>
    </>
  );
}

export function KeyboardShortcutsCheatsheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden" showCloseButton={false}>
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="text-base">
            {t("keyboardShortcutsCheatsheet.title", { defaultValue: "Keyboard shortcuts" })}
          </DialogTitle>
        </DialogHeader>
        <KeyboardShortcutsCheatsheetContent />
      </DialogContent>
    </Dialog>
  );
}
