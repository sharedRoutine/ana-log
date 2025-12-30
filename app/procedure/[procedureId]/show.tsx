import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeftCircle, Edit, FileQuestion } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { View } from 'react-native';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { useColors } from '~/hooks/useColors';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';
import { LoadingScreen } from '~/components/layout/LoadingScreen';
import { EmptyState } from '~/components/layout/EmptyState';

export default function ShowProcedure() {
  const intl = useIntl();
  const router = useRouter();

  const { procedureId } = useLocalSearchParams<{ procedureId: string }>();

  const { colorScheme } = useColorScheme();

  const { data, isPending } = useQuery({
    queryKey: ['procedure', procedureId],
    queryFn: () => db.select().from(itemTable).where(eq(itemTable.caseNumber, procedureId)),
  });

  const { getDepartmentColor } = useColors();
  const getTranslatedAirwayManagement = useCallback(
    (airway: string) => {
      return intl.formatMessage({ id: `enum.airway-management.${airway}` });
    },
    [intl]
  );

  const getTranslatedDepartment = useCallback(
    (department: string) => {
      return intl.formatMessage({ id: `enum.department.${department}` });
    },
    [intl]
  );

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

  return (
    <View className="flex-1 bg-white pt-4 dark:bg-black">
      <Stack.Screen
        options={{
          title: procedureId,
          presentation: 'modal',
          headerLeft: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={() => {
                router.back();
              }}>
              <ChevronLeftCircle size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
            </PressableScale>
          ),
          headerRight: () => (
            <PressableScale
              style={{ paddingHorizontal: 8 }}
              onPress={async () => {
                router.push(`/procedure/${procedureId}/edit`);
              }}>
              <Edit size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <ProcedureCard
        item={existingItem}
        getDepartmentColor={getDepartmentColor}
        getTranslatedDepartment={getTranslatedDepartment}
        getTranslatedAirwayManagement={getTranslatedAirwayManagement}
      />
    </View>
  );
}
