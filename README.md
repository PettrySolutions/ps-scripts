# @pettry-solutions/scripts

A modular CLI toolkit for analyzing and understanding JavaScript/TypeScript codebases.

## Installation

```bash
npm install -g @pettry-solutions/scripts
```

Or use directly with npx:

```bash
npx @pettry-solutions/scripts <command>
```

## Available Tools

### Import Mapping

Analyze import patterns across your JavaScript/TypeScript repositories to understand which exports from your packages are actually being used.

**Use cases:**
- Identify which exports from your packages are being consumed
- Discover unused exports that can be safely removed
- Understand import patterns across multiple repositories
- Audit package usage in a monorepo

#### Usage

```bash
ztc import-mapping <configPath>
```

#### Configuration

Create a JSON configuration file:

```json
{
  "repositories": [
    "path/to/repo-1",
    "path/to/repo-2"
  ],
  "packages": [
    {
      "path": "path/to/monorepo/packages/ui",
      "name": "@yourorg/ui"
    },
    {
      "path": "path/to/monorepo/packages/utils",
      "name": "@yourorg/utils"
    }
  ],
  "packageNames": [
    "@yourorg/ui",
    "@yourorg/utils"
  ],
  "ignorePatterns": [
    "node_modules",
    "dist",
    "build"
  ],
  "outputDir": "./output"
}
```

| Option | Required | Description |
|--------|----------|-------------|
| `repositories` | Yes | Array of repository paths to analyze |
| `packages` | Yes | Array of package configs with `path` (source directory) and `name` (published name) |
| `packageNames` | Yes | Package names to track imports for |
| `ignorePatterns` | No | Directories to skip (defaults: `node_modules`, `dist`, `build`, `.next`, `coverage`) |
| `outputDir` | Yes | Directory for output JSON files |

#### Output

The tool generates JSON output files containing:
- All imported values organized by repository and file
- Export usage statistics
- Summary of package utilization

#### Supported Import Syntaxes

- Named imports: `import { Button, Input } from '@pkg/ui'`
- Namespace imports: `import * as utils from '@pkg/utils'`
- Default imports: `import React from 'react'`
- Type imports: `import type { User } from '@pkg/core'`
- Subpath imports: `import { validate } from '@pkg/utils/validators'`
- Multi-line imports
- Mixed imports: `import React, { useState } from 'react'`

## License

MIT
