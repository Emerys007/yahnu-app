
"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { useLocalization } from "@/context/localization-context"
import { useCountry } from "@/context/country-context"
import { phoneCountryCodes, type PhoneCountryCode } from "@/lib/phone-country-codes"
import { Flag } from "../flag"

type PhoneNumberInputProps = React.InputHTMLAttributes<HTMLInputElement>

export const PhoneNumberInput = React.forwardRef<
  HTMLInputElement,
  PhoneNumberInputProps
>(({ className, ...props }, ref) => {
  const { country } = useCountry();
  const { language, t } = useLocalization();
  const [open, setOpen] = React.useState(false)
  
  const initialCountry = phoneCountryCodes.find(c => c.code === country.code) || phoneCountryCodes.find(c => c.code === "CI")!;
  const [selectedCountry, setSelectedCountry] = React.useState<PhoneCountryCode>(initialCountry);
  const [number, setNumber] = React.useState("");

  const handleCountrySelect = (countryCode: string) => {
    const newCountry = phoneCountryCodes.find(c => c.code === countryCode);
    if (newCountry) {
      setSelectedCountry(newCountry);
      // Also update the form value if needed
      if (props.onChange) {
        const event = {
            target: { value: `${newCountry.dial_code} ${number}` }
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event);
      }
    }
    setOpen(false)
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newNumber = e.target.value;
    setNumber(newNumber);
     if (props.onChange) {
        const event = {
            target: { value: `${selectedCountry.dial_code} ${newNumber}` }
        } as React.ChangeEvent<HTMLInputElement>
        props.onChange(event);
      }
  }
  
  // Update internal state if the value prop changes (e.g. from form reset)
  React.useEffect(() => {
    if (props.value === "" || props.value === undefined || props.value === null) {
      setNumber("");
      setSelectedCountry(initialCountry);
    }
  }, [props.value, initialCountry]);

  return (
    <div className="flex items-center">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[150px] justify-between rounded-r-none"
          >
            <div className="flex items-center gap-2 truncate">
              <Flag countryCode={selectedCountry.code} />
              <span>{selectedCountry.dial_code}</span>
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandInput placeholder={t("Search country...")} />
            <CommandList>
                <CommandEmpty>{t("No country found.")}</CommandEmpty>
                <CommandGroup>
                {phoneCountryCodes.map((c) => (
                    <CommandItem
                        key={c.code}
                        value={`${c.name[language as keyof typeof c.name]} ${c.dial_code}`}
                        onSelect={() => handleCountrySelect(c.code)}
                    >
                    <Check
                        className={cn(
                        "mr-2 h-4 w-4",
                        selectedCountry.code === c.code ? "opacity-100" : "opacity-0"
                        )}
                    />
                    <div className="flex items-center gap-2">
                        <Flag countryCode={c.code} />
                        <span>{c.name[language as keyof typeof c.name]}</span>
                        <span className="text-muted-foreground">{c.dial_code}</span>
                    </div>
                    </CommandItem>
                ))}
                </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Input
        {...props}
        ref={ref}
        type="tel"
        value={number}
        onChange={handleNumberChange}
        className={cn("rounded-l-none", className)}
        placeholder={t("Phone Number")}
      />
    </div>
  )
})
PhoneNumberInput.displayName = "PhoneNumberInput"

