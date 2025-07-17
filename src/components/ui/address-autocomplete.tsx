
import React, { useState, useEffect } from "react"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { africanCountries as countryData, type Country as CountryData } from "@/lib/african-countries"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useLocalization } from "@/context/localization-context"

const OPENCAGE_API_KEY = process.env.NEXT_PUBLIC_OPENCAGE_API_KEY;

export interface Address {
  street: string
  city: string
  state: string
  zip: string
  country: string
}

interface AddressAutocompleteProps {
  value: Address
  onChange: (value: Address) => void
}

interface AddressSuggestion {
  id: string
  description: string
}

const fetchAddressSuggestions = async (query: string, countryCode: string): Promise<AddressSuggestion[]> => {
    if (!query || !OPENCAGE_API_KEY) return [];
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${OPENCAGE_API_KEY}&countrycode=${countryCode}&limit=5`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results) {
            return data.results.map((result: any, index: number) => ({
                id: result.annotations.geohash || `${result.bounds.northeast.lat}-${index}`,
                description: result.formatted,
            }));
        }
        return [];
    } catch (error) {
        console.error("Error fetching address suggestions:", error);
        return [];
    }
}

const fetchPlaceDetails = async (description: string): Promise<Address> => {
    if (!description || !OPENCAGE_API_KEY) return { street: "", city: "", state: "", zip: "", country: "" };
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(description)}&key=${OPENCAGE_API_KEY}&limit=1`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.results && data.results.length > 0) {
            const comps = data.results[0].components;
            return {
                street: `${comps.road || ''} ${comps.house_number || ''}`.trim(),
                city: comps.city || comps.town || comps.village || '',
                state: comps.state || '',
                zip: comps.postcode || '',
                country: comps.country || '',
            }
        }
        return { street: "", city: "", state: "", zip: "", country: "" };
    } catch (error) {
        console.error("Error fetching place details:", error);
        return { street: "", city: "", state: "", zip: "", country: "" };
    }
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
  const [selectedCountry, setSelectedCountry] = React.useState<CountryData | null>(null)

  useEffect(() => {
    if (value.country) {
      const country = countryData.find(c => c.name === value.country)
      setSelectedCountry(country || null)
    }
  }, [value.country])

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (search.length > 2 && selectedCountry) {
        setIsLoading(true)
        const newSuggestions = await fetchAddressSuggestions(search, selectedCountry.code)
        setSuggestions(newSuggestions)
        setIsLoading(false)
      } else {
        setSuggestions([])
      }
    }, 500)

    return () => clearTimeout(handler)
  }, [search, selectedCountry])

  const handleSelectSuggestion = async (description: string) => {
    const details = await fetchPlaceDetails(description)
    onChange({ ...details, country: selectedCountry?.name || '' })
    setSearch(description)
    setOpen(false)
  }

  return (
    <div ref={ref} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Country')}</label>
          <Select
            onValueChange={(countryName) => {
                const country = countryData.find(c => c.name === countryName)
                setSelectedCountry(country || null)
                onChange({ ...value, country: countryName, state: '' })
            }}
            value={value.country}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("Select a country")} />
            </SelectTrigger>
            <SelectContent>
              {countryData.map((country) => (
                <SelectItem key={country.code} value={country.name}>
                  {country.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Find Address')}</label>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between font-normal"
                disabled={!selectedCountry}
              >
                <span className="truncate">{search || t("Start typing an address...")}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={t("Search for an address...")}
                  value={search}
                  onValueChange={setSearch}
                  disabled={!selectedCountry}
                />
                <CommandList>
                  {isLoading && <div className="p-2 text-center text-sm">{t('Loading...')}</div>}
                  <CommandEmpty>{t('No address found.')}</CommandEmpty>
                  <CommandGroup>
                    {suggestions.map((suggestion) => (
                      <CommandItem
                        key={suggestion.id}
                        value={suggestion.description}
                        onSelect={() => handleSelectSuggestion(suggestion.description)}
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
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('Street Address')}</label>
          <Input 
            value={value.street} 
            onChange={e => onChange({...value, street: e.target.value})}
            placeholder="e.g. 123 Main St"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('City')}</label>
          <Input 
            value={value.city}
            onChange={e => onChange({...value, city: e.target.value})}
            placeholder="e.g. Abidjan"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('State / Province')}</label>
            <Select
                onValueChange={(stateName) => onChange({ ...value, state: stateName })}
                value={value.state}
                disabled={!selectedCountry || !selectedCountry.states.length}
            >
                <SelectTrigger>
                    <SelectValue placeholder={t("Select a state")} />
                </SelectTrigger>
                <SelectContent>
                    {selectedCountry?.states.map((state) => (
                        <SelectItem key={state} value={state}>
                            {state}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('ZIP / Postal Code')}</label>
          <Input
            value={value.zip}
            onChange={e => onChange({...value, zip: e.target.value})}
            placeholder="e.g. 10001"
          />
        </div>
      </div>
    </div>
  )
})
AddressAutocomplete.displayName = "AddressAutocomplete"
