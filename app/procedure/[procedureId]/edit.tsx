import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useIntl } from 'react-intl';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';
import { ChevronLeftCircle, Save, FileQuestion } from 'lucide-react-native';
import ProcedureForm from '~/components/ui/ProcedureForm';
import { Item } from '~/lib/schema';
import { PressableScale } from 'pressto';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { EmptyState } from '~/components/layout/EmptyState';

export default function EditProcedure() {
  const intl = useIntl();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { colorScheme } = useColorScheme();
  const { procedureId } = useLocalSearchParams<{ procedureId: string }>();

  const { data, isPending } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: () => db.select().from(itemTable).where(eq(itemTable.caseNumber, procedureId)),
  });

  if (isPending) {
    return <LoadingScreen />;
  }

  if (!data || data.length === 0) {
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

  const existingItem = data[0];
  const procedure = Item.make({
    caseNumber: existingItem.caseNumber,
    patientAgeYears: existingItem.ageYears,
    patientAgeMonths: existingItem.ageMonths,
    operationDate: DateTime.unsafeMake(existingItem.date),
    asaScore: existingItem.asaScore as 1 | 2 | 3 | 4 | 5 | 6,
    airwayManagement: existingItem.airwayManagement,
    department: existingItem.department,
    departmentOther: existingItem.departmentOther || '',
    specials: existingItem.specials || [],
    localAnesthetics: existingItem.localAnesthetics,
    localAnestheticsText: existingItem.localAnestheticsText || '',
    outpatient: existingItem.outpatient,
    emergency: existingItem.emergency,
    analgosedation: existingItem.analgosedation,
    favorite: existingItem.favorite,
    procedure: existingItem.procedure,
  });

  return (
    <ProcedureForm
      procedure={procedure}
      isEditing={true}
      onDelete={async () => {
        await db.delete(itemTable).where(eq(itemTable.caseNumber, procedureId));
        await queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
        router.dismissAll();
      }}
      onSubmit={async (values) => {
        await db.update(itemTable).set(values).where(eq(itemTable.caseNumber, procedureId));
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
