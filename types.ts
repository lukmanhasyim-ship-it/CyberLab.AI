
export interface UserProfile {
  name: string;
  grade: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface QuizQuestion {
  type: 'MCQ' | 'ESSAY'; // New field to distinguish type
  difficulty: 'LOTS' | 'HOTS'; // New field for difficulty classification
  question: string;
  options?: string[]; // Optional, only for MCQ
  correctAnswerIndex?: number; // Optional, only for MCQ
  explanation?: string; // Used for MCQ feedback
  answerKey?: string; // New field for Essay model answer
}

export interface QuizResult {
  score: number;
  total: number;
  feedback: string;
}

export interface QuizHistory {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export interface StudyMaterialSection {
  subtitle: string;
  content: string;
}

export interface StudyMaterial {
  topic: string;
  introduction: string;
  learningObjectives: string[]; // Added Learning Objectives
  sections: StudyMaterialSection[];
  summary: string;
  imageUrl?: string;
  quiz: QuizQuestion[];
  standards?: string[]; // SKKNI / CP / UU References
  youtubeUrl?: string; // Optional video link
}

export interface GameOption {
  text: string;
  isCorrect: boolean;
  impact: string;
}

export interface GameScenario {
  id: string;
  topic: string;
  situation: string;
  options: GameOption[];
  severity: 'LOW' | 'MEDIUM' | 'CRITICAL';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface GameLevel {
  rank: string;
  minScore: number;
  color: string;
}

// SOC Simulator Types
export interface SOCAlert {
  id: string;
  title: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceIp: string;
  destinationIp: string;
  logPayload: string;
  hash?: string; // For malware checks
  isTruePositive: boolean; // The correct answer
  analysisReport: string; // Explanation from AI
}

// KC7 / Blue Team Investigation Types
export interface KC7Log {
  id: number;
  timestamp: string;
  source: string;
  event: string;
  details: string;
  isSuspicious: boolean;
}

export interface KC7Case {
  title: string;
  description: string;
  queryQuestion: string;
  logs: KC7Log[];
  explanation: string;
}

// Red Team Ops Types
export interface RedTeamTool {
  id: string;
  name: string; // e.g., "Nmap", "Hydra", "SQLMap"
  description: string;
  type: 'SCAN' | 'EXPLOIT';
}

export interface RedTeamMission {
  id: string;
  targetName: string;
  targetIp: string;
  os: string;
  description: string;
  openPorts: string[]; // e.g., ["22/tcp (SSH)", "80/tcp (HTTP)"]
  vulnerability: string; // Hidden info regarding what is vulnerable
  availableTools: RedTeamTool[];
  correctToolId: string; // The tool that successfully exploits the vulnerability
  successMessage: string;
  failureMessage: string;
}

export enum AppScreen {
  LOGIN = 'LOGIN',
  DASHBOARD = 'DASHBOARD',
  CHAT = 'CHAT',
  QUIZ = 'QUIZ',
  REPORT = 'REPORT',
  LEARN = 'LEARN',
  GAME_CENTER = 'GAME_CENTER',
  GAME = 'GAME',
  GAME_WORD = 'GAME_WORD',
  GAME_DATA_HUNTER = 'GAME_DATA_HUNTER',
  GAME_LETS_DEFEND = 'GAME_LETS_DEFEND',
  GAME_RED_TEAM = 'GAME_RED_TEAM',
  GAME_KC7 = 'GAME_KC7'
}