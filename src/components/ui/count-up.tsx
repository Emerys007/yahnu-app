
"use client"

import { useEffect, useRef } from "react"
import { animate, useInView } from "framer-motion"

type CountUpProps = {
  from?: number
  end: number
  duration?: number
  suffix?: string
  prefix?: string
}

export function CountUp({ from = 0, end, duration = 1.5, suffix, prefix }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  useEffect(() => {
    if (inView && ref.current) {
      const controls = animate(from, end, {
        duration,
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent = value.toFixed(0);
          }
        },
      });
      return () => controls.stop();
    }
  }, [inView, from, end, duration])

  return (
    <>
      {prefix}
      <span ref={ref}>{from}</span>
      {suffix}
    </>
  )
}
