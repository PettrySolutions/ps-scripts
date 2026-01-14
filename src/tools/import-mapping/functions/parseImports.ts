/**
 * Simple regex patterns for parsing imports
 */

import { ImportedValue, ImportDetail, ImportType } from '../types/RepoPackagesOutput';

/**
 * Extracts the package name from an import statement
 * Supports: from '@test/ui', from "@test/ui/subpath"
 */
export const extractPackageName = (importLine: string): string | null => {
  const fromMatch = importLine.match(/from\s+['"]([^'"]+)['"]/);
  if (fromMatch) {
    return fromMatch[1];
  }
  
  // Handle side-effect imports: import '@test/ui'
  const sideEffectMatch = importLine.match(/import\s+['"]([^'"]+)['"]/);
  return sideEffectMatch ? sideEffectMatch[1] : null;
};

/**
 * Gets the base package name from a full import path
 * e.g., "@pkg/ui/Button" -> "@pkg/ui"
 */
export const getBasePackageName = (importPath: string, packageNames: string[]): string | null => {
  // Sort by length descending to match longest prefix first
  const sorted = [...packageNames].sort((a, b) => b.length - a.length);
  
  for (const pkgName of sorted) {
    if (importPath === pkgName || importPath.startsWith(pkgName + '/')) {
      return pkgName;
    }
  }
  
  return null;
};

/**
 * Checks if an import line is a type-only import
 */
export const isTypeOnlyImport = (importLine: string): boolean => {
  return /import\s+type\s/.test(importLine);
};

/**
 * Extracts named imports with full metadata
 * Example: import { Button, Input as Inp } from '@test/ui'
 * Example: import React, { useState } from 'react' (combined with default)
 */
export const extractNamedImportsEnhanced = (importLine: string): ImportedValue[] => {
  // Match named imports: { ... } - can be after default import like "import X, { ... }"
  const namedMatch = importLine.match(/\{([^}]+)\}/);
  if (!namedMatch) {
    return [];
  }

  const isTypeOnly = isTypeOnlyImport(importLine);
  
  return namedMatch[1]
    .split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
    .map(item => {
      const aliasParts = item.split(/\s+as\s+/);
      const name = aliasParts[0].trim().replace(/^["']|["']$/g, ''); // Handle string names
      const alias = aliasParts.length > 1 ? aliasParts[1].trim() : undefined;
      
      return {
        name,
        alias,
        importType: 'named' as ImportType,
        isTypeOnly
      };
    });
};

/**
 * Extracts namespace import with full metadata
 * Example: import * as utils from '@test/utils'
 */
export const extractNamespaceImportEnhanced = (importLine: string): ImportedValue | null => {
  const namespaceMatch = importLine.match(/import\s+\*\s+as\s+(\w+)/);
  if (!namespaceMatch) {
    return null;
  }

  return {
    name: '*',
    alias: namespaceMatch[1],
    importType: 'namespace' as ImportType,
    isTypeOnly: isTypeOnlyImport(importLine)
  };
};

/**
 * Extracts default import with full metadata
 * Example: import React from 'react'
 */
export const extractDefaultImportEnhanced = (importLine: string): ImportedValue | null => {
  // Don't match if it's a namespace import
  if (/import\s+\*\s+as/.test(importLine)) {
    return null;
  }
  
  // Match: import [type] DefaultImport [, {...}] from
  // But not: import { ... } from (no default)
  const defaultMatch = importLine.match(/import\s+(?:type\s+)?(\w+)(?:\s*,|\s+from)/);
  if (!defaultMatch) {
    return null;
  }
  
  // Make sure it's not matching the namespace 'as' part
  if (defaultMatch[1] === 'as') {
    return null;
  }

  return {
    name: 'default',
    alias: defaultMatch[1],
    importType: 'default' as ImportType,
    isTypeOnly: isTypeOnlyImport(importLine)
  };
};

/**
 * Checks if an import is a side-effect only import
 * Example: import '@test/ui'
 */
export const isSideEffectImport = (importLine: string): boolean => {
  // Side effect import has no import specifiers, just the module
  return /^import\s+['"][^'"]+['"]/.test(importLine.trim());
};

/**
 * Parses a single import line and extracts all imported values with metadata
 */
export const parseImportLine = (importLine: string): ImportedValue[] => {
  const values: ImportedValue[] = [];
  
  // Check for side-effect import first
  if (isSideEffectImport(importLine)) {
    values.push({
      name: '*',
      importType: 'side-effect',
      isTypeOnly: false
    });
    return values;
  }
  
  // Extract namespace import
  const namespaceImport = extractNamespaceImportEnhanced(importLine);
  if (namespaceImport) {
    values.push(namespaceImport);
  }
  
  // Extract default import (only if not a namespace import)
  if (!namespaceImport) {
    const defaultImport = extractDefaultImportEnhanced(importLine);
    if (defaultImport) {
      values.push(defaultImport);
    }
  }
  
  // Extract named imports
  const namedImports = extractNamedImportsEnhanced(importLine);
  values.push(...namedImports);
  
  return values;
};

/**
 * Parses import lines and returns detailed import information
 * @param importLines - Array of import statement strings
 * @param packageNames - List of package names to determine base package
 * @returns Array of ImportDetail objects with full metadata
 */
export const parseImportsEnhanced = (importLines: string[], packageNames: string[]): ImportDetail[] => {
  const result: ImportDetail[] = [];

  for (const line of importLines) {
    const importPath = extractPackageName(line);
    if (!importPath) {
      continue;
    }

    const basePackage = getBasePackageName(importPath, packageNames);
    if (!basePackage) {
      continue;
    }

    const importedValues = parseImportLine(line);
    
    if (importedValues.length > 0) {
      result.push({
        packageName: basePackage,
        importPath,
        importedValues
      });
    }
  }

  return result;
};

// ============================================
// Legacy functions for backward compatibility
// ============================================

/**
 * Extracts imported values from a named import
 * Example: import { Button, Input } from '@test/ui'
 * Returns: ['Button', 'Input']
 * @deprecated Use extractNamedImportsEnhanced for full metadata
 */
export const extractNamedImports = (importLine: string): string[] => {
  const namedMatch = importLine.match(/import\s+(?:type\s+)?\{([^}]+)\}/);
  if (!namedMatch) {
    return [];
  }

  const imports = namedMatch[1]
    .split(',')
    .map(item => {
      // Handle "as" aliases: "Button as Btn" -> "Button"
      const parts = item.trim().split(/\s+as\s+/);
      return parts[0].trim();
    })
    .filter(item => item.length > 0);

  return imports;
};

