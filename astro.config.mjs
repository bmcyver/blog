import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwind from '@astrojs/tailwind';
import swup from '@swup/astro';
import Compress from 'astro-compress';
import expressiveCode from 'astro-expressive-code';
import { pluginCollapsibleSections } from '@expressive-code/plugin-collapsible-sections';
import { pluginLineNumbers } from '@expressive-code/plugin-line-numbers';
import { pluginFileIcons } from '@xt0rted/expressive-code-file-icons';
import { expressiveCodeConfig } from './src/config.ts';
import icon from 'astro-icon';
import { defineConfig } from 'astro/config';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeComponents from 'rehype-components'; /* Render the custom directive content */
import rehypeKatex from 'rehype-katex';
import rehypeSlug from 'rehype-slug';
import remarkDirective from 'remark-directive'; /* Handle directives */
import remarkGithubAdmonitionsToDirectives from 'remark-github-admonitions-to-directives';
import remarkMath from 'remark-math';
import remarkSectionize from 'remark-sectionize';
import { AdmonitionComponent } from './src/plugins/rehype-component-admonition.mjs';
import { GithubCardComponent } from './src/plugins/rehype-component-github-card.mjs';
import { parseDirectiveNode } from './src/plugins/remark-directive-rehype.js';
import { remarkExcerpt } from './src/plugins/remark-excerpt.js';
import { remarkReadingTime } from './src/plugins/remark-reading-time.mjs';
import { pluginLanguageBadge } from './src/plugins/expressive-code-lang.js';
import fuwariLinkCard from './src/plugins/fuwari-link-card.ts';

// https://astro.build/config
export default defineConfig({
  site: 'https://bmcyver.dev',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    tailwind({
      nesting: true,
    }),
    swup({
      theme: false,
      animationClass: 'transition-swup-', // see https://swup.js.org/options/#animationselector
      // the default value `transition-` cause transition delay
      // when the Tailwind class `transition-all` is used
      containers: ['main', '#toc'],
      smoothScrolling: true,
      cache: true,
      preload: true,
      accessibility: true,
      updateHead: true,
      updateBodyClass: false,
      globalInstance: true,
    }),
    icon({
      include: {
        'preprocess: vitePreprocess(),': ['*'],
        'fa6-brands': ['*'],
        'fa6-regular': ['*'],
        'fa6-solid': ['*'],
      },
    }),
    svelte(),
    sitemap(),
    Compress({
      CSS: false,
      Image: false,
    }),
    fuwariLinkCard({
      internalLink: { enabled: true },
    }),
    expressiveCode({
      themes: expressiveCodeConfig.themes,
      plugins: [
        pluginCollapsibleSections(),
        pluginLanguageBadge(),
        pluginLineNumbers(),
        pluginFileIcons({
          iconClass: 'text-4 w-5 inline mr-1 mb-1',
          titleClass: '',
        }),
      ],
      defaultProps: {
        collapseStyle: 'collapsible-auto',
        showLineNumbers: import.meta.env.DEV,
      },
    }),
  ],
  markdown: {
    remarkPlugins: [
      remarkMath,
      remarkReadingTime,
      remarkExcerpt,
      remarkGithubAdmonitionsToDirectives,
      remarkDirective,
      remarkSectionize,
      parseDirectiveNode,
    ],
    rehypePlugins: [
      rehypeKatex,
      rehypeSlug,
      [
        rehypeComponents,
        {
          components: {
            github: GithubCardComponent,
            note: (x, y) => AdmonitionComponent(x, y, 'note'),
            tip: (x, y) => AdmonitionComponent(x, y, 'tip'),
            important: (x, y) => AdmonitionComponent(x, y, 'important'),
            caution: (x, y) => AdmonitionComponent(x, y, 'caution'),
            warning: (x, y) => AdmonitionComponent(x, y, 'warning'),
          },
        },
      ],
      [
        rehypeAutolinkHeadings,
        {
          behavior: 'append',
          properties: {
            className: ['anchor'],
          },
          content: {
            type: 'element',
            tagName: 'span',
            properties: {
              className: ['anchor-icon'],
              'data-pagefind-ignore': true,
            },
            children: [
              {
                type: 'text',
                value: '#',
              },
            ],
          },
        },
      ],
    ],
  },
  vite: {
    build: {
      rollupOptions: {
        onwarn(warning, warn) {
          // temporarily suppress this warning
          if (
            warning.message.includes('is dynamically imported by') &&
            warning.message.includes('but also statically imported by')
          ) {
            return;
          }
          warn(warning);
        },
      },
    },
  },
});
