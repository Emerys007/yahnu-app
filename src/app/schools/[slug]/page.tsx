
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { notFound } from "next/navigation";
import { SchoolProfileClient } from "@/components/schools/school-profile-client";

interface School {
    id: string;
    name: string;
    acronym: string;
    logoUrl: string;
    location: string;
    website: string;
    description: string;
    programs: string[];
    slug: string;
}

const schoolsData: School[] = [
    {
        id: "1",
        name: "school_1_name",
        acronym: "INP-HB",
        logoUrl: "/images/University.png",
        location: "Yamoussoukro",
        website: "https://www.inphb.ci",
        description: "school_1_description",
        programs: ["school_1_program_1", "school_1_program_2", "school_1_program_3", "school_1_program_4"],
        slug: "inp-hb",
    },
    {
        id: "2",
        name: "school_2_name",
        acronym: "UFHB",
        logoUrl: "/images/UFHB.png",
        location: "Abidjan",
        website: "https://www.univ-fhb.edu.ci",
        description: "school_2_description",
        programs: ["school_2_program_1", "school_2_program_2", "school_2_program_3", "school_2_program_4"],
        slug: "ufhb",
    },
    {
        id: "3",
        name: "school_3_name",
        acronym: "CSI",
        logoUrl: "/images/CSI.png",
        location: "Abidjan",
        website: "https://www.csi-polytechnique.com",
        description: "school_3_description",
        programs: ["school_3_program_1", "school_3_program_2", "school_3_program_3", "school_3_program_4"],
        slug: "csi",
    }
];

function getSchoolBySlug(slug: string): School | null {
    const school = schoolsData.find(s => s.slug === slug);
    return school || null;
}

// Server Component Page
export default async function SchoolPage({ params }: { params: { slug: string } }) {
  const school = getSchoolBySlug(params.slug);

  if (!school) {
    notFound();
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
        <SchoolProfileClient school={school} />
      </main>
      <Footer />
    </div>
  );
}
