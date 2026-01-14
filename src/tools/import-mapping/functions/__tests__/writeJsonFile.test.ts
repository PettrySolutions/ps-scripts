import { writeJsonFile } from '../writeJsonFile';
import { readFile, rm } from 'fs/promises';
import { join } from 'path';

describe('writeJsonFile', () => {
  const testOutputDir = join(__dirname, '../../__tests__/mocks/test-output');
  const testFilePath = join(testOutputDir, 'test.json');

  afterEach(async () => {
    // Clean up test files
    try {
      await rm(testOutputDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore errors if directory doesn't exist
    }
  });

  it('should write JSON file successfully', async () => {
    const testData = {
      name: 'test',
      values: [1, 2, 3]
    };

    const [result, error] = await writeJsonFile(testFilePath, testData);

    expect(error).toBeNull();
    expect(result).toBe(true);

    // Verify file was written correctly
    const fileContent = await readFile(testFilePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed).toEqual(testData);
  });

  it('should create directory if it does not exist', async () => {
    const nestedPath = join(testOutputDir, 'nested', 'deep', 'file.json');
    const testData = { test: true };

    const [result, error] = await writeJsonFile(nestedPath, testData);

    expect(error).toBeNull();
    expect(result).toBe(true);

    // Verify file exists
    const fileContent = await readFile(nestedPath, 'utf-8');
    expect(JSON.parse(fileContent)).toEqual(testData);
  });

  it('should format JSON with proper indentation', async () => {
    const testData = {
      repositories: [
        { name: 'repo1', files: ['file1.ts', 'file2.ts'] }
      ]
    };

    const [result, error] = await writeJsonFile(testFilePath, testData);

    expect(error).toBeNull();
    expect(result).toBe(true);

    const fileContent = await readFile(testFilePath, 'utf-8');
    expect(fileContent).toContain('\n');
    expect(fileContent).toContain('  ');
  });

  it('should handle complex nested objects', async () => {
    const testData = {
      repositories: [
        {
          path: '/path/to/repo',
          files: [
            {
              filePath: '/path/to/file.ts',
              imports: {
                '@test/ui': ['Button', 'Input'],
                '@test/utils': ['formatDate']
              }
            }
          ]
        }
      ]
    };

    const [result, error] = await writeJsonFile(testFilePath, testData);

    expect(error).toBeNull();
    expect(result).toBe(true);

    const fileContent = await readFile(testFilePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed).toEqual(testData);
  });

  it('should overwrite existing file', async () => {
    const firstData = { version: 1 };
    const secondData = { version: 2 };

    await writeJsonFile(testFilePath, firstData);
    const [result, error] = await writeJsonFile(testFilePath, secondData);

    expect(error).toBeNull();
    expect(result).toBe(true);

    const fileContent = await readFile(testFilePath, 'utf-8');
    const parsed = JSON.parse(fileContent);
    expect(parsed).toEqual(secondData);
  });
});
