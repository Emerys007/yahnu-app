import nextVitals from "eslint-config-next/core-web-vitals"

export default [
  ...nextVitals,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "work/**",
      "yahnu-app/**",
      "src/features/landing/**",
      "src/components/dashboard/applications/**",
      "src/components/dashboard/partnerships/**",
      "src/components/dashboard/settings/**",
    ],
  },
  {
    // This project predates React Compiler. Keep its behavioral migration
    // diagnostics out of the release gate while the existing screens are
    // modernized incrementally; TypeScript and core Next rules still run.
    rules: {
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
      "react-hooks/purity": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/static-components": "off",
      "react/no-unescaped-entities": "off",
    },
  },
]
