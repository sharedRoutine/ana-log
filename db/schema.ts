import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS, SPECIALS_OPTIONS } from '~/lib/options';

export const itemTable = sqliteTable(
  'item',
  {
    caseNumber: text().primaryKey().unique().notNull(),
    ageYears: integer().notNull(),
    ageMonths: integer().notNull(),
    date: integer().notNull(),
    asaScore: integer().notNull(),
    airwayManagement: text().$type<(typeof AIRWAY_OPTIONS)[number]>().notNull(),
    department: text().$type<(typeof DEPARTMENT_OPTIONS)[number]>().notNull(),
    departmentOther: text('department_other'),
    specials: text(),
    localAnesthetics: integer('localAnesthetics', { mode: 'boolean' }).notNull(),
    localAnestheticsText: text('local_anesthetics_text'),
    emergency: integer('emergency', { mode: 'boolean' }).notNull().default(false),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    procedure: text().notNull(),
  },
  (table) => [
    index('item_date_idx').on(table.date),
    index('item_department_idx').on(table.department),
    index('item_airway_idx').on(table.airwayManagement),
  ]
);

export const itemSpecialTable = sqliteTable(
  'item_special',
  {
    caseNumber: text('case_number')
      .notNull()
      .references(() => itemTable.caseNumber, { onDelete: 'cascade', onUpdate: 'cascade' }),
    special: text().notNull().$type<(typeof SPECIALS_OPTIONS)[number]>(),
  },
  (table) => [
    primaryKey({ columns: [table.caseNumber, table.special] }),
    index('idx_item_special_special').on(table.special),
  ]
);

export const filterTable = sqliteTable('filter', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  goal: integer('goal'),
  combinator: text('combinator', { enum: ['AND', 'OR'] })
    .notNull()
    .default('AND'),
  createdAt: integer('created_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at', { mode: 'number' })
    .notNull()
    .$defaultFn(() => Date.now()),
});

export const filterConditionTable = sqliteTable(
  'filter_condition',
  {
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
    createdAt: integer('created_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Date.now()),
    updatedAt: integer('updated_at', { mode: 'number' })
      .notNull()
      .$defaultFn(() => Date.now()),
  },
  (table) => [index('filter_condition_filter_id_idx').on(table.filterId)]
);
