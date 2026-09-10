# Garage Studio — local verification

Date: 2026-09-10. This report supersedes the first Night Session visual pass.

Open [the isolated personal garage preview](http://127.0.0.1:5173/?apercu=night), or [the regular application](http://127.0.0.1:5173/). Start development with `npm run dev -- --host 127.0.0.1 --port 5173`.

## Implemented locally

The user's revised direction is a restrained native iOS interface: black, charcoal, gray and white, platform system typography (SF on Apple devices), rounded controls, Lucide icons and consistent spacing. Decorative pink/mint accents and racing display fonts have been removed from the active theme. Red remains for errors/destructive actions and amber for actual warnings or slower timing deltas. Original artwork retains its colors.

Shared components cover home, garage, equipment, account, rides, workshop, budget, forms, preparation, season, photo/video views, recap and the newer Analysis and daily outfit flows. Navigation supports five tabs when Analysis has data. The 47 upstream commits were integrated before verification, preserving outfit classification, credit controls, collapsible sections and video behavior.

The exact motorcycle illustration selected by the user (D1) is reused. This refinement made two built-in image-generation calls to redraw the helmet and suit from their original personal reference photographs; it made zero Gemini calls. The earlier limitation about reconstructing suit panels from track photos no longer describes these final equipment references. Generation used the built-in tool, not on-device inference. Personal references, outputs and prompts remain under the ignored `.local/night-session/` directory; see [private portrait provenance](../.local/night-session/prompts.md).

The generic landscape remains a public asset at [night-session.webp](../public/images/night-session.webp), subdued to grayscale in the home interface. It contains no account-specific reference photograph.

Image import is available per motorcycle and equipment item: PNG/JPEG/WebP, dimension checks before decoding, browser resize/compression, a candidate preview, cancel and explicit save. The source photo is retained. Saved imported WebP portraits take priority over private development overrides after reload, including in the daily outfit and recap. The existing paid pixel generator remains separately labeled and collapsed in the regular application; the private preview cannot invoke it.

## Personalized startup

The startup exists before React. It uses the selected motorcycle when a previously verified local thumbnail is available, with a restrained horizontal pass and a static reduced-motion alternative. It exits when the application is ready or storage fails; it adds no artificial wait.

The optional cache contains one disposable raster thumbnail, at most 640 px and 180,000 characters. SQLite and the source-photo vault remain authoritative. The cache is bound to the current owner; account changes, logout and local erasure invalidate it and pending writes. A previously verified motorcycle remains usable offline. New signed-in data waits for ownership verification, and newly created anonymous motorcycles are marked at creation. The isolated preview neither reads nor modifies the regular account's startup cache. See the [startup verification report](../artifacts/night-session/qa/splash-v2/README.md).

## Verification acquired

| Check | Result |
| --- | --- |
| TypeScript after the merged UI and outfit changes | Passed |
| Unit suite | [203/203 passed](../artifacts/night-session/unit-v2-final.txt) |
| Chromium functional suites | [32/32 latest results passed](../artifacts/garage-studio/tests.json); affected suites were rerun after corrections, with earlier attempts retained in the report |
| Responsive visual review | Garage, home, rides, Analysis, account and populated daily outfit at 390/768/1440 px; no horizontal overflow or runtime errors in those passes |
| Local illustration import, final development rerun | [12/12 validation checks passed](../artifacts/garage-studio/logs/import-illustration.log); equipment preview/cancel/save/reload, original-photo preservation and item isolation passed; zero generation requests |
| Personalized startup, development | [28/28 checks passed](../artifacts/night-session/qa/splash-v2/dev-results.json) |
| Personalized startup, local production build | [28/28 checks passed](../artifacts/night-session/qa/splash-v2/production-results.json), including a real PWA offline reload; six generic startup check groups also passed |
| Startup confidentiality | [Four integration scenarios passed](../artifacts/night-session/qa/splash-v2/confidentialite-results.txt), including partial SQLite erasure, restart, retry and account ownership denial |
| Private preview | Separate SQLite/media stores, no Supabase client, private files denied through direct paths, no network writes; [isolation evidence](../artifacts/night-session/preview-isolation-v2.json) |
| Lint | Zero errors in the checked change; existing repository warnings remain |

The current screenshots are in [Garage Studio artifacts](../artifacts/garage-studio/). Representative views: [garage phone](../artifacts/garage-studio/garage-viewport-390.png), [garage desktop](../artifacts/garage-studio/garage-1440.png), [Analysis](../artifacts/garage-studio/analyse-390.png), [daily outfit](../artifacts/garage-studio/journee-390.png) and [account](../artifacts/garage-studio/compte-390.png). The original Night Session captures are historical evidence of the superseded first direction.

## Release evidence — local production build verified; remote release pending

The final production build has been exercised through its local preview on port 4317. Personalized and generic startup, confidentiality, and a real PWA offline reload pass there. This is production-format runtime verification on localhost, not a remote deployment. The current revision has not been verified on a live deployment by this report. Record the remote revision, URL and live checks separately if a release is authorized and completed.

The development-only personal manifest/routes must remain absent from production output. Personal illustrations in the private preview are local overrides; they do not replace the account's saved portraits. An explicit import/save in the regular authenticated application follows its normal data persistence and synchronization flow.

Automated WebKit could not initialize SQLite/OPFS in the earlier pass. Its storage-failure screen was verified, but Safari business routes and physical iPhone media behavior have not been validated. Chromium responsive coverage is not a substitute for a device test. Vite's existing database/sync stack still produces a large main bundle.

## Existing libraries and implementation choices

- [Lucide React](https://lucide.dev/guide/react) supplies a single scalable icon family.
- System fonts replace the earlier Barlow presentation; no font network request is required by the active interface.
- [Motion reduced-motion guidance](https://motion.dev/docs/react-use-reduced-motion) informed the review; native CSS and `prefers-reduced-motion` were sufficient, so no animation runtime was added.
- [Vite CSP guidance](https://vite.dev/guide/features.html#content-security-policy-csp) supports a development nonce for React refresh. Preview and production retain CSP, including the media sources required by local video.

## Reproduce focused checks

```sh
npm run build
npm run essais:unite
npm run lint
node banc-rendu/fumee-import-illustration.mjs http://127.0.0.1:5173
node scripts/check-local-preview.mjs
SPLASH_TEST_URL=http://127.0.0.1:5173 node banc-rendu/fumee-splash-personnalise.mjs /tmp/splash-personnalise
SPLASH_TEST_URL=http://127.0.0.1:5173 node banc-rendu/fumee-splash-confidentialite.mjs
```

The existing browser suites expect port 4173. This session preserved unrelated servers and used a temporary URL-only redirect to preview port 4317. Browser results are local checks, not live-account verification.
