
"use client"

import { useState, useMemo } from 'react'
import Image from "next/image"
import Link from "next/link"
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
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, GraduationCap, University, Briefcase, Award } from "lucide-react"
import { useLocalization } from '@/context/localization-context'
import { MultiSelectCombobox, type MultiSelectOption } from '@/components/ui/multi-select'


const graduatesData = {
  en: [
    { name: "Amina Diallo", slug: "amina-diallo", school: "INP-HB", field: "Computer Science", skills: ["React", "TypeScript", "Node.js"], badges: ["Frontend Development (React)"], available: true },
    { name: "Ben Traoré", slug: "ben-traore", school: "UFHB", field: "Business Administration", skills: ["Marketing", "Project Management"], badges: [], available: false },
    { name: "Chloe Dubois", slug: "chloe-dubois", school: "Groupe CSI", field: "Electrical Engineering", skills: ["AutoCAD", "PLC", "Matlab"], badges: [], available: true },
    { name: "David Kone", slug: "david-kone", school: "INP-HB", field: "Agronomy", skills: ["Crop Science", "Soil Analysis"], badges: ["Modern Agronomy Principles"], available: true },
    { name: "Elise Fofana", slug: "elise-fofana", school: "UFHB", field: "Finance", skills: ["Financial Modeling", "Excel"], badges: ["Financial Analysis Fundamentals"], available: true },
  ],
  fr: [
    { name: "Amina Diallo", slug: "amina-diallo", school: "INP-HB", field: "Génie Informatique", skills: ["React", "TypeScript", "Node.js"], badges: ["Développement Frontend (React)"], available: true },
    { name: "Ben Traoré", slug: "ben-traore", school: "UFHB", field: "Administration des affaires", skills: ["Marketing", "Gestion de projet"], badges: [], available: false },
    { name: "Chloe Dubois", slug: "chloe-dubois", school: "Groupe CSI", field: "Génie Électrique", skills: ["AutoCAD", "PLC", "Matlab"], badges: [], available: true },
    { name: "David Kone", slug: "david-kone", school: "INP-HB", field: "Agronomie", skills: ["Science des cultures", "Analyse de sol"], badges: ["Principes d'Agronomie Moderne"], available: true },
    { name: "Elise Fofana", slug: "elise-fofana", school: "UFHB", field: "Finance", skills: ["Modélisation financière", "Excel"], badges: ["Principes de l'Analyse Financière"], available: true },
  ]
};

const allBadges: MultiSelectOption[] = [
    { value: "Frontend Development (React)", label: "Frontend Development (React)" },
    { value: "Financial Analysis Fundamentals", label: "Financial Analysis Fundamentals" },
    { value: "Modern Agronomy Principles", label: "Modern Agronomy Principles" },
    { value: "Supply Chain Essentials", label: "Supply Chain Essentials" },
    { value: "Cognitive Aptitude Test", label: "Cognitive Aptitude Test" },
];

export default function TalentPoolPage() {
  const { language, t } = useLocalization();
  const graduates = graduatesData[language as keyof typeof graduatesData] || graduatesData.en;
  
  const [filters, setFilters] = useState({
    keywords: "",
    school: "",
    field: "",
    availableOnly: false,
    badges: [] as MultiSelectOption[]
  })

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const filteredGraduates = useMemo(() => {
    return graduates.filter(grad => {
      const { keywords, school, field, availableOnly, badges } = filters;
      
      const keywordsMatch = (grad.name.toLowerCase().includes(keywords.toLowerCase()) || 
                             grad.skills.some(skill => skill.toLowerCase().includes(keywords.toLowerCase())));
      const schoolMatch = grad.school.toLowerCase().includes(school.toLowerCase());
      const fieldMatch = grad.field.toLowerCase().includes(field.toLowerCase());
      const availabilityMatch = !availableOnly || grad.available;
      const badgeMatch = badges.length === 0 || badges.every(badge => grad.badges.includes(badge.value));

      return keywordsMatch && schoolMatch && fieldMatch && availabilityMatch && badgeMatch;
    })
  }, [filters, graduates]);

  return (
    <div className="grid md:grid-cols-[320px_1fr] gap-8 items-start">
      <Card className="sticky top-20">
        <CardHeader>
          <CardTitle>{t('Filter Talent')}</CardTitle>
          <CardDescription>{t('Find the ideal candidates for your company.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">{t('Keywords')}</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="keywords" placeholder={t("Name, skills...")} className="pl-8" value={filters.keywords} onChange={(e) => handleFilterChange('keywords', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="school">{t('School')}</Label>
            <div className="relative">
              <University className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="school" placeholder={t("e.g., INP-HB")} className="pl-8" value={filters.school} onChange={(e) => handleFilterChange('school', e.target.value)} />
            </div>
          </div>
           <div className="space-y-2">
            <Label htmlFor="field">{t('Field of Study')}</Label>
            <div className="relative">
              <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="field" placeholder={t("e.g., Computer Science")} className="pl-8" value={filters.field} onChange={(e) => handleFilterChange('field', e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="badges">{t('Verified Skills')}</Label>
            <MultiSelectCombobox 
                groups={[{ label: t("Certifications"), options: allBadges.map(b => ({...b, label: t(b.label)})) }]}
                selected={filters.badges}
                onChange={(selected) => handleFilterChange('badges', selected)}
                placeholder={t("Filter by badges...")}
                searchPlaceholder={t("Search skills...")}
            />
          </div>
           <div className="flex items-center space-x-2 pt-2">
            <Checkbox id="available" checked={filters.availableOnly} onCheckedChange={(checked) => handleFilterChange('availableOnly', checked)} />
            <Label htmlFor="available" className="font-normal">{t('Available for hire')}</Label>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Talent Pool')}</h1>
            <p className="text-muted-foreground mt-1">{t('Showing')} {filteredGraduates.length} {t('graduates')}</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          {filteredGraduates.length > 0 ? filteredGraduates.map((grad) => (
            <Card key={grad.name} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-4">
                    <Image src="https://placehold.co/100x100.png" alt={grad.name} width={64} height={64} className="rounded-full" />
                    <div>
                        <CardTitle>{grad.name}</CardTitle>
                        <CardDescription>{t(grad.field)} - {grad.school}</CardDescription>
                         <Badge variant={grad.available ? "secondary" : "outline"} className="mt-2">
                            {grad.available ? t('Available') : t('Unavailable')}
                        </Badge>
                    </div>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                 <h4 className="font-semibold text-sm mb-2">{t('Top Skills')}</h4>
                <div className="flex flex-wrap gap-2">
                  {grad.skills.map((skill) => (
                    <Badge key={skill} variant="outline">{skill}</Badge>
                  ))}
                </div>
                {grad.badges && grad.badges.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-semibold text-sm mb-2">{t('Verified Skills')}</h4>
                        <div className="flex flex-wrap gap-2">
                        {grad.badges.map((badge) => (
                            <Badge key={badge} variant="secondary" className="gap-1">
                                <Award className="h-3 w-3" />
                                {t(badge)}
                            </Badge>
                        ))}
                        </div>
                    </div>
                )}
              </CardContent>
              <CardFooter>
                 <Button className="w-full" asChild>
                    <Link href={`/dashboard/talent-pool/${grad.slug}`}>{t('View Full Profile')}</Link>
                 </Button>
              </CardFooter>
            </Card>
          )) : (
            <Card className="lg:col-span-2">
              <CardContent className="py-12 text-center">
                  <p className="font-semibold">{t('No graduates found')}</p>
                  <p className="text-muted-foreground mt-2">{t("Try adjusting your filters to find what you're looking for.")}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

