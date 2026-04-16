export type SafetyDecision = 'safe' | 'unsafe' | 'review';

export interface SafetyCategories {
  hallucination: boolean;
  toxicity: boolean;
  pii: boolean;
  policy_violation: boolean;
  bias: boolean;
  misinformation: boolean;
  prompt_injection: boolean;
}

export interface CheckRequest {
  text: string;
  context?: string;
  check_categories?: (keyof SafetyCategories)[];
}

export interface BatchRequest {
  checks: CheckRequest[];
}

export interface SafetyResponse {
  id: string;
  safe: boolean;
  decision: SafetyDecision;
  confidence: number;
  issues: string[];
  categories: SafetyCategories;
  flagged_segments: string[];
  recommendation: string;
  latency_ms: number;
  created_at: string;
}

export interface BatchResponse {
  batch_id: string;
  total: number;
  safe_count: number;
  unsafe_count: number;
  results: SafetyResponse[];
  latency_ms: number;
}
