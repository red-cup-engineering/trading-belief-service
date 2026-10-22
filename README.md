# trading-belief-service

<!-- 561-group-standards:badges:start -->
[![Red Cup Engineering](https://img.shields.io/badge/561%20Group-Red%20Cup%20Engineering-c0392b)](https://github.com/red-cup-engineering)
[![License: MIT](https://img.shields.io/badge/license-MIT-c0392b)](LICENSE)
[![Indigenous data: CARE](https://img.shields.io/badge/Indigenous%20data-CARE-4b6f44)](https://github.com/red-cup-engineering/.github/blob/main/GOVERNANCE.md)
[![Tips welcome](https://img.shields.io/badge/tips-welcome-d4a017)](https://github.com/561-group/.github/blob/main/TIPS.md)
<!-- 561-group-standards:badges:end -->

The belief record type and belief-to-capital algebra from
`PERSONAL-QUANT-PLATFORM-THEORY.md`: a principal's revisable, falsifier-bearing
belief kept a distinct type from observation/forecast/valuation/policy/
order-intent records, the decomposed `belief edge(i)` formula, and belief-vs-
evidence fusion through the real `@lenticule-science/metrologic` bilattice.

## What this package is

- `src/belief-record.mjs` — `createBeliefRecord`/`validateBeliefRecord`/
  `reviseBeliefRecord`. **Refuses (throws) a belief record with no
  falsifier** — a belief that cannot say what would change it is not data,
  and is never accepted as merely incomplete.
- `src/belief-edge.mjs` — the belief-to-capital algebra's edge formula,
  decomposed into five independently unit-testable named terms:
  `expectedForecastPremium`, `calibratedConfidence`, `horizonCompatibility`,
  `uncertaintyPenalty`, `transitionCost`, composed by `computeBeliefEdge`.
- `src/evidence-fusion.mjs` — belief-vs-evidence fusion via
  `@lenticule-science/metrologic/bilattice`'s `aggregate` (joinKnowledge),
  copying the real house pattern already proven in
  `forecasting-services-section/src/evidence-fusion.mjs`, applied here to a
  belief's own supporting/contrary observations instead of raw forecasting
  probability estimates.
- `scripts/evaluate-belief-edge.mjs` / `scripts/fuse-belief-with-evidence.mjs`
  — thin CLI entrypoints (`node <script> <input.json>`) over the two `src/`
  modules; scripts import `src` only, never `apps`.

## Why belief-vs-observation fusion, not raw evidence fusion

`chargeFromBeliefObservation` encodes a belief's own `supports`/`contradicts`
observation stance as a metrologic bilattice `Charge`, the same shape
`forecasting-services-section` uses for probability-threshold evidence, but
with a different encoding choice appropriate to a belief record's own typed
fields. A fused charge valued top (`isTop`, "told both") means the belief's
evidence base is in genuine conflict — support and contradiction both
asserted — which is exactly the signal a belief's falsifier discipline
exists to surface, not paper over.

## Esther/BLK worked fixture

`test/esther-blk-worked-example.test.mjs` runs the "stack BLK" standing-
accumulation belief from the theory document's third belief-record example
and its "Esther as a worked instance" section end to end: belief record ->
evidence fusion -> belief edge, both for agreeing evidence (a positive,
sleeve-worthy edge) and for conflicted evidence (a shrunk or negative edge).

## Thread

Five-custody thread (org-layering.md, 2026-09-01):
- science: [A Generative Coordinate System for Affect and Belief](../../../../../../../science-services-section/services/social-science-services-section/services/sociology-science-services-section/services/critical-theory-science-services-section/content/text/documents/articles/notes/2026/08/26/2026-08-26-note-on-a-generative-coordinate-system-for-affect-and-belief.md) (critical-theory-science-services-section) — "conviction is certainty with h [holding] engaged — the booking staked to the agent's standing" (its §4) is the formal doxastic grounding for why a belief record must carry a falsifier/revision trigger: a booking staked to the agent's standing is exactly what must be able to be disconfirmed
- engineering: [Metrologic](../../../../../../../../../../../../../../../../../../../science-services-section/services/information-science-services-section/services/math-services-section/services/obsmetrological-services-section/apps/metrologic/README.md) — the bilattice math (`aggregate`/`isTop`) this service imports for belief-vs-evidence fusion, pinned at exact version `0.1.1`
- operations: none yet — this is a pure computation library with no standing scheduled process; the paper-trading loops that will eventually consume it (`alpaca-esther-paper-trading-loop`, `alpaca-esther-paper-redistributor-loop`) are the operations arm once wired
- 561-group: [Goal-stack roadmap, 2026-09-01 0300 cut](../../../../../../../../../../../../../../../../../../../561-group-services-section/services/561-group-operations-services-section/services/561-group-enterprise-services-section/services/561-group-enterprise-project-management-services-section/data/records/2026-09-01-0300-goal-stack-roadmap.json) — the governing roadmap cut this product serves; the service is included here despite that cut's "Alpaca retired" note
- public: self (this section) — the trading-belief product ladder's first lot, a pure computation library other alpaca services and eventually a principal-facing belief ledger will consume

theory-base: [PERSONAL-QUANT-PLATFORM-THEORY.md](../../PERSONAL-QUANT-PLATFORM-THEORY.md) (alpaca-services-section) and [A Generative Coordinate System for Affect and Belief](../../../../../../../science-services-section/services/social-science-services-section/services/sociology-science-services-section/services/critical-theory-science-services-section/content/text/documents/articles/notes/2026/08/26/2026-08-26-note-on-a-generative-coordinate-system-for-affect-and-belief.md) — the former supplies the belief record shape and the belief-edge formula this package implements verbatim; the latter supplies the doxastic-attitude ground for the falsifier requirement.

A third citation ("recovered belief-mine findings") was named in this work's
brief but no matching carrier exists on disk as of this writing (grep,
markdown-vault MCP, and prior session transcripts were checked) — treated as
unverified, not cited.

## Publish gate

Fresh install, `npm run check && npm test` (`node --check` on every source/script file,
then `node --test test/*.test.mjs`), then `npm publish` against the house
registry (`~/.npmrc` routes `@red-cup-engineering` to
`https://registry.561.group/`). This is a new package: the gate is
fresh-install-and-green-tests only, no prior tarball to diff.
