module.exports = {
  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      files: ['snap.config.ts'],
      extends: ['@metamask/eslint-config-nodejs'],
    },

    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        '@typescript-eslint/no-shadow': [
          'error',
          {
            allow: ['Text'],
          },
        ],
      },
    },

    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
      },
    },
  ],

  ignorePatterns: ['!.eslintrc.js', 'dist/'],
};
