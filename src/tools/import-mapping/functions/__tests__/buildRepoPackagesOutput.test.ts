import { analyzeFile, analyzeRepository, buildRepoPackagesOutput } from '../buildRepoPackagesOutput';
import { join } from 'path';

describe('analyzeFile', () => {
  const packageNames = ['@test/ui', '@test/utils', '@test/core'];

  it('should analyze file with imports', async () => {
    const filePath = join(__dirname, '../../__tests__/mocks/repo-1/component1.ts');
    const [result, error] = await analyzeFile(filePath, packageNames);

    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result?.filePath).toBe(filePath);
    expect(result?.imports).toBeDefined();
    expect(Object.keys(result?.imports || {}).length).toBeGreaterThan(0);
  });

  it('should return null for file with no matching imports', async () => {
    const filePath = join(__dirname, '../../__tests__/mocks/repo-1/component1.ts');
    const [result, error] = await analyzeFile(filePath, ['@nonexistent/package']);

    expect(error).toBeNull();
    expect(result).toBeNull();
  });

  it('should return error for non-existent file', async () => {
    const [result, error] = await analyzeFile('/nonexistent/file.ts', packageNames);

    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});

describe('analyzeRepository', () => {
  const packageNames = ['@test/ui', '@test/utils', '@test/core'];
  const ignorePatterns = ['node_modules', 'dist', 'build'];

  it('should analyze repository with multiple files', async () => {
    const repoPath = join(__dirname, '../../__tests__/mocks/repo-1');
    const [result, error] = await analyzeRepository(repoPath, packageNames, ignorePatterns);

    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result?.path).toBe(repoPath);
    expect(result?.files.length).toBeGreaterThan(0);
  });

  it('should ignore files in dist directory', async () => {
    const repoPath = join(__dirname, '../../__tests__/mocks/repo-1');
    const [result, error] = await analyzeRepository(repoPath, packageNames, ignorePatterns);

    expect(error).toBeNull();
    expect(result?.files.every(f => !f.filePath.includes('dist'))).toBe(true);
  });

  it('should return empty files array for repository with no matching imports', async () => {
    const repoPath = join(__dirname, '../../__tests__/mocks/repo-1');
    const [result, error] = await analyzeRepository(repoPath, ['@nonexistent/package'], ignorePatterns);

    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result?.files).toEqual([]);
  });

  it('should return error for non-existent repository', async () => {
    const [result, error] = await analyzeRepository('/nonexistent/repo', packageNames, ignorePatterns);

    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});

describe('buildRepoPackagesOutput', () => {
  const packageNames = ['@test/ui', '@test/utils', '@test/core'];
  const ignorePatterns = ['node_modules', 'dist', 'build'];

  it('should build output for repositories and packages', async () => {
    const repositories = [
      join(__dirname, '../../__tests__/mocks/repo-1'),
      join(__dirname, '../../__tests__/mocks/repo-2')
    ];
    const packages = [
      join(__dirname, '../../__tests__/mocks/monorepo/packages/package-1'),
      join(__dirname, '../../__tests__/mocks/monorepo/packages/pack-1'),
      join(__dirname, '../../__tests__/mocks/monorepo/packages/pack-2')
    ];

    const [result, error] = await buildRepoPackagesOutput(
      repositories,
      packages,
      packageNames,
      ignorePatterns
    );

    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result?.repositories.length).toBe(2);
    expect(result?.packages.length).toBe(3);
  });

  it('should handle empty repositories array', async () => {
    const [result, error] = await buildRepoPackagesOutput(
      [],
      [],
      packageNames,
      ignorePatterns
    );

    expect(error).toBeNull();
    expect(result).not.toBeNull();
    expect(result?.repositories).toEqual([]);
    expect(result?.packages).toEqual([]);
  });

  it('should return error if repository analysis fails', async () => {
    const repositories = ['/nonexistent/repo'];
    const packages: string[] = [];

    const [result, error] = await buildRepoPackagesOutput(
      repositories,
      packages,
      packageNames,
      ignorePatterns
    );

    expect(result).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});
