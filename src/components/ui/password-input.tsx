
"use client"

import * as React from "react"
import { Eye, EyeOff, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip"

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hideSuggestions?: boolean,
    onSuggest?: (password: string) => void
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, type, hideSuggestions = false, onSuggest, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const { toast } = useToast();

    const secureIndex = (length: number) => {
      const limit = 256 - (256 % length)
      const byte = new Uint8Array(1)
      do crypto.getRandomValues(byte); while (byte[0] >= limit)
      return byte[0] % length
    }

    const generateStrongPassword = () => {
      const groups = [
        "abcdefghijklmnopqrstuvwxyz",
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
        "0123456789",
        "!@#$%^&*()_+-=[]{}:,.?",
      ]
      const charset = groups.join("")
      const characters = groups.map((group) => group[secureIndex(group.length)])
      while (characters.length < 20) characters.push(charset[secureIndex(charset.length)])
      for (let index = characters.length - 1; index > 0; index -= 1) {
        const swapIndex = secureIndex(index + 1)
        ;[characters[index], characters[swapIndex]] = [characters[swapIndex], characters[index]]
      }
      return characters.join("")
    }

    const suggestPassword = () => {
        const password = generateStrongPassword();
        if (onSuggest) {
            onSuggest(password);
            void navigator.clipboard.writeText(password)
              .then(() => toast({
                  title: 'Mot de passe copié',
                  description: 'Un mot de passe fort a été copié dans votre presse-papiers.',
              }))
              .catch(() => toast({
                  title: 'Mot de passe généré',
                  description: "La copie automatique n'est pas disponible dans ce navigateur.",
              }));
        }
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-20", className)}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 pr-1 flex items-center text-sm leading-5">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                         <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-transparent text-muted-foreground"
                            onClick={() => setShowPassword(prev => !prev)}
                        >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            <span className="sr-only">{showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{showPassword ? 'Cacher' : 'Afficher'} le mot de passe</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
            {!hideSuggestions && onSuggest && (
                 <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                             <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 hover:bg-transparent text-muted-foreground"
                                onClick={suggestPassword}
                            >
                                <Sparkles className="h-4 w-4" />
                                <span className="sr-only">Suggérer un mot de passe fort</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Suggérer un mot de passe</p>
                        </TooltipContent>
                    </Tooltip>
                 </TooltipProvider>
            )}
        </div>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }
