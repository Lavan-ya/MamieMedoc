import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases (e.g. the ones added by `nest g library`) live in tsconfig.json,
// so they are read from there instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  // NestJS 12 ships ES modules, which Jest can only load natively on
  // Node >= 24.9; compile them to CommonJS like our own sources instead.
  transformIgnorePatterns: ['/node_modules/(?!(@nestjs|uid|load-esm)/)'],
  moduleNameMapper: {
    // The one NestJS file using `import.meta` (see test/shims).
    '^(?:\\.{1,2}/)+(?:utils/)?load-package\\.util\\.js$':
      '<rootDir>/test/shims/load-package.util.js',
    ...pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;
