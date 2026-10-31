# Scrollcraft refinement — 30 October 2026

Audience: employers and collaborators exploring Josh's interaction design and creative computing work. Main action: open a case study, then download a CV or get in touch.

Josh delegated scrolling, motion and visual presentation improvements. Preserve all project content, the existing side-scroll, name docking, walking people, cover tilts and cream/orange/green/yellow identity. The existing site is the direct-build visual target; its DESIGN-NOTES.md records the explicit preference for this choreography.

Experience: a playful personal introduction becomes a shelf of real projects, followed by a calm account of the practice and an easy invitation to talk.

## Journey and feeling curve

| Beat | Feeling / cause | Device | Fallback |
| --- | --- | --- | --- |
| Introduction | Curiosity: oversized name and tiny inhabitants | Live canvas | Existing pause control and static motion preference |
| Work reveal | Delight: name docks while orange becomes the gallery | Existing pinned sideways reveal, one scrub | Native vertical flow on smaller screens or reduced motion |
| Projects | Confidence: six named projects with real evidence | Cover depth on hover | Stable links for touch and keyboard |
| About and CVs | Clarity: quieter text and clear next actions | Natural flow, restrained one-time heading reveal | Content visible without animation |
| Playground | Playfulness: invitation to hands-on experiments | Existing arrow response | Ordinary link |
| Contact | Resolve: direct email, copy action and CVs | Still closing composition | Native links |

## Reference lock and decisions

Grammar: gallery. Signature: the existing inhabitants share a floor as the name docks and the orange disc becomes the project surface. This is a refinement, not a new template; retain its fingerprint.

Primary reference: the current public portfolio and repository design notes. Secondary guidance: Scrollcraft's feel, uniqueness, taste and verify references from its upstream repository. Refero style search was attempted but returned NO_SUBSCRIPTION; no subscription or paid assets were purchased.

Keep Anton display and Barlow Condensed text, ink on paper, orange gallery, green/yellow hero accents and individual project-cover colours. Add an explicit practice description and work link; keep moving artwork behind live controls. Give smaller laptops a readable three-column gallery in natural flow. Keep the original desktop side-scroll above that breakpoint. Make in-page keyboard destinations receive focus, and keep the hero home link focusable even before docking. Add a quiet reading line to orient the longer vertical route.

Do not introduce video, new claims, stock imagery, extra scroll scenes, a second smoothing engine or a replacement renderer. The existing GSAP system already implements the signature, so another engine would compete with it.

## Motion continuity pass - 31 October 2026

Keep the existing reference lock and six-project journey. Changes serve continuity and feedback: align the second name line with the header as it docks; reduce wheel lag and cover response time; immediately clear cover offsets for keyboard or motion-preference changes; suspend smoothing in hidden tabs and reconcile pointer capability changes. Keep native touch scrolling and the existing static reduced-motion route. No new renderer, assets, effects or design tokens.

The requested threejs-animation plugin was checked in the available tools, local plugin cache and plugin search; no matching plugin was available. Continue with the established GSAP system within Josh's authorised animation scope.

## Approved project selection revision - 31 October 2026

Josh chose A (Pull & peek), asking for a more modern card and people attracted to the mouse. Keep the established orange shelf, tilted covers, two fonts, six projects, name docking and horizontal handoff. Refine the card to an 8px edge, flatter perspective and a quieter shadow; move the existing index into the caption. A 320ms cover lift reveals a concise project note. Keep ordinary one-click case-study links, add an explicit touch peek control, support keyboard focus and static reduced motion. Six Million gets a quiet detail fade instead of a playful lift. Reserve space above the covers so the interaction never collides with the heading.

The existing crowd will gently route nearby walkers toward individually spaced points around the mouse, respecting obstacles, personal space, sitting, phone breaks and pickup. Stop attracting when the pointer leaves, enters a control, the scene scrolls away, motion is paused, or reduced motion is enabled. No new libraries, cursor replacement, confetti or sound.
