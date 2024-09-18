module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/test/**/*.test.ts'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  verbose: true,
  // Add this to handle module name mapping
  moduleNameMapper: {
    '^openai$': '<rootDir>/node_modules/openai',
  },
};
