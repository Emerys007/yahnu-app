
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

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
import { Input } from "@/components/ui/input"
import { useLocalization } from "@/context/localization-context"
import { useCountry } from "@/context/country-context"
import { phoneCountryCodes, type PhoneCountryCode } from "@/lib/phone-country-codes"
import { Flag } from "../flag"

type PhoneNumberInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const PhoneNumberInput = React.forwardRef<
  HTMLInputElement,
  PhoneNumberInputProps
>(({ className, ...props }, ref) => {
  const { country } = useCountry();
  const { language, t } = useLocalization();
  const [open, setOpen] = React.useState(false)
  
  const initialCountry = phoneCountryCodes.find(c => c.code === country.code) || phoneCountryCodes.find(c => c.code === "CI")!;
  const [selectedCountry, setSelectedCountry] = React.useState<PhoneCountryCode>(initialCountry);
  const [number, setNumber] = React.useState("");

  const handleCountrySelect = (countryCode: string) => {
    const newCountry = phoneCountryCodes.find(c => c.code === countryCode);
    if (newCountry) {
      setSelectedCountry(newCountry);
      // Also update the form value if needed
      if (props.onChange) {
        const event = {
            target: { value: `${newCountry.dial_code} ${number}` }
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event);
      }
    }
    setOpen(false)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    setNumber(newNumber);
     if (props.onChange) {
        const event = {
            target: { value: `${selectedCountry.dial_code} ${newNumber}` }
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event);
      }
  }
  
  // Update internal state if the value prop changes (e.g. from form reset)
  React.useEffect(() => {
    if (props.value === "" || props.value === undefined || props.value === null) {
      setNumber("");
      setSelectedCountry(initialCountry);
    }
  }, [props.value, initialCountry]);

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[150px] justify-between rounded-r-none"
          >
            <div className="flex items-center gap-2 truncate">
              <Flag countryCode={selectedCountry.code} />
              <span>{selectedCountry.dial_code}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={t("Search country...")} />
            <CommandList>
                <CommandEmpty>{t("No country found.")}</CommandEmpty>
                <CommandGroup>
                {phoneCountryCodes.map((c) => (
                    <CommandItem
                        key={c.code}
                        value={`${c.name[language as keyof typeof c.name]} ${c.dial_code}`}
                        onSelect={() => handleCountrySelect(c.code)}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedCountry.code === c.code ? "opacity-100" : "opacity-0"
                        )}
                    />
                    <div className="flex items-center gap-2">
                        <Flag countryCode={c.code} />
                        <span>{c.name[language as keyof typeof c.name]}</span>
                        <span className="text-muted-foreground">{c.dial_code}</span>
                    </div>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        {...props}
        ref={ref}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        className={cn("rounded-l-none", className)}
        placeholder={t("Phone Number")}
      />
    </div>
  )
});
PhoneNumberInput.displayName = "PhoneNumberInput"

