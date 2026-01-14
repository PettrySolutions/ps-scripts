/**
 * All exports for a package
 * Note: Implementation will be added later
 */
export interface PackageExports {
  /**
   * Package name
   */
  packageName: string;
  
  /**
   * List of unique exported values
   */
  exports: string[];
}

/**
 * Output containing all exports for tracked packages
 */
export interface AllExportsOutput {
  /**
   * All package exports
   */
  packages: PackageExports[];
}