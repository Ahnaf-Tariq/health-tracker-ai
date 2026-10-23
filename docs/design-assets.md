# HealthTracker redesign assets

The interface uses the user's supplied HealthTracker dashboard reference for composition, spacing, and color direction. The check-in's fields, optional sections, validation, calculation rules, export behavior, and medical safety messages are preserved. The new landing page is `/`; the actual check-in and results are `/check-in`. The three numbered labels present an overview of the existing single-flow form, without introducing a new wizard.

## Photography

Created using the **built-in image generation tool**, with separate requests for each photographic asset. Optimized to WebP and saved inside the project. No health data, portrait measurements, report scores, or user inputs are embedded in the landing-page illustration. All imagery is served locally.

- `public/images/wellness-portrait.webp` — transparent lifestyle portrait; alpha retained.
- `public/images/check-in-scene.webp` — sunlit plant and architectural shadows for the check-in header.
- `public/images/care-detail.webp` — stethoscope and linen still life for the informational sidebar.
- `public/images/wellness-banner.webp` — cinematic mountain scene for the landing-page banner.

### Final prompt set

**Portrait:** Use case: photorealistic-natural. Asset type: transparent cutout photography for a premium minimalist healthcare website hero. Generate a realistic editorial photograph of a healthy adult South Asian man aged about 28, wavy dark hair, clean face with subtle stubble, wearing a simple fitted deep forest green short sleeve t-shirt. He stands relaxed with shoulders at a slight angle, eyes looking thoughtfully to the upper left, serene expression. Framed from top of head through waist, both upper arms naturally visible, entire hair and silhouette uncut. Soft natural window light from upper left, sophisticated muted colors, lifelike skin texture, exceptionally high quality lifestyle portrait, not a fitness advertisement, no exaggerated musculature. Transparent background, no floor, no props, no text, no logos, no medical devices, no cards, no watermark. Tall portrait composition with subject centered, preserve fine hair edges in alpha. This is only a photographic asset, not a website screenshot.

**Mountain banner:** Use case: photorealistic-natural. Asset type: cinematic wide wellness banner photograph for a premium healthcare website. A young adult man wearing a dark forest green t-shirt and dark hiking shorts is seen from behind at the center-right, standing calmly at a mountain overlook in northern Pakistan. Layered lush forest-green mountains, misty valleys, distant craggy ridges, a quiet pale warm gold sunrise peeking through clouds. Realistic editorial outdoor photography, subtle analog film texture, softly desaturated teal shadows, cinematic and hopeful, natural not oversaturated. Wide landscape approximately 2.4:1, subject occupies 35% of height at center-right, plenty of scenery and darker shadowed space on left for overlaid white website text. The lower left is deep forest shadow; upper half subtle sky and mountain layers. No text, no logos, no graphics, no UI, no watermark.

**Check-in header:** Use case: photorealistic-natural. Asset type: wide photographic header background for a refined health check-in website. Minimal sunlit Scandinavian wellness interior, warm off-white plaster wall on left, muted sage teal wall on right, a single realistic lush strelitzia plant in a matte ivory cylindrical planter on a light stone console, placed around the center-right. Tall daylight window at far right casts elegant architectural rectangular light and a soft abstract human silhouette shadow against the sage wall. A quiet reassuring sense of wellbeing, realistic fine plant veins, no clutter, premium interior photography, soft muted forest greens and warm neutral tones. Wide composition 2:1, left third mostly blank warm off-white fading naturally into the scene, right side carries the plant and shadow. No visible person, no text, no labels, no cards, no UI, no logo, no watermark.

**Stethoscope detail:** Use case: photorealistic-natural. Asset type: sidebar lifestyle medical photograph for a premium wellness check-in website. Close-up editorial still life of a beautiful forest-teal stethoscope coiled naturally on soft light sage cotton fabric, polished metal chestpiece reflecting soft window daylight, shallow depth of field, lifelike materials, tasteful healthcare aesthetic, subtle gray-green and mint tones. Landscape composition about 4:3, stethoscope sits in the center, soft folds and quiet natural light, warm realistic professional product photography. No people, no text, no logo, no watermark, no UI.

## Typography

Self-hosted using `next/font/local`. The browser makes no request to a remote font provider.

- [Instrument Serif](https://github.com/google/fonts/tree/main/ofl/instrumentserif): regular and italic, for editorial headings. License: `src/app/fonts/InstrumentSerif-OFL.txt`.
- [DM Sans](https://github.com/google/fonts/tree/main/ofl/dmsans): variable font, for interface text. License: `src/app/fonts/DMSans-OFL.txt`.

## UI implementation

Tailwind CSS remains the styling framework; Ant Design remains the dropdown library. Existing Lucide icons and Framer Motion are reused. The design does not introduce tracking, persistence, APIs, medical calculations, or additional dependencies. Informational copy describes the existing browser-only, rules-based behavior.
