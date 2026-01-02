import { Schema } from 'effect';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS } from './options';

export const TextCondition = Schema.TaggedStruct('TEXT_CONDITION', {
  field: Schema.String,
  operators: Schema.Set(Schema.Literal('eq', 'ct')),
  operator: Schema.Literal('eq', 'ct').pipe(
    Schema.optional,
    Schema.withDefaults({
      decoding: () => 'eq' as const,
      constructor: () => 'eq' as const,
    })
  ),
  value: Schema.String,
});

export const NumberCondition = Schema.TaggedStruct('NUMBER_CONDITION', {
  field: Schema.String,
  operators: Schema.Set(Schema.Literal('eq', 'gt', 'gte', 'lt', 'lte')),
  operator: Schema.Literal('eq', 'gt', 'gte', 'lt', 'lte').pipe(
    Schema.optional,
    Schema.withDefaults({
      decoding: () => 'eq' as const,
      constructor: () => 'eq' as const,
    })
  ),
  value: Schema.Number,
});

export const BooleanCondition = Schema.TaggedStruct('BOOLEAN_CONDITION', {
  field: Schema.String,
  value: Schema.Boolean,
});

export const EnumCondition = Schema.TaggedStruct('ENUM_CONDITION', {
  field: Schema.String,
  options: Schema.NonEmptyArray(Schema.String),
  value: Schema.String,
});

export const FilterCondition = Schema.Union(
  TextCondition,
  NumberCondition,
  BooleanCondition,
  EnumCondition
);

export const Filter = Schema.Struct({
  name: Schema.String,
  goal: Schema.Number.pipe(Schema.optional),
  conditions: Schema.mutable(Schema.Array(FilterCondition)),
});

export const FIELDS = [
  NumberCondition.make({
    field: 'asa-score',
    operators: new Set(['eq', 'gt', 'gte', 'lt', 'lte']),
    value: 1,
  }),
  TextCondition.make({
    field: 'case-number',
    operators: new Set(['eq', 'ct']),
    value: '',
  }),
  EnumCondition.make({
    field: 'department',
    options: DEPARTMENT_OPTIONS,
    value: '',
  }),
  EnumCondition.make({
    field: 'airway-management',
    options: AIRWAY_OPTIONS,
    value: '',
  }),
  BooleanCondition.make({
    field: 'outpatient',
    value: false,
  }),
  BooleanCondition.make({
    field: 'special-features',
    value: false,
  }),
  BooleanCondition.make({
    field: 'local-anesthetics',
    value: false,
  }),
  TextCondition.make({
    field: 'procedure',
    operators: new Set(['eq', 'ct']),
    value: '',
  }),
  BooleanCondition.make({
    field: 'age',
    value: false,
  }),
];
