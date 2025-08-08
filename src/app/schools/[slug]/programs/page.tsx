
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Clock, Users } from "lucide-react";
import Link from "next/link";

interface School {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
    location: string;
    website: string;
    description: string;
    programs: { name: string; duration: string; capacity: string; description: string }[];
    slug: string;
}

const schoolsData: School[] = [
    {
        id: "1",
        name: "Institut National Polytechnique Félix Houphouët-Boigny",
        acronym: "INP-HB",
        logoUrl: "https://www.adminsite.inphb.app/Imagessiteprincipal/Icon.png",
        location: "Yamoussoukro",
        website: "https://www.inphb.ci",
        description: "school_1_description",
        programs: [
            {
                name: "Civil Engineering",
                duration: "5 years",
                capacity: "150 students",
                description: "Comprehensive program covering structural engineering, construction management, and infrastructure development."
            },
            {
                name: "Electrical Engineering",
                duration: "5 years", 
                capacity: "120 students",
                description: "Focus on power systems, electronics, telecommunications, and renewable energy technologies."
            },
            {
                name: "Computer Science",
                duration: "5 years",
                capacity: "200 students",
                description: "Modern curriculum covering software development, AI, cybersecurity, and data science."
            },
            {
                name: "Telecommunications",
                duration: "5 years",
                capacity: "100 students",
                description: "Specialized program in network engineering, wireless communications, and digital systems."
            }
        ],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "Université Félix Houphouët-Boigny",
        acronym: "UFHB",
        logoUrl: "https://w.univ-fhb.edu.ci/wp-content/uploads/2023/11/logo-UFHB-e1699536639348-1024x747.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "school_2_description",
        programs: [
            {
                name: "Medicine",
                duration: "7 years",
                capacity: "300 students",
                description: "Comprehensive medical training with clinical rotations and research opportunities."
            },
            {
                name: "Law",
                duration: "4 years",
                capacity: "250 students",
                description: "Legal studies covering civil law, business law, and international law."
            },
            {
                name: "Economics",
                duration: "3 years",
                capacity: "400 students",
                description: "Economic theory, financial analysis, and development economics."
            },
            {
                name: "Applied Sciences",
                duration: "3 years",
                capacity: "200 students",
                description: "Interdisciplinary program combining mathematics, physics, and computer science."
            }
        ],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "Groupe CSI Pôle Polytechnique",
        acronym: "CSI",
        logoUrl: "https://groupecsi-pp.com/wp-content/uploads/2023/05/nouveau-logo.jpeg",
        location: "Abidjan",
        website: "https://www.csi-polytechnique.com",
        description: "school_3_description",
        programs: [
            {
                name: "Software Engineering",
                duration: "3 years",
                capacity: "180 students",
                description: "Practical software development with industry partnerships and internships."
            },
            {
                name: "Business Administration",
                duration: "3 years",
                capacity: "200 students",
                description: "Management, entrepreneurship, and business strategy for the African market."
            },
            {
                name: "Industrial Engineering",
                duration: "3 years",
                capacity: "120 students",
                description: "Process optimization, quality management, and manufacturing systems."
            },
            {
                name: "Digital Marketing",
                duration: "2 years",
                capacity: "100 students",
                description: "Modern marketing strategies, social media, and e-commerce."
            }
        ],
        slug: "csi",
    },
    {
        id: "4",
        name: "École Supérieure Africaine des TIC",
        acronym: "ESATIC",
        logoUrl: "https://esatic.ci/wp-content/uploads/2024/07/esatic_logo.jpg",
        location: "Abidjan",
        website: "https://www.esatic.edu.ci",
        description: "school_4_description",
        programs: [
            {
                name: "Computer Science",
                duration: "3 years",
                capacity: "250 students",
                description: "Advanced computing with focus on artificial intelligence and machine learning."
            },
            {
                name: "Network Engineering",
                duration: "3 years",
                capacity: "150 students",
                description: "Network infrastructure, cloud computing, and system administration."
            },
            {
                name: "Cybersecurity",
                duration: "3 years",
                capacity: "100 students",
                description: "Information security, ethical hacking, and digital forensics."
            },
            {
                name: "Data Science",
                duration: "2 years",
                capacity: "80 students",
                description: "Big data analytics, machine learning, and business intelligence."
            }
        ],
        slug: "esatic",
    },
    {
        id: "5",
        name: "École Nationale Supérieure de Statistique et d'Économie Appliquée",
        acronym: "ENSEA",
        logoUrl: "https://ensea.ed.ci/wp-content/uploads/2021/07/logo_ensea.png",
        location: "Abidjan",
        website: "https://www.ensea.edu.ci",
        description: "school_5_description",
        programs: [
            {
                name: "Statistics",
                duration: "3 years",
                capacity: "120 students",
                description: "Applied statistics, biostatistics, and survey methodology."
            },
            {
                name: "Applied Economics",
                duration: "3 years",
                capacity: "150 students",
                description: "Economic modeling, policy analysis, and development economics."
            },
            {
                name: "Actuarial Science",
                duration: "3 years",
                capacity: "80 students",
                description: "Risk assessment, insurance mathematics, and financial modeling."
            },
            {
                name: "Business Analytics",
                duration: "2 years",
                capacity: "100 students",
                description: "Data-driven decision making and predictive analytics for business."
            }
        ],
        slug: "ensea",
    }
];

function getSchoolBySlug(slug: string): School | null {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

export default async function SchoolProgramsPage({ params }: { params: { slug: string } }) {
  const school = getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <div className="mb-8">
          <Button asChild variant="ghost" className="mb-4">
            <Link href={`/schools/${school.slug}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to {school.acronym}
            </Link>
          </Button>
          <h1 className="text-4xl font-bold mb-2">{school.acronym} Programs</h1>
          <p className="text-lg text-muted-foreground">{school.name}</p>
        </div>

        <div className="grid gap-6">
          {school.programs.map((program, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <GraduationCap className="h-6 w-6 text-primary" />
                  {program.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{program.description}</p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{program.duration}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{program.capacity}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button asChild>
                    <Link href="/signup">Apply Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
