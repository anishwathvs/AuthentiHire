/**
 * AuthentiHire - TypeScript Data Contracts & Interfaces
 * =====================================================
 * Matches backend FastAPI / Pydantic v2 schemas exactly.
 */

export interface JobPostingRequest {
  title?: string;
  location?: string;
  department?: string;
  salary_range?: string;
  company_profile?: string;
  description: string;
  requirements?: string;
  benefits?: string;
  telecommuting?: boolean;
  has_company_logo?: boolean;
  has_questions?: boolean;
  employment_type?: string;
  required_experience?: string;
  required_education?: string;
  industry?: string;
  function?: string;
  company_name?: string;
  recruiter_email?: string;
  url?: string;
}

export interface MLPredictionResponse {
  fraud_probability: number;
  prediction: 'LEGITIMATE' | 'FRAUDULENT' | string;
  threshold_used: number;
  model_name: string;
}

export interface ScoreComponents {
  ml_risk_component?: number;
  rule_risk_component?: number;
  company_risk_component?: number;
  weighted_base_score?: number;
  final_score?: number;
}

export type RiskBand =
  | 'LOW RISK'
  | 'MODERATE RISK'
  | 'HIGH RISK'
  | 'CRITICAL RISK'
  | 'LOW'
  | 'MODERATE'
  | 'HIGH'
  | 'CRITICAL'
  | string;

export type AssessmentStatus =
  | 'CLEAR'
  | 'LOW_RISK'
  | 'REVIEW_RECOMMENDED'
  | 'HIGH_RISK'
  | 'INSUFFICIENT_EVIDENCE';

export interface RiskScoreResponse {
  overall_score: number;
  risk_band: RiskBand;
  status: AssessmentStatus;
  components?: ScoreComponents;
}

export interface CompanySignal {
  signal_type: string;
  category: string;
  description: string;
  evidence: string;
  trust_penalty: number;
}

export type ConsistencyRating = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNVERIFIED' | 'MISMATCH';

export interface CompanyTrustResponse {
  company_name?: string | null;
  trust_score: number;
  website?: string | null;
  domain?: string | null;
  email?: string | null;
  consistency_rating: ConsistencyRating;
  signals: CompanySignal[];
}

export interface TriggeredRule {
  rule_id: string;
  rule_name: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  score: number;
  explanation: string;
  evidence: string;
}

export interface RuleEvidenceResponse {
  total_score: number;
  triggered_rules_count: number;
  triggered_rules: TriggeredRule[];
  category_breakdown: Record<string, number>;
  suspicion_level: string;
}

export interface MetadataResponse {
  model_version: string;
  risk_config_version: string;
  api_version: string;
  timestamp: string;
}

export interface JobAnalysisResponse {
  analysis_id?: string;
  session_id?: string;
  request_id: string;
  prediction: MLPredictionResponse;
  risk: RiskScoreResponse;
  company: CompanyTrustResponse;
  rules: RuleEvidenceResponse;
  reasons: string[];
  corroborations: string[];
  recommendations: string;
  metadata: MetadataResponse;
}

export interface AnalysisSummaryItem {
  id: string;
  request_id: string;
  session_id: string;
  title?: string | null;
  company_name?: string | null;
  location?: string | null;
  overall_risk_score: number;
  risk_band: RiskBand;
  status: AssessmentStatus;
  fraud_probability: number;
  company_trust_score: number;
  created_at: string;
}

export interface RiskDistribution {
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

export interface DashboardSummaryResponse {
  total_analyses: number;
  risk_distribution: RiskDistribution;
  average_risk_score: number;
  recent_analysis_count: number;
  recent_analyses: AnalysisSummaryItem[];
}

export interface HistoryQueryParams {
  limit?: number;
  offset?: number;
  search?: string;
  risk_band?: string;
  sort?: 'created_at' | 'overall_risk_score' | 'company_trust_score' | 'title' | string;
  order?: 'asc' | 'desc';
}

export interface PaginatedAnalysisHistory {
  items: AnalysisSummaryItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface DeleteAnalysisResponse {
  deleted: boolean;
  analysis_id: string;
  message: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  model_loaded: boolean;
  timestamp: string;
}

export interface ModelInfoResponse {
  model_name: string;
  model_type: string;
  calibration_method: string;
  decision_threshold: number;
  rule_count: number;
  component_weights: {
    ml_weight: number;
    rule_weight: number;
    company_weight: number;
  };
  risk_bands: Record<string, string>;
  status_categories: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  created_at: string;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  message: string;
  token?: string;
}

export interface LogoutResponse {
  message: string;
}

export interface ApiError {
  code: string;
  message: string;
  error_id?: string;
  details?: Array<{ field: string; message: string; type: string }>;
}
