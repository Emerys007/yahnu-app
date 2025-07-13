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

const jobListings = [
  {
    title: "Software Engineer, Frontend",
    company: "Innovate Inc.",
    location: "Remote",
    type: "Full-time",
    tags: ["React", "TypeScript", "Next.js"],
  },
  {
    title: "Product Manager",
    company: "DataDriven Co.",
    location: "New York, NY",
    type: "Full-time",
    tags: ["Agile", "Roadmap", "SaaS"],
  },
  {
    title: "UX/UI Designer",
    company: "Creative Solutions",
    location: "San Francisco, CA",
    type: "Contract",
    tags: ["Figma", "User Research", "Prototyping"],
  },
  {
    title: "Data Scientist",
    company: "QuantumLeap",
    location: "Boston, MA",
    type: "Full-time",
    tags: ["Python", "Machine Learning", "SQL"],
  },
   {
    title: "DevOps Engineer",
    company: "CloudNine",
    location: "Austin, TX",
    type: "Full-time",
    tags: ["AWS", "Kubernetes", "CI/CD"],
  },
];


export default function JobSearchPage() {
  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
      <Card className="sticky top-20">
        <CardHeader>
          <CardTitle>Filter Jobs</CardTitle>
          <CardDescription>Refine your search to find the perfect fit.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keywords">Keywords</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="keywords" placeholder="Job title, skills..." className="pl-8" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
             <div className="relative">
              <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input id="location" placeholder="City, state, remote" className="pl-8" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-type">Job Type</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full-time">Full-time</SelectItem>
                <SelectItem value="part-time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
           <div className="space-y-2 pt-2">
             <Label>Workplace</Label>
              <div className="flex items-center space-x-2">
                <Checkbox id="remote" />
                <Label htmlFor="remote" className="font-normal">Remote</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="on-site" />
                <Label htmlFor="on-site" className="font-normal">On-site</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="hybrid" />
                <Label htmlFor="hybrid" className="font-normal">Hybrid</Label>
              </div>
            </div>
        </CardContent>
        <CardFooter>
            <Button className="w-full">Apply Filters</Button>
        </CardFooter>
      </Card>

      <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Job Opportunities</h1>
            <p className="text-muted-foreground mt-1">Showing {jobListings.length} results</p>
        </div>
        <div className="space-y-4">
          {jobListings.map((job, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-4">
                      <span className="flex items-center gap-1.5"><Building className="h-4 w-4"/> {job.company}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4"/> {job.location}</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="h-4 w-4"/> {job.type}</span>
                    </CardDescription>
                  </div>
                  <Button>Apply</Button>
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
          ))}
        </div>
      </div>
    </div>
  )
}
