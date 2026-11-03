# Playtest and validation

Base: eb5113247409cef297c7f2a04708a2194a1e7b49 (2.5.2).

The browser could not launch in this managed session: Chromium failed at MachPortRendezvousServer with permission denied. No visual or real-browser interaction checks are claimed.

Before the feature changes, the actual game engine was exercised for 12 terms as Türkiye’s leader and 12 as a citizen, with presentation and persistence stubs. Policy confirmations and queued decisions were resolved through the engine. Education and infrastructure completed with 58 and 56 treasury spent. In that exploratory run, repeated social support/meetings/speeches raised approval to about 96 and treasury to 432; the citizen became mayor in term 8. This is a single randomized run, not a balance benchmark. Recommendations: reduce repetitive dominant strategies, deepen consequences of choices, and make local campaigning and national ambitions distinct.

Feature verification:

- `npm run check`: TypeScript application and service worker.
- `npm run build`: production bundle with original assets.
- `npm run test:model`: Node VM tests execute the compiled production engine. Coverage includes save defaults and validation, movement supply cost/cooldown/consumption, governor confirmation and ownership, successful and failed independent elections with 100 total seats, local rally isolation/cooldown, subordinate administration creation/permissions, and synthetic map wheel/pinch events scoped to the map.

Limitations: synthetic map events do not replace mobile or desktop browser testing. Existing Playwright tests still need to be run in an environment that permits Chromium. Province support currently follows the existing game regions, not Türkiye’s 81 administrative provinces. KKTC is not added to the map and no real-world patron relationship is preset. Creation of a new subordinate administration operates on an already-controlled noncapital region. For an existing foreign state, the selected-country report/commands panel exposes the existing protectorate agreement and then a three-candidate country governor appointment, with no territorial split.
