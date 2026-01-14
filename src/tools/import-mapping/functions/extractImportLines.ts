import { readFile } from 'fs/promises';
import { ErrorResult } from '../types/ErrorResult';

/**
 * Checks if an import statement is complete
 * Handles: semicolons, quotes at end, and no-semicolon style
 */
const isImportComplete = (importStatement: string): boolean => {
  const trimmed = importStatement.trim();
  
  // Remove any trailing comments
  const withoutComment = trimmed.replace(/\/\/.*$/, '').replace(/\/\*.*\*\/$/, '').trim();
  
  // Check for explicit termination
  if (withoutComment.endsWith(';')) return true;
  
  // Check for quote endings (side-effect imports or complete from clause)
  if (withoutComment.endsWith("'") || withoutComment.endsWith('"')) {
    // Must have 'from' clause or be a side-effect import
    return withoutComment.includes('from') || !withoutComment.includes('{');
  }
  
  return false;
};

/**
 * Extracts import statements from file content for specified package names
 * Handles multi-line imports and various import styles (with/without semicolons)
 */
export const extractImportLines = (
  fileContent: string,
  packageNames: string[]
): string[] => {
  const importLines: string[] = [];
  const lines = fileContent.split('\n');
  
  let currentImport = '';
  let isInImport = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Start of an import statement
    if (line.startsWith('import ')) {
      isInImport = true;
      currentImport = line;
      
      // Check if it's a single-line import
      if (isImportComplete(currentImport)) {
        isInImport = false;
        
        // Check if it matches any package name
        if (packageNames.some(pkg => currentImport.includes(`'${pkg}`) || currentImport.includes(`"${pkg}`))) {
          importLines.push(currentImport);
        }
        currentImport = '';
      }
    } else if (isInImport) {
      // Continue multi-line import
      currentImport += ' ' + line;
      
      // Check if import statement is complete
      if (isImportComplete(currentImport)) {
        isInImport = false;
        
        // Check if it matches any package name
        if (packageNames.some(pkg => currentImport.includes(`'${pkg}`) || currentImport.includes(`"${pkg}`))) {
          importLines.push(currentImport);
        }
        currentImport = '';
      }
    }
  }

  return importLines;
};

/**
 * Reads a file and extracts import statements for specified package names
 * @param filePath - Path to the file to read
 * @param packageNames - Array of package names to search for
 * @returns ErrorResult containing array of import lines or Error
 */
export const extractImportLinesFromFile = async (
  filePath: string,
  packageNames: string[]
): Promise<ErrorResult<string[]>> => {
  try {
    const content = await readFile(filePath, 'utf-8');
    const importLines = extractImportLines(content, packageNames);
    return [importLines, null];
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return [null, err];
  }
};
