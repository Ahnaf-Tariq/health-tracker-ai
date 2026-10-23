const SELF_HARM_PATTERNS = [
  /\b(?:i\s+)?(?:do not|don't|dont|cannot|can't|can not|no longer)\s+(?:want|wish|feel like)\s+(?:to\s+)?(?:live|be alive|keep living|go on|continue|exist)\b/i,
  /\b(?:want|wanting|wanna|wish|plan|planning|thinking(?:\s+about)?)\s+(?:to\s+)?(?:die|kill myself|hurt myself|hurting myself|end (?:my(?:\s+life)?|it(?:\s+all)?))\b/i,
  /\b(?:wish|hope|want)\s+(?:i\s+)?(?:was|were|could be)\s+dead\b/i,
  /\b(?:no reason|nothing left)\s+to\s+live\b/i,
  /\b(?:suicid(?:e|al)|self[-\s]?harm|kill myself|hurt(?:ing)? myself|end my life|better off dead|(?:never|not) wake up|don't want to wake up)\b/i,
  /\b(?:severe|serious|extreme)(?:ly)?\s+depress(?:ion|ed)\b/i,
  /\bdepression\s+(?:is|feels?)\s+(?:severe|serious|extreme)\b/i,
];

const DISORDERED_EATING_PATTERNS = [
  /\b(?:starv(?:e|ing)|purge|throw(?:ing)? up (?:after|to) eat|laxative abuse|fear of eating|not allow myself to eat)\b/i,
  /\b(?:eating disorder|binge and purge|restrict(?:ing)? food)\b/i,
];

const CONTROL_CHARACTERS = /[\p{Cc}]/gu;
const FORMAT_CHARACTERS = /[\p{Cf}]/gu;
const FORMAT_AND_INVISIBLE_CHARACTERS =
  /[\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/gu;

function normalizeForSafety(text: string, keepControlGaps: boolean): string {
  const normalized = text
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u02BC]/gu, "'")
    .replace(/[\u201C\u201D]/gu, '"')
    .replace(FORMAT_CHARACTERS, "");
  const controlNormalized = keepControlGaps
    ? normalized.replace(CONTROL_CHARACTERS, " ")
    : normalized.replace(CONTROL_CHARACTERS, "");
  return controlNormalized.toLowerCase().replace(/\s+/gu, " ").trim();
}

function safetyTextVariants(text: string): string[] {
  return [
    ...new Set([
      normalizeForSafety(text, true),
      normalizeForSafety(text, false),
    ]),
  ];
}

/** Text is normalized locally for support checks and excluded from the AI chat payload. */
export function hasSelfHarmConcern(notes: string): boolean {
  return safetyTextVariants(notes).some((text) =>
    SELF_HARM_PATTERNS.some((pattern) => pattern.test(text)),
  );
}

export function hasDisorderedEatingConcern(notes: string): boolean {
  return safetyTextVariants(notes).some((text) =>
    DISORDERED_EATING_PATTERNS.some((pattern) => pattern.test(text)),
  );
}

/** Display as literal text; this module deliberately provides no HTML rendering or rule hooks. */
export function safeUserText(value: string, maxLength = 300): string {
  return value
    .normalize("NFKC")
    .replace(CONTROL_CHARACTERS, " ")
    .replace(FORMAT_AND_INVISIBLE_CHARACTERS, "")
    .replace(/\s+/gu, " ")
    .trim()
    .slice(0, maxLength);
}

export function notesAreUntrustedData(_notes: string): true {
  return true;
}
