import {
  extractNamedExportsFromLine,
  extractDeclarationExport,
  extractDefaultExport,
  extractWildcardReExport,
  parseExportsFromContent
} from '../extractExports';

describe('extractExports', () => {
  describe('extractNamedExportsFromLine', () => {
    it('should extract named exports', () => {
      const line = "export { Button, Input, Table }";
      const exports = extractNamedExportsFromLine(line, 'test.ts');
      
      expect(exports).toHaveLength(3);
      expect(exports.map(e => e.name)).toEqual(['Button', 'Input', 'Table']);
      expect(exports[0].exportType).toBe('named');
      expect(exports[0].isTypeOnly).toBe(false);
    });

    it('should extract type exports', () => {
      const line = "export type { Props, Config }";
      const exports = extractNamedExportsFromLine(line, 'test.ts');
      
      expect(exports).toHaveLength(2);
      expect(exports[0].exportType).toBe('type');
      expect(exports[0].isTypeOnly).toBe(true);
    });

    it('should handle aliased exports', () => {
      const line = "export { Button as Btn, Input as TextInput }";
      const exports = extractNamedExportsFromLine(line, 'test.ts');
      
      expect(exports).toHaveLength(2);
      expect(exports[0].name).toBe('Btn');
      expect(exports[1].name).toBe('TextInput');
    });

    it('should detect re-exports from other modules', () => {
      const line = "export { Button, Input } from './components'";
      const exports = extractNamedExportsFromLine(line, 'test.ts');
      
      expect(exports).toHaveLength(2);
      expect(exports[0].exportType).toBe('re-export');
      expect(exports[0].reExportSource).toBe('./components');
    });

    it('should return empty array for non-named exports', () => {
      const line = "export default Button";
      const exports = extractNamedExportsFromLine(line, 'test.ts');
      
      expect(exports).toHaveLength(0);
    });
  });

  describe('extractDeclarationExport', () => {
    it('should extract const export', () => {
      const result = extractDeclarationExport("export const Button = () => {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Button');
      expect(result?.exportType).toBe('named');
      expect(result?.isTypeOnly).toBe(false);
    });

    it('should extract function export', () => {
      const result = extractDeclarationExport("export function formatDate() {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('formatDate');
      expect(result?.exportType).toBe('named');
    });

    it('should extract async function export', () => {
      const result = extractDeclarationExport("export async function fetchData() {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('fetchData');
    });

    it('should extract class export', () => {
      const result = extractDeclarationExport("export class Store {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Store');
      expect(result?.exportType).toBe('named');
    });

    it('should extract interface export as type', () => {
      const result = extractDeclarationExport("export interface ButtonProps {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('ButtonProps');
      expect(result?.exportType).toBe('type');
      expect(result?.isTypeOnly).toBe(true);
    });

    it('should extract type alias export as type', () => {
      const result = extractDeclarationExport("export type Status = 'active' | 'inactive'", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Status');
      expect(result?.exportType).toBe('type');
      expect(result?.isTypeOnly).toBe(true);
    });

    it('should extract enum export', () => {
      const result = extractDeclarationExport("export enum Direction { Up, Down }", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Direction');
    });

    it('should return null for non-declaration exports', () => {
      const result = extractDeclarationExport("export { Button }", 'test.ts');
      
      expect(result).toBeNull();
    });
  });

  describe('extractDefaultExport', () => {
    it('should extract named default export', () => {
      const result = extractDefaultExport("export default function Button() {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Button');
      expect(result?.exportType).toBe('default');
    });

    it('should extract default class export', () => {
      const result = extractDefaultExport("export default class Store {}", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('Store');
      expect(result?.exportType).toBe('default');
    });

    it('should extract anonymous default export', () => {
      const result = extractDefaultExport("export default Button", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('default');
      expect(result?.exportType).toBe('default');
    });

    it('should return null for non-default exports', () => {
      const result = extractDefaultExport("export const Button = () => {}", 'test.ts');
      
      expect(result).toBeNull();
    });
  });

  describe('extractWildcardReExport', () => {
    it('should extract wildcard re-export', () => {
      const result = extractWildcardReExport("export * from './components'", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('*');
      expect(result?.exportType).toBe('re-export');
      expect(result?.reExportSource).toBe('./components');
    });

    it('should extract aliased wildcard re-export', () => {
      const result = extractWildcardReExport("export * as utils from './utils'", 'test.ts');
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('utils');
      expect(result?.exportType).toBe('re-export');
      expect(result?.reExportSource).toBe('./utils');
    });

    it('should return null for non-wildcard exports', () => {
      const result = extractWildcardReExport("export { Button } from './components'", 'test.ts');
      
      expect(result).toBeNull();
    });
  });

  describe('parseExportsFromContent', () => {
    it('should parse all types of exports from file content', () => {
      const content = `
export const Button = () => {};
export function formatDate() {}
export class Store {}
export interface ButtonProps {}
export type Status = 'active';
export { Input, Table };
export default Modal;
export * from './utils';
`;
      
      const exports = parseExportsFromContent(content, 'test.ts');
      
      expect(exports.length).toBeGreaterThanOrEqual(8);
      expect(exports.some(e => e.name === 'Button')).toBe(true);
      expect(exports.some(e => e.name === 'formatDate')).toBe(true);
      expect(exports.some(e => e.name === 'Store')).toBe(true);
      expect(exports.some(e => e.name === 'ButtonProps')).toBe(true);
      expect(exports.some(e => e.name === 'Status')).toBe(true);
      expect(exports.some(e => e.name === 'Input')).toBe(true);
      expect(exports.some(e => e.exportType === 'default')).toBe(true);
      expect(exports.some(e => e.exportType === 're-export')).toBe(true);
    });

    it('should skip non-export lines', () => {
      const content = `
const internal = 'private';
import { something } from './other';
export const Button = () => {};
function helper() {}
`;
      
      const exports = parseExportsFromContent(content, 'test.ts');
      
      expect(exports).toHaveLength(1);
      expect(exports[0].name).toBe('Button');
    });
  });

  describe('findSourceFiles', () => {
    const { findSourceFiles } = require('../extractExports');
    const path = require('path');

    it('should find source files with relative paths', () => {
      const relativePath = 'src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1';
      const [files, error] = findSourceFiles(relativePath);

      expect(error).toBeNull();
      expect(files).not.toBeNull();
      expect(files!.length).toBeGreaterThan(0);
      expect(files!.some((f: string) => f.endsWith('.ts') || f.endsWith('.tsx'))).toBe(true);
    });

    it('should find source files with absolute paths', () => {
      const absolutePath = path.resolve('src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1');
      const [files, error] = findSourceFiles(absolutePath);

      expect(error).toBeNull();
      expect(files).not.toBeNull();
      expect(files!.length).toBeGreaterThan(0);
    });

    it('should return error for non-existent directory', () => {
      const [files, error] = findSourceFiles('/nonexistent/directory');

      expect(files).toBeNull();
      expect(error).not.toBeNull();
      expect(error!.message).toContain('does not exist');
    });

    it('should respect custom ignore patterns', () => {
      const mockPath = 'src/tools/import-mapping/__tests__/mocks';
      const [filesWithDefault, _] = findSourceFiles(mockPath);
      const [filesWithoutIgnore, __] = findSourceFiles(mockPath, []);

      // With default ignore patterns, __tests__ content should be excluded
      // Without ignore patterns, more files should be found
      expect(filesWithoutIgnore!.length).toBeGreaterThanOrEqual(filesWithDefault!.length);
    });
  });

  describe('extractPackageExports', () => {
    const { extractPackageExports } = require('../extractExports');

    it('should extract exports from a package with relative path', () => {
      const [exports, error] = extractPackageExports(
        'src/tools/import-mapping/__tests__/mocks/monorepo/packages/package-1',
        '@test/ui'
      );

      expect(error).toBeNull();
      expect(exports).not.toBeNull();
      expect(exports!.packageName).toBe('@test/ui');
      expect(exports!.exports.length).toBeGreaterThan(0);
    });

    it('should return error for non-existent package', () => {
      const [exports, error] = extractPackageExports(
        '/nonexistent/package',
        '@test/ui'
      );

      expect(exports).toBeNull();
      expect(error).not.toBeNull();
    });
  });
});
