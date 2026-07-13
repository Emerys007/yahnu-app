
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
  icon?: React.ComponentType<{ className?: string }>
}

interface MultiSelectProps {
  options?: MultiSelectOption[]
  groups?: { label: string; options: MultiSelectOption[] }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyPlaceholder?: string
  className?: string
}

type MultiSelectGroup = { label: string; options: MultiSelectOption[] };
type MultiSelectComboboxProps = Omit<MultiSelectProps, 'options' | 'selected' | 'onChange'> & {
  groups: MultiSelectGroup[];
  selected: MultiSelectOption[];
  onChange: (selected: MultiSelectOption[]) => void;
};

export function MultiSelectCombobox({ groups, selected, onChange, ...props }: MultiSelectComboboxProps) {
  const options = groups.flatMap((group) => group.options);
  return <MultiSelect {...props} options={options} selected={selected.map((option) => option.value)} onChange={(values) => onChange(options.filter((option) => values.includes(option.value)))} />;
}

export function MultiSelect({
  options,
  groups,
  selected,
  onChange,
  placeholder = "Select options...",
  searchPlaceholder = "Search...",
  emptyPlaceholder = "No results found.",
  className,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleUnselect = (value: string) => {
    onChange(selected.filter((s) => s !== value))
  }

  const allOptions = React.useMemo(() => {
    if (groups) {
      return groups.flatMap(group => group.options);
    }
    return options || [];
  }, [options, groups]);

  const selectedOptions = selected.map(value => allOptions.find(option => option.value === value)).filter(Boolean) as MultiSelectOption[];

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
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <Badge
                  variant="secondary"
                  key={option.value}
                  className="mr-1"
                  onClick={(e) => {
                    e.preventDefault();
                    handleUnselect(option.value)
                  }}
                >
                  {option.label}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(option.value)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={() => handleUnselect(option.value)}
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
            {groups ? (
                groups.map(group => (
                    <CommandGroup key={group.label} heading={group.label}>
                         {group.options.map((option) => {
                            const isSelected = selected.includes(option.value);
                            return (
                                <CommandItem
                                    key={option.value}
                                    onSelect={() => {
                                        if (isSelected) {
                                            handleUnselect(option.value)
                                        } else {
                                            onChange([...selected, option.value])
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
                                     {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                                    {option.label}
                                </CommandItem>
                            )
                        })}
                    </CommandGroup>
                ))
            ) : (
                 <CommandGroup>
                    {allOptions.map((option) => {
                        const isSelected = selected.includes(option.value);
                        return (
                            <CommandItem
                                key={option.value}
                                onSelect={() => {
                                    if (isSelected) {
                                        handleUnselect(option.value)
                                    } else {
                                        onChange([...selected, option.value])
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
                                {option.icon && <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                                {option.label}
                            </CommandItem>
                        )
                    })}
                </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
