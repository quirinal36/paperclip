import { useEffect, useMemo, useState } from "react";
import { Check, Copy } from "lucide-react";
import type { ToolMcpGatewayTokenCreated, ToolMcpGatewayWithTokens } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/context/ToastContext";
import { useTranslation } from "@/i18n";
import { cn } from "@/lib/utils";
import { formatSnippetConfig, maskedTokenLabel, orderedSnippets } from "./gateway-helpers";

type PanelKey = string; // snippet client key, or "raw_url"

/**
 * "Connect a client" dialog (PAP-11178 design of record). Shows the copy-paste
 * config for each supported client plus a raw URL fallback. If a token was just
 * minted it can be revealed once here; otherwise the config carries a masked
 * placeholder and the value never persists in the DOM.
 */
export function ConnectClientDialog({
  gateway,
  open,
  onOpenChange,
  createdToken,
}: {
  gateway: ToolMcpGatewayWithTokens;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createdToken?: ToolMcpGatewayTokenCreated | null;
}) {
  const { pushToast } = useToast();
  const { t } = useTranslation();
  const snippets = useMemo(() => orderedSnippets(gateway.clientSnippets ?? []), [gateway.clientSnippets]);
  const endpoint = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${gateway.endpointPath}`;
  }, [gateway.endpointPath]);

  const [active, setActive] = useState<PanelKey>(snippets[0]?.client ?? "raw_url");
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    if (open) {
      setActive(snippets[0]?.client ?? "raw_url");
      setRevealed(false);
    }
  }, [open, snippets]);

  async function copyText(value: string, label: string) {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
        throw new Error(t("connectClientDialog.toast.clipboardUnavailable", { defaultValue: "Clipboard access is unavailable." }));
      }
      await navigator.clipboard.writeText(value);
      pushToast({ title: t("connectClientDialog.toast.copied", { defaultValue: "Copied" }), body: label, tone: "success" });
    } catch (error) {
      pushToast({
        title: t("connectClientDialog.toast.copyFailed", { defaultValue: "Copy failed" }),
        body: error instanceof Error ? error.message : t("connectClientDialog.toast.clipboardUnavailable", { defaultValue: "Clipboard access is unavailable." }),
        tone: "error",
      });
    }
  }

  const activeSnippet = snippets.find((snippet) => snippet.client === active) ?? null;
  const configText = activeSnippet ? formatSnippetConfig(activeSnippet.config) : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("connectClientDialog.title", { defaultValue: "Connect a client" })}</DialogTitle>
          <DialogDescription>
            {t("connectClientDialog.description", { defaultValue: "Pick how you’ll point your client at this gateway." })}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-(--gtc-10)">
          <nav
            className="flex gap-1 overflow-x-auto sm:flex-col"
            aria-label={t("connectClientDialog.clientsNav", { defaultValue: "Clients" })}
          >
            {snippets.map((snippet) => (
              <button
                key={snippet.client}
                type="button"
                onClick={() => setActive(snippet.client)}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                  active === snippet.client
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground hover:bg-muted/60",
                )}
              >
                {snippet.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setActive("raw_url")}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-left text-sm transition-colors",
                active === "raw_url"
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60",
              )}
            >
              {t("connectClientDialog.rawUrl.tab", { defaultValue: "Raw URL" })}
            </button>
          </nav>

          <div className="min-w-0 space-y-3">
            {active === "raw_url" ? (
              <div className="space-y-1.5">
                <div className="text-sm font-medium text-foreground">
                  {t("connectClientDialog.rawUrl.endpointUrl", { defaultValue: "Endpoint URL" })}
                </div>
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
                    {endpoint}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void copyText(
                        endpoint,
                        t("connectClientDialog.rawUrl.endpointUrl", { defaultValue: "Endpoint URL" }),
                      )
                    }
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {t("connectClientDialog.actions.copy", { defaultValue: "Copy" })}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("connectClientDialog.rawUrl.authenticate.prefix", { defaultValue: "Authenticate with " })}
                  <code>Authorization: Bearer &lt;token&gt;</code>
                  {t("connectClientDialog.rawUrl.authenticate.suffix", { defaultValue: " over streamable HTTP." })}
                </p>
              </div>
            ) : activeSnippet ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">{activeSnippet.label}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void copyText(
                        configText,
                        t("connectClientDialog.toast.snippetConfig", {
                          defaultValue: "{{label}} config",
                          label: activeSnippet.label,
                        }),
                      )
                    }
                  >
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {t("connectClientDialog.actions.copy", { defaultValue: "Copy" })}
                  </Button>
                </div>
                <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground">
                  {configText}
                </pre>
                {activeSnippet.notes.length > 0 ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {activeSnippet.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t("connectClientDialog.emptySnippets", {
                  defaultValue: "No client snippets available for this gateway.",
                })}
              </p>
            )}

            <div className="space-y-1.5 rounded-md border border-border p-3">
              <div className="text-xs font-medium text-muted-foreground">
                {t("connectClientDialog.token.heading", { defaultValue: "Token" })}
              </div>
              {createdToken ? (
                <div className="flex items-center gap-2">
                  <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1.5 font-mono text-xs text-foreground">
                    {revealed ? createdToken.token : maskedTokenLabel(createdToken)}
                  </code>
                  {revealed ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        void copyText(
                          createdToken.token,
                          t("connectClientDialog.toast.accessToken", { defaultValue: "Access token" }),
                        )
                      }
                    >
                      <Copy className="mr-1 h-3.5 w-3.5" />
                      {t("connectClientDialog.actions.copy", { defaultValue: "Copy" })}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setRevealed(true)}>
                      {t("connectClientDialog.actions.show", { defaultValue: "Show" })}
                    </Button>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("connectClientDialog.token.mint.prefix", { defaultValue: "Mint a token on the " })}
                  <span className="font-medium">
                    {t("connectClientDialog.token.mint.tokensTab", { defaultValue: "Tokens" })}
                  </span>
                  {t("connectClientDialog.token.mint.middle", {
                    defaultValue: " tab, then paste it where the snippet shows ",
                  })}
                  <code>Bearer …</code>
                  {t("connectClientDialog.token.mint.suffix", {
                    defaultValue: ". You won’t see a token’s full value again after it’s created.",
                  })}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("connectClientDialog.token.warning", {
                  defaultValue:
                    "Treat this like a password. Anyone with the token can call exactly the tools this gateway allows. If it leaks, revoke it — the client goes silent immediately.",
                })}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            <Check className="mr-1.5 h-4 w-4" />
            {t("connectClientDialog.actions.done", { defaultValue: "Done" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
