import { importMapping } from '../index';
import { join } from 'path';
import { rm, readFile } from 'fs/promises';

describe('import-mapping integration', () => {
  const mockConfigPath = join(__dirname, './mocks/inputConfig.json');
  const outputDir = join(__dirname, './mocks/output');

  // Mock process.exit to prevent test from exiting
  const mockExit = jest.spyOn(process, 'exit').mockImplementation(((code?: number) => {
    throw new Error(`process.exit called with code ${code}`);
  }) as any);

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

  it('should run the full import mapping pipeline', async () => {
    // Suppress console output during tests
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    await importMapping(mockConfigPath);
    
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();

    // Verify output file was created
    const outputPath = join(outputDir, 'RepoPackages.json');
    const content = await readFile(outputPath, 'utf-8');
    const output = JSON.parse(content);

    expect(output).toHaveProperty('repositories');
    expect(output).toHaveProperty('packages');
    expect(Array.isArray(output.repositories)).toBe(true);
    expect(Array.isArray(output.packages)).toBe(true);
  }, 10000); // Increase timeout for integration test
});
