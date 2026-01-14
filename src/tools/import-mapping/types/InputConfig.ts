/**
 * Package configuration mapping source path to published name
 */
export interface PackageConfig {
  /**
   * Path to the package source directory
   */
  path: string;
  
  /**
   * Published package name (e.g., "@myorg/ui")
   */
  name: string;
}

/**
 * Configuration for import mapping analysis
 */
export interface InputConfig {
  /**
   * List of repository paths to analyze
   */
  repositories: string[];
  
  /**
   * List of monorepo packages with path and published name
   */
  packages: PackageConfig[];
  
  /**
   * Package names to track imports for (e.g., "@myorg/package")
   * These are the packages whose imports we want to analyze across repos
   */
  packageNames: string[];
  
  /**
   * Patterns to ignore (e.g., "node_modules", "dist")
   */
  ignorePatterns?: string[];
  
  /**
   * Output directory for generated JSON files
   */
  outputDir: string;
}