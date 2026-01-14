import { buildSummaryOutput } from '../buildSummary';
import { InputConfig } from '../../types/InputConfig';
import { RepoPackagesOutput } from '../../types/RepoPackagesOutput';
import { ExportUsageOutput } from '../../types/ExportUsageOutput';

describe('buildSummary', () => {
  const mockConfig: InputConfig = {
    repositories: ['/repo/frontend', '/repo/backend'],
    packages: [
      { path: '/packages/ui', name: '@test/ui' },
      { path: '/packages/utils', name: '@test/utils' }
    ],
    packageNames: ['@test/ui', '@test/utils'],
    outputDir: '/output',
    ignorePatterns: ['node_modules']
  };

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
                  { name: 'Button', importType: 'named', isTypeOnly: false }
                ]
              }
            ]
          }
        ],
        summary: { totalImports: 1, uniqueValues: 1, packageBreakdown: { '@test/ui': 1 } }
      }
    ],
    packages: [
      {
        path: '/packages/utils',
        name: 'utils',
        files: [
          {
            filePath: '/packages/utils/src/index.ts',
            fileType: 'ts',
            imports: [
              {
                packageName: '@test/ui',
                importPath: '@test/ui',
                importedValues: [
                  { name: 'Table', importType: 'named', isTypeOnly: false }
                ]
              }
            ]
          }
        ],
        summary: { totalImports: 1, uniqueValues: 1, packageBreakdown: { '@test/ui': 1 } }
      }
    ]
  };

  const mockExportUsageOutput: ExportUsageOutput = {
    generatedAt: '2024-01-01T00:00:00.000Z',
    packages: [
      {
        packageName: '@test/ui',
        packagePath: '/packages/ui',
        exports: [
          {
            exportName: 'Button',
            exportType: 'function',
            isUsed: true,
            usageCount: 5,
            usedViaSubpaths: ['@test/ui'],
            consumers: {
              repositories: [
                { name: 'frontend', path: '/repo/frontend', fileCount: 3, files: [], importTypes: { named: 3, default: 0, namespace: 0, typeOnly: 0 } }
              ],
              packages: [
                { name: 'utils', path: '/packages/utils', fileCount: 2, files: [], importTypes: { named: 2, default: 0, namespace: 0, typeOnly: 0 } }
              ]
            }
          },
          {
            exportName: 'UnusedComponent',
            exportType: 'function',
            isUsed: false,
            usageCount: 0,
            usedViaSubpaths: [],
            consumers: { repositories: [], packages: [] }
          },
          {
            exportName: 'SingleUseButton',
            exportType: 'function',
            isUsed: true,
            usageCount: 1,
            usedViaSubpaths: ['@test/ui'],
            consumers: {
              repositories: [
                { name: 'frontend', path: '/repo/frontend', fileCount: 1, files: [], importTypes: { named: 1, default: 0, namespace: 0, typeOnly: 0 } }
              ],
              packages: []
            }
          }
        ],
        summary: { totalExports: 3, usedExports: 2, unusedExports: 1, usageRate: 0.666 }
      }
    ]
  };

  describe('buildSummaryOutput', () => {
    it('should build summary output successfully', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      expect(error).toBeNull();
      expect(result).not.toBeNull();
      expect(result?.generatedAt).toBeDefined();
    });

    it('should include config summary', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      expect(result?.config.repositoriesAnalyzed).toBe(2);
      expect(result?.config.packagesAnalyzed).toBe(2);
      expect(result?.config.packageNamesTracked).toEqual(['@test/ui', '@test/utils']);
      expect(result?.config.totalFilesScanned).toBe(2); // 1 from repo + 1 from packages
    });

    it('should extract top imports sorted by usage', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      expect(result?.topImports).toBeDefined();
      expect(result?.topImports.length).toBeGreaterThan(0);
      expect(result?.topImports[0].exportName).toBe('Button'); // highest usage
      expect(result?.topImports[0].usageCount).toBe(5);
    });

    it('should list unused exports', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      expect(result?.unusedExports).toBeDefined();
      expect(result?.unusedExports).toHaveLength(1);
      expect(result?.unusedExports[0].exportName).toBe('UnusedComponent');
    });

    it('should list single-consumer exports', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      expect(result?.singleConsumerExports).toBeDefined();
      expect(result?.singleConsumerExports).toHaveLength(1);
      expect(result?.singleConsumerExports[0].exportName).toBe('SingleUseButton');
      expect(result?.singleConsumerExports[0].consumer).toBe('frontend');
    });

    it('should compute per-package statistics', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      expect(result?.packageStats).toBeDefined();
      expect(result?.packageStats).toHaveLength(1);
      
      const uiStats = result?.packageStats[0];
      expect(uiStats?.packageName).toBe('@test/ui');
      expect(uiStats?.totalExports).toBe(3);
      expect(uiStats?.usedExports).toBe(2);
      expect(uiStats?.unusedExports).toBe(1);
      expect(uiStats?.usageRate).toBe(67); // 66.6 rounded
    });

    it('should include top consumers in package stats', () => {
      const [result, error] = buildSummaryOutput(mockConfig, mockRepoPackagesOutput, mockExportUsageOutput);

      const uiStats = result?.packageStats[0];
      expect(uiStats?.topConsumers).toBeDefined();
      expect(uiStats?.topConsumers.length).toBeGreaterThan(0);
    });
  });
});
