#!/usr/bin/env node

import { Octokit } from 'octokit';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora, { Ora } from 'ora';
import open from 'open';
import cliProgress from 'cli-progress';
import minimist from 'minimist';
import { LANGUAGES, LICENSES, DEFAULT_CONFIG } from './config.js';
import { getCache, setCache, getCacheStats } from './utils/cache.js';
import { loadUserConfig, addToHistory, getSearchHistory } from './utils/userConfig.js';
import { withRetry } from './utils/retry.js';
import { exportToJSON, exportToMarkdown, exportToCSV, exportToHTML } from './utils/export.js';
import {
  calculateOverallScore,
  getPRStats,
  getIssueResponseStats,
  getContributorsCount,
  hasCodeOfConduct,
  getLicense
} from './utils/analytics.js';
import { getTemplate, listTemplates } from './utils/templates.js';
import {
  loadBookmarks,
  addBookmark,
  removeBookmark,
  getBookmark,
  isBookmarked
} from './utils/bookmarks.js';
import {
  createColoredBar,
  createHealthIndicator,
  visualizeActivity,
  formatLargeNumber,
  formatNumberWithColor,
  createBadge,
  getScoreColor
} from './utils/visualEffects.js';
import {
  forkRepository,
  starRepository,
  cloneRepository,
  watchRepository,
  checkIfStarred
} from './utils/githubActions.js';
import type {
  SearchParams,
  RepoAnalysis,
  GoodFirstIssue,
  InquirerAnswers,
  ExportFormatsAnswer,
  InteractiveChoiceValue,
  RepoActionAnswer
} from './types/index.js';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN // optional, but increases rate limit from 60 to 5000 requests/hour
});

interface GitHubRepo {
  full_name: string;
  name: string;
  owner: {
    login: string;
  };
  description: string | null;
  stargazers_count: number;
  language: string | null;
  html_url: string;
  open_issues_count: number;
  forks_count: number;
  topics: string[];
  license?: {
    name: string;
  } | null;
}

/**
 * Parse GitHub URL to extract owner and repo
 */
