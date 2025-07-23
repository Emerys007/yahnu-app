"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight, Search, PlusCircle, Handshake } from "lucide-react"
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

const getSlides = (t: (key: string) => string) => [
    {
        role: "Graduates",
        // Corrected: Use the shorter key for the headline
        headline: t("Find Your Dream Job Today."),
        subtitle: t("Explore thousands of job opportunities tailored for you in Côte d'Ivoire. Your next career move is just a click away."),
        buttonText: t("Search for Jobs"),
        buttonIcon: <Search />,
        imageUrl: "/images/dream-job.jpg",
        imageHint: "confident graduate looking towards the future",
        href: "/register"
      },
      {
        role: "Companies",
        headline: t("Build Your Dream Team"),
        subtitle: t("Access a diverse pool of talented graduates from top schools. Find the perfect fit for your company's culture and goals."),
        buttonText: t("Post a Job Opening"),
        buttonIcon: <PlusCircle />,
        imageUrl: "/images/Build-A-Team.jpeg",
        imageHint: "diverse business team",
        href: "/register"
      },
      {
        role: "Universities",
        headline: t("Forge Industry Partnerships"),
        subtitle: t("Collaborate with leading academic institutions to shape the future of talent. Connect with the brightest minds and drive innovation."),
        buttonText: t("Become a Partner"),
        buttonIcon: <Handshake />,
        imageUrl: "/images/Industry.webp",
        imageHint: "university building and a handshake representing partnership",
        href: "/register"
      },
]

export function HeroSection() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )
  const { t } = useLocalization();
  

  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)
  
  const slides = getSlides(t);

  React.useEffect(() => {
    if (!api) {
      return
    }
 
    setCurrent(api.selectedScrollSnap())
 
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])

  const scrollTo = React.useCallback(
    (index: number) => api && api.scrollTo(index),
    [api]
  );

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
                  priority={index === 0 || index === 1}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  <AnimatePresence>
                  {current === index && (
                    <motion.div
                      className="max-w-4xl mx-auto space-y-8"
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={{
                        visible: { transition: { staggerChildren: 0.2 } },
                      }}
                    >
                      <motion.h1
                        className="text-4xl md:text-7xl font-bold tracking-tight drop-shadow-2xl leading-tight"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeInOut" } },
                        }}
                      >
                        {slide.headline}
                      </motion.h1>
                      <motion.p
                        className="text-lg md:text-2xl text-white/90 drop-shadow-xl max-w-3xl mx-auto"
                         variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeInOut", delay: 0.2 } },
                        }}
                      >
                        {slide.subtitle}
                      </motion.p>
                      <motion.div
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeInOut", delay: 0.4 } },
                        }}
                      >
                          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button size="lg" asChild className="text-base px-8 py-6">
                                <Link href={slide.href}>
                                    <div className="flex items-center gap-2">
                                        {slide.buttonText}
                                         <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                                    </div>
                                </Link>
                            </Button>
                          </motion.div>
                      </motion.div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12" />
      </Carousel>
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
    </section>
  )
}
