import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useRouter } from 'expo-router';
import { FilePlus2 } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Text, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarView } from '~/components/home/CalendarView';
import { ListHeader } from '~/components/home/ListHeader';
import { SectionHeader } from '~/components/home/SectionHeader';
import SettingsMenu from '~/components/home/SettingsMenu';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { db } from '~/db/db';
import { procedureTable, medicalCaseTable } from '~/db/schema';
import { computeMarkedDates } from '~/lib/calendar';
import { getTodayKey, formatDateKey } from '~/lib/date';
import { groupIntoSections, SectionKey } from '~/lib/sections';

type ViewMode = 'list' | 'calendar';

type ProcedureItem = {
  type: 'procedure';
  procedure: typeof procedureTable.$inferSelect;
  medicalCase: typeof medicalCaseTable.$inferSelect;
};

type SectionItem = {
  type: 'section';
  sectionKey: SectionKey;
};

type ListItem = ProcedureItem | SectionItem;

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

  const listData: Array<ListItem> =
    viewMode === 'list'
      ? groupIntoSections(filteredProcedures).flatMap((section) => [
          { type: 'section' as const, sectionKey: section.key },
          ...section.data.map((item) => ({
            type: 'procedure' as const,
            ...item,
          })),
        ])
      : filteredProcedures.map((item) => ({
          type: 'procedure' as const,
          ...item,
        }));

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
                <FilePlus2 size={24} color={iconColor} />
              </View>
            </PressableScale>
          ),
        }}
      />
      <FlashList
        data={listData}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return <SectionHeader sectionKey={item.sectionKey} />;
          }
          return (
            <ProcedureCard
              item={item.procedure}
              onPress={() =>
                router.push(`/procedure/${item.procedure.id}/show`)
              }
            />
          );
        }}
        getItemType={(item) => item.type}
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
        keyExtractor={(item) =>
          item.type === 'section'
            ? `section-${item.sectionKey.type}${item.sectionKey.type === 'month' ? `-${item.sectionKey.date}` : ''}`
            : `procedure-${item.procedure.id}`
        }
        ItemSeparatorComponent={({ leadingItem }) =>
          leadingItem?.type === 'procedure' ? (
            <View className="ml-4 h-px bg-gray-200 dark:bg-gray-700" />
          ) : null
        }
        maintainVisibleContentPosition={{ disabled: true }}
      />
    </SafeAreaView>
  );
}
