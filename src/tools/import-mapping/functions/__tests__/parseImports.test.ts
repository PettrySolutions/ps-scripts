import {
  parseImports,
  extractPackageName,
  extractNamedImports,
  extractNamespaceImport,
  extractDefaultImport
} from '../parseImports';

describe('extractPackageName', () => {
  it('should extract package name with single quotes', () => {
    const line = "import { Button } from '@test/ui';";
    expect(extractPackageName(line)).toBe('@test/ui');
  });

  it('should extract package name with double quotes', () => {
    const line = 'import { Button } from "@test/ui";';
    expect(extractPackageName(line)).toBe('@test/ui');
  });

  it('should extract package name with subpath', () => {
    const line = "import { validate } from '@test/utils/validators';";
    expect(extractPackageName(line)).toBe('@test/utils/validators');
  });

  it('should return null for invalid import', () => {
    const line = 'const foo = bar;';
    expect(extractPackageName(line)).toBeNull();
  });
});

describe('extractNamedImports', () => {
  it('should extract single named import', () => {
    const line = "import { Button } from '@test/ui';";
    const result = extractNamedImports(line);
    
    expect(result).toEqual(['Button']);
  });

  it('should extract multiple named imports', () => {
    const line = "import { Button, Input, Select } from '@test/ui';";
    const result = extractNamedImports(line);
    
    expect(result).toEqual(['Button', 'Input', 'Select']);
  });

  it('should extract named imports with type keyword', () => {
    const line = "import type { User, Config } from '@test/core';";
    const result = extractNamedImports(line);
    
    expect(result).toEqual(['User', 'Config']);
  });

  it('should handle multi-line imports', () => {
    const line = "import {  Card,  Modal, Drawer  } from '@test/ui';";
    const result = extractNamedImports(line);
    
    expect(result).toEqual(['Card', 'Modal', 'Drawer']);
  });

  it('should handle imports with "as" aliases', () => {
    const line = "import { Button as Btn, Input as TextField } from '@test/ui';";
    const result = extractNamedImports(line);
    
    expect(result).toEqual(['Button', 'Input']);
  });

  it('should return empty array for no named imports', () => {
    const line = "import React from 'react';";
    const result = extractNamedImports(line);
    
    expect(result).toEqual([]);
  });
});

describe('extractNamespaceImport', () => {
  it('should extract namespace import', () => {
    const line = "import * as utils from '@test/utils';";
    const result = extractNamespaceImport(line);
    
    expect(result).toEqual(['utils']);
  });

  it('should return empty array for non-namespace import', () => {
    const line = "import { Button } from '@test/ui';";
    const result = extractNamespaceImport(line);
    
    expect(result).toEqual([]);
  });
});

describe('extractDefaultImport', () => {
  it('should extract default import', () => {
    const line = "import React from 'react';";
    const result = extractDefaultImport(line);
    
    expect(result).toEqual(['React']);
  });

  it('should extract default import with type', () => {
    const line = "import type Config from '@test/core';";
    const result = extractDefaultImport(line);
    
    expect(result).toEqual(['Config']);
  });

  it('should extract default import combined with named imports', () => {
    const line = "import React, { useState } from 'react';";
    const result = extractDefaultImport(line);
    
    expect(result).toEqual(['React']);
  });

  it('should return empty array for no default import', () => {
    const line = "import { Button } from '@test/ui';";
    const result = extractDefaultImport(line);
    
    expect(result).toEqual([]);
  });
});

describe('parseImports', () => {
  it('should parse single import line', () => {
    const lines = ["import { Button, Input } from '@test/ui';"];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/ui': ['Button', 'Input']
    });
  });

  it('should parse multiple import lines', () => {
    const lines = [
      "import { Button } from '@test/ui';",
      "import { formatDate } from '@test/utils';"
    ];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/ui': ['Button'],
      '@test/utils': ['formatDate']
    });
  });

  it('should handle namespace imports', () => {
    const lines = ["import * as utils from '@test/utils';"];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/utils': ['utils']
    });
  });

  it('should handle type imports', () => {
    const lines = ["import type { User, Config } from '@test/core';"];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/core': ['User', 'Config']
    });
  });

  it('should handle subpath imports', () => {
    const lines = ["import { validateEmail } from '@test/utils/validators';"];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/utils/validators': ['validateEmail']
    });
  });

  it('should combine multiple imports from same package', () => {
    const lines = [
      "import { Button } from '@test/ui';",
      "import { Input } from '@test/ui';"
    ];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/ui': ['Button', 'Input']
    });
  });

  it('should not duplicate imports', () => {
    const lines = [
      "import { Button } from '@test/ui';",
      "import { Button } from '@test/ui';"
    ];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/ui': ['Button']
    });
  });

  it('should handle mixed import types', () => {
    const lines = [
      "import { Card, Modal } from '@test/ui';",
      "import * as utils from '@test/utils';",
      "import type { User } from '@test/core';"
    ];
    const result = parseImports(lines);
    
    expect(result).toEqual({
      '@test/ui': ['Card', 'Modal'],
      '@test/utils': ['utils'],
      '@test/core': ['User']
    });
  });

  it('should handle empty array', () => {
    const result = parseImports([]);
    
    expect(result).toEqual({});
  });
});
