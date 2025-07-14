
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { useLocalization } from "@/context/localization-context";

export default function TermsOfServicePage() {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 container mx-auto py-12">
      <div className="prose lg:prose-xl max-w-none">
            <h1>{t('Terms of Service')}</h1>
            <p>{t('Last updated')}: {t('October 26, 2023')}</p>

            <p>{t('Please read these terms and conditions carefully before using Our Service.')}</p>

            <h2>{t('Interpretation and Definitions')}</h2>
            <h3>{t('Interpretation')}</h3>
            <p>{t('The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.')}</p>
            <h3>{t('Definitions')}</h3>
            <p>{t('For the purposes of these Terms and Conditions:')}</p>
            <ul>
                <li><strong>{t('Affiliate')}</strong> {t('means an entity that controls, is controlled by or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.')}</li>
                <li><strong>{t('Country')}</strong> {t('refers to: Côte d\'Ivoire')}</li>
                <li><strong>{t('Company')}</strong> {t('(referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Yahnu.')}</li>
                <li><strong>{t('Device')}</strong> {t('means any device that can access the Service such as a computer, a cellphone or a digital tablet.')}</li>
                <li><strong>{t('Service')}</strong> {t('refers to the Website.')}</li>
                <li><strong>{t('Terms and Conditions')}</strong> {t('(also referred to as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.')}</li>
                <li><strong>{t('Third-party Social Media Service')}</strong> {t('refers to any website or any social network website through which a User can log in or create an account to use the Service.')}</li>
                <li><strong>{t('Website')}</strong> {t('refers to Yahnu, accessible from [Your Website URL]')}</li>
                <li><strong>{t('You')}</strong> {t('means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.')}</li>
            </ul>

            <h2>{t('Acknowledgment')}</h2>
            <p>{t('These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.')}</p>
            <p>{t('Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.')}</p>

            <h2>{t('User Accounts')}</h2>
            <p>{t('When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.')}</p>

            <h2>{t('Termination')}</h2>
            <p>{t('We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.')}</p>

            <h2>{t('Changes to These Terms and Conditions')}</h2>
            <p>{t('We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days\' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.')}</p>

            <h2>{t('Contact Us')}</h2>
            <p>{t('If you have any questions about these Terms and Conditions, You can contact us:')}</p>
            <ul>
                <li>{t('By email')}: contact@yahnu.ci</li>
            </ul>
        </div>
      </main>
      <Footer />
    </div>
  );
}