function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    // Support formats:
    // - https://github.com/owner/repo
    // - github.com/owner/repo
    // - owner/repo
    const cleaned = url.replace(/^https?:\/\//, '').replace(/^github\.com\//, '');
    const parts = cleaned.split('/').filter(p => p.length > 0);

    if (parts.length >= 2) {
      return {
        owner: parts[0],
        repo: parts[1].replace(/\.git$/, '') // Remove .git if present
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Get repository by URL
 */
async function getRepoByUrl(url: string): Promise<GitHubRepo | null> {
  const parsed = parseGitHubUrl(url);
  if (!parsed) {
    return null;
  }

  try {
    const { data } = await withRetry(async () => {
      return await octokit.rest.repos.get({
        owner: parsed.owner,
        repo: parsed.repo
      });
    }, 'Fetching repository');

    return data as GitHubRepo;
  } catch (error) {
    return null;
  }
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║                    🔍 GitPick 🔍                       ║'));
  console.log(chalk.blue.bold('║         Find & Analyze GitHub Repos for Contributors  ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.cyan.bold('Basic Usage:'));
  console.log('  gitpick                    Start interactive search mode');
  console.log('  gitpick -a <url>           Analyze specific repository');
  console.log('  gitpick -h, --help         Show this help message\n');

  console.log(chalk.cyan.bold('Quick Templates:'));
  console.log('  gitpick --trending         Trending repos this week');
  console.log('  gitpick --beginner         Perfect for beginners');
  console.log('  gitpick --active           Super active projects');
  console.log('  gitpick --small            Small projects (100-1K stars)');
  console.log('  gitpick --hacktoberfest    Hacktoberfest-ready repos\n');

  console.log(chalk.cyan.bold('Bookmarks:'));
  console.log('  gitpick --bookmarks        Show all bookmarked repos');
  console.log('  gitpick --bookmark <name>  Open bookmarked repo');
  console.log('  gitpick -a <url> --save    Analyze and save to bookmarks\n');

  console.log(chalk.cyan.bold('History:'));
  console.log('  gitpick --history          Show recent searches');
  console.log('  gitpick --repeat <n>       Repeat nth search from history\n');

  console.log(chalk.cyan.bold('GitHub Actions (requires GITHUB_TOKEN):'));
  console.log('  gitpick -a <url> --fork    Fork the repository');
  console.log('  gitpick -a <url> --star    Star the repository');
  console.log('  gitpick -a <url> --clone   Clone locally');
  console.log('  gitpick -a <url> --watch   Watch for updates\n');

  console.log(chalk.cyan.bold('Comparison:'));
  console.log('  gitpick --compare <repos>  Compare multiple repos');
  console.log('  Example: gitpick --compare react,vue,svelte\n');

  console.log(chalk.cyan.bold('Features:'));
  console.log('  🔍 Smart search with advanced filtering');
  console.log('  📊 Activity scoring with visual indicators');
  console.log('  ⚡ Intelligent caching');
  console.log('  🎯 Quick templates for common searches');
  console.log('  📈 Deep analytics and health metrics');
  console.log('  💾 Bookmarks and search history');
  console.log('  🔄 GitHub integration (fork, star, clone)\n');

  console.log(chalk.yellow('Set GITHUB_TOKEN for higher rate limits:'));
  console.log(chalk.gray('  export GITHUB_TOKEN=your_token_here\n'));
}

/**
 * Analyze mode - analyze a specific repository
 */
async function analyzeMode(
  url: string,
  options: {
    save?: boolean;
    fork?: boolean;
    star?: boolean;
    clone?: boolean;
    watch?: boolean;
  } = {}
): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║              🔍 GitPick - Analyze Mode 🔍              ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  const spinner = ora('Fetching repository...').start();

  try {
    const repo = await getRepoByUrl(url);

    if (!repo) {
      spinner.fail(chalk.red('Failed to fetch repository. Check the URL and try again.'));
      console.log(chalk.yellow('\nValid URL formats:'));
      console.log('  - https://github.com/owner/repo');
      console.log('  - github.com/owner/repo');
      console.log('  - owner/repo\n');
      return;
    }

    spinner.text = `Analyzing ${repo.full_name}...`;

    const analysis = await analyzeRepo(repo, null, true);

    spinner.succeed(chalk.green('Analysis complete!\n'));

    // Display results
    displayRepo(analysis, 1);

    // Check if already bookmarked
    const bookmarked = await isBookmarked(analysis.name);
    if (bookmarked) {
      console.log(chalk.yellow('\n⭐ This repository is in your bookmarks\n'));
    }

    // Handle GitHub actions
    if (options.fork || options.star || options.clone || options.watch) {
      const parsed = parseGitHubUrl(url);
      if (parsed && process.env.GITHUB_TOKEN) {
        console.log(chalk.cyan('\n🔄 Performing GitHub actions...\n'));

        if (options.fork) {
          const result = await forkRepository(octokit, parsed.owner, parsed.repo);
          console.log(result.success ? chalk.green(`✓ ${result.message}`) : chalk.red(`✗ ${result.message}`));
        }

        if (options.star) {
          const result = await starRepository(octokit, parsed.owner, parsed.repo);
          console.log(result.success ? chalk.green(`✓ ${result.message}`) : chalk.red(`✗ ${result.message}`));
        }

        if (options.watch) {
          const result = await watchRepository(octokit, parsed.owner, parsed.repo);
          console.log(result.success ? chalk.green(`✓ ${result.message}`) : chalk.red(`✗ ${result.message}`));
        }

        if (options.clone) {
          const result = await cloneRepository(analysis.url);
          console.log(result.success ? chalk.green(`✓ ${result.message}`) : chalk.red(`✗ ${result.message}`));
        }

        console.log();
      } else if (!process.env.GITHUB_TOKEN) {
        console.log(chalk.yellow('\n⚠️  GITHUB_TOKEN required for GitHub actions\n'));
      }
    }

    // Save to bookmarks
    if (options.save) {
      try {
        await addBookmark(analysis);
        console.log(chalk.green('✓ Saved to bookmarks\n'));
      } catch (error) {
        console.log(chalk.yellow(`⚠️  ${(error as Error).message}\n`));
      }
    }

    // Interactive menu if no actions specified
    if (!options.fork && !options.star && !options.clone && !options.watch && !options.save) {
      const choices = [
        { name: '🌐 Open repository in browser', value: 'open' },
        { name: '💡 Open good first issues page', value: 'issues' },
      ];

      if (!bookmarked) {
        choices.push({ name: '💾 Save to bookmarks', value: 'save' });
      }

      if (process.env.GITHUB_TOKEN) {
        const parsed = parseGitHubUrl(url);
        if (parsed) {
          const isStarred = await checkIfStarred(octokit, parsed.owner, parsed.repo);
          choices.push({ name: isStarred ? '⭐ Unstar repository' : '⭐ Star repository', value: 'star' });
          choices.push({ name: '🔱 Fork repository', value: 'fork' });
          choices.push({ name: '📥 Clone locally', value: 'clone' });
        }
      }

      choices.push({ name: '← Exit', value: 'exit' });

      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '\nWhat would you like to do?',
          choices
        }
      ]);

      if (action === 'open') {
        await open(analysis.url);
        console.log(chalk.green(`\n✅ Opened ${analysis.name} in browser\n`));
      } else if (action === 'issues') {
        const issuesUrl = `${analysis.url}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`;
        await open(issuesUrl);
        console.log(chalk.green(`\n✅ Opened good first issues in browser\n`));
      } else if (action === 'save') {
        try {
          await addBookmark(analysis);
          console.log(chalk.green('\n✅ Saved to bookmarks\n'));
        } catch (error) {
          console.log(chalk.yellow(`\n⚠️  ${(error as Error).message}\n`));
        }
      } else if (action === 'star' || action === 'fork' || action === 'clone') {
        const parsed = parseGitHubUrl(url);
        if (parsed) {
          if (action === 'star') {
            const isStarred = await checkIfStarred(octokit, parsed.owner, parsed.repo);
            const result = isStarred
              ? await starRepository(octokit, parsed.owner, parsed.repo)
              : await starRepository(octokit, parsed.owner, parsed.repo);
            console.log(result.success ? chalk.green(`\n✅ ${result.message}\n`) : chalk.red(`\n❌ ${result.message}\n`));
          } else if (action === 'fork') {
            const result = await forkRepository(octokit, parsed.owner, parsed.repo);
            console.log(result.success ? chalk.green(`\n✅ ${result.message}\n`) : chalk.red(`\n❌ ${result.message}\n`));
          } else if (action === 'clone') {
            const result = await cloneRepository(analysis.url);
            console.log(result.success ? chalk.green(`\n✅ ${result.message}\n`) : chalk.red(`\n❌ ${result.message}\n`));
          }
        }
      }
    }

  } catch (error) {
    spinner.fail('Analysis error');
    console.error(chalk.red(`\n❌ ${(error as Error).message}\n`));
  }
}

/**
 * Search repositories
 */
async function searchRepos(searchParams: SearchParams): Promise<GitHubRepo[]> {
  const {
    keywords,
    language,
    minStars = 100,
    maxResults = 10,
    license = null,
    minForks = null,
    requireGoodFirstIssues = true
  } = searchParams;

  let query = `${keywords} language:${language} stars:>${minStars}`;

  if (requireGoodFirstIssues) {
    query += ' good-first-issues:>1';
  }

  if (license) {
    query += ` license:${license}`;
  }

  if (minForks) {
    query += ` forks:>${minForks}`;
  }

  try {
    const result = await withRetry(async () => {
      const { data } = await octokit.rest.search.repos({
        q: query,
        sort: 'updated',
        order: 'desc',
        per_page: maxResults
      });
      return data.items as GitHubRepo[];
    }, 'Searching repositories');

    return result;
  } catch (error) {
    const apiError = error as { status?: number };
    if (apiError.status === 403) {
      console.log(chalk.red('\n❌ Rate limit exceeded. Set GITHUB_TOKEN to increase limit:'));
      console.log(chalk.yellow('export GITHUB_TOKEN=your_token_here\n'));
    }
    throw error;
  }
}

/**
 * Get good first issues for repository
 */
async function getGoodFirstIssues(
  owner: string,
  repo: string
): Promise<GoodFirstIssue[]> {
  try {
    const data = await withRetry(async () => {
      const { data } = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        labels: 'good first issue,help wanted',
        state: 'open',
        per_page: 5
      });
      return data as GoodFirstIssue[];
    }, 'Fetching good first issues');

    return data;
  } catch (error) {
    return [];
  }
}

