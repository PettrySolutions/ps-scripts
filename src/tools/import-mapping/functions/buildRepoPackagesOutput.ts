import { ErrorResult } from '../types/ErrorResult';
import { 
  RepoPackagesOutput, 
  RepositoryImports, 
  FileImports, 
  ConsumerSummary,
  FileType,
  ImportDetail
} from '../types/RepoPackagesOutput';
import { scanDirectory } from './scanDirectory';
import { extractImportLinesFromFile } from './extractImportLines';
import { parseImports, parseImportsEnhanced } from './parseImports';
import * as path from 'path';

/**
 * Gets the file type from file path
 */
export const getFileType = (filePath: string): FileType => {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.tsx': return 'tsx';
    case '.ts': return 'ts';
    case '.jsx': return 'jsx';
    case '.js':
    default: return 'js';
  }
};

/**
 * Computes summary statistics from import details
 */
export const computeConsumerSummary = (imports: ImportDetail[]): ConsumerSummary => {
  const packageBreakdown: Record<string, number> = {};
  const uniqueValues = new Set<string>();
  
  for (const importDetail of imports) {
    const pkg = importDetail.packageName;
    packageBreakdown[pkg] = (packageBreakdown[pkg] || 0) + importDetail.importedValues.length;
    
    for (const value of importDetail.importedValues) {
      uniqueValues.add(`${pkg}:${value.name}`);
    }
  }
  
  return {
    totalImports: imports.length,
    uniqueValues: uniqueValues.size,
    packageBreakdown
  };
};

/**
 * Aggregates summaries from multiple file imports
 */
export const aggregateSummaries = (files: FileImports[]): ConsumerSummary => {
  const packageBreakdown: Record<string, number> = {};
  const uniqueValues = new Set<string>();
  let totalImports = 0;
  
  for (const file of files) {
    for (const importDetail of file.imports) {
      totalImports++;
      const pkg = importDetail.packageName;
      packageBreakdown[pkg] = (packageBreakdown[pkg] || 0) + importDetail.importedValues.length;
      
      for (const value of importDetail.importedValues) {
        uniqueValues.add(`${pkg}:${value.name}`);
      }
    }
  }
  
  return {
    totalImports,
    uniqueValues: uniqueValues.size,
    packageBreakdown
  };
};

/**
 * Analyzes a single file for imports (enhanced version with full metadata)
 * @param filePath - Path to the file
 * @param packageNames - Package names to track
 * @returns ErrorResult containing FileImports or Error
 */
export const analyzeFileEnhanced = async (
  filePath: string,
  packageNames: string[]
): Promise<ErrorResult<FileImports | null>> => {
  const [importLines, extractError] = await extractImportLinesFromFile(filePath, packageNames);
  
  if (extractError) {
    return [null, extractError];
  }

  if (!importLines || importLines.length === 0) {
    return [null, null];
  }

  const imports = parseImportsEnhanced(importLines, packageNames);

  if (imports.length === 0) {
    return [null, null];
  }

  const fileImports: FileImports = {
    filePath,
    fileType: getFileType(filePath),
    imports
  };

  return [fileImports, null];
};

/**
 * Analyzes a repository or package directory for imports (enhanced version)
 * @param dirPath - Path to the directory
 * @param dirName - Name of the directory for output
 * @param packageNames - Package names to track
 * @param ignorePatterns - Patterns to ignore
 * @returns ErrorResult containing RepositoryImports or Error
 */
export const analyzeRepositoryEnhanced = async (
  dirPath: string,
  dirName: string,
  packageNames: string[],
  ignorePatterns: string[]
): Promise<ErrorResult<RepositoryImports>> => {
  const [files, scanError] = await scanDirectory(dirPath, ignorePatterns);
  
  if (scanError) {
    return [null, scanError];
  }

  if (!files || files.length === 0) {
    return [{
      path: dirPath,
      name: dirName,
      files: [],
      summary: {
        totalImports: 0,
        uniqueValues: 0,
        packageBreakdown: {}
      }
    }, null];
  }

  const fileImportsPromises = files.map(file => analyzeFileEnhanced(file, packageNames));
  const fileImportsResults = await Promise.all(fileImportsPromises);

  const fileImports: FileImports[] = [];
  for (const [result, error] of fileImportsResults) {
    if (error) {
      console.warn(`Warning: Failed to analyze file: ${error.message}`);
      continue;
    }
    if (result) {
      fileImports.push(result);
    }
  }

  const summary = aggregateSummaries(fileImports);

  const repositoryImports: RepositoryImports = {
    path: dirPath,
    name: dirName,
    files: fileImports,
    summary
  };

  return [repositoryImports, null];
};

/**
 * Builds the complete RepoPackagesOutput from config (enhanced version)
 * @param repositories - Array of repository configs { path, name }
 * @param packages - Array of package configs { path, name }
 * @param packageNames - Package names to track (the actual npm package names)
 * @param ignorePatterns - Patterns to ignore
 * @returns ErrorResult containing RepoPackagesOutput or Error
 */
