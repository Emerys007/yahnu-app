import type { Metadata } from "next";

const FALLBACK_ORIGIN = "https://yahnu.org";
const DEFAULT_SOCIAL_IMAGE = "/opengraph-image";

function configuredOrigin() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() || FALLBACK_ORIGIN;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      return new URL(FALLBACK_ORIGIN);
    }
    parsed.pathname = "/";
    parsed.search = "";
    parsed.hash = "";
    return parsed;
  } catch {
    return new URL(FALLBACK_ORIGIN);
  }
}

export const siteOrigin = configuredOrigin();
export const siteName = "Yahnu";
export const defaultDescription =
  "La plateforme ivoirienne qui relie jeunes diplômés, établissements, entreprises et institutions pour transformer la formation en insertion mesurée.";

export function absoluteUrl(path = "/") {
  return new URL(path, siteOrigin).toString();
}

type PublicMetadataInput = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string | null;
};

export function publicPageMetadata({
  title,
  description,
  path,
  keywords = [],
  image,
}: PublicMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const socialImage = absoluteUrl(image || DEFAULT_SOCIAL_IMAGE);

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "fr_CI",
      siteName,
      title,
      description,
      url: canonical,
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${title} — Yahnu` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [socialImage],
    },
  };
}

export function privatePageMetadata(title: string, description?: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: null },
    openGraph: null,
    twitter: null,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
    },
  };
}

export const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": absoluteUrl("/#organization"),
  name: siteName,
  url: absoluteUrl("/"),
  logo: absoluteUrl("/images/yahnu-logo.png"),
  email: "contact@yahnu.org",
  description: defaultDescription,
  areaServed: {
    "@type": "Country",
    name: "Côte d’Ivoire",
  },
};

export const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": absoluteUrl("/#website"),
  url: absoluteUrl("/"),
  name: siteName,
  inLanguage: "fr-CI",
  publisher: { "@id": absoluteUrl("/#organization") },
};
