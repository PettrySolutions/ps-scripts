# Import Mapping Tool

Analyze JavaScript and TypeScript repository import patterns to identify imported components, functions, constants, and types from specific packages.

## Purpose

This tool helps teams:
- Identify which exports from their packages are actually being used
- Discover unused exports that can be removed
- Understand import patterns across repositories
- Identify core exports for each package

## Usage

### 1. Create a Configuration File

Create a JSON configuration file (e.g., `config.json`):

```json
{
  "repositories": [
    "path/to/repo-1",
    "path/to/repo-2"
  ],
  "packages": [
    "path/to/package-1"
  ],
  "packageNames": [
    "@yourorg/ui",
    "@yourorg/utils",
    "@yourorg/core"
  ],
  "ignorePatterns": [
    "node_modules",
    "dist",
    "build"
  ],
  "outputDir": "./output"
}
```

### 2. Run the Tool

```bash
ztc import-mapping path/to/config.json
```

Or in development:

```bash
npm run dev -- import-mapping path/to/config.json
```

## Configuration

### `repositories` (required)
Array of repository paths to analyze.

### `packages` (required)
Array of standalone package paths to analyze.

### `packageNames` (required)
Array of package names to track imports for (e.g., `["@myorg/ui", "@myorg/utils"]`).

### `ignorePatterns` (optional)
Array of directory patterns to ignore. Defaults to:
```json
["node_modules", "dist", "build", ".next", "coverage"]
```

### `outputDir` (required)
Directory where output JSON files will be written.

## Output

### RepoPackages.json

Contains all imported values from the specified packages, organized by repository/package and file:

```json
{
  "repositories": [
    {
      "path": "path/to/repo-1",
      "files": [
        {
          "filePath": "path/to/repo-1/component.ts",
          "imports": {
            "@yourorg/ui": ["Button", "Input"],
            "@yourorg/utils": ["formatDate"]
          }
        }
      ]
    }
  ],
  "packages": [
    {
      "path": "path/to/package-1",
      "files": [...]
    }
  ]
}
```

## Supported Import Syntaxes

The tool supports all JavaScript/TypeScript import syntaxes:

- Named imports: `import { Button, Input } from '@pkg/ui'`
- Namespace imports: `import * as utils from '@pkg/utils'`
- Default imports: `import React from 'react'`
- Type imports: `import type { User } from '@pkg/core'`
- Subpath imports: `import { validate } from '@pkg/utils/validators'`
- Multi-line imports: 
  ```typescript
  import { 
    Card,
    Modal,
    Drawer 
  } from '@pkg/ui'
  ```
- Mixed imports: `import React, { useState } from 'react'`

## Architecture

Built following functional programming principles:

- Each function is pure and testable
- Go-style error handling with `ErrorResult<T>` type
- Each function has its own file and test suite
- Full test coverage with integration tests

## Files Analyzed

The tool scans for:
- `.ts` files
- `.tsx` files
- `.js` files
- `.jsx` files

Build artifacts and node_modules are automatically ignored based on the `ignorePatterns` configuration.
