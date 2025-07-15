"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Loader2 } from "lucide-react"

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
import { useLocalization } from "@/context/localization-context"
import { Input } from "./input"
import { Label } from "./label"

type AddressSuggestion = {
  description: string
  place_id: string
}

type Address = {
    street: string
    city: string
    state: string
    zip: string
    country: string
}

type AddressAutocompleteProps = {
  value: Address
  onChange: (address: Address) => void
}

// Mock address data for demonstration purposes
const mockAddresses: { [key: string]: Address } = {
  "ChIJ--acW_HJxkcRcrwAb9c_xgA": { street: "123 Main St", city: "Abidjan", state: "Lagunes", zip: "10001", country: "Côte d'Ivoire" },
  "ChIJI_LOK_zJxkcR6N4Ysw_G-Eg": { street: "456 Market St", city: "Abidjan", state: "Lagunes", zip: "10002", country: "Côte d'Ivoire" },
  "ChIJN1-E9qjHxkcR4xYwS_b_xGc": { street: "789 Park Ave", city: "New York", state: "NY", zip: "10021", country: "United States" },
  "ChIJr2prqsdc1BIR8AsL4y8dJ3Q": { street: "10 Rue de Rivoli", city: "Paris", state: "Île-de-France", zip: "75001", country: "France" },
}

const mockSuggestions: AddressSuggestion[] = [
  { description: "123 Main St, Abidjan, Côte d'Ivoire", place_id: "ChIJ--acW_HJxkcRcrwAb9c_xgA" },
  { description: "456 Market St, Abidjan, Côte d'Ivoire", place_id: "ChIJI_LOK_zJxkcR6N4Ysw_G-Eg" },
  { description: "789 Park Ave, New York, NY, USA", place_id: "ChIJN1-E9qjHxkcR4xYwS_b_xGc" },
  { description: "10 Rue de Rivoli, Paris, France", place_id: "ChIJr2prqsdc1BIR8AsL4y8dJ3Q" },
]

// Mock API fetching
const fetchSuggestions = async (query: string): Promise<AddressSuggestion[]> => {
  console.log("Searching for:", query)
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!query) {
        resolve([])
      } else {
        const filtered = mockSuggestions.filter(s => s.description.toLowerCase().includes(query.toLowerCase()))
        resolve(filtered)
      }
    }, 500)
  })
}

const fetchPlaceDetails = async (placeId: string): Promise<Address> => {
   return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockAddresses[placeId] || { street: "", city: "", state: "", zip: "", country: "" })
    }, 300)
  })
}

export const AddressAutocomplete = React.forwardRef<
  HTMLDivElement,
  AddressAutocompleteProps
>(({ value, onChange }, ref) => {
  const { t } = useLocalization()
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [suggestions, setSuggestions] = React.useState<AddressSuggestion[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSearchChange = async (newSearch: string) => {
    setSearch(newSearch)
    if (newSearch.length > 2) {
      setIsLoading(true)
      const results = await fetchSuggestions(newSearch)
      setSuggestions(results)
      setIsLoading(false)
    } else {
      setSuggestions([])
    }
  }

  const handleSelect = async (placeId: string) => {
    const details = await fetchPlaceDetails(placeId)
    onChange(details)
    const suggestion = mockSuggestions.find(s => s.place_id === placeId)
    setSearch(suggestion?.description || "")
    setOpen(false)
  }

  return (
    <div ref={ref} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address-search">{t('Search for an address')}</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-between h-auto"
            >
              <span className="truncate">{search || t("Start typing an address...")}</span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t("Type to search...")}
                value={search}
                onValueChange={handleSearchChange}
              />
              <CommandList>
                {isLoading && <div className="p-2 flex justify-center"><Loader2 className="h-4 w-4 animate-spin"/></div>}
                {!isLoading && suggestions.length === 0 && search.length > 2 && (
                    <CommandEmpty>{t("No address found.")}</CommandEmpty>
                )}
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion.place_id}
                      value={suggestion.description}
                      onSelect={() => handleSelect(suggestion.place_id)}
                    >
                      {suggestion.description}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="street">{t('Street Address')}</Label>
          <Input id="street" value={value.street} onChange={(e) => onChange({...value, street: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t('City')}</Label>
          <Input id="city" value={value.city} onChange={(e) => onChange({...value, city: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">{t('State / Province')}</Label>
          <Input id="state" value={value.state} onChange={(e) => onChange({...value, state: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="zip">{t('ZIP / Postal Code')}</Label>
          <Input id="zip" value={value.zip} onChange={(e) => onChange({...value, zip: e.target.value})} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">{t('Country')}</Label>
          <Input id="country" value={value.country} onChange={(e) => onChange({...value, country: e.target.value})} />
        </div>
      </div>
    </div>
  )
})
AddressAutocomplete.displayName = "AddressAutocomplete"
