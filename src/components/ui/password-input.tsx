
"use client"

import * as React from "react"
import { Eye, EyeOff, Copy, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useLocalization } from "@/context/localization-context"

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    hideSuggestions?: boolean,
    onSuggest?: (password: string) => void
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, type, hideSuggestions = false, onSuggest, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const { toast } = useToast();
    const { t } = useLocalization();

    const generateStrongPassword = () => {
      const length = 14;
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
      let retVal = "";
      for (let i = 0, n = charset.length; i < length; ++i) {
        retVal += charset.charAt(Math.floor(Math.random() * n));
      }
      return retVal;
    }

    const suggestPassword = () => {
        const password = generateStrongPassword();
        if (onSuggest) {
            onSuggest(password);
            navigator.clipboard.writeText(password);
            toast({
                title: t('Password Copied'),
                description: t('The suggested password has been copied to your clipboard.'),
            });
        }
    }

    return (
      <div className="relative">
        <Input
          type={showPassword ? "text" : "password"}
          className={cn("pr-10", className)}
          ref={ref}
          {...props}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5">
            <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-transparent text-muted-foreground"
                onClick={() => setShowPassword(prev => !prev)}
            >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span className="sr-only">{showPassword ? t('Hide password') : t('Show password')}</span>
            </Button>
            {!hideSuggestions && onSuggest && (
                 <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 hover:bg-transparent text-muted-foreground"
                    onClick={suggestPassword}
                >
                    <Sparkles className="h-4 w-4" />
                    <span className="sr-only">{t('Suggest strong password')}</span>
                </Button>
            )}
        </div>
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export { PasswordInput }

    