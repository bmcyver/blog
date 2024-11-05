// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import { remarkReadingTime } from './src/utils/remarkReadingTime.ts';
import remarkUnwrapImages from 'remark-unwrap-images';
import rehypeExternalLinks from 'rehype-external-links';
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import expressiveCode from 'astro-expressive-code';
import { expressiveCodeOptions } from './src/site.config';
import icon from 'astro-icon';
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
  site: 'https://bmcyver.dev',
  integrations: [expressiveCode(expressiveCodeOptions), tailwind({
    applyBaseStyles: false
  }), sitemap(), mdx(), icon()],
  markdown: {
    remarkPlugins: [remarkUnwrapImages, remarkReadingTime, remarkMath],
    rehypePlugins: [[rehypeExternalLinks, {
      target: '_blank',
      rel: ['nofollow, noopener, noreferrer']
    }], rehypeKatex],
    remarkRehype: {
      footnoteLabelProperties: {
        className: ['']
      }
    }
  },
  prefetch: true,
  output: 'server',
  adapter: node({
    mode: "standalone"
  })
});