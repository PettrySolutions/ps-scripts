import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { ErrorResult } from '../types/ErrorResult';

/**
 * Checks if a path matches any of the ignore patterns
 */
export const shouldIgnore = (filePath: string, ignorePatterns: string[]): boolean => {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
};

/**
 * Recursively scans a directory for TypeScript/JavaScript files
 * @param dirPath - Directory path to scan
 * @param ignorePatterns - Patterns to ignore
 * @returns ErrorResult containing array of file paths or Error
 */
export const scanDirectory = async (
  dirPath: string,
  ignorePatterns: string[]
): Promise<ErrorResult<string[]>> => {
  try {
    const files: string[] = [];
    
    const scanRecursive = async (currentPath: string): Promise<void> => {
      // Check if path should be ignored
      if (shouldIgnore(currentPath, ignorePatterns)) {
        return;
      }

      const stats = await stat(currentPath);

      if (stats.isDirectory()) {
        const entries = await readdir(currentPath);
        await Promise.all(
          entries.map(entry => scanRecursive(join(currentPath, entry)))
        );
      } else if (stats.isFile()) {
        // Only include TypeScript and JavaScript files
        if (/\.(ts|tsx|js|jsx)$/.test(currentPath)) {
          files.push(currentPath);
        }
      }
    };

    await scanRecursive(dirPath);
    return [files, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