export const buildRepoPackagesOutputEnhanced = async (
  repositories: Array<{ path: string; name: string }>,
  packages: Array<{ path: string; name: string }>,
  packageNames: string[],
  ignorePatterns: string[]
): Promise<ErrorResult<RepoPackagesOutput>> => {
  try {
    const repoPromises = repositories.map(repo => 
      analyzeRepositoryEnhanced(repo.path, repo.name, packageNames, ignorePatterns)
    );
    const repoResults = await Promise.all(repoPromises);

    const pkgPromises = packages.map(pkg => 
      analyzeRepositoryEnhanced(pkg.path, pkg.name, packageNames, ignorePatterns)
    );
    const pkgResults = await Promise.all(pkgPromises);

    const repoImports: RepositoryImports[] = [];
    const pkgImports: RepositoryImports[] = [];

    for (const [result, error] of repoResults) {
      if (error) {
        return [null, error];
      }
      if (result) {
        repoImports.push(result);
      }
    }

    for (const [result, error] of pkgResults) {
      if (error) {
        return [null, error];
      }
      if (result) {
        pkgImports.push(result);
      }
    }

    const output: RepoPackagesOutput = {
      generatedAt: new Date().toISOString(),
      repositories: repoImports,
      packages: pkgImports
    };

    return [output, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};

// ============================================
// Legacy functions for backward compatibility
// ============================================

/**
 * Analyzes a single file for imports
 * @param filePath - Path to the file
 * @param packageNames - Package names to track
 * @returns ErrorResult containing FileImports or Error
 * @deprecated Use analyzeFileEnhanced for full metadata
 */
export const analyzeFile = async (
  filePath: string,
  packageNames: string[]
): Promise<ErrorResult<FileImports | null>> => {
  const [importLines, extractError] = await extractImportLinesFromFile(filePath, packageNames);
  
  if (extractError) {
    return [null, extractError];
  }

  if (!importLines || importLines.length === 0) {
    // No imports found, return null to indicate this file can be skipped
    return [null, null];
  }

  const imports = parseImports(importLines);

  // Convert old format to new format for backward compatibility
  const importDetails: ImportDetail[] = Object.entries(imports).map(([packageName, values]) => ({
    packageName,
    importPath: packageName,
    importedValues: values.map(name => ({
      name,
      importType: 'named' as const,
      isTypeOnly: false
    }))
  }));

  const fileImports: FileImports = {
    filePath,
    fileType: getFileType(filePath),
    imports: importDetails
  };

  return [fileImports, null];
};

/**
 * Analyzes a repository or package directory for imports
 * @param dirPath - Path to the directory
 * @param packageNames - Package names to track
 * @param ignorePatterns - Patterns to ignore
 * @returns ErrorResult containing RepositoryImports or Error
 * @deprecated Use analyzeRepositoryEnhanced for full metadata
 */
export const analyzeRepository = async (
  dirPath: string,
  packageNames: string[],
  ignorePatterns: string[]
): Promise<ErrorResult<RepositoryImports>> => {
  // Scan directory for files
  const [files, scanError] = await scanDirectory(dirPath, ignorePatterns);
  
  if (scanError) {
    return [null, scanError];
  }

  const dirName = path.basename(dirPath);

  if (!files || files.length === 0) {
    // No files found, return empty repository
    return [{
      path: dirPath,
      name: dirName,
      files: [],
      summary: {
        totalImports: 0,
        uniqueValues: 0,
        packageBreakdown: {}
      }
    }, null];
  }

  // Analyze each file
  const fileImportsPromises = files.map(file => analyzeFile(file, packageNames));
  const fileImportsResults = await Promise.all(fileImportsPromises);

  // Filter out errors and null results
  const fileImports: FileImports[] = [];
  for (const [result, error] of fileImportsResults) {
    if (error) {
      // Log error but continue processing other files
      console.warn(`Warning: Failed to analyze file: ${error.message}`);
      continue;
    }
    if (result) {
      fileImports.push(result);
    }
  }

  const summary = aggregateSummaries(fileImports);

  const repositoryImports: RepositoryImports = {
    path: dirPath,
    name: dirName,
    files: fileImports,
    summary
  };

  return [repositoryImports, null];
};

/**
 * Builds the complete RepoPackagesOutput from config
 * @param repositories - Array of repository paths
 * @param packages - Array of package paths
 * @param packageNames - Package names to track
 * @param ignorePatterns - Patterns to ignore
 * @returns ErrorResult containing RepoPackagesOutput or Error
 * @deprecated Use buildRepoPackagesOutputEnhanced for full metadata
 */
export const buildRepoPackagesOutput = async (
  repositories: string[],
  packages: string[],
  packageNames: string[],
  ignorePatterns: string[]
): Promise<ErrorResult<RepoPackagesOutput>> => {
  try {
    // Analyze all repositories
    const repoPromises = repositories.map(repo => 
      analyzeRepository(repo, packageNames, ignorePatterns)
    );
    const repoResults = await Promise.all(repoPromises);

    // Analyze all packages
    const pkgPromises = packages.map(pkg => 
      analyzeRepository(pkg, packageNames, ignorePatterns)
    );
    const pkgResults = await Promise.all(pkgPromises);

    // Collect results
    const repoImports: RepositoryImports[] = [];
    const pkgImports: RepositoryImports[] = [];

    for (const [result, error] of repoResults) {
      if (error) {
        return [null, error];
      }
      if (result) {
        repoImports.push(result);
      }
    }

    for (const [result, error] of pkgResults) {
      if (error) {
        return [null, error];
      }
      if (result) {
        pkgImports.push(result);
      }
    }

    const output: RepoPackagesOutput = {
      generatedAt: new Date().toISOString(),
      repositories: repoImports,
      packages: pkgImports
    };

    return [output, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
