import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@/i18n";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LanguageSelectorProps {
  isCollapsed?: boolean;
}

export function LanguageSelector({ isCollapsed = false }: LanguageSelectorProps) {
  const { i18n, t } = useTranslation();
  const currentLang = LANGUAGES.find((l) => l.code === i18n.language) ?? LANGUAGES[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "w-full text-gray-600 hover:text-blue-700 hover:bg-blue-50 transition-colors",
            isCollapsed ? "justify-center px-2" : "justify-start gap-2"
          )}
          title={isCollapsed ? t("language.select") : undefined}
        >
          <Globe className="h-4 w-4 shrink-0" />
          {!isCollapsed && (
            <span className="text-xs font-medium truncate">
              {currentLang.flag} {currentLang.name}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-52 max-h-80 overflow-y-auto"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              i18n.language === lang.code && "bg-blue-50 text-blue-700 font-medium"
            )}
          >
            <span className="text-base">{lang.flag}</span>
            <span className="text-sm">{lang.name}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-blue-600 text-xs">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
