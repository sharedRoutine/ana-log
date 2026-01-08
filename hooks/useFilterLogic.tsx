import { and, count, eq, gte, gt, like, lt, lte, or, sql, SQL } from 'drizzle-orm';
import { Match } from 'effect';
import { useIntl } from 'react-intl';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { db } from '~/db/db';
import { itemTable, filterConditionTable, filterTable } from '~/db/schema';

const getTableField = (fieldName: string) => {
  return Match.value(fieldName).pipe(
    Match.when('department', () => itemTable.department),
    Match.when('asa-score', () => itemTable.asaScore),
    Match.when('airway-management', () => itemTable.airwayManagement),
    Match.when('case-number', () => itemTable.caseNumber),
    Match.when('procedure', () => itemTable.procedure),
    Match.when('outpatient', () => itemTable.outpatient),
    Match.when('emergency', () => itemTable.emergency),
    Match.when('age-years', () => itemTable.ageYears),
    Match.when('age-months', () => itemTable.ageMonths),
    Match.when('age', () => itemTable.ageYears),
    Match.when('date', () => itemTable.date),
    Match.when('specials', () => itemTable.specials),
    Match.when('local-anesthetics', () => itemTable.localAnesthetics),
    Match.orElse(() => undefined)
  );
};

export const buildWhereClauseFromConditions = (
  conditions: Array<typeof filterConditionTable.$inferSelect>,
  combinator: 'AND' | 'OR' = 'AND'
): SQL | undefined => {
  if (!conditions || conditions.length === 0) return undefined;

  const whereConditions = conditions
    .map((condition) => {
      const field = getTableField(condition.field);
      if (!field) {
        return undefined;
      }

      const value = Match.value(condition.type).pipe(
        Match.when('TEXT_CONDITION', () => condition.valueText),
        Match.when('NUMBER_CONDITION', () => condition.valueNumber),
        Match.when('BOOLEAN_CONDITION', () => condition.valueBoolean),
        Match.when('ENUM_CONDITION', () => condition.valueEnum),
        Match.exhaustive
      );

      if (value === null || value === undefined) {
        return undefined;
      }

      // Special age handling
      if (condition.field === 'age' && condition.type === 'BOOLEAN_CONDITION') {
        const ageInYears = sql`(${itemTable.ageYears} + ${itemTable.ageMonths} / 12.0)`;
        if (value === true) {
          return lt(ageInYears, 5);
        } else {
          return gte(ageInYears, 5);
        }
      }

      if (condition.operator === null || condition.operator === undefined) {
        return eq(field, value);
      }

      return Match.value(condition.operator).pipe(
        Match.when('eq', () => eq(field, value)),
        Match.when('ct', () => like(field, `%${value}%`)),
        Match.when('gt', () => gt(field, value)),
        Match.when('gte', () => gte(field, value)),
        Match.when('lt', () => lt(field, value)),
        Match.when('lte', () => lte(field, value)),
        Match.exhaustive
      );
    })
    .filter(Boolean) as Array<SQL>;

  if (whereConditions.length === 0) return undefined;

  return combinator === 'OR' ? or(...whereConditions) : and(...whereConditions);
};

