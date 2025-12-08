import { viewsTable } from '@/schema'
import type { APIContext } from 'astro'
import { getCollection } from 'astro:content'
import { eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'

// Disable prerendering because this is a dynamic API route
export const prerender = false

const ids = await getCollection('blog').then((post) => post.map((p) => p.id))

// GET /blog/[...id]/view - Get view count for a blog post
export async function GET(context: APIContext) {
  const runtime = context.locals.runtime
  const db = drizzle(runtime.env.DB)

  if (
    !context.params.id ||
    typeof context.params.id !== 'string' ||
    !ids.includes(context.params.id)
  ) {
    return new Response('Invalid ID', { status: 400 })
  }

  let res = await db
    .select()
    .from(viewsTable)
    .where(eq(viewsTable.id, context.params.id))
    .get()

  if (!res) {
    res = await db
      .insert(viewsTable)
      .values({ id: context.params.id, count: 0 })
      .onConflictDoNothing()
      .returning()
      .get()
  }

  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' },
  })
}

// POST /blog/[...id]/view - Increment view count for a blog post
export async function POST(context: APIContext) {
  const runtime = context.locals.runtime
  const db = drizzle(runtime.env.DB)

  if (
    !context.params.id ||
    typeof context.params.id !== 'string' ||
    !ids.includes(context.params.id)
  ) {
    return new Response('Invalid ID', { status: 400 })
  }

  const res = await db
    .insert(viewsTable)
    .values({ id: context.params.id, count: 1 })
    .onConflictDoUpdate({
      target: viewsTable.id,
      set: {
        count: sql`${viewsTable.count} + 1`,
      },
    })
    .returning()
    .get()

  return new Response(JSON.stringify(res), {
    headers: { 'Content-Type': 'application/json' },
  })
}
