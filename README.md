# Health Tracker

Health Tracker is an adults-only wellness check-in with an editorial landing page at `/` and the existing single-flow check-in at `/check-in`. It brings your readings and everyday context together in a calm, plain-language snapshot. It uses **deterministic rules—no AI**—and is not a diagnosis or a medical measurement.

## Privacy by design

Health Tracker has no login, accounts, database, health-analysis server, third-party AI, analytics, advertising trackers, cookies, remote fonts, or health-data persistence. Your answers are calculated in the browser and stay in memory until you start over, reload, or close the page. The app makes no request with your answers. There is no local save and nothing is written to `localStorage`. The page shell and app assets are still served by the Next.js hosting provider.

Opening an external source link opens its public health-education page only; no check-in values are attached to that request. Choosing Copy, PDF, Print, or Save as PDF creates a file/copy on your own device at your direction.

Next.js serves the page and assets, while validation and health calculations run in the browser. There are no health-analysis API routes or server actions, and check-in answers are never submitted to the Next.js server. No credentials or environment variables are needed.

## Run locally

Requirements: Node.js 20.9 or newer (Node.js 22 recommended) and npm.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. To run the rules/PDF tests, TypeScript checks, and production build:

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the production build on port 3000. Run it after `npm run build`; stop the development server before starting it. `npm run preview` is an alias for the production server, and `npm run test:watch` runs Jest in watch mode.

## Next.js structure

- `src/app/layout.tsx`: HTML document, metadata, Tailwind CSS entry point, and Ant Design's Next.js style registry.
- `src/app/globals.css`: Tailwind import, light/dark design tokens, and shared base defaults. Component styling uses Tailwind utility classes in JSX.
- `src/app/page.tsx`: editorial landing page with local photography, feature highlights, and navigation to the check-in.
- `src/app/check-in/page.tsx`: the existing check-in and results flow, with all essential and optional fields preserved.
- `src/components/AppProviders.tsx`: shared light/dark theme and Ant Design configuration.
- `src/App.tsx`: client component containing the check-in flow and its in-memory state.
- `src/components/SelectField.tsx`: shared Ant Design dropdown with accessible labels, validation status, and Tailwind sizing classes. The shared `ConfigProvider` supplies matching light/dark colors and touch-target sizes.
- `src/components`, `src/domain`, and `src/lib`: interface, browser health calculations, and report exports.
- `src/proxy.ts`: per-request Content Security Policy nonces for Next.js scripts.
- `next.config.ts`: Next.js configuration and response headers.
- `postcss.config.mjs`: Tailwind CSS v4 PostCSS integration.
- `jest.config.cjs`: TypeScript rules and PDF tests, without a Vite dependency.

The pages render per request so their script nonces match the Content Security Policy. Deploy to a host that supports the Next.js Node.js runtime; a static HTML export is not configured. Health calculations and PDF creation remain client-side. Instrument Serif and DM Sans are bundled locally; image generation prompts and asset sources are documented in [`docs/design-assets.md`](./docs/design-assets.md).

## How the rules work

