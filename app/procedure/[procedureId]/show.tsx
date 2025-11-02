import { Stack } from 'expo-router';
import { ChevronLeftCircle, Edit } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router/build/hooks';
import { PressableScale } from 'pressto';
import { useColorScheme } from 'nativewind';
import { useQuery } from '@tanstack/react-query';
import { db } from '~/db/db';
import { itemTable } from '~/db/schema';
import { eq } from 'drizzle-orm';
import { View } from 'react-native';
import { Text } from '@expo/ui/swift-ui';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { useColors } from '~/hooks/useColors';
import { useCallback } from 'react';
import { useIntl } from 'react-intl';

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
