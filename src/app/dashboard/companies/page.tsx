
"use client"

import { useLocalization } from "@/context/localization-context"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Building, ArrowRight } from "lucide-react"

const companies = [
  {
    name: "Innovate Inc.",
    industry: "Tech",
    jobs: 3,
    href: "/dashboard/talent-pool", // Placeholder, should link to company profile later
  },
  {
    name: "DataDriven Co.",
    industry: "SaaS",
    jobs: 1,
    href: "/dashboard/talent-pool",
  },
  {
    name: "Creative Solutions",
    industry: "Design",
    jobs: 2,
    href: "/dashboard/talent-pool",
  },
]

export default function GraduateCompaniesPage() {
  const { t } = useLocalization()
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Building className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Partner Companies')}</h1>
          <p className="text-muted-foreground mt-1">{t('Discover companies hiring on the Yahnu platform.')}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Featured Companies')}</CardTitle>
          <CardDescription>
            {t('Explore companies actively recruiting top talent.')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('Company')}</TableHead>
                <TableHead>{t('Industry')}</TableHead>
                <TableHead>{t('Open Jobs')}</TableHead>
                <TableHead className="text-right">{t('Action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{company.industry}</Badge>
                  </TableCell>
                  <TableCell>{company.jobs}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={company.href}>
                        {t('View Profile')}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
