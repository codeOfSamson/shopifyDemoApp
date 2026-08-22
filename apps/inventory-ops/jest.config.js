const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  // next/jest's SWC transform resolves the "@/*" tsconfig path alias for
  // real `import` statements at compile time, but that doesn't cover a
  // bare string passed to jest.mock(<path>, ...) — Jest's own resolver
  // needs an explicit mapping for those to find the module.
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
});
