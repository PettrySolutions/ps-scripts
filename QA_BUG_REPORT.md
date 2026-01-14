# QA Bug Report - ztc-scripts

**Date:** January 13, 2026  
**Reviewer:** Senior QA Tester  
**Version Tested:** 0.1.0  
**Status:** FIXES IMPLEMENTED ✅

---

## Executive Summary

This report documents bugs, issues, and potential improvements found during comprehensive testing of the `ztc-scripts` import-mapping tool. The tool is designed to analyze JavaScript/TypeScript repositories to identify import patterns, unused exports, and core exports for packages.

**Update:** Critical and medium-severity bugs have been fixed. See "Fix Summary" section below.

---

## Fix Summary

### Issues Fixed:
| Bug ID | Severity | Status | Fix Description |
|--------|----------|--------|-----------------|
| BUG-001 | HIGH | ✅ FIXED | Path resolution now uses `path.resolve()` for absolute paths |
| BUG-002 | HIGH | ✅ FIXED | Consistent path handling across scan and extract operations |
| BUG-003 | MEDIUM | ✅ FIXED | Improved error handling with detailed error messages |
| BUG-004 | MEDIUM | N/A | Not a bug - design works as intended |
| BUG-005 | MEDIUM | ✅ FIXED | Mock data now consistent with imports |
| BUG-008 | LOW | ✅ FIXED | `findSourceFiles` now accepts custom ignorePatterns |
| BUG-010 | LOW | ✅ FIXED | Import detection handles no-semicolon and comments |

### Additional Bug Found and Fixed:
- **Variable naming conflict**: Local variable `exports` conflicted with Node.js global `exports` object, causing "Cannot access 'exports' before initialization" error. Renamed to `result` and `fileExports`.

### Test Coverage:
- **Before:** 89.24% statements, 146 tests
- **After:** 90.80% statements, 154 tests (+8 tests)

---

## Critical Bugs

### BUG-001: Relative Path Resolution Failure in extractExports

