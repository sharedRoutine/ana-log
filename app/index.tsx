import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useRouter } from 'expo-router';
import { CalendarDays, List, ListFilter, Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Text, useColorScheme } from 'react-native';
import { type DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarView } from '~/components/home/CalendarView';
import DataBackup from '~/components/home/DataBackup';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { db } from '~/db/db';
import { procedureTable, medicalCaseTable } from '~/db/schema';

type ViewMode = 'list' | 'calendar';

const getTodayKey = () => new Date().toISOString().split('T')[0];

const formatDateKey = (epochMs: number) => {
  const date = new Date(epochMs);
  return date.toISOString().split('T')[0];
};

interface ListHeaderProps {
  proceduresCount: number;
  viewMode: ViewMode;
  selectedDate: string | null;
  onViewModeChange: (mode: ViewMode) => void;
  calendarView: React.ReactNode | null;
}

const ListHeader = ({ proceduresCount, viewMode, selectedDate, onViewModeChange, calendarView }: ListHeaderProps) => {
  const router = useRouter();
  const intl = useIntl();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const iconColor = isDark ? '#FFFFFF' : '#000000';
  const activeIconColor = '#34D399';

  return (
    <View className="pt-4">
      <View className="mb-6 flex-row items-center gap-4">
        <Text className="flex-1 text-[28px] font-semibold text-text-primary-light dark:text-text-primary-dark">
          {intl.formatMessage({ id: 'home.my-procedures' })}
        </Text>
        <View className="rounded-xl bg-background-secondary-dark px-3 py-1">
          <Text className="font-semibold text-white">
            {proceduresCount}
          </Text>
        </View>
        <View className="flex-row items-center gap-2">
          <PressableScale onPress={() => onViewModeChange('list')}>
            <View className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-background-secondary-light dark:bg-background-secondary-dark' : ''}`}>
              <List size={20} color={viewMode === 'list' ? activeIconColor : iconColor} strokeWidth={2} />
            </View>
          </PressableScale>
          <PressableScale onPress={() => onViewModeChange('calendar')}>
            <View className={`rounded-lg p-2 ${viewMode === 'calendar' ? 'bg-background-secondary-light dark:bg-background-secondary-dark' : ''}`}>
              <CalendarDays size={20} color={viewMode === 'calendar' ? activeIconColor : iconColor} strokeWidth={2} />
            </View>
          </PressableScale>
        </View>
      </View>

      <PressableScale
        className="mb-4 flex-row items-center justify-center rounded-xl bg-accent px-5 py-3.5 shadow-accent"
        onPress={() => router.push(selectedDate ? `/procedure/create?date=${selectedDate}` : '/procedure/create')}
      >
        <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        <Text className="ml-2 text-sm font-semibold text-white">
          {intl.formatMessage({ id: 'home.add-procedure' })}
        </Text>
      </PressableScale>

      {calendarView}
    </View>
  );
};

export default function Home() {
  const intl = useIntl();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

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

  const markedDates = procedures.reduce<Record<string, { marked?: boolean; dotColor?: string; selected?: boolean; selectedColor?: string }>>((acc, { procedure }) => {
    const key = formatDateKey(procedure.date);
    acc[key] = { marked: true, dotColor: '#34D399' };
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: '#34D399',
    };
  }

  const filteredProcedures = viewMode === 'calendar' && selectedDate
    ? procedures.filter(({ procedure }) => formatDateKey(procedure.date) === selectedDate)
    : procedures;

  const handleDayPress = (date: DateData) => {
    setSelectedDate(date.dateString);
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'list') {
      setSelectedDate(null);
    } else {
      setSelectedDate(getTodayKey());
    }
  };

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
      proceduresCount={filteredProcedures.length}
      viewMode={viewMode}
      selectedDate={selectedDate}
      onViewModeChange={handleViewModeChange}
      calendarView={viewMode === 'calendar' ? (
        <CalendarView
          markedDates={markedDates}
          selectedDate={selectedDate}
          onDayPress={handleDayPress}
        />
      ) : null}
    />
  );

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background-primary-light dark:bg-background-primary-dark">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerLeft: () => <DataBackup />,
          headerRight: () => (
            <PressableScale onPress={() => router.push('/filters')}>
              <View className="px-2">
                <ListFilter size={24} color={iconColor} />
              </View>
            </PressableScale>
          ),
        }}
      />
      <FlashList
        data={filteredProcedures}
        renderItem={renderItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={viewMode === 'calendar' && selectedDate ? (
          <View className="items-center py-8">
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">
              {intl.formatMessage({ id: 'home.no-procedures' })}
            </Text>
          </View>
        ) : null}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyExtractor={(item) => item.procedure.id.toString()}
        ItemSeparatorComponent={() => <View className="h-4" />}
      />
    </SafeAreaView>
  );
}
