module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  testPathIgnorePatterns: ['/node_modules/', '/mocks/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/cli.ts',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/mocks/**'
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 79,
      lines: 89,
      statements: 89
    }
  }
};
