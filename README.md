# QR Fusion

QR Fusion is a frontend-only QR code generator. User-entered QR content is processed in the browser; no application backend is required.

[Open the live application](https://qrfusion.pages.dev/)

## Project structure

```text
qr-fusion/
├── index.html                    # Marketing landing page
├── generator.html                # QR generator markup and forms
├── assets/
│   └── favicon/                  # Icons and web-app manifest
├── css/
│   ├── style.css                 # App, controls, exports, responsive layout
│   └── landing.css               # Landing-page design and breakpoints
├── js/
│   ├── core/app.js               # QR payloads, routing, preview, downloads
│   ├── features/ui-features.js   # Presets, drafts, quality, SEO, PWA setup
│   ├── pages/landing.js          # Landing navigation and theme behavior
│   └── data/                     # Embedded PDF background/logo assets
├── service-worker.js             # Offline application shell and runtime cache
├── _redirects                    # Cloudflare Pages clean-URL rewrites
├── sitemap.xml                   # Search-engine URL discovery
└── robots.txt                    # Crawler rules
```

## Local development

Open the project with VS Code Live Server and start at `/`. Local generator navigation uses `/generator.html?type=...` because Live Server does not process Cloudflare Pages redirects. Production uses `/create` and clean routes such as `/wifi`, `/whatsapp`, and `/google-review`.

## Deployment

The production site is hosted on [Cloudflare Pages](https://qrfusion.pages.dev/). It is deployed directly from the repository root without a framework build step. The `_redirects` file maps public clean URLs to the generator page.

## Privacy notes

- Draft saving excludes Wi-Fi passwords, UPI details, and bank-account fields.
- PIN-code address lookup calls the external `api.postalpincode.in` service.
- Recent QR history is intentionally not implemented yet.