- **Blood pressure:** AHA adult categories are screening context, not a diagnosis or personal treatment target. Low readings are not labeled normal. Every entered reading is checked for severe values before averaging can hide them. Above 180 systolic or 120 diastolic without concerning symptoms: wait at least one minute and repeat; if still this high, contact a professional as soon as possible. With concerning symptoms, get emergency help immediately. Routine suggestions are withheld for unsafe BP/glucose readings. [AHA guidance](https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings/when-to-call-911-for-high-blood-pressure).
- **Optional BP:** blank readings may be skipped; partially completed readings still need correction. Missing BP is represented as absent, never assumed normal or estimated. Reports and exports show “Confidence: lower” specifically for BP assessment, explain what measuring BP would add, and still provide other available context and symptom-based safety warnings. This is not a validated confidence score.
- **Optional blood type:** an Ant Design dropdown appears first in personal details. Known ABO/RhD groups and unknown/skip are supported. `src/domain/bloodType.ts` provides evidence-limited information and pregnancy antibody-screening context; it does not predict disease or change thresholds from blood type. It never selects transfusion products or gives blood-type diets. Sources and limits are documented in `CLINICAL_REFERENCES.md`.
- **Glucose:** a separate optional control distinguishes fasting lab glucose, HbA1c, and other/home-meter/uncertain results. Only a confirmed 8+ hour fasting lab result or lab HbA1c can receive cautious screening-range context. The app does not make a disease conclusion. It shows other/home-meter results without a generic range. Pregnancy, known diabetes and (for HbA1c) reported anemia suppress the generic classification. A clinician interprets and, where appropriate, confirms results. See [NIDDK's diabetes test guide](https://www.niddk.nih.gov/health-information/diabetes/overview/tests-diagnosis).
- **Glucose safety:** low or very high glucose gets separate safety context even when a meter value, pregnancy, known diabetes or unconfirmed fasting prevents a screening label. HbA1c is not a current glucose reading. Historical results are distinguished from current readings; the app cannot infer measurement time. HbA1c interpretation is withheld for reported anemia or kidney disease because key context is missing.
- **Heart rate:** the usual adult resting reference is 60–100 bpm. Lower rates can occur with training or medicines, but a muscular-build checkbox does not establish that a low rate is safe.
- **No energy or health score:** the former arbitrary weighted energy score, score bands and confidence labels were removed in the 2026-10-15 audit. No clinically validated score was available. `src/domain/context.ts` lists omitted optional details without claiming medical confidence.
- **Symptoms and maternity:** sudden/new warning signs can trigger urgent guidance without abnormal BP or another symptom. Pregnancy uses separate severe-BP safety context (160 systolic or 110 diastolic). Breastfeeding is treated cautiously as a possible postpartum context; birth date is not collected, which limits accuracy.
- **Sleep:** the existing broad 7–9-hour adult guide is a soft reference. CDC and the National Institute on Aging describe older-adult ranges slightly differently; the app does not treat a precise age cutoff as a medical finding.
- **BMI and waist:** these are rough screening context only and can be misleading for athletes, some older adults, and during pregnancy. Pregnancy suppresses BMI categorization and weight advice.

The source-based audit, corrections and remaining limitations are in [`CLINICAL_REFERENCES.md`](./CLINICAL_REFERENCES.md). No independent clinical validation has been performed. Correctly implementing selected reference thresholds does **not** establish that the entire app is medically accurate or safe for clinical decision-making.

## PDF and print

The report is generated in your browser only. Health Tracker prepares its PDF library while the results page is opening and uses a local Blob download initiated by the **Download report (PDF)** button. The report includes the visible explanations, source links, context and complete disclaimer. It shows an accessible progress/status message. If browser download restrictions or an error prevent the file from starting, use **Print / Save as PDF** or **Copy summary** instead. The PDF filename is `health-tracker-wellness-summary.pdf`.

## Accessibility and security

The interface uses Tailwind CSS v4 utility classes for layout and app styling, with Ant Design for all dropdowns. Dropdowns retain accessible labels, keyboard navigation, validation feedback, visible focus, and matching light/dark themes. Brief screen transitions respect reduced-motion preferences. Tailwind responsive, dark, state, and print variants cover the interface. The app uses local fonts/assets and a Content Security Policy with per-request script nonces. Development permits script evaluation for Next.js debugging; production does not. Inline styles remain permitted for Ant Design and animations. There are currently no calendar or date-entry controls.

No formal WCAG AA audit, Lighthouse run or clinical validation study has been performed; no compliance certification or performance score is claimed. Verify production response headers and accessibility with your own audit before relying on them.

## Assumptions and known limitations

- For adults only; if a user enters an age under 18, calculation is blocked and pediatric care is suggested.
- Reports depend on self-entered measurements, timing and device accuracy. Use a validated cuff and follow the monitor instructions; a clinician's targets take priority.
- The glucose ranges are educational screening context, not diagnostic criteria applied to an individual. The tool cannot verify that a result came from a lab or that fasting conditions were met; users self-report this.
- The app intentionally does not interpret home-meter glucose readings, known-diabetes targets, pregnancy glucose values, or HbA1c where anemia is reported.
- The free-text self-harm and disordered-eating checks are local keyword heuristics. They can miss ways of describing distress or flag wording without understanding context; they are not monitored or a substitute for emergency/crisis support. If you or someone else is in immediate danger, contact local emergency services.
- The app cannot identify all reasons for tiredness or rule out illness. It does not calculate an energy score and must not be used to delay care. Ongoing fatigue is a follow-up prompt regardless of sleep hours.
- Health Tracker uses English; an Urdu/RTL translation is not included in this release.
- Browser computation keeps answers off the analysis server, but does not replace secure device use, careful storage of downloaded reports, or clinical care.

## Disclaimer

> This tool gives general wellness information, not medical advice, diagnosis, or treatment. It is not a substitute for a doctor. If you think you have an emergency, call your local emergency number.
