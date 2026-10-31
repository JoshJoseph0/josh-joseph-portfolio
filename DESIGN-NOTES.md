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


## Scrollcraft refinement — 30 October 2026

Preserved the side-scrolling scene, oversized name docking, shared crowd and tilted project shelf. Added a live practice description and explicit project link, fading that small introduction during the existing scene transition. Crowd pathfinding now reserves that text area. Added a thin reading-progress line, larger phone captions, a three-column natural-flow gallery for 901–1199px laptops, and focus transfer for desktop scene anchors. The home link now appears when reached by keyboard before the name docks.

Visual checks used browser iframe viewports at 1440×900, 1024×768 and 390×844, plus the browser's ordinary viewport. Checked the opening, an intermediate scene frame, project destination, paused-motion fallback and keyboard home-link focus. Pausing motion disables the pinned scene; restoring it re-enables the existing choreography. Homepage local references (57) resolve, and changed JavaScript passes syntax checks. Browser iframe checks are not physical-device testing or a full audit of the unchanged playground/case-study interactions. No new media or paid dependencies.

## Motion continuity - 31 October 2026

Preserved the palette, Anton/Barlow Condensed, content, six projects, people, cover tilts and hero-to-gallery scene. The second name line now loses its hero indent during docking, matching the actual header alignment. Wheel smoothing settles sooner (.12 interpolation, .9 wheel multiplier); cover feedback settles in .18s and returns in .24s. Removed the page-wide GSAP lag-smoothing override. Cover offsets clear immediately on keyboard focus, motion preference and pointer-capability changes. Reduced motion also cancels an in-flight project opening. Hidden tabs suspend Lenis; returning resumes it. Same-page scene links now also validate origin and query.

References: existing live site and notes remain the visual target; Refero bundled motion guidance supplies continuity, shorter feedback and interruptibility. Scrollcraft verification guidance informs intermediate-frame, reverse-scroll and fallback checks. No new visual direction or media.

QA: Chrome desktop 1440x900 at opening, 25/50/75/100% of the pinned scene, then reverse to 50% and opening. Docked name lines align within .001px. Project opening and browser Back restore the page without an overlay. Keyboard navigation removes the pin and reaches project links; dynamic reduced motion clears hover offsets and removes the pin. Checked 320x700, 390x844, 1024x768 and desktop reduced motion; six cards, loaded images, no horizontal page overflow or JavaScript errors. Screenshots and test results are kept outside the published repository. These are browser checks, not physical-phone testing.

## Genjutsu follow-up - 31 October 2026

Used AThevon/genjutsu at 1f518a71378b15d423389e546e767cffc86e14c3 as an audit of the established direction. Modules read: design-audit, motion-principles, gsap, canvas-generative and mobile-principles. No new interaction concept, design system, dependency or visual effect.

Fixed invisible hero controls remaining interactive after their opacity reaches zero. They become inert only while faded out in the horizontal scene, and restore on reverse scroll or scene teardown. The walking canvas now uses its pending animation frame instead of repainting again for each scene-update event; paused people still redraw as the camera moves.

In the same one-second desktop wheel-scroll probe, canvas paints changed from 226 over 99 browser animation frames to 99 over 99 frames (about 56% fewer paints). This measures duplicate work, not a guaranteed frame rate or a physical-device benchmark. Kept all six projects, content, typography, colours and choreography.

Verified paused crowd camera movement, faded control inertness and reverse-scroll restoration; repeated desktop intermediate frames, project navigation/Back/Escape, resize, pause toggle, keyboard and reduced-motion checks, plus touch-emulated 320/390px and 1024px layouts. No JavaScript errors, missing images or page overflow in those checks. Physical phones and a full DevTools/GPU trace remain unverified.
