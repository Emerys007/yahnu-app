
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Video, ShieldAlert } from 'lucide-react';
import { useLocalization } from '@/context/localization-context';

const testData = {
    'frontend-basics': {
        en: {
            title: 'Frontend Development (React)',
            questions: [
                { question: "What is JSX?", options: ["A JavaScript syntax extension", "A templating engine", "A CSS preprocessor", "A database query language"], answer: "A JavaScript syntax extension" },
                { question: "How do you pass data to a component from outside?", options: ["state", "props", "refs", "context"], answer: "props" },
                { question: "Which hook would you use to track state in a function component?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: "useState" },
                { question: "What is the virtual DOM?", options: ["A direct representation of the actual DOM", "A copy of the DOM kept in memory for manipulation", "A browser feature for faster rendering", "A JavaScript library for DOM traversal"], answer: "A copy of the DOM kept in memory for manipulation" },
                { question: "In React, what is used to handle side effects in a component?", options: ["useState", "useEffect", "useContext", "useReducer"], answer: "useEffect" },
                { question: "How can you conditionally render a component in React?", options: ["Using a switch statement", "Using a for loop", "Using ternary operators or logical AND (&&)", "Using the <conditional> tag"], answer: "Using ternary operators or logical AND (&&)" },
                { question: "What is the purpose of a key prop in a list of elements?", options: ["It provides styling to the element", "It is a globally unique identifier", "It helps React identify which items have changed, are added, or are removed", "It sets the encryption key for the component"], answer: "It helps React identify which items have changed, are added, or are removed" },
                { question: "What is the difference between state and props?", options: ["Props are immutable and passed from parent, state is mutable and managed within the component", "State is immutable and passed from parent, props are mutable and managed within the component", "They are the same thing", "Props are for styling, state is for data"], answer: "Props are immutable and passed from parent, state is mutable and managed within the component" },
                { question: "What does `React.memo()` do?", options: ["It memorizes the component's state", "It is a higher-order component that memoizes the rendered output, preventing re-renders if props are unchanged", "It connects a component to a Redux store", "It creates a memo pad for developers in the console"], answer: "It is a higher-order component that memoizes the rendered output, preventing re-renders if props are unchanged" },
                { question: "How do you lift state up in React?", options: ["By moving the state to the highest-level component", "By using a global variable", "By moving the state to a common ancestor of the components that need it", "By using the `liftState` hook"], answer: "By moving the state to a common ancestor of the components that need it" }
            ]
        },
        fr: {
            title: 'Développement Frontend (React)',
            questions: [
                { question: "Qu'est-ce que le JSX ?", options: ["Une extension de syntaxe JavaScript", "Un moteur de modèles", "Un préprocesseur CSS", "Un langage de requête de base de données"], answer: "Une extension de syntaxe JavaScript" },
                { question: "Comment passez-vous des données à un composant de l'extérieur ?", options: ["state", "props", "refs", "context"], answer: "props" },
                { question: "Quel hook utiliseriez-vous pour suivre l'état dans un composant fonctionnel ?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: "useState" },
                { question: "Qu'est-ce que le DOM virtuel ?", options: ["Une représentation directe du DOM réel", "Une copie du DOM conservée en mémoire pour la manipulation", "Une fonctionnalité de navigateur pour un rendu plus rapide", "Une bibliothèque JavaScript pour le parcours du DOM"], answer: "Une copie du DOM conservée en mémoire pour la manipulation" },
                { question: "Dans React, qu'est-ce qui est utilisé pour gérer les effets de bord dans un composant ?", options: ["useState", "useEffect", "useContext", "useReducer"], answer: "useEffect" },
                { question: "Comment pouvez-vous afficher un composant de manière conditionnelle dans React ?", options: ["En utilisant une instruction switch", "En utilisant une boucle for", "En utilisant des opérateurs ternaires ou un ET logique (&&)", "En utilisant la balise <conditional>"], answer: "En utilisant des opérateurs ternaires ou un ET logique (&&)" },
                { question: "Quel est le but d'une prop 'key' dans une liste d'éléments ?", options: ["Elle fournit un style à l'élément", "C'est un identifiant global unique", "Elle aide React à identifier quels éléments ont changé, ont été ajoutés ou supprimés", "Elle définit la clé de chiffrement du composant"], answer: "Elle aide React à identifier quels éléments ont changé, ont été ajoutés ou supprimés" },
                { question: "Quelle est la différence entre l'état (state) et les props ?", options: ["Les props sont immuables et passées du parent, l'état est mutable et géré dans le composant", "L'état est immuable et passé du parent, les props sont mutables et gérées dans le composant", "Ce sont la même chose", "Les props sont pour le style, l'état est pour les données"], answer: "Les props sont immuables et passées du parent, l'état est mutable et géré dans le composant" },
                { question: "Que fait `React.memo()` ?", options: ["Il mémorise l'état du composant", "C'est un composant d'ordre supérieur qui mémorise le rendu, empêchant les re-render si les props n'ont pas changé", "Il connecte un composant à un store Redux", "Il crée un bloc-notes pour les développeurs dans la console"], answer: "C'est un composant d'ordre supérieur qui mémorise le rendu, empêchant les re-render si les props n'ont pas changé" },
                { question: "Comment 'remonter l'état' (lift state up) dans React ?", options: ["En déplaçant l'état vers le composant de plus haut niveau", "En utilisant une variable globale", "En déplaçant l'état vers un ancêtre commun des composants qui en ont besoin", "En utilisant le hook `liftState`"], answer: "En déplaçant l'état vers un ancêtre commun des composants qui en ont besoin" }
            ]
        }
    },
    'financial-analysis': {
        en: {
            title: 'Financial Analysis Fundamentals',
            questions: [
                { question: "Which statement shows a company's financial position at a specific point in time?", options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Statement of Retained Earnings"], answer: "Balance Sheet" },
                { question: "What does EBIT stand for?", options: ["Earnings Before Interest and Taxes", "Earnings Before Investment and Transactions", "Estimated Business Income and Totals", "Equity Backed Investment Trust"], answer: "Earnings Before Interest and Taxes" },
                { question: "Which ratio is a measure of a company's ability to meet its short-term obligations?", options: ["Debt-to-Equity Ratio", "Current Ratio", "Return on Equity", "Price-to-Earnings Ratio"], answer: "Current Ratio" },
                { question: "What is the formula for calculating Net Income?", options: ["Revenue - Expenses", "Revenue - Cost of Goods Sold", "Gross Profit - Operating Expenses", "EBIT - Interest - Taxes"], answer: "Revenue - Expenses" },
                { question: "What is Depreciation?", options: ["A cash expense", "An increase in asset value", "The allocation of the cost of an asset over its useful life", "A measure of a company's debt"], answer: "The allocation of the cost of an asset over its useful life" },
                { question: "Which section of the Cash Flow Statement includes the purchase and sale of long-term assets?", options: ["Operating Activities", "Investing Activities", "Financing Activities", "Non-cash Activities"], answer: "Investing Activities" },
                { question: "What is Working Capital?", options: ["Total Assets - Total Liabilities", "Current Assets - Current Liabilities", "Revenue - Expenses", "Cash + Accounts Receivable"], answer: "Current Assets - Current Liabilities" },
                { question: "The process of determining the current worth of an asset or a company is known as:", options: ["Budgeting", "Auditing", "Valuation", "Forecasting"], answer: "Valuation" },
                { question: "What does CAGR stand for?", options: ["Compound Annual Growth Rate", "Current Asset Growth Rate", "Company Annual Gross Revenue", "Cumulative Annual General Return"], answer: "Compound Annual Growth Rate" },
                { question: "If a company's assets are $150,000 and its liabilities are $90,000, what is its equity?", options: ["$240,000", "$150,000", "$90,000", "$60,000"], answer: "$60,000" }
            ]
        },
        fr: {
            title: 'Principes de l\'Analyse Financière',
            questions: [
                { question: "Quel état financier montre la situation financière d'une entreprise à un moment précis ?", options: ["Compte de résultat", "Bilan", "Tableau des flux de trésorerie", "État des résultats non distribués"], answer: "Bilan" },
                { question: "Que signifie EBIT ?", options: ["Bénéfice Avant Intérêts et Impôts", "Bénéfice Avant Investissement et Transactions", "Revenu d'Entreprise Estimé et Totaux", "Fiducie de Placement adossée à des Actions"], answer: "Bénéfice Avant Intérêts et Impôts" },
                { question: "Quel ratio mesure la capacité d'une entreprise à faire face à ses obligations à court terme ?", options: ["Ratio d'endettement", "Ratio de liquidité générale", "Rentabilité des capitaux propres", "Ratio cours/bénéfice"], answer: "Ratio de liquidité générale" },
                { question: "Quelle est la formule pour calculer le résultat net ?", options: ["Revenus - Dépenses", "Revenus - Coût des marchandises vendues", "Marge brute - Charges d'exploitation", "EBIT - Intérêts - Impôts"], answer: "Revenus - Dépenses" },
                { question: "Qu'est-ce que l'amortissement ?", options: ["Une dépense de trésorerie", "Une augmentation de la valeur d'un actif", "La répartition du coût d'un actif sur sa durée de vie utile", "Une mesure de la dette d'une entreprise"], answer: "La répartition du coût d'un actif sur sa durée de vie utile" },
                { question: "Quelle section du tableau des flux de trésorerie inclut l'achat et la vente d'actifs à long terme ?", options: ["Activités d'exploitation", "Activités d'investissement", "Activités de financement", "Activités hors trésorerie"], answer: "Activités d'investissement" },
                { question: "Qu'est-ce que le fonds de roulement ?", options: ["Actifs totaux - Passifs totaux", "Actifs courants - Passifs courants", "Revenus - Dépenses", "Trésorerie + Comptes clients"], answer: "Actifs courants - Passifs courants" },
                { question: "Le processus de détermination de la valeur actuelle d'un actif ou d'une entreprise est connu sous le nom de :", options: ["Budgétisation", "Audit", "Évaluation", "Prévision"], answer: "Évaluation" },
                { question: "Que signifie CAGR ?", options: ["Taux de croissance annuel composé", "Taux de croissance des actifs courants", "Revenu brut annuel de l'entreprise", "Rendement général annuel cumulatif"], answer: "Taux de croissance annuel composé" },
                { question: "Si les actifs d'une entreprise sont de 150 000 $ et ses passifs de 90 000 $, quels sont ses capitaux propres ?", options: ["240 000 $", "150 000 $", "90 000 $", "60 000 $"], answer: "60 000 $" }
            ]
        }
    },
    'agronomy-principles': {
        en: {
            title: 'Modern Agronomy Principles',
            questions: [
                { question: "Which of these is a primary macronutrient for plants?", options: ["Calcium", "Sulfur", "Nitrogen", "Iron"], answer: "Nitrogen" },
                { question: "What does soil pH measure?", options: ["Soil moisture", "Soil density", "Soil acidity or alkalinity", "Soil temperature"], answer: "Soil acidity or alkalinity" },
                { question: "Which practice is a key component of conservation tillage?", options: ["Intensive plowing", "Leaving crop residue on the soil surface", "Bare fallow periods", "Using heavy machinery"], answer: "Leaving crop residue on the soil surface" },
                { question: "What is the primary goal of Integrated Pest Management (IPM)?", options: ["To completely eradicate all pests", "To rely solely on chemical pesticides", "To manage pests with minimal economic and environmental risk", "To use only biological control methods"], answer: "To manage pests with minimal economic and environmental risk" },
                { question: "The process of water moving through a plant and its evaporation from aerial parts, such as leaves, is called:", options: ["Respiration", "Photosynthesis", "Transpiration", "Percolation"], answer: "Transpiration" },
                { question: "Which of the following is an example of a leguminous crop used for nitrogen fixation?", options: ["Maize", "Wheat", "Soybean", "Rice"], answer: "Soybean" },
                { question: "What is soil texture determined by?", options: ["The amount of organic matter", "The proportion of sand, silt, and clay", "The color of the soil", "The depth of the topsoil"], answer: "The proportion of sand, silt, and clay" },
                { question: "Crop rotation is primarily used to:", options: ["Make the field look uniform", "Increase water runoff", "Break pest cycles and improve soil health", "Allow for easier harvesting"], answer: "Break pest cycles and improve soil health" },
                { question: "Which irrigation method is generally the most water-efficient?", options: ["Flood irrigation", "Furrow irrigation", "Sprinkler irrigation", "Drip irrigation"], answer: "Drip irrigation" },
                { question: "The Haber-Bosch process is significant in agriculture for producing what?", options: ["Phosphate fertilizers", "Nitrogen fertilizers", "Potassium fertilizers", "Organic compost"], answer: "Nitrogen fertilizers" }
            ]
        },
        fr: {
            title: 'Principes d\'Agronomie Moderne',
            questions: [
                { question: "Lequel de ces éléments est un macronutriment primaire pour les plantes ?", options: ["Calcium", "Soufre", "Azote", "Fer"], answer: "Azote" },
                { question: "Que mesure le pH du sol ?", options: ["L'humidité du sol", "La densité du sol", "L'acidité ou l'alcalinité du sol", "La température du sol"], answer: "L'acidité ou l'alcalinité du sol" },
                { question: "Quelle pratique est un élément clé du travail de conservation du sol ?", options: ["Le labour intensif", "Laisser les résidus de culture à la surface du sol", "Les périodes de jachère nue", "L'utilisation de machines lourdes"], answer: "Laisser les résidus de culture à la surface du sol" },
                { question: "Quel est l'objectif principal de la lutte intégrée contre les ravageurs (IPM) ?", options: ["Éradiquer complètement tous les ravageurs", "S'appuyer uniquement sur les pesticides chimiques", "Gérer les ravageurs avec un risque économique et environnemental minimal", "Utiliser uniquement des méthodes de lutte biologique"], answer: "Gérer les ravageurs avec un risque économique et environnemental minimal" },
                { question: "Le processus de déplacement de l'eau à travers une plante et son évaporation des parties aériennes, comme les feuilles, s'appelle :", options: ["Respiration", "Photosynthèse", "Transpiration", "Percolation"], answer: "Transpiration" },
                { question: "Lequel des exemples suivants est une culture de légumineuses utilisée pour la fixation de l'azote ?", options: ["Maïs", "Blé", "Soja", "Riz"], answer: "Soja" },
                { question: "Par quoi la texture du sol est-elle déterminée ?", options: ["La quantité de matière organique", "La proportion de sable, de limon et d'argile", "La couleur du sol", "La profondeur de la couche arable"], answer: "La proportion de sable, de limon et d'argile" },
                { question: "La rotation des cultures est principalement utilisée pour :", options: ["Rendre le champ uniforme", "Augmenter le ruissellement de l'eau", "Rompre les cycles des ravageurs et améliorer la santé du sol", "Faciliter la récolte"], answer: "Rompre les cycles des ravageurs et améliorer la santé du sol" },
                { question: "Quelle méthode d'irrigation est généralement la plus économe en eau ?", options: ["Irrigation par inondation", "Irrigation par sillons", "Irrigation par aspersion", "Irrigation goutte à goutte"], answer: "Irrigation goutte à goutte" },
                { question: "Le procédé Haber-Bosch est important en agriculture pour produire quoi ?", options: ["Engrais phosphatés", "Engrais azotés", "Engrais potassiques", "Compost organique"], answer: "Engrais azotés" }
            ]
        }
    },
    'supply-chain': {
        en: {
            title: 'Supply Chain Essentials',
            questions: [
                { question: "What does 'LIFO' stand for in inventory management?", options: ["Last-In, First-Out", "Logistics, Inventory, Freight, Operations", "Latest Information, First On", "Local-In, Far-Out"], answer: "Last-In, First-Out" },
                { question: "Which of the following is a primary activity in logistics?", options: ["Marketing", "Sales", "Transportation", "Product Design"], answer: "Transportation" },
                { question: "The 'bullwhip effect' in a supply chain refers to:", options: ["The physical movement of goods in a whip-like motion", "Increasing demand volatility as you move up the supply chain", "A sudden drop in demand", "A type of inventory management software"], answer: "Increasing demand volatility as you move up the supply chain" },
                { question: "What is a Bill of Lading?", options: ["An invoice for goods purchased", "A contract between a shipper and a carrier", "A list of all inventory items", "A safety compliance certificate"], answer: "A contract between a shipper and a carrier" },
                { question: "Which term describes the process of managing the return of goods?", options: ["Forward Logistics", "Inbound Logistics", "Reverse Logistics", "Outbound Logistics"], answer: "Reverse Logistics" },
                { question: "What is the purpose of a Safety Stock?", options: ["To ensure worker safety", "To buffer against uncertainty in demand or supply", "To be sold at a discount", "To test the quality of products"], answer: "To buffer against uncertainty in demand or supply" },
                { question: "Which INCOTERM places the most responsibility on the buyer?", options: ["EXW (Ex Works)", "DDP (Delivered Duty Paid)", "FOB (Free On Board)", "CIF (Cost, Insurance, and Freight)"], answer: "EXW (Ex Works)" },
                { question: "A warehouse that receives goods from various suppliers and consolidates them for shipment to a common destination is called a:", options: ["Private Warehouse", "Distribution Center", "Consolidation Warehouse", "Bonded Warehouse"], answer: "Consolidation Warehouse" },
                { question: "What is a key performance indicator (KPI) for measuring delivery performance?", options: ["Inventory Turnover", "On-Time Delivery Rate", "Return on Assets", "Marketing Spend"], answer: "On-Time Delivery Rate" },
                { question: "What does a '3PL' provider do?", options: ["Manufactures products for three companies", "Provides outsourced logistics services", "Is a type of raw material supplier", "A government regulatory body"], answer: "Provides outsourced logistics services" }
            ]
        },
        fr: {
            title: 'Essentiels de la Chaîne d\'Approvisionnement',
            questions: [
                { question: "Que signifie 'LIFO' en gestion des stocks ?", options: ["Dernier Entré, Premier Sorti", "Logistique, Inventaire, Fret, Opérations", "Dernière Information, Première Entrée", "Entrée Locale, Sortie Lointaine"], answer: "Dernier Entré, Premier Sorti" },
                { question: "Laquelle des activités suivantes est une activité principale de la logistique ?", options: ["Marketing", "Ventes", "Transport", "Conception de produit"], answer: "Transport" },
                { question: "L'« effet coup de fouet » dans une chaîne d'approvisionnement fait référence à :", options: ["Le mouvement physique des marchandises en forme de fouet", "L'augmentation de la volatilité de la demande en remontant la chaîne d'approvisionnement", "Une chute soudaine de la demande", "Un type de logiciel de gestion des stocks"], answer: "L'augmentation de la volatilité de la demande en remontant la chaîne d'approvisionnement" },
                { question: "Qu'est-ce qu'un connaissement (Bill of Lading) ?", options: ["Une facture pour les marchandises achetées", "Un contrat entre un expéditeur et un transporteur", "Une liste de tous les articles en stock", "Un certificat de conformité de sécurité"], answer: "Un contrat entre un expéditeur et un transporteur" },
                { question: "Quel terme décrit le processus de gestion du retour des marchandises ?", options: ["Logistique directe", "Logistique amont", "Logistique inverse", "Logistique aval"], answer: "Logistique inverse" },
                { question: "Quel est le but d'un stock de sécurité ?", options: ["Assurer la sécurité des travailleurs", "Se prémunir contre l'incertitude de la demande ou de l'offre", "Être vendu à prix réduit", "Tester la qualité des produits"], answer: "Se prémunir contre l'incertitude de la demande ou de l'offre" },
                { question: "Quel INCOTERM impose le plus de responsabilités à l'acheteur ?", options: ["EXW (Ex Works)", "DDP (Delivered Duty Paid)", "FOB (Free On Board)", "CIF (Cost, Insurance, and Freight)"], answer: "EXW (Ex Works)" },
                { question: "Un entrepôt qui reçoit des marchandises de divers fournisseurs et les consolide pour les expédier vers une destination commune est appelé :", options: ["Entrepôt privé", "Centre de distribution", "Entrepôt de consolidation", "Entrepôt sous douane"], answer: "Entrepôt de consolidation" },
                { question: "Quel est un indicateur de performance clé (KPI) pour mesurer la performance de livraison ?", options: ["Rotation des stocks", "Taux de livraison à temps", "Rendement des actifs", "Dépenses marketing"], answer: "Taux de livraison à temps" },
                { question: "Que fait un fournisseur '3PL' ?", options: ["Fabrique des produits pour trois entreprises", "Fournit des services logistiques externalisés", "Est un type de fournisseur de matières premières", "Un organisme de réglementation gouvernemental"], answer: "Fournit des services logistiques externalisés" }
            ]
        }
    },
    'cognitive-aptitude': {
        en: {
            title: 'Cognitive Aptitude Test',
            questions: [
                { question: "Which number logically follows this series? 4, 6, 9, 6, 14, 6, ...", options: ["6", "17", "19", "21"], answer: "19" },
                { question: "A is the father of B. But B is not the son of A. What is the relationship between A and B?", options: ["A is the uncle of B", "B is the daughter of A", "B is the nephew of A", "They are not related"], answer: "B is the daughter of A" },
                { question: "If a car travels at a speed of 60 km/h, how far will it travel in 45 minutes?", options: ["30 km", "45 km", "50 km", "60 km"], answer: "45 km" },
                { question: "Which word is the odd one out? Apple, Banana, Rose, Orange", options: ["Apple", "Banana", "Rose", "Orange"], answer: "Rose" },
                { question: "A project can be completed by 20 people in 30 days. How many people are needed to complete the same project in 25 days?", options: ["24", "25", "30", "32"], answer: "24" },
                { question: "What is the next prime number after 29?", options: ["30", "31", "33", "35"], answer: "31" },
                { question: "A bat and a ball cost $1.10 in total. The bat costs $1.00 more than the ball. How much does the ball cost?", options: ["$0.10", "$0.05", "$0.15", "$1.00"], answer: "$0.05" },
                { question: "If you unscramble the letters 'CIFAIPC', you get the name of a(n):", options: ["City", "Animal", "Ocean", "Country"], answer: "Ocean" },
                { question: "How many months have 28 days?", options: ["1", "2", "6", "12"], answer: "12" },
                { question: "A trader bought a watch for $200 and sold it for $250. What is the percentage profit?", options: ["20%", "25%", "30%", "50%"], answer: "25%" }
            ]
        },
        fr: {
            title: 'Test d\'Aptitude Cognitive',
            questions: [
                { question: "Quel nombre suit logiquement cette série ? 4, 6, 9, 6, 14, 6, ...", options: ["6", "17", "19", "21"], answer: "19" },
                { question: "A est le père de B. Mais B n'est pas le fils de A. Quelle est la relation entre A et B ?", options: ["A est l'oncle de B", "B est la fille de A", "B est le neveu de A", "Ils ne sont pas parents"], answer: "B est la fille de A" },
                { question: "Si une voiture roule à une vitesse de 60 km/h, quelle distance parcourra-t-elle en 45 minutes ?", options: ["30 km", "45 km", "50 km", "60 km"], answer: "45 km" },
                { question: "Quel mot est l'intrus ? Pomme, Banane, Rose, Orange", options: ["Pomme", "Banane", "Rose", "Orange"], answer: "Rose" },
                { question: "Un projet peut être réalisé par 20 personnes en 30 jours. Combien de personnes sont nécessaires pour réaliser le même projet en 25 jours ?", options: ["24", "25", "30", "32"], answer: "24" },
                { question: "Quel est le prochain nombre premier après 29 ?", options: ["30", "31", "33", "35"], answer: "31" },
                { question: "Une batte et une balle coûtent 1,10 $ au total. La batte coûte 1,00 $ de plus que la balle. Combien coûte la balle ?", options: ["0,10 $", "0,05 $", "0,15 $", "1,00 $"], answer: "0,05 $" },
                { question: "Si vous démêlez les lettres 'CIFAIPC', vous obtenez le nom d'un(e) :", options: ["Ville", "Animal", "Océan", "Pays"], answer: "Océan" },
                { question: "Combien de mois ont 28 jours ?", options: ["1", "2", "6", "12"], answer: "12" },
                { question: "Un commerçant a acheté une montre pour 200 $ et l'a vendue 250 $. Quel est le pourcentage de profit ?", options: ["20%", "25%", "30%", "50%"], answer: "25%" }
            ]
        }
    }
}

type TestId = keyof typeof testData;

const ProctoringSetup = ({ onSetupComplete }: { onSetupComplete: () => void }) => {
  const { toast } = useToast();
  const { t } = useLocalization();
  const [hasPermission, setHasPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: t('Camera Access Denied'),
          description: t('Please enable camera and microphone permissions in your browser settings to continue.'),
        });
      }
    };
    getCameraPermission();
  }, [toast, t]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('Assessment Setup')}</CardTitle>
        <CardDescription>{t('Please complete the following steps to begin your proctored assessment.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5" />
            <span>{t('Camera Access')}</span>
          </div>
          <span className={`text-sm font-semibold ${hasPermission ? 'text-green-600' : 'text-destructive'}`}>
            {hasPermission ? t('Enabled') : t('Disabled')}
          </span>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('Assessment Rules')}</AlertTitle>
          <AlertDescription>
            {t('You must remain in the browser window for the duration of the test. Navigating away will be flagged.')}
          </AlertDescription>
        </Alert>
        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
      </CardContent>
      <CardFooter>
        <Button onClick={onSetupComplete} disabled={!hasPermission} className="w-full">
          {hasPermission ? t("Start Assessment") : <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('Waiting for permissions...')}</>}
        </Button>
      </CardFooter>
    </Card>
  );
};


