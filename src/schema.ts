// src/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const viewsTable = sqliteTable("views", {
	uuid: text("uuid").primaryKey(),
    count: integer("count").notNull(),
});