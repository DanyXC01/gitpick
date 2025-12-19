import type { SearchParams } from '../types/index.js';

/**
 * Quick search templates for common use cases
 */

export interface QuickTemplate {
  name: string;
  description: string;
  params: Partial<SearchParams>;
}

export const QUICK_TEMPLATES: Record<string, QuickTemplate> = {
  trending: {
    name: 'Trending',
    description: 'Trending repositories this week',
    params: {
      keywords: 'created:>2024-12-01',
      minStars: 500,
      maxResults: 20,
      requireGoodFirstIssues: false,
      language: 'TypeScript'
    }
  },
  beginner: {
    name: 'Beginner Friendly',
    description: 'Perfect projects for beginners',
    params: {
      keywords: 'good-first-issue',
      minStars: 100,
      maxResults: 30,
      requireGoodFirstIssues: true,
      minForks: 10
    }
  },
  active: {
    name: 'Super Active',
    description: 'Highly active projects with recent commits',
    params: {
      keywords: 'pushed:>2024-12-01',
      minStars: 500,
      maxResults: 20,
      requireGoodFirstIssues: false
    }
  },
  small: {
    name: 'Small Projects',
    description: 'Growing projects (100-1000 stars)',
    params: {
      keywords: 'stars:100..1000',
      minStars: 100,
      maxResults: 25,
      requireGoodFirstIssues: true
    }
  },
  hacktoberfest: {
    name: 'Hacktoberfest',
    description: 'Hacktoberfest-ready repositories',
    params: {
      keywords: 'hacktoberfest topic:hacktoberfest',
      minStars: 50,
      maxResults: 30,
      requireGoodFirstIssues: true
    }
  }
};

/**
 * Get template by name
 */
export function getTemplate(name: string): QuickTemplate | null {
  return QUICK_TEMPLATES[name] || null;
}

/**
 * List all available templates
 */
export function listTemplates(): QuickTemplate[] {
  return Object.values(QUICK_TEMPLATES);
}
