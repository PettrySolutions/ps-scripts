import { readFile } from 'fs/promises';
import { InputConfig, PackageConfig } from '../types/InputConfig';
import { ErrorResult } from '../types/ErrorResult';

/**
 * Validates if an object is a valid PackageConfig
 */
const isValidPackageConfig = (obj: any): obj is PackageConfig => {
  return obj && 
    typeof obj === 'object' && 
    typeof obj.path === 'string' && 
    typeof obj.name === 'string';
};

/**
 * Validates if an object conforms to InputConfig type
 * Supports both old format (packages as string[]) and new format (packages as PackageConfig[])
 */
export const validateInputConfig = (obj: any): obj is InputConfig => {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  if (!Array.isArray(obj.repositories) || !obj.repositories.every((r: any) => typeof r === 'string')) {
    return false;
  }

  // Support both formats for packages
  if (!Array.isArray(obj.packages)) {
    return false;
  }

  // Check if it's the new PackageConfig[] format
  const isNewFormat = obj.packages.length === 0 || isValidPackageConfig(obj.packages[0]);
  // Check if it's the old string[] format
  const isOldFormat = obj.packages.length === 0 || typeof obj.packages[0] === 'string';

  if (!isNewFormat && !isOldFormat) {
    return false;
  }

  // packageNames is optional - can be derived from packages
  if (obj.packageNames && (!Array.isArray(obj.packageNames) || !obj.packageNames.every((pn: any) => typeof pn === 'string'))) {
    return false;
  }

  if (!obj.outputDir || typeof obj.outputDir !== 'string') {
    return false;
  }

  if (obj.ignorePatterns && !Array.isArray(obj.ignorePatterns)) {
    return false;
  }

  return true;
};

/**
 * Normalizes InputConfig to ensure packages is always PackageConfig[]
 * and packageNames is derived from packages if not provided
 */
const normalizeConfig = (parsed: any): InputConfig => {
  let packages: PackageConfig[];
  
  // Convert old format to new format if needed
  if (parsed.packages.length === 0) {
    packages = [];
  } else if (typeof parsed.packages[0] === 'string') {
    // Old format: convert string paths to PackageConfig
    packages = (parsed.packages as string[]).map(pkgPath => ({
      path: pkgPath,
      // Derive name from path (last segment of path or use packageNames if available)
      name: parsed.packageNames?.[parsed.packages.indexOf(pkgPath)] || pkgPath.split('/').pop() || pkgPath
    }));
  } else {
    // Already in new format
    packages = parsed.packages;
  }

  // Derive packageNames from packages if not explicitly provided
  const packageNames = parsed.packageNames || packages.map(p => p.name);

  return {
    repositories: parsed.repositories,
    packages,
    packageNames,
    outputDir: parsed.outputDir,
    ignorePatterns: parsed.ignorePatterns || ['node_modules', 'dist', 'build', '.next', 'coverage']
  };
};

/**
 * Parses InputConfig from a JSON file
 * @param configPath - Path to the configuration JSON file
 * @returns ErrorResult containing InputConfig or Error
 */
export const parseInputConfig = async (configPath: string): Promise<ErrorResult<InputConfig>> => {
  try {
    const fileContent = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(fileContent);

    if (!validateInputConfig(parsed)) {
      return [null, new Error('Invalid configuration: does not conform to InputConfig type')];
    }

    const config = normalizeConfig(parsed);

    return [config, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
