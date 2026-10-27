<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# TasteCode Design System & Frontend Guidelines (Antigravity)

This project strictly adheres to **TasteCode Design Agent standards** (`https://github.com/Leonxlnx/tastecode`). All coding agents and contributors must preserve these invariants:

## 1. One Design Language
- **One palette**: Use semantic CSS tokens defined in `globals.css` (`--canvas`, `--surface`, `--surface-raised`, `--surface-alt`, `--text`, `--text-muted`, `--accent`, `--on-accent`, `--divider`, `--control-border`, `--focus-ring`).
- **One typography pairing**: At most two OFL families: `Bricolage Grotesque` (`--font-sans` / `--font-heading`) for interface & headings + `JetBrains Mono` (`--font-mono` with `tabular-nums`) for scores, timers, and statistics.
- **One radius scale**: Standardized on `--radius-sm` (8px), `--radius-md` (12px), `--radius-lg` (18px), `--radius-xl` (24px), `--radius-pill` (9999px).

## 2. Hard Anti-Slop Rules
- **No Card Rails**: Never add colored vertical border rails (`border-l-4 ...`), inset pseudo-element strips, or one-sided accent borders on cards.
- **No Monospace Micro-Label Slop**: Never clutter the interface with endless tiny uppercase spaced labels.
- **No Unmanifested SVG Substitutes**: Never draw fake waveform charts, mock schemas, or abstract SVGs to fill space. Use established icon libraries (Lucide) and real domain components.
- **No Cards-Inside-Cards Nesting**: Avoid 3+ levels of card nesting. Use subtle tonal shifts or 1px dividers.
- **Interactive Targets**: Every interactive element must satisfy a minimum 44×44px hit-area on touch viewports.

## 3. Motion & Micro-Interactions
- Use the TasteCode native reveal lifecycle (`src/lib/reveal.ts` and `[data-reveal]`).
- Crisp, tactile feedback: 120–180ms ease-out on buttons (`btn-tactile active:scale-97`), never `transition: all`.
- Respect `prefers-reduced-motion` unconditionally.
