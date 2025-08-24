
"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Handshake, Building, Check, X, Clock, Search, University, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

type PartnershipStatus = "pending" | "accepted" | "declined"
type School = {
  id: number
  name: string
  acronym: string
  logoUrl: string
  location: string
  slug: string
}
type PartnershipRequest = {
  id: number
  entityName: string
  entityLogo: string
  status: PartnershipStatus
}

const allSchools: School[] = [
  { id: 1, name: "Institut National Polytechnique Félix Houphouët-Boigny", acronym: "INP-HB", logoUrl: "/images/University.png", location: "Yamoussoukro", slug: "inp-hb" },
  { id: 2, name: "Université Félix Houphouët-Boigny", acronym: "UFHB", logoUrl: "/images/LogoYahnu.png", location: "Abidjan", slug: "ufhb" },
  { id: 3, name: "Groupe CSI Pôle Polytechnique", acronym: "CSI", logoUrl: "/images/Logo.png", location: "Abidjan", slug: "csi" },
];

const initialCompanyPartnerships: PartnershipRequest[] = [
  { id: 1, entityName: "INP-HB", entityLogo: "/images/University.png", status: "pending" },
];

const initialSchoolRequests: PartnershipRequest[] = [
  { id: 1, entityName: "Tech Solutions Abidjan", entityLogo: "/images/Logo.png", status: "pending" },
  { id: 2, entityName: "Finance & Forte", entityLogo: "/images/LogoYahnu.png", status: "accepted" },
];


const CompanyPartnerships = () => {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [requests, setRequests] = useState<PartnershipRequest[]>(initialCompanyPartnerships);

    const handleRequestPartnership = (school: School) => {
        if (requests.some(req => req.entityName === school.acronym)) {
            toast({ title: "Demande déjà envoyée", description: "Vous avez déjà envoyé une demande à cette école.", variant: "destructive"});
            return;
        }

        const newRequest: PartnershipRequest = {
            id: Date.now(),
            entityName: school.acronym,
            entityLogo: school.logoUrl,
            status: "pending"
        };
        setRequests(prev => [newRequest, ...prev]);
        toast({ title: "Demande envoyée", description: `Votre demande de partenariat à ${school.acronym} a été envoyée.` });
    };
    
    const requestedSchoolNames = requests.map(r => r.entityName);
    const availableSchools = allSchools.filter(s => !requestedSchoolNames.includes(s.acronym) && s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <Card>
                <CardHeader>
                    <CardTitle>Vos demandes de partenariat</CardTitle>
                    <CardDescription>Statut des demandes de partenariat que vous avez envoyées aux écoles.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>École</TableHead>
                                <TableHead className="text-right">Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium flex items-center gap-3">
                                        <Image src={req.entityLogo} alt={req.entityName} width={40} height={40} className="rounded-full object-contain" />
                                        {req.entityName}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={req.status === 'accepted' ? 'secondary' : req.status === 'pending' ? 'outline' : 'destructive'}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Découvrir des écoles</CardTitle>
                    <CardDescription>Trouvez et établissez des partenariats avec les meilleures institutions ivoiriennes.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input placeholder={"Rechercher des écoles..."} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                        {availableSchools.map((school) => (
                            <div key={school.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div className="flex items-center gap-3">
                                     <Image src={school.logoUrl} alt={school.name} width={40} height={40} className="rounded-full object-contain" />
                                     <div>
                                        <p className="font-semibold">{school.acronym}</p>
                                        <p className="text-sm text-muted-foreground">{school.location}</p>
                                    </div>
                                </div>
                                <Button size="sm" onClick={() => handleRequestPartnership(school)}>Demander</Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

const SchoolPartnerships = () => {
    const [requests, setRequests] = useState<PartnershipRequest[]>(initialSchoolRequests);

    const handleRequest = (id: number, newStatus: "accepted" | "declined") => {
        setRequests(requests.map(req => req.id === id ? { ...req, status: newStatus } : req));
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const currentPartners = requests.filter(r => r.status === 'accepted');

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-start">
             <Card>
                <CardHeader>
                    <CardTitle>Demandes entrantes</CardTitle>
                    <CardDescription>Demandes de partenariat des entreprises.</CardDescription>
                </CardHeader>
                <CardContent>
                     {pendingRequests.length > 0 ? pendingRequests.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border mb-3">
                            <div className="flex items-center gap-3">
                                <Image src={req.entityLogo} alt={req.entityName} width={40} height={40} className="rounded-full object-contain" />
                                <p className="font-semibold">{req.entityName}</p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => handleRequest(req.id, 'declined')}><X className="h-4 w-4" /></Button>
                                <Button size="sm" onClick={() => handleRequest(req.id, 'accepted')}><Check className="h-4 w-4" /></Button>
                            </div>
                        </div>
                     )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune demande en attente.</p>
                     )}
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Partenaires actuels</CardTitle>
                    <CardDescription>Entreprises avec lesquelles vous êtes actuellement en partenariat.</CardDescription>
                </CardHeader>
                <CardContent>
                    {currentPartners.length > 0 ? currentPartners.map(req => (
                        <div key={req.id} className="flex items-center justify-between p-3 rounded-lg border mb-3">
                             <div className="flex items-center gap-3">
                                <Image src={req.entityLogo} alt={req.entityName} width={40} height={40} className="rounded-full object-contain" />
                                <p className="font-semibold">{req.entityName}</p>
                            </div>
                            <Button size="sm" variant="ghost">Voir les détails</Button>
                        </div>
                    )) : (
                        <p className="text-sm text-muted-foreground text-center py-4">Vous n'avez pas encore de partenaires actifs.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

const pageConfig: Record<string, {
    title: string;
    description: string;
    component: React.ComponentType;
}> = {
    company: { title: 'Gestion des partenariats', description: 'Gérez vos partenariats académiques et découvrez de nouvelles écoles avec lesquelles collaborer.', component: CompanyPartnerships },
    school: { title: 'Gestion des partenariats', description: 'Gérez les demandes de partenariat entrantes des entreprises et consultez vos partenaires actuels.', component: SchoolPartnerships },
}


export default function PartnersPage() {
  const { role } = useAuth();
  
  const { title, description, component: ActiveComponent } = pageConfig[role as keyof typeof pageConfig] || pageConfig.company;

  return (
    <div className="space-y-8">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <Handshake className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>
        </div>
        
        {ActiveComponent ? <ActiveComponent /> : <p>Cette page n'est pas disponible pour votre type de compte.</p>}
    </div>
  );
}
