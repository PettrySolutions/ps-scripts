# Mock Structure for Integration Testing

This document describes the mock repository and package structure used for integration testing the `import-mapping` tool.

## Overview

The mock structure simulates a realistic monorepo environment with:
- **2 Consumer Repositories** (`repo-1`, `repo-2`) - Simulate external repos that consume packages
- **3 Packages** (`@test/ui`, `@test/utils`, `@test/core`) - Simulate shared monorepo packages

## Directory Structure

```
mocks/
├── inputConfig.json          # Configuration for the import-mapping tool
├── repo-1/                   # Consumer repository 1
│   ├── component1.ts         # Named imports from @test/ui and @test/utils
│   ├── component2.ts         # Multi-line imports, namespace imports, type imports
│   ├── hooks.ts              # Default + named imports combined
│   └── utils.ts              # Type-only imports
├── repo-2/                   # Consumer repository 2
│   ├── config.ts             # Type-only imports from @test/core
│   ├── form.tsx              # Subpath imports (@test/utils/validators)
│   ├── helpers.ts            # Re-exports pattern
│   └── page.tsx              # Aliased imports (Button as PrimaryButton)
└── monorepo/packages/
    ├── package-1/            # @test/ui package
    │   ├── index.ts          # Main exports (Button, Input, Card, Modal, etc.)
    │   ├── table.tsx         # Cross-package imports from @test/utils
    │   └── buttons.tsx       # Additional components, unused exports
    ├── pack-1/               # @test/utils package
    │   ├── index.ts          # Main exports (parseCSV, formatDate, logger, etc.)
    │   ├── validators.ts     # Submodule exports
    │   └── parsers.ts        # Submodule exports with internal imports
    └── pack-2/               # @test/core package
        ├── index.ts          # Main exports (Store, Config, Settings, User)
        └── components.tsx    # Cross-package imports from @test/ui and @test/utils
```

## Import Patterns Covered

### 1. Named Imports
```typescript
import { Button, Input } from '@test/ui';
```

### 2. Multi-line Named Imports
```typescript
import { 
  Card, 
  Modal,
  Drawer 
} from '@test/ui';
```

### 3. Namespace Imports
```typescript
import * as utils from '@test/utils';
```

### 4. Type-only Imports
```typescript
import type { Config, Settings } from '@test/core';
```

### 5. Default + Named Combined
```typescript
import Store, { useStore, createStore } from '@test/core';
```

### 6. Aliased Imports
```typescript
import { Button as PrimaryButton, Input as TextInput } from '@test/ui';
```

### 7. Subpath Imports
```typescript
import { validateEmail, validatePhone } from '@test/utils/validators';
```

### 8. Re-exports
```typescript
import { parseCSV, parseJSON } from '@test/utils';
export { parseCSV, parseJSON };
```

## Export Patterns Covered

### @test/ui (`package-1`)
- Function components: `Button`, `Input`, `Table`, `Card`, `Modal`, `Drawer`, `Select`, `Checkbox`
- Types: `ButtonProps`, `InputType`
- Default export: `UIProvider`
- Unused exports: `DeprecatedButton`

### @test/utils (`pack-1`)
- Functions: `parseCSV`, `parseJSON`, `formatDate`, `formatCurrency`, `deepClone`
- Object exports: `logger`
- Validator functions: `validateEmail`, `validatePhone`, `validateDate`, `validateRequired`
- Type exports: `DateFormat`
- Unused exports: `legacyParser`

### @test/core (`pack-2`)
- Functions: `createStore`, `useStore`
- Interfaces: `Config`, `Settings`, `User`, `StoreConfig`
- Types: `Action`
- Default export: `Store`
- Unused exports: `deprecatedInit`, `oldReducer`

## Test Scenarios

### RepoPackages.json Tests
- Verify all repositories are included
- Verify all packages are included
- Track file-level imports with correct package names
- Track type imports with `isTypeOnly` flag
- Track namespace imports
- Track multi-line imports
- Track subpath imports

### ExportUsage.json Tests
- Track used vs unused exports
- Handle namespace imports (marks all exports as potentially used)
- Count usage across multiple files
- Track consumers (repositories and packages)
- Summary statistics accuracy

### Summary.json Tests
- Top imports sorted by usage count
- Single-consumer exports identification
- Unused exports list
- Per-package statistics
- Configuration metadata

## Notes for Future Test Development

1. **Namespace Imports**: When a file uses `import * as X`, all exports from that package are marked as "used" because they're accessible via the namespace.

2. **Type-only Imports**: These are tracked separately with the `isTypeOnly` flag on imported values.

3. **Cross-package Imports**: Packages within the monorepo can import from each other, creating a dependency graph.

4. **Subpath Imports**: Imports like `@test/utils/validators` should be normalized to the base package name (`@test/utils`).

5. **Aliased Imports**: The original export name is tracked even when aliased (e.g., `Button as Btn` tracks `Button`).
