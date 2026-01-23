import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DataBackup from '~/components/home/DataBackup';
import FilterGrid from '~/components/home/FilterGrid';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { db } from '~/db/db';
import { procedureTable, medicalCaseTable } from '~/db/schema';

interface ListHeaderProps {
  proceduresCount: number;
}

const ListHeader = ({ proceduresCount }: ListHeaderProps) => {
  const router = useRouter();
  const intl = useIntl();

  return (
    <View className="pt-4">
      <FilterGrid />

      <View className="mb-6 flex-row items-center gap-4">
        <Text className="flex-1 text-[28px] font-semibold text-text-primary-light dark:text-text-primary-dark">
          {intl.formatMessage({ id: 'home.my-procedures' })}
        </Text>
        <View className="rounded-xl bg-background-secondary-dark px-3 py-1">
          <Text className="font-semibold text-white">
            {proceduresCount}
          </Text>
        </View>
      </View>

      <PressableScale
        className="mb-4 flex-row items-center justify-center rounded-xl bg-accent px-5 py-3.5 shadow-accent"
        onPress={() => router.push('/procedure/create')}
      >
        <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="ml-2 text-sm font-semibold text-white">
          {intl.formatMessage({ id: 'home.add-procedure' })}
        </Text>
      </PressableScale>
    </View>
  );
};

export default function Home() {
  const intl = useIntl();
  const router = useRouter();
  const { data: procedures } = useLiveQuery(
    db
      .select({
        procedure: procedureTable,
        medicalCase: medicalCaseTable,
      })
      .from(procedureTable)
      .innerJoin(
        medicalCaseTable,
        eq(procedureTable.caseNumber, medicalCaseTable.caseNumber),
      )
      .orderBy(desc(procedureTable.date)),
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
    <ListHeader proceduresCount={procedures.length} />
  );

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background-primary-light dark:bg-background-primary-dark">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerLeft: () => <DataBackup />,
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
