import { and, count, eq, gte, gt, like, lt, lte } from 'drizzle-orm';
import { Match } from 'effect';
import { useIntl } from 'react-intl';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';

export function useFilterLogic() {
  const intl = useIntl();

  const getTableField = (fieldName: string) => {
    return Match.value(fieldName).pipe(
      Match.when('department', () => itemTable.department),
      Match.when('asa-score', () => itemTable.asaScore),
      Match.when('airway-management', () => itemTable.airwayManagement),
      Match.when('case-number', () => itemTable.caseNumber),
      Match.when('procedure', () => itemTable.procedure),
      Match.when('outpatient', () => itemTable.outpatient),
      Match.when('age-years', () => itemTable.ageYears),
      Match.when('age-months', () => itemTable.ageMonths),
      Match.when('age', () => itemTable.ageYears),
      Match.when('date', () => itemTable.date),
      Match.when('specials', () => itemTable.specials),
      Match.when('local-anesthetics', () => itemTable.localAnesthetics),
      Match.orElse(() => undefined)
    );
  };

  const buildWhereClause = (conditions: any[]) => {
    if (!conditions || conditions.length === 0) return undefined;

    const whereConditions = conditions
      .map((condition) => {
        const field = getTableField(condition.field);
        if (!field) return undefined;

        const value = Match.value(condition.type).pipe(
          Match.when('TEXT_CONDITION', () => condition.valueText),
          Match.when('NUMBER_CONDITION', () => condition.valueNumber),
          Match.when('BOOLEAN_CONDITION', () => condition.valueBoolean),
          Match.when('ENUM_CONDITION', () => condition.valueEnum),
          Match.orElse(() => null)
        );

        if (value == null) return undefined;

        return Match.value(condition.operator).pipe(
          Match.when('eq', () => eq(field, value)),
          Match.when('ct', () => like(field, `%${value}%`)),
          Match.when('gt', () => gt(field, value)),
          Match.when('gte', () => gte(field, value)),
          Match.when('lt', () => lt(field, value)),
          Match.when('lte', () => lte(field, value)),
          Match.when(null, () => eq(field, value)),
          Match.when(undefined, () => eq(field, value)),
          Match.orElse(() => undefined)
        );
      })
      .filter(Boolean);

    return whereConditions.length > 0 ? and(...whereConditions) : undefined;
  };

  const getMatchingProceduresCount = (filterId: number, allFilterConditions: any[]) => {
    if (!allFilterConditions) return 0;

    const conditions = allFilterConditions.filter((condition) => condition.filterId === filterId);
    if (conditions.length === 0) return -1;

    const whereClause = buildWhereClause(conditions);
    if (!whereClause) return 0;

    const [result] = db.select({ count: count() }).from(itemTable).where(whereClause).all();
    return result?.count || 0;
  };

  const getConditionCount = (filterId: number, filterConditions: any[]) => {
    const conditionData = filterConditions?.find((fc) => fc.filterId === filterId);
    return conditionData?.conditionCount || 0;
  };

  const getConditionText = (filterId: number, filterConditions: any[]) => {
    const count = getConditionCount(filterId, filterConditions);
    if (count === 1) {
      return intl.formatMessage({ id: 'filter.condition.single' });
    } else {
      return intl.formatMessage({ id: 'filter.condition.plural' }, { count });
    }
  };

  return {
    buildWhereClause,
    getMatchingProceduresCount,
    getConditionCount,
    getConditionText,
  };
}