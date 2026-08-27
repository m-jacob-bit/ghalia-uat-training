# Ghalia UAT Training

A mock UAT (User Acceptance Testing) assessment system for **Ghalia** (مشروع ابنتي الغالية / Valuable Girl Project), Coptic Orphans' internal system. Built from real screen recordings of the production UAT so each role's mock screens, fields, dropdowns, and validation messages match the real thing.

Trainees are given a short scenario per task, perform it in a clickable mock of the real screens, and are graded automatically on data accuracy, correct record selection, correct workflow action, and successful completion — not just navigation.

## Live pages

- **Manuals:** [`docs/coordinator-manual.html`](docs/coordinator-manual.html) (for the coordinator) · [`docs/trainee-cda.html`](docs/trainee-cda.html) (CDA Staff trainees) · [`docs/trainee-fc.html`](docs/trainee-fc.html) (FC trainees) · [`docs/trainee-apm.html`](docs/trainee-apm.html) (APM trainees)
- **Apps:** [`apps/cda-staff/`](apps/cda-staff/) (ready) · [`apps/fc/`](apps/fc/) (ready) · [`apps/apm/`](apps/apm/) (ready) · `apps/bs/` (planned)

Everything above is live at **https://m-jacob-bit.github.io/ghalia-uat-training/** — see the root `index.html` for a linked landing page.

## The approval cycle

```
Big Sister (BS) → CDA Staff → FC (approve / return / reject) → APM (approve / return / reject) → [head office, out of scope]
```

FC can also originate its own requests (association work-team management) that go straight to APM, skipping CDA Staff. Each role's mock missions reflect this — an FC mission reviews a request a CDA Staff trainee would have submitted; an APM mission reviews a request FC already validated.

## Setup

- [x] Google Form connected to all three live assessments for collecting trainee names and result summaries.
- [x] GitHub Pages enabled (branch `main`, folder `/`).

## Repo layout

```
apps/<role>/index.html   — the mock UAT app for one role (self-contained, no build step)
docs/                     — manuals (coordinator + per-role trainee sheets)
index.html                — landing page linking everything
```

No build step, no dependencies — every HTML file is self-contained (inline CSS/JS, Google Fonts via CDN link). Edit directly and push.