/**
 * Check for CONTRIBUTING.md
 */
async function hasContributingGuide(owner: string, repo: string): Promise<boolean> {
  try {
    await withRetry(async () => {
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path: 'CONTRIBUTING.md'
      });
    }, 'Checking for CONTRIBUTING.md');
    return true;
  } catch {
    return false;
  }
}

/**
 * Analyze repository
 */
async function analyzeRepo(
  repo: GitHubRepo,
  progressBar: cliProgress.SingleBar | null,
  enableAdvancedStats: boolean = false
): Promise<RepoAnalysis> {
  const owner = repo.owner.login;
  const name = repo.name;

  if (progressBar) {
    progressBar.update({ task: `Analyzing ${repo.full_name}...` });
  }

  // Get last commit
  let lastCommitDays: number | null = null;
  try {
    const commits = await withRetry(async () => {
      const { data: commits } = await octokit.rest.repos.listCommits({
        owner,
        repo: name,
        per_page: 1
      });
      return commits;
    }, 'Fetching last commit');

    if (commits.length > 0) {
      const lastCommitDate = new Date(commits[0].commit.author?.date || Date.now());
      lastCommitDays = Math.floor((Date.now() - lastCommitDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } catch (error) {
    lastCommitDays = null;
  }

  // Get issues
  const issues = await getGoodFirstIssues(owner, name);

  // Check CONTRIBUTING.md
  const hasContributing = await hasContributingGuide(owner, name);

  // Check CODE_OF_CONDUCT.md
  const hasCodeOfConductFile = await hasCodeOfConduct(octokit, owner, name);

  // Get license
  const license = getLicense(repo);

  // Get contributors count
  const contributorsCount = await getContributorsCount(octokit, owner, name);

  const analysis: RepoAnalysis = {
    name: repo.full_name,
    description: repo.description || 'No description',
    stars: repo.stargazers_count,
    language: repo.language,
    lastActivity: lastCommitDays,
    active: lastCommitDays !== null && lastCommitDays < 30,
    url: repo.html_url,
    openIssues: repo.open_issues_count,
    forks: repo.forks_count,
    hasContributing,
    hasCodeOfConduct: hasCodeOfConductFile,
    license,
    contributorsCount,
    goodFirstIssues: issues,
    topics: repo.topics || []
  };

  // Advanced statistics (optional, takes more API calls)
  if (enableAdvancedStats) {
    const prStats = await getPRStats(octokit, owner, name);
    const issueStats = await getIssueResponseStats(octokit, owner, name);

    analysis.prStats = prStats;
    analysis.issueResponseStats = issueStats;
  }

  // Calculate overall score
  analysis.activityScore = calculateOverallScore(analysis);

  return analysis;
}

/**
 * Display results with enhanced visuals
 */
function displayRepo(analysis: RepoAnalysis, index: number): void {
  console.log(chalk.blue.bold(`\n${'='.repeat(80)}`));

  // Header with score and badge
  let header = `\n${index}. 📦 ${analysis.name}`;

  // Add activity score with colored bar
  if (analysis.activityScore) {
    const scoreColor = getScoreColor(analysis.activityScore);
    const scoreBar = createColoredBar(analysis.activityScore, 10);
    header += ` ${scoreBar} ${scoreColor.bold(`${analysis.activityScore.toFixed(1)}/10`)}`;
  }

  // Add badges for special conditions
  const badges: string[] = [];
  if (analysis.active && analysis.lastActivity !== null && analysis.lastActivity < 7) {
    badges.push(createBadge('🔥 HOT', 'red'));
  }
  if (analysis.goodFirstIssues.length >= 5) {
    badges.push(createBadge('BEGINNER FRIENDLY', 'green'));
  }
  if (analysis.stars >= 10000) {
    badges.push(createBadge('⭐ POPULAR', 'yellow'));
  }

  console.log(chalk.green.bold(header));
  if (badges.length > 0) {
    console.log(`   ${badges.join(' ')}`);
  }
  console.log(chalk.gray(`   ${analysis.description}`));

  // Metrics with improved formatting
  const metrics: string[] = [];

  // Stars with color coding
  const starsColored = formatNumberWithColor(analysis.stars, { low: 100, medium: 1000, high: 5000 });
  metrics.push(`⭐ ${starsColored}`);

  metrics.push(`💻 ${analysis.language || 'N/A'}`);

  // Activity visualization
  if (analysis.lastActivity !== null) {
    const activityViz = visualizeActivity(analysis.lastActivity);
    metrics.push(activityViz);
  }

  metrics.push(`🐛 ${analysis.openIssues} issues`);

  if (analysis.forks) {
    metrics.push(`🔱 ${formatLargeNumber(analysis.forks)} forks`);
  }

  if (analysis.contributorsCount) {
    metrics.push(`👥 ${analysis.contributorsCount} contributors`);
  }

  console.log(`\n   ${metrics.join(' | ')}`);

  // Community Health Score
  console.log(`\n   Community Health:`);
  console.log(`   ${createHealthIndicator(
    analysis.hasContributing,
    analysis.hasCodeOfConduct,
    analysis.license !== null,
    analysis.goodFirstIssues.length
  )}`);

  // Features
  const features: string[] = [];
  if (analysis.hasContributing) {
    features.push(chalk.cyan('📋 CONTRIBUTING.md'));
  }
  if (analysis.hasCodeOfConduct) {
    features.push(chalk.cyan('📜 CODE_OF_CONDUCT.md'));
  }
  if (analysis.license) {
    features.push(chalk.cyan(`⚖️  ${analysis.license}`));
  }

  if (features.length > 0) {
    console.log(`   ${features.join(' | ')}`);
  }

  // Advanced stats
  if (analysis.prStats && analysis.prStats.avgMergeTime !== null) {
    console.log(chalk.blue(`   📊 Avg PR merge time: ${analysis.prStats.avgMergeTime} days`));
  }

  if (analysis.issueResponseStats && analysis.issueResponseStats.avgResponseTime !== null) {
    console.log(chalk.blue(`   ⏱️  Avg issue response: ${analysis.issueResponseStats.avgResponseTime} hours (${analysis.issueResponseStats.responseRate}% response rate)`));
  }

  // Topics/Tags
  if (analysis.topics.length > 0) {
    console.log(chalk.magenta(`   🏷️  ${analysis.topics.slice(0, 5).join(', ')}`));
  }

  // Good first issues
  if (analysis.goodFirstIssues.length > 0) {
    console.log(chalk.yellow.bold(`\n   💡 Good First Issues (${analysis.goodFirstIssues.length}):`));
    analysis.goodFirstIssues.slice(0, 3).forEach((issue, i) => {
      console.log(chalk.yellow(`      ${i + 1}. ${issue.title}`));
      console.log(chalk.gray(`         ${issue.html_url}`));
    });
  } else {
    console.log(chalk.gray('\n   💡 No good first issues at the moment'));
  }

  console.log(chalk.cyan(`\n   🔗 ${analysis.url}`));
}

/**
 * Interactive mode for browsing results
 */
async function interactiveMode(results: RepoAnalysis[]): Promise<void> {
  while (true) {
    const choices: Array<{ name: string; value: number | 'exit' } | inquirer.Separator> = results.map((repo, index) => ({
      name: `${index + 1}. ${repo.name} [${repo.activityScore}/10] - ${repo.goodFirstIssues.length} good first issues`,
      value: index
    }));

    choices.push(
      new inquirer.Separator(),
      { name: 'Exit interactive mode', value: 'exit' as const }
    );

    const { action } = await inquirer.prompt<InteractiveChoiceValue>([
      {
        type: 'list',
        name: 'action',
        message: 'Select a repository to interact with:',
        choices,
        pageSize: 15
      }
    ]);

    if (action === 'exit') {
      break;
    }

    const selectedRepo = results[action];

    const { repoAction } = await inquirer.prompt<RepoActionAnswer>([
      {
        type: 'list',
        name: 'repoAction',
        message: `What would you like to do with ${selectedRepo.name}?`,
        choices: [
          { name: '🌐 Open repository in browser', value: 'open-repo' as const },
          { name: '💡 Open good first issues page', value: 'open-issues' as const },
          { name: '📋 Show full details', value: 'details' as const },
          { name: '← Go back', value: 'back' as const }
        ]
      }
    ]);

    if (repoAction === 'open-repo') {
      await open(selectedRepo.url);
      console.log(chalk.green(`\n✅ Opened ${selectedRepo.name} in browser\n`));
    } else if (repoAction === 'open-issues') {
      const issuesUrl = `${selectedRepo.url}/issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22`;
      await open(issuesUrl);
      console.log(chalk.green(`\n✅ Opened good first issues in browser\n`));
    } else if (repoAction === 'details') {
      displayRepo(selectedRepo, action + 1);
      await inquirer.prompt([
        {
          type: 'input',
          name: 'continue',
          message: 'Press Enter to continue...'
        }
      ]);
    }
  }
}

/**
 * Bookmarks mode - show all bookmarked repositories
 */
async function bookmarksMode(): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║              📚 GitPick - Bookmarks 📚                 ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  const bookmarks = await loadBookmarks();

  if (bookmarks.length === 0) {
    console.log(chalk.yellow('No bookmarks yet!'));
    console.log(chalk.gray('Save repositories with: gitpick -a <url> --save\n'));
    return;
  }

  console.log(chalk.green(`Found ${bookmarks.length} bookmarked ${bookmarks.length === 1 ? 'repository' : 'repositories'}:\n`));

  bookmarks.forEach((bookmark, index) => {
    const starCount = formatLargeNumber(bookmark.stars);
    console.log(chalk.cyan(`${index + 1}. ${bookmark.fullName}`));
    console.log(`   ${bookmark.description || 'No description'}`);
    console.log(`   ⭐ ${starCount} | 💻 ${bookmark.language || 'N/A'} | 📅 ${new Date(bookmark.savedAt).toLocaleDateString()}`);
    if (bookmark.tags && bookmark.tags.length > 0) {
      console.log(chalk.magenta(`   🏷️  ${bookmark.tags.join(', ')}`));
    }
    console.log(chalk.gray(`   ${bookmark.url}\n`));
  });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🌐 Open a bookmark', value: 'open' },
        { name: '🗑️  Remove a bookmark', value: 'remove' },
        { name: '← Exit', value: 'exit' }
      ]
    }
  ]);

  if (action === 'open') {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select bookmark to open:',
        choices: bookmarks.map((b, i) => ({
          name: `${b.fullName} (⭐ ${formatLargeNumber(b.stars)})`,
          value: i
        }))
      }
    ]);

    await open(bookmarks[selected].url);
    console.log(chalk.green(`\n✅ Opened ${bookmarks[selected].fullName} in browser\n`));
  } else if (action === 'remove') {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select bookmark to remove:',
        choices: bookmarks.map((b, i) => ({
          name: b.fullName,
          value: i
        }))
      }
    ]);

    await removeBookmark(bookmarks[selected].fullName);
    console.log(chalk.green(`\n✅ Removed ${bookmarks[selected].fullName} from bookmarks\n`));
  }
}

