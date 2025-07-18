
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen w-full bg-muted/40 py-12 px-4">
       <div className="container max-w-4xl mx-auto">
        
        <Button asChild variant="ghost" className="mb-4 px-0">
            <Link href="/">
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back to home
            </Link>
        </Button>
        <Card className="p-6 md:p-8">
            <CardHeader>
                <CardTitle className="text-4xl font-bold">Terms of Service</CardTitle>
                <CardDescription>Last updated: January 15, 2025</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="prose prose-lg max-w-none prose-h2:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:font-semibold prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-li:mb-2 prose-strong:font-semibold">
                    <p>Please read these terms and conditions carefully before using Our Service.</p>

                    <h2>Interpretation and Definitions</h2>
                    <h3>Interpretation</h3>
                    <p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p>
                    <h3>Definitions</h3>
                    <p>For the purposes of these Terms and Conditions:</p>
                    <ul>
                        <li><strong>Country</strong> refers to: Côte d'Ivoire</li>
                        <li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Yahnu.</li>
                        <li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li>
                        <li><strong>Service</strong> refers to the Website.</li>
                        <li><strong>Terms and Conditions</strong> (also referred to as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li>
                         <li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li>
                    </ul>

                    <h2>Acknowledgment</h2>
                    <p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p>
                    <p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p>

                    <h2>User Accounts</h2>
                    <p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p>

                    <h2>Termination</h2>
                    <p>We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p>

                    <h2>Changes to These Terms and Conditions</h2>
                    <p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p>

                    <h2>Contact Us</h2>
                    <p>If you have any questions about these Terms and Conditions, You can contact us:</p>
                    <ul>
                        <li>By email: <strong>contact@yahnu.org</strong></li>
                    </ul>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
