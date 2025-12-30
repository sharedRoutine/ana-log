import { Schema } from 'effect';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from './options';
import {
  TextCondition as BaseTextCondition,
  NumberCondition as BaseNumberCondition,
  BooleanCondition,
  EnumCondition as BaseEnumCondition,
} from './condition';

const TextCondition = BaseTextCondition.pipe(Schema.omit('operators'));
const NumberCondition = BaseNumberCondition.pipe(Schema.omit('operators'));
const EnumCondition = BaseEnumCondition.pipe(Schema.omit('options'));

const Condition = Schema.Union(TextCondition, NumberCondition, BooleanCondition, EnumCondition);

const Filter = Schema.Struct({
  name: Schema.String,
  goal: Schema.NullOr(Schema.Number),
  conditions: Schema.Array(Condition),
});

const Procedure = Schema.Struct({
  caseNumber: Schema.String,
  ageYears: Schema.Number,
  ageMonths: Schema.Number,
  date: Schema.Number,
  asaScore: Schema.Number,
  airwayManagement: Schema.Literal(...AIRWAY_OPTIONS),
  department: Schema.Literal(...DEPARTMENT_OPTIONS),
  departmentOther: Schema.NullOr(Schema.String),
  specials: Schema.NullOr(Schema.String),
  localAnesthetics: Schema.Boolean,
  localAnestheticsText: Schema.NullOr(Schema.String),
  outpatient: Schema.Boolean,
  procedure: Schema.String,
});

export const ImportDataSchema = Schema.Struct({
  filters: Schema.Array(Filter),
  procedures: Schema.Array(Procedure),
});

export type ImportData = typeof ImportDataSchema.Type;
export type ImportFilter = typeof Filter.Type;
export type ImportCondition = typeof Condition.Type;
export type ImportProcedure = typeof Procedure.Type;
