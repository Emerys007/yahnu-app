
"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function ScrollToTop() {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)

  const isDashboard = pathname.startsWith("/dashboard")

  const toggleVisibility = () => {
    // This assumes the main scrollable element is the window or a specific container
    // For the dashboard layout, we might need to target the main content pane
    const scrollableElement = document.querySelector('main');
    if (scrollableElement && scrollableElement.scrollTop > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  const scrollToTop = () => {
     const scrollableElement = document.querySelector('main');
     if (scrollableElement) {
        scrollableElement.scrollTo({
            top: 0,
            behavior: "smooth",
        });
     }
  }

  useEffect(() => {
    const scrollableElement = document.querySelector('main');
    if (scrollableElement) {
        scrollableElement.addEventListener("scroll", toggleVisibility)
    }

    return () => {
      if (scrollableElement) {
        scrollableElement.removeEventListener("scroll", toggleVisibility)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed bottom-6 z-50",
            isDashboard ? "right-6" : "right-4"
          )}
        >
          <Button
            size="icon"
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="rounded-full h-12 w-12"
          >
            <ChevronUp className="h-6 w-6" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
