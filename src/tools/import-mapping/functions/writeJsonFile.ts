import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { ErrorResult } from '../types/ErrorResult';

/**
 * Ensures that the directory for a file path exists
 * @param filePath - Path to the file
 */
const ensureDirectory = async (filePath: string): Promise<void> => {
  const dir = dirname(filePath);
  await mkdir(dir, { recursive: true });
};

/**
 * Writes an object to a JSON file
 * @param filePath - Path where the JSON file should be written
 * @param data - Data to write to the file
 * @returns ErrorResult containing true on success or Error on failure
 */
export const writeJsonFile = async (
  filePath: string,
  data: any
): Promise<ErrorResult<true>> => {
  try {
    // Ensure the output directory exists
    await ensureDirectory(filePath);

    // Convert data to formatted JSON
    const jsonContent = JSON.stringify(data, null, 2);

    // Write to file
    await writeFile(filePath, jsonContent, 'utf-8');

    return [true, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
