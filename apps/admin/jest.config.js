/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^foodie-shared-web$': '<rootDir>/../foodie-shared-web/src/index.ts',
    '^foodie-shared-web/auth$': '<rootDir>/../foodie-shared-web/src/auth/index.ts',
  },
  clearMocks: true,
};
