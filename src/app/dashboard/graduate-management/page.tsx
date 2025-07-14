
"use client"

import React, { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { UserCheck, Check, X, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

type GraduateStatus = "pending" | "active"
type Graduate = {
  id: number
  name: string
  email: string
  graduationYear: number
  status: GraduateStatus
}

const allGraduates: Graduate[] = [
  { id: 1, name: "Amina Diallo", email: "amina.d@example.com", graduationYear: 2023, status: "pending" },
  { id: 2, name: "Ben Traoré", email: "ben.t@example.com", graduationYear: 2023, status: "active" },
  { id: 3, name: "Chloe Dubois", email: "chloe.d@example.com", graduationYear: 2022, status: "active" },
  { id: 4, name: "Moussa Diarra", email: "moussa.d@example.com", graduationYear: 2024, status: "pending" },
];

export default function GraduateManagementPage() {
  const { t } = useLocalization()
  const { toast } = useToast()
  const [graduates, setGraduates] = useState<Graduate[]>(allGraduates)
  const [searchTerm, setSearchTerm] = useState("")

  const handleStatusChange = (id: number, newStatus: GraduateStatus) => {
    const graduate = graduates.find(g => g.id === id)
    if (!graduate) return

    setGraduates(graduates.map(g => g.id === id ? { ...g, status: newStatus } : g))
    toast({
      title: t('Account ' + newStatus),
      description: `${graduate.name}'s ${t('account has been ')}${newStatus}.`,
    })
  }

  const filteredGraduates = graduates.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingGraduates = filteredGraduates.filter(g => g.status === 'pending');
  const activeGraduates = filteredGraduates.filter(g => g.status === 'active');
  
  const renderTable = (data: Graduate[]) => (
     <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('Name')}</TableHead>
            <TableHead>{t('Email')}</TableHead>
            <TableHead>{t('Graduation Year')}</TableHead>
            <TableHead className="text-right">{t('Actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
            {data.map(grad => (
            <TableRow key={grad.id}>
              <TableCell className="font-medium">{grad.name}</TableCell>
              <TableCell>{grad.email}</TableCell>
              <TableCell>{grad.graduationYear}</TableCell>
              <TableCell className="text-right space-x-2">
                {grad.status === 'pending' && (
                    <Button size="sm" onClick={() => handleStatusChange(grad.id, 'active')}>
                        <Check className="mr-2 h-4 w-4" /> {t('Activate')}
                    </Button>
                )}
                {grad.status === 'active' && (
                    <Button size="sm" variant="destructive" onClick={() => handleStatusChange(grad.id, 'pending')}>
                        <X className="mr-2 h-4 w-4" /> {t('Deactivate')}
                    </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">{t('No graduates found.')}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <UserCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Graduate Management')}</h1>
          <p className="text-muted-foreground mt-1">{t('Activate and manage graduate accounts from your institution.')}</p>
        </div>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>{t('All Graduates')}</CardTitle>
                <CardDescription>{t('Search and manage all graduates associated with your school.')}</CardDescription>
                <div className="relative pt-4">
                    <Search className="absolute left-2.5 top-6.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder={t("Search by name or email...")} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </CardHeader>
            <CardContent>
                 <Tabs defaultValue="pending">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="pending">{t('Pending Activation')} ({pendingGraduates.length})</TabsTrigger>
                        <TabsTrigger value="active">{t('Active Accounts')} ({activeGraduates.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="pending" className="mt-4">
                        {renderTable(pendingGraduates)}
                    </TabsContent>
                    <TabsContent value="active" className="mt-4">
                        {renderTable(activeGraduates)}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    </div>
  )
}
