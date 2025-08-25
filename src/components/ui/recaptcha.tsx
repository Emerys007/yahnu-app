
"use client"

import { useEffect, useRef } from 'react'

interface ReCaptchaProps {
  siteKey: string
  onVerify: (token: string) => void
  onExpire?: () => void
  size?: 'compact' | 'normal'
  theme?: 'light' | 'dark'
  action?: string
}

export function ReCaptcha({ 
  siteKey, 
  onVerify, 
  onExpire,
  size = 'normal',
  theme = 'light',
  action = 'LOGIN'
}: ReCaptchaProps) {
  const recaptchaRef = useRef<HTMLDivElement>(null)
  const widgetId = useRef<number | null>(null)

  useEffect(() => {
    const loadReCaptcha = () => {
      if (typeof window !== 'undefined' && window.grecaptcha && recaptchaRef.current) {
        widgetId.current = window.grecaptcha.render(recaptchaRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'expired-callback': onExpire,
          size,
          theme,
          'data-action': action
        })
      }
    }

    // Load the reCAPTCHA script if not already loaded
    if (!window.grecaptcha) {
      const script = document.createElement('script')
      script.src = 'https://www.google.com/recaptcha/enterprise.js'
      script.async = true
      script.defer = true
      script.onload = loadReCaptcha
      document.head.appendChild(script)
    } else {
      loadReCaptcha()
    }

    return () => {
      if (widgetId.current !== null && window.grecaptcha) {
        window.grecaptcha.reset(widgetId.current)
      }
    }
  }, [siteKey, onVerify, onExpire, size, theme, action])

  return <div ref={recaptchaRef} className="g-recaptcha" />
}

// Extend the Window interface to include grecaptcha
declare global {
  interface Window {
    grecaptcha: {
      render: (container: HTMLElement, parameters: any) => number
      reset: (widgetId?: number) => void
      getResponse: (widgetId?: number) => string
    }
  }
}
