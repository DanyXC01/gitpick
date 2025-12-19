import chalk from 'chalk';

/**
 * Visual effects and enhancements for better UX
 */

/**
 * Create a sparkline from data points
 */
export function createSparkline(data: number[]): string {
  const chars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  if (range === 0) {
    return chars[0].repeat(data.length);
  }

  return data
    .map(value => {
      const normalized = (value - min) / range;
      const index = Math.floor(normalized * (chars.length - 1));
      return chars[index];
    })
    .join('');
}

/**
 * Create ASCII bar chart
 */
export function createBarChart(value: number, max: number, width: number = 10): string {
  const filled = Math.round((value / max) * width);
  const empty = width - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Get color gradient based on score
 */
export function getScoreColor(score: number): typeof chalk {
  if (score >= 8) return chalk.green;
  if (score >= 7) return chalk.greenBright;
  if (score >= 6) return chalk.yellow;
  if (score >= 5) return chalk.yellowBright;
  if (score >= 4) return chalk.hex('#FFA500'); // orange
  return chalk.red;
}

/**
 * Create colored progress bar
 */
export function createColoredBar(score: number, maxScore: number = 10): string {
  const percentage = score / maxScore;
  const width = 10;
  const filled = Math.round(percentage * width);
  const empty = width - filled;

  const color = getScoreColor(score);
  return color('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
}

/**
 * Format number with color based on value
 */
export function formatNumberWithColor(value: number, thresholds: { low: number; medium: number; high: number }): string {
  let color = chalk.gray;

  if (value >= thresholds.high) {
    color = chalk.green;
  } else if (value >= thresholds.medium) {
    color = chalk.yellow;
  } else if (value >= thresholds.low) {
    color = chalk.hex('#FFA500');
  } else {
    color = chalk.red;
  }

  return color(value.toLocaleString());
}

/**
 * Create trend indicator
 */
export function getTrendIndicator(trend: 'up' | 'down' | 'stable'): string {
  switch (trend) {
    case 'up':
      return chalk.green('↑');
    case 'down':
      return chalk.red('↓');
    case 'stable':
      return chalk.yellow('→');
  }
}

/**
 * Create badge
 */
export function createBadge(text: string, color: 'red' | 'yellow' | 'green' | 'blue' | 'magenta' = 'blue'): string {
  const colors = {
    red: chalk.bgRed.white,
    yellow: chalk.bgYellow.black,
    green: chalk.bgGreen.white,
    blue: chalk.bgBlue.white,
    magenta: chalk.bgMagenta.white
  };

  return colors[color](` ${text} `);
}

/**
 * Format large numbers with suffixes (K, M)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Create activity visualization
 */
export function visualizeActivity(lastActivityDays: number | null): string {
  if (lastActivityDays === null) {
    return chalk.gray('❓ Unknown');
  }

  if (lastActivityDays < 7) {
    return chalk.green(`🔥 ${lastActivityDays}d ago (Very Active)`);
  } else if (lastActivityDays < 30) {
    return chalk.greenBright(`✅ ${lastActivityDays}d ago (Active)`);
  } else if (lastActivityDays < 90) {
    return chalk.yellow(`⚠️  ${lastActivityDays}d ago (Moderate)`);
  } else if (lastActivityDays < 180) {
    return chalk.hex('#FFA500')(`⏸️  ${lastActivityDays}d ago (Slow)`);
  } else {
    return chalk.red(`❌ ${lastActivityDays}d ago (Inactive)`);
  }
}

/**
 * Create health indicator
 */
export function createHealthIndicator(
  hasContributing: boolean,
  hasCodeOfConduct: boolean,
  hasLicense: boolean,
  goodFirstIssuesCount: number
): string {
  let health = 0;
  const indicators: string[] = [];

  if (hasContributing) {
    health += 25;
    indicators.push(chalk.green('✓ Contributing'));
  } else {
    indicators.push(chalk.red('✗ Contributing'));
  }

  if (hasCodeOfConduct) {
    health += 25;
    indicators.push(chalk.green('✓ CoC'));
  } else {
    indicators.push(chalk.red('✗ CoC'));
  }

  if (hasLicense) {
    health += 25;
    indicators.push(chalk.green('✓ License'));
  } else {
    indicators.push(chalk.red('✗ License'));
  }

  if (goodFirstIssuesCount > 0) {
    health += 25;
    indicators.push(chalk.green(`✓ ${goodFirstIssuesCount} GFI`));
  } else {
    indicators.push(chalk.red('✗ GFI'));
  }

  const bar = createColoredBar(health / 10, 10);

  return `${bar} ${health}% | ${indicators.join(' ')}`;
}
