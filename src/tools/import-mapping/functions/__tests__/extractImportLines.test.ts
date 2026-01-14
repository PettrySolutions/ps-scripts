import { extractImportLines, extractImportLinesFromFile } from '../extractImportLines';
import { join } from 'path';

describe('extractImportLines', () => {
  const packageNames = ['@test/ui', '@test/utils', '@test/core'];

  it('should extract single-line imports', () => {
    const content = `
import { Button, Input } from '@test/ui';
import { formatDate } from '@test/utils';
import something from 'other-package';
    `.trim();

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(2);
    expect(result[0]).toContain('@test/ui');
    expect(result[1]).toContain('@test/utils');
  });

  it('should extract multi-line imports', () => {
    const content = `
import { 
  Card, 
  Modal,
  Drawer 
} from '@test/ui';
    `.trim();

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/ui');
    expect(result[0]).toContain('Card');
    expect(result[0]).toContain('Modal');
    expect(result[0]).toContain('Drawer');
  });

  it('should extract namespace imports', () => {
    const content = `import * as utils from '@test/utils';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('* as utils');
  });

  it('should extract type imports', () => {
    const content = `import type { User, Config } from '@test/core';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('type');
    expect(result[0]).toContain('@test/core');
  });

  it('should handle subpath imports', () => {
    const content = `import { validateEmail } from '@test/utils/validators';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/utils/validators');
  });

  it('should ignore imports from non-tracked packages', () => {
    const content = `
import React from 'react';
import { Button } from '@test/ui';
import lodash from 'lodash';
    `.trim();

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/ui');
  });

  it('should handle double quotes', () => {
    const content = `import { Button } from "@test/ui";`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/ui');
  });

  it('should handle empty content', () => {
    const result = extractImportLines('', packageNames);

    expect(result).toHaveLength(0);
  });

  it('should handle content with no imports', () => {
    const content = `
const foo = 'bar';
export const baz = 123;
    `.trim();

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(0);
  });

  it('should extract default imports', () => {
    const content = `import Button from '@test/ui';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Button');
    expect(result[0]).toContain('@test/ui');
  });

  it('should extract named imports with aliases', () => {
    const content = `import { Button as Btn } from '@test/ui';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('Button as Btn');
    expect(result[0]).toContain('@test/ui');
  });

  it('should extract default as alias', () => {
    const content = `import { default as UI } from '@test/ui';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('default as UI');
    expect(result[0]).toContain('@test/ui');
  });

  it('should extract multiple named imports with aliases', () => {
    const content = `import { export1, export2 as alias2 } from '@test/utils';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('export1');
    expect(result[0]).toContain('export2 as alias2');
    expect(result[0]).toContain('@test/utils');
  });

  it('should extract string name imports with aliases', () => {
    const content = `import { "string-name" as alias } from '@test/core';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('"string-name" as alias');
    expect(result[0]).toContain('@test/core');
  });

  it('should extract default and named imports combined', () => {
    const content = `import React, { useState, useEffect } from '@test/utils';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('React');
    expect(result[0]).toContain('useState');
    expect(result[0]).toContain('useEffect');
    expect(result[0]).toContain('@test/utils');
  });

  it('should extract default and namespace imports combined', () => {
    const content = `import React, * as ReactAll from '@test/core';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('React');
    expect(result[0]).toContain('* as ReactAll');
    expect(result[0]).toContain('@test/core');
  });

  it('should handle side-effect only imports', () => {
    const content = `import '@test/ui';`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/ui');
  });

  it('should extract all import syntax variations together', () => {
    const content = `
import defaultExport from '@test/ui';
import * as name from '@test/utils';
import { export1 } from '@test/core';
import { export1 as alias1 } from '@test/ui';
import { default as alias } from '@test/utils';
import { export1, export2 } from '@test/core';
import { export1, export2 as alias2 } from '@test/ui';
import defaultExport2, { export1 } from '@test/utils';
import defaultExport3, * as name2 from '@test/core';
import '@test/ui';
    `.trim();

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(10);
    expect(result.filter(l => l.includes('@test/ui'))).toHaveLength(4);
    expect(result.filter(l => l.includes('@test/utils'))).toHaveLength(3);
    expect(result.filter(l => l.includes('@test/core'))).toHaveLength(3);
  });

  it('should handle imports without semicolons', () => {
    const content = `import { Button } from '@test/ui'`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/ui');
  });

  it('should handle imports with trailing comments', () => {
    const content = `import { Button } from '@test/ui'; // component`;

    const result = extractImportLines(content, packageNames);

    expect(result).toHaveLength(1);
    expect(result[0]).toContain('@test/ui');
  });
});

describe('extractImportLinesFromFile', () => {
  const packageNames = ['@test/ui', '@test/utils', '@test/core'];

  it('should extract imports from component1.ts', async () => {
    const filePath = join(__dirname, '../../__tests__/mocks/repo-1/component1.ts');
    const [lines, error] = await extractImportLinesFromFile(filePath, packageNames);

    expect(error).toBeNull();
    expect(lines).not.toBeNull();
    expect(lines!.length).toBeGreaterThan(0);
    expect(lines!.some(l => l.includes('@test/ui'))).toBe(true);
  });

  it('should extract imports from component2.ts with multi-line', async () => {
    const filePath = join(__dirname, '../../__tests__/mocks/repo-1/component2.ts');
    const [lines, error] = await extractImportLinesFromFile(filePath, packageNames);

    expect(error).toBeNull();
    expect(lines).not.toBeNull();
    expect(lines!.length).toBeGreaterThan(0);
  });

  it('should return error for non-existent file', async () => {
    const [lines, error] = await extractImportLinesFromFile('/nonexistent/file.ts', packageNames);

    expect(lines).toBeNull();
    expect(error).toBeInstanceOf(Error);
  });
});
