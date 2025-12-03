import { integer, pgTable, varchar, index, unique } from "drizzle-orm/pg-core";

// export const user = pgTable('user', {
//   id: varchar('id').primaryKey(),
//   email: varchar('email').notNull(),
//   clerk_id: varchar('clerk_id').notNull(),
//   createdAt: integer('created_at').notNull(),
//   updatedAt: integer('updated_at').notNull()
// }, (table) => ({
//   emailIdx: index('email_idx').on(table.email),
//   clerkIdIdx: index('clerk_id_idx').on(table.clerk_id),
//   emailUnique: unique('email_unique').on(table.email),
//   clerkIdUnique: unique('clerk_id_unique').on(table.clerk_id),
// }));

export const project = pgTable('project', {
  id: varchar('id').primaryKey(),
  // userId: varchar('user_id').notNull().references(() => user.id),
  name: varchar('name').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const prompt = pgTable('prompt', {
  id: varchar('id').primaryKey(),
  projectId: varchar('project_id').notNull().references(() => project.id),
  text: varchar('text').notNull(),
  type: varchar('type').notNull().default('USER'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});
