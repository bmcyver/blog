/** @type {import("prettier").Config} */
module.exports = {
  // i am just using the standard config, change if you need something else
  plugins: [
    'prettier-plugin-astro',
    'prettier-plugin-tailwindcss',
    'prettier-plugin-svelte',
  ],
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
    {
      files: '*.svelte',
      options: {
        parser: 'svelte',
      },
    },
  ],
  singleQuote: true,
  semi: true,
  tabWidth: 2,
};
