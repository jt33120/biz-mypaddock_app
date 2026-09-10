# MyPaddock — Garage Studio

## Direction
A personal racing garage with the clarity of a native iOS app: dark neutral foundations with restrained electric blue and violet accents.
The latest refinement retains the native black/gray/white system and adds small blue-to-violet gradients for visual character. Pixel art and the decorative pink/mint Night Session palette remain superseded.
Keep the sharp, illustrated cel-shaded motorcycle and equipment as the visual focus. Surround the artwork with black, charcoal and white interface surfaces; original artwork only, without game logos or copied game screens.

## Visual system
Black backgrounds, neutral charcoal cards and restrained gray separators. Primary actions use a controlled electric-blue-to-violet gradient with white text; active navigation receives a much softer tinted gradient. Fine accent borders and low-opacity halos highlight selected artwork and the startup scene. Use the platform system font stack (SF on iOS/macOS) for body and headings, with clear native hierarchy instead of oversized racing typography. Keep red for destructive/error states and amber for actual warnings or slower timing deltas; no pink or green accents, multicolor badges or brightly colored section borders. Keep blue/violet glows subtle and limited to presentation, never status. Shared spacing, color, radius and type tokens live in design/tokens.json and generate src/styles/night-tokens.css. Legacy color token names remain as neutral aliases for existing screens.

## Components
Existing functional React components retain their database contracts. Buttons, forms, chips, navigation, panels, notices, sheet/lightbox, garage cards, time cards, charts and authentication states share the neutral skin with restrained blue/violet accents. Use compact system headings, generous touch controls and subtle selected fills. Validate normal and hover gradient text contrast against every interpolated color, not just the endpoints. The startup screen centers the rider's local motorcycle when available. Lucide remains the sole interface icon family; native accessible controls retain their existing behavior.

## Assets
Reuse the exact D1 motorcycle illustration selected by the user. The helmet and suit are redrawn from their original personal reference photographs with two built-in image-generation calls; no Gemini calls are made. Account-specific previews stay local and never replace another user's image. Store original references privately; keep generated source and prompts documented. Decorative landscape artwork is subdued or removed from interface backgrounds so the motorcycle remains the subject. System fonts require no font network requests.

## Responsive and interaction
390, 768 and 1440 pixels are acceptance widths, plus 375 for compact navigation. Compact bottom navigation on phones, broad top navigation on desktop, content width appropriate to each screen. Touch targets at least 44px, primary actions 52px; keyboard focus, reduced motion, disabled and error states. Keep existing loading/error/offline and destructive confirmations.

## Acceptance
All main routes and garage subviews receive the new shared theme. Inspect real empty and populated screens, loading and error states. Two screenshot/critique passes; verify no horizontal overflow. Typecheck, build and relevant existing unit/browser tests pass. No remote deploy requested; provide running localhost and screenshots.
