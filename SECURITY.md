# Security

This is a static Next.js (App Router) portfolio deployed on Vercel. It has no
backend, API routes, database, auth, forms, or user input, so the classic web
attack surface (SQLi, XSS, auth bypass, RCE, CSRF) effectively does not exist —
a visitor's browser only runs the self-contained static bundle.

The risks that actually matter here are about account hygiene and supply chain,
not the application code.

## In-repo measures (already applied)

- **HTTP security headers** in `next.config.ts` — a pragmatic Content-Security-
  Policy plus `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy`, `Permissions-Policy`, and HSTS. These add defense-in-depth
  and block clickjacking / external script injection.
- **No secrets in the client**; `.env*` is gitignored.

## Checklist (account / process — do these yourself)

- [ ] **Enable 2FA** on GitHub, Vercel, and the Google account behind the
      project email. Prefer an authenticator app or passkey over SMS.
- [ ] Use a **password manager** with unique, strong passwords for each.
- [ ] Turn on **GitHub branch protection** for `main`; review Vercel's
      production-branch and deployment-protection settings.
- [ ] If using a custom domain: enable **registrar lock + 2FA** at the registrar
      (domain hijacking is the main DNS-level risk).
- [ ] Keep dependencies current and review `npm audit` periodically. Consider
      enabling **Dependabot** for automated update PRs.
- [ ] Never commit secrets. If an API key is ever needed, store it as a **Vercel
      environment variable** (server-side) — never `NEXT_PUBLIC_` or in client
      code.

## Notes

- **Do NOT run `npm audit fix --force`.** The current moderate `postcss` advisory
  is transitive via Next and build-time only (not visitor-facing); `--force`
  would try to downgrade Next to v9.x and break the project. It resolves when
  Next bumps its bundled postcss.
- If you later add Vercel Analytics, an external font, or any third-party script,
  widen the CSP `script-src` / `connect-src` / `font-src` in `next.config.ts` to
  include those domains.

## Reporting

Found a security issue? Email almeidacolton87@gmail.com.
