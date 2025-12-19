# 🔍 GitPick

Advanced CLI tool for finding and analyzing GitHub repositories suitable for contributing, with intelligent filtering, caching, and analytics. Written in TypeScript.

## ✨ Features

- 🔍 **Smart Search** - Find repositories by keywords, language, stars, and more
- 🎯 **Analyze Mode** - Analyze any GitHub repository by URL (NEW!)
- 📊 **Activity Scoring** - Automatic scoring (0-10) based on activity, maintenance, and contributor-friendliness
- ⚡ **Intelligent Caching** - Fast repeat searches with automatic cache management
- 🎯 **Advanced Filtering** - Filter by license, forks, good first issues, active status, and more
- 📈 **Deep Analytics** - PR merge times, issue response rates, contributor counts
- 🎮 **Interactive Mode** - Browse results and open repositories directly in your browser
- 📦 **Multiple Export Formats** - Save results as JSON, Markdown, CSV, or HTML
- 🔄 **Retry Logic** - Automatic retry with exponential backoff for API reliability
- 💾 **Config Support** - Save your preferences for future searches
- 📝 **Search History** - Keep track of your recent searches

## 🚀 Installation

### Global Installation (Recommended)

```bash
# Clone repository
git clone <your-repo-url>
cd gitpick

# Install dependencies
npm install

# Build TypeScript
npm run build

# Install globally
npm link
# or
npm install -g .

# Now you can use it anywhere
gitpick
```

### Local Installation

```bash
# Clone or create folder
git clone <your-repo-url>
cd gitpick

# Install dependencies
npm install

# Build TypeScript
npm run build
```

## 💻 Development

### Building the Project

```bash
# Build TypeScript to JavaScript
npm run build

# Clean build directory
npm run clean

# Build and run
npm run dev
```

### Project Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run clean` - Remove dist/ folder
- `npm run dev` - Build and run the CLI
- `npm start` - Run the compiled CLI
- `npm run search` - Alias for npm start

## 🔑 GitHub Token (optional, but recommended)

Without token: **60 requests/hour**
With token: **5000 requests/hour**

### How to create a token:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it "repo-finder"
4. Select scope: `public_repo` (public repositories only)
5. Copy the token

### Set up the token:

```bash
# Linux/Mac
export GITHUB_TOKEN=your_token_here

# Or add to ~/.bashrc or ~/.zshrc for permanent use
echo 'export GITHUB_TOKEN=your_token_here' >> ~/.bashrc
```

```powershell
# Windows (PowerShell)
$env:GITHUB_TOKEN="your_token_here"
```

## 📖 Usage

### Global Command
```bash
# Interactive search mode
gitpick

# Analyze a specific repository
gitpick -a https://github.com/facebook/react
gitpick -a facebook/react
gitpick --analyze vercel/next.js

# Show help
gitpick -h
gitpick --help
```

### Local Usage
```bash
npm start
# or
node dist/index.js
```

### Analyze Mode (NEW!)

Quickly analyze any GitHub repository without searching:

```bash
gitpick -a <repository-url>
```

Supported URL formats:
- `https://github.com/owner/repo`
- `github.com/owner/repo`
- `owner/repo`

The analyze mode will show you:
- ⭐ Stars, forks, and popularity metrics
- 🕒 Last activity and commit history
- 💡 Good first issues available
- 📊 Activity score (0-10)
- 📋 Contributing guidelines presence
- 📈 Advanced stats (PR merge time, issue response time)

### Search Mode

Interactive mode where the program will ask:

1. **Keywords** - search terms (e.g., "react component library", "python web framework")
2. **Programming language** - TypeScript, JavaScript, Python, Go, Rust, Java, C++, Ruby, Swift, Kotlin, C#
3. **License filter** - MIT, Apache 2.0, GPL 3.0, BSD, ISC, MPL 2.0, or Any
4. **Minimum stars** - filter by popularity (recommended 100+)
5. **Minimum forks** - filter by fork count (0 = no filter)
6. **Number of results** - from 1 to 100 (increased from 20!)
7. **Require good first issues** - filter repos with beginner-friendly issues (NEW!)
8. **Show only active repos** - filter out inactive repositories (NEW!)
9. **Advanced statistics** - enable detailed PR and issue analytics (slower, more API calls)
10. **Save results** - export to various formats
11. **Interactive mode** - browse and open repositories interactively

