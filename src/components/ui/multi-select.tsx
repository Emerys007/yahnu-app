
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type MultiSelectOption = {
  value: string
  label: string
}

type GroupedOption = {
    label: string;
    options: MultiSelectOption[];
}

interface MultiSelectComboboxProps {
  groups: GroupedOption[]
  selected: MultiSelectOption[]
  onChange: React.Dispatch<React.SetStateAction<MultiSelectOption[]>>
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  className?: string
}

export function MultiSelectCombobox({
  groups,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No results found.",
  className,
  ...props
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (item: MultiSelectOption) => {
    onChange(selected.filter((s) => s.value !== item.value))
  }

  // Flatten all options for easy lookup
  const allOptions = React.useMemo(() => groups.flatMap(group => group.options), [groups]);

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal h-auto min-h-10", className)}
          onClick={() => setOpen(!open)}
        >
          <div className="flex gap-1 flex-wrap">
            {selected.length > 0 ? (
              selected.map((item) => (
                <Badge
                  variant="secondary"
                  key={item.value}
                  className="mr-1"
                  onClick={(e) => {
                    e.preventDefault(); // prevent popover from opening/closing
                    handleUnselect(item)
                  }}
                >
                  {item.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleUnselect(item)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyPlaceholder}</CommandEmpty>
            {groups.map((group) => (
                <CommandGroup key={group.label} heading={group.label}>
                {group.options.map((option) => {
                    const isSelected = selected.some((s) => s.value === option.value);
                    return (
                        <CommandItem
                            key={option.value}
                            onSelect={() => {
                                if (isSelected) {
                                    handleUnselect(option)
                                } else {
                                    onChange([...selected, option])
                                }
                                setOpen(true)
                            }}
                        >
                            <Check
                            className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                            )}
                            />
                            {option.label}
                        </CommandItem>
                    )
                })}
                </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
