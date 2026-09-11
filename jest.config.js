/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^foodie-shared-rn$': '<rootDir>/../../packages/shared-rn/src/index.ts',
  },
  clearMocks: true,
};
