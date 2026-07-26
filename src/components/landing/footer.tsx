import Link from 'next/link';
import { ArrowUpRight, Mail, MapPin } from 'lucide-react';
import { Logo } from '@/components/ui/logo';

const linkGroups = [
  {
    title: 'Explorer',
    links: [
      ['BE THE CHANGE', '/be-the-change'],
      ['Opportunités', '/jobs'],
      ['Établissements', '/schools'],
      ['Entreprises', '/companies'],
    ],
  },
  {
    title: 'Agir',
    links: [
      ['Jeunes diplômés', '/students'],
      ['Institutions', '/institutions'],
      ['Impact du pilote', '/impact'],
      ['Proposer un pilote', '/contact?intent=pilot&source=footer'],
      ['Créer un profil', '/signup'],
    ],
  },
  {
    title: 'Ressources & confiance',
    links: [
      ['Ressources carrière', '/blog'],
      ['Notre mission', '/about'],
      ['Se connecter', '/login'],
      ['Confidentialité', '/privacy-policy'],
      ['Conditions d’utilisation', '/terms-of-service'],
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[hsl(165_48%_10%)] text-[hsl(42_45%_95%)]">
      <div className="ci-pattern absolute inset-0 opacity-20" aria-hidden="true" />
      <div className="page-shell relative py-14 sm:py-20">
        <div className="grid gap-12 border-b border-white/12 pb-12 lg:grid-cols-[1.35fr_2fr]">
          <div className="max-w-md">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo className="h-12 w-12 text-white" />
              <span className="font-headline text-2xl font-bold">Yahnu</span>
            </Link>
            <p className="mt-5 text-lg leading-7 text-white/70">
              Transformer la formation en insertion mesurée, avec les jeunes, les établissements, les entreprises et les institutions.
            </p>
            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-terra" />Abidjan, Côte d’Ivoire</p>
              <Link className="flex items-center gap-2 transition-colors hover:text-white" href="/contact?source=footer"><Mail className="h-4 w-4 text-terra" />Nous contacter</Link>
              <a className="flex items-center gap-2 transition-colors hover:text-white" href="mailto:contact@yahnu.org"><span className="w-4" aria-hidden="true" />contact@yahnu.org</a>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h2 className="text-xs font-bold uppercase tracking-[0.16em] text-terra">{group.title}</h2>
                <ul className="mt-4 space-y-3">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link href={href} className="inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white">{label}<ArrowUpRight className="h-3.5 w-3.5" /></Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-7 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Yahnu. Tous droits réservés.</p>
          <p>Conçu pour la nouvelle génération de talents ivoiriens.</p>
        </div>
      </div>
    </footer>
  );
}
