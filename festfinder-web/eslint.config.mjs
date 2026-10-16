// ESLint for the Next front (festfinder-web). Type-aware: the rules that catch real bugs are
// errors; `any` is counted, not banned outright, and `npm run lint` fails when the count grows
// past the budget in package.json (--max-warnings), which only ever goes down.
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';

export default tseslint.config(
  { ignores: ['.next/**', 'public/**', 'next-env.d.ts', 'node_modules/**', 'scripts/**', '*.config.mjs', '*.config.ts'] },
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: { parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname } },
    plugins: { 'react-hooks': reactHooks, '@next/next': nextPlugin },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      // A promise nobody awaits loses its error: always a bug, or a `void` that says it is meant.
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
      // Counted against the budget.
      '@typescript-eslint/no-explicit-any': 'warn',
      // The API's JSON is read loosely on purpose in many screens; these follow from `any` and are counted with it.
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // tsc's noUnusedLocals covers this.
      '@typescript-eslint/no-unused-vars': 'off',
      // The site uses plain <img> for linked images by rule (CLAUDE.md "Images"): no-referrer, fallbacks.
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/require-await': 'off',
      // Style, not bugs, in this codebase: '/e/' + id, and unions that spell out a known value next to string.
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // "[object Object]" in a string is a bug, but some of these are known Pairs: counted, to fix over time.
      '@typescript-eslint/no-base-to-string': 'warn',
    },
  },
);
