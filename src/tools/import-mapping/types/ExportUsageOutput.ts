/**
 * How a consumer imports a specific export
 */
export interface ImportTypeBreakdown {
  /**
   * Count of named imports
   */
  named: number;
  
  /**
   * Count of default imports
   */
  default: number;
  
  /**
   * Count of namespace imports
   */
  namespace: number;
  
  /**
   * Count of type-only imports
   */
  typeOnly: number;
}

/**
 * Details about how a consumer uses an export
 */
export interface ConsumerUsage {
  /**
   * Name of the consumer (e.g., "repo-a", "package-1")
   */
  name: string;
  
  /**
   * Path to the consumer
   */
  path: string;
  
  /**
   * Number of files that import this export
   */
  fileCount: number;
  
  /**
   * Actual file paths where this export is imported
   */
  files: string[];
  
  /**
   * Breakdown of how the export is imported
   */
  importTypes: ImportTypeBreakdown;
}

/**
 * Information about a single export from a package
 */
export interface ExportEntry {
  /**
   * Name of the exported value (e.g., "Button", "formatDate")
   */
  exportName: string;
  
  /**
   * Type of export (const, function, class, type, interface, default, re-export)
   */
  exportType: 'const' | 'function' | 'class' | 'type' | 'interface' | 'default' | 're-export' | 'unknown';
  
  /**
   * Whether this export is used anywhere
   */
  isUsed: boolean;
  
  /**
   * Number of unique file locations that import this
   */
  usageCount: number;
  
  /**
   * All subpaths through which this export is imported
   * e.g., ["@pkg/ui", "@pkg/ui/Button"]
   */
  usedViaSubpaths: string[];
  
  /**
   * Consumers organized by type
   */
  consumers: {
    /**
     * Repositories that consume this export
     */
    repositories: ConsumerUsage[];
    
    /**
     * Other packages that consume this export
     */
    packages: ConsumerUsage[];
  };
}

/**
 * Summary statistics for a package's exports
 */
export interface PackageExportSummary {
  /**
   * Total number of exports from this package
   */
  totalExports: number;
  
  /**
   * Number of exports that are used
   */
  usedExports: number;
  
  /**
   * Number of exports that are not used anywhere
   */
  unusedExports: number;
  
  /**
   * Percentage of exports that are used (0-1)
   */
  usageRate: number;
}

/**
 * Export usage information for a single package
 */
export interface PackageExportUsage {
  /**
   * Published package name (e.g., "@myorg/ui")
   */
  packageName: string;
  
  /**
   * Path to the package source
   */
  packagePath: string;
  
  /**
   * All exports from this package
   */
  exports: ExportEntry[];
  
  /**
   * Summary statistics
   */
  summary: PackageExportSummary;
}

/**
 * Output containing export usage across the codebase (Export-centric view)
 */
export interface ExportUsageOutput {
  /**
   * Timestamp when this output was generated
   */
  generatedAt: string;
  
  /**
   * Export usage for each tracked package
   */
  packages: PackageExportUsage[];
}
