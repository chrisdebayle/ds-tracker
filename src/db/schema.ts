import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
  uuid,
  pgEnum,
  date,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { DispositionCounts } from "@/lib/disposition";

export const roleEnum = pgEnum("role", ["admin", "rep"]);
export const engagementStatusEnum = pgEnum("engagement_status", [
  "active",
  "paused",
  "completed",
]);
export const shareLinkKindEnum = pgEnum("share_link_kind", ["live", "report"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  role: roleEnum("role").notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const engagements = pgTable("engagements", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location").default(""),
  status: engagementStatusEnum("status").notNull().default("active"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  owner: text("owner").default(""),
  dialers: text("dialers").default(""),
  sowReference: text("sow_reference").default(""),
  notes: text("notes").default(""),
  headlineQuote: text("headline_quote").default(""),
  findings: jsonb("findings").$type<string[]>(),
  nextSteps: jsonb("next_steps").$type<string[]>(),
  createdById: uuid("created_by_id").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reps = pgTable("reps", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const segments = pgTable("segments", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  logic: text("logic").default(""),
  listTotal: integer("list_total").notNull().default(0),
  baseDials: integer("base_dials").notNull().default(0),
  baseCounts: jsonb("base_counts").$type<DispositionCounts>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const dailyLogEntries = pgTable("daily_log_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  segmentId: uuid("segment_id")
    .notNull()
    .references(() => segments.id, { onDelete: "cascade" }),
  repId: uuid("rep_id")
    .notNull()
    .references(() => reps.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  dials: integer("dials").notNull().default(0),
  talkTimeMinutes: integer("talk_time_minutes").notNull().default(0),
  counts: jsonb("counts").$type<DispositionCounts>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recordings = pgTable("recordings", {
  id: uuid("id").primaryKey().defaultRandom(),
  engagementId: uuid("engagement_id")
    .notNull()
    .references(() => engagements.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  repId: uuid("rep_id").references(() => reps.id, { onDelete: "set null" }),
  contact: text("contact").default(""),
  company: text("company").default(""),
  durationMinutes: integer("duration_minutes").notNull().default(0),
  consent: boolean("consent").notNull().default(false),
  notes: text("notes").default(""),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const shareLinks = pgTable(
  "share_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    engagementId: uuid("engagement_id")
      .notNull()
      .references(() => engagements.id, { onDelete: "cascade" }),
    kind: shareLinkKindEnum("kind").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => [uniqueIndex("share_links_engagement_kind_idx").on(table.engagementId, table.kind)]
);
