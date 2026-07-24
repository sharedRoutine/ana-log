import { CalendarDays, List, SlidersHorizontal } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View, Text, useColorScheme } from 'react-native';
import { cn } from '~/lib/cn';

type ViewMode = 'list' | 'calendar';

interface ListHeaderProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onOpenFilters: () => void;
  children?: React.ReactNode;
}

const ACCENT = '#34D399';

export const ListHeader = ({
  viewMode,
  onViewModeChange,
  onOpenFilters,
  children,
}: ListHeaderProps) => {
  const intl = useIntl();
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#9CA3AF' : '#374151';

  const segments: Array<{
    mode: ViewMode;
    icon: typeof List;
    labelId: string;
  }> = [
    { mode: 'calendar', icon: CalendarDays, labelId: 'home.view.calendar' },
    { mode: 'list', icon: List, labelId: 'home.view.list' },
  ];

  return (
    <View className="pt-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-row rounded-xl bg-background-secondary-light p-1 dark:bg-background-secondary-dark">
          {segments.map(({ mode, icon: Icon, labelId }) => {
            const isActive = viewMode === mode;
            return (
              <PressableScale
                key={mode}
                onPress={() => onViewModeChange(mode)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <View
                  className={cn(
                    'flex-row items-center gap-1.5 rounded-lg px-3 py-1.5',
                    isActive &&
                      'bg-background-primary-light dark:bg-background-primary-dark',
                  )}
                >
                  <Icon
                    size={16}
                    color={isActive ? ACCENT : iconColor}
                    strokeWidth={2}
                  />
                  <Text
                    className={cn(
                      'text-xs',
                      isActive
                        ? 'font-semibold text-text-primary-light dark:text-text-primary-dark'
                        : 'text-text-secondary-light dark:text-text-secondary-dark',
                    )}
                  >
                    {intl.formatMessage({ id: labelId })}
                  </Text>
                </View>
              </PressableScale>
            );
          })}
        </View>
        <PressableScale
          onPress={onOpenFilters}
          accessibilityRole="button"
          accessibilityLabel={intl.formatMessage({ id: 'home.filter' })}
        >
          <View className="flex-row items-center gap-1.5 rounded-xl bg-background-secondary-light px-4 py-2.5 dark:bg-background-secondary-dark">
            <SlidersHorizontal size={16} color={ACCENT} strokeWidth={2} />
            <Text className="text-xs font-semibold text-text-primary-light dark:text-text-primary-dark">
              {intl.formatMessage({ id: 'home.filter' })}
            </Text>
          </View>
        </PressableScale>
      </View>
      {children}
    </View>
  );
};
