# Project Blueprint: Yahnu

This document outlines the core architectural and branding guidelines for the Yahnu platform.

## 1. Brand Identity

### 1.1. Mission Statement

To be the leading platform for professional connection and opportunity in Africa, driving economic growth and individual success by bridging the gap between education and employment.

### 1.2. Color System

The Yahnu application utilizes a dynamic, theme-based color system built on CSS variables to provide a localized user experience. The color palette changes based on the user's selected country, with a primary and accent color reflecting the branding of that region.

#### 1.2.1. Base Palette

This is the default color set for the application. All color values are defined using HSL.

- **Primary**: `34 90% 50%` (A vibrant, deep saffron)
- **Primary Foreground**: `0 0% 100%` (White, for high contrast on the primary color)
- **Accent**: `142 71% 90%` (A light, complementary green)

#### 1.2.2. Country-Specific Themes

The following themes are automatically applied when a user selects a country. The `--primary` and `--accent` variables are overridden to reflect the local brand identity.

- **Côte d'Ivoire (`ivory-coast`)**
  - `--primary`: `34 90% 50%` (Saffron)
  - `--accent`: `142 71% 90%` (Light Green)

- **Ghana (`ghana-gold`)**
  - `--primary`: `45 100% 51%` (Gold)
  - `--accent`: `45 100% 90%` (Light Gold)

- **Nigeria (`nigeria-green`)**
  - `--primary`: `122 60% 35%` (Forest Green)
  - `--accent`: `122 60% 90%` (Light Mint)

- **Senegal (`senegal-sun`)**
    - `--primary`: `48 100% 50%` (Bright Yellow)
    - `--accent`: `48 100% 90%` (Light Yellow)

- **Cameroon (`cameroon-unity`)**
    - `--primary`: `122 39% 49%` (Rich Green)
    - `--accent`: `122 39% 90%` (Pastel Green)

- **DRC (`drc-cobalt`)**
    - `--primary`: `220 81% 51%` (Bright Blue)
    - `--accent`: `220 81% 90%` (Light Sky Blue)


## 2. Typography

The application uses the 'Inter' sans-serif font as the primary font for all body and headline text. It is assigned via a CSS variable (`--font-inter`) in the main layout file.

- **Body**: `var(--font-inter)`
- **Headlines**: `var(--font-inter)`

## 3. Tech Stack

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Authentication**: Firebase Authentication
- **Database**: Firebase Firestore
- **AI**: Google AI Platform (via Genkit)
- **Deployment**: Firebase App Hosting

## 4. Architectural Patterns

- **Component Organization**: Components are organized by feature in the `src/features` directory. Reusable, generic UI components are located in `src/components/ui`.
- **State Management**: Global state (e.g., authentication, localization) is managed via React Context.
- **Data Fetching**: Server-side rendering (SSR) and Server Components are used for static content, while client-side fetching is used for dynamic, real-time data from Firestore.
- **Styling**: Utility-first styling is managed with Tailwind CSS. All colors, fonts, and spacing are defined as variables to ensure consistency.
