import { Octokit } from 'octokit';

export interface SearchParams {
  keywords: string;
  language: string;
  minStars: number;
  maxResults: number;
  license: string | null;
  minForks: number | null;
  requireGoodFirstIssues: boolean;
}

export interface UserConfig {
  minStars: number;
  maxResults: number;
  language: string;
  saveResults: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  retryAttempts: number;
  retryDelay: number;
  searchHistory?: SearchHistoryEntry[];
}

export interface SearchHistoryEntry extends SearchParams {
  timestamp: number;
}

export interface CacheData<T = unknown> {
  timestamp: number;
  params: SearchParams;
  data: T;
}

export interface CacheStats {
  files: number;
  size: number;
  sizeFormatted: string;
}

export interface GoodFirstIssue {
  title: string;
  html_url: string;
  number: number;
  created_at: string;
  comments: number;
}

export interface PRStats {
  avgMergeTime: number | null;
  mergedCount: number;
}

export interface IssueResponseStats {
  avgResponseTime: number | null;
  responseRate: number;
}

export interface RepoAnalysis {
  name: string;
  description: string;
  stars: number;
  language: string | null;
  lastActivity: number | null;
  active: boolean;
  url: string;
  openIssues: number;
  forks: number;
  hasContributing: boolean;
  hasCodeOfConduct: boolean;
  license: string | null;
  contributorsCount: string | number | null;
  goodFirstIssues: GoodFirstIssue[];
  topics: string[];
  activityScore?: number;
  prStats?: PRStats;
  issueResponseStats?: IssueResponseStats;
}

export interface LicenseOption {
  name: string;
  value: string | null;
}

export interface ActivityThresholds {
  VERY_ACTIVE: number;
  ACTIVE: number;
  MODERATE: number;
  INACTIVE: number;
}

export interface ScoreWeights {
  STARS: number;
  ACTIVITY: number;
  ISSUES: number;
  CONTRIBUTING: number;
  GOOD_FIRST_ISSUES: number;
}

export interface FileOutputs {
  JSON: string;
  MARKDOWN: string;
  CSV: string;
  HTML: string;
}

export type OctokitInstance = Octokit;

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'html';

export interface InquirerAnswers {
  keywords: string;
  language: string;
  license: string | null;
  minStars: number;
  minForks: number;
  maxResults: number;
  enableAdvancedStats: boolean;
  saveResults: boolean;
  interactiveMode: boolean;
  requireGoodFirstIssues: boolean;
  showOnlyActive: boolean;
}

export interface ExportFormatsAnswer {
  exportFormats: ExportFormat[];
}

export interface InteractiveChoiceValue {
  action: number | 'exit';
}

export interface RepoActionAnswer {
  repoAction: 'open-repo' | 'open-issues' | 'details' | 'back';
}
