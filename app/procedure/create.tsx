import { DateTime } from 'effect';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeftCircle, Save } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import ProcedureForm from '~/components/ui/ProcedureForm';
import { db } from '~/db/db';
import {
  procedureTable,
  procedureSpecialTable,
  medicalCaseTable,
} from '~/db/schema';
import { SPECIALS_OPTIONS } from '~/lib/options';

export default function CreateProcedure() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { date: dateParam } = useLocalSearchParams<{ date: string }>();

  const operationDate = dateParam ? DateTime.unsafeMake(new Date(dateParam)) : DateTime.unsafeMake(new Date());

  const procedure = {
    caseNumber: '',
    patientAgeYears: 0,
    patientAgeMonths: 0,
    operationDate,
    asaScore: 1,
    airwayManagement: 'tube',
    department: 'PSY',
    departmentOther: '',
    specials: [] as Array<(typeof SPECIALS_OPTIONS)[number]>,
    legacySpecials: '',
    localAnesthetics: false,
    localAnestheticsText: '',
    emergency: false,
    favorite: false,
    procedure: '',
  } as const;

  return (
    <ProcedureForm
      procedure={procedure}
      onSubmit={async ({ procedure, medicalCase, specials }) => {
        await db.transaction(async (tx) => {
          await tx
            .insert(medicalCaseTable)
            .values(medicalCase)
            .onConflictDoNothing();
          const [insertedProcedure] = await tx
            .insert(procedureTable)
            .values(procedure)
            .returning({ id: procedureTable.id });
          if (specials.length > 0) {
            await tx.insert(procedureSpecialTable).values(
              specials.map((special) => ({
                procedureId: insertedProcedure.id,
                special,
              })),
            );
          }
        });
        router.back();
      }}
    >
      {({ canSubmit, dismiss, save }) => (
        <Stack.Screen
          options={{
            title: intl.formatMessage({ id: 'add-item.title' }),
            presentation: 'modal',
            headerLeft: () => (
              <PressableScale
                style={{ paddingHorizontal: 8 }}
                onPress={() => {
                  dismiss();
                  router.back();
                }}
              >
                <ChevronLeftCircle
                  size={24}
                  color={colorScheme === 'light' ? '#000' : '#fff'}
                />
              </PressableScale>
            ),
            headerRight: () => (
              <PressableScale
                style={{ paddingHorizontal: 8, opacity: canSubmit ? 1 : 0.5 }}
                onPress={() => {
                  if (!canSubmit) return;
                  save();
                }}
              >
                <Save size={24} color="#3B82F6" />
              </PressableScale>
            ),
          }}
        />
      )}
    </ProcedureForm>
  );
}