/**
 * Open a specific bookmark
 */
async function openBookmark(name: string): Promise<void> {
  const bookmark = await getBookmark(name);

  if (!bookmark) {
    console.log(chalk.red(`\n❌ Bookmark "${name}" not found\n`));
    console.log(chalk.yellow('Use "gitpick --bookmarks" to see all bookmarks\n'));
    return;
  }

  await open(bookmark.url);
  console.log(chalk.green(`\n✅ Opened ${bookmark.fullName} in browser\n`));
}

/**
 * History mode - show recent searches
 */
async function historyMode(): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║              📜 GitPick - Search History 📜            ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  const history = await getSearchHistory();

  if (history.length === 0) {
    console.log(chalk.yellow('No search history yet!\n'));
    return;
  }

  console.log(chalk.green(`Recent ${history.length} searches:\n`));

  history.forEach((search: any, index) => {
    const date = new Date(search.timestamp).toLocaleString();
    console.log(chalk.cyan(`${index + 1}. ${search.keywords}`));
    console.log(`   Language: ${search.language} | Min Stars: ${search.minStars} | Results: ${search.maxResults}`);
    console.log(chalk.gray(`   ${date}\n`));
  });

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        { name: '🔄 Repeat a search', value: 'repeat' },
        { name: '← Exit', value: 'exit' }
      ]
    }
  ]);

  if (action === 'repeat') {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: 'Select search to repeat:',
        choices: history.map((s: any, i) => ({
          name: `${s.keywords} (${s.language})`,
          value: i
        }))
      }
    ]);

    console.log(chalk.cyan(`\nRepeating search: ${history[selected].keywords}\n`));
    // This would trigger a new search - implementation would go in main()
  }
}

