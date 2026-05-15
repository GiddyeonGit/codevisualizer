---
name: front-end
description: >
  Build scalable, modular, and reusable front-end UIs using Feature-Sliced Design (FSD),
  design tokens, layered component architecture, and a professional theme system.
  Use when: (1) scaffolding or building React/Next.js/Vite frontend projects,
  (2) generating or refactoring design systems and component libraries,
  (3) applying design tokens, theming, or responsive patterns,
  (4) structuring frontend code with FSD (features, entities, shared, pages, app),
  (5) creating presentational/container components, compound components, or headless hooks,
  (6) outputting CLI-style logs or simulated design-tool commands (ds extract, ds scaffold, ds build).
---

# Front-End Design System Skill

## Quick Reference

| Layer | Location | Responsibility | Example |
|-------|----------|----------------|---------|
| Base | `shared/ui` | Atomic primitives | `Button`, `Input`, `Text` |
| Composed | `shared/ui` | Combined bases, no business logic | `Card`, `Modal`, `FormField` |
| Feature | `features/*` | Domain logic, API, state | `PaymentForm`, `UserMenu` |
| Page | `pages/*` | Route orchestration | `CheckoutPage` |

## Hard Rules (Enforce Always)

1. **Public API per slice**: Every slice exports via `index.ts`; everything else is private.
2. **Downward imports only**: `pages → features → entities → shared`. No upward or sideways imports.
3. **Features never import each other**: Communicate via events, shared context, or global state.
4. **Single Responsibility**: One reason to change, one job per component.
5. **Tokens are source of truth**: All visual properties derive from `design-tokens.json`.

## FSD Directory Structure

```
src/
├── app/          # providers, layouts, routes
├── pages/        # route entry points
├── features/     # domain slices (auth, cart, payment)
├── entities/     # business models (user, product, order)
├── shared/       # ui, lib, api, config
├── styles/       # tokens.css, globals.css
└── public/       # static assets
```

## Design Tokens

- Live in `design-tokens.json` (W3C DTCG format).
- Compile to CSS custom properties in `:root` and `[data-theme="dark"]`.
- Naming: dot-separated kebab-case (e.g., `color.bg.brand`, `spacing.xl`).
- See [references/design-tokens.md](references/design-tokens.md) for full token schema and CSS output examples.

## Component Patterns

- **Presentational / Container split**: Presentational = props + callbacks; Container = state + effects.
- **Compound Components**: Static sub-components sharing implicit context (e.g., `<Tabs.List>`, `<Tabs.Panel>`).
- **Headless Components**: Behavior hooks (`useSelect`, `useCombobox`) without markup.
- **Adapter Pattern**: Wrap third-party SDKs behind a consistent internal interface.
- See [references/component-layers.md](references/component-layers.md) for layer details and mandatory patterns.

## Theme System

- `ThemeProvider` injects tokens as CSS custom properties on `<html>`.
- Switch themes via `data-theme` attribute on `<html>`.
- `useTheme()` returns `{ theme, setTheme, tokens }` and supports runtime overrides.
- Breakpoints (mobile-first): `sm: 320px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`.
- Use `useResponsiveValue(values, breakpoints)` for responsive tokens.
- See [references/theme-system.md](references/theme-system.md) for provider and hook implementations.

## CLI Simulation (`ds`)

The AI simulates a design-system CLI with these commands:

- `ds extract <url> --mode ultra` — Simulate analyzing a website and extracting its design system.
- `ds scaffold <project-name> --template <nextjs|vite>` — Simulate bootstrapping an FSD project.
- `ds build` — Simulate compiling tokens and components.

All CLI output must use the structured logging format from [references/cli-spec.md](references/cli-spec.md).
The logging utility is available at [scripts/logger.js](scripts/logger.js).

## Asset References

- **FSD deep-dive**: [references/fsd-architecture.md](references/fsd-architecture.md)
- **Design tokens**: [references/design-tokens.md](references/design-tokens.md)
- **Component layers**: [references/component-layers.md](references/component-layers.md)
- **Theme system**: [references/theme-system.md](references/theme-system.md)
- **CLI spec & logging**: [references/cli-spec.md](references/cli-spec.md)
- **Logger script**: [scripts/logger.js](scripts/logger.js)
