# WCAG 2.2 AA Accessibility Plan (NFR-006)

## Target Standard
WCAG 2.2 Level AA compliance for all client-facing UI components.

## Checklist

### Perceivable
- [ ] All images have descriptive `alt` text
- [ ] Color contrast ratio >= 4.5:1 for normal text, >= 3:1 for large text
- [ ] Content is readable at 200% zoom
- [ ] No information conveyed by color alone

### Operable
- [ ] All interactive elements are keyboard accessible
- [ ] Focus order follows logical reading order
- [ ] Focus indicators are visible (min 2px outline)
- [ ] No keyboard traps
- [ ] Skip navigation link provided
- [ ] Sufficient time for timed interactions (or ability to extend)

### Understandable
- [ ] Language of page declared (`lang="en-GB"` / `lang="pt-PT"`)
- [ ] Form inputs have associated labels
- [ ] Error messages identify the field and describe the error
- [ ] Consistent navigation across pages

### Robust
- [ ] Valid HTML markup
- [ ] ARIA roles, states, and properties used correctly
- [ ] Custom components expose correct ARIA semantics

## Required ARIA Labels
- Navigation: `aria-label="Main navigation"`
- Matter workspace: `aria-label="Matter workspace"`
- Forms: Each input has `aria-describedby` for help text
- Alerts: `role="alert"` for validation errors
- Modals: `role="dialog"` with `aria-modal="true"`

## Keyboard Navigation
- Tab: move between interactive elements
- Enter/Space: activate buttons and links
- Escape: close modals and dropdowns
- Arrow keys: navigate within components (tabs, menus)

## Testing Integration
- Integrate `axe-core` into CI pipeline via `@axe-core/react` or `jest-axe`
- Run `npx axe` checks on each PR
- Manual screen reader testing with NVDA/VoiceOver quarterly
