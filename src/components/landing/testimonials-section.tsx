
"use client"

import * as React from "react"
import Image from "next/image"
import Autoplay from "embla-carousel-autoplay"
import { motion, useInView } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"

const testimonials = [
  {
    quote: "Yahnu revolutionized our hiring process. We found exceptional candidates who were a perfect fit for our company culture. It's an indispensable tool for any employer in Côte d'Ivoire.",
    name: "Aïssata Touré",
    title: "HR Manager, Tech Solutions Abidjan",
    image: "/images/yahnu-logo.png",
  },
  {
    quote: "As a recent graduate, Yahnu was instrumental in my job search. The platform is intuitive, and the AI-powered recommendations were spot-on. I landed my dream job within weeks!",
    name: "Koffi N'Goran",
    title: "Software Engineer, Innovate Inc.",
    image: "/images/yahnu-logo.png",
  },
  {
    quote: "Yahnu has been a game-changer for our university. It has strengthened our ties with the industry and significantly boosted our graduates' employment rates. We're proud to be a partner.",
    name: "Dr. Fatou Bamba",
    title: "Dean of Career Services, INP-HB",
    image: "/images/yahnu-logo.png",
  },
];

export function TestimonialsSection() {
  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
      };

  return (
    <motion.section
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={sectionVariants}
        className="py-24 bg-secondary/50"
    >
      <div className="container mx-auto">
        <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
                Trusted by Leaders, Loved by Graduates
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500 dark:text-gray-400">
                Hear what our partners and users have to say about their experience with Yahnu.
            </p>
        </div>

        <Carousel
          plugins={[plugin.current]}
          className="w-full max-w-4xl mx-auto"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            {testimonials.map((testimonial, index) => (
              <CarouselItem key={index}>
                <div className="p-4">
                  <Card className="bg-background/80 backdrop-blur-sm border-border/50 shadow-lg">
                    <CardContent className="pt-6">
                      <p className="text-lg italic text-center text-gray-700 dark:text-gray-300">
                        "{testimonial.quote}"
                      </p>
                      <div className="flex items-center justify-center mt-6">
                        <div className="relative h-12 w-12 rounded-full overflow-hidden mr-4">
                            <Image
                                src={testimonial.image}
                                alt={testimonial.name}
                                fill
                                sizes="48px"
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <p className="font-semibold">{testimonial.name}</p>
                            <p className="text-sm text-muted-foreground">{testimonial.title}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      </div>
    </motion.section>
  );
}
