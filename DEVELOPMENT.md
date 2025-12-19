# Development Guide

## TypeScript Migration

This project has been fully migrated to TypeScript for better type safety and code quality.

## Project Structure

```
repo-finder/
├── src/                      # TypeScript source files
│   ├── index.ts             # Main CLI application
│   ├── config.ts            # Configuration constants
│   ├── types/
│   │   └── index.ts         # TypeScript type definitions
│   └── utils/
│       ├── analytics.ts     # Repository analytics and scoring
│       ├── cache.ts         # Search result caching
│       ├── export.ts        # Export functionality (JSON, MD, CSV, HTML)
│       ├── retry.ts         # Retry logic with exponential backoff
│       └── userConfig.ts    # User configuration management
├── dist/                     # Compiled JavaScript (git-ignored)
└── tsconfig.json            # TypeScript compiler configuration
```

## Development Workflow

### 1. Setup

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Making Changes

1. Edit TypeScript files in `src/`
2. Build the project: `npm run build`
3. Test your changes: `npm run dev` or `npm start`

### 3. Available Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run clean` - Remove dist/ directory
- `npm run dev` - Build and run the CLI
- `npm start` - Run the compiled CLI
- `npm run search` - Alias for npm start

### 4. Testing

```bash
# Build and test
npm run dev

# Or build separately and run
npm run build
npm start
```

## TypeScript Configuration

The project uses strict TypeScript settings:

- `strict: true` - All strict type-checking options enabled
- `noUnusedLocals: true` - Error on unused local variables
- `noUnusedParameters: true` - Error on unused function parameters
- `noImplicitReturns: true` - Error when not all code paths return a value
- `esModuleInterop: true` - Better CommonJS/ES module interop

## Type Definitions

All types are centralized in `src/types/index.ts`:

- `SearchParams` - Search configuration
- `RepoAnalysis` - Repository analysis result
- `UserConfig` - User configuration
- `CacheData<T>` - Generic cache data structure
- And many more...

## Key Refactorings

### 1. Type Safety
- All functions have proper type annotations
- Interfaces for all data structures
- No `any` types used

### 2. Code Organization
- Utility functions separated by concern
- Clear module boundaries
- Consistent error handling

### 3. Better Patterns
- Generic cache implementation
- Centralized type definitions
- Reusable helper functions

## Adding New Features

### 1. Add Types

```typescript
// src/types/index.ts
export interface NewFeature {
  id: string;
  data: string;
}
```

### 2. Implement Feature

```typescript
// src/utils/newFeature.ts
import type { NewFeature } from '../types/index.js';

export async function processFeature(data: NewFeature): Promise<void> {
  // Implementation
}
```

### 3. Use in Main

```typescript
// src/index.ts
import { processFeature } from './utils/newFeature.js';
```

## Common Issues

### Build Errors

If you get TypeScript errors:
1. Check `tsconfig.json` settings
2. Ensure all imports have `.js` extension (for ES modules)
3. Run `npm run clean && npm run build`

### Import Issues

Always use `.js` extension in imports (even for `.ts` files):

```typescript
// Correct
import { config } from './config.js';

// Wrong
import { config } from './config';
```

This is required for ES modules.

## Contributing

1. Make your changes in `src/`
2. Ensure TypeScript compiles without errors
3. Test the CLI thoroughly
4. Update this documentation if needed

## Type-Safe Patterns

### 1. Generic Functions

```typescript
export async function getCache<T>(
  params: SearchParams,
  ttl: number = DEFAULT_CONFIG.cacheTTL
): Promise<T | null> {
  // Implementation
}
```

### 2. Discriminated Unions

```typescript
type Result =
  | { success: true; data: string }
  | { success: false; error: string };
```

### 3. Type Guards

```typescript
function isError(error: unknown): error is Error {
  return error instanceof Error;
}
```

## Best Practices

1. **Always define types** - Don't rely on inference for complex structures
2. **Use interfaces for objects** - Easier to extend and compose
3. **Prefer `const` over `let`** - Immutability by default
4. **Use async/await** - Cleaner than promises
5. **Handle errors explicitly** - Don't catch and ignore

## Performance

- TypeScript compilation is fast (<2s for full rebuild)
- Incremental builds are even faster
- Source maps included for debugging
- Declaration files generated for library usage
