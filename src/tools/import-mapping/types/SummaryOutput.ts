/**
 * A top imported value across the codebase
 */
export interface TopImport {
  /**
   * Package the import comes from
   */
  packageName: string;
  
  /**
   * Name of the exported value
   */
  exportName: string;
  
  /**
   * Number of unique file locations
   */
  usageCount: number;
  
  /**
   * Number of distinct consumers (repos + packages)
   */
  consumerCount: number;
}

/**
 * An unused export
 */
export interface UnusedExport {
  /**
   * Package the export comes from
   */
  packageName: string;
  
  /**
   * Name of the export
   */
  exportName: string;
  
  /**
   * Type of export
   */
  exportType: string;
}

/**
 * An export used by only one consumer
 */
export interface SingleConsumerExport {
  /**
   * Package the export comes from
   */
  packageName: string;
  
  /**
   * Name of the export
   */
  exportName: string;
  
  /**
   * The single consumer using this export
   */
  consumer: string;
  
  /**
   * Number of files in that consumer using this export
   */
  fileCount: number;
}

/**
 * A consumer with import count
 */
export interface ConsumerImportCount {
  /**
   * Consumer name
   */
  name: string;
  
  /**
   * Total unique imports from the package
   */
  importCount: number;
}

/**
 * Statistics for a single package
 */
export interface PackageStats {
  /**
   * Package name
   */
  packageName: string;
  
  /**
   * Total number of exports
   */
  totalExports: number;
  
  /**
   * Number of used exports
   */
  usedExports: number;
  
  /**
   * Number of unused exports
   */
  unusedExports: number;
  
  /**
   * Usage rate as percentage (0-100)
   */
  usageRate: number;
  
  /**
   * Top consumers of this package
   */
  topConsumers: ConsumerImportCount[];
}

/**
 * Configuration summary
 */
export interface ConfigSummary {
  /**
   * Number of repositories analyzed
   */
  repositoriesAnalyzed: number;
  
  /**
   * Number of packages analyzed
   */
  packagesAnalyzed: number;
  
  /**
   * List of package names being tracked
   */
  packageNamesTracked: string[];
  
  /**
   * Total files scanned
   */
  totalFilesScanned: number;
}

/**
 * High-level analytics output (Summary view)
 */
export interface SummaryOutput {
  /**
   * Timestamp when this output was generated
   */
  generatedAt: string;
  
  /**
   * Configuration summary
   */
  config: ConfigSummary;
  
  /**
   * Most imported values across the codebase (top 20)
   */
  topImports: TopImport[];
  
  /**
   * Exports with zero usage
   */
  unusedExports: UnusedExport[];
  
  /**
   * Exports used by only one consumer (candidates for moving)
   */
  singleConsumerExports: SingleConsumerExport[];
  
  /**
   * Per-package statistics
   */
  packageStats: PackageStats[];
}
