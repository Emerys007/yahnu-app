
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Video, ShieldAlert, TriangleAlert } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const testData = {
    'frontend-basics': {
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
            { question: "Comment 'remonter l'état' (lift state up) dans React ?", options: ["En déplaçant l'état vers le composant de plus haut niveau", "En utilisant une variable globale", "En déplaçant l'état vers un ancêtre commun des composants qui en ont besoin", "En utilisant le hook `liftState`"], answer: "En déplaçant l'état vers un ancêtre commun des composants qui en ont besoin" },
            { question: "Quel fichier est le point d'entrée pour une application React standard créée avec Create React App ?", options: ["app.js", "main.js", "index.js", "react.js"], answer: "index.js" },
            { question: "Quel est le but du tableau de dépendances de `useEffect` ?", options: ["Déclarer toutes les variables utilisées dans le composant", "Spécifier de quelles valeurs (props ou état) l'effet dépend, ne ré-exécutant l'effet que lorsqu'elles changent", "Lister toutes les bibliothèques importées", "Définir l'ordre de rendu des composants"], answer: "Spécifier de quelles valeurs (props ou état) l'effet dépend, ne ré-exécutant l'effet que lorsqu'elles changent" },
            { question: "En CSS Flexbox, que fait `justify-content: space-between;` ?", options: ["Il place les éléments avec un espace égal autour d'eux.", "Il distribue les éléments uniformément, le premier au début et le dernier à la fin.", "Il centre tous les éléments dans le conteneur.", "Il aligne les éléments au début du conteneur."], answer: "Il distribue les éléments uniformément, le premier au début et le dernier à la fin." },
            { question: "Quel est l'objectif principal de Redux ?", options: ["Gérer le style des composants", "Fournir un conteneur d'état prévisible pour les applications JavaScript", "Gérer le rendu côté serveur", "Remplacer la gestion d'état intégrée de React"], answer: "Fournir un conteneur d'état prévisible pour les applications JavaScript" },
            { question: "Quelle méthode dans un composant de classe React est appelée après que le composant est rendu pour la première fois ?", options: ["componentDidMount", "componentWillMount", "render", "componentDidUpdate"], answer: "componentDidMount" },
            { question: "Quelle est la commande pour créer une nouvelle application React avec Vite ?", options: ["npx create-react-app my-app", "npm init vite@latest", "ng new my-app", "npm create-react-app my-app"], answer: "npm init vite@latest" },
            { question: "Qu'est-ce que le 'prop drilling' ?", options: ["Une technique d'optimisation des performances", "Le passage de props à travers plusieurs niveaux de composants", "Un moyen d'interroger les props avec un outil spécial", "Une erreur qui se produit lorsque les props ne sont pas définies"], answer: "Le passage de props à travers plusieurs niveaux de composants" },
            { question: "Que fait le hook `useContext` ?", options: ["Il crée un nouveau contexte pour l'état global", "Il permet à un composant fonctionnel de s'abonner aux changements de contexte", "Il est utilisé pour récupérer des données d'une API", "Il remplace Redux pour toute la gestion d'état"], answer: "Il permet à un composant fonctionnel de s'abonner aux changements de contexte" },
            { question: "Quelle est la différence entre `==` et `===` en JavaScript ?", options: ["Ils sont identiques", "`===` vérifie l'égalité de type et de valeur, tandis que `==` effectue une coercition de type", "`==` est plus rapide que `===`", "`===` est uniquement pour les chaînes de caractères"], answer: "`===` vérifie l'égalité de type et de valeur, tandis que `==` effectue une coercition de type" },
            { question: "Qu'est-ce que Tailwind CSS ?", options: ["Un framework JavaScript", "Une bibliothèque de composants comme Bootstrap", "Un framework CSS 'utility-first'", "Un préprocesseur CSS"], answer: "Un framework CSS 'utility-first'" }
        ]
    },
    'financial-analysis': {
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
            { question: "Si les actifs d'une entreprise sont de 150 000 $ et ses passifs de 90 000 $, quels sont ses capitaux propres ?", options: ["240 000 $", "150 000 $", "90 000 $", "60 000 $"], answer: "60 000 $" },
            { question: "Un ratio P/E élevé pourrait suggérer qu'une action est...", options: ["Sous-évaluée", "Correctement évaluée", "Surévaluée ou a de fortes attentes de croissance", "Une action de premier ordre"], answer: "Surévaluée ou a de fortes attentes de croissance" },
            { question: "Lequel des éléments suivants est considéré comme une charge non monétaire ?", options: ["Salaires", "Loyer", "Amortissement", "Paiements d'intérêts"], answer: "Amortissement" },
            { question: "Quel est l'objectif principal de l'analyse DuPont ?", options: ["Calculer le prix exact de l'action", "Décomposer la rentabilité des capitaux propres (ROE) en ses composantes clés", "Déterminer les flux de trésorerie de l'entreprise", "Mesurer la volatilité du marché"], answer: "Décomposer la rentabilité des capitaux propres (ROE) en ses composantes clés" },
            { question: "Le flux de trésorerie disponible (FCF) représente la trésorerie disponible pour...", options: ["Payer uniquement les salaires", "La distribution à toutes les parties prenantes, y compris les créanciers et les actionnaires", "Les activités de marketing", "Acheter de nouveaux stocks"], answer: "La distribution à toutes les parties prenantes, y compris les créanciers et les actionnaires" },
            { question: "Que représente le 'goodwill' (écart d'acquisition) dans un bilan ?", options: ["La réputation de l'entreprise", "Un actif incorporel représentant la prime payée pour une entreprise par rapport à sa valeur comptable", "Les dons faits par l'entreprise", "Les réserves de trésorerie"], answer: "Un actif incorporel représentant la prime payée pour une entreprise par rapport à sa valeur comptable" },
            { question: "Quelle est la principale différence entre une obligation et une action ?", options: ["Une obligation représente la propriété, une action représente la dette", "Une action représente la propriété, une obligation représente la dette", "C'est la même chose", "Les obligations ne sont émises que par les gouvernements"], answer: "Une action représente la propriété, une obligation représente la dette" },
            { question: "Qu'est-ce que l'EBITDA ?", options: ["Bénéfice avant intérêts, impôts, dépréciation et amortissement", "Investissement adossé à des actions, impôts et provision pour dette", "Revenu d'entreprise estimé, transactions et amortissement direct", "Bénéfice avant investissement, transactions et amortissement de la dette"], answer: "Bénéfice avant intérêts, impôts, dépréciation et amortissement" },
            { question: "Un 'accrual' (charge à payer/produit à recevoir) en comptabilité fait référence à :", options: ["De l'argent qui a été reçu", "Une dépense qui a été payée", "Un revenu ou une dépense qui est reconnu avant que l'argent ne soit échangé", "Une erreur dans les états financiers"], answer: "Un revenu ou une dépense qui est reconnu avant que l'argent ne soit échangé" },
            { question: "Quel type d'analyse financière consiste à comparer les ratios d'une entreprise sur plusieurs périodes ?", options: ["Analyse verticale", "Analyse horizontale", "Analyse des ratios", "Analyse des tendances"], answer: "Analyse des tendances" },
            { question: "Qu'est-ce qu'un 'dérivé' en finance ?", options: ["Un type d'action", "Un contrat financier dont la valeur dérive d'un actif sous-jacent", "Un type de compte bancaire", "Une entreprise qui est une filiale d'une autre"], answer: "Un contrat financier dont la valeur dérive d'un actif sous-jacent" }
        ]
    },
    'agronomy-principles': {
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
            { question: "Le procédé Haber-Bosch est important en agriculture pour produire quoi ?", options: ["Engrais phosphatés", "Engrais azotés", "Engrais potassiques", "Compost organique"], answer: "Engrais azotés" },
            { question: "Qu'est-ce que l'eutrophisation dans un contexte agricole ?", options: ["Un type d'érosion du sol", "L'enrichissement des plans d'eau en nutriments, entraînant souvent des proliférations d'algues", "Une méthode de lutte contre les ravageurs", "Le processus de séchage des cultures"], answer: "L'enrichissement des plans d'eau en nutriments, entraînant souvent des proliférations d'algues" },
            { question: "Lequel de ces symptômes est un symptôme courant de carence en potassium chez les plantes ?", options: ["Jaunissement des jeunes feuilles", "Retard de croissance", "Décoloration violette des feuilles", "Jaunissement le long des bords des feuilles plus âgées"], answer: "Jaunissement le long des bords des feuilles plus âgées" },
            { question: "De quoi la Capacité d'Échange Cationique (CEC) d'un sol est-elle un indicateur ?", options: ["Sa capacité de rétention d'eau", "Sa capacité à retenir et à fournir des ions positifs (nutriments) à une plante", "Sa résistance à l'érosion", "Son aptitude à la construction"], answer: "Sa capacité à retenir et à fournir des ions positifs (nutriments) à une plante" },
            { question: "Lequel des avantages suivants est un avantage de l'agriculture sans labour ?", options: ["Augmentation de la température du sol", "Réduction de l'érosion du sol et amélioration de la rétention d'eau", "Contrôle plus facile des mauvaises herbes la première année", "Coût initial de l'équipement plus bas"], answer: "Réduction de l'érosion du sol et amélioration de la rétention d'eau" },
            { question: "Quelle est la fonction principale du phosphore dans la croissance des plantes ?", options: ["Production de chlorophylle", "Transfert d'énergie (ATP), photosynthèse et développement des racines", "Régulation de l'eau", "Résistance aux maladies"], answer: "Transfert d'énergie (ATP), photosynthèse et développement des racines" },
            { question: "Qu'est-ce qu'une 'culture de couverture' ?", options: ["Une culture cultivée pour son apparence", "Une culture cultivée pour être vendue", "Une culture cultivée pour la protection et l'enrichissement du sol", "La principale culture commerciale"], answer: "Une culture cultivée pour la protection et l'enrichissement du sol" },
            { question: "La salinisation du sol est le processus de :", options: ["Augmentation de la teneur en sel dans le sol", "Élimination du sel du sol", "Ajout de matière organique au sol", "Augmentation du pH du sol"], answer: "Augmentation de la teneur en sel dans le sol" },
            { question: "Lequel des éléments suivants est un micronutriment pour les plantes ?", options: ["Phosphore", "Potassium", "Zinc", "Magnésium"], answer: "Zinc" },
            { question: "Qu'est-ce qu'une semence 'hybride' ?", options: ["Une graine qui pousse dans l'eau", "Une graine produite par le croisement de deux plantes parentales consanguines différentes", "Une semence génétiquement modifiée", "Une ancienne variété de semence"], answer: "Une graine produite par le croisement de deux plantes parentales consanguines différentes" },
            { question: "L'agriculture de précision utilise principalement quelle technologie pour optimiser les rendements des cultures ?", options: ["Prévisions météorologiques", "Outils à main", "GPS et télédétection", "Engrais organiques"], answer: "GPS et télédétection" }
        ]
    },
    'supply-chain': {
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
            { question: "Que fait un fournisseur '3PL' ?", options: ["Fabrique des produits pour trois entreprises", "Fournit des services logistiques externalisés", "Est un type de fournisseur de matières premières", "Un organisme de réglementation gouvernemental"], answer: "Fournit des services logistiques externalisés" },
            { question: "Le cross-docking est une procédure logistique où...", options: ["Les camions traversent un quai pour échanger des charges", "Les produits d'un fournisseur sont distribués directement à un client avec un temps de manutention ou de stockage minimal", "Les marchandises sont stockées pendant de longues périodes", "L'inventaire est compté manuellement"], answer: "Les produits d'un fournisseur sont distribués directement à un client avec un temps de manutention ou de stockage minimal" },
            { question: "Que signifie 'JAT' dans les systèmes d'inventaire ?", options: ["Juste-À-Temps", "Poste-En-Transit", "Journal de Suivi d'Inventaire", "Jugement-En-Temps"], answer: "Juste-À-Temps" },
            { question: "Lequel des éléments suivants n'est PAS un mode de transport ?", options: ["Ferroviaire", "Pipeline", "Entrepôt", "Aérien"], answer: "Entrepôt" },
            { question: "Le modèle SCOR est utilisé pour :", options: ["Calculer les frais d'expédition", "Décrire, mesurer et évaluer les configurations de la chaîne d'approvisionnement", "Gérer les relations clients", "Concevoir de nouveaux produits"], answer: "Décrire, mesurer et évaluer les configurations de la chaîne d'approvisionnement" },
            { question: "Quel est le principal compromis dans la gestion des stocks ?", options: ["Qualité vs Rapidité", "Coût vs Niveau de service client", "Marketing vs Ventes", "Logistique amont vs aval"], answer: "Coût vs Niveau de service client" },
            { question: "Qu'est-ce qu'un 'transitaire' ?", options: ["Un chauffeur de camion", "Un agent qui organise les expéditions pour des particuliers ou des entreprises", "Le propriétaire d'une compagnie de transport", "Un type de conteneur d'expédition"], answer: "Un agent qui organise les expéditions pour des particuliers ou des entreprises" },
            { question: "Que signifie 'LTL' dans le domaine de l'expédition ?", options: ["Logistique à Long Terme", "Charge de Faible Tonnage", "Less-Than-Truckload (Envoi de détail)", "Liaison de Transport Local"], answer: "Less-Than-Truckload (Envoi de détail)" },
            { question: "Le temps total nécessaire à un fournisseur pour livrer une commande après qu'elle a été passée s'appelle :", options: ["Temps de cycle", "Délai de livraison", "Temps Takt", "Temps d'immobilisation"], answer: "Délai de livraison" },
            { question: "Qu'est-ce que le 'fardage' en logistique ?", options: ["Un type de taxe sur les marchandises", "Matériau peu coûteux ou de rebut utilisé pour charger et sécuriser la cargaison pendant le transport", "Des frais pour livraison tardive", "Le processus de déchargement d'un navire"], answer: "Matériau peu coûteux ou de rebut utilisé pour charger et sécuriser la cargaison pendant le transport" },
            { question: "Qu'est-ce qu'une opération de 'pick and pack' ?", options: ["Un type de stratégie marketing", "Le processus de sélection des articles en stock et de leur emballage pour l'expédition", "Une méthode pour choisir les fournisseurs", "Un terme financier pour l'acquisition et la vente d'actions"], answer: "Le processus de sélection des articles en stock et de leur emballage pour l'expédition" }
        ]
    },
    'customer-service': {
        title: 'Excellence du Service Client',
        questions: [
            { question: "Quel est l'objectif principal d'un professionnel du service client ?", options: ["Vendre plus de produits", "Résoudre rapidement les problèmes des clients", "Assurer la satisfaction et la fidélité des clients", "Réduire le nombre d'appels entrants"], answer: "Assurer la satisfaction et la fidélité des clients" },
            { question: "Que signifie l'acronyme 'CRM' dans un contexte commercial ?", options: ["Gestion de la Relation Client", "Gestion des Ressources de l'Entreprise", "Mécanisme de Réponse Client", "Mandat de Responsabilité d'Entreprise"], answer: "Gestion de la Relation Client" },
            { question: "Un client est très en colère et crie. Quelle est la MEILLEURE première étape ?", options: ["Lui raccrocher au nez", "Lui dire de se calmer", "Écouter activement, faire preuve d'empathie et reconnaître sa frustration", "Proposer immédiatement un remboursement"], answer: "Écouter activement, faire preuve d'empathie et reconnaître sa frustration" },
            { question: "Que signifie 'l'écoute active' ?", options: ["Entendre ce que le client dit", "Attendre son tour pour parler", "Se concentrer pleinement sur ce qui est dit, comprendre et répondre", "Noter chaque mot que le client dit"], answer: "Se concentrer pleinement sur ce qui est dit, comprendre et répondre" },
            { question: "Lorsque vous ne connaissez pas la réponse à la question d'un client, que devez-vous faire ?", options: ["Deviner la réponse", "Leur dire que vous ne pouvez pas aider", "Leur dire que vous allez chercher l'information et revenir vers eux", "Ignorer la question et changer de sujet"], answer: "Leur dire que vous allez chercher l'information et revenir vers eux" },
            { question: "Quelle est une bonne façon de faire preuve d'empathie envers un client ?", options: ["Dire 'Je comprends ce que vous ressentez'", "Dire 'Ce n'est pas mon problème'", "Ignorer leur état émotionnel", "Leur raconter une histoire sur vos propres problèmes"], answer: "Dire 'Je comprends ce que vous ressentez'" },
            { question: "Pourquoi est-il important d'utiliser un langage positif dans le service client ?", options: ["C'est une obligation légale", "Cela semble plus intelligent", "Cela crée un ton plus collaboratif et moins conflictuel", "Cela embrouille le client"], answer: "Cela crée un ton plus collaboratif et moins conflictuel" },
            { question: "Qu'est-ce que la 'Résolution au Premier Appel' (FCR) ?", options: ["Résoudre le problème du client dès le premier contact", "Le premier appel que vous faites le matin", "Le tout premier appel d'un client au support", "La première étape d'un long processus de résolution"], answer: "Résoudre le problème du client dès le premier contact" },
            { question: "Que mesure le Net Promoter Score (NPS) ?", options: ["Les bénéfices de l'entreprise", "La satisfaction des employés", "La fidélité et la satisfaction des clients", "Le trafic du site web"], answer: "La fidélité et la satisfaction des clients" },
            { question: "Comment gérer un client qui demande quelque chose qui va à l'encontre de la politique de l'entreprise ?", options: ["Dire immédiatement 'non'", "Accéder quand même à la demande", "Expliquer calmement la politique, exprimer le regret de ne pouvoir répondre à la demande et proposer d'éventuelles alternatives", "Leur dire de parler à votre responsable"], answer: "Expliquer calmement la politique, exprimer le regret de ne pouvoir répondre à la demande et proposer d'éventuelles alternatives" },
            { question: "Quel est le principal avantage d'une stratégie de support client multicanal (téléphone, e-mail, chat) ?", options: ["C'est moins cher pour l'entreprise", "Cela permet aux clients de choisir leur méthode de communication préférée", "Cela réduit le besoin d'agents humains", "Cela complique le travail"], answer: "Cela permet aux clients de choisir leur méthode de communication préférée" },
            { question: "Après avoir résolu le problème d'un client, quelle est une bonne dernière étape ?", options: ["Mettre fin immédiatement à la conversation", "Demander s'il y a autre chose pour laquelle vous pouvez aider", "Le transférer à un autre service", "Lui demander d'acheter un autre produit"], answer: "Demander s'il y a autre chose pour laquelle vous pouvez aider" },
            { question: "Qu'est-ce que le 'ton de la voix' dans la communication écrite comme l'e-mail ou le chat ?", options: ["La police et la couleur utilisées", "La vitesse de votre frappe", "L'attitude et l'émotion transmises par votre choix de mots, votre ponctuation et la structure de vos phrases", "Cela n'existe pas à l'écrit"], answer: "L'attitude et l'émotion transmises par votre choix de mots, votre ponctuation et la structure de vos phrases" },
            { question: "Un client se plaint sur les réseaux sociaux. Quelle est la pratique recommandée ?", options: ["Supprimer le commentaire", "Ignorer le commentaire", "Répondre publiquement en demandant de poursuivre la conversation sur un canal privé (MP, e-mail)", "Se disputer avec le client dans les commentaires"], answer: "Répondre publiquement en demandant de poursuivre la conversation sur un canal privé (MP, e-mail)" },
            { question: "Pourquoi la connaissance du produit est-elle importante pour un agent du service client ?", options: ["Pour impressionner les clients avec du jargon technique", "Pour pouvoir répondre aux questions avec précision et résoudre les problèmes efficacement", "Ce n'est pas aussi important que d'être amical", "Pour pouvoir traiter les ventes"], answer: "Pour pouvoir répondre aux questions avec précision et résoudre les problèmes efficacement" },
            { question: "Que signifie 'SLA' dans le service client ?", options: ["Accord de Niveau de Service", "Action Légale Standard", "Précision des Pistes de Vente", "Disponibilité de la Ligne de Support"], answer: "Accord de Niveau de Service" },
            { question: "Lors de la clôture d'un ticket de support, quelle est la chose la plus importante à assurer ?", options: ["Que le ticket soit fermé rapidement", "Que le client confirme que le problème est résolu à sa satisfaction", "Que vous ayez correctement enregistré votre temps", "Que vous ayez proposé une vente additionnelle"], answer: "Que le client confirme que le problème est résolu à sa satisfaction" },
            { question: "À quoi sert une 'base de connaissances' dans le support client ?", options: ["Pour stocker les informations de carte de crédit des clients", "Un référentiel d'articles et de réponses aux questions courantes pour le libre-service", "Une liste des coordonnées des employés", "Un endroit pour se plaindre des clients difficiles"], answer: "Un référentiel d'articles et de réponses aux questions courantes pour le libre-service" },
            { question: "Qu'est-ce que le 'Score d'Effort Client' (CES) ?", options: ["Une mesure de l'effort fourni par l'agent", "Une métrique qui mesure l'effort qu'un client a dû déployer pour résoudre un problème", "Le score de l'agent à un test de formation", "Le nombre de fois qu'un client doit appeler"], answer: "Une métrique qui mesure l'effort qu'un client a dû déployer pour résoudre un problème" },
            { question: "Si vous ne pouvez pas résoudre le problème d'un client, quelle est la meilleure marche à suivre ?", options: ["Dire au client que c'est impossible à résoudre", "Blâmer un autre service", "Transmettre le problème à un membre de l'équipe senior ou à un responsable qui peut aider", "Fermer le ticket et espérer qu'il ne rappelle pas"], answer: "Transmettre le problème à un membre de l'équipe senior ou à un responsable qui peut aider" }
        ]
    },
    'cognitive-aptitude': {
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
            { question: "Un commerçant a acheté une montre pour 200 $ et l'a vendue 250 $. Quel est le pourcentage de profit ?", options: ["20%", "25%", "30%", "50%"], answer: "25%" },
            { question: "Livre est à Lecture ce que Fourchette est à :", options: ["Dessiner", "Écrire", "Mélanger", "Manger"], answer: "Manger" },
            { question: "Lequel des éléments suivants ressemble le moins aux autres ? Poème, Roman, Peinture, Fleur", options: ["Poème", "Roman", "Peinture", "Fleur"], answer: "Fleur" },
            { question: "Un homme a 24 ans de plus que son fils. Dans deux ans, son âge sera le double de l'âge de son fils. Quel est l'âge actuel de son fils ?", options: ["20", "22", "24", "26"], answer: "22" },
            { question: "Que représente 3/7 de 105 ?", options: ["35", "45", "55", "65"], answer: "45" },
            { question: "Trouvez le nombre manquant dans la série : 5, 10, 17, ?, 37, 50.", options: ["24", "26", "28", "30"], answer: "26" },
            { question: "Si 5 machines peuvent fabriquer 5 widgets en 5 minutes, combien de temps faudrait-il à 100 machines pour fabriquer 100 widgets ?", options: ["100 minutes", "50 minutes", "5 minutes", "1 minute"], answer: "5 minutes" },
            { question: "Lequel des cinq ressemble le moins aux quatre autres ? Chien, Souris, Lion, Serpent, Éléphant", options: ["Chien", "Souris", "Lion", "Serpent", "Éléphant"], answer: "Serpent" },
            { question: "Un homme marche 5 km vers l'est, puis tourne vers le sud et marche 5 km, puis tourne à nouveau vers l'est et marche 5 km. À quelle distance est-il de son point de départ (à vol d'oiseau) ?", options: ["10 km", "15 km", "5√5 km", "10√2 km"], answer: "10√2 km" },
            { question: "Avant-hier était samedi. Quel jour sera-t-il après-demain ?", options: ["Mardi", "Mercredi", "Jeudi", "Vendredi"], answer: "Mercredi" },
            { question: "Un fermier a 17 moutons, et tous sauf 9 meurent. Combien lui en reste-t-il ?", options: ["17", "9", "8", "0"], answer: "9" }
        ]
    }
}

