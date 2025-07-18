
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
import { Search, MapPin, Briefcase, Building } from "lucide-react"
import { useLocalization } from '@/context/localization-context'

const jobListingsData = {
  en: [
    {
      title: "Software Engineer, Frontend",
      company: "Innovate Inc.",
      location: "Remote",
      type: "Full-time",
      workplace: "remote",
      tags: ["React", "TypeScript", "Next.js"],
    },
    {
      title: "Product Manager",
      company: "DataDriven Co.",
      location: "New York, NY",
      type: "Full-time",
      workplace: "on-site",
      tags: ["Agile", "Roadmap", "SaaS"],
    },
    {
      title: "UX/UI Designer",
      company: "Creative Solutions",
      location: "San Francisco, CA",
      type: "Contract",
      workplace: "hybrid",
      tags: ["Figma", "User Research", "Prototyping"],
    },
    {
      title: "Data Scientist",
      company: "QuantumLeap",
      location: "Boston, MA",
      type: "Full-time",
      workplace: "on-site",
      tags: ["Python", "Machine Learning", "SQL"],
    },
    {
      title: "DevOps Engineer",
      company: "CloudNine",
      location: "Austin, TX",
      type: "Full-time",
      workplace: "hybrid",
      tags: ["AWS", "Kubernetes", "CI/CD"],
    },
    {
      title: "Frontend Developer",
      company: "Innovate Inc.",
      location: "Remote",
      type: "Contract",
      workplace: "remote",
      tags: ["Vue", "JavaScript"],
    },
  ],
  fr: [
    {
      title: "Ingénieur logiciel, Frontend",
      company: "Innovate Inc.",
      location: "Télétravail",
      type: "Temps plein",
      workplace: "remote",
      tags: ["React", "TypeScript", "Next.js"],
    },
    {
      title: "Chef de produit",
      company: "DataDriven Co.",
      location: "New York, NY",
      type: "Temps plein",
      workplace: "on-site",
      tags: ["Agile", "Roadmap", "SaaS"],
    },
    {
      title: "Designer UX/UI",
      company: "Creative Solutions",
      location: "San Francisco, CA",
      type: "Contrat",
      workplace: "hybrid",
      tags: ["Figma", "Recherche utilisateur", "Prototypage"],
    },
    {
      title: "Data Scientist",
      company: "QuantumLeap",
      location: "Boston, MA",
      type: "Temps plein",
      workplace: "on-site",
      tags: ["Python", "Machine Learning", "SQL"],
    },
    {
      title: "Ingénieur DevOps",
      company: "CloudNine",
      location: "Austin, TX",
      type: "Temps plein",
      workplace: "hybrid",
      tags: ["AWS", "Kubernetes", "CI/CD"],
    },
    {
      title: "Développeur Frontend",
      company: "Innovate Inc.",
      location: "Télétravail",
      type: "Contrat",
      workplace: "remote",
      tags: ["Vue", "JavaScript"],
    },
  ]
};

export default function JobSearchPage() {
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
    <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
      <Card className="sticky top-20">
        <CardHeader>
          <CardTitle>{t('Filter Jobs')}</CardTitle>
          <CardDescription>{t('Refine your search to find the perfect fit.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">{t('Keywords')}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="keywords" 
                placeholder={t("Job title, skills...")}
                className="pl-8" 
                value={filters.keywords}
                onChange={(e) => handleFilterChange('keywords', e.target.value)}
                data-hs-event-name="job_search_initiated"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">{t('Location')}</Label>
             <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                id="location" 
                placeholder={t("City, state, remote")}
                className="pl-8"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-type">{t('Job Type')}</Label>
            <Select 
              value={filters.type}
              onValueChange={(value) => handleFilterChange('type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('All types')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('All Types')}</SelectItem>
                <SelectItem value="Full-time">{t('Full-time')}</SelectItem>
                <SelectItem value="Part-time">{t('Part-time')}</SelectItem>
                <SelectItem value="Contract">{t('Contract')}</SelectItem>
                <SelectItem value="Internship">{t('Internship')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2 pt-2">
             <Label>{t('Workplace')}</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="remote" checked={filters.workplace.remote} onCheckedChange={() => handleWorkplaceChange('remote')} />
                <Label htmlFor="remote" className="font-normal">{t('Remote')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="on-site" checked={filters.workplace.onSite} onCheckedChange={() => handleWorkplaceChange('onSite')} />
                <Label htmlFor="on-site" className="font-normal">{t('On-site')}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="hybrid" checked={filters.workplace.hybrid} onCheckedChange={() => handleWorkplaceChange('hybrid')} />
                <Label htmlFor="hybrid" className="font-normal">{t('Hybrid')}</Label>
              </div>
            </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Job Opportunities')}</h1>
            <p className="text-muted-foreground mt-1">{t('Showing')} {filteredJobs.length} {t('results')}</p>
        </div>
        <div className="space-y-4">
          {filteredJobs.length > 0 ? filteredJobs.map((job, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{job.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-4 pt-1">
                      <span className="flex items-center gap-1.5"><Building className="h-4 w-4"/> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4"/> {t(job.type)}</span>
                    </CardDescription>
                  </div>
                  <Button>{t('Apply')}</Button>
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
                  <p className="font-semibold">{t('No jobs found')}</p>
                  <p className="text-muted-foreground mt-2">{t("Try adjusting your filters to find what you're looking for.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
