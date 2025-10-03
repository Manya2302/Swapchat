import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  fullName: text("full_name").notNull(),
  dateOfBirth: text("date_of_birth").notNull(),
  password: text("password").notNull(),
  publicKey: text("public_key").notNull(),
  privateKey: text("private_key").notNull(),
  authorizedIPs: jsonb("authorized_ips").$type<Array<{
    ip: string;
    authorizedAt: string;
    userAgent: string;
  }>>().default([]),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const blocks = pgTable("blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  index: integer("index").notNull(),
  timestamp: text("timestamp").notNull(),
  from: text("from").notNull(),
  to: text("to").notNull(),
  payload: text("payload").notNull(),
  prevHash: text("prev_hash").notNull(),
  hash: text("hash").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const otps = pgTable("otps", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ipAuthorizations = pgTable("ip_authorizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull(),
  ip: text("ip").notNull(),
  token: text("token").notNull(),
  userAgent: text("user_agent"),
  authorized: boolean("authorized").default(false),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  phone: true,
  fullName: true,
  dateOfBirth: true,
  publicKey: true,
  privateKey: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Block = typeof blocks.$inferSelect;
export type OTP = typeof otps.$inferSelect;
export type IPAuthorization = typeof ipAuthorizations.$inferSelect;
