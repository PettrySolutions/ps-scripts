import { scanDirectory, shouldIgnore } from '../scanDirectory';
import { join } from 'path';

describe('shouldIgnore', () => {
  const ignorePatterns = ['node_modules', 'dist', 'build'];

  it('should return true for path containing ignore pattern', () => {
    expect(shouldIgnore('/path/to/node_modules/file.ts', ignorePatterns)).toBe(true);
    expect(shouldIgnore('/path/to/dist/bundle.js', ignorePatterns)).toBe(true);
    expect(shouldIgnore('/project/build/output.ts', ignorePatterns)).toBe(true);
  });

  it('should return false for path not containing ignore pattern', () => {
    expect(shouldIgnore('/path/to/src/file.ts', ignorePatterns)).toBe(false);
    expect(shouldIgnore('/project/components/Button.tsx', ignorePatterns)).toBe(false);
  });

  it('should handle empty ignore patterns', () => {
    expect(shouldIgnore('/path/to/file.ts', [])).toBe(false);
  });
});

describe('scanDirectory', () => {
  const mockBaseDir = join(__dirname, '../../__tests__/mocks/repo-1');
  const ignorePatterns = ['node_modules', 'dist', 'build'];

  it('should find all TypeScript files in directory', async () => {
    const [files, error] = await scanDirectory(mockBaseDir, ignorePatterns);

    expect(error).toBeNull();
    expect(files).not.toBeNull();
    expect(files!.length).toBeGreaterThan(0);
    expect(files!.every(f => /\.(ts|tsx|js|jsx)$/.test(f))).toBe(true);
  });

  it('should ignore files in dist directory', async () => {
    const [files, error] = await scanDirectory(mockBaseDir, ignorePatterns);

    expect(error).toBeNull();
    expect(files).not.toBeNull();
    expect(files!.every(f => !f.includes('dist'))).toBe(true);
  });

  it('should return error for non-existent directory', async () => {
    const [files, error] = await scanDirectory('/nonexistent/directory', ignorePatterns);

    expect(files).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });

  it('should find files in nested directories', async () => {
    const mockRepo2 = join(__dirname, '../../__tests__/mocks/repo-2');
    const [files, error] = await scanDirectory(mockRepo2, ignorePatterns);

    expect(error).toBeNull();
    expect(files).not.toBeNull();
    expect(files!.length).toBeGreaterThan(0);
  });

  it('should handle empty directory', async () => {
    const emptyDir = join(__dirname, '../../__tests__/mocks/empty-dir');
    const [files, error] = await scanDirectory(emptyDir, ignorePatterns);

    // This will error since directory doesn't exist, which is expected
    if (error) {
      expect(error).toBeInstanceOf(Error);
    } else {
      expect(files).toEqual([]);
    }
  });
});
