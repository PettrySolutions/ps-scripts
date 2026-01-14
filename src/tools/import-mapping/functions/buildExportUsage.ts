/**
 * Functions for building export usage analysis
 */

import { ErrorResult } from '../types/ErrorResult';
import { RepoPackagesOutput, ImportDetail } from '../types/RepoPackagesOutput';
import { 
  ExportUsageOutput, 
  PackageExportUsage, 
  ExportEntry, 
  ConsumerUsage,
  ImportTypeBreakdown,
  PackageExportSummary
} from '../types/ExportUsageOutput';
import { PackageExports, ExportInfo } from './extractExports';

/**
 * Creates an empty import type breakdown
 */
const createEmptyBreakdown = (): ImportTypeBreakdown => ({
  named: 0,
  default: 0,
  namespace: 0,
  typeOnly: 0
});

/**
 * Maps export type from extractExports to ExportEntry type
 */
const mapExportType = (exportInfo: ExportInfo): ExportEntry['exportType'] => {
  if (exportInfo.exportType === 'default') return 'default';
  if (exportInfo.exportType === 're-export') return 're-export';
  if (exportInfo.exportType === 'type') return 'type';
  // For named exports, we can't determine const/function/class without more parsing
  return 'unknown';
};

/**
 * Collects all import usages for a specific export name from a package
 */
const collectUsagesForExport = (
  exportName: string,
  exportType: string,
  packageName: string,
  repoPackages: RepoPackagesOutput
): {
  repositories: Map<string, { files: string[]; breakdown: ImportTypeBreakdown; path: string }>;
  packages: Map<string, { files: string[]; breakdown: ImportTypeBreakdown; path: string }>;
  subpaths: Set<string>;
} => {
  const repositories = new Map<string, { files: string[]; breakdown: ImportTypeBreakdown; path: string }>();
  const packages = new Map<string, { files: string[]; breakdown: ImportTypeBreakdown; path: string }>();
  const subpaths = new Set<string>();

  // Helper to process imports from a consumer
  const processConsumer = (
    consumer: { name: string; path: string; files: { filePath: string; imports: ImportDetail[] }[] },
    targetMap: Map<string, { files: string[]; breakdown: ImportTypeBreakdown; path: string }>
  ) => {
    const consumerFiles: string[] = [];
    const breakdown = createEmptyBreakdown();

    for (const file of consumer.files) {
      for (const importDetail of file.imports) {
        // Check if this import is from our package
        if (importDetail.packageName !== packageName) continue;

        // Check if this import includes our export
        for (const value of importDetail.importedValues) {
          // Match by name directly
          let matchesName = value.name === exportName;
          
          // For default exports: if the export is a default export, 
          // match any default import (value.importType === 'default')
          if (!matchesName && exportType === 'default' && value.importType === 'default') {
            matchesName = true;
          }
          
          // Namespace imports include all exports
          if (!matchesName && value.importType === 'namespace') {
            matchesName = true;
          }

          if (matchesName) {
            if (!consumerFiles.includes(file.filePath)) {
              consumerFiles.push(file.filePath);
            }
            subpaths.add(importDetail.importPath);

            // Update breakdown
            if (value.isTypeOnly) {
              breakdown.typeOnly++;
            } else {
              switch (value.importType) {
                case 'named': breakdown.named++; break;
                case 'default': breakdown.default++; break;
                case 'namespace': breakdown.namespace++; break;
              }
            }
          }
        }
      }
    }

    if (consumerFiles.length > 0) {
      targetMap.set(consumer.name, {
        files: consumerFiles,
        breakdown,
        path: consumer.path
      });
    }
  };

  // Process all repositories
  for (const repo of repoPackages.repositories) {
    processConsumer(repo, repositories);
  }

  // Process all packages
  for (const pkg of repoPackages.packages) {
    processConsumer(pkg, packages);
  }

  return { repositories, packages, subpaths };
};

/**
 * Builds export entry from export info and usage data
 */
const buildExportEntry = (
  exportInfo: ExportInfo,
  packageName: string,
  repoPackages: RepoPackagesOutput
): ExportEntry => {
  const { repositories, packages, subpaths } = collectUsagesForExport(
    exportInfo.name,
    exportInfo.exportType,
    packageName,
    repoPackages
  );

  const repoConsumers: ConsumerUsage[] = Array.from(repositories.entries()).map(([name, data]) => ({
    name,
    path: data.path,
    fileCount: data.files.length,
    files: data.files,
    importTypes: data.breakdown
  }));

  const pkgConsumers: ConsumerUsage[] = Array.from(packages.entries()).map(([name, data]) => ({
    name,
    path: data.path,
    fileCount: data.files.length,
    files: data.files,
    importTypes: data.breakdown
  }));

  const totalUsageCount = repoConsumers.reduce((sum, c) => sum + c.fileCount, 0) +
                          pkgConsumers.reduce((sum, c) => sum + c.fileCount, 0);

  return {
    exportName: exportInfo.name,
    exportType: mapExportType(exportInfo),
    isUsed: totalUsageCount > 0,
    usageCount: totalUsageCount,
    usedViaSubpaths: Array.from(subpaths),
    consumers: {
      repositories: repoConsumers,
      packages: pkgConsumers
    }
  };
};

/**
 * Computes summary statistics for package exports
 */
const computePackageSummary = (exports: ExportEntry[]): PackageExportSummary => {
  const totalExports = exports.length;
  const usedExports = exports.filter(e => e.isUsed).length;
  const unusedExports = totalExports - usedExports;
  const usageRate = totalExports > 0 ? usedExports / totalExports : 0;

  return {
    totalExports,
    usedExports,
    unusedExports,
    usageRate
  };
};

/**
 * Builds export usage for a single package
 */
export const buildPackageExportUsage = (
  packageExports: PackageExports,
  repoPackages: RepoPackagesOutput
): PackageExportUsage => {
  // Deduplicate exports by name (can have same export from multiple files)
  const uniqueExports = new Map<string, ExportInfo>();
  for (const exp of packageExports.exports) {
    // Prefer non-re-export over re-export
    const existing = uniqueExports.get(exp.name);
    if (!existing || (existing.exportType === 're-export' && exp.exportType !== 're-export')) {
      uniqueExports.set(exp.name, exp);
    }
  }

  const exports: ExportEntry[] = Array.from(uniqueExports.values()).map(exp =>
    buildExportEntry(exp, packageExports.packageName, repoPackages)
  );

  // Sort by usage count descending
  exports.sort((a, b) => b.usageCount - a.usageCount);

  return {
    packageName: packageExports.packageName,
    packagePath: packageExports.packagePath,
    exports,
    summary: computePackageSummary(exports)
  };
};

/**
 * Builds complete export usage output
 * @param packageExportsList - All package exports from extractAllPackageExports
 * @param repoPackages - Import data from buildRepoPackagesOutput
 * @returns ExportUsageOutput
 */
export const buildExportUsageOutput = (
  packageExportsList: PackageExports[],
  repoPackages: RepoPackagesOutput
): ErrorResult<ExportUsageOutput> => {
  try {
    const packages: PackageExportUsage[] = packageExportsList.map(pkgExports =>
      buildPackageExportUsage(pkgExports, repoPackages)
    );

    // Sort packages by name for consistency
    packages.sort((a, b) => a.packageName.localeCompare(b.packageName));

    return [{
      generatedAt: new Date().toISOString(),
      packages
    }, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
