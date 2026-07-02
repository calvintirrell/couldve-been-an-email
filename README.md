# Could've Been an Email

Survive the meeting. A real-time attention-management game where the transcript
scrolls live, the 30-minute timer goes **up**, and your job is to reach
adjournment with zero action items and as few words spoken as possible.

Manage **Focus** (drains while you pay attention), keep **Visibility** in the
Goldilocks zone (too quiet and the boss notices; too engaged and the action
items find you), nod at the right moments, survive the called-on quizzes, and
deploy "let's take this offline" only when you must — everyone hears it.

**Play it: <https://calvintirrell.github.io/couldve-been-an-email/>**

## Development

```bash
npm install
npm run dev      # local dev server
npm test         # run the test suite
npm run build    # production build to dist/
npm run preview  # serve the production build locally
```

## Stack

- [React 19](https://react.dev/) + [Vite 6](https://vite.dev/) with
  `base: /couldve-been-an-email/` for GitHub Pages
- [Tailwind CSS 4](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) + React Testing Library

## Deployment

Every push to `main` runs the test suite, builds, and deploys to GitHub Pages
via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). The repo's
Pages source is set to "GitHub Actions".