## 📊 What the tool analyzes:

### Basic Metrics
- ⭐ **Stars** - Repository popularity
- 🔱 **Forks** - Community engagement
- 🕒 **Activity** - Last commit date and frequency
- 🐛 **Open Issues** - Number of problems to solve
- 💡 **Good First Issues** - Beginner-friendly tasks
- 🏷️ **Topics** - Repository tags and categories

### Repository Features
- 📋 **CONTRIBUTING.md** - Contributor guide availability
- 📜 **CODE_OF_CONDUCT.md** - Community guidelines
- ⚖️ **License** - Software license type
- 👥 **Contributors** - Number of contributors

### Advanced Analytics (Optional)
- 📊 **PR Merge Time** - Average time to merge pull requests
- ⏱️ **Issue Response Time** - How quickly maintainers respond to issues
- 📈 **Activity Score** - Computed score (0-10) based on multiple factors

### Activity Score Calculation

The tool calculates an overall activity score (0-10) based on:
- **Activity (30%)** - Recent commits and maintenance
- **Stars (20%)** - Community popularity
- **Issues (15%)** - Issue management health
- **Contributing Guide (15%)** - Documentation quality
- **Good First Issues (20%)** - Beginner-friendliness

## 📁 Output Formats

The tool can export results in multiple formats (you can choose which ones):

- **repos-results.json** - Complete data in JSON format
- **repos-report.md** - Formatted Markdown report with all details
- **repos-results.csv** - Spreadsheet-friendly CSV format
- **repos-report.html** - Beautiful HTML report with styling and statistics

## 🎮 Interactive Mode

After viewing results, you can enter interactive mode to:
- Browse repositories with arrow keys
- Open repositories directly in your browser
- View good first issues page
- See detailed information for each repository

## 💡 Example search queries

### Frontend:
- "react component library"
- "vue ui framework"
- "svelte animation"
- "tailwind plugin"

### Backend:
- "python web framework"
- "node express middleware"
- "go http router"

### DevTools:
- "vite plugin"
- "webpack loader"
- "typescript linter"

### Libraries:
- "data visualization"
- "state management"
- "form validation"

## 🎯 What to look for in results:

The tool automatically scores repositories, but here's what makes a good contribution target:

✅ **Good signs:**
- ✅ Active (commit < 30 days ago)
- 📋 Has CONTRIBUTING.md and CODE_OF_CONDUCT.md
- 💡 Has Good First Issues
- **Score 7+** - Highly active and contributor-friendly
- 100-5000 stars (not too small, not too huge)
- Fast PR merge times (< 7 days)
- Quick issue responses (< 24 hours)

❌ **Bad signs:**
- ❌ Inactive (no commits for several months)
- **Score < 5** - May have maintenance issues
- No CONTRIBUTING.md (unclear how to contribute)
- No Good First Issues (hard to find where to start)
- Slow response times (> 1 week)

## ⚡ Caching

The tool automatically caches search results for 1 hour. This means:
- Repeat searches are instant
- Reduces API calls
- Cache is stored in `.repo-finder-cache/`
- Automatically cleaned when expired

To disable caching, edit `.repo-finder.config.json`:
```json
{
  "cacheEnabled": false
}
```

## ⚙️ Configuration File

Create a `.repo-finder.config.json` file in your project directory to save preferences:

```json
{
  "language": "TypeScript",
  "minStars": 100,
  "maxResults": 10,
  "saveResults": true,
  "cacheEnabled": true,
  "cacheTTL": 3600000,
  "retryAttempts": 3,
  "retryDelay": 1000
}
```

The tool will remember your preferences and use them as defaults for future searches.

## 🏗️ Project Structure

