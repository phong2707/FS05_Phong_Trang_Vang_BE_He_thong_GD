export interface AIGradingRequest {
  maxMark: number;
  criteria: {
    name: string;
    max: number;
  }[];
  essayContent: string;
}

export interface AIGradingCriteriaItem {
  name: string;
  score: number;
  max: number;
  comment: string;
}

export interface AIMistake {
  text: string;
  reason: string;
}

export interface AIGradingResponse {
  total: number;
  criteria: AIGradingCriteriaItem[];
  finalComment: string;
  mistakes?: AIMistake[];
}