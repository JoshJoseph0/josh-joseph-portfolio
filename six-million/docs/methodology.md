> Current shared assignment behaviour (25 October 2026): every dot starts unassigned; clicking any dot permanently links an available approved person in the shared SQLite database. Every visitor sees the same link. Earlier browser-local assignment descriptions below are historical. See [Shared database](shared-database.md).

# Six Million: methodology

Cohort version: 2026-10-21.1; profile snapshot: 2026-10-22.experience-1. Main layout: field-v1; comparison layout: star-v1. Prototype scope: Jewish victims of the Holocaust.

## Estimate and evidence

Approximately six million Jewish people were murdered by Nazi Germany and its allies and collaborators. This prototype uses the [United States Holocaust Memorial Museum's synthesis](https://encyclopedia.ushmm.org/content/en/article/documenting-numbers-of-victims-of-the-holocaust-and-nazi-persecution), accessed 21 October 2026. USHMM explains that the estimate draws on surviving perpetrator documents, demographic research, Jewish documentation, resistance records and other archival evidence. No single surviving document enumerates every death.

The model has exactly 6,000,000 statistical slots. That implementation count does not make the historical estimate exact, nor does it imply the existence of six million uniquely verified identity records. No numerical confidence interval has been invented.

A slot is an abstract memorial unit, not an assertion about a specific person. Positions have no geographical or biographical meaning. Linking a verified record to a slot is a curatorial allocation within this visualization, not a reconstruction of where an anonymous marker's identity was previously located.

## Aggregate colour is not individual identity

The seeded red share is five-sixths, based on approximately five million names documented by [Yad Vashem, announced in November 2025](https://www.yadvashem.org/press-release/11-november-2025-08-44.html), relative to the approximately six-million historical estimate. These are aggregate figures, not a definitive allocation of those names to these positions. This seed generates 4,999,066 red dots and 1,000,934 grey dots. The small numerical difference from five million is the deterministic statistical sampling, not a new historical estimate.

Red does not mean Six Million possesses a verified biography for that slot. Grey does not establish that a particular victim is unidentified. All red dots have the same colour and shape; selection or a saved association never adds a ring, badge, colour change or completion indicator. Text explains the aggregate encoding, and the approved-name list provides access without precise pointing or colour discrimination.

Twenty-five real profiles (ten API-derived and fifteen short original factual summaries) have institutional identity/fate cross-checks and explicit publication approvals. This small selection is not representative. Source-check methods and unresolved claims are disclosed; independent historian review has not been performed. Fictional examples remain removed. Technical fixtures and synthetic identifiers exist only in clearly labelled automated tests.

Each browser allocates an unused approved person to a selected red slot when one is available. That association is personal browser memory, not historical proof of a particular slot's identity. Other visitors can encounter a different person at the same position. No central assignment service exists.

## Cohorts and overlapping categories

Only the Jewish cohort is implemented. The schema keeps cohort definitions, estimate types, uncertainty, sources and layout versions separate. Future cohorts must have independent institutional evidence. Their figures must not be added into a unique-person total because memberships can overlap. Children belong to an age-based lens. A range must not be silently replaced by a midpoint or by invented "possible victim" identities.

## Geometry and representation

The main experience is now **The Field**, following the user's explicit instruction to replace the star. A finite staggered plane contains exactly 3,000 columns by 2,000 rows: IDs 0 through 5,999,999. A slot is `row * 3000 + column`; no coordinate table or per-person JavaScript objects are retained. Spacing is 6, diameter 2.3, and row separation is `6 * sqrt(3) / 2`. Independent hashes generate a bounded radius-1.8 disk offset for each ID. Minimum lattice separation is 6, so the jitter bound retains a minimum centre separation of 2.4, greater than the diameter. Boundary margins include both jitter and radius. Positions are permanent, equal-sized world marks, not particles or a repeating texture.

The new layout is `field-v1`. Its coordinates intentionally differ from `star-v1`, which remains in `star.html` and Git history. Canonical slot IDs, the fixed colour hash and all six million statistical positions are preserved. On the first Field visit, compatible star assignments and the visitor's discovery sequence copy into a new layout envelope; the original star memory is untouched. Field coordinates then remain stable across reloads. No person data is rebuilt for the new layout.

The orthographic camera begins inside the plane: about 40,000 real centres on a large desktop viewport, fewer on phones. This is a camera preset, not a fabricated count. Wheel zoom remains anchored under the pointer; drag, touch, WASD and arrows use the same pure camera math. R and Return to start restore arrival; Show full field fits the complete finite boundary. Camera rotation, automatic movement and entrance animations are absent.

At distant zoom, a finite rectangle encodes mean dot coverage. Its colour is calculated from actual circle area, finite world area, opacity and the exhaustively checked red/grey counts. It is an average density representation, not a claim that six million dots are distinguishable. As projected spacing increases, smoothstep blending reveals a bounded hierarchy of representative neighbourhood marks and then the exact original centres. Representative radius scales with stride to retain mean area coverage; their controlled aggregate-only jitter suppresses sampling rows. Deep positions and world dot diameter are unchanged. No infinite texture is tiled.

A fixed 262,144-entry Float32 position/colour-flag buffer occupies 3 MiB of CPU storage, plus a GPU copy. At most two visible batches are submitted; normal arrival and close zoom use one exact batch. Viewport arithmetic culls all other rows/columns. Canvas2D handles unavailable or lost WebGL2 contexts. The p5 global draw loop sleeps between input, resizing and async record updates. Main Field entry downloads no overview image or full biography. No rendering or camera method contacts historical APIs.

The scale indicator counts actual jittered centres inside the canvas viewport. Guaranteed interior columns are counted arithmetically; only the narrow uncertain perimeter is tested individually. It includes centres behind interface text and is independent of the number of representative draw marks or loaded biographies. Full extent counts exactly 6,000,000. It describes spatial scale, never collection progress.

## Record admission and rights

The approved index requires unique person IDs and original source identifiers, publication approval, cleared structured-data rights, a documented name and HTTPS source references. It does not assign people globally to slots. The approved metadata index supplies the visitor buffer. A full biography is fetched only on selection and must match its canonical and original source IDs, name, approval and documented fate before display. These programmatic checks are separate from historical source review.

The buffer targets 50 prepared approved people and triggers a single-flight refill at five remaining. The available approved index currently contains only twenty-five, so the smaller buffer is disclosed; no unverified discoveries fill its remaining capacity. Failed or exhausted candidates are not polled repeatedly. Background Wikidata enrichment requests at most 50 known source IDs per batch, respects maxlag and rate-limit backoff, and keeps returned statements awaiting review. No camera or renderer code requests historical data. New historical identities require the existing import, evidence-review and publication workflow.

Assignments use a Map and a layout-specific localStorage key, with schemaVersion 1 and layoutVersion field-v1 (star-v1 remains separately retained). Lightweight [slot ID, person ID] pairs, a visitor seed and the approved-ID discovery sequence persist. No biographies are stored in the assignment envelope. Duplicate people, duplicate source identities, unapproved records, grey slots and invalid coordinates are rejected on restoration. Missing, corrupt or quota-blocked storage falls back to current-page memory. An incompatible schema is left untouched. Storage is specific to browser profile and website origin; clearing site data or private-browser storage can remove it. The twenty-five-person collection is far below localStorage limits, so IndexedDB is not needed at this stage. Sequential tabs reread browser storage before allocation. Simultaneous competing writes are not transactional; use one exploration tab per browser for strict consistency.

The current person schema is used by the twenty-five reviewed profiles: names and alternatives; birth/date display with precision or uncertainty; fate; places; sourced facts; original editorial biography where justified; uncertainty; archival sources; media and rights. Empty or conflicting evidence must remain explicit. Do not infer missing dates, fabricate prose, generate portraits, or publish disputed records.

An image requires a local asset path, original HTTPS source, rights holder, attribution, review date, documented public-domain/open-licence/written-permission basis, permission reference and affirmative public-display approval. No photograph is currently cleared in the collection. Museum page visibility is not permission. The [USHMM rights guidance](https://www.ushmm.org/collections/ask-a-research-question/rights-and-reproductions) requires checking each image independently. Public archival search access does not establish republication rights. No undocumented archive endpoints are used. A static approved index and bounded JSON loader can later be replaced by a reviewed publication pipeline backed by PostgreSQL without changing slot positions.

## Accessibility and limitations

Descriptions, navigation, explanations, record list and biography dialogs use HTML. Keyboard navigation is scoped to the focused field, preserving browser and screen-reader shortcuts elsewhere. Native modal dialogs provide focus containment and Escape dismissal. No motion or momentum occurs independently of input; reduced-motion preferences disable optional CSS motion.

The Wikidata API supplies structured source claims; a separate Node-only EHRI adapter discovers archival holdings. Neither search results nor a category automatically establish victim status. Approved local snapshots remain usable during API outages. No multi-cohort views, age lenses or public correction workflow is included. Statistical markers cannot recreate individual lives. Historical review, rights clearance, and testing with disabled users are required before a public memorial launch.

## Phase 2 publication workflow

Import and publication are separate. The sync script retrieves real candidates but cannot approve them. Institutional evidence, reuse scope and a SHA-256 digest of the reviewed API revision are required for the publication script. Structured Wikidata facts use CC0; institutional prose and media are not republished. Public profiles disclose that source checks were AI-assisted and have not had independent historian review. Review the PR before a public release. Read the [API integration report](api-integration.md) for requests, access limits, schema, uncertainty decisions and tests.

## Current implementation evidence

Read the [current Field and source expansion report](field-implementation-report.md) for live request evidence, design states, tests, performance and limitations. The Star of David implementation report and earlier development/API logs are historical specifications.

## Personal discovery and source expansion

A 128-bit browser seed initializes a deterministic pseudorandom generator. Canonicalizing the approved ID set makes the input reproducible; seeded Fisher-Yates removes source-index, name and fame ordering. A bounded 64-entry lookahead then softly reduces adjacent documented household/collection/residence/country/period repetition. Unknown attributes incur no penalty, no identity is inferred and no demographic quota is invented. This is a diversity-conditioned sequence, not a claim that all final permutations are equally likely. Swapping into a consumed prefix avoids quadratic array shifting. Existing stored sequences are retained; newly approved IDs append in seeded order. Different browser profiles can encounter different people at the same slot.

Fifteen new USHMM identification-card profiles broaden the original ten. Each contains original short factual prose, an individual institutional source, explicit fate/identity evidence and a SHA-256-pinned editorial review entry. Seven reviewed survivors are excluded; two ambiguous/scope-dependent records remain under review. None of the 39 unique SPARQL discoveries has publication approval. EHRI's 25 retained collection references are archival metadata, not people or evidence of murder. Name matches only create review candidates; no automatic person merges occur. See the current report for exact access methods, genuine HTTP responses and institutional reuse limits.
