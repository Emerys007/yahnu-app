"use client"

import { useState, useMemo } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Briefcase, Building, ArrowRight } from "lucide-react"
import { useLocalization } from '@/context/localization-context'
import Link from 'next/link'
import { MainNav } from '@/components/landing/main-nav'
import { Footer } from '@/components/landing/footer'

const jobListingsData = {
  en: [
    {
      slug: "tech-lead-orange",
      title: "Tech Lead - Mobile Money",
      company: "Orange Côte d'Ivoire",
      location: "Abidjan, Côte d'Ivoire",
      type: "Full-time",
      workplace: "hybrid",
      tags: ["Fintech", "Mobile", "Management", "API"],
    },
    {
      slug: "agronomist-sifca",
      title: "Agronomist",
      company: "SIFCA",
      location: "Yamoussoukro, Côte d'Ivoire",
      type: "Full-time",
      workplace: "on-site",
      tags: ["Agriculture", "Agronomy", "Field Work"],
    },
    {
      slug: "data-analyst-bridge-bank",
      title: "Data Analyst",
      company: "Bridge Bank Group",
      location: "Abidjan, Côte d'Ivoire",
      type: "Full-time",
      workplace: "on-site",
      tags: ["Finance", "Data Analysis", "SQL", "Power BI"],
    },
    {
      slug: "marketing-manager-solibra",
      title: "Marketing Manager",
      company: "SOLIBRA",
      location: "Abidjan, Côte d'Ivoire",
      type: "Full-time",
      workplace: "hybrid",
      tags: ["FMCG", "Marketing", "Branding"],
    },
    {
      slug: "logistics-coordinator-bollore",
      title: "Logistics Coordinator",
      company: "Bolloré Logistics",
      location: "San-Pédro, Côte d'Ivoire",
      type: "Full-time",
      workplace: "on-site",
      tags: ["Logistics", "Supply Chain", "Port Operations"],
    },
    {
      slug: "ui-ux-designer-jambaars",
      title: "UI/UX Designer",
      company: "Jambaars",
      location: "Remote",
      type: "Contract",
      workplace: "remote",
      tags: ["UI/UX", "Figma", "SaaS", "Startup"],
    },
  ],
  fr: [
    {
      slug: "tech-lead-orange",
      title: "Lead Technique - Orange Money",
      company: "Orange Côte d'Ivoire",
      location: "Abidjan, Côte d'Ivoire",
      type: "Temps plein",
      workplace: "hybrid",
      tags: ["Fintech", "Mobile", "Gestion", "API"],
    },
    {
      slug: "agronomist-sifca",
      title: "Ingénieur Agronome",
      company: "SIFCA",
      location: "Yamoussoukro, Côte d'Ivoire",
      type: "Temps plein",
      workplace: "on-site",
      tags: ["Agriculture", "Agronomie", "Terrain"],
    },
    {
      slug: "data-analyst-bridge-bank",
      title: "Analyste de Données",
      company: "Bridge Bank Group",
      location: "Abidjan, Côte d'Ivoire",
      type: "Temps plein",
      workplace: "on-site",
      tags: ["Finance", "Analyse de données", "SQL", "Power BI"],
    },
    {
      slug: "marketing-manager-solibra",
      title: "Responsable Marketing",
      company: "SOLIBRA",
      location: "Abidjan, Côte d'Ivoire",
      type: "Temps plein",
      workplace: "hybrid",
      tags: ["FMCG", "Marketing", "Branding"],
    },
    {
      slug: "logistics-coordinator-bollore",
      title: "Coordinateur Logistique",
      company: "Bolloré Logistics",
      location: "San-Pédro, Côte d'Ivoire",
      type: "Temps plein",
      workplace: "on-site",
      tags: ["Logistique", "Chaîne d'approvisionnement", "Opérations portuaires"],
    },
    {
      slug: "ui-ux-designer-jambaars",
      title: "Designer UI/UX",
      company: "Jambaars",
      location: "Télétravail",
      type: "Contrat",
      workplace: "remote",
      tags: ["UI/UX", "Figma", "SaaS", "Startup"],
    },
  ]
};

