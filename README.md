# 🔍 GitPick

> Advanced CLI tool to find and analyze GitHub repositories perfect for contributing

GitPick helps developers discover open-source projects that match their interests and skill level. Search, analyze, compare, and bookmark repositories with powerful filtering and visual analytics.

---

## ✨ Features

- 🔍 **Smart Search** - Find repos by keywords, language, stars, license, and activity
- 🎯 **Quick Templates** - Pre-configured searches (`--trending`, `--beginner`, `--active`)
- 📊 **Activity Scoring** - 0-10 score based on maintenance, community health, and beginner-friendliness
- 💾 **Bookmarks** - Save and manage your favorite repositories
- ⚖️ **Comparison Mode** - Compare multiple repos side-by-side
- 🔄 **GitHub Integration** - Fork, star, clone, and watch repos directly from CLI
- 📜 **Search History** - Track and repeat previous searches
- 🎨 **Visual Analytics** - Color-coded health indicators, progress bars, and badges
- 📈 **Deep Metrics** - PR merge times, issue response rates, contributor activity
- 📦 **Export** - Save results as JSON, Markdown, CSV, or HTML
- ⚡ **Smart Caching** - Fast repeat searches with intelligent cache

---

## 🚀 Installation

```bash
# Clone repository
git clone https://github.com/DanyXC01/gitpick.git
cd gitpick

# Install dependencies
npm install

# Build
npm run build

# Install globally
npm link
```

**Requirements:** Node.js ≥ 18

---

## 📖 Usage

### Basic Commands

```bash
# Interactive search mode
gitpick

# Analyze specific repository
gitpick -a facebook/react
gitpick -a https://github.com/vercel/next.js

# Quick templates
gitpick --trending         # Trending repos this week
gitpick --beginner         # Perfect for beginners
gitpick --active           # Super active projects
gitpick --small            # Small projects (100-1K stars)
gitpick --hacktoberfest    # Hacktoberfest-ready repos

# Bookmarks
gitpick --bookmarks        # Show all bookmarks
gitpick --bookmark react   # Open specific bookmark
gitpick -a <url> --save    # Save to bookmarks

# Comparison
gitpick --compare react,vue,svelte

# History
gitpick --history          # Show recent searches
gitpick --repeat 3         # Repeat 3rd search

# GitHub Actions (requires GITHUB_TOKEN)
gitpick -a <url> --fork    # Fork repository
gitpick -a <url> --star    # Star repository
gitpick -a <url> --clone   # Clone locally
gitpick -a <url> --watch   # Watch for updates

# Help
gitpick -h
```

### GitHub Token (Optional but Recommended)

Without token: **60 requests/hour**
With token: **5000 requests/hour**

```bash
# Create token: https://github.com/settings/tokens
# Scope: public_repo

export GITHUB_TOKEN=your_token_here
```

---

## 📊 What GitPick Analyzes

| Metric | Description |
|--------|-------------|
| ⭐ **Stars** | Repository popularity |
| 🔱 **Forks** | Community engagement |
| 🕒 **Last Activity** | Days since last commit |
| 🐛 **Open Issues** | Active problems to solve |
| 💡 **Good First Issues** | Beginner-friendly tasks |
| 📋 **CONTRIBUTING.md** | Contributor guide presence |
| 📜 **CODE_OF_CONDUCT** | Community guidelines |
| ⚖️ **License** | Software license type |
| 👥 **Contributors** | Number of contributors |
| 📊 **PR Merge Time** | Average time to merge PRs |
| ⏱️ **Issue Response** | Maintainer response speed |
| 🎯 **Activity Score** | Overall health (0-10) |

---

## 🎨 Visual Features

### Color-Coded Scoring
```
████████░░ 8.5/10
```

### Badges
- 🔥 **HOT** - Active in last 7 days
- ⭐ **POPULAR** - 10K+ stars
- 🟢 **BEGINNER FRIENDLY** - 5+ good first issues

### Community Health Indicator
```
Community Health:
████████░░ 80% | ✓ Contributing ✓ CoC ✓ License ✓ 15 GFI
```

### Activity Levels
- 🔥 **0-7 days** - Very Active (green)
- ✅ **7-30 days** - Active (light green)
- ⚠️ **30-90 days** - Moderate (yellow)
- ⏸️ **90-180 days** - Slow (orange)
- ❌ **180+ days** - Inactive (red)

---

## 📦 Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| **octokit** | ^3.1.2 | GitHub API client |
| **inquirer** | ^9.2.12 | Interactive CLI prompts |
| **chalk** | ^5.3.0 | Terminal styling |
| **ora** | ^8.0.1 | Spinners and loading indicators |
| **cli-progress** | ^3.12.0 | Progress bars |
| **open** | ^10.0.3 | Open URLs in browser |
| **minimist** | ^1.2.8 | Command-line argument parsing |
| **typescript** | ^5.3.3 | Type safety and compilation |

---

## 🛠️ Development

```bash
# Build
npm run build

# Clean build directory
npm run clean

# Development mode
npm run dev
```

**Project Structure:**
```
gitpick/
├── src/
│   ├── index.ts              # Main entry point
│   ├── config.ts             # Configuration constants
│   ├── types/                # TypeScript type definitions
│   └── utils/
│       ├── analytics.ts      # Scoring algorithms
│       ├── bookmarks.ts      # Bookmark management
│       ├── cache.ts          # Caching system
│       ├── export.ts         # Export functionality
│       ├── githubActions.ts  # GitHub API integration
│       ├── templates.ts      # Quick search templates
│       ├── userConfig.ts     # User configuration
│       └── visualEffects.ts  # Terminal visuals
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 📝 Examples

### Finding Beginner-Friendly React Projects
```bash
gitpick
# Select: TypeScript
# Keywords: react component library
# Min stars: 100
# Good first issues: Yes
# Show only active: Yes
```

### Comparing Popular Frameworks
```bash
gitpick --compare react,vue,svelte
```

### Quick Hacktoberfest Search
```bash
gitpick --hacktoberfest
```

---

## 🤝 Contributing

Contributions welcome! This tool itself is open for contributions.

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

## 📄 License

MIT

---

## 🙏 Acknowledgments

Built with TypeScript and powered by the GitHub API.

---

**Made with ❤️ for the open-source community**

🔗 **Repository:** https://github.com/DanyXC01/gitpick
