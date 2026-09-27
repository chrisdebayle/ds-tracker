## Using this design system

This is the Chris Debayle brand identity system — "systematizing trust." It ships as **plain React components + one CSS file**, no theme provider, no CSS-in-JS.

### Setup

Import `styles.css` once at the root of whatever you're building — nothing else is required. There is no provider/wrapper component to reach for; tokens are plain `:root` CSS custom properties, already global the moment the stylesheet loads.

If a design needs the brand's signature device (a gradient bar down the left edge of the whole page or a major card), wrap that surface's content in `<SpineFrame>` — it renders the bar and insets its children with matching gutter padding. Don't reach for it on every card; it reads as the ONE memorable element per surface.

### Styling idiom: CSS custom properties, `--db-*`

Every component styles itself from tokens already defined in `styles.css` — never hardcode a hex value when composing with these components; reach for the token instead if you need custom styling alongside them.

**Two-ground rule**: tokens are paired per background, never shared. A light-ground token used on a dark card (or vice versa) will fail contrast. Match the family to the surface:

| Ground | Text/ink | Fill | Accent |
|---|---|---|---|
| Light (white/`--db-light`) | `--db-dark`, `--db-ink-soft`, `--db-muted` | `--db-paper`, `--db-light`, `--db-tint-blue`, `--db-tint-warm` | `--db-primary`, `--db-accent-700`/`--db-accent-800` |
| Dark (`--db-card-dark`/`--db-ground`) | `--db-ink-head`, `--db-ink-body`, `--db-ink-2`, `--db-muted-2` | `--db-card-dark`, `--db-ground` | `--db-accent`, `--db-link-dark` |

Structure tokens: `--db-line` (borders on light), `--db-hair-2`/`--db-hair-3` (borders on dark), `--db-radius` (6px, all cards), `--db-spine-w`. Status: `--db-pass` (green) / `--db-fail` (red), used by `ColorTable`'s ratio column. Type: `--db-font-display` (Space Grotesk, headings/labels only) and `--db-font-body` (Inter, everything else) — never cross them.

### Where the truth lives

`styles.css` is the single stylesheet — read it directly for the full token list and every component class before inventing new styling. Each component's own doc (bundled per-component) has its exact prop shape; trust that over guessing from the name.

### Composition pattern

Components are prop/children-driven, not pre-filled with Chris's copy — pass real content every time. A typical page:

```tsx
<SpineFrame>
  <Hero
    eyebrow="Brand Identity System"
    title="Chris" titleAccent="Debayle"
    tagline="Systematizing trust."
    deck="…"
  />
  <Section number="01" label="ESSENCE" title="The one idea underneath everything">
    <Callout ground="light" source="…">Character is practiced daily, not inherited.</Callout>
    <StanceGrid forItems={[…]} againstItems={[…]} />
  </Section>
</SpineFrame>
```

### Hard rules (don't relax these)

- **One `Callout` per surface.** Repeating it cancels the emphasis — reach for `DemoDark` or unboxed display-font text for a second moment.
- Never mix `--db-font-display` into body copy or `--db-font-body` into headings.
- `InternalBadge` / `TraitMap`'s `internal` prop marks content that must never appear on a public-facing design — if a design agent sees it, treat the surrounding copy as reference-only, not publishable.
- No em dashes in generated body copy; typographic (curly) apostrophes only — this brand's voice rule, not a component constraint, but designs using this system should still honor it.

# ChrisDebayleBrandComponents (@chrisdebayle/brand-components@0.1.0)

This design system is the published @chrisdebayle/brand-components React library, bundled as a single
browser global. All 25 components are the real upstream code.

## Where things are

- `_ds_bundle.js` — the whole-DS bundle at the project root; loads every component to `window.ChrisDebayleBrandComponents`. First line is a `/* @ds-bundle: … */` metadata header.
- `styles.css` — the single stylesheet entry: it `@import`s the tokens, fonts, and component styles (`_ds_bundle.css`). Link this one file.
- `components/<group>/<Name>/<Name>.prompt.md` (example JSX + variants), `<Name>.d.ts` (types), `<Name>.html` (variant grid).
- `tokens/*.css` — CSS custom properties, names verbatim from upstream.
- `fonts/` — `@font-face` files + `fonts.css` (when the package ships fonts).

For a specific component, `read_file("components/<group>/<Name>/<Name>.prompt.md")`.

## Loading

Add these two lines to your page once (React must be on the page first):

```html
<link rel="stylesheet" href="styles.css">
<script src="_ds_bundle.js"></script>
```

Components are then available at `window.ChrisDebayleBrandComponents.*`. Mount into a dedicated child node (e.g. `<div id="ds-root">`), not the host page's own React root, so the two trees don't collide:

```jsx
const { Callout } = window.ChrisDebayleBrandComponents;
ReactDOM.createRoot(document.getElementById('ds-root')).render(<Callout />);
```

## Tokens

32 CSS custom properties from @chrisdebayle/brand-components. Names are
preserved verbatim from upstream. They are declared inside `_ds_bundle.css` (this DS ships one compiled stylesheet rather than separate token files).

- **typography** (2): `--db-font-display`, `--db-font-body`
- **radius** (1): `--db-radius`
- **other** (29): `--db-primary`, `--db-accent`, `--db-accent-700`, …

## Components

### general
- `Callout` — The brand's one emphasis container: a 3px accent left rule around a
- `Changelog` — A dated changelog list  the running record that a document is a living reference, not a finished one.
- `ColorTable` — A token / job / contrast-ratio audit table  the artifact that makes a
- `DataTable` — A generic N-column data table: a primary-colored header row over plain
- `DemoDark` — A dark-ground demo card: a display-font lede over body copy, with an
- `DoDontGrid` — Two-column Do / Don't voice-and-usage guidance, each item with an optional worked example.
- `Enemy` — A permanently dark-ground labeled block for naming what the brand stands
- `Footer` — The closing block: a primary-colored top rule, contact links, an optional signature line, and room for a Changelog.
- `Hero` — The document/page header: eyebrow, title, spine-line tagline, deck copy,
- `InternalBadge` — A small red flag marking content that must never appear on a public-facing surface.
- `Lines` — A chevron-marked list  the brand's typographic substitute for iconography, used for anchor lines and proof stacks.
- `MilestoneTable` — A three-column table pattern for a staged model  a single mark, what the
- `Rail` — The rail: the brand's Spine device unrolled horizontally across N stages,
- `RulesList` — A checklist-style list of rules or guidance, with a 'hard' variant for non-negotiable ones.
- `Section` — The scaffold every content section shares: a numbered eyebrow label, a
- `SpineFrame` — The brand's signature device: a blue-to-accent gradient bar running the
- `StanceGrid` — A two-column stands for / stands against comparison. A position without
- `StepLadder` — A small horizontal progress ladder: a sequence of pill steps joined by
- `Steps` — A numbered sequence of instructions  bold numerals mark order, per the
- `Swatch` — A single color chip with its role and hex value. Compose inside SwatchGrid.
- `SwatchGrid` — A responsive grid wrapper for Swatch chips.
- `TraitMap` — Maps abstract traits to concrete behavior  how a temperament or value
- `TypeSpec` — A type specimen table: one row per role (display, body, ) showing the
- `VerbalBlock` — A labeled card for one ready-to-use piece of verbal identity (a tagline,
- `VerbalBlockGrid` — Gap-spaced stack for VerbalBlock cards.
