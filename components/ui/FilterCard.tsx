import { PressableScale } from 'pressto';
import { View, Text, StyleSheet } from 'react-native';
import { useIntl } from 'react-intl';
import { useColorScheme } from 'nativewind';

interface FilterCardProps {
  filter: {
    id: number;
    name: string;
  };
  conditionText: string;
  matchingCount: number;
  onPress?: () => void;
}

export function FilterCard({ filter, conditionText, matchingCount, onPress }: FilterCardProps) {
  const intl = useIntl();
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  return (
    <PressableScale
      onPress={onPress}
      key={filter.id}
      accessibilityLabel={intl.formatMessage(
        { id: 'filter.accessibility.card' },
        { name: filter.name, count: matchingCount }
      )}
      accessibilityRole="button"
      accessibilityHint={intl.formatMessage({ id: 'filter.accessibility.hint' })}
      style={[styles.card, isLight ? styles.cardLight : styles.cardDark]}>
      <View className="flex-row items-center justify-between">
        <Text
          className="text-sm font-medium w-2/3"
          style={{ color: isLight ? '#1F2937' : '#FFFFFF' }}
          numberOfLines={2}>
          {filter.name}
        </Text>
        <Text className="text-lg font-bold text-right w-1/3" style={{ color: isLight ? '#1F2937' : '#FFFFFF' }} numberOfLines={1}>
          {matchingCount}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-1">
        <View style={[styles.tag, isLight ? styles.tagLight : styles.tagDark]}>
          <Text className="text-xs" style={{ color: isLight ? '#4B5563' : '#FFFFFF' }}>
            {conditionText}
          </Text>
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 96,
    width: '47%',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 12,
    position: 'relative',
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  tag: {
    borderRadius: 9999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagLight: {
    backgroundColor: '#E2E8F0',
  },
  tagDark: {
    backgroundColor: '#4A5568',
  },
});
