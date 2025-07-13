"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Briefcase, Building } from "lucide-react"

const featuresData = {
  graduates: {
    title: "For Graduates",
    icon: <GraduationCap className="h-8 w-8 mb-4 text-primary" />,
    image: "https://placehold.co/600x400.png",
    imageHint: "graduate profile",
    items: [
      {
        title: "AI-Powered Profile Builder",
        description: "Create a standout professional profile in minutes. Our AI helps you highlight your skills and experiences to attract top employers.",
      },
      {
        title: "Personalized Job Matching",
        description: "Receive job recommendations that align with your career goals and qualifications. Say goodbye to endless searching.",
      },
      {
        title: "Skill Development Resources",
        description: "Access a library of courses and assessments to enhance your skills and stay competitive in the job market.",
      },
    ],
  },
  companies: {
    title: "For Companies",
    icon: <Briefcase className="h-8 w-8 mb-4 text-primary" />,
    image: "https://placehold.co/600x400.png",
    imageHint: "recruitment dashboard",
    items: [
      {
        title: "Targeted Talent Sourcing",
        description: "Efficiently find qualified candidates from a pre-vetted pool of graduates from top schools.",
      },
      {
        title: "Streamlined Recruitment",
        description: "Manage your entire hiring process, from posting jobs to scheduling interviews, all on one platform.",
      },
      {
        title: "Data-Driven Insights",
        description: "Gain valuable insights into the talent market and make informed hiring decisions with our analytics tools.",
      },
    ],
  },
  schools: {
    title: "For Schools",
    icon: <Building className="h-8 w-8 mb-4 text-primary" />,
    image: "https://placehold.co/600x400.png",
    imageHint: "academic analytics",
    items: [
      {
        title: "Strengthen Industry Ties",
        description: "Forge strategic partnerships with leading companies to enhance your curriculum and create opportunities for your students.",
      },
      {
        title: "Boost Graduate Employability",
        description: "Track and improve your graduates' employment outcomes with our comprehensive reporting and analytics.",
      },
      {
        title: "Showcase Your Institution",
        description: "Promote your school's programs and achievements to a wide audience of prospective students and corporate partners.",
      },
    ],
  },
}

function FeatureCard({ feature }: { feature: { title: string; description: string } }) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
  
    const variants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    };
  
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={variants}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-full bg-background/80 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{feature.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

export function FeaturesSection() {
    const [activeTab, setActiveTab] = React.useState("graduates");
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
  
    const imageVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    };

  return (
    <section ref={ref} className="py-24 bg-secondary/50">
      <div className="container mx-auto">
        <motion.div 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight">Everything You Need to Succeed</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Yahnu is a comprehensive ecosystem designed to bridge the gap between education and employment. Explore the powerful features tailored for every user.
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex justify-center mb-12"
          >
            <TabsList className="grid w-full max-w-md grid-cols-3">
              <TabsTrigger value="graduates">
                <GraduationCap className="mr-2 h-5 w-5" /> Graduates
              </TabsTrigger>
              <TabsTrigger value="companies">
                <Briefcase className="mr-2 h-5 w-5" /> Companies
              </TabsTrigger>
              <TabsTrigger value="schools">
                <Building className="mr-2 h-5 w-5" /> Schools
              </TabsTrigger>
            </TabsList>
          </motion.div>

          {Object.entries(featuresData).map(([key, data]) => (
            <TabsContent key={key} value={key}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                    key={activeTab} // Re-trigger animation on tab change
                    initial="hidden"
                    animate="visible"
                    variants={imageVariants}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="relative w-full h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl"
                >
                    <Image
                        src={data.image}
                        alt={`${data.title} features`}
                        fill
                        className="object-cover"
                        data-ai-hint={data.imageHint}
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
                <div className="space-y-6">
                    {data.items.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} />
                    ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
