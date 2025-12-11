import antfu from '@antfu/eslint-config'

export default antfu({
  // Project type
  type: 'app',

  // TypeScript with type-aware rules
  typescript: true,

  // React support for web app
  react: true,

  // Enable stylistic rules
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // JSON and YAML support
  jsonc: true,
  yaml: true,

  // Ignore patterns
  ignores: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/coverage/**',
    '**/generated/**',
    'apps/api/generated/**',
    '**/*.d.ts',
    '**/prisma/migrations/**',
    '**/*.md',
    '**/*.lock',
    'pnpm-lock.yaml',
    '.idea/**',
    'Makefile',
    'docker-compose*.yml',
    '**/_tmp_*',
    'nul',

  ],
}, {
  // Custom rules overrides
  rules: {
    // Stricter TypeScript rules
    'ts/no-explicit-any': 'warn',
    'ts/explicit-function-return-type': 'off',

    // Node.js rules for API
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',

    // React specific
    'react-refresh/only-export-components': 'warn',
    'react-hooks/exhaustive-deps': 'warn',

    // General strictness
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'prefer-const': 'error',
    'no-var': 'error',

    // Stylistic preferences
    'style/brace-style': ['error', '1tbs'],
    'style/comma-dangle': ['error', 'always-multiline'],
    'style/arrow-parens': ['error', 'always'],

    // Allow unused vars with underscore prefix
    'unused-imports/no-unused-vars': ['error', {
      vars: 'all',
      varsIgnorePattern: '^_',
      args: 'after-used',
      argsIgnorePattern: '^_',
    }],
  },
}, {
  // NestJS specific rules for API
  files: ['apps/api/**/*.ts'],
  rules: {
    // NestJS uses decorators and class-based approach
    'ts/no-extraneous-class': 'off',
    'new-cap': 'off',
    'dot-notation': 'off',
    'ts/consistent-type-imports': 'off',
    // Allow empty constructors for DI
    'ts/no-empty-function': ['error', { allow: ['constructors'] }],
  },
}, {
  // Test files
  files: ['**/*.spec.ts', '**/*.test.ts', '**/*.e2e-spec.ts'],
  rules: {
    'ts/no-explicit-any': 'off',
    'no-console': 'off',

  },
})
