# QR Fusion

QR Fusion is a frontend-only QR code generator. User-entered QR content is processed in the browser; no application backend is required.

## Project structure

```text
qr-fushion/
├── index.html                    # Marketing landing page
├── generator.html                # QR generator markup and forms
├── assets/
│   └── favicon/                  # Icons and web-app manifest
├── css/
│   ├── style.css                 # App, controls, exports, responsive layout
│   ├── about.css                 # Informational and SEO content sections
│   └── landing.css               # Landing-page design and breakpoints
├── js/
│   ├── core/app.js               # QR payloads, routing, preview, downloads
│   ├── features/ui-features.js   # Presets, drafts, quality, SEO, PWA setup
│   ├── pages/landing.js          # Landing navigation and theme behavior
│   └── data/                     # Embedded PDF background/logo assets
├── text-files/                   # Source text for embedded visual data
├── service-worker.js             # Offline application shell and runtime cache
├── _redirects                    # Netlify clean-URL rewrites
├── sitemap.xml                   # Search-engine URL discovery
└── robots.txt                    # Crawler rules
```

## Local development

Open the project with VS Code Live Server and start at `/`. Local generator navigation uses `/generator.html?type=...` because Live Server does not process Netlify redirects. Production uses `/create` and clean routes such as `/wifi`, `/whatsapp`, and `/google-review`.

## Privacy notes

- Draft saving excludes Wi-Fi passwords, UPI details, and bank-account fields.
- PIN-code address lookup calls the external `api.postalpincode.in` service.
- Recent QR history is intentionally not implemented yet.
