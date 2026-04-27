# DESIGN.md — Creative Identity Document

<!-- GOVERNANCE
     This file is owned by the human. Sections marked HUMAN-AUTHORED
     are filled in by you, ideally before the first build session, or
     collaboratively with an AI assistant in a dedicated conversation.
     Sections marked AGENT-PROPOSED are populated by the agent during
     sessions and confirmed by you — the same pattern as MEMORY.md.

     The agent reads this file at every session start.
     The agent never asks design questions out of sequence:
       1. References must exist before Derived Identity is attempted.
       2. Derived Identity must exist before Declared Preferences are prompted.
       3. Observed Taste is queued during sessions and proposed at session end.

     If this file is empty or incomplete, the agent asks for References
     before any other design question. It never asks for Declared
     Preferences first. -->

---

## References
<!-- HUMAN-AUTHORED -->

- **Admired applications or websites:**
  - https://cfornesa.com — personal site; cozy iMac workspace metaphor; retro-modern
    hybrid; flat 2D CSS geometry; neo-brutalist hard offset shadows; system-UI type stack
  - https://creatrweb.com — framework as philosophy; human ownership embedded in
    structure; argument made visible through design
  - https://open.creatrweb.com — bombastic open-canvas identity; asymmetric layouts;
    tri-color primary scheme; abstract visual elements as argument, not decoration
  - https://nekoweb.org — candid tinkerer's voice; texture and deliberate imperfection
  - https://neocities.org — personal web spirit; individual ownership over generic platform

- **Admired art, design work, or visual culture:**
  - https://fornesusart.com — abstract, emotionally driven work across painting, drawing,
    mixed media, photography, and digital art; introspective and visionary;
    "Open your mind" as tonal anchor; chromatic and emotionally varied; abstract-first

- **Admired writing or editorial voice:**
  - https://fornesus.blog — first-person, present tense, unguarded and reflective without
    being performative; direct without polish; intimate but never indulgent; weight comes
    from honesty, not from asking for sympathy

- **Logo:** TBD

- **Existing brand materials:**
  - Visual identity draws from fornesusart.com color range: emotionally varied, chromatic,
    abstract-first. No logo SVG, type specimen, or color swatch file committed yet.

---

## Derived Identity
<!-- AGENT-PROPOSED, HUMAN-CONFIRMED
     Confirmed by owner, 2026-04-23. -->

This application is a working atelier — a dark, purposeful creative environment built
for making, not for impressing. The user is handed an instrument, not onboarded into
a product. Visual and tonal decisions are traceable to a specific person's specific
practice, not to a generic generative art tool category.

- **What the references share:** A designed environment that belongs to a specific person.
  Whether the cozy iMac workspace of creatrweb.com or the expressive open canvas of
  open.creatrweb.com, the user always feels like they are entering *someone's* space.
  Here, the user sits down at a working atelier — a tool built for making, not for
  impressing. The emotional range of fornesusart.com (introspective, visionary,
  chromatic) anchors the palette and the ambient mood.

- **The tension being navigated:** The generative canvas must be the hero without making
  the controls feel like an afterthought. The workstation metaphor keeps controls feeling
  intentional and physical — instruments in a studio — rather than a UI feature checklist.

- **What must be refused:** Light-themed generic art tool aesthetics. SaaS softness.
  Rounded-corner-everything. Gradients used decoratively. Stock photography. Any UI
  choice that could belong to a Figma plugin or a no-code product page. Anything that
  could have been produced by a generic AI without a specific human author behind it.

- **The feeling on first load:** Ease and invitation. A dark atelier, ready for work.
  The canvas glows. The user is not being onboarded — they are being handed an instrument.

---

## Declared Preferences
<!-- HUMAN-AUTHORED, after Derived Identity is complete. -->

- **Color direction:**
  Dark atelier palette. Ground: deep warm near-black (`#1c1814`). Panel/control
  surfaces: slightly lighter warm dark (`#242018`). Canvas area: pure black (`#0d0d0d`)
  so generated artwork glows against it. Accent trio drawn from fornesusart.com
  emotional range:
    - Gold/amber accent: `#c9922a` (warm, anchoring)
    - Slate-teal accent: `#4a8fa8` (cool contrast)
    - Off-white text: `#f0ece4` (warm, readable against dark ground)
  Hard offset shadows: `4px 4px 0px` in gold or teal depending on context.
  No gradients on UI surfaces. No soft drop shadows.

- **Type direction:**
  System-UI stack for all UI and body copy (`system-ui, -apple-system, BlinkMacSystemFont`).
  Courier New / monospace for data readouts, column labels, metadata, and any value
  that needs to read as machine-output or instrument feedback.
  No web fonts loaded — no external network requests for type, no FOUT.

- **Layout disposition:**
  Canvas-centered. The generative canvas occupies the dominant visual zone — all
  controls, panels, and toolbars are secondary instruments arranged around it.
  Desktop: side panel(s) for controls, canvas as hero. Mobile: canvas full-width,
  controls in a collapsible bottom sheet. No generic responsive grid collapse —
  mobile gets a deliberate layout of its own.

- **Motion and interaction:**
  No decorative animation. Transitions only where they carry meaning: panel open/close,
  canvas state change, control hover elevation. Standard duration: 0.2s ease.
  Canvas rendering animation is intentional and user-triggered — not ambient or
  auto-playing.

- **What must never appear:**
  Gradients on UI surfaces (canvas rendering output is exempt — user controls that).
  Stock photography. Blur-heavy sections. Soft drop shadows. Icon libraries
  (Unicode symbols preferred). Auto-playing media. Emoji as ornament. Any visual
  language that signals "SaaS product" rather than "personal creative tool."

---

## Observed Taste
<!-- AGENT-PROPOSED, HUMAN-CONFIRMED
     Populated during sessions when the agent notices a signal. -->

2026-04-23 · DIRECTION · Chose dark atelier ground over light studio daylight explicitly
    because most generative art tools default to light — distinctiveness as a deliberate
    design value, not just aesthetic preference.
    [User: "a dark atelier at night would be more unique compared to most light-themed
    artistic websites."]

2026-04-23 · INFLUENCE · fornesusart.com anchors the palette — emotionally varied,
    chromatic, abstract-first — rather than inheriting directly from either prior project.
    [User: "the fornesusart.com color scheme may be more varied, which is what I envision
    for this application."]

2026-04-23 · TENSION · Canvas must glow as the hero; controls must feel like instruments,
    not a feature list. Workstation metaphor holds both in tension without either dominating
    the other inappropriately.

2026-04-23 · REFUSAL · Actively resists any visual outcome that could belong to a generic
    generative art tool, Figma plugin, or no-code product page — authenticity traceable
    to a specific person's practice is non-negotiable.

2026-04-23 · VOICE · The user is handed an instrument, not onboarded into a product.
    Ease and invitation are the emotional targets on first load — comfort without
    condescension.

---

<!-- The agent holds the brush. You choose what gets painted.
     This document is how you tell the agent what you see. -->