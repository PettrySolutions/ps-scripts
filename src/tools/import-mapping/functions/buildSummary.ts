/**
 * Functions for building summary analytics
 */

import { ErrorResult } from '../types/ErrorResult';
import { RepoPackagesOutput } from '../types/RepoPackagesOutput';
import { ExportUsageOutput } from '../types/ExportUsageOutput';
import { 
  SummaryOutput, 
  TopImport, 
  UnusedExport, 
  SingleConsumerExport, 
  PackageStats,
  ConfigSummary,
  ConsumerImportCount
} from '../types/SummaryOutput';
import { InputConfig } from '../types/InputConfig';

/**
 * Extracts top imports across the codebase
 */
const extractTopImports = (exportUsage: ExportUsageOutput, limit: number = 20): TopImport[] => {
  const allImports: TopImport[] = [];

  for (const pkg of exportUsage.packages) {
    for (const exp of pkg.exports) {
      if (!exp.isUsed) continue;

      const consumerCount = 
        exp.consumers.repositories.length + 
        exp.consumers.packages.length;

      allImports.push({
        packageName: pkg.packageName,
        exportName: exp.exportName,
        usageCount: exp.usageCount,
        consumerCount
      });
    }
  }

  // Sort by usage count descending
  allImports.sort((a, b) => b.usageCount - a.usageCount);

  return allImports.slice(0, limit);
};

/**
 * Extracts all unused exports
 */
const extractUnusedExports = (exportUsage: ExportUsageOutput): UnusedExport[] => {
  const unused: UnusedExport[] = [];

  for (const pkg of exportUsage.packages) {
    for (const exp of pkg.exports) {
      if (!exp.isUsed) {
        unused.push({
          packageName: pkg.packageName,
          exportName: exp.exportName,
          exportType: exp.exportType
        });
      }
    }
  }

  // Sort by package name, then export name
  unused.sort((a, b) => {
    const pkgCompare = a.packageName.localeCompare(b.packageName);
    return pkgCompare !== 0 ? pkgCompare : a.exportName.localeCompare(b.exportName);
  });

  return unused;
};

/**
 * Extracts exports used by only one consumer
 */
const extractSingleConsumerExports = (exportUsage: ExportUsageOutput): SingleConsumerExport[] => {
  const singleConsumer: SingleConsumerExport[] = [];

  for (const pkg of exportUsage.packages) {
    for (const exp of pkg.exports) {
      if (!exp.isUsed) continue;

      const totalConsumers = 
        exp.consumers.repositories.length + 
        exp.consumers.packages.length;

      if (totalConsumers === 1) {
        // Find the single consumer
        const consumer = exp.consumers.repositories[0] || exp.consumers.packages[0];
        
        singleConsumer.push({
          packageName: pkg.packageName,
          exportName: exp.exportName,
          consumer: consumer.name,
          fileCount: consumer.fileCount
        });
      }
    }
  }

  // Sort by package name, then export name
  singleConsumer.sort((a, b) => {
    const pkgCompare = a.packageName.localeCompare(b.packageName);
    return pkgCompare !== 0 ? pkgCompare : a.exportName.localeCompare(b.exportName);
  });

  return singleConsumer;
};

/**
 * Computes top consumers for a package
 */
const computeTopConsumers = (
  packageName: string,
  exportUsage: ExportUsageOutput,
  limit: number = 5
): ConsumerImportCount[] => {
  const pkg = exportUsage.packages.find(p => p.packageName === packageName);
  if (!pkg) return [];

  const consumerCounts = new Map<string, number>();

  for (const exp of pkg.exports) {
    for (const repo of exp.consumers.repositories) {
      const current = consumerCounts.get(repo.name) || 0;
      consumerCounts.set(repo.name, current + 1);
    }
    for (const pkgConsumer of exp.consumers.packages) {
      const current = consumerCounts.get(pkgConsumer.name) || 0;
      consumerCounts.set(pkgConsumer.name, current + 1);
    }
  }

  const consumers: ConsumerImportCount[] = Array.from(consumerCounts.entries())
    .map(([name, importCount]) => ({ name, importCount }));

  consumers.sort((a, b) => b.importCount - a.importCount);

  return consumers.slice(0, limit);
};

/**
 * Computes per-package statistics
 */
const computePackageStats = (exportUsage: ExportUsageOutput): PackageStats[] => {
  return exportUsage.packages.map(pkg => ({
    packageName: pkg.packageName,
    totalExports: pkg.summary.totalExports,
    usedExports: pkg.summary.usedExports,
    unusedExports: pkg.summary.unusedExports,
    usageRate: Math.round(pkg.summary.usageRate * 100),
    topConsumers: computeTopConsumers(pkg.packageName, exportUsage)
  }));
};

/**
 * Computes total files scanned
 */
const computeTotalFilesScanned = (repoPackages: RepoPackagesOutput): number => {
  let total = 0;
  
  for (const repo of repoPackages.repositories) {
    total += repo.files.length;
  }
  
  for (const pkg of repoPackages.packages) {
    total += pkg.files.length;
  }
  
  return total;
};

/**
 * Builds config summary
 */
const buildConfigSummary = (
  config: InputConfig,
  repoPackages: RepoPackagesOutput
): ConfigSummary => {
  return {
    repositoriesAnalyzed: config.repositories.length,
    packagesAnalyzed: config.packages.length,
    packageNamesTracked: config.packages.map(p => p.name),
    totalFilesScanned: computeTotalFilesScanned(repoPackages)
  };
};

/**
 * Builds the complete summary output
 * @param config - Input configuration
 * @param repoPackages - Import data from buildRepoPackagesOutput
 * @param exportUsage - Export usage data from buildExportUsageOutput
 * @returns SummaryOutput
 */
export const buildSummaryOutput = (
  config: InputConfig,
  repoPackages: RepoPackagesOutput,
  exportUsage: ExportUsageOutput
): ErrorResult<SummaryOutput> => {
  try {
    const summary: SummaryOutput = {
      generatedAt: new Date().toISOString(),
      config: buildConfigSummary(config, repoPackages),
      topImports: extractTopImports(exportUsage),
      unusedExports: extractUnusedExports(exportUsage),
      singleConsumerExports: extractSingleConsumerExports(exportUsage),
      packageStats: computePackageStats(exportUsage)
    };

    return [summary, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
