import type {
  UserConfig,
  LicenseOption,
  ActivityThresholds,
  ScoreWeights,
  FileOutputs
} from './types/index.js';

export const LANGUAGES: string[] = [
  'TypeScript',
  'JavaScript',
  'Python',
  'Go',
];

export const LICENSES: LicenseOption[] = [
  { name: 'Any', value: null },
  { name: 'MIT', value: 'mit' },
  { name: 'Apache 2.0', value: 'apache-2.0' },
  { name: 'GPL 3.0', value: 'gpl-3.0' },
  { name: 'BSD 3-Clause', value: 'bsd-3-clause' },
  { name: 'ISC', value: 'isc' },
  { name: 'Mozilla Public License 2.0', value: 'mpl-2.0' }
];

export const DEFAULT_CONFIG: UserConfig = {
  minStars: 100,
  maxResults: 5,
  language: 'TypeScript',
  saveResults: true,
  cacheEnabled: true,
  cacheTTL: 3600000, // 1 hour in milliseconds
  retryAttempts: 3,
  retryDelay: 1000 // initial delay in milliseconds
};

export const CACHE_DIR = '.repo-finder-cache';
export const CONFIG_FILE = '.repo-finder.config.json';

export const ACTIVITY_THRESHOLDS: ActivityThresholds = {
  VERY_ACTIVE: 7,    // < 7 days
  ACTIVE: 30,        // < 30 days
  MODERATE: 90,      // < 90 days
  INACTIVE: 180      // < 180 days
};

export const SCORE_WEIGHTS: ScoreWeights = {
  STARS: 0.2,
  ACTIVITY: 0.3,
  ISSUES: 0.15,
  CONTRIBUTING: 0.15,
  GOOD_FIRST_ISSUES: 0.2
};

export const FILE_OUTPUTS: FileOutputs = {
  JSON: 'repos-results.json',
  MARKDOWN: 'repos-report.md',
  CSV: 'repos-results.csv',
  HTML: 'repos-report.html'
};
