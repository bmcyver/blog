import { viewsTable } from "@/schema";
import type { APIContext } from "astro";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

export const prerender = false;

export async function GET(
    context: APIContext
) {
    const runtime = context.locals.runtime;
    const db = drizzle(runtime.env.DB);

    if (!context.params.id || typeof context.params.id !== "string") {
        return new Response("Invalid ID", { status: 400 });
    }

    const res = await db.select().from(viewsTable).where(eq(viewsTable.uuid, context.params.id));

    return new Response(JSON.stringify(res));
}