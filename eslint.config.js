import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/', 'coverage/', 'node_modules/'] },
  {
    files: ['src/**/*.ts'],
    extends: [...tseslint.configs.recommended],
    rules: {
      // Cyclomatic complexity: hard cap 6, so over 6 blocks. Aim for 5 or
      // less; 6 is an occasional exception. One threshold per rule, so 5 is
      // the documented target, not a second tool level.
      complexity: ['error', 6],
      // Warn over 80 lines here. The hard 100-line block is enforced by
      // scripts/check-file-length.sh in the git hooks and CI, because an
      // ESLint rule supports only one threshold per rule.
      'max-lines': ['warn', { max: 80 }],
    },
  },
);
