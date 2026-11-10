export type LikertValue = 1 | 2 | 3 | 4 | 5;

export interface SurveyAnswer {
  species: string;
  clearly_understand: LikertValue;
  easy_to_use: LikertValue;
  trust_result: LikertValue;
  would_use: LikertValue;
  found_valuable: LikertValue;
  notes?: string;
}