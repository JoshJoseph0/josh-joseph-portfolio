# Portfolio refinement — 25 October 2026

## Reference lock

Build target: the existing live portfolio. Preserve the walking people, cream paper, green/yellow/orange shapes, Anton display type and individual project identities. Improve the reading order and evidence rather than replace the brand. The playground has its own quieter Apple-inspired material and system typography, as requested by Josh.

Research: Refero was attempted but unavailable without a subscription. No subscription was purchased. Used the existing portfolio as the primary visual reference, Refero's bundled craft guidance, and these live guides:

- [Better Layout — Jakub Krehel](https://www.aiuxplayground.com/skills/better-layout): shared alignment, content-driven responsive layouts, grouping with space and clear importance.
- [WCAG Accessibility — Addy Osmani](https://www.aiuxplayground.com/skills/wcag-accessibility): meaningful alternatives, native controls, visible keyboard focus, generous hit areas, reduced motion and text feedback.
- [Apple HIG — Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons): clear actions, recognizable states, limited primary emphasis and 44-point hit regions. Adapted to web controls; no claim of native Apple implementation.

## Decisions and influences

- Natural vertical route: introduction → six projects → about/CVs → playground → contact. Removed the pinned horizontal project reveal to make screenshots and project descriptions easy to read.
- Promote Virgin Money and Home-Start alongside George and Midnight. Show actual source screenshots, captions and full-resolution links. Explicitly distinguish concepts, ongoing work and prototypes.
- Keep Six Million restrained and contextualised as Holocaust remembrance, with a USHMM historical source. The illustrative graphic is labelled; it is not represented as a six-million-point rendering.
- Playground: retain the original 20 experiments and add 20 self-contained pieces. Quiet neutral surfaces, system type, restrained blue, pastel content and visible state changes. No unsolicited audio, networking or data submission.
- Reject generic promotional metrics, invented outcomes, fake product screenshots, heavy motion that blocks reading and blanket rounded-card styling across the portfolio.

## QA

Local links/assets checked; JavaScript syntax checked; all 20 new controls exercised in browser, including empty search and code viewer. Desktop and 390-pixel iframe previews inspected. The existing hero pickup script was adapted to the new section structure. Deployment is verified against the existing GitHub Pages URL before delivery.

## Feedback to collect

Does Virgin Money feel like the strongest opening project? Does the playground have the right balance of calm and play? Keep these as open questions for the next design pass; do not infer preferences from silence.

## User correction — preserve the side-scrolling layout

Josh explicitly rejected removal of the original side-scrolling scene and asked for essentially the same design with light tightening. Restored the original hero-to-project transition, name docking, shared crowd camera, tilted project covers and project-opening motion. Added Virgin Money and Home-Start to that same gallery; retained all six case studies and the 40-experiment playground. This preference supersedes the earlier decision to replace the pinned reveal with vertical editorial rows. Future passes should preserve the existing choreography unless Josh specifically asks to change it.

Josh clarified that the Virgin Money work has been handed in and is going into its app. Updated its public status to submitted app work, being taken forward for the app. Screenshots remain accurately described as early design stages; no release date or shipped metrics have been invented.

## Layout and interaction audit

Reviewed all eight routes at 320, 390, 768 and desktop widths. Also checked the gallery at 1024×600, 1024×768 and 1440×900. Preserved the original orange scene, oversized typography, cover tilts and side-scrolling transition.

Fixed mobile project-number edge clearance, short-laptop gallery alignment, screenshot-caption size and spacing, stacked the Virgin Money screenshots on phones, removed a duplicated Home-Start credit, enlarged mobile header targets, and kept the walking crowd out of project cards and captions. Adjusted gallery anchor navigation to complete the six-card transition and restore direct links on the vertical fallback.

Exercised the original 20 and the new 20 playground pieces. Checked form feedback, no-results search, undo, reorder, disclosures, timer reset/pause, audio start/stop, code-viewer layout, and a downloaded standalone orbit demo. Updated the small project-search experiment to include all six projects. Browser checks found no horizontal page overflow, missing images, or console errors in the final tested states. Internal assets, fragment targets, unique experiment IDs, PDF signatures and changed JavaScript syntax also passed.

Screenshots and responsive measurements are saved outside the published site in the task's outputs/portfolio/qa folder. This is browser-based QA at the tested sizes; it is not a claim of certification or identical behaviour in every browser/device.
