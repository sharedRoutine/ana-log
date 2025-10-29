import { Stack } from 'expo-router';
import { useIntl } from 'react-intl';
import { useState, useEffect } from 'react';
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
import { View } from 'react-native';

export default function EditProcedure() {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();
  const { procedureId } = useLocalSearchParams<{ procedureId: string }>();

  const [existingItem, setExistingItem] = useState<typeof itemTable.$inferSelect | null>(null);

  // TODO: React Query
  useEffect(() => {
    db.select()
      .from(itemTable)
      .where(eq(itemTable.caseNumber, procedureId))
      .then((result) => setExistingItem(result[0] || null));
  }, [procedureId]);

  if (existingItem === null) return <View className="flex-1 bg-black" />;

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
    regionalAnesthesia: existingItem.localAnesthetics,
    regionalAnesthesiaText: '',
    outpatient: existingItem.outpatient,
    procedure: existingItem.procedure,
  });

  return (
    <ProcedureForm
      procedure={procedure}
      onSubmit={async (values) => {
        // TODO: Update DB
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
