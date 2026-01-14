import { buildPackageExportUsage, buildExportUsageOutput } from '../buildExportUsage';
import { RepoPackagesOutput, ImportDetail } from '../../types/RepoPackagesOutput';
import { PackageExports, ExportInfo } from '../extractExports';

describe('buildExportUsage', () => {
  const mockRepoPackagesOutput: RepoPackagesOutput = {
    generatedAt: '2024-01-01T00:00:00.000Z',
    repositories: [
      {
        path: '/repo/frontend',
        name: 'frontend',
        files: [
          {
            filePath: '/repo/frontend/src/App.tsx',
            fileType: 'tsx',
            imports: [
              {
                packageName: '@test/ui',
                importPath: '@test/ui',
                importedValues: [
                  { name: 'Button', importType: 'named', isTypeOnly: false },
                  { name: 'Input', importType: 'named', isTypeOnly: false }
                ]
              }
            ]
          },
          {
            filePath: '/repo/frontend/src/Form.tsx',
            fileType: 'tsx',
            imports: [
              {
                packageName: '@test/ui',
                importPath: '@test/ui/Button',
                importedValues: [
                  { name: 'Button', importType: 'named', isTypeOnly: false }
                ]
              }
            ]
          }
        ],
        summary: {
          totalImports: 2,
          uniqueValues: 2,
          packageBreakdown: { '@test/ui': 3 }
        }
      }
    ],
    packages: []
  };

  const mockPackageExports: PackageExports = {
    packageName: '@test/ui',
    packagePath: '/packages/ui',
    exports: [
      { name: 'Button', exportType: 'named', isTypeOnly: false, sourceFile: 'Button.tsx' },
      { name: 'Input', exportType: 'named', isTypeOnly: false, sourceFile: 'Input.tsx' },
      { name: 'Select', exportType: 'named', isTypeOnly: false, sourceFile: 'Select.tsx' }, // unused
    ]
  };

  describe('buildPackageExportUsage', () => {
    it('should build export usage for a package', () => {
      const result = buildPackageExportUsage(mockPackageExports, mockRepoPackagesOutput);

      expect(result.packageName).toBe('@test/ui');
      expect(result.packagePath).toBe('/packages/ui');
      expect(result.exports).toHaveLength(3);
    });

    it('should mark used exports as isUsed=true', () => {
      const result = buildPackageExportUsage(mockPackageExports, mockRepoPackagesOutput);

      const buttonExport = result.exports.find(e => e.exportName === 'Button');
      const inputExport = result.exports.find(e => e.exportName === 'Input');

      expect(buttonExport?.isUsed).toBe(true);
      expect(inputExport?.isUsed).toBe(true);
    });

    it('should mark unused exports as isUsed=false', () => {
      const result = buildPackageExportUsage(mockPackageExports, mockRepoPackagesOutput);

      const selectExport = result.exports.find(e => e.exportName === 'Select');

      expect(selectExport?.isUsed).toBe(false);
      expect(selectExport?.usageCount).toBe(0);
    });

    it('should count usage correctly', () => {
      const result = buildPackageExportUsage(mockPackageExports, mockRepoPackagesOutput);

      const buttonExport = result.exports.find(e => e.exportName === 'Button');
      // Button is used in 2 files (App.tsx and Form.tsx)
      expect(buttonExport?.usageCount).toBe(2);
    });

    it('should track subpaths correctly', () => {
      const result = buildPackageExportUsage(mockPackageExports, mockRepoPackagesOutput);

      const buttonExport = result.exports.find(e => e.exportName === 'Button');
      expect(buttonExport?.usedViaSubpaths).toContain('@test/ui');
      expect(buttonExport?.usedViaSubpaths).toContain('@test/ui/Button');
    });

    it('should compute summary correctly', () => {
      const result = buildPackageExportUsage(mockPackageExports, mockRepoPackagesOutput);

      expect(result.summary.totalExports).toBe(3);
      expect(result.summary.usedExports).toBe(2);
      expect(result.summary.unusedExports).toBe(1);
      expect(result.summary.usageRate).toBeCloseTo(2/3);
    });
  });

  describe('buildExportUsageOutput', () => {
    it('should build complete export usage output', () => {
      const [result, error] = buildExportUsageOutput([mockPackageExports], mockRepoPackagesOutput);

      expect(error).toBeNull();
      expect(result).not.toBeNull();
      expect(result?.generatedAt).toBeDefined();
      expect(result?.packages).toHaveLength(1);
    });

    it('should handle multiple packages', () => {
      const anotherPackage: PackageExports = {
        packageName: '@test/utils',
        packagePath: '/packages/utils',
        exports: [
          { name: 'formatDate', exportType: 'named', isTypeOnly: false, sourceFile: 'date.ts' }
        ]
      };

      const [result, error] = buildExportUsageOutput(
        [mockPackageExports, anotherPackage], 
        mockRepoPackagesOutput
      );

      expect(error).toBeNull();
      expect(result?.packages).toHaveLength(2);
    });

    it('should sort packages by name', () => {
      const anotherPackage: PackageExports = {
        packageName: '@test/aaa',
        packagePath: '/packages/aaa',
        exports: []
      };

      const [result, error] = buildExportUsageOutput(
        [mockPackageExports, anotherPackage], 
        mockRepoPackagesOutput
      );

      expect(error).toBeNull();
      expect(result?.packages[0].packageName).toBe('@test/aaa');
      expect(result?.packages[1].packageName).toBe('@test/ui');
    });
  });
});
