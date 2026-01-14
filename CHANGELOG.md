# @pettry-solutions/scripts

## 1.0.2

### Patch Changes

- Fixed default export tracking in import-mapping tool

  - Default exports (e.g., `export default class Store`) are now correctly tracked when imported
  - Previously, imports like `import Store from '@test/core'` were not being matched to default exports
  - Added comprehensive integration tests for import pattern edge cases
