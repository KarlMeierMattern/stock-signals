import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  moduleNameMapper: {
    "^@lib/(.*)$": "<rootDir>/lib/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};

export default config;
