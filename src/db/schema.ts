import { pgTable, uuid, timestamp, text } from 'drizzle-orm/pg-core';

export const leads = pgTable('leads', {
  id: uuid('id').primaryKey().defaultRandom(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  fullName: text('full_name').notNull(),
  businessName: text('business_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  industry: text('industry').notNull(),
  language: text('language').notNull(),
  message: text('message').notNull().default(''),
  status: text('status').notNull().default('new'),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
