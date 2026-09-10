# Night Session — local delivery

Date: 2026-09-10.

Open [the personal garage preview](http://127.0.0.1:5173/?apercu=night), or [the regular application](http://127.0.0.1:5173/). Start it again with `npm run dev -- --host 127.0.0.1 --port 5173`.

## Delivered

The new racing-poster direction covers the startup, home, garage, equipment, account, rides, workshop, budget, forms, photo viewers and recap. Shared tokens, Barlow type, Lucide icons, responsive navigation and controls replace the pixel interface. The startup exists before React and exits as soon as the app is ready or storage fails; it does not add a fake delay.

The motorcycle, suit and helmet were redrawn from personal reference photographs using the built-in image generation tool, without Gemini. The outputs are integrated locally; generation itself was not on-device inference. Personal PNG/WebP files and their exact prompts are in `.local/night-session/`, excluded from Git. See [portrait prompts and reference limits](../.local/night-session/prompts.md). Hidden suit panels were reconstructed from track photos because the original standalone equipment photos were unavailable on this device.

Only the generic sunset artwork is public: [night-session.webp](../public/images/night-session.webp). Its creative brief was an original illustrated tropical paddock at sunset, a white/navy sport motorcycle on the right, palm trees and wet pavement, with dark negative space on the left for display type; refined ink contours and airbrushed early-2000s racing-game lighting, without game logos or copied screens.

Local image import is available for each motorcycle and equipment item: PNG/JPEG/WebP, preview, cancel, explicit save and persistence after reload. Dimensions are checked before decoding; images are resized and compressed in the browser. The source photo is retained. The old paid pixel generator remains separately labeled and collapsed in the regular application; it is unavailable in the private preview. No Gemini request was made.

## Verification

| Check | Result |
| --- | --- |
| TypeScript and production build | Passed |
| Existing unit tests | 160/160 |
| Existing Chromium browser suites | 29/29 have passing latest results; six affected suites rerun after corrections |
| Visual review | Two passes; second pass covers 28 states at 390/768/1440px, no horizontal overflow or page errors |
| Local image import | 12 format/size checks and equipment preview/cancel/save/reload flow passed; machine flow inspected separately |
| Private preview isolation | 8/8: separate SQLite and media namespaces, no Supabase client, original media intact, private files denied, no network writes |
| Lint | Command passed with warnings; this is not a claim of a warning-free repository |

The [browser report and screenshot index](../artifacts/night-session/qa/README.md) records individual attempts and screenshots. Personal artwork captures: [phone](../artifacts/night-session/garage-portraits-390.png), [tablet](../artifacts/night-session/garage-portraits-768.png), [desktop](../artifacts/night-session/garage-portraits-1440.png). Home: [phone](../artifacts/night-session/final-accueil-390.png), [desktop](../artifacts/night-session/final-accueil-1440.png). Isolation results: [JSON](../artifacts/night-session/preview-isolation.json).

## Boundaries

- This delivery is local. No deployment, commit, remote data write or replacement of the account's saved original portraits was performed.
- The private preview uses an independent database and media stores, is served only on loopback in Vite development, and creates no Supabase client. Its personal manifest and assets are not emitted by the production build. Importing an image in the regular authenticated app uses its normal data persistence and sync flow.
- Automated WebKit could not initialize SQLite/OPFS. Its storage failure screen was verified, but business routes have not been validated on Safari. Chromium responsive coverage does not substitute for a physical iPhone test.
- Vite reports a large main bundle, primarily the existing database/sync stack. Repository-wide design lint also reports legacy patterns; it is not a clean-baseline acceptance signal for this change.

## Existing libraries reviewed

- [Lucide React](https://lucide.dev/guide/react): one consistent scalable icon family, integrated.
- [Barlow](https://tribby.com/fonts/barlow/) and bundled Fontsource packages: local font assets for offline use, integrated.
- [Motion reduced-motion guidance](https://motion.dev/docs/react-use-reduced-motion): reviewed; native CSS and `prefers-reduced-motion` were sufficient, so no animation runtime was added.
- [Vite CSP guidance](https://vite.dev/guide/features.html#content-security-policy-csp): a development nonce permits React refresh while preview and production retain their CSP.

## Reproduce focused checks

```sh
npm run build
npm run essais:unite
npm run lint
node banc-rendu/fumee-import-illustration.mjs http://127.0.0.1:5173
node scripts/check-local-preview.mjs
node scripts/capture-night.mjs
```

The existing full browser runner expects port 4173. This session preserved unrelated servers on that port and used a temporary URL-only redirect to preview port 4317, as documented in the QA report.
