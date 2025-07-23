
"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { Search, PlusCircle, Handshake } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"
import { useLocalization } from "@/context/localization-context"
import { cn } from "@/lib/utils"

const getSlides = (t: (key: string, args?: any) => string, country: string) => [
    {
        role: "Graduates",
        headline: t("hero.graduates.headline"),
        subtitle: t("hero.graduates.subtitle", { country }),
        buttonText: t("hero.graduates.buttonText"),
        buttonIcon: <Search />,
        imageUrl: "/images/hero/dream-job.jpg",
        imageHint: "confident graduate looking towards the future",
        href: "/dashboard/jobs"
      },
      {
        role: "Companies",
        headline: t("hero.companies.headline"),
        subtitle: t("hero.companies.subtitle"),
        buttonText: t("hero.companies.buttonText"),
        buttonIcon: <PlusCircle />,
        imageUrl: "/images/hero/build-a-team.jpeg",
        imageHint: "diverse team collaborating in a modern office",
        href: "/dashboard/company-profile"
      },
      {
        role: "Universities",
        headline: t("hero.universities.headline"),
        subtitle: t("hero.universities.subtitle"),
        buttonText: t("hero.universities.buttonText"),
        buttonIcon: <Handshake />,
        imageUrl: "/images/hero/industry-partnership.webp",
        imageHint: "university building and a handshake representing partnership",
        href: "/register"
      },
]

export function HeroSection() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )
  const { t, countryName } = useLocalization();
  const slides = getSlides(t, countryName);

  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  const [activeSlide, setActiveSlide] = React.useState(slides[0])

  React.useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrent(api.selectedScrollSnap())
    setActiveSlide(slides[api.selectedScrollSnap()])
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
      setActiveSlide(slides[api.selectedScrollSnap()])
    })
  }, [api, slides])

  const scrollTo = React.useCallback(
    (index: number) => api && api.scrollTo(index),
    [api]
  );

  const titleVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const subtitleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut", delay: 0.2 } },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut", delay: 0.4 } },
  };

  return (
    <section className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden">
      <Carousel
        setApi={setApi}
        plugins={[plugin.current]}
        className="w-full h-full"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
        opts={{
          loop: true,
        }}
      >
        <CarouselContent>
          {slides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className="relative w-full h-[70vh] md:h-[90vh]">
                <Image
                  src={slide.imageUrl}
                  alt={slide.headline}
                  fill
                  sizes="100vw"
                  className="object-cover"
                  data-ai-hint={slide.imageHint}
                  priority
                />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
            <div className="max-w-4xl space-y-8">
                <AnimatePresence mode="wait">
                    {activeSlide && (
                        <motion.div
                            key={activeSlide.headline}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                        >
                            <motion.h1 
                                variants={titleVariants}
                                className="text-4xl md:text-7xl font-bold tracking-tight drop-shadow-2xl leading-tight"
                            >
                                {activeSlide.headline}
                            </motion.h1>
                            <motion.p 
                                variants={subtitleVariants}
                                className="text-lg md:text-2xl text-white/90 drop-shadow-xl max-w-3xl mx-auto mt-4"
                            >
                                {activeSlide.subtitle}
                            </motion.p>
                            <motion.div variants={buttonVariants} className="mt-8">
                                <Button size="lg" asChild className="text-base px-8 py-6">
                                    <Link href={activeSlide.href}>
                                        <div className="flex items-center gap-2">
                                            {activeSlide.buttonIcon}
                                            {activeSlide.buttonText}
                                        </div>
                                    </Link>
                                </Button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>

        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12" />
      
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
            {slides.map((_, index) => (
            <button
                key={index}
                onClick={() => scrollTo(index)}
                className={cn(
                "h-2 w-2 rounded-full bg-white/50 transition-all duration-300",
                current === index ? "w-4 bg-white" : "hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1}`}
            />
            ))}
        </div>
      </Carousel>
    </section>
  )
}