const TestInterface = ({ testId, onTestComplete }: { testId: TestId; onTestComplete: (score: number) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { language, t } = useLocalization();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  
  const testContent = testData[testId][language as keyof typeof testData[TestId]];
  const totalQuestions = testContent.questions.length;
  
  const [timeLeft, setTimeLeft] = useState((totalQuestions * 60) * 1.2 ); // Dynamic time based on questions

  // Tab focus lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast({
          variant: "destructive",
          title: t("Warning: Focus Lost"),
          description: t("You have navigated away from the test. This event has been logged."),
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [toast, t]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);
  
  useEffect(() => {
    const getCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if(videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Could not get camera for test interface", error)
        }
    }
    getCamera();
  }, [])

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };
  
  const handleSubmit = () => {
    let score = 0;
    testContent.questions.forEach((q, i) => {
        if (answers[i] === q.answer) {
            score++;
        }
    });
    const finalScore = Math.round((score / totalQuestions) * 100);
    onTestComplete(finalScore);
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
        handleSubmit();
    }
  };

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const q = testContent.questions[currentQuestion];

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{testContent.title}</CardTitle>
                        <div className="font-mono text-lg">{`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}</div>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <CardDescription>{t('Question {current} of {total}', {current: currentQuestion + 1, total: totalQuestions})}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold text-lg mb-6">{q.question}</p>
                    <RadioGroup onValueChange={handleAnswer} value={answers[currentQuestion]}>
                        {q.options.map(opt => (
                            <div key={opt} className="flex items-center space-x-2 p-2 rounded-md hover:bg-muted transition-colors">
                                <RadioGroupItem value={opt} id={opt} />
                                <Label htmlFor={opt} className="font-normal flex-1 cursor-pointer py-1">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNext} className="ml-auto">
                        {currentQuestion < totalQuestions - 1 ? t('Next Question') : t('Finish & Submit')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="sticky top-24 space-y-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
            <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>{t('Proctoring Enabled')}</AlertTitle>
                <AlertDescription>
                    {t('Your session is being monitored. Please remain focused on the test.')}
                </AlertDescription>
            </Alert>
        </div>
    </div>
  )
}


export default function TakeAssessmentPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const { t } = useLocalization();
  const [step, setStep] = useState<'setup' | 'test'>('setup');
  
  if (!Object.keys(testData).includes(params.testId)) {
    return <div>{t('Test not found')}</div>;
  }

  const handleTestComplete = (score: number) => {
    // In a real app, you would save the score to the database
    router.push(`/dashboard/assessment/${params.testId}/result?score=${score}`);
  };

  return (
    <div className="container mx-auto py-8">
        {step === 'setup' && <ProctoringSetup onSetupComplete={() => setStep('test')} />}
        {step === 'test' && <TestInterface testId={params.testId as TestId} onTestComplete={handleTestComplete} />}
    </div>
  );
}
