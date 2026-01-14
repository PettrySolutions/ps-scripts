/**
 * Type of import syntax used
 */
export type ImportType = 'named' | 'default' | 'namespace' | 'side-effect';

/**
 * File extension type
 */
export type FileType = 'ts' | 'tsx' | 'js' | 'jsx';

/**
 * Represents a single imported value with full metadata
 */
export interface ImportedValue {
  /**
   * Name of the imported value (e.g., "Button", "useState", "*" for namespace)
   */
  name: string;
  
  /**
   * Alias if renamed (e.g., "Button as Btn" → alias: "Btn")
   */
  alias?: string;
  
  /**
   * Type of import syntax used
   */
  importType: ImportType;
  
  /**
   * Whether this is a type-only import (import type { X })
   */
  isTypeOnly: boolean;
}

/**
 * Represents a single import statement with full details
 */
export interface ImportDetail {
  /**
   * Base package name (e.g., "@pkg/ui")
   */
  packageName: string;
  
  /**
   * Actual import path used (e.g., "@pkg/ui/Button" or "@pkg/ui")
   */
  importPath: string;
  
  /**
   * All values imported in this statement
   */
  importedValues: ImportedValue[];
}

/**
 * Represents imports found in a single file
 */
export interface FileImports {
  /**
   * Path to the file
   */
  filePath: string;
  
  /**
   * File extension type
   */
  fileType: FileType;
  
  /**
   * All import statements in this file
   */
  imports: ImportDetail[];
}

/**
 * Summary statistics for a consumer
 */
export interface ConsumerSummary {
  /**
   * Total number of import statements
   */
  totalImports: number;
  
  /**
   * Number of unique imported values
   */
  uniqueValues: number;
  
  /**
   * Breakdown by package: { "@pkg/ui": 15, "@pkg/utils": 8 }
   */
  packageBreakdown: Record<string, number>;
}

/**
 * Represents imports found in a repository or package
 */
export interface RepositoryImports {
  /**
   * Path to the repository or package
   */
  path: string;
  
  /**
   * Name derived from path or config (e.g., "repo-a", "package-1")
   */
  name: string;
  
  /**
   * All files with their imports
   */
  files: FileImports[];
  
  /**
   * Aggregated summary statistics
   */
  summary: ConsumerSummary;
}

/**
 * Output containing all repository and package imports (Consumer-centric view)
 */
export interface RepoPackagesOutput {
  /**
   * Timestamp when this output was generated
   */
  generatedAt: string;
  
  /**
   * Repository imports
   */
  repositories: RepositoryImports[];
  
  /**
   * Package imports (from monorepo packages consuming other packages)
   */
  packages: RepositoryImports[];
}