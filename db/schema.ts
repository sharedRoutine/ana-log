import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from '~/lib/options';

export const itemTable = sqliteTable('item', {
  caseNumber: text().primaryKey().unique().notNull(),
  ageYears: integer().notNull(),
  ageMonths: integer().notNull(),
  date: integer().notNull(),
  asaScore: integer().notNull(),
  airwayManagement: text().$type<(typeof AIRWAY_OPTIONS)[number]>().notNull(),
  department: text().$type<(typeof DEPARTMENT_OPTIONS)[number]>().notNull(),
  specials: text(),
  localAnesthetics: integer('localAnesthetics', { mode: 'boolean' }).notNull(),
  outpatient: integer('outpatient', { mode: 'boolean' }).notNull(),
  procedure: text().notNull(),
});

export const filterTable = sqliteTable('filter', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  goal: integer('goal'),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(Math.floor(Date.now())),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(Math.floor(Date.now())),
});

export const filterConditionTable = sqliteTable('filter_condition', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filterId: integer('filter_id')
    .notNull()
    .references(() => filterTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
  type: text('type', {
    enum: ['TEXT_CONDITION', 'NUMBER_CONDITION', 'BOOLEAN_CONDITION', 'ENUM_CONDITION'],
  }).notNull(),
  field: text('field').notNull(),
  operator: text('operator', {
    enum: ['eq', 'ct', 'gt', 'gte', 'lt', 'lte'],
  }),
  valueText: text('value_text'),
  valueNumber: real('value_number'),
  valueBoolean: integer('value_boolean', { mode: 'boolean' }),
  valueEnum: text('value_enum'),
  createdAt: integer('created_at', { mode: 'number' }).notNull().default(Math.floor(Date.now())),
  updatedAt: integer('updated_at', { mode: 'number' }).notNull().default(Math.floor(Date.now())),
});
