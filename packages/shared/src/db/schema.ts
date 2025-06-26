import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import type {
  UserPreferences,
  ConceptData,
  StoryboardData,
  SettingsData,
  BreakdownData,
  VideoData,
  ProjectStatus,
  PlanType,
  ProjectVisibility,
  VideoHistory,
} from "../types";
import { nanoid } from "nanoid";

export const users = pgTable(
  "user",
  {
    id: varchar("id", { length: 255 }).notNull().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    imageUrl: text("image_url"),
    preferences: jsonb("preferences").$type<UserPreferences>(),
    planType: varchar("plan_type", { length: 50 })
      .$type<PlanType>()
      .default("starter"),
    credits: integer("credits").default(10),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [index("user_email_idx").on(table.email)]
);

export const videoProjects = pgTable(
  "video_project",
  {
    id: varchar("id", { length: 21 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: varchar("user_id", { length: 255 }).notNull(),
    projectName: text("project_name"),
    status: varchar("status", { length: 50 })
      .$type<ProjectStatus>()
      .notNull()
      .default("storyboard"),
    currentJobId: varchar("current_job_id", { length: 21 }),
    history: jsonb("history").$type<Record<string, VideoHistory>>(),
    views: integer("views").default(0),
    version: integer("version").default(1),
    visibility: varchar("visibility", { length: 50 })
      .$type<ProjectVisibility>()
      .notNull()
      .default("private"),

    // Form data for each step
    concept: jsonb("concept").$type<ConceptData>(),
    storyboard: jsonb("storyboard").$type<StoryboardData>(),
    settings: jsonb("settings").$type<SettingsData>(),
    breakdown: jsonb("breakdown").$type<BreakdownData>(),

    // Completed video data
    video: jsonb("video").$type<VideoData>(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("video_project_user_id_idx").on(table.userId),
    index("video_project_status_idx").on(table.status),
    index("video_project_created_at_idx").on(table.createdAt),
  ]
);

export const characters = pgTable(
  "character",
  {
    id: varchar("id", { length: 21 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => nanoid()),
    userId: varchar("user_id", { length: 255 }).notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    appearance: text("appearance"),
    age: text("age"),
    imageUrl: text("image_url").notNull(),
    storageKey: text("storage_key").notNull(), // For deletion: userId/characters/nanoid.png
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .default(sql`now()`)
      .notNull(),
  },
  (table) => [
    index("character_user_id_idx").on(table.userId),
    index("character_created_at_idx").on(table.createdAt),
  ]
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videoProjects: many(videoProjects),
  characters: many(characters),
}));

export const videoProjectsRelations = relations(videoProjects, ({ one }) => ({
  user: one(users, { fields: [videoProjects.userId], references: [users.id] }),
}));

export const charactersRelations = relations(characters, ({ one }) => ({
  user: one(users, { fields: [characters.userId], references: [users.id] }),
}));
