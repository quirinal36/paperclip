import { Languages } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { getLocale, setLocale, supportedLocales, useTranslation, type SupportedLocale } from "@/i18n";

const CHANGE_LANGUAGE_LABEL_KEY = "language.switcher.label";
const CHANGE_LANGUAGE_LABEL_DEFAULT = "Change language";
const MENU_LABEL_KEY = "language.menu.label";
const MENU_LABEL_DEFAULT = "Language";

/**
 * Render a locale tag in its own language (e.g. `ko` → "한국어", `fr` →
 * "Français"), falling back to the raw tag if `Intl.DisplayNames` can't name
 * it. Computed once per locale at module load — the shipped set is fixed.
 */
function nativeLanguageName(locale: string): string {
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    const name = displayNames.of(locale) ?? displayNames.of(locale.split("-")[0]);
    if (!name) return locale;
    return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
  } catch {
    return locale;
  }
}

interface LanguageOption {
  locale: SupportedLocale;
  label: string;
}

const LANGUAGE_OPTIONS: LanguageOption[] = (supportedLocales as SupportedLocale[])
  .map((locale) => ({ locale, label: nativeLanguageName(locale) }))
  .sort((a, b) => a.label.localeCompare(b.label));

type LanguageSwitcherVariant = "icon" | "menu-action";

interface LanguageSwitcherProps {
  className?: string;
  /**
   * `icon` (default): compact icon button — mirrors {@link ThemeToggle}'s icon
   * affordance for the signed-out `/auth` chrome and other headers.
   *
   * `menu-action`: full-width row with label + current language — matches the
   * surrounding `MenuAction` rows in `SidebarAccountMenu`.
   */
  variant?: LanguageSwitcherVariant;
  /** Called after the locale changes — lets a host popover dismiss itself. */
  onAfterChange?: () => void;
}

/**
 * Compact language picker. Both the signed-out `/auth` chrome (icon) and the
 * in-app account menu (menu-action) render through this component so the label,
 * option list, and switch behaviour stay in sync. Missing translations fall
 * back to English via i18next, so every locale here is selectable even before
 * it's fully translated.
 */
export function LanguageSwitcher({ className, variant = "icon", onAfterChange }: LanguageSwitcherProps) {
  // Subscribe to language changes so the checked item + label stay in sync.
  const { t } = useTranslation();
  const current = getLocale();
  const iconLabel = t(CHANGE_LANGUAGE_LABEL_KEY, { defaultValue: CHANGE_LANGUAGE_LABEL_DEFAULT });

  function handleChange(next: string) {
    if (next === current) return;
    void setLocale(next as SupportedLocale).then(() => onAfterChange?.());
  }

  const options = (align: "start" | "end") => (
    <DropdownMenuContent align={align} className="max-h-[60vh] overflow-y-auto">
      <DropdownMenuRadioGroup value={current} onValueChange={handleChange}>
        {LANGUAGE_OPTIONS.map(({ locale, label }) => (
          <DropdownMenuRadioItem key={locale} value={locale}>
            {label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  );

  if (variant === "menu-action") {
    const label = t(MENU_LABEL_KEY, { defaultValue: MENU_LABEL_DEFAULT });
    const currentName = nativeLanguageName(current);
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-accent/60",
              className,
            )}
          >
            <span className="mt-0.5 rounded-lg border border-border bg-background/70 p-2 text-muted-foreground">
              <Languages className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground">{currentName}</span>
            </span>
          </button>
        </DropdownMenuTrigger>
        {options("start")}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={iconLabel}
          title={iconLabel}
          className={cn("text-muted-foreground", className)}
        >
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      {options("end")}
    </DropdownMenu>
  );
}
