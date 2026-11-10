/** Common local fish species shown in the survey / settings context. */
export const SPECIES = [
  'Tilapia',
  'Milkfish (Bangus)',
  'Galunggong (Blue Mackerel)',
  'Tunay (Tuna)',
  'Tamban (Sardine)',
  'Biya (Goby)',
  'Hito (Catfish)',
  'Other',
] as const;

export const SURVEY_LIKERT_OPTIONS = [
  { value: 1, label: 'Strongly disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly agree' },
] as const;

/** Survey statement wording following Chapter 3.9 of the proposal. */
export const SURVEY_QUESTIONS = [
  {
    id: 'clearly_understand',
    text: 'The app clearly explained what to scan and in what order (eye, then skin).',
  },
  {
    id: 'easy_to_use',
    text: 'The scanning process was easy to follow on my phone.',
  },
  {
    id: 'trust_result',
    text: 'I trust the freshness verdict shown by the app.',
  },
  {
    id: 'would_use',
    text: 'I would use this app to check the freshness of fish I buy.',
  },
  {
    id: 'found_valuable',
    text: 'The consumption guidance helped me decide what to do with the fish.',
  },
] as const;