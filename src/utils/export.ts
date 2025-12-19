import fs from 'fs/promises';
import chalk from 'chalk';
import { FILE_OUTPUTS } from '../config.js';
import type { RepoAnalysis } from '../types/index.js';

/**
 * Escape CSV string
 */
function escapeCSV(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  const stringValue = String(str);
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Escape HTML string
 */
function escapeHTML(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Export results to CSV format
 */
export async function exportToCSV(
  results: RepoAnalysis[],
  filename: string = FILE_OUTPUTS.CSV
): Promise<boolean> {
  try {
    // CSV header
    const headers = [
      'Name',
      'Description',
      'Stars',
      'Language',
      'Last Activity (days)',
      'Active',
      'Open Issues',
      'Has Contributing Guide',
      'Good First Issues Count',
      'Activity Score',
      'Topics',
      'URL'
    ];

    const rows = results.map(repo => [
      escapeCSV(repo.name),
      escapeCSV(repo.description),
      repo.stars,
      escapeCSV(repo.language || 'N/A'),
      repo.lastActivity !== null ? repo.lastActivity : 'N/A',
      repo.active ? 'Yes' : 'No',
      repo.openIssues,
      repo.hasContributing ? 'Yes' : 'No',
      repo.goodFirstIssues.length,
      repo.activityScore ? repo.activityScore.toFixed(2) : 'N/A',
      escapeCSV(repo.topics.join('; ')),
      repo.url
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    await fs.writeFile(filename, csv);
    console.log(chalk.green(`✅ CSV exported to ${filename}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ CSV export error: ${(error as Error).message}`));
    return false;
  }
}

/**
 * Export results to HTML format
 */
export async function exportToHTML(
  results: RepoAnalysis[],
  filename: string = FILE_OUTPUTS.HTML
): Promise<boolean> {
  try {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GitHub Repositories Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #24292e;
            background: #f6f8fa;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        h1 {
            color: #0366d6;
            margin-bottom: 10px;
            font-size: 32px;
        }

        .meta {
            color: #586069;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e1e4e8;
        }

        .repo-card {
            border: 1px solid #e1e4e8;
            border-radius: 6px;
            padding: 24px;
            margin-bottom: 24px;
            transition: box-shadow 0.2s;
        }

        .repo-card:hover {
            box-shadow: 0 3px 8px rgba(0,0,0,0.1);
        }

        .repo-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }

        .repo-name {
            font-size: 20px;
            font-weight: 600;
            color: #0366d6;
            text-decoration: none;
        }

        .repo-name:hover {
            text-decoration: underline;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .badge-active {
            background: #dcffe4;
            color: #0e6027;
        }

        .badge-inactive {
            background: #ffeef0;
            color: #86181d;
        }

        .description {
            color: #586069;
            margin-bottom: 16px;
        }

        .metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 16px;
            padding: 12px 0;
            border-top: 1px solid #f0f0f0;
            border-bottom: 1px solid #f0f0f0;
        }

        .metric {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 14px;
        }

        .metric-icon {
            font-size: 16px;
        }

        .features {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 16px;
        }

        .feature {
            padding: 4px 10px;
            background: #f1f8ff;
            border: 1px solid #c8e1ff;
            border-radius: 4px;
            font-size: 13px;
            color: #0366d6;
        }

        .topics {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-bottom: 16px;
        }

        .topic {
            padding: 4px 10px;
            background: #f6f8fa;
            border-radius: 12px;
            font-size: 12px;
            color: #0366d6;
        }

        .issues-list {
            background: #fffbdd;
            border: 1px solid #ffd33d;
            border-radius: 6px;
            padding: 12px;
            margin-top: 12px;
        }

        .issues-title {
            font-weight: 600;
            margin-bottom: 8px;
            color: #735c0f;
        }

        .issue-item {
            padding: 6px 0;
        }

        .issue-link {
            color: #0366d6;
            text-decoration: none;
            font-size: 14px;
        }

        .issue-link:hover {
            text-decoration: underline;
        }

        .score {
            font-size: 24px;
            font-weight: 700;
            color: #28a745;
        }

        .summary {
            background: #f6f8fa;
            padding: 20px;
            border-radius: 6px;
            margin-bottom: 30px;
        }

        .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
        }

        .stat {
            text-align: center;
            padding: 12px;
            background: white;
            border-radius: 4px;
        }

        .stat-value {
            font-size: 28px;
            font-weight: 700;
            color: #0366d6;
        }

        .stat-label {
            font-size: 13px;
            color: #586069;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔍 GitHub Repositories for Contributing</h1>
        <div class="meta">
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</p>
            <p><strong>Found repositories:</strong> ${results.length}</p>
        </div>

        <div class="summary">
            <div class="summary-stats">
                <div class="stat">
                    <div class="stat-value">${results.length}</div>
                    <div class="stat-label">Total Repos</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${results.filter(r => r.active).length}</div>
                    <div class="stat-label">Active</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${results.filter(r => r.hasContributing).length}</div>
                    <div class="stat-label">With Guide</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${results.reduce((sum, r) => sum + r.goodFirstIssues.length, 0)}</div>
                    <div class="stat-label">Good Issues</div>
                </div>
            </div>
        </div>

        ${results.map((repo, index) => `
        <div class="repo-card">
            <div class="repo-header">
                <span style="font-size: 24px; color: #666;">#${index + 1}</span>
                <a href="${repo.url}" class="repo-name" target="_blank">${escapeHTML(repo.name)}</a>
                <span class="badge ${repo.active ? 'badge-active' : 'badge-inactive'}">
                    ${repo.active ? '✓ Active' : '✗ Inactive'}
                </span>
                ${repo.activityScore ? `<span class="score">${repo.activityScore.toFixed(1)}/10</span>` : ''}
            </div>

            <p class="description">${escapeHTML(repo.description)}</p>

            <div class="metrics">
                <div class="metric">
                    <span class="metric-icon">⭐</span>
                    <span><strong>${repo.stars.toLocaleString()}</strong> stars</span>
                </div>
                <div class="metric">
                    <span class="metric-icon">💻</span>
                    <span>${escapeHTML(repo.language || 'N/A')}</span>
                </div>
                ${repo.lastActivity !== null ? `
                <div class="metric">
                    <span class="metric-icon">🕒</span>
                    <span><strong>${repo.lastActivity}</strong> days ago</span>
                </div>
                ` : ''}
                <div class="metric">
                    <span class="metric-icon">🐛</span>
                    <span><strong>${repo.openIssues}</strong> open issues</span>
                </div>
                ${repo.forks ? `
                <div class="metric">
                    <span class="metric-icon">🔱</span>
                    <span><strong>${repo.forks.toLocaleString()}</strong> forks</span>
                </div>
                ` : ''}
                ${repo.contributorsCount ? `
                <div class="metric">
                    <span class="metric-icon">👥</span>
                    <span><strong>${repo.contributorsCount}</strong> contributors</span>
                </div>
                ` : ''}
            </div>

            <div class="features">
                ${repo.hasContributing ? '<span class="feature">📋 Contributing Guide</span>' : ''}
                ${repo.hasCodeOfConduct ? '<span class="feature">📜 Code of Conduct</span>' : ''}
                ${repo.license ? `<span class="feature">⚖️ ${escapeHTML(repo.license)}</span>` : ''}
            </div>

            ${repo.topics && repo.topics.length > 0 ? `
            <div class="topics">
                <strong style="margin-right: 8px;">🏷️</strong>
                ${repo.topics.map(topic => `<span class="topic">${escapeHTML(topic)}</span>`).join('')}
            </div>
            ` : ''}

            ${repo.goodFirstIssues && repo.goodFirstIssues.length > 0 ? `
            <div class="issues-list">
                <div class="issues-title">💡 Good First Issues (${repo.goodFirstIssues.length})</div>
                ${repo.goodFirstIssues.slice(0, 5).map((issue, i) => `
                <div class="issue-item">
                    ${i + 1}. <a href="${issue.html_url}" class="issue-link" target="_blank">${escapeHTML(issue.title)}</a>
                </div>
                `).join('')}
            </div>
            ` : ''}
        </div>
        `).join('')}

        <div class="meta" style="margin-top: 40px; border-top: 1px solid #e1e4e8; padding-top: 20px;">
            <p>Generated by <strong>repo-finder</strong> - CLI tool for finding GitHub repositories</p>
        </div>
    </div>
</body>
</html>`;

    await fs.writeFile(filename, html);
    console.log(chalk.green(`✅ HTML report exported to ${filename}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ HTML export error: ${(error as Error).message}`));
    return false;
  }
}

/**
 * Export results to JSON format
 */
export async function exportToJSON(
  results: RepoAnalysis[],
  filename: string = FILE_OUTPUTS.JSON
): Promise<boolean> {
  try {
    await fs.writeFile(filename, JSON.stringify(results, null, 2));
    console.log(chalk.green(`✅ Results saved to ${filename}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ Save error: ${(error as Error).message}`));
    return false;
  }
}

/**
 * Export results to Markdown format
 */
export async function exportToMarkdown(
  results: RepoAnalysis[],
  filename: string = FILE_OUTPUTS.MARKDOWN
): Promise<boolean> {
  let markdown = '# GitHub Repositories for Contributing\n\n';
  markdown += `Date: ${new Date().toLocaleDateString('en-US')}\n\n`;
  markdown += `Found repositories: ${results.length}\n\n`;

  // Summary
  markdown += '## Summary\n\n';
  markdown += `- Total repositories: ${results.length}\n`;
  markdown += `- Active repositories: ${results.filter(r => r.active).length}\n`;
  markdown += `- With contributing guide: ${results.filter(r => r.hasContributing).length}\n`;
  markdown += `- Total good first issues: ${results.reduce((sum, r) => sum + r.goodFirstIssues.length, 0)}\n\n`;
  markdown += '---\n\n';

  results.forEach((repo, index) => {
    markdown += `## ${index + 1}. [${repo.name}](${repo.url})\n\n`;
    markdown += `${repo.description}\n\n`;

    if (repo.activityScore) {
      markdown += `**Activity Score:** ${repo.activityScore.toFixed(1)}/10\n\n`;
    }

    markdown += `**Metrics:**\n`;
    markdown += `- ⭐ Stars: ${repo.stars.toLocaleString()}\n`;
    markdown += `- 💻 Language: ${repo.language || 'N/A'}\n`;
    markdown += `- 🕒 Last activity: ${repo.lastActivity !== null ? repo.lastActivity + ' days ago' : 'N/A'}\n`;
    markdown += `- 🐛 Open issues: ${repo.openIssues}\n`;

    if (repo.forks) {
      markdown += `- 🔱 Forks: ${repo.forks.toLocaleString()}\n`;
    }

    if (repo.contributorsCount) {
      markdown += `- 👥 Contributors: ${repo.contributorsCount}\n`;
    }

    markdown += `- ${repo.active ? '✅ Active' : '❌ Inactive'}\n`;
    markdown += `- ${repo.hasContributing ? '📋 Has CONTRIBUTING.md' : '📋 No CONTRIBUTING.md'}\n`;

    if (repo.hasCodeOfConduct) {
      markdown += `- 📜 Has CODE_OF_CONDUCT.md\n`;
    }

    if (repo.license) {
      markdown += `- ⚖️ License: ${repo.license}\n`;
    }

    markdown += '\n';

    if (repo.topics && repo.topics.length > 0) {
      markdown += `**Topics:** ${repo.topics.join(', ')}\n\n`;
    }

    if (repo.goodFirstIssues && repo.goodFirstIssues.length > 0) {
      markdown += `**Good First Issues (${repo.goodFirstIssues.length}):**\n\n`;
      repo.goodFirstIssues.forEach((issue, i) => {
        markdown += `${i + 1}. [${issue.title}](${issue.html_url})\n`;
      });
      markdown += '\n';
    }

    markdown += '---\n\n';
  });

  try {
    await fs.writeFile(filename, markdown);
    console.log(chalk.green(`✅ Markdown report saved to ${filename}`));
    return true;
  } catch (error) {
    console.log(chalk.red(`❌ Report save error: ${(error as Error).message}`));
    return false;
  }
}
