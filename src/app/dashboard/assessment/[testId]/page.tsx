

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
                { question: "How do you lift state up in React?", options: ["By moving the state to the highest-level component", "By using a global variable", "By moving the state to a common ancestor of the components that need it", "By using the `liftState` hook"], answer: "By moving the state to a common ancestor of the components that need it" },
                { question: "Which file is the entry point for a standard React application created with Create React App?", options: ["app.js", "main.js", "index.js", "react.js"], answer: "index.js" },
                { question: "What is the purpose of `useEffect`'s dependency array?", options: ["To declare all variables used in the component", "To specify which values (props or state) the effect depends on, re-running the effect only when they change", "To list all imported libraries", "To define the order of component rendering"], answer: "To specify which values (props or state) the effect depends on, re-running the effect only when they change" },
                { question: "In CSS Flexbox, what does `justify-content: space-between;` do?", options: ["It places items with equal space around them.", "It distributes items evenly, with the first item at the start and the last item at the end.", "It centers all items in the container.", "It aligns items to the start of the container."], answer: "It distributes items evenly, with the first item at the start and the last item at the end." },
                { question: "What is the primary purpose of Redux?", options: ["To manage component styling", "To provide a predictable state container for JavaScript apps", "To handle server-side rendering", "To replace React's built-in state management"], answer: "To provide a predictable state container for JavaScript apps" },
                { question: "Which method in a React class component is called after the component is rendered for the first time?", options: ["componentDidMount", "componentWillMount", "render", "componentDidUpdate"], answer: "componentDidMount" },
                { question: "What is the command to create a new React app using Vite?", options: ["npx create-react-app my-app", "npm init vite@latest", "ng new my-app", "npm create-react-app my-app"], answer: "npm init vite@latest" },
                { question: "What is prop drilling?", options: ["A performance optimization technique", "Passing props down through multiple layers of components", "A way to query props using a special tool", "An error that occurs when props are not defined"], answer: "Passing props down through multiple layers of components" },
                { question: "What does the `useContext` hook do?", options: ["It creates a new context for global state", "It allows a functional component to subscribe to context changes", "It is used for fetching data from an API", "It replaces Redux for all state management"], answer: "It allows a functional component to subscribe to context changes" },
                { question: "What is the difference between `==` and `===` in JavaScript?", options: ["They are identical", "`===` checks for type and value equality, while `==` performs type coercion", "`==` is faster than `===`", "`===` is only for strings"], answer: "`===` checks for type and value equality, while `==` performs type coercion" },
                { question: "What is Tailwind CSS?", options: ["A JavaScript framework", "A component library like Bootstrap", "A utility-first CSS framework", "A CSS preprocessor"], answer: "A utility-first CSS framework" }
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
                { question: "If a company's assets are $150,000 and its liabilities are $90,000, what is its equity?", options: ["$240,000", "$150,000", "$90,000", "$60,000"], answer: "$60,000" },
                { question: "A high P/E ratio could suggest that a stock is...", options: ["Undervalued", "Fairly valued", "Overvalued or has high growth expectations", "A blue-chip stock"], answer: "Overvalued or has high growth expectations" },
                { question: "Which of the following is considered a non-cash expense?", options: ["Salaries", "Rent", "Depreciation", "Interest Payments"], answer: "Depreciation" },
                { question: "What is the main purpose of the DuPont analysis?", options: ["To calculate the exact stock price", "To decompose Return on Equity (ROE) into its key components", "To determine the company's cash flow", "To measure market volatility"], answer: "To decompose Return on Equity (ROE) into its key components" },
                { question: "Free Cash Flow (FCF) represents the cash available for...", options: ["Paying salaries only", "Distribution to all stakeholders, including debt and equity holders", "Marketing activities", "Buying new inventory"], answer: "Distribution to all stakeholders, including debt and equity holders" },
                { question: "What does 'goodwill' on a balance sheet represent?", options: ["The company's reputation", "An intangible asset representing the premium paid for a company over its book value", "Donations made by the company", "Cash reserves"], answer: "An intangible asset representing the premium paid for a company over its book value" },
                { question: "What is the primary difference between a bond and a stock?", options: ["A bond represents ownership, a stock represents debt", "A stock represents ownership, a bond represents debt", "They are the same thing", "Bonds are only issued by governments"], answer: "A stock represents ownership, a bond represents debt" },
                { question: "What is EBITDA?", options: ["Earnings Before Interest, Taxes, Depreciation, and Amortization", "Equity Backed Investment, Taxes, and Debt Allowance", "Estimated Business Income, Transactions, and Direct Amortization", "Earnings Before Investment, Transactions, and Debt Amortization"], answer: "Earnings Before Interest, Taxes, Depreciation, and Amortization" },
                { question: "An 'accrual' in accounting refers to:", options: ["Cash that has been received", "An expense that has been paid", "Revenue or expense that is recognized before cash is exchanged", "An error in the financial statements"], answer: "Revenue or expense that is recognized before cash is exchanged" },
                { question: "Which type of financial analysis involves comparing a company's ratios over several periods?", options: ["Vertical Analysis", "Horizontal Analysis", "Ratio Analysis", "Trend Analysis"], answer: "Trend Analysis" },
                { question: "What is a 'derivative' in finance?", options: ["A type of stock", "A financial contract whose value is derived from an underlying asset", "A type of bank account", "A company that is a subsidiary of another"], answer: "A financial contract whose value is derived from an underlying asset" }
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
                { question: "The Haber-Bosch process is significant in agriculture for producing what?", options: ["Phosphate fertilizers", "Nitrogen fertilizers", "Potassium fertilizers", "Organic compost"], answer: "Nitrogen fertilizers" },
                { question: "What is 'eutrophication' in an agricultural context?", options: ["A type of soil erosion", "The enrichment of water bodies with nutrients, often leading to algal blooms", "A method of pest control", "The process of drying crops"], answer: "The enrichment of water bodies with nutrients, often leading to algal blooms" },
                { question: "Which of these is a common symptom of potassium deficiency in plants?", options: ["Yellowing of young leaves", "Stunted growth", "Purple discoloration of leaves", "Yellowing along the edges of older leaves"], answer: "Yellowing along the edges of older leaves" },
                { question: "What is the Cation Exchange Capacity (CEC) of a soil an indicator of?", options: ["Its water holding capacity", "Its ability to hold onto and supply positive ions (nutrients) to a plant", "Its resistance to erosion", "Its suitability for construction"], answer: "Its ability to hold onto and supply positive ions (nutrients) to a plant" },
                { question: "Which of the following is a benefit of no-till farming?", options: ["Increased soil temperature", "Reduced soil erosion and improved water retention", "Easier weed control in the first year", "Lower initial equipment cost"], answer: "Reduced soil erosion and improved water retention" },
                { question: "What is the primary function of phosphorus in plant growth?", options: ["Chlorophyll production", "Energy transfer (ATP), photosynthesis, and root development", "Water regulation", "Disease resistance"], answer: "Energy transfer (ATP), photosynthesis, and root development" },
                { question: "What is a 'cover crop'?", options: ["A crop grown for its appearance", "A crop grown to sell", "A crop grown for the protection and enrichment of the soil", "The main cash crop"], answer: "A crop grown for the protection and enrichment of the soil" },
                { question: "Soil salinization is the process of:", options: ["Increasing the salt content in the soil", "Removing salt from the soil", "Adding organic matter to the soil", "Increasing soil pH"], answer: "Increasing the salt content in the soil" },
                { question: "Which of the following is a micronutrient for plants?", options: ["Phosphorus", "Potassium", "Zinc", "Magnesium"], answer: "Zinc" },
                { question: "What is a 'hybrid' seed?", options: ["A seed that grows in water", "A seed produced by cross-pollinating two different inbred parent plants", "A genetically modified seed", "An ancient variety of seed"], answer: "A seed produced by cross-pollinating two different inbred parent plants" },
                { question: "Precision agriculture primarily uses which technology to optimize crop yields?", options: ["Weather forecasting", "Hand tools", "GPS and remote sensing", "Organic fertilizers"], answer: "GPS and remote sensing" }
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
                { question: "What does a '3PL' provider do?", options: ["Manufactures products for three companies", "Provides outsourced logistics services", "Is a type of raw material supplier", "A government regulatory body"], answer: "Provides outsourced logistics services" },
                { question: "Cross-docking is a logistics procedure where...", options: ["Trucks cross a dock to switch loads", "Products from a supplier are distributed directly to a customer with minimal handling or storage time", "Goods are stored for long periods", "Inventory is counted manually"], answer: "Products from a supplier are distributed directly to a customer with minimal handling or storage time" },
                { question: "What does 'JIT' stand for in inventory systems?", options: ["Just-In-Time", "Job-In-Transit", "Journal of Inventory Tracking", "Judgement-In-Time"], answer: "Just-In-Time" },
                { question: "Which of the following is NOT a mode of transport?", options: ["Rail", "Pipeline", "Warehouse", "Air"], answer: "Warehouse" },
                { question: "The SCOR model is used to:", options: ["Calculate shipping costs", "Describe, measure, and evaluate supply chain configurations", "Manage customer relationships", "Design new products"], answer: "Describe, measure, and evaluate supply chain configurations" },
                { question: "What is the primary trade-off in inventory management?", options: ["Quality vs. Speed", "Cost vs. Customer Service Level", "Marketing vs. Sales", "Inbound vs. Outbound logistics"], answer: "Cost vs. Customer Service Level" },
                { question: "What is a 'freight forwarder'?", options: ["A truck driver", "An agent who organizes shipments for individuals or corporations", "The owner of a shipping company", "A type of shipping container"], answer: "An agent who organizes shipments for individuals or corporations" },
                { question: "What does 'LTL' stand for in shipping?", options: ["Long-Term Logistics", "Low-Tonnage Load", "Less-Than-Truckload", "Local Transportation Link"], answer: "Less-Than-Truckload" },
                { question: "The total time it takes for a supplier to deliver an order after it has been placed is called:", options: ["Cycle Time", "Lead Time", "Takt Time", "Dwell Time"], answer: "Lead Time" },
                { question: "What is 'dunnage' in logistics?", options: ["A type of tax on goods", "Inexpensive or waste material used to load and secure cargo during transportation", "A fee for late delivery", "The process of unloading a ship"], answer: "Inexpensive or waste material used to load and secure cargo during transportation" },
                { question: "What is a 'pick and pack' operation?", options: ["A type of marketing strategy", "The process of selecting items from inventory and packing them for shipment", "A method for choosing suppliers", "A financial term for acquiring and selling stocks"], answer: "The process of selecting items from inventory and packing them for shipment" }
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
        }
    },
    'customer-service': {
        en: {
            title: 'Customer Service Excellence',
            questions: [
                { question: "What is the primary goal of a customer service professional?", options: ["To sell more products", "To resolve customer issues quickly", "To ensure customer satisfaction and loyalty", "To reduce the number of inbound calls"], answer: "To ensure customer satisfaction and loyalty" },
                { question: "What does the acronym 'CRM' stand for in a business context?", options: ["Customer Relationship Management", "Company Resource Management", "Customer Reply Mechanism", "Corporate Responsibility Mandate"], answer: "Customer Relationship Management" },
                { question: "A customer is very angry and yelling. What is the BEST first step?", options: ["Hang up on them", "Tell them to calm down", "Listen actively, show empathy, and acknowledge their frustration", "Immediately offer a refund"], answer: "Listen actively, show empathy, and acknowledge their frustration" },
                { question: "What is meant by 'active listening'?", options: ["Hearing what the customer says", "Waiting for your turn to speak", "Fully concentrating on what is being said, understanding, and responding", "Writing down every word the customer says"], answer: "Fully concentrating on what is being said, understanding, and responding" },
                { question: "When you don't know the answer to a customer's question, what should you do?", options: ["Guess the answer", "Tell them you can't help", "Tell them you will find out the information and get back to them", "Ignore the question and change the subject"], answer: "Tell them you will find out the information and get back to them" },
                { question: "What is a good way to show empathy to a customer?", options: ["Saying 'I understand how you feel'", "Saying 'That's not my problem'", "Ignoring their emotional state", "Telling them a story about your own problems"], answer: "Saying 'I understand how you feel'" },
                { question: "Why is it important to use positive language in customer service?", options: ["It's required by law", "It sounds more intelligent", "It creates a more collaborative and less confrontational tone", "It confuses the customer"], answer: "It creates a more collaborative and less confrontational tone" },
                { question: "What is 'First Call Resolution' (FCR)?", options: ["Resolving the customer's issue on the very first contact", "The first call you make in the morning", "A customer's first-ever call to support", "The first step in a long resolution process"], answer: "Resolving the customer's issue on the very first contact" },
                { question: "What is the Net Promoter Score (NPS) used to measure?", options: ["Company profits", "Employee satisfaction", "Customer loyalty and satisfaction", "Website traffic"], answer: "Customer loyalty and satisfaction" },
                { question: "How should you handle a customer who asks for something that is against company policy?", options: ["Immediately say 'no'", "Grant the request anyway", "Explain the policy calmly, express regret you can't meet the request, and offer any possible alternatives", "Tell them they need to speak to your manager"], answer: "Explain the policy calmly, express regret you can't meet the request, and offer any possible alternatives" },
                { question: "What is the main benefit of a multi-channel customer support strategy (phone, email, chat)?", options: ["It is cheaper for the company", "It allows customers to choose their preferred method of communication", "It reduces the need for human agents", "It makes work more complicated"], answer: "It allows customers to choose their preferred method of communication" },
                { question: "After resolving a customer's issue, what is a good final step?", options: ["Immediately ending the conversation", "Asking if there is anything else you can help with", "Transferring them to another department", "Asking them to buy another product"], answer: "Asking if there is anything else you can help with" },
                { question: "What is the 'tone of voice' in written communication like email or chat?", options: ["The font and color used", "The speed of your typing", "The attitude and emotion conveyed through your choice of words, punctuation, and sentence structure", "It doesn't exist in writing"], answer: "The attitude and emotion conveyed through your choice of words, punctuation, and sentence structure" },
                { question: "A customer complains on social media. What is a recommended practice?", options: ["Delete the comment", "Ignore the comment", "Respond publicly with a request to take the conversation to a private channel (DM, email)", "Argue with the customer in the comments"], answer: "Respond publicly with a request to take the conversation to a private channel (DM, email)" },
                { question: "Why is product knowledge important for a customer service agent?", options: ["To impress customers with technical jargon", "To be able to answer questions accurately and solve problems effectively", "It's not as important as being friendly", "To be able to process sales"], answer: "To be able to answer questions accurately and solve problems effectively" },
                { question: "What does 'SLA' stand for in customer service?", options: ["Service Level Agreement", "Standard Legal Action", "Sales Lead Accuracy", "Support Line Availability"], answer: "Service Level Agreement" },
                { question: "When closing a support ticket, what is the most important thing to ensure?", options: ["That the ticket is closed quickly", "That the customer agrees the issue is resolved to their satisfaction", "That you have logged your time correctly", "That you have offered an upsell"], answer: "That the customer agrees the issue is resolved to their satisfaction" },
                { question: "What is a 'knowledge base' used for in customer support?", options: ["To store customer credit card information", "A repository of articles and answers to common questions for self-service", "A list of employee contact details", "A place to complain about difficult customers"], answer: "A repository of articles and answers to common questions for self-service" },
                { question: "What is the 'Customer Effort Score' (CES)?", options: ["A measure of how much effort the agent put in", "A metric that measures how much effort a customer had to exert to get an issue resolved", "The agent's score on a training test", "The number of times a customer has to call"], answer: "A metric that measures how much effort a customer had to exert to get an issue resolved" },
                { question: "If you cannot solve a customer's problem, what is the best course of action?", options: ["Tell the customer it's impossible to solve", "Blame another department", "Escalate the issue to a senior team member or manager who can help", "Close the ticket and hope they don't call back"], answer: "Escalate the issue to a senior team member or manager who can help" }
            ]
        },
        fr: {
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
                { question: "A trader bought a watch for $200 and sold it for $250. What is the percentage profit?", options: ["20%", "25%", "30%", "50%"], answer: "25%" },
                { question: "Book is to Reading as Fork is to:", options: ["Drawing", "Writing", "Stirring", "Eating"], answer: "Eating" },
                { question: "Which of the following is least like the others? Poem, Novel, Painting, Flower", options: ["Poem", "Novel", "Painting", "Flower"], answer: "Flower" },
                { question: "A man is 24 years older than his son. In two years, his age will be twice the age of his son. What is the present age of his son?", options: ["20", "22", "24", "26"], answer: "22" },
                { question: "What is 3/7 of 105?", options: ["35", "45", "55", "65"], answer: "45" },
                { question: "Find the missing number in the series: 5, 10, 17, ?, 37, 50.", options: ["24", "26", "28", "30"], answer: "26" },
                { question: "If 5 machines can make 5 widgets in 5 minutes, how long would it take 100 machines to make 100 widgets?", options: ["100 minutes", "50 minutes", "5 minutes", "1 minute"], answer: "5 minutes" },
                { question: "Which one of the five is least like the other four? Dog, Mouse, Lion, Snake, Elephant", options: ["Dog", "Mouse", "Lion", "Snake", "Elephant"], answer: "Snake" },
                { question: "A man walks 5 km east, then turns south and walks 5 km, then turns east again and walks 5 km. How far is he from his starting point (as the crow flies)?", options: ["10 km", "15 km", "5√5 km", "10√2 km"], answer: "10√2 km" },
                { question: "The day before yesterday was Saturday. What day will it be the day after tomorrow?", options: ["Tuesday", "Wednesday", "Thursday", "Friday"], answer: "Wednesday" },
                { question: "A farmer has 17 sheep, and all but 9 die. How many does he have left?", options: ["17", "9", "8", "0"], answer: "9" }
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


export default function TakeAssessmentPage() {
  const router = useRouter();
  const params = useParams();
  const { t } = useLocalization();
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

  if (step === 'invalid') {
    return <div>{t('Test not found')}</div>;
  }

  return (
    <div className="container mx-auto py-8">
        {step === 'setup' && <ProctoringSetup onSetupComplete={() => setStep('test')} />}
        {step === 'test' && <TestInterface testId={testId as TestId} onTestComplete={handleTestComplete} />}
    </div>
  );
}
