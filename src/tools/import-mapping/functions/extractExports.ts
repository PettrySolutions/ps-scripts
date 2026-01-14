/**
 * Functions for extracting export statements from source files
 */

import * as fs from 'fs';
import * as path from 'path';
import { ErrorResult } from '../types/ErrorResult';

export type ExportType = 'named' | 'default' | 're-export' | 'type';

export interface ExportInfo {
  name: string;
  exportType: ExportType;
  isTypeOnly: boolean;
  sourceFile: string;
  /** For re-exports, the original source module */
  reExportSource?: string;
}

export interface PackageExports {
  packageName: string;
  packagePath: string;
  exports: ExportInfo[];
}

/**
 * Extracts named exports from a line
 * Example: export { Button, Input }
 * Example: export { Button as Btn }
 */
export const extractNamedExportsFromLine = (line: string, sourceFile: string): ExportInfo[] => {
  const result: ExportInfo[] = [];
  
  // Match: export [type] { ... }
  const namedMatch = line.match(/export\s+(?:(type)\s+)?\{([^}]+)\}/);
  if (!namedMatch) {
    return result;
  }
  
  const isTypeExport = namedMatch[1] === 'type';
  const exportList = namedMatch[2];
  
  // Check if this is a re-export: export { ... } from '...'
  const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
  const reExportSource = fromMatch ? fromMatch[1] : undefined;
  
  const items = exportList.split(',').map(item => item.trim()).filter(Boolean);
  
  for (const item of items) {
    // Handle "Name as Alias" - we want the exported name (Alias if aliased, else Name)
    const parts = item.split(/\s+as\s+/);
    const exportedName = parts.length > 1 ? parts[1].trim() : parts[0].trim();
    
    result.push({
      name: exportedName,
      exportType: reExportSource ? 're-export' : (isTypeExport ? 'type' : 'named'),
      isTypeOnly: isTypeExport,
      sourceFile,
      reExportSource
    });
  }
  
  return result;
};

/**
 * Extracts export declarations (const, function, class, interface, type)
 * Example: export const Button = ...
 * Example: export function useHook() ...
 * Example: export class MyClass ...
 * Example: export interface Props ...
 * Example: export type Config = ...
 */
export const extractDeclarationExport = (line: string, sourceFile: string): ExportInfo | null => {
  // Match: export [declare] (const|let|var|function|class|interface|type|enum) Name
  const declMatch = line.match(/export\s+(?:declare\s+)?(const|let|var|function|async\s+function|class|interface|type|enum)\s+(\w+)/);
  if (!declMatch) {
    return null;
  }
  
  const declType = declMatch[1].replace('async ', '');
  const name = declMatch[2];
  
  const isTypeOnly = declType === 'interface' || declType === 'type';
  
  return {
    name,
    exportType: isTypeOnly ? 'type' : 'named',
    isTypeOnly,
    sourceFile
  };
};

/**
 * Extracts default exports
 * Example: export default Button
 * Example: export default function() ...
 * Example: export default class ...
 */
export const extractDefaultExport = (line: string, sourceFile: string): ExportInfo | null => {
  // Check if it's a default export
  if (!line.match(/export\s+default\b/)) {
    return null;
  }
  
  // Try to extract the name if it's a named default export
  // export default function Name() or export default class Name
  const namedMatch = line.match(/export\s+default\s+(?:function|class)\s+(\w+)/);
  const name = namedMatch ? namedMatch[1] : 'default';
  
  return {
    name,
    exportType: 'default',
    isTypeOnly: false,
    sourceFile
  };
};

/**
 * Extracts wildcard re-exports
 * Example: export * from './Button'
 * Example: export * as utils from './utils'
 */
export const extractWildcardReExport = (line: string, sourceFile: string): ExportInfo | null => {
  // Match: export * [as Name] from '...'
  const wildcardMatch = line.match(/export\s+\*\s*(?:as\s+(\w+))?\s*from\s+['"]([^'"]+)['"]/);
  if (!wildcardMatch) {
    return null;
  }
  
  const alias = wildcardMatch[1];
  const source = wildcardMatch[2];
  
  return {
    name: alias || '*',
    exportType: 're-export',
    isTypeOnly: false,
    sourceFile,
    reExportSource: source
  };
};

/**
 * Parses all exports from file content
 */
