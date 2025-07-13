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
} from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"

const slides = [
  {
    role: "Graduates",
    headline: "Find Your Dream Job Today",
    subtitle: "Explore thousands of job opportunities tailored for you in Côte d'Ivoire. Your next career move is just a click away.",
    buttonText: "Search for Jobs",
    buttonIcon: <Search className="mr-2 h-4 w-4" />,
    imageUrl: "https://placehold.co/1920x1080.png",
    imageHint: "confident graduate future",
    href: "/jobs"
  },
  {
    role: "Companies",
    headline: "Build Your Dream Team",
    subtitle: "Access a diverse pool of talented graduates from top schools. Find the perfect fit for your company's culture and goals.",
    buttonText: "Post a Job Opening",
    buttonIcon: <PlusCircle className="mr-2 h-4 w-4" />,
    imageUrl: "https://placehold.co/1920x1080.png",
    imageHint: "team collaboration office",
    href: "/company-profile"
  },
  {
    role: "Universities",
    headline: "Forge Industry Partnerships",
    subtitle: "Collaborate with leading academic institutions to shape the future of talent. Connect with the brightest minds and drive innovation.",
    buttonText: "Become a Partner",
    buttonIcon: <Handshake className="mr-2 h-4 w-4" />,
    imageUrl: "https://placehold.co/1920x1080.png",
    imageHint: "academic industry partnership",
    href: "/register"
  },
]

export function HeroSection() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  return (
    <section className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
      <Carousel
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
              <div className="relative w-full h-[60vh] md:h-[80vh]">
                <Image
                  src={slide.imageUrl}
                  alt={slide.headline}
                  layout="fill"
                  objectFit="cover"
                  className="brightness-50"
                  data-ai-hint={slide.imageHint}
                  priority={index === 0}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-4">
                  <div className="max-w-3xl space-y-6">
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight drop-shadow-lg">
                      {slide.headline}
                    </h1>
                    <p className="text-lg md:text-xl text-white/90 drop-shadow-md">
                      {slide.subtitle}
                    </p>
                    <Button size="lg" asChild>
                      <Link href={slide.href}>
                        {slide.buttonIcon}
                        {slide.buttonText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
        <CarouselNext className="absolute right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex" />
      </Carousel>
    </section>
  )
}
