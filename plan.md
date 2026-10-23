# Health Tracker — Enhancement Plan

## Product and implementation approach

Health Tracker remains a single-flow, adults-only wellness app. It collects measurements in the browser and presents a transparent, plain-language reflection. The user explicitly approved **local, deterministic rules and no AI**. No health inputs or notes will be sent to an AI, an analysis service, or the app host; there will be no account, database, analytics, trackers, cookies, or health-data persistence. The form stays in memory only.

Use the Next.js App Router with React and TypeScript. The visible brand, title, exported report, and downloadable filename are **Health Tracker**. Style the interface with Tailwind CSS utility classes and accessible Ant Design dropdowns, and use Framer Motion only for restrained page/section transitions. Honor `prefers-reduced-motion`; do not add remote fonts, image dependencies, or telemetry. Use Ant Design if date-picker or calendar controls are introduced; none exist currently.

Make the interface considerably easier for older adults to read and operate: comfortable 16px body text, large headings and measurement values, high contrast, plain labels, 48px-class control/button targets, visible units, direct instructions, non-color-only states, and less tiny helper text. Keep essential measurements together; make secondary questions visibly optional and progressively disclosed without making the flow feel like a clinical intake form.

### Clinical interpretation and user data

Keep the existing adult blood-pressure categories, but correct the crisis action to match current AHA guidance. A reading above 180 systolic or 120 diastolic with listed concerning symptoms (chest pain, shortness of breath, back pain, numbness, weakness, new vision change, or difficulty speaking) gets the full-screen emergency instruction. A very high reading without those symptoms must not automatically tell a person to call an ambulance: prominently say to wait one minute and recheck, then contact a healthcare professional as soon as possible if it remains similarly high. Other independently urgent symptom combinations already in the brief remain urgent. In ordinary reports, flag the very-high reading before routine results, suppress lifestyle tips that could distract from follow-up, and pause the numerical energy score/factor list so a high score cannot appear falsely reassuring. See `CLINICAL_REFERENCES.md`.

Promote resting heart rate to a clearly visible optional measurement. Replace the ambiguous “fasting blood sugar or HbA1c” input with a clearly distinguished test selector: fasting laboratory plasma glucose (after an 8-hour fast), HbA1c from a lab report, or another/home-meter/unsure result. Only the first two receive cautious non-pregnant screening context. Convert fasting glucose units consistently. Use non-diagnostic language such as “in a range commonly used for screening”; never label the user as having prediabetes or diabetes. Do not interpret these cutoffs during pregnancy, for known diabetes (personal targets differ), for non-lab/uncertain measurements, or for HbA1c when anemia is reported. Explain that a clinician confirms findings and that results from home meters do not diagnose. Glucose remains separate from the unvalidated lifestyle energy score; it does not secretly change that score.

Keep the energy score clearly marked as an unvalidated lifestyle heuristic, not a medical measurement. Retain the broad adult 7–9-hour sleep guide; CDC and NIA describe older-adult ranges slightly differently, so do not make an exact age-specific sleep boundary sound like a medical finding. Keep pregnancy, known-condition/medication, underweight, athlete, and older-adult caveats. Add a compact “How this works / sources” disclosure with links to the clinical references.

### PDF reliability

Fix the actual result-page PDF button, not just PDF content generation. Preload or otherwise prepare jsPDF while the results view is opening so the eventual button action retains a clear user-initiated download path. Catch errors, show a visible accessible progress/success/failure status, use the branded `health-tracker-wellness-summary.pdf` filename, and provide a clear print / Save as PDF fallback if browser download restrictions prevent a file from starting. The downloadable and printable report must keep all visible report explanations, relevant clinical context, source references, and the complete wellness disclaimer. Add automated tests for complete PDF content plus download-helper behavior, and smoke-test the actual button in Preview.

## Project structure