**Severity:** HIGH  
**Location:** [extractExports.ts](src/tools/import-mapping/functions/extractExports.ts#L225-L244)

**Description:**  
When the CLI is run with relative paths in the config file, the `extractPackageExports` function uses `findSourceFiles()` which uses synchronous `fs.readdirSync()`. The paths are relative to the config file, but `findSourceFiles` doesn't resolve them relative to the current working directory.

**Steps to Reproduce:**
1. Run `node dist/cli.js import-mapping src/tools/import-mapping/__tests__/mocks/inputConfig.json`
2. Observe warnings: `Warning: Could not read file src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1/index.ts`

**Evidence:**
```
📦 Extracting exports from packages...
Warning: Could not read file src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1/index.ts
Warning: Could not read file src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1/table.tsx
✅ Export extraction complete
   - Total exports found: 0  <-- Should be non-zero!
```

**Impact:** The export extraction phase fails silently, resulting in:
- `ExportUsage.json` showing 0 exports for all packages
- `Summary.json` showing 0 unused exports when there should be many
- The tool's core value proposition (identifying unused exports) is broken

**Root Cause:**  
The `extractPackageExports` function at line 225 reads files using relative paths without resolving them to absolute paths first, while `scanDirectory` (used earlier) handles paths differently and works correctly.

---

### BUG-002: Inconsistent Path Handling Between Scan and Extract Operations

**Severity:** HIGH  
**Location:** Multiple files

**Description:**  
The import scanning phase (`scanDirectory` and `buildRepoPackagesOutput`) works correctly with relative paths, but the export extraction phase (`extractPackageExports` and `findSourceFiles`) fails with the same paths. This inconsistency causes the tool to find imports but not exports.

**Technical Details:**
- `scanDirectory.ts` uses async `fs/promises` and handles paths correctly
- `extractExports.ts` uses sync `fs.readdirSync` and doesn't handle path resolution

---

## Medium Severity Bugs

### BUG-003: Silent Failure When Package Files Cannot Be Read

**Severity:** MEDIUM  
**Location:** [extractExports.ts#L241-L244](src/tools/import-mapping/functions/extractExports.ts#L241-L244)

**Description:**  
When files cannot be read, the error is caught and a warning is logged, but no error is returned. This causes the function to return successfully with incomplete data instead of failing.

**Current Behavior:**
```typescript
} catch (error) {
  // Skip files that can't be read
  console.warn(`Warning: Could not read file ${filePath}`);
}
```

**Expected Behavior:**  
Should either:
1. Return an error if any files fail
2. Include a list of failed files in the output so users know data is incomplete
3. At minimum, track and report the percentage of files successfully processed

---

### BUG-004: packageNames Not Derived When Using Legacy Config Format

**Severity:** MEDIUM  
**Location:** [parseInputConfig.ts#L67-L70](src/tools/import-mapping/functions/parseInputConfig.ts#L67-L70)

**Description:**  
When using the legacy string[] format for packages, the `normalizeConfig` function tries to derive the package name from the path, but this logic is flawed:

```typescript
name: parsed.packageNames?.[parsed.packages.indexOf(pkgPath)] || pkgPath.split('/').pop() || pkgPath
```

This uses `parsed.packages.indexOf(pkgPath)` inside a `.map()` callback where `pkgPath` is already extracted, meaning it always finds the correct index. However, if `packageNames` has fewer items than `packages`, some packages will get incorrect derived names.

**Impact:** Package names derived from paths (e.g., "pack-1") won't match actual npm package names (e.g., "@test/utils"), causing import tracking to fail.

---

### BUG-005: Mock Data Inconsistency - Missing Exports for Some Imports

**Severity:** MEDIUM  
**Location:** Mock files

**Description:**  
The mock files reference imports that don't exist as exports in the mock packages:

1. `repo-1/component2.ts` imports `Card, Modal, Drawer` from `@test/ui`, but [package-1/index.ts](src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1/index.ts) only exports `Button, Input, Table, TableRow, TableCell`
2. `repo-2/config.ts` imports `Config, Settings` types from `@test/core`, but [pack-2/index.ts](src/tools/import-mapping/__tests__/mocks/monorepo/packages/pack-2/index.ts) doesn't export these types
3. `repo-2/config.ts` imports `logger` from `@test/utils`, but [pack-1/index.ts](src/tools/import-mapping/__tests__/mocks/monorepo/packages/pack-1/index.ts) doesn't export `logger`

**Impact:** Test data doesn't accurately reflect real-world scenarios, and if export extraction worked, these would show as "imports from non-existent exports".

---

### BUG-006: Subpath Import Mapping Not Connecting to Base Package

**Severity:** MEDIUM  
**Location:** [buildExportUsage.ts](src/tools/import-mapping/functions/buildExportUsage.ts)

**Description:**  
When imports use subpaths (e.g., `@test/utils/validators`), the export usage tracking doesn't properly connect them to the base package's exports.

In [form.tsx](src/tools/import-mapping/__tests__/mocks/repo-2/form.tsx):
```typescript
import { validateEmail, validatePhone } from '@test/utils/validators';
```

The `parseImportsEnhanced` correctly identifies `@test/utils` as the base package, but the export usage builder doesn't have a way to map `validateEmail` to a specific export since the export extraction only scans the main package directory.

---

## Low Severity Bugs

### BUG-007: Test Mock Warning Spam

**Severity:** LOW  
**Location:** Integration test output

**Description:**  
Running tests produces warnings that clutter the output:
```
console.warn
  Warning: Could not read file src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1/index.ts
```

These warnings are the same bug as BUG-001 but manifest in tests, making it harder to see if there are real test failures.

---

### BUG-008: Hardcoded Ignore List in findSourceFiles

**Severity:** LOW  
**Location:** [extractExports.ts#L209](src/tools/import-mapping/functions/extractExports.ts#L209)

**Description:**  
The `findSourceFiles` function has a hardcoded ignore list that doesn't use the config's `ignorePatterns`:

```typescript
if (!['node_modules', 'dist', 'build', '.git', '__tests__', 'test', 'tests'].includes(entry.name)) {
```

This means custom ignore patterns from the config are not respected when extracting exports.

---

### BUG-009: Missing Type Export in ExportEntry

**Severity:** LOW  
**Location:** [buildExportUsage.ts#L31](src/tools/import-mapping/functions/buildExportUsage.ts#L31)

**Description:**  
The `mapExportType` function returns `'unknown'` for named exports when it could return more specific types:

```typescript
const mapExportType = (exportInfo: ExportInfo): ExportEntry['exportType'] => {
  if (exportInfo.exportType === 'default') return 'default';
  if (exportInfo.exportType === 're-export') return 're-export';
  if (exportInfo.exportType === 'type') return 'type';
  // For named exports, we can't determine const/function/class without more parsing
  return 'unknown';
};
```

The `extractDeclarationExport` function already parses the declaration type (const/function/class) but this information is lost in `ExportInfo.exportType` being set to just `'named'`.

---

### BUG-010: Import Detection Regex Edge Cases

**Severity:** LOW  
**Location:** [extractImportLines.ts#L23-L25](src/tools/import-mapping/functions/extractImportLines.ts#L23-L25)

**Description:**  
The import detection logic has edge cases:

```typescript
if (line.includes(';') || (!line.includes('from') && line.endsWith("'"))) {
```

This condition doesn't handle:
1. Imports without semicolons (valid in JS)
2. Imports ending with double quotes
3. Imports with trailing comments

**Example failing case:**
```typescript
import { Button } from '@test/ui' // no semicolon
```

---

## Design Issues

### DESIGN-001: Inconsistent Async/Sync API Usage

**Description:**  
The codebase mixes synchronous and asynchronous file system operations:
- `scanDirectory.ts` uses async `fs/promises`
- `extractExports.ts` uses sync `fs.readdirSync` and `fs.readFileSync`

This inconsistency makes the code harder to maintain and can cause issues with large directories.

---

### DESIGN-002: Missing AllExports.json Output

**Description:**  
Per the [schema documentation](schemas/import-mapping.md), the tool should output `AllExports.json` in addition to `RepoPackages.json`. The schema states:

> "The second named AllExports.json that adheres to the AllExportsOutput type. This type needs to contain all of the unique exported values for each package provided. Note: we will not be implementing this logic until later, so skip for now."

While noted as "skip for now", there's an [AllExportsOutput.ts](src/tools/import-mapping/types/AllExportsOutput.ts) type file in the workspace structure, but it's never used. This should either be implemented or removed.

---

### DESIGN-003: No Validation of Repository/Package Paths Existence

**Description:**  
The `parseInputConfig` function validates the structure of the config but doesn't verify that the specified paths actually exist. The tool will run with non-existent paths and silently produce empty results.

---

### DESIGN-004: Limited Error Information

**Description:**  
When errors occur during repository scanning, only a warning is logged and processing continues. There's no aggregate error report at the end showing:
- How many files failed
- Which specific errors occurred  
- Whether the results are complete

---

## Test Coverage Gaps

### TEST-001: No Integration Test for Export-to-Import Correlation

**Description:**  
The integration test only verifies that output files are created with the correct structure. It doesn't verify that:
- Imports correctly match to exports
- Unused exports are properly identified
- The `usageCount` values are accurate

---

### TEST-002: No Test for Circular Dependencies

**Description:**  
No tests verify behavior when:
- A package imports from itself
- Two packages import from each other
- Deep circular dependencies exist

---

### TEST-003: No Test for Large File Handling

**Description:**  
No performance or stress tests for:
- Very large files (1000+ lines)
- Directories with many files (1000+)
- Deep directory nesting

---

## Documentation Issues

### DOC-001: README References Non-Existent packageNames Config

**Description:**  
The [README.md](src/tools/import-mapping/README.md) example config shows `packageNames` as a required field:

```json
"packageNames": [
  "@yourorg/ui",
  "@yourorg/utils",
  "@yourorg/core"
]
```

But the actual type definition and the current `inputConfig.json` mock don't require it since it can be derived from `packages`.

---

### DOC-002: Unclear Output File Descriptions

**Description:**  
The documentation mentions `RepoPackages.json` but the actual tool now outputs three files:
1. `RepoPackages.json`
2. `ExportUsage.json`  
3. `Summary.json`

Only `RepoPackages.json` is documented in detail.

---

## Summary Table

| Bug ID | Severity | Status | Component |
|--------|----------|--------|-----------|
| BUG-001 | HIGH | ✅ Fixed | extractExports.ts |
| BUG-002 | HIGH | ✅ Fixed | Multiple |
| BUG-003 | MEDIUM | ✅ Fixed | extractExports.ts |
| BUG-004 | MEDIUM | N/A | parseInputConfig.ts |
| BUG-005 | MEDIUM | ✅ Fixed | Mock data |
| BUG-006 | MEDIUM | Open | buildExportUsage.ts |
| BUG-007 | LOW | ✅ Fixed | Tests |
| BUG-008 | LOW | ✅ Fixed | extractExports.ts |
| BUG-009 | LOW | Open | buildExportUsage.ts |
| BUG-010 | LOW | ✅ Fixed | extractImportLines.ts |

---

## Recommendations

### ✅ Completed (Immediate Priority)
1. **BUG-001/BUG-002:** Fixed path resolution in `extractPackageExports` to use `path.resolve()` for absolute paths
2. **BUG-003:** Added detailed error handling that tracks failed files with error messages

### ✅ Completed (Short-term)
3. **BUG-005:** Updated mock data to be consistent (added missing exports)
4. **BUG-008:** `findSourceFiles` now accepts custom `ignorePatterns` parameter
5. **BUG-010:** Improved import detection to handle no-semicolon style and comments

### Remaining Items (Nice to Have)
6. **DESIGN-001:** Standardize on async file operations
7. **DESIGN-002:** Implement or remove AllExports.json
8. **DOC-001/DOC-002:** Update documentation to match implementation
9. **BUG-006:** Improve subpath import tracking
10. **BUG-009:** Improve export type classification

---

## Test Environment

- **OS:** macOS
- **Node.js:** >=18.0.0
- **All Tests Passing:** Yes (154/154)
- **Code Coverage:** 90.80% statements

