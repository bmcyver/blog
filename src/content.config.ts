import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({
    base: 'src/content/posts',
    pattern: '**/*.md',
  }),
  schema: z.object({
    title: z.string(),
    published: z.date(),
    updated: z.date().optional(),
    draft: z.boolean().optional().default(false),
    description: z.string().optional().default(''),
    image: z.string().optional().default(''),
    tags: z.array(z.string()).optional().default([]),
    category: z.string().optional().default(''),
    lang: z.string().optional().default(''),

    /* For internal use */
    prevTitle: z.string().default(''),
    prevId: z.string().default(''),
    nextTitle: z.string().default(''),
    nextId: z.string().default(''),
  }),
});
const spec = defineCollection({
  loader: glob({
    base: 'src/content/spec',
    pattern: '**/*.md',
  }),
});

export const collections = { posts, spec };
