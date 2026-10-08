import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  {
    files: [
      'src/**/*.{ts,tsx}',
      'backend/**/*.ts',
      'frontend/src/**/*.{ts,tsx}',
      'tests/**/*.ts',
      'scripts/*.{js,mjs,cjs}',
    ],
    extends: [...tseslint.configs.recommended],
    rules: {
      // Six is the documented maximum cyclomatic complexity.
      complexity: ['error', 6],
      // The paired source-length script blocks files over 100 lines.
      'max-lines': ['warn', { max: 80 }],
    },
  },
);
