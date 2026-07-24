import { FlashList } from '@shopify/flash-list';
import { desc, eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { Stack, useRouter } from 'expo-router';
import { FilePlus2, Plus } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { View, Text, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  DateRangeFilter,
  initialDateRange,
  resolveDateRange,
  type DateRangeValue,
} from '~/components/home/DateRangeFilter';
import { ListHeader } from '~/components/home/ListHeader';
import { MonthCalendar } from '~/components/home/MonthCalendar';
import { SectionHeader } from '~/components/home/SectionHeader';
import SettingsMenu from '~/components/home/SettingsMenu';
import { ProcedureCard } from '~/components/ui/ProcedureCard';
import { db } from '~/db/db';
import { procedureTable, medicalCaseTable } from '~/db/schema';
import { useColors } from '~/hooks/useColors';
import {
  formatDateKey,
  fromDateKey,
  getTodayKey,
  type DateKey,
} from '~/lib/date';
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

const currentMonth = () => {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
};

export default function Home() {
  const intl = useIntl();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { getDepartmentHexColor } = useColors();
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<DateKey>(getTodayKey());
  const [visibleMonth, setVisibleMonth] = useState(currentMonth());
  const [dateRange, setDateRange] =
    useState<DateRangeValue>(initialDateRange());
  const [searchQuery, setSearchQuery] = useState('');

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

  const markers = new Map<DateKey, Array<string>>();
  for (const { procedure } of procedures ?? []) {
    const key = formatDateKey(procedure.date);
    const colors = markers.get(key) ?? [];
    const color = getDepartmentHexColor(procedure.department);
    if (!colors.includes(color)) colors.push(color);
    markers.set(key, colors);
  }

  const range = resolveDateRange(dateRange);

  const query = searchQuery.trim().toLowerCase();
  const isSearching = query.length > 0;

  const matchesQuery = ({
    procedure,
  }: {
    procedure: typeof procedureTable.$inferSelect;
  }) => {
    const department = intl
      .formatMessage({ id: `enum.department.${procedure.department}` })
      .toLowerCase();
    const airway = intl
      .formatMessage({
        id: `enum.airway-management.${procedure.airwayManagement}`,
      })
      .toLowerCase();
    return (
      procedure.caseNumber.toLowerCase().includes(query) ||
      procedure.department.toLowerCase().includes(query) ||
      department.includes(query) ||
      airway.includes(query)
    );
  };

  const filteredProcedures = isSearching
    ? procedures.filter(matchesQuery)
    : viewMode === 'calendar'
      ? procedures.filter(
          ({ procedure }) => formatDateKey(procedure.date) === selectedDate,
        )
      : range
        ? procedures.filter(
            ({ procedure }) =>
              procedure.date >= range.start && procedure.date <= range.end,
          )
        : procedures;

  const listData: Array<ListItem> =
    !isSearching && viewMode === 'list'
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
    if (mode === 'calendar') {
      setSelectedDate(getTodayKey());
      setVisibleMonth(currentMonth());
    }
  };

  const handleShiftMonth = (delta: number) => {
    setVisibleMonth(({ year, month }) => {
      const date = new Date(year, month + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  };

  const handleToday = () => {
    setVisibleMonth(currentMonth());
    setSelectedDate(getTodayKey());
  };

  const createHref =
    viewMode === 'calendar'
      ? (`/procedure/create?date=${selectedDate}` as const)
      : ('/procedure/create' as const);

  const countLabel =
    filteredProcedures.length === 1
      ? intl.formatMessage({ id: 'home.count.one' })
      : intl.formatMessage(
          { id: 'home.count.other' },
          { count: filteredProcedures.length },
        );

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
            <PressableScale onPress={() => router.push(createHref)}>
              <View className="px-2">
                <FilePlus2 size={24} color={iconColor} />
              </View>
            </PressableScale>
          ),
          headerSearchBarOptions: {
            placeholder: intl.formatMessage({ id: 'home.search.placeholder' }),
            autoCapitalize: 'none',
            tintColor: '#34D399',
            textColor: iconColor,
            hideWhenScrolling: true,
            obscureBackground: false,
            onChangeText: (event) => setSearchQuery(event.nativeEvent.text),
            onCancelButtonPress: () => setSearchQuery(''),
          },
        }}
      />
      <FlashList
        contentInsetAdjustmentBehavior="automatic"
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
          isSearching ? (
            <View className="flex-row items-baseline justify-between px-3.5 pb-2 pt-4">
              <Text className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                {intl.formatMessage({ id: 'home.search.results' })}
              </Text>
              <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                {countLabel}
              </Text>
            </View>
          ) : (
            <ListHeader
              viewMode={viewMode}
              onViewModeChange={handleViewModeChange}
              onOpenFilters={() => router.push('/filters')}
            >
              {viewMode === 'calendar' ? (
                <View>
                  <MonthCalendar
                    year={visibleMonth.year}
                    month={visibleMonth.month}
                    selectedDate={selectedDate}
                    markers={markers}
                    onSelectDate={setSelectedDate}
                    onShiftMonth={handleShiftMonth}
                    onToday={handleToday}
                  />
                  <View className="flex-row items-baseline justify-between px-3.5 pb-1 pt-5">
                    <Text className="text-base font-semibold text-text-primary-light dark:text-text-primary-dark">
                      {intl.formatDate(fromDateKey(selectedDate), {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                    <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {countLabel}
                    </Text>
                  </View>
                </View>
              ) : (
                <View>
                  <DateRangeFilter value={dateRange} onChange={setDateRange} />
                  <View className="flex-row justify-end px-3.5 pt-3">
                    <Text className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                      {countLabel}
                    </Text>
                  </View>
                </View>
              )}
            </ListHeader>
          )
        }
        ListEmptyComponent={
          <View className="items-center gap-3 py-8">
            <Text className="text-text-secondary-light dark:text-text-secondary-dark">
              {intl.formatMessage({
                id: isSearching
                  ? 'home.search.no-results'
                  : viewMode === 'calendar'
                    ? 'home.no-procedures-day'
                    : procedures.length === 0
                      ? 'home.no-procedures'
                      : 'home.no-procedures-range',
              })}
            </Text>
            {!isSearching && viewMode === 'calendar' && (
              <PressableScale onPress={() => router.push(createHref)}>
                <View className="flex-row items-center gap-1.5 rounded-full bg-background-secondary-light px-4 py-2 dark:bg-background-secondary-dark">
                  <Plus size={16} color="#34D399" strokeWidth={2.5} />
                  <Text className="text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">
                    {intl.formatMessage({ id: 'home.add-procedure' })}
                  </Text>
                </View>
              </PressableScale>
            )}
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        keyExtractor={(item) =>
          item.type === 'section'
            ? `section-${item.sectionKey.type}${item.sectionKey.type === 'month' ? `-${item.sectionKey.date}` : ''}`
            : `procedure-${item.procedure.id}`
        }
        maintainVisibleContentPosition={{ disabled: true }}
      />
    </SafeAreaView>
  );
}
