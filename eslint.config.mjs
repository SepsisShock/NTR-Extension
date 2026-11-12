import globals from 'globals';

const ST = { SillyTavern: 'readonly', toastr: 'readonly', $: 'readonly', jQuery: 'readonly' };

export default [
  { files: ['*.js'], languageOptions: { sourceType: 'module', globals: { ...globals.browser, ...ST } } },
  // tests/env.mjs puts window and SillyTavern's globals on globalThis.
  { files: ['**/*.mjs'], languageOptions: { sourceType: 'module', globals: { ...globals.node, window: 'readonly', toastr: 'readonly' } } },
  // The run-ntr-extension scripts' page.evaluate and waitForFunction callbacks run in the page.
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.browser, SillyTavern: 'readonly', NTR: 'readonly' } } },
  { rules: { 'no-undef': 'error', 'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none' }] } },
];