/**
 * Comparison mode - compare multiple repositories
 */
async function compareMode(repoNames: string): Promise<void> {
  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║            ⚖️  GitPick - Compare Repos ⚖️              ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  const repos = repoNames.split(',').map(r => r.trim());

  if (repos.length < 2) {
    console.log(chalk.red('Please provide at least 2 repositories to compare\n'));
    console.log(chalk.yellow('Example: gitpick --compare react,vue,svelte\n'));
    return;
  }

  const spinner = ora('Fetching repositories...').start();
  const analyses: RepoAnalysis[] = [];

  for (const repoName of repos) {
    try {
      const repo = await getRepoByUrl(repoName);
      if (repo) {
        spinner.text = `Analyzing ${repo.full_name}...`;
        const analysis = await analyzeRepo(repo, null, true);
        analyses.push(analysis);
      }
    } catch (error) {
      spinner.warn(`Failed to fetch ${repoName}`);
    }
  }

  spinner.succeed(chalk.green(`Analyzed ${analyses.length} repositories\n`));

  if (analyses.length === 0) {
    console.log(chalk.red('No repositories could be analyzed\n'));
    return;
  }

  // Display comparison table
  console.log(chalk.blue.bold('═'.repeat(80)));
  console.log(chalk.blue.bold('COMPARISON TABLE'));
  console.log(chalk.blue.bold('═'.repeat(80)) + '\n');

  // Headers
  const nameWidth = Math.max(...analyses.map(a => a.name.length), 15);

  console.log(
    chalk.cyan.bold('Repository'.padEnd(nameWidth)) +
    chalk.cyan.bold(' | Stars  ') +
    chalk.cyan.bold(' | Forks ') +
    chalk.cyan.bold(' | Issues') +
    chalk.cyan.bold(' | GFI') +
    chalk.cyan.bold(' | Score')
  );
  console.log('─'.repeat(80));

  // Data rows
  analyses.forEach(analysis => {
    const scoreColor = getScoreColor(analysis.activityScore || 0);
    const name = analysis.name.padEnd(nameWidth);
    const stars = formatLargeNumber(analysis.stars).padStart(6);
    const forks = formatLargeNumber(analysis.forks).padStart(5);
    const issues = analysis.openIssues.toString().padStart(6);
    const gfi = analysis.goodFirstIssues.length.toString().padStart(3);
    const score = scoreColor(`${(analysis.activityScore || 0).toFixed(1)}/10`);

    console.log(`${chalk.white(name)} | ${stars} | ${forks} | ${issues} | ${gfi} | ${score}`);
  });

  console.log('\n' + chalk.blue.bold('═'.repeat(80)) + '\n');

  // Detailed comparison
  console.log(chalk.cyan.bold('DETAILS:\n'));

  analyses.forEach((analysis, index) => {
    console.log(chalk.green(`${index + 1}. ${analysis.name}`));
    console.log(`   Activity: ${visualizeActivity(analysis.lastActivity)}`);
    console.log(`   Health: ${createHealthIndicator(
      analysis.hasContributing,
      analysis.hasCodeOfConduct,
      analysis.license !== null,
      analysis.goodFirstIssues.length
    )}`);
    if (analysis.contributorsCount) {
      console.log(`   👥 ${analysis.contributorsCount} contributors`);
    }
    console.log();
  });

  // Winner
  const winner = analyses.reduce((max, current) =>
    (current.activityScore || 0) > (max.activityScore || 0) ? current : max
  );

  console.log(chalk.green.bold(`🏆 Best Match: ${winner.name} (Score: ${winner.activityScore}/10)\n`));
}