```
repo-finder/
├── src/                  # TypeScript source files
│   ├── index.ts          # Main application
│   ├── config.ts         # Constants and default configuration
│   ├── types/
│   │   └── index.ts      # TypeScript type definitions
│   └── utils/
│       ├── cache.ts      # Caching functionality
│       ├── retry.ts      # Retry logic with exponential backoff
│       ├── userConfig.ts # User configuration management
│       ├── export.ts     # Export to JSON, Markdown, CSV, HTML
│       └── analytics.ts  # Analytics and scoring algorithms
├── dist/                 # Compiled JavaScript (generated)
├── tsconfig.json         # TypeScript configuration
├── package.json
├── .gitignore
├── .env.example
└── README.md
```

## 🐛 Troubleshooting

### Rate limit exceeded
**Problem:** `403 Rate limit exceeded`

**Solution:** Set GITHUB_TOKEN (see above). The tool has automatic retry logic, but a token increases your limit from 60 to 5000 requests/hour.

### Dependencies error
**Problem:** `Cannot find module`

**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Node version
**Problem:** Syntax errors or import errors

**Solution:** Use Node.js >= 18
```bash
node --version  # should be v18.0.0 or higher
```

### Cache issues
**Problem:** Outdated results

**Solution:** Clear the cache manually:
```bash
rm -rf .repo-finder-cache/
```

### Slow performance
**Problem:** Searches take too long

**Solutions:**
- Use cached results (automatic)
- Disable advanced statistics
- Reduce number of results
- Set a GitHub token to avoid rate limiting delays

## 📝 License

MIT

## 🚀 Advanced Usage Examples

### Quick Search
```bash
# Install globally first
npm link

# Then use anywhere
gitpick
```

### Analyze Specific Repositories
```bash
# Analyze React
gitpick -a facebook/react

# Analyze Vue.js
gitpick -a https://github.com/vuejs/core

# Analyze any repo
gitpick --analyze tailwindlabs/tailwindcss
```

### Filtering by License
When prompted, select a specific license (MIT, Apache, GPL, etc.) to find repositories with that license.

### Finding Very Active Repositories
- Set minimum stars to 500+
- Enable advanced statistics
- Look for repositories with score 8+
- Check PR merge time < 5 days

### Exporting for Analysis
1. Save results to CSV
2. Open in Excel/Google Sheets
3. Sort by activity score
4. Filter by contributor count

## 🤝 Contributing

Contributions are welcome! This tool itself can be improved. Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests
- Improve documentation

## 📊 What's New

### Version 1.1.0
- 🎯 **NEW: Analyze Mode** - Analyze any GitHub repository by URL with `gitpick -a <url>`
- 🎯 **NEW: Active Repo Filter** - Show only repositories with commits < 30 days ago
- 🎯 **NEW: Optional Good First Issues** - Make "good first issues" filter optional
- 📊 **Increased Limits** - Now supports up to 100 results per search (was 20)
- 🏷️ **Rebranded to GitPick** - New memorable name!

### Version 1.0.0
- ✅ **TypeScript** - Full TypeScript rewrite with type safety
- ✅ Global CLI installation support
- ✅ Intelligent caching mechanism
- ✅ Advanced filtering (license, forks, contributors)
- ✅ Activity scoring algorithm
- ✅ Interactive browsing mode
- ✅ Multiple export formats (CSV, HTML)
- ✅ Retry logic with exponential backoff
- ✅ User configuration support
- ✅ Search history tracking
- ✅ Advanced analytics (PR/issue stats)
- ✅ Progress bars for better UX
- ✅ Comprehensive type definitions
- ✅ Better code organization and refactoring

## 🙏 Acknowledgments

Built with:
- [Octokit](https://github.com/octokit/octokit.js) - GitHub API client
- [Inquirer](https://github.com/SBoudrias/Inquirer.js) - Interactive CLI
- [Chalk](https://github.com/chalk/chalk) - Terminal styling
- [Ora](https://github.com/sindresorhus/ora) - Spinners
- [cli-progress](https://github.com/npkgz/cli-progress) - Progress bars
