import { Match } from 'effect';
import { filterConditionTable } from './schema';
import { BooleanCondition, EnumCondition, NumberCondition, TextCondition } from '~/lib/condition';
import { AIRWAY_OPTIONS, DEPARTMENT_OPTIONS, SPECIALS_OPTIONS } from '~/lib/options';

export const convertConditions = (conditions: Array<typeof filterConditionTable.$inferSelect>) => {
  return conditions.map((condition) => convertCondition(condition));
};

const convertCondition = (condition: typeof filterConditionTable.$inferSelect) => {
  return Match.value(condition).pipe(
    Match.when({ type: 'TEXT_CONDITION' }, (textCondition) =>
      TextCondition.make({
        field: textCondition.field,
        operator: (textCondition.operator as 'eq' | 'ct') ?? undefined,
        value: textCondition.valueText ?? '',
        operators: new Set(['eq', 'ct']),
        _tag: 'TEXT_CONDITION',
      })
    ),
    Match.when({ type: 'NUMBER_CONDITION' }, (numberCondition) =>
      NumberCondition.make({
        field: numberCondition.field,
        operator: (numberCondition.operator as 'gt' | 'lt') ?? undefined,
        value: numberCondition.valueNumber ?? 0,
        operators: new Set(['gt', 'lt']),
        _tag: 'NUMBER_CONDITION',
      })
    ),
    Match.when({ type: 'BOOLEAN_CONDITION' }, (booleanCondition) =>
      BooleanCondition.make({
        field: booleanCondition.field,
        value: Boolean(booleanCondition.valueBoolean),
        _tag: 'BOOLEAN_CONDITION',
      })
    ),
    Match.when({ type: 'ENUM_CONDITION', field: 'department' }, (enumCondition) =>
      EnumCondition.make({
        field: enumCondition.field,
        value: enumCondition.valueEnum ?? '',
        options: DEPARTMENT_OPTIONS,
        _tag: 'ENUM_CONDITION',
      })
    ),
    Match.when({ type: 'ENUM_CONDITION', field: 'specials' }, (enumCondition) =>
      EnumCondition.make({
        field: enumCondition.field,
        value: enumCondition.valueEnum ?? '',
        options: SPECIALS_OPTIONS,
        _tag: 'ENUM_CONDITION',
      })
    ),
    Match.when({ type: 'ENUM_CONDITION', field: 'airway-management' }, (enumCondition) =>
      EnumCondition.make({
        field: enumCondition.field,
        value: enumCondition.valueEnum ?? '',
        options: AIRWAY_OPTIONS,
        _tag: 'ENUM_CONDITION',
      })
    ),
    Match.orElseAbsurd
  );
};
