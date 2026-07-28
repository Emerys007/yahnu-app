"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Award, BadgeCheck, ExternalLink, Loader2, LockKeyhole } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import type { SkillsAttestationSummary } from "@/lib/skills-checks";

type AttestationsResponse = {
  data: { attestations: SkillsAttestationSummary[] };
};

export function SkillsAttestationsPanel() {
  const [attestations, setAttestations] = useState<SkillsAttestationSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiFetch<AttestationsResponse>("/api/skills/attestations?locale=fr")
      .then((response) => {
        if (!cancelled) setAttestations(response.data.attestations);
      })
      .catch(() => {
        if (!cancelled) setAttestations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <Card className="overflow-hidden border-primary/15">
      <div className="h-1.5 bg-gradient-to-r from-primary via-lagoon to-terra" aria-hidden="true" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="size-5 text-primary" aria-hidden="true" />
          Compétences vérifiées
        </CardTitle>
        <CardDescription>
          Vos Yahnu skills attestations sont privées tant que vous n’activez pas leur lien.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="grid min-h-28 place-items-center" role="status">
            <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          </div>
        ) : attestations.length ? (
          attestations.map((attestation) => (
            <div key={attestation.id} className="rounded-2xl border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-sm font-semibold leading-5">{attestation.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {attestation.score} % · {new Intl.DateTimeFormat("fr-CI", {
                      dateStyle: "medium",
                    }).format(new Date(attestation.issuedAt))}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    attestation.revokedAt
                      ? "border-destructive/25 text-destructive"
                      : attestation.isPublic
                        ? "border-primary/25 text-primary"
                        : ""
                  }
                >
                  {attestation.revokedAt ? "Révoquée" : attestation.isPublic ? "Publique" : "Privée"}
                </Badge>
              </div>
              {attestation.isPublic && !attestation.revokedAt ? (
                <Button asChild variant="ghost" size="sm" className="mt-3 w-full">
                  <Link href={`/verify/skills/${attestation.verificationCode}`} target="_blank">
                    Ouvrir la vérification
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-5 text-center">
            <LockKeyhole className="mx-auto size-7 text-muted-foreground" aria-hidden="true" />
            <p className="mt-3 text-sm font-medium">Aucune attestation pour le moment</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Réussissez un Skills Check pour créer une attestation privée.
            </p>
          </div>
        )}
        <Button asChild className="w-full" variant={attestations.length ? "outline" : "default"}>
          <Link href="/dashboard/skills-checks">
            {attestations.length ? "Gérer mes attestations" : "Découvrir les Skills Checks"}
          </Link>
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          Une Yahnu skills attestation n’est pas une certification accréditée.
        </p>
      </CardContent>
    </Card>
  );
}
