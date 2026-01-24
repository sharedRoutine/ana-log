import { CalendarDays, List } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { View, Text, useColorScheme } from 'react-native';

type ViewMode = 'list' | 'calendar';

interface ListHeaderProps {
  proceduresCount: number;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  children?: React.ReactNode;
}

export const ListHeader = ({
  proceduresCount,
  viewMode,
  onViewModeChange,
  children,
}: ListHeaderProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const iconColor = isDark ? '#FFFFFF' : '#000000';
  const activeIconColor = '#34D399';

  return (
    <View className="pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="rounded-xl bg-background-secondary-dark px-3 py-1">
          <Text className="font-semibold text-white">{proceduresCount}</Text>
        </View>
        <View className="flex-row items-center gap-2">
          <PressableScale onPress={() => onViewModeChange('list')}>
            <View
              className={`rounded-lg p-2 ${viewMode === 'list' ? 'bg-background-secondary-light dark:bg-background-secondary-dark' : ''}`}
            >
              <List
                size={20}
                color={viewMode === 'list' ? activeIconColor : iconColor}
                strokeWidth={2}
              />
            </View>
          </PressableScale>
          <PressableScale onPress={() => onViewModeChange('calendar')}>
            <View
              className={`rounded-lg p-2 ${viewMode === 'calendar' ? 'bg-background-secondary-light dark:bg-background-secondary-dark' : ''}`}
            >
              <CalendarDays
                size={20}
                color={viewMode === 'calendar' ? activeIconColor : iconColor}
                strokeWidth={2}
              />
            </View>
          </PressableScale>
        </View>
      </View>
      {children}
    </View>
  );
};
