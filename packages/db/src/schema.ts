import { integer, pgTable, varchar, index } from "drizzle-orm/pg-core";

export const user = pgTable('user', {
  id: varchar('id').primaryKey(),
  email: varchar('email').notNull(),
  clerk_id: varchar('clerk_id').notNull()
}, (table) => ({
  emailIdx: index('email_idx').on(table.email),
}));

export const project = pgTable('project', {
  id: varchar('id').primaryKey(),
  userId: varchar('user_id').notNull().references(() => user.id),
  name: varchar('name'),
  description: varchar('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const prompt = pgTable('prompt', {
  id: varchar('id').primaryKey(),
  projectId: varchar('project_id').notNull().references(() => project.id),
  content: varchar('content').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});