- `index.html`, `public/`, `app.config.ts` — branded app shell, favicon, project logo metadata, and single-page declaration.
- `src/app/layout.tsx`, `src/app/page.tsx`, `src/App.tsx` — Next.js App Router entry points, responsive app shell, transitions, privacy dialog, and form/results/support flow.
- `src/components/CheckInForm.tsx`, `FormField.tsx`, `SelectField.tsx` — accessible, progressively disclosed form with Ant Design selects, Tailwind sizing, units, symptom/context controls, and inline errors.
- `src/components/ResultsView.tsx`, `MetricCard.tsx`, `EnergyGauge.tsx`, `PrivacyDialog.tsx` — larger, older-adult-friendly results, severe-reading guidance, measured-value context, and privacy/disclaimer UI.
- `src/domain/types.ts`, `validation.ts`, `rules.ts`, `score.ts`, `scoreConfig.ts`, `privacy.ts` — typed local inputs, bounds/units, deterministic clinically sourced categories, urgent triage, the separate lifestyle heuristic, and untrusted-note handling.
- `src/domain/clinicalGuidance.ts` — source-linked static reference summaries and glucose screen-range classification.
- `src/lib/pdf.ts`, `summary.ts` — client-only branded downloadable/printable report and clipboard text.
- `src/app/globals.css` — Tailwind CSS setup, theme tokens, and base defaults; component utility classes handle responsive layout, focus states, dark mode, reduced motion, and print styles.
- `src/domain/rules.test.ts`, `src/lib/pdf.test.ts` — boundary, safety, glucose, and export regression tests.
- `CLINICAL_REFERENCES.md`, `README.md`, `TODO.md`, `plan.md` — cited source basis, local setup, limitations, assumptions, and outcome tracking.

## Design system

- **Design movement:** Contemporary editorial minimalism inspired by the Awwwards Minimal collection’s emphasis on balance, alignment, contrast, and removing nonessential elements. It is an inspiration, not an imitation or claim of an award.
- **Core principles:** Comfortable to read at a glance; simple before clever; calm without downplaying real risk; show the value, unit, label, and explanation together; privacy is visible where people enter health data.
- **Color philosophy:** Warm off-white pages and deep forest ink create less glare while preserving contrast. A distinctive evergreen teal marks navigation and positive action; muted ochre and dark brick are reserved for clearly labeled caution and emergency states. Color never carries meaning alone. Dark mode retains legibility.
- **Layout paradigm:** A calm, left-aligned editorial column with generous spacing, short reading measure, and a clear vertical progression. Essential measurements come first; optional details sit in plainly titled sections; the report begins with the most important message before secondary cards. Use two-column cards only when they improve comparison, then stack on mobile.
- **Signature elements:** A compact pulse/leaf mark beside a clear “Health Tracker” wordmark; oversized readable measurement numerals paired with explicit labels; a thin progress/section line connecting the check-in stages.
- **Interaction philosophy:** Large, dependable touch targets; labeled Ant Design dropdowns; plain instructions beside the relevant field; visible validation; optional sections never block completion; one main action at a time; emergency instructions interrupt normal results. No clever gestures or hover-only meanings.
- **Animation:** Subtle 160–240ms fade-and-rise transitions for page sections and result cards; a single gentle score reveal, with no shaking, blinking, or looping effects. Disable/shorten motion when reduced-motion is requested. Keep every control immediate and predictable.
- **Typography system:** Locally available, familiar system sans-serif for form labels, body, and numeric values; a restrained Georgia/system-serif display face for selected headlines only. Minimum comfortable body text 16px, 15–16px labels, larger helper text than the previous 9–11px treatment, generous line spacing, and large high-contrast results. No external font download.
- **Brand essence:** “A private, plain-language health check-in that helps adults understand their own readings without outsourcing their data.” Personality: clear, steady, respectful.
- **Brand voice:** Short, reassuring, specific, and honest about uncertainty. Examples: “Your numbers are a starting point—not a diagnosis.” “If this reading stays very high, contact a health professional as soon as you can.”
- **Wordmark & logo:** A custom rounded pulse-line mark with a quiet leaf/dot accent next to a legible “Health Tracker” wordmark; not a generic hospital cross or a stock logo.
- **Signature brand color:** Evergreen teal `#176B5C`, with high-contrast text and compliant-looking but unclaimed contrast; no formal WCAG AA certification will be claimed without an audit.

## Constraints and serving

- Keep the existing static-only, local-computation architecture. Do not enable a backend or database and do not send measurements to a model.
- Use Tailwind utility classes for styling, Ant Design dropdowns (and date/calendar controls when needed), and Framer Motion for restrained motion; keep fonts and assets local and preserve TypeScript checks.
- Preserve `/manus-routes.json` with the one `/` route. Continue serving the project on its existing configured preview port.
- Maintain strict bounded parsing, unit conversion, text sanitization, self-harm/disordered-eating safety handling, pregnancy and older-adult context, no medication advice, no diagnosis, and the full disclaimer in screen/exports.
- Document why the glucose values are limited to screening context, why home-meter/uncertain results are display-only, why pregnancy/known diabetes/anemia are not classified, that repeated testing and personal targets belong to a clinician, and that the energy score is not clinically validated.
