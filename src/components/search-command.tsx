"use client"

import * as React from "react"
import { Search as SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import {
  getSearchableDashboardNavigation,
  resolveDashboardLabel,
} from "@/lib/dashboard-navigation"

export function SearchCommand() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()
  const { role } = useAuth()
  const { language, t } = useLocalization()

  const groups = React.useMemo(() => getSearchableDashboardNavigation(role), [role])

  React.useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const navigate = React.useCallback((href: string) => {
    setOpen(false)
    router.push(href)
  }, [router])

  const searchLabel = t("common.search") === "common.search" ? (language === "en" ? "Search" : "Rechercher") : t("common.search")
  const searchPlaceholder = t("common.search_placeholder") === "common.search_placeholder"
    ? (language === "en" ? "Search your workspace..." : "Rechercher dans votre espace...")
    : t("common.search_placeholder")
  const emptyLabel = t("common.no_results_found") === "common.no_results_found"
    ? (language === "en" ? "No results found." : "Aucun résultat trouvé.")
    : t("common.no_results_found")

  return (
    <>
      <Button
        variant="outline"
        className="w-full justify-start text-muted-foreground sm:w-64"
        onClick={() => setOpen(true)}
        aria-label={searchLabel}
      >
        <SearchIcon className="mr-2 h-4 w-4" aria-hidden="true" />
        <span className="hidden lg:inline-flex">{searchLabel}</span>
        <span className="ml-auto hidden lg:inline-flex">
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl K
          </kbd>
        </span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={searchPlaceholder} />
        <CommandList>
          <CommandEmpty>{emptyLabel}</CommandEmpty>

          {groups.map((group, groupIndex) => (
            <React.Fragment key={`${group.id}-${groupIndex}`}>
              {groupIndex > 0 ? <CommandSeparator /> : null}
              <CommandGroup heading={resolveDashboardLabel(group.label, t, language)}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={`${resolveDashboardLabel(item.label, t, language)} ${item.path}`}
                    onSelect={() => navigate(item.path)}
                  >
                    <item.icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {resolveDashboardLabel(item.label, t, language)}
                  </CommandItem>
                ))}
              </CommandGroup>
            </React.Fragment>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  )
}
