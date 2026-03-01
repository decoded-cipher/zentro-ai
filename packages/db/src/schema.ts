import { integer, jsonb, pgTable, varchar, index, unique, text } from "drizzle-orm/pg-core";

/** API keys for LLM providers. Multiple keys per provider. Keys encrypted at rest. */
export const apiKey = pgTable('api_key', {
  id: varchar('id').primaryKey(),
  providerId: varchar('provider_id').notNull(),
  label: varchar('label'),
  active: integer('active').notNull().default(0),
  encryptedKey: text('encrypted_key').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  providerIdx: index('api_key_provider').on(table.providerId),
}));

/** User model preferences: which models are enabled. No row = use catalog default. */
export const enabledModel = pgTable('enabled_model', {
  id: varchar('id').primaryKey(),
  providerId: varchar('provider_id').notNull(),
  modelId: varchar('model_id').notNull(),
  enabled: integer('enabled').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
}, (table) => ({
  providerModelIdx: unique('enabled_model_provider_model').on(table.providerId, table.modelId),
}));

export const project = pgTable('project', {
  id: varchar('id').primaryKey(),
  name: varchar('name'),
  model: jsonb('model').$type<{ provider: string; name: string } | null>(),
  pinnedAt: integer('pinned_at'),
  archivedAt: integer('archived_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});

export const prompt = pgTable('prompt', {
  id: varchar('id').primaryKey(),
  projectId: varchar('project_id').notNull().references(() => project.id),
  text: varchar('text').notNull(),
  type: varchar('type').notNull().default('USER'),
  tokens: integer('tokens'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull()
});
