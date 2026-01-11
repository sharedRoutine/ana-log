import { Match, Option, Schema } from 'effect';
import { IntlShape } from 'react-intl';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

import { db } from '~/db/db';
import { filterTable, filterConditionTable, itemTable, itemSpecialTable } from '~/db/schema';
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
  { id, name, goal, combinator }: typeof filterTable.$inferSelect,
  conditions: Array<typeof filterConditionTable.$inferSelect>
) => ({
  id,
  name,
  goal,
  combinator,
  conditions: conditions.filter((c) => c.filterId === id).map((item) => conditionToExport(item)),
});

const procedureToExport = (
  procedure: typeof itemTable.$inferSelect,
  specials: string[]
) => ({
  ...procedure,
  specials: specials.length > 0 ? specials : null,
});

export async function exportData(
  filters: Array<typeof filterTable.$inferSelect>,
  allFilterConditions: Array<typeof filterConditionTable.$inferSelect>,
  procedures: Array<typeof itemTable.$inferSelect>,
  intl: IntlShape
) {
  const allSpecials = await db.select().from(itemSpecialTable);
  const specialsByCase = new Map<string, string[]>();
  for (const special of allSpecials) {
    const existing = specialsByCase.get(special.caseNumber) || [];
    existing.push(special.special);
    specialsByCase.set(special.caseNumber, existing);
  }

  const file = new File(Paths.cache, `ana-log-export-${Date.now()}.json`);
  file.create();
  file.write(
    JSON.stringify({
      filters: filters.map((f) => filterToExport(f, allFilterConditions)),
      procedures: procedures.map((procedure) =>
        procedureToExport(procedure, specialsByCase.get(procedure.caseNumber) || [])
      ),
    }),
    { encoding: 'utf8' }
  );
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    dialogTitle: intl.formatMessage({ id: 'home.export-data' }),
  });
}

export async function importData({
  onError,
  onComplete,
}: {
  onError?: () => void;
  onComplete?: ({
    proceduresCount,
    filtersCount,
  }: {
    proceduresCount: number;
    filtersCount: number;
  }) => void;
}) {
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
    onError?.();
    return;
  }

  const { filters, procedures } = parseResult.value;

  await db.transaction(async (tx) => {
    if (procedures.length > 0) {
      for (const p of procedures) {
        const specials = Array.isArray(p.specials) ? [...p.specials] : [];
        if (p.outpatient && !specials.includes('outpatient')) {
          specials.push('outpatient');
        }
        if (p.analgosedation && !specials.includes('analgosedation')) {
          specials.push('analgosedation');
        }

        const { outpatient, analgosedation, specials: _, ...itemData } = p;

        await tx.insert(itemTable).values(itemData).onConflictDoNothing();

        if (specials.length > 0) {
          await tx
            .insert(itemSpecialTable)
            .values(
              specials.map((special) => ({
                caseNumber: p.caseNumber,
                special,
              }))
            )
            .onConflictDoNothing();
        }
      }
    }

    for (const { id, name, goal, combinator, conditions } of filters) {
      const [inserted] = await tx
        .insert(filterTable)
        .values({
          id,
          name,
          goal,
          combinator,
        })
        .onConflictDoNothing()
        .returning({ id: filterTable.id });
      if (inserted && conditions.length > 0) {
        await tx
          .insert(filterConditionTable)
          .values(conditions.map((c) => conditionToDb(c, inserted.id)));
      }
    }
  });

  onComplete?.({ proceduresCount: procedures.length, filtersCount: filters.length });
}
