import { Match, Option, Schema } from 'effect';
import { IntlShape } from 'react-intl';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { db } from '~/db/db';
import { filterTable, filterConditionTable, itemTable } from '~/db/schema';
import { ImportDataSchema } from '~/lib/importSchema';

const conditionToExport = (c: typeof filterConditionTable.$inferSelect) =>
  Match.value(c.type).pipe(
    Match.when('TEXT_CONDITION', () => ({
      _tag: 'TEXT_CONDITION' as const,
      field: c.field,
      operator: c.operator as 'eq' | 'ct',
      value: c.valueText ?? '',
    })),
    Match.when('NUMBER_CONDITION', () => ({
      _tag: 'NUMBER_CONDITION' as const,
      field: c.field,
      operator: c.operator as 'eq' | 'gt' | 'gte' | 'lt' | 'lte',
      value: c.valueNumber ?? 0,
    })),
    Match.when('BOOLEAN_CONDITION', () => ({
      _tag: 'BOOLEAN_CONDITION' as const,
      field: c.field,
      value: c.valueBoolean ?? false,
    })),
    Match.when('ENUM_CONDITION', () => ({
      _tag: 'ENUM_CONDITION' as const,
      field: c.field,
      value: c.valueEnum ?? '',
    })),
    Match.exhaustive
  );

const conditionToDb = (c: ReturnType<typeof conditionToExport>, filterId: number) =>
  Match.value(c).pipe(
    Match.tag('TEXT_CONDITION', (cond) => ({
      filterId,
      field: cond.field,
      type: cond._tag,
      operator: cond.operator,
      valueText: cond.value,
      valueNumber: null,
      valueBoolean: null,
      valueEnum: null,
    })),
    Match.tag('NUMBER_CONDITION', (cond) => ({
      filterId,
      field: cond.field,
      type: cond._tag,
      operator: cond.operator,
      valueText: null,
      valueNumber: cond.value,
      valueBoolean: null,
      valueEnum: null,
    })),
    Match.tag('BOOLEAN_CONDITION', (cond) => ({
      filterId,
      field: cond.field,
      type: cond._tag,
      operator: null,
      valueText: null,
      valueNumber: null,
      valueBoolean: cond.value,
      valueEnum: null,
    })),
    Match.tag('ENUM_CONDITION', (cond) => ({
      filterId,
      field: cond.field,
      type: cond._tag,
      operator: null,
      valueText: null,
      valueNumber: null,
      valueBoolean: null,
      valueEnum: cond.value,
    })),
    Match.exhaustive
  );

const filterToExport = (
  f: typeof filterTable.$inferSelect,
  conditions: Array<typeof filterConditionTable.$inferSelect>
) => ({
  name: f.name,
  goal: f.goal,
  conditions: conditions.filter((c) => c.filterId === f.id).map((item) => conditionToExport(item)),
});

export async function exportData(
  filters: Array<typeof filterTable.$inferSelect>,
  allFilterConditions: Array<typeof filterConditionTable.$inferSelect>,
  procedures: Array<typeof itemTable.$inferSelect>,
  intl: IntlShape
) {
  const file = new File(Paths.cache, `ana-log-export-${Date.now()}.json`);
  file.create();
  file.write(
    JSON.stringify({
      filters: filters.map((f) => filterToExport(f, allFilterConditions)),
      procedures,
    }),
    { encoding: 'utf8' }
  );
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: intl.formatMessage({ id: 'home.export-data' }),
  });
}

export async function importData(intl: IntlShape) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json'],
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });

  if (result.canceled) {
    return;
  }

  const fileUri = result.assets[0].uri;
  const file = new File(fileUri);
  const rawData = JSON.parse(file.textSync());

  const parseResult = Schema.decodeUnknownOption(ImportDataSchema)(rawData);
  if (Option.isNone(parseResult)) {
    Alert.alert(
      intl.formatMessage({ id: 'import.error.title' }),
      intl.formatMessage({ id: 'import.error.invalid-format' })
    );
    return;
  }

  const { filters, procedures } = parseResult.value;

  await db.transaction(async (tx) => {
    if (procedures.length > 0) {
      await tx
        .insert(itemTable)
        .values([...procedures])
        .onConflictDoNothing();
    }
    for (const filter of filters) {
      const [inserted] = await tx
        .insert(filterTable)
        .values({ name: filter.name, goal: filter.goal })
        .returning({ id: filterTable.id });
      if (inserted && filter.conditions.length > 0) {
        await tx
          .insert(filterConditionTable)
          .values(filter.conditions.map((c) => conditionToDb(c, inserted.id)));
      }
    }
  });

  Alert.alert(
    intl.formatMessage({ id: 'import.success.title' }),
    intl.formatMessage(
      { id: 'import.success.message' },
      { procedures: procedures.length, filters: filters.length }
    )
  );
}
