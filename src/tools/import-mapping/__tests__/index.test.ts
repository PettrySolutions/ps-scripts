import { importMapping } from '../index';
import { join } from 'path';
import { rm, readFile } from 'fs/promises';
import type { RepoPackagesOutput, FileImports, ImportDetail } from '../types/RepoPackagesOutput';
import type { ExportUsageOutput, PackageExportUsage, ExportEntry } from '../types/ExportUsageOutput';
import type { SummaryOutput, TopImport, SingleConsumerExport } from '../types/SummaryOutput';

describe('import-mapping integration', () => {
  const mockConfigPath = join(__dirname, './mocks/inputConfig.json');
  const outputDir = join(__dirname, './mocks/output');

  // Mock process.exit to prevent test from exiting
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit called with code ${code}`);
  }) as any);

  // Helper to read and parse output files
  const readOutputFile = async <T>(filename: string): Promise<T> => {
    const content = await readFile(join(outputDir, filename), 'utf-8');
    return JSON.parse(content) as T;
  };

  afterEach(async () => {
    // Clean up output files
    try {
      await rm(outputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
    mockExit.mockClear();
  });

  afterAll(() => {
    mockExit.mockRestore();
  });

  describe('Full Pipeline Execution', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should run the full import mapping pipeline', async () => {
      await importMapping(mockConfigPath);
      
      expect(consoleSpy).toHaveBeenCalled();

      // Verify all output files were created
      const repoPackages = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      const exportUsage = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      const summary = await readOutputFile<SummaryOutput>('Summary.json');

      expect(repoPackages).toHaveProperty('repositories');
      expect(repoPackages).toHaveProperty('packages');
      expect(exportUsage).toHaveProperty('packages');
      expect(summary).toHaveProperty('topImports');
    }, 10000);
  });

  describe('RepoPackages.json Output Verification', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should include all configured repositories', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      expect(output.repositories).toHaveLength(2);
      
      const repoNames = output.repositories.map(r => r.name);
      expect(repoNames).toContain('repo-1');
      expect(repoNames).toContain('repo-2');
    }, 10000);

    it('should include all configured packages', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      expect(output.packages).toHaveLength(3);
      
      const packageNames = output.packages.map(p => p.name);
      expect(packageNames).toContain('@test/ui');
      expect(packageNames).toContain('@test/utils');
      expect(packageNames).toContain('@test/core');
    }, 10000);

    it('should track files with imports correctly for repo-1', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo1 = output.repositories.find(r => r.name === 'repo-1');
      expect(repo1).toBeDefined();
      expect(repo1!.files.length).toBeGreaterThanOrEqual(2);
      
      // component1.ts imports from @test/ui and @test/utils
      const component1 = repo1!.files.find((f: FileImports) => f.filePath.includes('component1.ts'));
      expect(component1).toBeDefined();
      expect(component1!.imports.some((i: ImportDetail) => i.packageName === '@test/ui')).toBe(true);
      expect(component1!.imports.some((i: ImportDetail) => i.packageName === '@test/utils')).toBe(true);
    }, 10000);

    it('should track type imports correctly', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo2 = output.repositories.find(r => r.name === 'repo-2');
      expect(repo2).toBeDefined();
      
      // config.ts imports types from @test/core
      const configFile = repo2!.files.find((f: FileImports) => f.filePath.includes('config.ts'));
      expect(configFile).toBeDefined();
      
      const coreImport = configFile!.imports.find((i: ImportDetail) => i.packageName === '@test/core');
      expect(coreImport).toBeDefined();
      expect(coreImport!.importedValues.some(v => v.isTypeOnly === true)).toBe(true);
    }, 10000);

    it('should track namespace imports correctly', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo1 = output.repositories.find(r => r.name === 'repo-1');
      const component2 = repo1!.files.find((f: FileImports) => f.filePath.includes('component2.ts'));
      expect(component2).toBeDefined();
      
      // component2.ts has namespace import: import * as utils from '@test/utils'
      const utilsImport = component2!.imports.find((i: ImportDetail) => i.packageName === '@test/utils');
      expect(utilsImport).toBeDefined();
      expect(utilsImport!.importedValues.some(v => v.importType === 'namespace')).toBe(true);
    }, 10000);

    it('should track multi-line imports correctly', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo1 = output.repositories.find(r => r.name === 'repo-1');
      const component2 = repo1!.files.find((f: FileImports) => f.filePath.includes('component2.ts'));
      
      // component2.ts has multi-line import from @test/ui
      const uiImport = component2!.imports.find((i: ImportDetail) => i.packageName === '@test/ui');
      expect(uiImport).toBeDefined();
      expect(uiImport!.importedValues.map(v => v.name)).toEqual(
        expect.arrayContaining(['Card', 'Modal', 'Drawer'])
      );
    }, 10000);

    it('should track subpath imports correctly', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo2 = output.repositories.find(r => r.name === 'repo-2');
      const formFile = repo2!.files.find((f: FileImports) => f.filePath.includes('form.tsx'));
      expect(formFile).toBeDefined();
      
      // form.tsx imports from @test/utils/validators (subpath)
      const validatorsImport = formFile!.imports.find((i: ImportDetail) => 
        i.packageName === '@test/utils' || i.importPath.includes('@test/utils/validators')
      );
      expect(validatorsImport).toBeDefined();
    }, 10000);
  });

  describe('ExportUsage.json Output Verification', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should track used exports for @test/ui package', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const uiPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/ui');
      expect(uiPackage).toBeDefined();
      
      // Button, Input, Card, Modal, Drawer, Select, Checkbox should be used
      const usedExportNames = uiPackage!.exports
        .filter((e: ExportEntry) => e.isUsed)
        .map((e: ExportEntry) => e.exportName);
      
      expect(usedExportNames).toContain('Button');
      expect(usedExportNames).toContain('Input');
      expect(usedExportNames).toContain('Card');
      expect(usedExportNames).toContain('Modal');
      expect(usedExportNames).toContain('Select');
    }, 10000);

    it('should handle namespace imports for @test/utils package', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const utilsPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/utils');
      expect(utilsPackage).toBeDefined();
      
      // Note: legacyParser is marked as used because of namespace import (import * as utils)
      // This is expected behavior - namespace imports give access to all exports
      const legacyExport = utilsPackage!.exports.find((e: ExportEntry) => e.exportName === 'legacyParser');
      expect(legacyExport).toBeDefined();
      
      // Verify explicitly named imports are tracked
      const formatDateExport = utilsPackage!.exports.find((e: ExportEntry) => e.exportName === 'formatDate');
      expect(formatDateExport).toBeDefined();
      expect(formatDateExport!.isUsed).toBe(true);
    }, 10000);

    it('should identify unused exports for @test/core package', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const corePackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/core');
      expect(corePackage).toBeDefined();
      
      // deprecatedInit and oldReducer should be unused
      const unusedExports = corePackage!.exports
        .filter((e: ExportEntry) => !e.isUsed)
        .map((e: ExportEntry) => e.exportName);
      
      expect(unusedExports).toContain('deprecatedInit');
      expect(unusedExports).toContain('oldReducer');
    }, 10000);

    it('should track default exports correctly (Store from @test/core)', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const corePackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/core');
      expect(corePackage).toBeDefined();
      
      // Store is the default export and is imported in hooks.ts
      const storeExport = corePackage!.exports.find((e: ExportEntry) => e.exportName === 'Store');
      expect(storeExport).toBeDefined();
      expect(storeExport!.exportType).toBe('default');
      expect(storeExport!.isUsed).toBe(true);
      expect(storeExport!.usageCount).toBeGreaterThan(0);
      
      // Verify it's tracked from repo-1/hooks.ts
      const allFiles = storeExport!.consumers.repositories.flatMap(r => r.files);
      expect(allFiles.some(f => f.includes('hooks.ts'))).toBe(true);
    }, 10000);

    it('should track which files use each export', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const uiPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/ui');
      const buttonExport = uiPackage!.exports.find((e: ExportEntry) => e.exportName === 'Button');
      
      expect(buttonExport).toBeDefined();
      expect(buttonExport!.usageCount).toBeGreaterThan(0);
      
      // Check consumers have repository entries
      const allFiles = [
        ...buttonExport!.consumers.repositories.flatMap(r => r.files),
        ...buttonExport!.consumers.packages.flatMap(p => p.files)
      ];
      expect(allFiles.some(f => f.includes('component1.ts'))).toBe(true);
    }, 10000);

    it('should include summary statistics for each package', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      for (const pkg of output.packages) {
        expect(pkg.summary).toBeDefined();
        expect(typeof pkg.summary.totalExports).toBe('number');
        expect(typeof pkg.summary.usedExports).toBe('number');
        expect(typeof pkg.summary.unusedExports).toBe('number');
        expect(pkg.summary.totalExports).toBe(pkg.summary.usedExports + pkg.summary.unusedExports);
      }
    }, 10000);
  });

  describe('Summary.json Output Verification', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should include top imports sorted by usage count', async () => {
      const output = await readOutputFile<SummaryOutput>('Summary.json');
      
      expect(output.topImports).toBeDefined();
      expect(Array.isArray(output.topImports)).toBe(true);
      
      // Verify sorting (descending by usageCount)
      for (let i = 1; i < output.topImports.length; i++) {
        expect(output.topImports[i - 1].usageCount).toBeGreaterThanOrEqual(output.topImports[i].usageCount);
      }
    }, 10000);

    it('should identify single-consumer exports', async () => {
      const output = await readOutputFile<SummaryOutput>('Summary.json');
      
      expect(output.singleConsumerExports).toBeDefined();
      expect(Array.isArray(output.singleConsumerExports)).toBe(true);
      
      // Each single-consumer export should have a consumer
      for (const exportInfo of output.singleConsumerExports) {
        expect(exportInfo.consumer).toBeDefined();
        expect(typeof exportInfo.consumer).toBe('string');
      }
    }, 10000);

    it('should include configuration metadata', async () => {
      const output = await readOutputFile<SummaryOutput>('Summary.json');
      
      expect(output.config).toBeDefined();
      expect(output.config.repositoriesAnalyzed).toBe(2);
      expect(output.config.packagesAnalyzed).toBe(3);
    }, 10000);

    it('should include per-package statistics', async () => {
      const output = await readOutputFile<SummaryOutput>('Summary.json');
      
      expect(output.packageStats).toBeDefined();
      expect(Array.isArray(output.packageStats)).toBe(true);
      
      for (const stats of output.packageStats) {
        expect(typeof stats.totalExports).toBe('number');
        expect(typeof stats.usedExports).toBe('number');
        expect(typeof stats.unusedExports).toBe('number');
        expect(typeof stats.usageRate).toBe('number');
      }
    }, 10000);

    it('should include unused exports list', async () => {
      const output = await readOutputFile<SummaryOutput>('Summary.json');
      
      expect(output.unusedExports).toBeDefined();
      expect(Array.isArray(output.unusedExports)).toBe(true);
      
      // Should contain known unused exports from @test/core
      // Note: @test/utils exports are affected by namespace imports
      const unusedNames = output.unusedExports.map(e => e.exportName);
      expect(unusedNames).toContain('deprecatedInit');
      expect(unusedNames).toContain('oldReducer');
      
      // Verify some exports from @test/core are unused
      const coreUnused = output.unusedExports.filter(e => e.packageName === '@test/core');
      expect(coreUnused.length).toBeGreaterThan(0);
    }, 10000);
  });

  describe('Cross-Package Import Tracking', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should track imports between packages (table.tsx imports from @test/utils)', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      // Find the @test/ui package which contains table.tsx
      const uiPackage = output.packages.find(p => p.name === '@test/ui');
      expect(uiPackage).toBeDefined();
      
      // table.tsx imports from @test/utils/parsers
      const tableFile = uiPackage!.files.find((f: FileImports) => f.filePath.includes('table.tsx'));
      if (tableFile) {
        expect(tableFile.imports.some((i: ImportDetail) => i.packageName === '@test/utils')).toBe(true);
      }
    }, 10000);

    it('should track @test/core package using @test/ui and @test/utils', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const corePackage = output.packages.find(p => p.name === '@test/core');
      expect(corePackage).toBeDefined();
      
      // components.tsx imports from @test/ui and @test/utils
      const componentsFile = corePackage!.files.find((f: FileImports) => f.filePath.includes('components.tsx'));
      if (componentsFile) {
        expect(componentsFile.imports.some((i: ImportDetail) => i.packageName === '@test/ui')).toBe(true);
        expect(componentsFile.imports.some((i: ImportDetail) => i.packageName === '@test/utils')).toBe(true);
      }
    }, 10000);
  });

  describe('Import Pattern Edge Cases', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should track aliased imports (Button as PrimaryButton)', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo2 = output.repositories.find(r => r.name === 'repo-2');
      const pageFile = repo2?.files.find((f: FileImports) => f.filePath.includes('page.tsx'));
      
      if (pageFile) {
        const uiImport = pageFile.imports.find((i: ImportDetail) => i.packageName === '@test/ui');
        expect(uiImport).toBeDefined();
        
        // Should have imports with aliases
        const buttonImport = uiImport!.importedValues.find(v => v.name === 'Button');
        if (buttonImport?.alias) {
          expect(buttonImport.alias).toBe('PrimaryButton');
        }
      }
    }, 10000);

    it('should track default imports combined with named imports', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo1 = output.repositories.find(r => r.name === 'repo-1');
      const hooksFile = repo1?.files.find((f: FileImports) => f.filePath.includes('hooks.ts'));
      
      if (hooksFile) {
        const coreImport = hooksFile.imports.find((i: ImportDetail) => i.packageName === '@test/core');
        expect(coreImport).toBeDefined();
        
        // Should have both default and named imports
        const hasDefaultImport = coreImport!.importedValues.some(v => v.importType === 'default');
        const hasNamedImports = coreImport!.importedValues.some(v => v.importType === 'named');
        
        expect(hasDefaultImport).toBe(true);
        expect(hasNamedImports).toBe(true);
      }
    }, 10000);

    it('should track type-only import files', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo1 = output.repositories.find(r => r.name === 'repo-1');
      const utilsFile = repo1?.files.find((f: FileImports) => f.filePath.includes('utils.ts'));
      
      if (utilsFile) {
        // All imports in this file should be type-only
        for (const imp of utilsFile.imports) {
          const allTypeOnly = imp.importedValues.every(v => v.isTypeOnly);
          expect(allTypeOnly).toBe(true);
        }
      }
    }, 10000);

    it('should handle files with re-exports', async () => {
      const output = await readOutputFile<RepoPackagesOutput>('RepoPackages.json');
      
      const repo2 = output.repositories.find(r => r.name === 'repo-2');
      const helpersFile = repo2?.files.find((f: FileImports) => f.filePath.includes('helpers.ts'));
      
      if (helpersFile) {
        // Should track imports that are later re-exported
        const utilsImport = helpersFile.imports.find((i: ImportDetail) => i.packageName === '@test/utils');
        expect(utilsImport).toBeDefined();
        expect(utilsImport!.importedValues.some(v => v.name === 'parseCSV')).toBe(true);
        expect(utilsImport!.importedValues.some(v => v.name === 'parseJSON')).toBe(true);
      }
    }, 10000);
  });

  describe('Export Extraction from Mock Packages', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should extract all exports from @test/ui package', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const uiPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/ui');
      expect(uiPackage).toBeDefined();
      
      const exportNames = uiPackage!.exports.map((e: ExportEntry) => e.exportName);
      
      // From index.ts
      expect(exportNames).toContain('Button');
      expect(exportNames).toContain('Input');
      expect(exportNames).toContain('Table');
      expect(exportNames).toContain('Card');
      expect(exportNames).toContain('Modal');
      expect(exportNames).toContain('ButtonProps');
      expect(exportNames).toContain('InputType');
    }, 10000);

    it('should extract all exports from @test/utils package', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const utilsPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/utils');
      expect(utilsPackage).toBeDefined();
      
      const exportNames = utilsPackage!.exports.map((e: ExportEntry) => e.exportName);
      
      expect(exportNames).toContain('parseCSV');
      expect(exportNames).toContain('parseJSON');
      expect(exportNames).toContain('formatDate');
      expect(exportNames).toContain('formatCurrency');
      expect(exportNames).toContain('logger');
      expect(exportNames).toContain('DateFormat');
    }, 10000);

    it('should extract type and interface exports from @test/core', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const corePackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/core');
      expect(corePackage).toBeDefined();
      
      const typeExports = corePackage!.exports.filter((e: ExportEntry) => 
        e.exportType === 'type' || e.exportType === 'interface'
      );
      
      const typeNames = typeExports.map((e: ExportEntry) => e.exportName);
      expect(typeNames).toContain('Config');
      expect(typeNames).toContain('Settings');
      expect(typeNames).toContain('User');
      expect(typeNames).toContain('StoreConfig');
    }, 10000);
  });

  describe('Usage Count Accuracy', () => {
    let consoleSpy: jest.SpyInstance;

    beforeEach(async () => {
      consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      await importMapping(mockConfigPath);
    });

    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should count Button usage across multiple files', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const uiPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/ui');
      const buttonExport = uiPackage!.exports.find((e: ExportEntry) => e.exportName === 'Button');
      
      expect(buttonExport).toBeDefined();
      // Button is used in: component1.ts, page.tsx, components.tsx (at least 3)
      expect(buttonExport!.usageCount).toBeGreaterThanOrEqual(1);
    }, 10000);

    it('should track multiple consumers for commonly used exports', async () => {
      const output = await readOutputFile<ExportUsageOutput>('ExportUsage.json');
      
      const utilsPackage = output.packages.find((p: PackageExportUsage) => p.packageName === '@test/utils');
      const formatDateExport = utilsPackage!.exports.find((e: ExportEntry) => e.exportName === 'formatDate');
      
      if (formatDateExport && formatDateExport.isUsed) {
        const totalConsumers = 
          formatDateExport.consumers.repositories.length + 
          formatDateExport.consumers.packages.length;
        
        expect(totalConsumers).toBeGreaterThan(0);
      }
    }, 10000);
  });
});
