import { Stack, useRouter } from 'expo-router';
import { useIntl } from 'react-intl';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';
import { ChevronLeftCircle, Save } from 'lucide-react-native';
import ProcedureForm from '~/components/ui/ProcedureForm';
import { Item } from '~/lib/schema';
import { PressableScale } from 'pressto';
import { db } from '~/db/db';
import { procedureTable, procedureSpecialTable, medicalCaseTable } from '~/db/schema';

export default function CreateProcedure() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();

  const procedure = Item.make({
    caseNumber: '',
    patientAgeYears: 0,
    patientAgeMonths: 0,
    operationDate: DateTime.unsafeMake(new Date()),
    asaScore: 1,
    airwayManagement: 'tube',
    department: 'PSY',
    departmentOther: '',
    specials: [],
    legacySpecials: '',
    localAnesthetics: false,
    localAnestheticsText: '',
    emergency: false,
    favorite: false,
    procedure: '',
  });

  return (
    <ProcedureForm
      procedure={procedure}
      onSubmit={async ({ procedure, medicalCase, specials }) => {
        await db.transaction(async (tx) => {
          await tx.insert(medicalCaseTable).values(medicalCase).onConflictDoNothing();
          const [insertedProcedure] = await tx.insert(procedureTable).values(procedure).returning({ id: procedureTable.id });
          if (specials.length > 0) {
            await tx.insert(procedureSpecialTable).values(
              specials.map((special) => ({
                procedureId: insertedProcedure.id,
                special,
              }))
            );
          }
        });
        router.back();
      }}>
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
                }}>
                <ChevronLeftCircle size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
              </PressableScale>
            ),
            headerRight: () => (
              <PressableScale
                style={{ paddingHorizontal: 8, opacity: canSubmit ? 1 : 0.5 }}
                onPress={() => {
                  if (!canSubmit) return;
                  save();
                }}>
                <Save size={24} color="#3B82F6" />
              </PressableScale>
            ),
          }}
        />
      )}
    </ProcedureForm>
  );
}
