import { Stack } from 'expo-router';
import { useIntl } from 'react-intl';
import { useMemo } from 'react';
import { DateTime } from 'effect';
import { useColorScheme } from 'nativewind';
import { ChevronLeftCircle, Save } from 'lucide-react-native';
import ProcedureForm from '~/components/ui/ProcedureForm';
import { Item } from '~/lib/schema';
import { PressableScale } from 'pressto';

export default function UpsertItem() {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  const procedure = useMemo(
    () =>
      Item.make({
        caseNumber: '',
        patientAgeYears: 0,
        patientAgeMonths: 0,
        operationDate: DateTime.unsafeMake(new Date()),
        asaScore: 1,
        airwayManagement: 'tube',
        department: 'PSY',
        departmentOther: '',
        specialFeatures: false,
        specialFeaturesText: '',
        regionalAnesthesia: false,
        regionalAnesthesiaText: '',
        outpatient: false,
        procedure: '',
      }),
    []
  );

  return (
    <ProcedureForm procedure={procedure} onSubmit={async (values) => {}}>
      {({ canSubmit, dismiss, save }) => (
        <Stack.Screen
          options={{
            title: intl.formatMessage({ id: 'add-item.title' }),
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