export function useFilterLogic() {
  const intl = useIntl();

  const buildWhereClause = (conditions: Array<typeof filterConditionTable.$inferSelect>) => {
    return buildWhereClauseFromConditions(conditions);
  };

  const getMatchingProceduresCount = (
    filterId: number,
    allFilterConditions: Array<typeof filterConditionTable.$inferSelect>,
    precomputedCounts?: Map<number, number>
  ): number => {
    if (precomputedCounts?.has(filterId)) {
      return precomputedCounts.get(filterId) ?? 0;
    }

    if (!allFilterConditions) return 0;

    const conditions = allFilterConditions.filter((condition) => condition.filterId === filterId);
    if (conditions.length === 0) return -1;

    const whereClause = buildWhereClauseFromConditions(conditions);
    if (!whereClause) return 0;

    const [result] = db.select({ count: count() }).from(itemTable).where(whereClause).all();
    return result?.count || 0;
  };

  const getConditionCount = (
    filterId: number,
    filterConditions: Array<{ filterId: number; conditionCount: number }>
  ): number => {
    const conditionData = filterConditions?.find((fc) => fc.filterId === filterId);
    return conditionData?.conditionCount || 0;
  };

  const stringifyCondition = (condition: typeof filterConditionTable.$inferSelect): string => {
    if (condition.field === 'age' && condition.type === 'BOOLEAN_CONDITION') {
      return condition.valueBoolean
        ? intl.formatMessage({ id: 'create-filter.field.age' })
        : intl.formatMessage({ id: 'create-filter.field.age-over5' });
    }

    const fieldName = Match.value(condition.field).pipe(
      Match.when('department', () => intl.formatMessage({ id: 'create-filter.field.department' })),
      Match.when('asa-score', () => intl.formatMessage({ id: 'create-filter.field.asa-score' })),
      Match.when('airway-management', () =>
        intl.formatMessage({ id: 'create-filter.field.airway-management' })
      ),
      Match.when('case-number', () =>
        intl.formatMessage({ id: 'create-filter.field.case-number' })
      ),
      Match.when('procedure', () => intl.formatMessage({ id: 'create-filter.field.procedure' })),
      Match.when('outpatient', () => intl.formatMessage({ id: 'create-filter.field.outpatient' })),
      Match.when('emergency', () => intl.formatMessage({ id: 'create-filter.field.emergency' })),
      Match.when('special-features', () =>
        intl.formatMessage({ id: 'create-filter.field.special-features' })
      ),
      Match.when('local-anesthetics', () =>
        intl.formatMessage({ id: 'create-filter.field.local-anesthetics' })
      ),
      Match.orElse(() => condition.field)
    );

    const value = Match.value(condition.type).pipe(
      Match.when('TEXT_CONDITION', () => condition.valueText),
      Match.when('NUMBER_CONDITION', () => condition.valueNumber?.toString()),
      Match.when('BOOLEAN_CONDITION', () => {
        return condition.valueBoolean
          ? intl.formatMessage({ id: 'create-filter.yes' })
          : intl.formatMessage({ id: 'create-filter.no' });
      }),
      Match.when('ENUM_CONDITION', () => {
        if (condition.field === 'department') {
          return intl.formatMessage({ id: `enum.department.${condition.valueEnum}` });
        }
        if (condition.field === 'airway-management') {
          return intl.formatMessage({ id: `enum.airway-management.${condition.valueEnum}` });
        }
        return condition.valueEnum;
      }),
      Match.exhaustive
    );

    const operatorSymbol = condition.operator
      ? Match.value(condition.operator).pipe(
          Match.when('eq', () => '='),
          Match.when('ct', () => '∋'),
          Match.when('gt', () => '>'),
          Match.when('gte', () => '≥'),
          Match.when('lt', () => '<'),
          Match.when('lte', () => '≤'),
          Match.exhaustive
        )
      : '=';

    return `${fieldName} ${operatorSymbol} ${value}`;
  };

  const getConditionText = (
    filterId: number,
    filterConditions: Array<{ filterId: number; conditionCount: number }>,
    allFilterConditions?: Array<typeof filterConditionTable.$inferSelect>
  ): string => {
    const conditionCount = getConditionCount(filterId, filterConditions);

    if (conditionCount === 1 && allFilterConditions) {
      const condition = allFilterConditions.find((c) => c.filterId === filterId);
      if (condition) {
        return stringifyCondition(condition);
      }
      return intl.formatMessage({ id: 'filter.condition.single' });
    } else if (conditionCount > 1 && allFilterConditions) {
      const conditions = allFilterConditions.filter((c) => c.filterId === filterId);
      if (conditions.length > 0) {
        const firstCondition = stringifyCondition(conditions[0]);
        const remaining = conditionCount - 1;
        return `${firstCondition} ${intl.formatMessage({ id: 'filter.more-conditions' }, { remaining })}`;
      }
      return intl.formatMessage({ id: 'filter.condition.plural' }, { count: conditionCount });
    } else if (conditionCount === 1) {
      return intl.formatMessage({ id: 'filter.condition.single' });
    } else {
      return intl.formatMessage({ id: 'filter.condition.plural' }, { count: conditionCount });
    }
  };

  return {
    buildWhereClause,
    getMatchingProceduresCount,
    getConditionCount,
    getConditionText,
    stringifyCondition,
  };
}

