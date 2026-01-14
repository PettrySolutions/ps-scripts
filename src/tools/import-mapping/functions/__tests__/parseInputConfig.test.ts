import { parseInputConfig, validateInputConfig } from '../parseInputConfig';
import { join } from 'path';

describe('validateInputConfig', () => {
  it('should return true for valid config with old string[] packages format', () => {
    const validConfig = {
      repositories: ['repo1', 'repo2'],
      packages: ['package1'],
      packageNames: ['@test/ui'],
      outputDir: '/output',
      ignorePatterns: ['node_modules']
    };

    expect(validateInputConfig(validConfig)).toBe(true);
  });

  it('should return true for valid config with new PackageConfig[] format', () => {
    const validConfig = {
      repositories: ['repo1', 'repo2'],
      packages: [{ path: 'packages/ui', name: '@test/ui' }],
      outputDir: '/output',
      ignorePatterns: ['node_modules']
    };

    expect(validateInputConfig(validConfig)).toBe(true);
  });

  it('should return false for missing repositories', () => {
    const invalidConfig = {
      packages: ['package1'],
      packageNames: ['@test/ui'],
      outputDir: '/output'
    };

    expect(validateInputConfig(invalidConfig)).toBe(false);
  });

  it('should return false for invalid repositories type', () => {
    const invalidConfig = {
      repositories: 'not-an-array',
      packages: ['package1'],
      packageNames: ['@test/ui'],
      outputDir: '/output'
    };

    expect(validateInputConfig(invalidConfig)).toBe(false);
  });

  it('should return true when packageNames is omitted (will be derived)', () => {
    const validConfig = {
      repositories: ['repo1'],
      packages: [{ path: 'packages/ui', name: '@test/ui' }],
      outputDir: '/output'
    };

    expect(validateInputConfig(validConfig)).toBe(true);
  });

  it('should return false for missing outputDir', () => {
    const invalidConfig = {
      repositories: ['repo1'],
      packages: ['package1'],
      packageNames: ['@test/ui']
    };

    expect(validateInputConfig(invalidConfig)).toBe(false);
  });

  it('should return true when ignorePatterns is optional', () => {
    const validConfig = {
      repositories: ['repo1'],
      packages: ['package1'],
      packageNames: ['@test/ui'],
      outputDir: '/output'
    };

    expect(validateInputConfig(validConfig)).toBe(true);
  });

  it('should return false for null input', () => {
    expect(validateInputConfig(null)).toBe(false);
  });

  it('should return false for non-object input', () => {
    expect(validateInputConfig('not an object')).toBe(false);
  });

  it('should return false for invalid repository items', () => {
    const invalidConfig = {
      repositories: ['repo1', 123],
      packages: ['package1'],
      packageNames: ['@test/ui'],
      outputDir: '/output'
    };

    expect(validateInputConfig(invalidConfig)).toBe(false);
  });

  it('should return true for valid PackageConfig items', () => {
    const validConfig = {
      repositories: ['repo1'],
      packages: [{ path: 'pkg1', name: '@test/pkg1' }],
      outputDir: '/output'
    };

    expect(validateInputConfig(validConfig)).toBe(true);
  });

  it('should return false for invalid packageNames items', () => {
    const invalidConfig = {
      repositories: ['repo1'],
      packages: ['package1'],
      packageNames: ['@test/ui', 123],
      outputDir: '/output'
    };

    expect(validateInputConfig(invalidConfig)).toBe(false);
  });

  it('should return false for invalid ignorePatterns', () => {
    const invalidConfig = {
      repositories: ['repo1'],
      packages: ['package1'],
      packageNames: ['@test/ui'],
      outputDir: '/output',
      ignorePatterns: 'not-an-array'
    };

    expect(validateInputConfig(invalidConfig)).toBe(false);
  });
});

describe('parseInputConfig', () => {
  const mockConfigPath = join(__dirname, '../../__tests__/mocks/inputConfig.json');

  it('should successfully parse valid config file', async () => {
    const [config, error] = await parseInputConfig(mockConfigPath);

    expect(error).toBeNull();
    expect(config).not.toBeNull();
    expect(config?.repositories).toHaveLength(2);
    expect(config?.packages).toHaveLength(3);
    expect(config?.packageNames).toContain('@test/ui');
    expect(config?.outputDir).toBeDefined();
  });

  it('should return error for non-existent file', async () => {
    const [config, error] = await parseInputConfig('/nonexistent/config.json');

    expect(config).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });

  it('should return error for invalid JSON', async () => {
    const invalidPath = join(__dirname, '../../mocks/repo-1/component1.ts');
    const [config, error] = await parseInputConfig(invalidPath);

    expect(config).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });

  it('should add default ignore patterns if not provided', async () => {
    const [config, error] = await parseInputConfig(mockConfigPath);

    expect(error).toBeNull();
    expect(config?.ignorePatterns).toBeDefined();
    expect(config?.ignorePatterns?.length).toBeGreaterThan(0);
  });
});