/**
 * Template mode - use quick search template
 */
async function templateMode(templateName: string): Promise<void> {
  const template = getTemplate(templateName);

  if (!template) {
    console.log(chalk.red(`\n❌ Template "${templateName}" not found\n`));
    console.log(chalk.yellow('Available templates:'));
    listTemplates().forEach(t => {
      console.log(chalk.cyan(`  - ${t.name.toLowerCase()}: ${t.description}`));
    });
    console.log();
    return;
  }

  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold(`║          🎯 GitPick - ${template.name.padEnd(28)} 🎯          ║`));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  console.log(chalk.gray(`${template.description}\n`));

  // Execute search with template params
  // This would trigger a search with the template parameters - implementation in main()
}

/**
 * Main function
 */
async function main(): Promise<void> {
  // Parse command line arguments
  const args = minimist(process.argv.slice(2), {
    string: ['a', 'analyze', 'bookmark', 'compare', 'repeat'],
    boolean: [
      'h', 'help',
      'bookmarks', 'history',
      'trending', 'beginner', 'active', 'small', 'hacktoberfest',
      'save', 'fork', 'star', 'clone', 'watch'
    ],
    alias: {
      a: 'analyze',
      h: 'help'
    }
  });

  // Show help
  if (args.help) {
    showHelp();
    return;
  }

  // Bookmarks mode
  if (args.bookmarks) {
    await bookmarksMode();
    return;
  }

  // Open specific bookmark
  if (args.bookmark) {
    await openBookmark(args.bookmark);
    return;
  }

  // History mode
  if (args.history) {
    await historyMode();
    return;
  }

  // Compare mode
  if (args.compare) {
    await compareMode(args.compare);
    return;
  }

  // Template modes
  if (args.trending) {
    await templateMode('trending');
    return;
  }
  if (args.beginner) {
    await templateMode('beginner');
    return;
  }
  if (args.active) {
    await templateMode('active');
    return;
  }
  if (args.small) {
    await templateMode('small');
    return;
  }
  if (args.hacktoberfest) {
    await templateMode('hacktoberfest');
    return;
  }

  // Analyze mode with optional GitHub actions
  if (args.analyze) {
    await analyzeMode(args.analyze, {
      save: args.save,
      fork: args.fork,
      star: args.star,
      clone: args.clone,
      watch: args.watch
    });
    return;
  }

  // Default: Interactive search mode
  console.clear();
  console.log(chalk.blue.bold('\n╔════════════════════════════════════════════════════════╗'));
  console.log(chalk.blue.bold('║                    🔍 GitPick 🔍                       ║'));
  console.log(chalk.blue.bold('║         Find & Analyze GitHub Repos for Contributors  ║'));
  console.log(chalk.blue.bold('╚════════════════════════════════════════════════════════╝\n'));

  // Load user config
  const userConfig = await loadUserConfig();

  // Check token
  if (!process.env.GITHUB_TOKEN) {
    console.log(chalk.yellow('⚠️  GITHUB_TOKEN not set. Rate limit: 60 requests/hour'));
    console.log(chalk.gray('   To increase limit: export GITHUB_TOKEN=your_token\n'));
  } else {
    console.log(chalk.green('✅ GITHUB_TOKEN found. Rate limit: 5000 requests/hour\n'));
  }

  // Show cache stats
  if (userConfig.cacheEnabled) {
    const cacheStats = await getCacheStats();
    if (cacheStats.files > 0) {
      console.log(chalk.cyan(`📦 Cache: ${cacheStats.files} entries (${cacheStats.sizeFormatted})\n`));
    }
  }

  const answers = await inquirer.prompt<InquirerAnswers>([
    {
      type: 'input',
      name: 'keywords',
      message: '🔑 Keywords (space separated):',
      default: 'react component library',
      validate: (input: string) => input.length > 0 || 'Enter at least one word'
    },
    {
      type: 'list',
      name: 'language',
      message: '💻 Programming language:',
      choices: LANGUAGES,
      default: userConfig.language || DEFAULT_CONFIG.language
    },
    {
      type: 'list',
      name: 'license',
      message: '⚖️  License filter:',
      choices: LICENSES.map(l => ({ name: l.name, value: l.value })),
      default: null
    },
    {
      type: 'number',
      name: 'minStars',
      message: '⭐ Minimum stars:',
      default: userConfig.minStars || DEFAULT_CONFIG.minStars,
      validate: (input: number) => input >= 0 || 'Must be >= 0'
    },
    {
      type: 'number',
      name: 'minForks',
      message: '🔱 Minimum forks (0 = no filter):',
      default: 0,
      validate: (input: number) => input >= 0 || 'Must be >= 0'
    },
    {
      type: 'number',
      name: 'maxResults',
      message: '📊 Number of results:',
      default: userConfig.maxResults || DEFAULT_CONFIG.maxResults,
      validate: (input: number) => (input > 0 && input <= 100) || 'From 1 to 100'
    },
    {
      type: 'confirm',
      name: 'requireGoodFirstIssues',
      message: '💡 Require repositories with "good first issues"?',
      default: true
    },
    {
      type: 'confirm',
      name: 'showOnlyActive',
      message: '✅ Show only active repositories (commit < 30 days)?',
      default: false
    },
    {
      type: 'confirm',
      name: 'enableAdvancedStats',
      message: '📈 Enable advanced statistics? (slower, more API calls)',
      default: false
    },
    {
      type: 'confirm',
      name: 'saveResults',
      message: '💾 Save results to files?',
      default: userConfig.saveResults !== undefined ? userConfig.saveResults : DEFAULT_CONFIG.saveResults
    },
    {
      type: 'confirm',
      name: 'interactiveMode',
      message: '🎮 Enable interactive mode after results?',
      default: true
    }
  ]);

  // Build search params
  const searchParams: SearchParams = {
    keywords: answers.keywords,
    language: answers.language,
    minStars: answers.minStars,
    maxResults: answers.maxResults,
    license: answers.license,
    minForks: answers.minForks > 0 ? answers.minForks : null,
    requireGoodFirstIssues: answers.requireGoodFirstIssues
  };

  // Check cache first
  let repos: GitHubRepo[] | null = null;
  if (userConfig.cacheEnabled) {
    const spinner = ora('Checking cache...').start();
    repos = await getCache<GitHubRepo[]>(searchParams, userConfig.cacheTTL);
    if (repos) {
      spinner.succeed(chalk.green('Found cached results!\n'));
    } else {
      spinner.info('No cache found, searching...');
    }
  }

  const spinner: Ora = ora('Searching repositories...').start();

  try {
    // Search if not cached
    if (!repos) {
      spinner.text = 'Searching for suitable repositories...';
      repos = await searchRepos(searchParams);

      if (repos.length === 0) {
        spinner.fail('No repositories found. Try changing search parameters.');
        return;
      }

      // Cache the search results
      if (userConfig.cacheEnabled) {
        await setCache(searchParams, repos);
      }
    }

    spinner.text = `Found ${repos.length} repositories. Analyzing...`;
    spinner.stop();

    // Create progress bar
    const progressBar = new cliProgress.SingleBar({
      format: '{task} | {bar} | {value}/{total} repos',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    progressBar.start(repos.length, 0, { task: 'Starting analysis...' });

    // Analyze each repository
    const results: RepoAnalysis[] = [];
    for (let i = 0; i < repos.length; i++) {
      const repo = repos[i];
      progressBar.update(i, { task: `Analyzing ${repo.full_name}...` });
      const analysis = await analyzeRepo(repo, progressBar, answers.enableAdvancedStats);
      results.push(analysis);
      progressBar.update(i + 1);
    }

    progressBar.stop();

    // Filter results if showOnlyActive is enabled
    let filteredResults = results;
    if (answers.showOnlyActive) {
      const beforeCount = results.length;
      filteredResults = results.filter(repo => repo.active);
      const filtered = beforeCount - filteredResults.length;
      console.log(chalk.green.bold(`\n✅ Analysis complete! Found ${results.length} repositories.`));
      if (filtered > 0) {
        console.log(chalk.yellow(`   Filtered out ${filtered} inactive repositories.\n`));
      } else {
        console.log();
      }
    } else {
      console.log(chalk.green.bold(`\n✅ Analysis complete! Found ${results.length} repositories.\n`));
    }

    // Sort by activity score
    filteredResults.sort((a, b) => (b.activityScore || 0) - (a.activityScore || 0));

    // Display results
    filteredResults.forEach((result, index) => {
      displayRepo(result, index + 1);
    });

    // Save results
    if (answers.saveResults) {
      console.log('\n');
      const { exportFormats } = await inquirer.prompt<ExportFormatsAnswer>([
        {
          type: 'checkbox',
          name: 'exportFormats',
          message: 'Select export formats:',
          choices: [
            { name: 'JSON', value: 'json' as const, checked: true },
            { name: 'Markdown', value: 'markdown' as const, checked: true },
            { name: 'CSV', value: 'csv' as const, checked: false },
            { name: 'HTML', value: 'html' as const, checked: false }
          ],
          validate: (answer: string[]) => answer.length > 0 || 'Select at least one format'
        }
      ]);

      console.log('');

      for (const format of exportFormats) {
        if (format === 'json') await exportToJSON(filteredResults);
        if (format === 'markdown') await exportToMarkdown(filteredResults);
        if (format === 'csv') await exportToCSV(filteredResults);
        if (format === 'html') await exportToHTML(filteredResults);
      }
    }

    // Save to search history
    await addToHistory(searchParams);

    // Interactive mode
    if (answers.interactiveMode) {
      console.log(chalk.blue.bold(`\n${'='.repeat(80)}`));
      console.log(chalk.cyan.bold('\n🎮 Entering interactive mode...\n'));
      await interactiveMode(filteredResults);
    }

    // Final message
    console.log(chalk.blue.bold(`\n${'='.repeat(80)}`));
    console.log(chalk.green.bold('\n✨ Done! Choose a repository and start contributing!\n'));

  } catch (error) {
    spinner.fail('Search error');
    console.error(chalk.red(`\n❌ ${(error as Error).message}\n`));
    const err = error as Error;
    if (err.stack) {
      console.error(chalk.gray(err.stack));
    }
  }
}

// Run
main().catch(error => {
  console.error(chalk.red('\n❌ Critical error:'), error);
  process.exit(1);
});
