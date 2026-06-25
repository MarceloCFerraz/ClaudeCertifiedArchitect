/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/test"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  // No tests yet (first ones land in Phase 1). Keeps `npm test` green meanwhile.
  passWithNoTests: true,
};
