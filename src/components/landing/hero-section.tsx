
"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"
import { ArrowRight, Search, PlusCircle, Handshake } from "lucide-react"

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
        headline: t("Unlock Your Potential. Find Your Dream Job Today."),
        subtitle: t("Yahnu connects you with thousands of exclusive job opportunities in Côte d'Ivoire tailored to your unique skills and aspirations. Your future starts here."),
        buttonText: t("Explore Job Openings"),
        buttonIcon: <Search className="mr-2 h-4 w-4" />,
        imageUrl: "/images/dream-job.jpg",
        imageHint: "confident graduate looking towards the future",
        href: "/dashboard/jobs"
      },
      {
        role: "Companies",
        headline: t("Build a World-Class Team, Effortlessly."),
        subtitle: t("Tap into a curated network of exceptional graduates from premier institutions. Discover the perfect candidates to drive your company's growth and innovation."),
        buttonText: t("Find Top Talent"),
        buttonIcon: <PlusCircle className="mr-2 h-4 w-4" />,
        imageUrl: "/images/uni-partnership.jpg",
        imageHint: "diverse team collaborating in a modern office",
        href: "/dashboard/company-profile"
      },
      {
        role: "Schools",
        headline: t("Shape the Future of Talent."),
        subtitle: t("Partner with leading companies to create a direct pipeline for your graduates. Enhance your curriculum, boost graduate employment, and elevate your institution's prestige."),
        buttonText: t("Forge Industry Partnerships"),
        buttonIcon: <Handshake className="mr-2 h-4 w-4" />,
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
  const slides = getSlides(t);

  const [api, setApi] = React.useState<CarouselApi>()
  const [current, setCurrent] = React.useState(0)

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
                  className="object-cover brightness-[0.4]"
                  data-ai-hint={slide.imageHint}
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  <div className="max-w-4xl space-y-8">
                    <h1 className="text-4xl md:text-7xl font-bold tracking-tight drop-shadow-2xl leading-tight">
                      {slide.headline}
                    </h1>
                    <p className="text-lg md:text-2xl text-white/90 drop-shadow-xl max-w-3xl">
                      {slide.subtitle}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button size="lg" asChild className="text-base px-8 py-6">
                            <Link href={slide.href}>
                                <>
                                    {slide.buttonIcon}
                                    {slide.buttonText}
                                </>
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" className="text-base px-8 py-6 bg-transparent text-white border-white hover:bg-white hover:text-black" asChild>
                            <Link href="/register">
                                <>
                                    {t('Create an Account')}
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </>
                            </Link>
                        </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-12 w-12" />
      </Carousel>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex md:hidden space-x-2">
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
