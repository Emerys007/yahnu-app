"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Check,
  ChevronLeft,
  Clock3,
  EyeOff,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type PracticeQuestion = {
  prompt: string;
  options: readonly string[];
  answer: number;
};

type Practice = {
  title: string;
  eyebrow: string;
  duration: string;
  questions: readonly PracticeQuestion[];
};

const practiceData = {
  "frontend-basics": {
    title: "Bases du développement frontend",
    eyebrow: "Numérique",
    duration: "10–12 min",
    questions: [
      {
        prompt: "Dans React, à quoi servent principalement les props ?",
        options: ["À transmettre des données à un composant", "À écrire les styles CSS", "À stocker des mots de passe", "À remplacer le navigateur"],
        answer: 0,
      },
      {
        prompt: "Quel hook permet de conserver une valeur qui évolue dans un composant fonctionnel ?",
        options: ["useEffect", "useState", "useMemo", "useId"],
        answer: 1,
      },
      {
        prompt: "Pour le site mobile d’une fintech à Abidjan, quelle approche CSS facilite l’adaptation aux petits écrans ?",
        options: ["Mobile first", "Large écran uniquement", "Largeurs fixes partout", "Texte intégré aux images"],
        answer: 0,
      },
      {
        prompt: "Quelle balise HTML est la plus adaptée au bouton principal d’envoi d’un formulaire ?",
        options: ["<span>", "<button>", "<div>", "<section>"],
        answer: 1,
      },
      {
        prompt: "Pourquoi fournir un texte alternatif pertinent à une image ?",
        options: ["Pour la rendre plus lourde", "Pour l’accessibilité et les cas où elle ne s’affiche pas", "Pour bloquer le zoom", "Pour changer son format"],
        answer: 1,
      },
      {
        prompt: "Dans une liste React d’offres d’emploi, à quoi sert la prop key ?",
        options: ["À chiffrer les données", "À aider React à identifier chaque élément", "À ouvrir une nouvelle page", "À définir la couleur"],
        answer: 1,
      },
      {
        prompt: "Quel code de statut HTTP indique généralement qu’une ressource demandée est introuvable ?",
        options: ["200", "201", "404", "500"],
        answer: 2,
      },
      {
        prompt: "Quelle pratique améliore le confort d’une personne sensible aux animations ?",
        options: ["Multiplier les clignotements", "Respecter prefers-reduced-motion", "Forcer la lecture vidéo", "Masquer les boutons"],
        answer: 1,
      },
    ],
  },
  "financial-analysis": {
    title: "Analyse financière en FCFA",
    eyebrow: "Finance",
    duration: "10–12 min",
    questions: [
      {
        prompt: "Quel document présente les actifs et les passifs d’une PME ivoirienne à une date précise ?",
        options: ["Le bilan", "Le devis", "Le bon de livraison", "Le registre des appels"],
        answer: 0,
      },
      {
        prompt: "Une entreprise encaisse 12 000 000 FCFA et dépense 9 000 000 FCFA. Quel est son résultat simplifié ?",
        options: ["1 000 000 FCFA", "3 000 000 FCFA", "9 000 000 FCFA", "21 000 000 FCFA"],
        answer: 1,
      },
      {
        prompt: "Le fonds de roulement net se calcule généralement comment ?",
        options: ["Actifs courants − passifs courants", "Ventes + salaires", "Stocks × loyers", "Trésorerie − chiffre d’affaires"],
        answer: 0,
      },
      {
        prompt: "Quelle section du tableau des flux inclut l’achat d’un nouveau véhicule de livraison ?",
        options: ["Exploitation", "Investissement", "Communication", "Ressources humaines"],
        answer: 1,
      },
      {
        prompt: "Une marge brute positive signifie, avant les autres charges, que…",
        options: ["les ventes dépassent le coût direct des produits vendus", "l’entreprise n’a aucune dette", "tous les clients ont payé", "les impôts sont nuls"],
        answer: 0,
      },
      {
        prompt: "Pourquoi suivre le délai moyen de paiement des clients ?",
        options: ["Pour choisir le logo", "Pour anticiper les tensions de trésorerie", "Pour mesurer la taille du bureau", "Pour calculer les congés"],
        answer: 1,
      },
      {
        prompt: "Une machine achetée 6 000 000 FCFA est amortie linéairement sur 5 ans, sans valeur résiduelle. Quel est l’amortissement annuel ?",
        options: ["600 000 FCFA", "1 000 000 FCFA", "1 200 000 FCFA", "5 000 000 FCFA"],
        answer: 2,
      },
      {
        prompt: "Quel ratio aide à apprécier la capacité à régler les dettes à court terme ?",
        options: ["Ratio de liquidité", "Taux de clic", "Part de voix", "Taux d’absentéisme"],
        answer: 0,
      },
    ],
  },
  "agronomy-principles": {
    title: "Agronomie et filières locales",
    eyebrow: "Agriculture",
    duration: "10–12 min",
    questions: [
      {
        prompt: "Que mesure le pH d’un sol ?",
        options: ["Son acidité ou son alcalinité", "Sa superficie", "Le poids de la récolte", "La vitesse du vent"],
        answer: 0,
      },
      {
        prompt: "Quel macronutriment contribue fortement à la croissance végétative des plantes ?",
        options: ["Azote", "Fer", "Cuivre", "Zinc"],
        answer: 0,
      },
      {
        prompt: "Pourquoi alterner les cultures sur une parcelle ?",
        options: ["Pour appauvrir le sol", "Pour rompre certains cycles de ravageurs et préserver le sol", "Pour supprimer toute observation", "Pour augmenter le ruissellement"],
        answer: 1,
      },
      {
        prompt: "Quelle méthode d’irrigation limite généralement le mieux les pertes d’eau ?",
        options: ["Inondation", "Goutte-à-goutte", "Arrosage à midi", "Ruissellement libre"],
        answer: 1,
      },
      {
        prompt: "Dans une cacaoyère, l’agroforesterie peut notamment…",
        options: ["apporter de l’ombrage et diversifier la parcelle", "supprimer toute biodiversité", "remplacer le suivi des maladies", "empêcher toute récolte"],
        answer: 0,
      },
      {
        prompt: "Quel geste aide à réduire l’érosion du sol ?",
        options: ["Laisser le sol nu", "Maintenir une couverture végétale", "Brûler systématiquement les résidus", "Concentrer le ruissellement"],
        answer: 1,
      },
      {
        prompt: "Avant de recommander un engrais à un producteur d’anacarde, quelle étape est la plus rigoureuse ?",
        options: ["Analyser le sol et observer la parcelle", "Choisir au hasard", "Doubler toutes les doses", "Ignorer l’historique de culture"],
        answer: 0,
      },
      {
        prompt: "La lutte intégrée contre les ravageurs cherche à…",
        options: ["utiliser uniquement des pesticides", "combiner plusieurs méthodes en limitant les risques", "éliminer toute observation au champ", "traiter à date fixe sans diagnostic"],
        answer: 1,
      },
    ],
  },
  "supply-chain": {
    title: "Logistique et chaîne d’approvisionnement",
    eyebrow: "Opérations",
    duration: "10–12 min",
    questions: [
      {
        prompt: "À quoi sert un stock de sécurité ?",
        options: ["À absorber une variation imprévue de la demande ou du délai", "À masquer les inventaires", "À remplacer les fournisseurs", "À augmenter les erreurs"],
        answer: 0,
      },
      {
        prompt: "Que signifie généralement FIFO en gestion de stock ?",
        options: ["Premier entré, premier sorti", "Produit final, facture ouverte", "Fret international, frais obligatoires", "Flux interne, flux externe"],
        answer: 0,
      },
      {
        prompt: "Un conteneur arrive au port d’Abidjan avec un retard annoncé. Quelle est la première action utile ?",
        options: ["Ignorer l’information", "Mesurer l’impact et prévenir les parties concernées", "Annuler toutes les commandes", "Modifier les quantités reçues"],
        answer: 1,
      },
      {
        prompt: "Quel indicateur mesure la part des commandes livrées à la date promise ?",
        options: ["Taux de livraison à temps", "Taux de contraste", "Taux de recrutement", "Taux d’ouverture d’e-mail"],
        answer: 0,
      },
      {
        prompt: "Pourquoi réaliser des inventaires tournants ?",
        options: ["Pour contrôler régulièrement l’exactitude du stock", "Pour supprimer les références", "Pour bloquer les ventes", "Pour éviter toute traçabilité"],
        answer: 0,
      },
      {
        prompt: "Pour une livraison Abidjan–Bouaké, quel élément faut-il intégrer à la planification ?",
        options: ["Le délai, l’itinéraire, le véhicule et les contraintes de livraison", "La couleur du reçu uniquement", "Le nombre d’abonnés du chauffeur", "La météo d’un autre pays uniquement"],
        answer: 0,
      },
      {
        prompt: "Dans un entrepôt, le picking correspond à…",
        options: ["prélever les articles d’une commande", "recruter un livreur", "payer une facture", "nettoyer les données clients"],
        answer: 0,
      },
      {
        prompt: "Quel document accompagne souvent les marchandises et détaille ce qui est remis au client ?",
        options: ["Le bon de livraison", "Le CV", "Le procès-verbal de réunion", "La fiche de paie"],
        answer: 0,
      },
    ],
  },
  "customer-service": {
    title: "Relation client professionnelle",
    eyebrow: "Compétences humaines",
    duration: "8–10 min",
    questions: [
      {
        prompt: "Un client écrit sur WhatsApp parce que sa commande tarde. Quelle réponse est la plus professionnelle ?",
        options: ["Reconnaître la gêne, vérifier le dossier et annoncer la prochaine étape", "Laisser le message sans réponse", "Accuser immédiatement le livreur", "Répondre uniquement « patience »"],
        answer: 0,
      },
      {
        prompt: "L’écoute active consiste notamment à…",
        options: ["reformuler le besoin pour le confirmer", "couper la parole", "préparer sa réponse sans écouter", "promettre l’impossible"],
        answer: 0,
      },
      {
        prompt: "Si tu ne peux pas résoudre une demande seul, que fais-tu ?",
        options: ["Tu fermes le dossier", "Tu l’orientes vers la bonne personne avec le contexte utile", "Tu inventes une solution", "Tu demandes au client de rappeler sans explication"],
        answer: 1,
      },
      {
        prompt: "Quelle information ne doit jamais être demandée par message non sécurisé ?",
        options: ["Le quartier de livraison", "Un mot de passe ou code secret", "La référence de commande", "Le créneau préféré"],
        answer: 1,
      },
      {
        prompt: "Face à un client très mécontent en agence, quel ton adopter ?",
        options: ["Calme, respectueux et précis", "Moqueur", "Défensif", "Agressif"],
        answer: 0,
      },
      {
        prompt: "Pourquoi noter les échanges importants dans le dossier client ?",
        options: ["Pour assurer un suivi cohérent", "Pour allonger la réponse", "Pour publier la conversation", "Pour éviter de résoudre la demande"],
        answer: 0,
      },
      {
        prompt: "Une bonne promesse de rappel est…",
        options: ["précise et réaliste", "vague et sans délai", "toujours immédiate", "réservée aux grands comptes"],
        answer: 0,
      },
      {
        prompt: "Après résolution, quelle question donne un retour simple sur l’expérience ?",
        options: ["Êtes-vous satisfait de la solution apportée ?", "Quel est votre salaire ?", "Pourquoi avez-vous appelé ?", "Avez-vous vu notre logo ?"],
        answer: 0,
      },
    ],
  },
  "cognitive-aptitude": {
    title: "Raisonnement et résolution de problèmes",
    eyebrow: "Compétences humaines",
    duration: "8–10 min",
    questions: [
      {
        prompt: "Un trajet Abidjan–Yamoussoukro dure 3 h. En partant à 7 h 30, à quelle heure arrives-tu sans arrêt ?",
        options: ["9 h 30", "10 h 30", "11 h 30", "12 h 30"],
        answer: 1,
      },
      {
        prompt: "Une équipe traite 24 dossiers en 6 heures à rythme constant. Combien en traite-t-elle par heure ?",
        options: ["3", "4", "6", "8"],
        answer: 1,
      },
      {
        prompt: "Quel nombre complète la suite : 3, 6, 12, 24, … ?",
        options: ["30", "36", "42", "48"],
        answer: 3,
      },
      {
        prompt: "Un ordinateur coûte 400 000 FCFA après une remise de 20 %. Quel était son prix avant remise ?",
        options: ["420 000 FCFA", "480 000 FCFA", "500 000 FCFA", "520 000 FCFA"],
        answer: 2,
      },
      {
        prompt: "Tous les développeurs de l’équipe utilisent Git. Aya est développeuse dans l’équipe. Que peut-on conclure ?",
        options: ["Aya utilise Git", "Aya dirige l’équipe", "Aya travaille à distance", "Aya utilise uniquement Git"],
        answer: 0,
      },
      {
        prompt: "Trois entretiens durent chacun 40 minutes. Quelle durée totale faut-il prévoir sans pause ?",
        options: ["1 h 20", "1 h 40", "2 h", "2 h 20"],
        answer: 2,
      },
      {
        prompt: "Quel mot est différent des autres : cacao, anacarde, hévéa, ordinateur ?",
        options: ["Cacao", "Anacarde", "Hévéa", "Ordinateur"],
        answer: 3,
      },
      {
        prompt: "Un budget de 90 000 FCFA est réparti à parts égales entre 6 ateliers. Quel montant reçoit chaque atelier ?",
        options: ["12 000 FCFA", "15 000 FCFA", "18 000 FCFA", "20 000 FCFA"],
        answer: 1,
      },
    ],
  },
} as const satisfies Record<string, Practice>;