export const parseExportsFromContent = (content: string, sourceFile: string): ExportInfo[] => {
  const exportsList: ExportInfo[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip non-export lines
    if (!trimmed.startsWith('export')) {
      continue;
    }
    
    // Try each export type
    const namedExports = extractNamedExportsFromLine(trimmed, sourceFile);
    if (namedExports.length > 0) {
      exportsList.push(...namedExports);
      continue;
    }
    
    const defaultExport = extractDefaultExport(trimmed, sourceFile);
    if (defaultExport) {
      exportsList.push(defaultExport);
      continue;
    }
    
    const declExport = extractDeclarationExport(trimmed, sourceFile);
    if (declExport) {
      exportsList.push(declExport);
      continue;
    }
    
    const wildcardExport = extractWildcardReExport(trimmed, sourceFile);
    if (wildcardExport) {
      exportsList.push(wildcardExport);
      continue;
    }
  }
  
  return exportsList;
};

/**
 * Default ignore patterns for source file scanning
 */
const DEFAULT_IGNORE_PATTERNS = ['node_modules', 'dist', 'build', '.git', '__tests__', 'test', 'tests'];

/**
 * Recursively scans a directory for TypeScript/JavaScript files
 * @param dirPath - Directory path to scan (can be relative or absolute)
 * @param ignorePatterns - Directory names to ignore (defaults to common build/test directories)
 */
export const findSourceFiles = (
  dirPath: string,
  ignorePatterns: string[] = DEFAULT_IGNORE_PATTERNS
): ErrorResult<string[]> => {
  try {
    // Resolve to absolute path to handle relative paths correctly
    const absoluteDirPath = path.resolve(dirPath);
    
    // Check if directory exists
    if (!fs.existsSync(absoluteDirPath)) {
      return [null, new Error(`Directory does not exist: ${absoluteDirPath}`)];
    }
    
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.mts', '.mjs'];
    
    const scanDir = (currentPath: string) => {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        
        if (entry.isDirectory()) {
          // Skip directories matching ignore patterns
          if (!ignorePatterns.includes(entry.name)) {
            scanDir(fullPath);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    scanDir(absoluteDirPath);
    return [files, null];
  } catch (error) {
    return [null, error instanceof Error ? error : new Error(String(error))];
  }
};

/**
 * Extracts all exports from a package directory
 * @param packagePath - Path to the package directory (can be relative or absolute)
 * @param packageName - Published package name (e.g., "@myorg/ui")
 * @param ignorePatterns - Directory patterns to ignore during scanning
 */
export const extractPackageExports = (
  packagePath: string,
  packageName: string,
  ignorePatterns?: string[]
): ErrorResult<PackageExports> => {
  // Resolve to absolute path
  const absolutePath = path.resolve(packagePath);
  
  const [files, findError] = findSourceFiles(absolutePath, ignorePatterns);
  if (findError) {
    return [null, findError];
  }
  
  if (!files || files.length === 0) {
    // Return empty exports if no files found, but don't fail
    return [{
      packageName,
      packagePath: absolutePath,
      exports: []
    }, null];
  }
  
  const allExports: ExportInfo[] = [];
  const failedFiles: Array<{ path: string; error: string }> = [];
  
  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(absolutePath, filePath);
      const fileExports = parseExportsFromContent(content, relativePath);
      allExports.push(...fileExports);
    } catch (error) {
      // Track failed files but continue processing
      const errorMsg = error instanceof Error ? error.message : String(error);
      failedFiles.push({ path: filePath, error: errorMsg });
    }
  }
  
  // Log warning if some files failed
  if (failedFiles.length > 0) {
    console.warn(`Warning: Could not read ${failedFiles.length} file(s) in ${packageName}:`);
    failedFiles.forEach(f => console.warn(`  - ${f.path}: ${f.error}`));
  }
  
  return [{
    packageName,
    packagePath: absolutePath,
    exports: allExports
  }, null];
};

/**
 * Extracts exports from multiple packages
 * @param packages - Array of package configs with path and name
 * @param ignorePatterns - Directory patterns to ignore during scanning
 */
export const extractAllPackageExports = (
  packages: Array<{ path: string; name: string }>,
  ignorePatterns?: string[]
): ErrorResult<PackageExports[]> => {
  const results: PackageExports[] = [];
  
  for (const pkg of packages) {
    const [pkgExports, error] = extractPackageExports(pkg.path, pkg.name, ignorePatterns);
    if (error) {
      return [null, new Error(`Failed to extract exports from ${pkg.name}: ${error.message}`)];
    }
    if (pkgExports) {
      results.push(pkgExports);
    }
  }
  
  return [results, null];
};
