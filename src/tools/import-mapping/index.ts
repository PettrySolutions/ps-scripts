import { join } from 'path';
import { parseInputConfig } from './functions/parseInputConfig';
import { buildRepoPackagesOutputEnhanced } from './functions/buildRepoPackagesOutput';
import { extractAllPackageExports } from './functions/extractExports';
import { buildExportUsageOutput } from './functions/buildExportUsage';
import { buildSummaryOutput } from './functions/buildSummary';
import { writeJsonFile } from './functions/writeJsonFile';

/**
 * Main entry point for import-mapping tool
 * @param configPath - Path to the configuration JSON file
 */
export const importMapping = async (configPath: string): Promise<void> => {
  try {
    console.log('🔍 Starting import mapping analysis...\n');

    // Step 1: Parse configuration
    console.log('📋 Parsing configuration...');
    const [config, configError] = await parseInputConfig(configPath);
    
    if (configError || !config) {
      console.error('❌ Error parsing configuration:', configError?.message);
      process.exit(1);
    }

    const packageNames = config.packages.map(p => p.name);

    console.log(`✅ Configuration loaded successfully`);
    console.log(`   - Repositories: ${config.repositories.length}`);
    console.log(`   - Packages: ${config.packages.length}`);
    console.log(`   - Tracking: ${packageNames.join(', ')}\n`);

    // Step 2: Build consumer-centric output (RepoPackages.json)
    console.log('🔎 Analyzing repositories and packages for imports...');
    
    // Convert string[] repos to { path, name }[] format
    const repoConfigs = config.repositories.map(repoPath => ({
      path: repoPath,
      name: repoPath.split('/').pop() || repoPath
    }));

    const [repoPackagesOutput, buildError] = await buildRepoPackagesOutputEnhanced(
      repoConfigs,
      config.packages,
      packageNames,
      config.ignorePatterns || []
    );

    if (buildError || !repoPackagesOutput) {
      console.error('❌ Error analyzing repositories:', buildError?.message);
      process.exit(1);
    }

    const totalFiles = [
      ...repoPackagesOutput.repositories.flatMap(r => r.files),
      ...repoPackagesOutput.packages.flatMap(p => p.files)
    ].length;

    console.log(`✅ Import analysis complete`);
    console.log(`   - Files analyzed: ${totalFiles}\n`);

    // Step 3: Extract all exports from packages
    console.log('📦 Extracting exports from packages...');
    const [packageExports, exportError] = extractAllPackageExports(
      config.packages,
      config.ignorePatterns
    );

    if (exportError || !packageExports) {
      console.error('❌ Error extracting exports:', exportError?.message);
      process.exit(1);
    }

    const totalExports = packageExports.reduce((sum, pkg) => sum + pkg.exports.length, 0);
    console.log(`✅ Export extraction complete`);
    console.log(`   - Total exports found: ${totalExports}\n`);

    // Step 4: Build export-centric output (ExportUsage.json)
    console.log('📊 Building export usage analysis...');
    const [exportUsageOutput, usageError] = buildExportUsageOutput(packageExports, repoPackagesOutput);

    if (usageError || !exportUsageOutput) {
      console.error('❌ Error building export usage:', usageError?.message);
      process.exit(1);
    }

    const unusedCount = exportUsageOutput.packages.reduce((sum, pkg) => sum + pkg.summary.unusedExports, 0);
    console.log(`✅ Export usage analysis complete`);
    console.log(`   - Unused exports: ${unusedCount}\n`);

    // Step 5: Build summary output (Summary.json)
    console.log('📈 Building summary...');
    const [summaryOutput, summaryError] = buildSummaryOutput(config, repoPackagesOutput, exportUsageOutput);

    if (summaryError || !summaryOutput) {
      console.error('❌ Error building summary:', summaryError?.message);
      process.exit(1);
    }

    console.log(`✅ Summary built`);
    console.log(`   - Top imports: ${summaryOutput.topImports.length}`);
    console.log(`   - Single-consumer exports: ${summaryOutput.singleConsumerExports.length}\n`);

    // Step 6: Write output files
    console.log('💾 Writing output files...');
    
    const repoPackagesPath = join(config.outputDir, 'RepoPackages.json');
    const exportUsagePath = join(config.outputDir, 'ExportUsage.json');
    const summaryPath = join(config.outputDir, 'Summary.json');

    const [writeRepoSuccess, writeRepoError] = await writeJsonFile(repoPackagesPath, repoPackagesOutput);
    if (writeRepoError || !writeRepoSuccess) {
      console.error('❌ Error writing RepoPackages.json:', writeRepoError?.message);
      process.exit(1);
    }

    const [writeUsageSuccess, writeUsageError] = await writeJsonFile(exportUsagePath, exportUsageOutput);
    if (writeUsageError || !writeUsageSuccess) {
      console.error('❌ Error writing ExportUsage.json:', writeUsageError?.message);
      process.exit(1);
    }

    const [writeSummarySuccess, writeSummaryError] = await writeJsonFile(summaryPath, summaryOutput);
    if (writeSummaryError || !writeSummarySuccess) {
      console.error('❌ Error writing Summary.json:', writeSummaryError?.message);
      process.exit(1);
    }

    console.log(`✅ Output written successfully`);
    console.log(`   - ${repoPackagesPath}`);
    console.log(`   - ${exportUsagePath}`);
    console.log(`   - ${summaryPath}\n`);

    console.log('🎉 Import mapping analysis complete!');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
};

// Export for testing - enhanced functions
export { parseInputConfig } from './functions/parseInputConfig';
export { scanDirectory } from './functions/scanDirectory';
export { extractImportLines, extractImportLinesFromFile } from './functions/extractImportLines';
export { parseImports, parseImportsEnhanced } from './functions/parseImports';
export { 
  buildRepoPackagesOutput, 
  buildRepoPackagesOutputEnhanced,
  analyzeFileEnhanced,
  analyzeRepositoryEnhanced
} from './functions/buildRepoPackagesOutput';
export { 
  extractPackageExports, 
  extractAllPackageExports, 
  parseExportsFromContent,
  findSourceFiles 
} from './functions/extractExports';
export { buildExportUsageOutput, buildPackageExportUsage } from './functions/buildExportUsage';
export { buildSummaryOutput } from './functions/buildSummary';
export { writeJsonFile } from './functions/writeJsonFile';

// Export types
export * from './types/ErrorResult';
export * from './types/InputConfig';
export * from './types/RepoPackagesOutput';
export * from './types/ExportUsageOutput';
export * from './types/SummaryOutput';
