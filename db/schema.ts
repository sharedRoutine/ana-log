import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const itemTable = sqliteTable('item', {
  caseNumber: text().primaryKey().unique().notNull(),
  ageYears: int().notNull(),
  ageMonths: int().notNull(),
  date: int().notNull(),
  asaScore: int().notNull(),
  airwayManagement: text().notNull(),
  department: text().notNull(),
  specials: text(),
  localAnesthetics: int().notNull(),
  outpatient: int().notNull(),
  procedure: text().notNull(),
});
