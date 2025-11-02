import { Stack } from 'expo-router';
import { useIntl } from 'react-intl';
import { eq } from 'drizzle-orm';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';
import { ChevronLeftCircle, Save } from 'lucide-react-native';
import { useLocalSearchParams } from 'expo-router/build/hooks';
import ProcedureForm from '~/components/ui/ProcedureForm';
import { Item } from '~/lib/schema';
import { PressableScale } from 'pressto';
import { Text, View } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function EditProcedure() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const { colorScheme } = useColorScheme();
  const { procedureId } = useLocalSearchParams<{ procedureId: string }>();

  const { data, isPending } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: () => db.select().from(itemTable).where(eq(itemTable.caseNumber, procedureId)),
  });

  if (isPending) return <View className="flex-1 bg-black" />;

  if (!data || data.length === 0) {
    // TODO: Proper Empty Screen
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text>No procedure found.</Text>
      </View>
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
    departmentOther: '',
    specialFeatures: Boolean(existingItem.specials),
    specialFeaturesText: existingItem.specials || '',
    localAnesthetics: existingItem.localAnesthetics,
    localAnestheticsText: '',
    outpatient: existingItem.outpatient,
    procedure: existingItem.procedure,
  });

  return (
    <ProcedureForm
      procedure={procedure}
      onSubmit={async (values) => {
        await db.update(itemTable).set(values).where(eq(itemTable.caseNumber, procedureId));
        await queryClient.invalidateQueries({ queryKey: ['procedure', procedureId] });
      }}>
      {({ canSubmit, dismiss, save }) => (
        <Stack.Screen
          options={{
            title: intl.formatMessage({ id: 'edit-item.title' }),
            presentation: 'modal',
            headerLeft: () => (
              <PressableScale style={{ paddingHorizontal: 8 }} onPress={dismiss}>
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
