import { Stack, useRouter } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useIntl } from 'react-intl';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc, eq } from 'drizzle-orm';
import { FlashList } from '@shopify/flash-list';
import { db } from '~/db/db';
import { procedureTable, medicalCaseTable } from '~/db/schema';
import { useColorScheme } from 'nativewind';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import FilterGrid from '~/components/home/FilterGrid';
import DataBackup from '~/components/home/DataBackup';

interface ListHeaderProps {
  proceduresCount: number;
}

const ListHeader = ({
  proceduresCount,
}: ListHeaderProps) => {
  const router = useRouter();
  const intl = useIntl();
  const { colorScheme } = useColorScheme();

  return (
    <View className="bg-white px-4 pt-4 dark:bg-black">
      <FilterGrid />

      <View className="mb-6 flex-row items-center gap-4">
        <Text className="text-[28px] font-semibold text-black dark:text-white">
          {intl.formatMessage({ id: 'home.my-procedures' })}
        </Text>
        <View
          style={[
            styles.countBadge,
            colorScheme === 'light' ? styles.countBadgeLight : styles.countBadgeDark,
          ]}>
          <Text
            style={{ fontWeight: '600', color: colorScheme === 'light' ? '#6B7280' : '#8E8E93' }}>
            {proceduresCount}
          </Text>
        </View>
      </View>

      <PressableScale
        style={styles.createProcedureCard}
        onPress={() => router.push('/procedure/create')}>
        <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="ml-2 text-[14px] font-semibold text-white">
          {intl.formatMessage({ id: 'home.add-procedure' })}
        </Text>
      </PressableScale>
    </View>
  );
};

export default function Home() {
  const router = useRouter();
  const intl = useIntl();
  const { data: procedures } = useLiveQuery(
    db
      .select({
        procedure: procedureTable,
        medicalCase: medicalCaseTable,
      })
      .from(procedureTable)
      .innerJoin(medicalCaseTable, eq(procedureTable.caseNumber, medicalCaseTable.caseNumber))
      .orderBy(desc(procedureTable.date))
  );

  const renderItem = ({
    item,
  }: {
    item: {
      procedure: typeof procedureTable.$inferSelect;
      medicalCase: typeof medicalCaseTable.$inferSelect;
    };
  }) => (
    <ProcedureCard
      item={item.procedure}
      onPress={() => router.push(`/procedure/${item.procedure.id}/show`)}
    />
  );

  const renderListHeader = () => (
    <ListHeader
      proceduresCount={procedures.length}
    />
  );

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-white dark:bg-black">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerLeft: () => (
            <DataBackup />
          ),
        }}
      />
      <FlashList
        data={procedures}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyExtractor={(item) => item.procedure.id.toString()}
        ItemSeparatorComponent={() => <View className="h-4" />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  createProcedureCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgeLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  countBadgeDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
});