export default function PublicJobSearchPage() {
  const { language, t } = useLocalization();
  const jobListings = jobListingsData[language as keyof typeof jobListingsData] || jobListingsData.en;

  const [filters, setFilters] = useState({
    keywords: "",
    location: "",
    type: "all",
    workplace: {
      remote: false,
      onSite: false,
      hybrid: false,
    }
  })

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleWorkplaceChange = (key: 'remote' | 'onSite' | 'hybrid') => {
    setFilters(prev => ({
      ...prev,
      workplace: { ...prev.workplace, [key]: !prev.workplace[key] }
    }))
  }

  const filteredJobs = useMemo(() => {
    return jobListings.filter(job => {
      const { keywords, location, type, workplace } = filters;

      const keywordsMatch = (job.title.toLowerCase().includes(keywords.toLowerCase()) || 
                             job.tags.some(tag => tag.toLowerCase().includes(keywords.toLowerCase())) ||
                             job.company.toLowerCase().includes(keywords.toLowerCase()));

      const locationMatch = job.location.toLowerCase().includes(location.toLowerCase());

      const typeMatch = type === 'all' || job.type === type;

      const workplaceChoices = Object.entries(workplace).filter(([,v]) => v).map(([k]) => k.replace('onSite', 'on-site'));
      const workplaceMatch = workplaceChoices.length === 0 || workplaceChoices.includes(job.workplace);

      return keywordsMatch && locationMatch && typeMatch && workplaceMatch;
    })
  }, [filters, jobListings]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="text-center mb-12">
            <h1 className="text-5xl font-bold tracking-tight">{t('pages.jobs.find_your_next_opportunity')}</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('pages.jobs.browse_jobs_description')}
            </p>
        </div>
        <div className="grid md:grid-cols-[320px_1fr] gap-8 items-start">
          <Card>
            <CardHeader>
              <CardTitle>{t('pages.jobs.filter_jobs')}</CardTitle>
              <CardDescription>{t('pages.jobs.refine_search')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="keywords">{t('pages.jobs.keywords')}</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="keywords" 
                    placeholder={t("pages.jobs.job_title_skills")}
                    className="pl-8" 
                    value={filters.keywords}
                    onChange={(e) => handleFilterChange('keywords', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">{t('pages.jobs.location')}</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="location" 
                    placeholder={t("pages.jobs.city_state_remote")}
                    className="pl-8"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="job-type">{t('pages.jobs.job_type')}</Label>
                <Select 
                  value={filters.type}
                  onValueChange={(value) => handleFilterChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('pages.jobs.all_types')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('pages.jobs.all_types')}</SelectItem>
                    <SelectItem value="Full-time">{t('pages.jobs.full_time')}</SelectItem>
                    <SelectItem value="Part-time">{t('pages.jobs.part_time')}</SelectItem>
                    <SelectItem value="Contract">{t('pages.jobs.contract')}</SelectItem>
                    <SelectItem value="Internship">{t('pages.jobs.internship')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 pt-2">
                <Label>{t('pages.jobs.workplace')}</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remote" checked={filters.workplace.remote} onCheckedChange={() => handleWorkplaceChange('remote')} />
                    <Label htmlFor="remote" className="font-normal">{t('pages.jobs.remote')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="on-site" checked={filters.workplace.onSite} onCheckedChange={() => handleWorkplaceChange('onSite')} />
                    <Label htmlFor="on-site" className="font-normal">{t('pages.jobs.on_site')}</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="hybrid" checked={filters.workplace.hybrid} onCheckedChange={() => handleWorkplaceChange('hybrid')} />
                    <Label htmlFor="hybrid" className="font-normal">{t('pages.jobs.hybrid')}</Label>
                  </div>
                </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div className="space-y-4">
              {filteredJobs.length > 0 ? filteredJobs.map((job) => (
                <Card key={job.slug}>
                   <CardHeader>
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <CardTitle className="text-xl">{job.title}</CardTitle>
                        <CardDescription className="mt-1 flex flex-col sm:flex-row sm:items-center sm:gap-4 pt-1">
                          <span className="flex items-center gap-1.5"><Building className="h-4 w-4"/> {job.company}</span>
                          <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {job.location}</span>
                          <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4"/> {t(job.type)}</span>
                        </CardDescription>
                      </div>
                      <Button asChild className="shrink-0">
                        <Link href="/signup?role=graduate">{t('pages.jobs.view_job')}</Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {job.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )) : (
                <Card>
                  <CardContent className="py-12 text-center">
                      <p className="font-semibold">{t('pages.jobs.no_jobs_found')}</p>
                      <p className="text-muted-foreground mt-2">{t("pages.jobs.adjust_filters")}</p>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardContent className="py-8 text-center">
                    <h3 className="text-2xl font-bold">{t('pages.jobs.unlock_more_opportunities')}</h3>
                    <p className="text-muted-foreground mt-2 mb-4">{t('pages.jobs.create_account_description')}</p>
                    <Button asChild size="lg">
                        <Link href="/signup?role=graduate">
                            {t('pages.jobs.sign_up_now')} <ArrowRight className="ml-2 h-4 w-4"/>
                        </Link>
                    </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}