```
</content>
  </change>
  <change>
    <file>/src/locales/en.json</file>
    <content><![CDATA[
{
    "Jobs": "Jobs",
    "Companies": "Companies",
    "Schools": "Schools",
    "Blog": "Blog",
    "Login": "Login",
    "Sign Up": "Sign Up",
    "Settings": "Settings",
    "Theme": "Theme",
    "Light": "Light",
    "Dark": "Dark",
    "System": "System",
    "Language": "Language",
    "Open menu": "Open menu",
    "Your future starts here": "Your future starts here",
    "Find Your Dream Job Today": "Find Your Dream Job Today",
    "Explore thousands of job opportunities tailored for you in Côte d'Ivoire. Your next career move is just a click away.": "Explore thousands of job opportunities tailored for you in Côte d'Ivoire. Your next career move is just a click away.",
    "Explore Job Openings": "Explore Job Openings",
    "Create an Account": "Create an Account",
    "Build Your Dream Team": "Build Your Dream Team",
    "Access a diverse pool of talented graduates from top schools. Find the perfect fit for your company's culture and goals.": "Access a diverse pool of talented graduates from top schools. Find the perfect fit for your company's culture and goals.",
    "Find Top Talent": "Find Top Talent",
    "Forge Industry Partnerships": "Forge Industry Partnerships",
    "Collaborate with leading academic institutions to shape the future of talent. Connect with the brightest minds and drive innovation.": "Collaborate with leading academic institutions to shape the future of talent. Connect with the brightest minds and drive innovation.",
    "Become a Partner": "Become a Partner",
    "Everything You Need to Succeed": "Everything You Need to Succeed",
    "Yahnu is a comprehensive ecosystem designed to bridge the gap between education and employment. Explore the powerful features tailored for every user.": "Yahnu is a comprehensive ecosystem designed to bridge the gap between education and employment. Explore the powerful features tailored for every user.",
    "For Graduates": "For Graduates",
    "AI-Powered Profile Builder": "AI-Powered Profile Builder",
    "Create a standout professional profile in minutes. Our AI helps you highlight your skills and experiences to attract top employers.": "Create a standout professional profile in minutes. Our AI helps you highlight your skills and experiences to attract top employers.",
    "Personalized Job Matching": "Personalized Job Matching",
    "Receive job recommendations that align with your career goals and qualifications. Say goodbye to endless searching.": "Receive job recommendations that align with your career goals and qualifications. Say goodbye to endless searching.",
    "Skill Development Resources": "Skill Development Resources",
    "Access a library of courses and assessments to enhance your skills and stay competitive in the job market.": "Access a library of courses and assessments to enhance your skills and stay competitive in the job market.",
    "For Companies": "For Companies",
    "Targeted Talent Sourcing": "Targeted Talent Sourcing",
    "Efficiently find qualified candidates from a pre-vetted pool of graduates from top schools.": "Efficiently find qualified candidates from a pre-vetted pool of graduates from top schools.",
    "Streamlined Recruitment": "Streamlined Recruitment",
    "Manage your entire hiring process, from posting jobs to scheduling interviews, all on one platform.": "Manage your entire hiring process, from posting jobs to scheduling interviews, all on one platform.",
    "Data-Driven Insights": "Data-Driven Insights",
    "Gain valuable insights into the talent market and make informed hiring decisions with our analytics tools.": "Gain valuable insights into the talent market and make informed hiring decisions with our analytics tools.",
    "For Schools": "For Schools",
    "Strengthen Industry Ties": "Strengthen Industry Ties",
    "Forge strategic partnerships with leading companies to enhance your curriculum and create opportunities for your students.": "Forge strategic partnerships with leading companies to enhance your curriculum and create opportunities for your students.",
    "Boost Graduate Employability": "Boost Graduate Employability",
    "Track and improve your graduates' employment outcomes with our comprehensive reporting and analytics.": "Track and improve your graduates' employment outcomes with our comprehensive reporting and analytics.",
    "Showcase Your Institution": "Showcase Your Institution",
    "Promote your school's programs and achievements to a wide audience of prospective students and corporate partners.": "Promote your school's programs and achievements to a wide audience of prospective students and corporate partners.",
    "Ready to Join the Elite?": "Ready to Join the Elite?",
    "Create your account today and unlock a world of opportunities. Whether you're a graduate, a company, or a school, Yahnu is your gateway to success.": "Create your account today and unlock a world of opportunities. Whether you're a graduate, a company, or a school, Yahnu is your gateway to success.",
    "Get Started Now": "Get Started Now",
    "Connecting talent, companies, and schools in {country}.": "Connecting talent, companies, and schools in {country}.",
    "Platform": "Platform",
    "Legal": "Legal",
    "Privacy Policy": "Privacy Policy",
    "Terms of Service": "Terms of Service",
    "Contact Us": "Contact Us",
    "Follow Us": "Follow Us",
    "All rights reserved.": "All rights reserved.",
    "Welcome Back": "Welcome Back",
    "Enter your email below to login to your account": "Enter your email below to login to your account",
    "Email": "Email",
    "Password": "Password",
    "Forgot your password?": "Forgot your password?",
    "Login with Google": "Login with Google",
    "Don't have an account?": "Don't have an account?",
    "Sign up": "Sign up",
    "Enter your information to create an account": "Enter your information to create an account",
    "Full name": "Full name",
    "I am a...": "I am a...",
    "Select your account type": "Select your account type",
    "Graduate": "Graduate",
    "Company": "Company",
    "School": "School",
    "Sign up with Google": "Sign up with Google",
    "Already have an account?": "Already have an account?",
    "Sign in": "Sign in",
    "Connect. Grow. Succeed.": "Connect. Grow. Succeed.",
    "Your journey to the perfect career or the ideal candidate starts here.": "Your journey to the perfect career or the ideal candidate starts here.",
    "Join a Thriving Community": "Join a Thriving Community",
    "Create your account to unlock a world of opportunities and connections.": "Create your account to unlock a world of opportunities and connections.",
    "Why Choose Yahnu?": "Why Choose Yahnu?",
    "We provide a comprehensive solution to bridge the gap between education and employment in {country}.": "We provide a comprehensive solution to bridge the gap between education and employment in {country}.",
    "Direct access to a pre-vetted talent pool": "Direct access to a pre-vetted talent pool",
    "AI-driven tools for efficient recruitment and profile building": "AI-driven tools for efficient recruitment and profile building",
    "Strengthened ties between academia and industry": "Strengthened ties between academia and industry",
    "Enhanced career opportunities for graduates": "Enhanced career opportunities for graduates",
    "Yahnu Insights": "Yahnu Insights",
    "Your premier source for career advice, industry trends, and success stories in the {country} professional landscape.": "Your premier source for career advice, industry trends, and success stories in the {country} professional landscape.",
    "By": "By",
    "Read More": "Read More",
    "Featured Companies": "Featured Companies",
    "Discover leading companies in {country} that are hiring top talent. Your next career opportunity awaits.": "Discover leading companies in {country} that are hiring top talent. Your next career opportunity awaits.",
    "Featured Positions": "Featured Positions",
    "View Profile": "View Profile",
    "About": "About",
    "Company Info": "Company Info",
    "Open Positions": "Open Positions",
    "Apply Now": "Apply Now",
    "Partner Schools": "Partner Schools",
    "Collaborating with the finest institutions to nurture the next generation of {country} leaders.": "Collaborating with the finest institutions to nurture the next generation of {country} leaders.",
    "Explore Programs": "Explore Programs",
    "Institution Details": "Institution Details",
    "Featured Programs": "Featured Programs",
    "Learn More": "Learn More",
    "Request Partnership": "Request Partnership",
    "Coming Soon to {country}": "Coming Soon to {country}",
    "Yahnu is not yet available in your country. Enter your email to be notified when we launch!": "Yahnu is not yet available in your country. Enter your email to be notified when we launch!",
    "Thank you! We will notify you when Yahnu is available in {country}.": "Thank you! We will notify you when Yahnu is available in {country}.",
    "Notify Me": "Notify Me",
    "You're on the list!": "You're on the list!",
    "Go back to the homepage": "Go back to the homepage",
    "Select a country": "Select a country",
    "Confirm Password": "Confirm Password",
    "Suggest strong password": "Suggest strong password",
    "Copy": "Copy",
    "Password Copied": "Password Copied",
    "The suggested password has been copied to your clipboard.": "The suggested password has been copied to your clipboard.",
    "Show password": "Show password",
    "Hide password": "Hide password",
    "Contact Person Name": "Contact Person Name",
    "Company Name": "Company Name",
    "School Name": "School Name",
    "School/University": "School/University",
    "Select your school": "Select your school",
    "Industry Sector": "Industry Sector",
    "Select an industry": "Select an industry",
    "Agriculture": "Agriculture",
    "Finance & Banking": "Finance & Banking",
    "Information Technology": "Information Technology",
    "Telecommunications": "Telecommunications",
    "Mining & Resources": "Mining & Resources",
    "Construction & Real Estate": "Construction & Real Estate",
    "Retail & Commerce": "Retail & Commerce",
    "Transportation & Logistics": "Transportation & Logistics",
    "Tourism & Hospitality": "Tourism & Hospitality",
    "Health & Pharmaceuticals": "Health & Pharmaceuticals",
    "Education": "Education",
    "Energy": "Energy",
    "Dashboard": "Dashboard",
    "Messages": "Messages",
    "Profile": "Profile",
    "Job Search": "Job Search",
    "Applications": "Applications",
    "AI Tools": "AI Tools",
    "Company Profile": "Company Profile",
    "Partnerships": "Partnerships",
    "Talent Pool": "Talent Pool",
    "Assessments": "Assessments",
    "School Profile": "School Profile",
    "Graduate Management": "Graduate Management",
    "Analytics": "Analytics",
    "Overview": "Overview",
    "Manage Users": "Manage Users",
    "Manage Team": "Manage Team",
    "Custom Reports": "Custom Reports",
    "Help & Settings": "Help & Settings",
    "Support": "Support",
    "Post Job": "Post Job",
    "The \"{title}\" position has been added.": "The \"{title}\" position has been added.",
    "Job Removed": "Job Removed",
    "The \"{title}\" position has been removed.": "The \"{title}\" position has been removed.",
    "No active job postings.": "No active job postings.",
    "Communicate with candidates and companies directly.": "Communicate with candidates and companies directly.",
    "Search conversations...": "Search conversations...",
    "Type your message...": "Type your message...",
    "Select a conversation to start chatting.": "Select a conversation to start chatting.",
    "Platform Analytics": "Platform Analytics",
    "High-level insights into platform usage and growth.": "High-level insights into platform usage and growth.",
    "Total Users": "Total Users",
    "+180 this month": "+180 this month",
    "Active Graduates": "Active Graduates",
    "On the platform": "On the platform",
    "Active Companies": "Active Companies",
    "+5 this month": "+5 this month",
    "Active Schools": "Active Schools",
    "+1 this month": "+1 this month",
    "User Growth": "User Growth",
    "Total users on the platform over the last 6 months.": "Total users on the platform over the last 6 months.",
    "User Distribution": "User Distribution",
    "Breakdown of user types on the platform.": "Breakdown of user types on the platform.",
    "Recruitment Analytics": "Recruitment Analytics",
    "Insights into your hiring funnel and applicant data.": "Insights into your hiring funnel and applicant data.",
    "Total Applicants": "Total Applicants",
    "Avg. Time to Hire": "Avg. Time to Hire",
    "Interview Rate": "Interview Rate",
    "Applicant Funnel": "Applicant Funnel",
    "Progression of candidates through hiring stages.": "Progression of candidates through hiring stages.",
    "Application Volume": "Application Volume",
    "Number of applications received over time.": "Number of applications received over time.",
    "Applicants by School": "Applicants by School",
    "Source of applicants by academic institution.": "Source of applicants by academic institution.",
    "Graduate Placement Analytics": "Graduate Placement Analytics",
    "Insights into the success of your graduates in the job market.": "Insights into the success of your graduates in the job market.",
    "Total Graduates Hired": "Total Graduates Hired",
    "Top Partner Company": "Top Partner Company",
    "Top Hiring Companies": "Top Hiring Companies",
    "Hires by Industry": "Hires by Industry",
    "Hires": "Hires",
    "Companies that have hired the most graduates from your institution.": "Companies that have hired the most graduates from your institution.",
    "Distribution of graduate placements across different industries.": "Distribution of graduate placements across different industries.",
    "{count} hires this year": "{count} hires this year",
    "Down from 32 days last quarter": "Down from 32 days last quarter",
    " days": " days",
    "+10% from last quarter": "+10% from last quarter",
    "Phone Number": "Phone Number",
    "Search country...": "Search country...",
    "No country found.": "No country found."
}

