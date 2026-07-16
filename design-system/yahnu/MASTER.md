# Yahnu — Abidjan Momentum

This is the source of truth for Yahnu’s product experience. It is rooted in contemporary Côte d’Ivoire: optimistic, practical, urban and human. It must never rely on generic “African” costume, safari imagery or decorative stereotypes.

## Product idea

Yahnu is the bridge from campus to professional life. The recurring visual signature is a route or network: connected points, subtle map grids and paths that suggest the lagoon, bridges and movement between Ivorian cities.

## Colour

| Role | Token | Intent |
| --- | --- | --- |
| Warm canvas | `ivory` / `--background` | Sun-warmed paper, generous breathing room |
| Forest green | `--primary` | Progress, trust and primary actions |
| Côte d’Ivoire orange | `terra` | Energy and high-emphasis calls to action; pair with cocoa text |
| Lagoon teal | `lagoon` | Secondary information and connection motifs |
| Cocoa ink | `cocoa` | Main text and dark editorial surfaces |
| Sunshine | `soleil` | Small optimistic accents only |

Orange must not use white text at small sizes. Status colours keep their semantic meaning and are never the only indicator.

## Typography

- Display: **Bricolage Grotesque** — bold, compact and expressive.
- Body/UI: **Afacad Flux** — warm, highly readable and efficient.
- Headlines use tight tracking and short, conversational phrases.
- Body copy speaks plainly in natural fr-CI. English remains a localized alternative, not the default voice.

## Shape and depth

- Interactive targets: minimum 44 × 44 px.
- Controls: 12–14 px radius; cards: 20–32 px radius.
- Use soft borders and restrained shadows. Reserve lifted depth for hero media, menus and key calls to action.
- Avoid identical floating cards everywhere; information hierarchy comes from composition and typography first.

## Imagery

- Show real-feeling young Ivorian graduates, mentors and employers in contemporary urban, campus and workplace settings.
- Use Abidjan, Bouaké, Yamoussoukro, Korhogo and San-Pédro as context where relevant.
- Wardrobe, architecture and activity should feel current and aspirational without luxury clichés.
- No flags as costumes, mortarboard stock-photo poses or invented employer endorsements.

## Motion

- Motion explains state or direction: tab changes, drawers, saved states and route transitions.
- Default duration: 160–240 ms. No endless decoration, bounce or layout-shifting hover scale.
- Fully respect `prefers-reduced-motion`.

## Content integrity

- Live jobs, users and admin metrics must come from the production API.
- Fictional examples must say **Exemple illustratif** and link to a valid search, never a fake detail page.
- Use `fr-CI`, XOF/FCFA, `+225`, and Ivorian locations when the field calls for them.
- Never imply a partnership with a real company or school unless it is present in production data.

## Accessibility and responsive rules

- WCAG AA contrast, visible keyboard focus and meaningful labels are mandatory.
- Build mobile-first at 360 px, then verify 390, 768, 1024 and 1440 px.
- Data tables need a usable small-screen treatment; navigation and dialogs must be keyboard and screen-reader operable.
- Empty, loading, error and permission-denied states are part of every feature, not afterthoughts.

## Pre-delivery checklist

- [ ] Every link resolves to a real registered route.
- [ ] No untranslated or mojibake user-facing text.
- [ ] No fabricated stats, testimonials, jobs or partner claims.
- [ ] All roles receive a coherent, role-specific landing experience.
- [ ] Keyboard, reduced-motion and 360 px layouts verified.
- [ ] Live API behavior, typecheck, lint and production build verified.