/**
 * Extracts namespace import
 * Example: import * as utils from '@test/utils'
 * Returns: ['utils']
 * @deprecated Use extractNamespaceImportEnhanced for full metadata
 */
export const extractNamespaceImport = (importLine: string): string[] => {
  const namespaceMatch = importLine.match(/import\s+\*\s+as\s+(\w+)/);
  if (!namespaceMatch) {
    return [];
  }

  return [namespaceMatch[1]];
};

/**
 * Extracts default import
 * Example: import React from 'react'
 * Returns: ['React']
 * @deprecated Use extractDefaultImportEnhanced for full metadata
 */
export const extractDefaultImport = (importLine: string): string[] => {
  // Match: import [type] DefaultImport [, {...}] from
  const defaultMatch = importLine.match(/import\s+(?:type\s+)?(\w+)\s*(?:,|\s+from)/);
  if (!defaultMatch) {
    return [];
  }

  return [defaultMatch[1]];
};

/**
 * Parses import lines and extracts imported values organized by package name
 * @param importLines - Array of import statement strings
 * @returns Record mapping package names to arrays of imported values
 * @deprecated Use parseImportsEnhanced for full metadata
 */
export const parseImports = (importLines: string[]): Record<string, string[]> => {
  const result: Record<string, string[]> = {};

  for (const line of importLines) {
    const packageName = extractPackageName(line);
    if (!packageName) {
      continue;
    }

    // Initialize array for this package if it doesn't exist
    if (!result[packageName]) {
      result[packageName] = [];
    }

    // Extract all types of imports
    const namedImports = extractNamedImports(line);
    const namespaceImports = extractNamespaceImport(line);
    const defaultImports = extractDefaultImport(line);

    // Combine all imports
    const allImports = [...namedImports, ...namespaceImports, ...defaultImports];

    // Add unique imports to the result
    for (const importValue of allImports) {
      if (!result[packageName].includes(importValue)) {
        result[packageName].push(importValue);
      }
    }
  }

  return result;
};
