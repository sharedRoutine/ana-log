import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useIntl } from 'react-intl';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db';
import { procedureTable, procedureSpecialTable, medicalCaseTable } from '~/db/schema';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';
import { ChevronLeftCircle, Save, FileQuestion } from 'lucide-react-native';
import ProcedureForm from '~/components/ui/ProcedureForm';
import { PressableScale } from 'pressto';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { EmptyState } from '~/components/layout/EmptyState';

export default function EditProcedure() {
  const intl = useIntl();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { colorScheme } = useColorScheme();
  const { procedureId: procedureIdParam } = useLocalSearchParams<{ procedureId: string }>();
  const procedureId = parseInt(procedureIdParam, 10);

  const { data, isPending } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: async () => {
      const items = await db
        .select({
          procedure: procedureTable,
          medicalCase: medicalCaseTable,
        })
        .from(procedureTable)
        .innerJoin(medicalCaseTable, eq(procedureTable.caseNumber, medicalCaseTable.caseNumber))
        .where(eq(procedureTable.id, procedureId));
      const item = items[0];
      if (!item) return { procedure: undefined, medicalCase: undefined, specials: [] };
      const specials = await db
        .select()
        .from(procedureSpecialTable)
        .where(eq(procedureSpecialTable.procedureId, item.procedure.id));
      return { procedure: item.procedure, medicalCase: item.medicalCase, specials: specials.map((s) => s.special) };
    },
  });

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!data || !data.procedure || !data.medicalCase) {
    return (
      <EmptyState
        icon={FileQuestion}
        title={intl.formatMessage({ id: 'procedure.not-found.title' })}
        message={intl.formatMessage({ id: 'procedure.not-found.message' })}
        actionLabel={intl.formatMessage({ id: 'common.go-back' })}
        onAction={() => router.back()}
      />
    );
  }

  const existingItem = data.procedure;
  const procedure = {
    caseNumber: existingItem.caseNumber,
    patientAgeYears: existingItem.ageYears,
    patientAgeMonths: existingItem.ageMonths,
    operationDate: DateTime.unsafeMake(existingItem.date),
    asaScore: existingItem.asaScore as 1 | 2 | 3 | 4 | 5 | 6,
    airwayManagement: existingItem.airwayManagement,
    department: existingItem.department,
    departmentOther: existingItem.departmentOther || '',
    specials: data.specials,
    legacySpecials: existingItem.specials || '',
    localAnesthetics: existingItem.localAnesthetics,
    localAnestheticsText: existingItem.localAnestheticsText || '',
    emergency: existingItem.emergency,
    favorite: data.medicalCase.favorite,
    procedure: existingItem.description,
  };

  return (
    <ProcedureForm
      procedure={procedure}
      isEditing={true}
      onDelete={async () => {
        await db.delete(procedureTable).where(eq(procedureTable.id, procedureId));
        await queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
        router.dismissAll();
      }}
      onSubmit={async ({ procedure, medicalCase, specials }) => {
        await db.transaction(async (tx) => {
          if (medicalCase.caseNumber !== existingItem.caseNumber) {
            await tx.delete(medicalCaseTable).where(eq(medicalCaseTable.caseNumber, existingItem.caseNumber));
          }
          await tx.insert(medicalCaseTable).values(medicalCase).onConflictDoNothing();
          await tx.update(procedureTable).set(procedure).where(eq(procedureTable.id, procedureId));
          await tx
            .delete(procedureSpecialTable)
            .where(eq(procedureSpecialTable.procedureId, existingItem.id));
          if (specials.length > 0) {
            await tx.insert(procedureSpecialTable).values(
              specials.map((special) => ({
                procedureId: existingItem.id,
                special,
              }))
            );
          }
        });
        await queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
        router.back();
      }}>
      {({ canSubmit, dismiss, save }) => (
        <Stack.Screen
          options={{
            title: intl.formatMessage({ id: 'edit-item.title' }),
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
