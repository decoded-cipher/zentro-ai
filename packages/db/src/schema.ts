import { integer, pgTable, varchar } from "drizzle-orm/pg-core";

export const user = pgTable('user', {
  id: varchar('id').primaryKey(),
  email: varchar('email').notNull(),
  name: varchar('name'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const project = pgTable('project', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => user.id),
  name: varchar('name'),
  description: varchar('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

