module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      // ts-jest configuration goes here
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(@langchain|langchain|@langchain/community|@octokit/rest|faiss-node)/)",
  ],
  moduleNameMapper: {
    "(.+)\\.js": "$1"
  }
};
