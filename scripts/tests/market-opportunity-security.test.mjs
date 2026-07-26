import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  isIsoCalendarDate,
  marketOpportunityCutoffDate,
  marketOpportunityIsCurrent,
  serializePublicMarketOpportunity,
} from "../../src/lib/market-opportunity-public.ts";

const fixture = {
  slug: "stage-abidjan",
  company: "Entreprise ivoirienne",
  title: { fr: "Stage", en: "Internship" },
  location: { fr: "Abidjan", en: "Abidjan" },
  workMode: "on-site",
  contract: { fr: "Stage", en: "Internship" },
  summary: { fr: "Résumé", en: "Summary" },
  tags: ["Jeunes diplômés"],
  verifiedAt: "2026-07-25",
  expiresAt: "2026-08-08",
  sourceUrl: "https://employer.example/jobs/123",
};

test("public opportunity serialization never exposes the employer source", () => {
  const publicOpportunity = serializePublicMarketOpportunity(fixture);
  assert.equal(Object.hasOwn(publicOpportunity, "sourceUrl"), false);
  assert.equal(fixture.sourceUrl, "https://employer.example/jobs/123");
  assert.equal(publicOpportunity.slug, fixture.slug);
});

test("opportunities remain current through the end of their expiry date", () => {
  assert.equal(
    marketOpportunityIsCurrent(fixture, new Date("2026-08-08T23:59:59Z")),
    true,
  );
  assert.equal(
    marketOpportunityIsCurrent(fixture, new Date("2026-08-09T00:00:00Z")),
    false,
  );
  assert.equal(marketOpportunityIsCurrent({ expiresAt: "not-a-date" }), false);
});

test("official deadlines override later editorial expiry dates", () => {
  const dated = { expiresAt: "2026-08-20", deadlineAt: "2026-08-12" };
  assert.equal(marketOpportunityCutoffDate(dated), "2026-08-12");
  assert.equal(
    marketOpportunityIsCurrent(dated, new Date("2026-08-13T00:00:00Z")),
    false,
  );
});

test("calendar validation rejects normalized impossible dates", () => {
  assert.equal(isIsoCalendarDate("2026-02-28"), true);
  assert.equal(isIsoCalendarDate("2026-02-31"), false);
  assert.equal(isIsoCalendarDate("2026-13-01"), false);
});

test("the source-bearing default catalog is explicitly server-only", async () => {
  const source = await readFile(
    new URL("../../src/lib/verified-market-opportunities.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /^import "server-only";/);
});
