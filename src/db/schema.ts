import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Experiments table
export const experiments = pgTable("experiments", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Prompts table
export const prompts = pgTable("prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  experimentId: uuid("experiment_id").references(() => experiments.id),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// LLM Models table
export const llmModels = pgTable("llm_models", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  version: text("version").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Responses table
export const responses = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id").references(() => prompts.id),
  modelId: uuid("model_id").references(() => llmModels.id),
  content: text("content").notNull(),
  responseTimeMs: integer("response_time_ms").notNull(),
  tokenCount: integer("token_count").notNull(),
  relevancyScore: real("relevancy_score"),
  accuracyScore: real("accuracy_score"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relationships
export const experimentRelations = relations(experiments, ({ one, many }) => ({
  user: one(users, {
    fields: [experiments.userId],
    references: [users.id],
  }),
  prompts: many(prompts),
}));

export const promptRelations = relations(prompts, ({ one, many }) => ({
  experiment: one(experiments, {
    fields: [prompts.experimentId],
    references: [experiments.id],
  }),
  responses: many(responses),
}));

export const responseRelations = relations(responses, ({ one }) => ({
  prompt: one(prompts, {
    fields: [responses.promptId],
    references: [prompts.id],
  }),
  model: one(llmModels, {
    fields: [responses.modelId],
    references: [llmModels.id],
  }),
}));
