# ztc-scripts

Modular CLI tools for various utilities

## Installation

```bash
npm install @dakotahpettry/ztc-scripts
```

## Usage

```bash
ztc <command> [options]
```

### Available Commands

- `import-mapping <configPath>` - Analyze import patterns in JavaScript/TypeScript repositories

See [import-mapping documentation](src/tools/import-mapping/README.md) for detailed usage.

## Development

### Setup

```bash
npm install
```

### Build

```bash
npm run build
```

### Test

```bash
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:coverage
```

## Publishing to GitHub Packages

1. Authenticate with GitHub:
```bash
npm login --registry=https://npm.pkg.github.com
```

2. Build and publish:
```bash
npm publish
```

## Architecture

This project follows functional programming principles with modular tools:

- Each tool is self-contained in `src/tools/<tool-name>/`
- Tests are co-located with tools in `__tests__/` directories
- All functions are pure where possible
- Full test coverage for each module

## License

MIT
