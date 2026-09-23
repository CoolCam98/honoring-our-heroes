# Honoring Our Heroes — site notes

Plain HTML/CSS static site, deployed on Netlify (forms via Netlify Forms). Rebuild of an older single-page site; keep its navy/cream/gold/red theme.

## Goals
- Advertise the annual luncheon. Make it obvious how a veteran attends (tickets are free, picked up in person — no online sign-up) and how a sponsor gives.
- Home page must explain the organization and event within ~10 seconds.
- Tickets: free for veterans + 1 guest; $20 for anyone else (sold at the same pickup locations). Picked up in person starting Sept 14; none at the door.
- Welcome Home Vietnam Veterans (Mar 29) is not being promoted — leave it off the site for now.
- Event is hosted in Plant City but open to all veterans — don't say "Plant City's veterans".

## Accessibility (required on every page)
- WCAG 2.1 AA contrast. On cream backgrounds use `--gold-deep`, never `--gold` (fails at 1.97:1). `.btn-outline` is for navy backgrounds only.
- One `h1` per page; headings in order; each `section` has `aria-labelledby` pointing to its heading.
- Text ≥ 0.875rem; buttons/tap targets ≥ 44–48px; links say where they go.
- Every image gets meaningful `alt` (empty `alt=""` only if decorative). Placeholders use `role="img"` + `aria-label`.
- Check with axe-core (0 violations) at 1440px and 390px, no horizontal scroll.

## Structure
- Header and footer are copied into every page — keep them identical (only `aria-current="page"` moves).
- Pages: `/`, `/about/` (+ `/about/friends/`, `/about/partners/`), `/events/`, `/gallery/`, `/contact/`, `/support/` (+ `/support/sponsor/`, `/support/donate/`, `/support/volunteer/`).
- Footer: HOH logo, "Presented by Judy & Ed Wise", Veterans Crisis Line, © + "Website by Premium Media". No nav links in footer.
- Missing links/images are marked `TODO` in comments.
