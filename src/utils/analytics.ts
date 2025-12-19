import { ACTIVITY_THRESHOLDS, SCORE_WEIGHTS } from '../config.js';
import { withRetry } from './retry.js';
import type {
  OctokitInstance,
  RepoAnalysis,
  PRStats,
  IssueResponseStats
} from '../types/index.js';

/**
 * Calculate activity score based on last commit
 */
function calculateActivityScore(lastActivityDays: number | null): number {
  if (lastActivityDays === null) return 0;

  if (lastActivityDays < ACTIVITY_THRESHOLDS.VERY_ACTIVE) return 10;
  if (lastActivityDays < ACTIVITY_THRESHOLDS.ACTIVE) return 8;
  if (lastActivityDays < ACTIVITY_THRESHOLDS.MODERATE) return 5;
  if (lastActivityDays < ACTIVITY_THRESHOLDS.INACTIVE) return 3;
  return 1;
}

/**
 * Calculate stars score (logarithmic scale)
 */
function calculateStarsScore(stars: number): number {
  if (stars < 10) return 1;
  if (stars < 50) return 3;
  if (stars < 100) return 4;
  if (stars < 500) return 6;
  if (stars < 1000) return 7;
  if (stars < 5000) return 8;
  if (stars < 10000) return 9;
  return 10;
}

/**
 * Calculate issues health score
 */
function calculateIssuesScore(
  openIssues: number,
  goodFirstIssues: number
): number {
  // Having good first issues is very positive
  const goodFirstScore = Math.min(goodFirstIssues * 2, 5);

  // Too many open issues might indicate maintenance problems
  let openIssuesScore = 5;
  if (openIssues < 10) openIssuesScore = 5;
  else if (openIssues < 50) openIssuesScore = 4;
  else if (openIssues < 100) openIssuesScore = 3;
  else if (openIssues < 500) openIssuesScore = 2;
  else openIssuesScore = 1;

  return Math.min(goodFirstScore + openIssuesScore, 10);
}

/**
 * Calculate overall activity score for a repository
 */
export function calculateOverallScore(repoData: RepoAnalysis): number {
  const activityScore = calculateActivityScore(repoData.lastActivity);
  const starsScore = calculateStarsScore(repoData.stars);
  const issuesScore = calculateIssuesScore(
    repoData.openIssues,
    repoData.goodFirstIssues.length
  );
  const contributingScore = repoData.hasContributing ? 10 : 0;
  const goodFirstIssuesScore = Math.min(repoData.goodFirstIssues.length * 2, 10);

  const overall =
    activityScore * SCORE_WEIGHTS.ACTIVITY +
    starsScore * SCORE_WEIGHTS.STARS +
    issuesScore * SCORE_WEIGHTS.ISSUES +
    contributingScore * SCORE_WEIGHTS.CONTRIBUTING +
    goodFirstIssuesScore * SCORE_WEIGHTS.GOOD_FIRST_ISSUES;

  return Math.round(overall * 10) / 10;
}

/**
 * Get pull request statistics for a repository
 */
export async function getPRStats(
  octokit: OctokitInstance,
  owner: string,
  repo: string
): Promise<PRStats> {
  try {
    const prStats = await withRetry(async () => {
      // Get recent closed PRs to calculate average time to merge
      const { data: closedPRs } = await octokit.rest.pulls.list({
        owner,
        repo,
        state: 'closed',
        per_page: 10,
        sort: 'updated',
        direction: 'desc'
      });

      const mergedPRs = closedPRs.filter(pr => pr.merged_at);

      if (mergedPRs.length === 0) {
        return {
          avgMergeTime: null,
          mergedCount: 0
        };
      }

      const mergeTimes = mergedPRs.map(pr => {
        const created = new Date(pr.created_at);
        const merged = new Date(pr.merged_at!);
        return (merged.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      });

      const avgMergeTime = mergeTimes.reduce((a, b) => a + b, 0) / mergeTimes.length;

      return {
        avgMergeTime: Math.round(avgMergeTime * 10) / 10,
        mergedCount: mergedPRs.length
      };
    }, 'Fetching PR statistics');

    return prStats;
  } catch (error) {
    return {
      avgMergeTime: null,
      mergedCount: 0
    };
  }
}

/**
 * Get issue response time statistics
 */
export async function getIssueResponseStats(
  octokit: OctokitInstance,
  owner: string,
  repo: string
): Promise<IssueResponseStats> {
  try {
    const stats = await withRetry(async () => {
      const { data: recentIssues } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'all',
        per_page: 20,
        sort: 'updated',
        direction: 'desc'
      });

      const responseTimes: number[] = [];

      for (const issue of recentIssues) {
        // Get first comment (response)
        if (issue.comments > 0) {
          const { data: comments } = await octokit.rest.issues.listComments({
            owner,
            repo,
            issue_number: issue.number,
            per_page: 1
          });

          if (comments.length > 0) {
            const created = new Date(issue.created_at);
            const firstResponse = new Date(comments[0].created_at);
            const responseTime = (firstResponse.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
            responseTimes.push(responseTime);
          }
        }
      }

      if (responseTimes.length === 0) {
        return {
          avgResponseTime: null,
          responseRate: 0
        };
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;

      return {
        avgResponseTime: Math.round(avgResponseTime * 10) / 10,
        responseRate: Math.round((responseTimes.length / recentIssues.length) * 100)
      };
    }, 'Fetching issue response statistics');

    return stats;
  } catch (error) {
    return {
      avgResponseTime: null,
      responseRate: 0
    };
  }
}

/**
 * Get contributors count
 */
export async function getContributorsCount(
  octokit: OctokitInstance,
  owner: string,
  repo: string
): Promise<string | null> {
  try {
    const count = await withRetry(async () => {
      const { data: contributors } = await octokit.rest.repos.listContributors({
        owner,
        repo,
        per_page: 1
      });

      // GitHub doesn't return total count directly, so we check the Link header
      // For simplicity, we'll just return a rough estimate
      return contributors.length > 0 ? '10+' : '0';
    }, 'Fetching contributors count');

    return count;
  } catch (error) {
    return null;
  }
}

/**
 * Check if repository has CODE_OF_CONDUCT.md
 */
export async function hasCodeOfConduct(
  octokit: OctokitInstance,
  owner: string,
  repo: string
): Promise<boolean> {
  try {
    await withRetry(async () => {
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'CODE_OF_CONDUCT.md'
      });
    }, 'Checking for CODE_OF_CONDUCT.md');
    return true;
  } catch {
    return false;
  }
}

/**
 * Get repository license
 */
export function getLicense(repo: { license?: { name: string } | null }): string | null {
  return repo.license ? repo.license.name : null;
}
