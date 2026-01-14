import {
  extractNamedImportsEnhanced,
  extractNamespaceImportEnhanced,
  extractDefaultImportEnhanced,
  parseImportLine,
  parseImportsEnhanced,
  isTypeOnlyImport,
  isSideEffectImport,
  getBasePackageName
} from '../parseImports';

describe('parseImports Enhanced', () => {
  describe('isTypeOnlyImport', () => {
    it('should return true for type-only imports', () => {
      expect(isTypeOnlyImport("import type { Button } from '@test/ui'")).toBe(true);
    });

    it('should return false for regular imports', () => {
      expect(isTypeOnlyImport("import { Button } from '@test/ui'")).toBe(false);
    });
  });

  describe('isSideEffectImport', () => {
    it('should return true for side-effect imports', () => {
      expect(isSideEffectImport("import '@test/ui/styles'")).toBe(true);
    });

    it('should return false for imports with specifiers', () => {
      expect(isSideEffectImport("import { Button } from '@test/ui'")).toBe(false);
    });
  });

  describe('getBasePackageName', () => {
    const packageNames = ['@test/ui', '@test/utils', '@test/core'];

    it('should return exact match', () => {
      expect(getBasePackageName('@test/ui', packageNames)).toBe('@test/ui');
    });

    it('should return base package for subpath imports', () => {
      expect(getBasePackageName('@test/ui/Button', packageNames)).toBe('@test/ui');
    });

    it('should return null for unknown packages', () => {
      expect(getBasePackageName('@other/pkg', packageNames)).toBeNull();
    });

    it('should match longest prefix first', () => {
      const names = ['@test/ui', '@test/ui/button'];
      expect(getBasePackageName('@test/ui/button/base', names)).toBe('@test/ui/button');
    });
  });

  describe('extractNamedImportsEnhanced', () => {
    it('should extract named imports with metadata', () => {
      const result = extractNamedImportsEnhanced("import { Button, Input } from '@test/ui'");
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Button');
      expect(result[0].importType).toBe('named');
      expect(result[0].isTypeOnly).toBe(false);
    });

    it('should detect type-only imports', () => {
      const result = extractNamedImportsEnhanced("import type { Props } from '@test/ui'");
      
      expect(result).toHaveLength(1);
      expect(result[0].isTypeOnly).toBe(true);
    });

    it('should capture aliases', () => {
      const result = extractNamedImportsEnhanced("import { Button as Btn } from '@test/ui'");
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Button');
      expect(result[0].alias).toBe('Btn');
    });
  });

  describe('extractNamespaceImportEnhanced', () => {
    it('should extract namespace import', () => {
      const result = extractNamespaceImportEnhanced("import * as utils from '@test/utils'");
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('*');
      expect(result?.alias).toBe('utils');
      expect(result?.importType).toBe('namespace');
    });

    it('should return null for non-namespace imports', () => {
      const result = extractNamespaceImportEnhanced("import { Button } from '@test/ui'");
      
      expect(result).toBeNull();
    });
  });

  describe('extractDefaultImportEnhanced', () => {
    it('should extract default import', () => {
      const result = extractDefaultImportEnhanced("import Button from '@test/ui'");
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe('default');
      expect(result?.alias).toBe('Button');
      expect(result?.importType).toBe('default');
    });

    it('should extract default with named imports', () => {
      const result = extractDefaultImportEnhanced("import React, { useState } from 'react'");
      
      expect(result).not.toBeNull();
      expect(result?.alias).toBe('React');
    });

    it('should return null for namespace imports', () => {
      const result = extractDefaultImportEnhanced("import * as utils from '@test/utils'");
      
      expect(result).toBeNull();
    });
  });

  describe('parseImportLine', () => {
    it('should parse side-effect import', () => {
      const result = parseImportLine("import '@test/ui/styles'");
      
      expect(result).toHaveLength(1);
      expect(result[0].importType).toBe('side-effect');
    });

    it('should parse multiple import types in one line', () => {
      const result = parseImportLine("import React, { useState, useEffect } from 'react'");
      
      // Should have default + 2 named imports = 3 total
      expect(result.length).toBe(3);
      expect(result.some(v => v.importType === 'default')).toBe(true);
      expect(result.filter(v => v.importType === 'named').length).toBe(2);
    });
  });

  describe('parseImportsEnhanced', () => {
    const packageNames = ['@test/ui', '@test/utils'];

    it('should parse import lines and return ImportDetail array', () => {
      const lines = [
        "import { Button, Input } from '@test/ui'",
        "import { formatDate } from '@test/utils'"
      ];
      
      const result = parseImportsEnhanced(lines, packageNames);
      
      expect(result).toHaveLength(2);
      expect(result[0].packageName).toBe('@test/ui');
      expect(result[0].importPath).toBe('@test/ui');
      expect(result[0].importedValues).toHaveLength(2);
    });

    it('should handle subpath imports', () => {
      const lines = ["import { Button } from '@test/ui/components'"];
      
      const result = parseImportsEnhanced(lines, packageNames);
      
      expect(result).toHaveLength(1);
      expect(result[0].packageName).toBe('@test/ui');
      expect(result[0].importPath).toBe('@test/ui/components');
    });

    it('should skip imports from non-tracked packages', () => {
      const lines = [
        "import React from 'react'",
        "import { Button } from '@test/ui'"
      ];
      
      const result = parseImportsEnhanced(lines, packageNames);
      
      expect(result).toHaveLength(1);
      expect(result[0].packageName).toBe('@test/ui');
    });
  });
});
