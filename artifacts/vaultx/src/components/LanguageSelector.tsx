import { Languages, Check } from "lucide-react";
import {
  LANGUAGES,
  useI18n,
  type LanguageCode,
} from "@/lib/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSelector() {
  const { language, setLanguage } = useI18n();
  const current = LANGUAGES.find((l) => l.code === language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 h-9 px-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-all active:scale-95"
          aria-label="Select language"
        >
          <Languages size={17} />
          <span className="text-xs font-semibold uppercase hidden sm:inline">
            {current?.code}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[180px]">
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code as LanguageCode)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium">{lang.nativeName}</span>
              <span className="text-[11px] text-muted-foreground">{lang.name}</span>
            </div>
            {language === lang.code && (
              <Check size={15} className="text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