export function useFilterMatchCounts(
  filters: (typeof filterTable.$inferSelect)[] | undefined,
  allFilterConditions: (typeof filterConditionTable.$inferSelect)[] | undefined
): Map<number, number> {
  // Get all procedures for counting
  const { data: procedures } = useLiveQuery(db.select().from(itemTable));

  const countsMap = new Map<number, number>();

  if (!filters || !allFilterConditions || !procedures) {
    return countsMap;
  }

  for (const filter of filters) {
    const conditions = allFilterConditions.filter((c) => c.filterId === filter.id);
    if (conditions.length === 0) {
      countsMap.set(filter.id, -1);
      continue;
    }

    const whereClause = buildWhereClauseFromConditions(conditions, filter.combinator);
    if (!whereClause) {
      countsMap.set(filter.id, 0);
      continue;
    }

    const matchCondition = (
      procedure: (typeof procedures)[number],
      condition: (typeof conditions)[number]
    ) => {
      const field = getTableField(condition.field);
      if (!field) return true;

      const conditionValue = Match.value(condition.type).pipe(
        Match.when('TEXT_CONDITION', () => condition.valueText),
        Match.when('NUMBER_CONDITION', () => condition.valueNumber),
        Match.when('BOOLEAN_CONDITION', () => condition.valueBoolean),
        Match.when('ENUM_CONDITION', () => condition.valueEnum),
        Match.exhaustive
      );

      if (conditionValue === null || conditionValue === undefined) return true;

      if (condition.field === 'age' && condition.type === 'BOOLEAN_CONDITION') {
        const ageInYears = procedure.ageYears + procedure.ageMonths / 12.0;
        return conditionValue === true ? ageInYears < 5 : ageInYears >= 5;
      }

      const procedureValue = Match.value(condition.field).pipe(
        Match.when('department', () => procedure.department),
        Match.when('asa-score', () => procedure.asaScore),
        Match.when('airway-management', () => procedure.airwayManagement),
        Match.when('case-number', () => procedure.caseNumber),
        Match.when('procedure', () => procedure.procedure),
        Match.when('outpatient', () => procedure.outpatient),
        Match.when('emergency', () => procedure.emergency),
        Match.when('specials', () => procedure.specials),
        Match.when('local-anesthetics', () => procedure.localAnesthetics),
        Match.orElse(() => undefined)
      );

      if (procedureValue === undefined) return true;

      const operator = condition.operator ?? 'eq';
      return Match.value(operator).pipe(
        Match.when('eq', () => procedureValue === conditionValue),
        Match.when(
          'ct',
          () =>
            typeof procedureValue === 'string' &&
            typeof conditionValue === 'string' &&
            procedureValue.toLowerCase().includes(conditionValue.toLowerCase())
        ),
        Match.when(
          'gt',
          () =>
            typeof procedureValue === 'number' &&
            typeof conditionValue === 'number' &&
            procedureValue > conditionValue
        ),
        Match.when(
          'gte',
          () =>
            typeof procedureValue === 'number' &&
            typeof conditionValue === 'number' &&
            procedureValue >= conditionValue
        ),
        Match.when(
          'lt',
          () =>
            typeof procedureValue === 'number' &&
            typeof conditionValue === 'number' &&
            procedureValue < conditionValue
        ),
        Match.when(
          'lte',
          () =>
            typeof procedureValue === 'number' &&
            typeof conditionValue === 'number' &&
            procedureValue <= conditionValue
        ),
        Match.exhaustive
      );
    };

    const matchingCount = procedures.filter((procedure) => {
      if (filter.combinator === 'OR') {
        return conditions.some((condition) => matchCondition(procedure, condition));
      }
      return conditions.every((condition) => matchCondition(procedure, condition));
    }).length;

    countsMap.set(filter.id, matchingCount);
  }

  return countsMap;
}