type TestId = keyof typeof testData;

const ProctoringSetup = ({ onSetupComplete }: { onSetupComplete: () => void }) => {
  const { toast } = useToast();
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
          title: "Accès à la caméra refusé",
          description: "Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur pour continuer.",
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Configuration de l'évaluation</CardTitle>
        <CardDescription>Préparez-vous pour une évaluation sécurisée et surveillée.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5" />
            <span>Accès à la caméra</span>
          </div>
          <span className={`text-sm font-semibold ${hasPermission ? 'text-green-600' : 'text-destructive'}`}>
            {hasPermission ? 'Activé' : 'Désactivé'}
          </span>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Règles de l'évaluation</AlertTitle>
          <AlertDescription>
            Votre session est enregistrée. Quitter la fenêtre du navigateur ou l'onglet de l'évaluation entraînera une disqualification immédiate.
          </AlertDescription>
        </Alert>
        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
      </CardContent>
      <CardFooter>
        <Button onClick={onSetupComplete} disabled={!hasPermission} className="w-full">
          {hasPermission ? "Démarrer l'évaluation" : <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> En attente des autorisations</>}
        </Button>
      </CardFooter>
    </Card>
  );
};


const TestInterface = ({ testId, onTestComplete, onDisqualify }: { testId: TestId; onTestComplete: (score: number) => void, onDisqualify: () => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [disqualified, setDisqualified] = useState(false);
  
  const testContent = testData[testId];
  const totalQuestions = testContent.questions.length;
  
  const [timeLeft, setTimeLeft] = useState((totalQuestions * 60) * 1.2 ); // Dynamic time based on questions

  // Tab focus lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newWarningCount = warningCount + 1;
        setWarningCount(newWarningCount);
        
        if (newWarningCount === 1) {
            setShowWarningModal(true);
        } else if (newWarningCount >= 2) {
            setDisqualified(true);
            onDisqualify();
        }
      }
    };

    if (!disqualified) {
        document.addEventListener("visibilitychange", handleVisibilityChange);
    }
    
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [warningCount, disqualified, onDisqualify]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || disqualified) {
      if (!disqualified) handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, disqualified]);
  
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
    if (answers[currentQuestion] === undefined) {
        toast({
            title: "Réponse requise",
            description: "Veuillez sélectionner une réponse avant de continuer.",
            variant: "destructive",
        });
        return;
    }

    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
        handleSubmit();
    }
  };

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const q = testContent.questions[currentQuestion];

  return (
    <>
      <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
          <div>
              <Card>
                  <CardHeader>
                      <div className="flex justify-between items-center">
                          <CardTitle>{testContent.title}</CardTitle>
                          <div className="font-mono text-lg">{`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}</div>
                      </div>
                      <Progress value={progress} className="w-full" />
                      <CardDescription>{`Question ${currentQuestion + 1} sur ${totalQuestions}`}</CardDescription>
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
                          {currentQuestion < totalQuestions - 1 ? "Question suivante" : "Terminer et soumettre"}
                      </Button>
                  </CardFooter>
              </Card>
          </div>
          <div className="sticky top-24 space-y-4">
              <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
              <Alert>
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Surveillance activée</AlertTitle>
                  <AlertDescription>
                      Votre session est surveillée pour garantir l'intégrité de l'évaluation.
                  </AlertDescription>
              </Alert>
          </div>
      </div>

       <AlertDialog open={showWarningModal} onOpenChange={setShowWarningModal}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        <TriangleAlert className="h-6 w-6 text-yellow-500" />
                        Avertissement
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Vous avez quitté la fenêtre de l'évaluation. Une autre infraction entraînera une disqualification.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogAction onClick={() => setShowWarningModal(false)}>Je comprends</AlertDialogAction>
            </AlertDialogContent>
        </AlertDialog>
    </>
  )
}


export default function TakeAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const [step, setStep] = useState<'setup' | 'test' | 'invalid'>('setup');
  
  const testId = params.testId as string;

  useEffect(() => {
    if (!Object.keys(testData).includes(testId)) {
        setStep('invalid');
    }
  }, [testId]);

  const handleTestComplete = (score: number) => {
    // In a real app, you would save the score to the database
    router.push(`/dashboard/assessment/${testId}/result?score=${score}`);
  };

  const handleDisqualify = () => {
    // In a real app, you would save the disqualification status and lockout period to the database here.
    router.push(`/dashboard/assessment/${testId}/result?score=0&disqualified=true`);
  };

  if (step === 'invalid') {
    return <div>Évaluation non trouvée.</div>;
  }

  return (
    <div className="container mx-auto py-8">
        {step === 'setup' && <ProctoringSetup onSetupComplete={() => setStep('test')} />}
        {step === 'test' && <TestInterface testId={testId as TestId} onTestComplete={handleTestComplete} onDisqualify={handleDisqualify} />}
    </div>
  );
}