type PracticeId = keyof typeof practiceData;

function isPracticeId(value: string): value is PracticeId {
  return value in practiceData;
}

function PracticeIntro({ practice, onStart }: { practice: Practice; onStart: () => void }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Button variant="ghost" asChild className="-ml-3">
        <Link href="/dashboard/assessments">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Tous les exercices
        </Link>
      </Button>

      <Card className="overflow-hidden border-lagoon/20">
        <div className="h-2 bg-gradient-to-r from-primary via-lagoon to-terra" aria-hidden="true" />
        <CardHeader className="pb-4">
          <Badge className="mb-4 w-fit bg-lagoon/10 text-lagoon hover:bg-lagoon/10">{practice.eyebrow}</Badge>
          <CardTitle className="text-2xl sm:text-3xl">{practice.title}</CardTitle>
          <CardDescription className="text-base leading-7">
            Un exercice pratique et autonome pour situer tes acquis, sans pression et sans surveillance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 p-4">
              <BookOpenCheck className="mb-3 h-5 w-5 text-primary" aria-hidden="true" />
              <strong className="block font-display">{practice.questions.length} questions</strong>
              <span className="text-sm text-muted-foreground">une réponse chacune</span>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <Clock3 className="mb-3 h-5 w-5 text-terra" aria-hidden="true" />
              <strong className="block font-display">{practice.duration}</strong>
              <span className="text-sm text-muted-foreground">aucun chronomètre</span>
            </div>
            <div className="rounded-2xl bg-muted/60 p-4">
              <EyeOff className="mb-3 h-5 w-5 text-lagoon" aria-hidden="true" />
              <strong className="block font-display">100 % privé</strong>
              <span className="text-sm text-muted-foreground">résultat dans cet onglet</span>
            </div>
          </div>

          <Alert className="border-primary/20 bg-primary/5">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
            <AlertTitle>Bon à savoir</AlertTitle>
            <AlertDescription className="leading-6">
              Ceci n’est ni une certification ni une évaluation vérifiée. Aucune caméra, aucun micro et aucun enregistrement ne sont utilisés. Ton score ne crée pas de badge et n’est pas partagé avec une entreprise.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-3 border-t bg-muted/25 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Tu peux quitter ou recommencer quand tu veux.</p>
          <Button onClick={onStart} size="lg" className="sm:min-w-52">
            Commencer
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function PracticeInterface({ practiceId, practice }: { practiceId: PracticeId; practice: Practice }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Array<number | undefined>>(() => Array(practice.questions.length).fill(undefined));
  const [message, setMessage] = useState("");

  const question = practice.questions[currentQuestion];
  const selectedAnswer = answers[currentQuestion];
  const progress = ((currentQuestion + 1) / practice.questions.length) * 100;
  const answeredCount = answers.filter((answer) => answer !== undefined).length;

  const selectAnswer = (value: string) => {
    const next = [...answers];
    next[currentQuestion] = Number(value);
    setAnswers(next);
    setMessage("");
  };

  const goNext = () => {
    if (selectedAnswer === undefined) {
      setMessage("Choisis une réponse pour continuer.");
      return;
    }

    if (currentQuestion < practice.questions.length - 1) {
      setCurrentQuestion((index) => index + 1);
      setMessage("");
      window.scrollTo({ top: 0 });
      return;
    }

    const correct = practice.questions.reduce(
      (total, item, index) => total + (answers[index] === item.answer ? 1 : 0),
      0,
    );
    const score = Math.round((correct / practice.questions.length) * 100);

    const localResult = {
      version: 1,
      testId: practiceId,
      title: practice.title,
      score,
      correct,
      total: practice.questions.length,
      completedAt: new Date().toISOString(),
    };

    try {
      sessionStorage.setItem(`yahnu:practice-result:${practiceId}`, JSON.stringify(localResult));
    } catch {
      // The result screen handles unavailable session storage with a clear fallback.
    }
    router.push(`/dashboard/assessment/${practiceId}/result`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" asChild className="-ml-3">
          <Link href="/dashboard/assessments">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Quitter l’exercice
          </Link>
        </Button>
        <Badge variant="outline" className="border-lagoon/25 bg-lagoon/5 text-lagoon">
          <EyeOff className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Entraînement privé
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/25">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="section-kicker">{practice.eyebrow}</p>
              <CardTitle className="text-xl sm:text-2xl">{practice.title}</CardTitle>
            </div>
            <div className="rounded-xl border bg-background px-3 py-2 text-sm text-muted-foreground">
              {answeredCount}/{practice.questions.length} répondues
            </div>
          </div>
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span id="practice-progress-label">Question {currentQuestion + 1} sur {practice.questions.length}</span>
              <span className="text-muted-foreground">{Math.round(progress)} %</span>
            </div>
            <Progress value={progress} aria-labelledby="practice-progress-label" />
          </div>
        </CardHeader>

        <CardContent className="py-6 sm:py-8">
          <fieldset>
            <legend className="max-w-3xl font-display text-xl font-semibold leading-8 sm:text-2xl">
              {question.prompt}
            </legend>
            <RadioGroup
              value={selectedAnswer === undefined ? "" : String(selectedAnswer)}
              onValueChange={selectAnswer}
              className="mt-6 grid gap-3"
            >
              {question.options.map((option, index) => {
                const optionId = `question-${currentQuestion}-option-${index}`;
                const selected = selectedAnswer === index;
                return (
                  <Label
                    key={optionId}
                    htmlFor={optionId}
                    className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-2xl border p-4 font-normal leading-6 transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
                      selected ? "border-primary bg-primary/5" : "bg-background hover:border-primary/35 hover:bg-muted/40"
                    }`}
                  >
                    <RadioGroupItem value={String(index)} id={optionId} />
                    <span className="flex-1">{option}</span>
                    {selected && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  </Label>
                );
              })}
            </RadioGroup>
          </fieldset>

          <p role="alert" aria-live="polite" className="mt-4 min-h-5 text-sm font-medium text-destructive">
            {message}
          </p>
        </CardContent>

        <CardFooter className="flex-col-reverse gap-3 border-t bg-muted/25 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentQuestion((index) => Math.max(0, index - 1));
              setMessage("");
            }}
            disabled={currentQuestion === 0}
            className="w-full sm:w-auto"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Précédente
          </Button>
          <Button onClick={goNext} className="w-full sm:w-auto sm:min-w-48">
            {currentQuestion === practice.questions.length - 1 ? "Voir mon bilan" : "Question suivante"}
            {currentQuestion === practice.questions.length - 1 ? (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            )}
          </Button>
        </CardFooter>
      </Card>

      <p className="flex items-start gap-2 text-sm leading-6 text-muted-foreground">
        <MapPin className="mt-1 h-4 w-4 shrink-0 text-terra" aria-hidden="true" />
        Les situations sont inspirées du quotidien professionnel en Côte d’Ivoire. Elles servent à apprendre, pas à établir une qualification officielle.
      </p>
    </div>
  );
}

export default function TakeAssessmentPage() {
  const params = useParams<{ testId: string }>();
  const [started, setStarted] = useState(false);
  const testIdParam = params?.testId;
  const rawTestId = (Array.isArray(testIdParam) ? testIdParam[0] : testIdParam) ?? "";
  const practiceId = useMemo(() => (isPracticeId(rawTestId) ? rawTestId : null), [rawTestId]);

  if (!practiceId) {
    return (
      <div className="mx-auto max-w-xl py-12 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-terra/10 text-terra">
          <BookOpenCheck className="h-6 w-6" aria-hidden="true" />
        </div>
        <h1 className="font-display text-2xl font-semibold">Exercice introuvable</h1>
        <p className="mt-2 text-muted-foreground">Ce parcours n’est pas disponible ou son adresse a changé.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/assessments">Voir les exercices disponibles</Link>
        </Button>
      </div>
    );
  }

  const practice = practiceData[practiceId];
  return started ? (
    <PracticeInterface practiceId={practiceId} practice={practice} />
  ) : (
    <PracticeIntro practice={practice} onStart={() => setStarted(true)} />
  );
}
