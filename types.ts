
export enum ToolType {
  CHECKLIST = 'CHECKLIST',
  MATURITY = 'MATURITY',
  RISK_TOOLS = 'RISK_TOOLS',
  TRAINING = 'TRAINING',
  CULTURE_ERGO = 'CULTURE_ERGO',
  MENTAL_HEALTH = 'MENTAL_HEALTH',
  ACTION_PLAN = 'ACTION_PLAN',
  DASHBOARD = 'DASHBOARD',
  GLOBAL_REPORT = 'GLOBAL_REPORT',
  FAQ = 'FAQ',
  SUPABASE_SYNC = 'SUPABASE_SYNC'
}

export type SectorType = 'COMERCIO_SERVICOS' | 'INDUSTRIA';

export enum InternalProfile {
  MICRO_LITE = 'MICRO_LITE',
  PEQUENA_STANDARD = 'PEQUENA_STANDARD',
  MEDIA_GESTAO = 'MEDIA_GESTAO',
  GRANDE_ATE_1000 = 'GRANDE_ATE_1000',
  ENTERPRISE_CUSTOM = 'ENTERPRISE_CUSTOM' // > 1000
}

export interface BusinessType {
  id: string;
  code: string;
  publicName: string;
  description: string;
}

export interface PGRModelItem {
  id: string;
  businessTypeId: string; // FK -> BusinessType.id
  sector: string;
  activity: string;
  hazard: string;
  riskFactor: string;
  agent?: string;
  possibleDamage: string;
  existingMeasures: string;
  recommendedMeasures: string;
  standardRiskLevel: number; // 1=Low, 2=Medium, 3=High
}

export interface Contract {
  id: string;
  contractorName: string;
  cnpj: string;
  workersCount: number;
  scope: string;
  complianceStatus?: 'COMPLIANT' | 'PENDING' | 'IRREGULAR'; // New field for third-party management
}

export interface Branch {
  id: string;
  name: string;
  cnpj: string;
  employees: number;
  contracts: Contract[];
}

export interface CompanyProfile {
  name: string;
  cnpj: string;
  employees: string;
  sector: SectorType;
  cnae: string;
  cnaeDescription?: string;
  riskDegree: string;
  porte_ibge?: string;
  perfil_interno?: InternalProfile;
  businessTypeId?: string;
  branches: Branch[];
}

export interface SectorAnalysis {
    id: string;
    name: string;
    respondents: number;
    scores: {
        consciencia: number;
        lideranca: number;
        comunicacao: number;
    };
}

export interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  description: string;
}

export interface MaturityItem {
  id: string;
  dimension: string;
  question: string;
  description: string;
}

export interface ChecklistState {
  [key: string]: number; // 0 (Não Atende), 1 (Parcial), 2 (Pleno)
}

export interface MaturityState {
  [key: string]: number; // 1 to 5
}

export type MaturityLevel = 'Inicial' | 'Básico' | 'Intermediário' | 'Avançado';

export interface AuditResult {
  checklistScore: number; // 0-100
  maturityScore: number; // 1-5
  maturityLevel: MaturityLevel;
  checklistData: ChecklistState;
  maturityData: MaturityState;
}

export interface AiAnalysis {
  summary: string;
  recommendations: string[];
  loading: boolean;
  error: string | null;
}

// Risk Assessment Types

export type RiskLevel = 'Baixo' | 'Médio' | 'Alto' | 'Crítico';

export interface RiskItem {
  id: string;
  process: string;
  hazard: string;
  probability: number; // 1-5
  severity: number; // 1-5
  level: RiskLevel;
  score: number;
  sourceModelId?: string; // Link to PGRModelItem
}

export interface AprItem {
  step: string;
  hazard: string;
  cause: string;
  consequence: string;
  category: string;
  control: string;
}

export interface RootCauseAnalysis {
  incident: string;
  whys: string[]; // 5 whys
  rootCause: string;
  recommendation: string;
}

// Training Types

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface PracticalChecklistItem {
  criteria: string;
  critical: boolean; // If false here, instant fail
}

export interface TrainingFeedback {
  instructorRating: number; // 1-5 (Didática)
  contentRating: number; // 1-5 (Conteúdo)
  materialRating: number; // 1-5 (Material de apoio)
  comment: string;
}

export interface Student {
  id: string;
  name: string;
  cpf: string;
  role?: string; // Cargo/Função
  preScore: number;
  postScore: number;
  retentionScore?: number; // Score from fixation test months later
  attendance: number; // percentage
  status: 'APPROVED' | 'REPROVED' | 'PENDING';
  feedback?: TrainingFeedback; // New field
}

export interface TrainingSession {
  id: string;
  name: string;
  date: string;
  instructor: string;
  students: Student[];
}

// Culture & Ergo Types

export interface ClimateQuestion {
  id: string;
  statement: string;
  category: 'Liderança' | 'Participação' | 'Gestão de Riscos';
}

export interface PsychosocialRisk {
  factor: string;
  description: string;
  mitigation: string;
}

export interface SurveyQuestion {
  question: string;
  objective: string;
}

// Mental Health Types

export interface MentalHealthQuestion {
  id: string;
  category: 'Carga de Trabalho' | 'Autonomia' | 'Apoio Social' | 'Bem-estar';
  question: string;
  reverseScore?: boolean; // If true, 5 is BAD and 1 is GOOD.
}

export interface MentalHealthThermometerItem {
  id: string;
  question: string;
}

export interface MentalHealthState {
  answers: Record<string, number>; // 1-5
  thermometer: Record<string, number>; // 1-5 (Frequency)
}

// Action Plan Types
export interface ActionPlanItem {
    id: string;
    origin: 'NR1_DIAG' | 'RISK_ASSESSMENT' | 'CULTURE' | 'TRAINING' | 'PSYCHOSOCIAL';
    description: string;
    responsible: string;
    deadline: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'TODO' | 'DOING' | 'DONE';
}
