import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS, SPECIALS_OPTIONS } from '~/lib/options';

export const medicalCaseTable = sqliteTable('medical_case', {
  caseNumber: text('case_number').primaryKey().unique().notNull(),
  ageYears: integer('age_years').notNull(),
  ageMonths: integer('age_months').notNull(),
  favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
});

export const procedureTable = sqliteTable(
  'procedure',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    caseNumber: text('case_number')
      .notNull()
      .references(() => medicalCaseTable.caseNumber, { onDelete: 'cascade', onUpdate: 'cascade' }),
    ageYears: integer('age_years').notNull(),
    ageMonths: integer('age_months').notNull(),
    date: integer().notNull(),
    asaScore: integer('asa_score').notNull(),
    airwayManagement: text('airway_management').$type<(typeof AIRWAY_OPTIONS)[number]>().notNull(),
    department: text().$type<(typeof DEPARTMENT_OPTIONS)[number]>().notNull(),
    departmentOther: text('department_other'),
    specials: text(),
    localAnesthetics: integer('local_anesthetics', { mode: 'boolean' }).notNull(),
    localAnestheticsText: text('local_anesthetics_text'),
    emergency: integer('emergency', { mode: 'boolean' }).notNull().default(false),
    favorite: integer('favorite', { mode: 'boolean' }).notNull().default(false),
    procedure: text().notNull(),
  },
  (table) => [
    index('procedure_date_idx').on(table.date),
    index('procedure_department_idx').on(table.department),
    index('procedure_airway_idx').on(table.airwayManagement),
    index('procedure_case_number_idx').on(table.caseNumber),
  ]
);

export const procedureSpecialTable = sqliteTable(
  'procedure_special',
  {
    procedureId: integer('procedure_id')
      .notNull()
      .references(() => procedureTable.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
    special: text().notNull().$type<(typeof SPECIALS_OPTIONS)[number]>(),
  },
  (table) => [
    primaryKey({ columns: [table.procedureId, table.special] }),
    index('idx_procedure_special_special').on(table.special),
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
