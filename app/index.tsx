import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useRouter } from 'expo-router';
import { Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Text, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarView } from '~/components/home/CalendarView';
import { ListHeader } from '~/components/home/ListHeader';
import SettingsMenu from '~/components/home/SettingsMenu';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { db } from '~/db/db';
import { procedureTable, medicalCaseTable } from '~/db/schema';
import { computeMarkedDates } from '~/lib/calendar';
import { getTodayKey, formatDateKey } from '~/lib/date';

type ViewMode = 'list' | 'calendar';

export default function Home() {
  const intl = useIntl();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: procedures } = useLiveQuery(
    db
      .select({ procedure: procedureTable, medicalCase: medicalCaseTable })
      .from(procedureTable)
      .innerJoin(
        medicalCaseTable,
        eq(procedureTable.caseNumber, medicalCaseTable.caseNumber),
      )
      .orderBy(desc(procedureTable.date)),
  );

  const markedDates = computeMarkedDates(procedures, selectedDate);

  const filteredProcedures =
    viewMode === 'calendar' && selectedDate
      ? procedures.filter(
          ({ procedure }) => formatDateKey(procedure.date) === selectedDate,
        )
      : procedures;

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    setSelectedDate(mode === 'list' ? null : getTodayKey());
  };

  return (
    <SafeAreaView
      edges={['bottom']}
      className="flex-1 bg-background-primary-light dark:bg-background-primary-dark"
    >
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'home.my-procedures' }),
          headerLeft: () => <SettingsMenu />,
          headerRight: () => (
            <PressableScale
              onPress={() =>
                router.push(
                  selectedDate
                    ? `/procedure/create?date=${selectedDate}`
                    : '/procedure/create',
                )
              }
            >
              <View className="px-2">
                <Plus size={24} color={iconColor} />
              </View>
            </PressableScale>
          ),
        }}
      />
      <FlashList
        data={filteredProcedures}
        renderItem={({ item }) => (
          <ProcedureCard
            item={item.procedure}
            onPress={() => router.push(`/procedure/${item.procedure.id}/show`)}
          />
        )}
        ListHeaderComponent={
          <ListHeader
            proceduresCount={filteredProcedures.length}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
          >
            {viewMode === 'calendar' && (
              <CalendarView
                markedDates={markedDates}
                selectedDate={selectedDate}
                onDayPress={(date) => setSelectedDate(date.dateString)}
              />
            )}
          </ListHeader>
        }
        ListEmptyComponent={
          viewMode === 'calendar' && selectedDate ? (
            <View className="items-center py-8">
              <Text className="text-text-secondary-light dark:text-text-secondary-dark">
                {intl.formatMessage({ id: 'home.no-procedures' })}
              </Text>
            </View>
          ) : null
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyExtractor={(item) => item.procedure.id.toString()}
        ItemSeparatorComponent={() => <View className="h-4" />}
        maintainVisibleContentPosition={{ disabled: true }}
      />
    </SafeAreaView>
  );
}
