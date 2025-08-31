import { View, Text } from 'react-native';
import { useIntl } from 'react-intl';

interface FilterCardProps {
  filter: {
    id: number;
    name: string;
  };
  index: number;
  conditionText: string;
  matchingCount: number;
}

const FILTER_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#84CC16',
];

export function FilterCard({ filter, index, conditionText, matchingCount }: FilterCardProps) {
  return (
    <View
      key={filter.id}
      className="h-24 w-[48%] justify-between rounded-xl p-3"
      style={{
        backgroundColor: FILTER_COLORS[index % 8],
      }}>
      <View className="flex-row items-start justify-between">
        <Text className="text-sm font-medium text-white" numberOfLines={1}>
          {filter.name}
        </Text>
        <Text className="text-lg font-bold text-white">
          {matchingCount}
        </Text>
      </View>
      <View className="flex-row flex-wrap gap-1">
        <View className="rounded-full bg-white/20 px-2 py-0.5">
          <Text className="text-xs text-white">{conditionText}</Text>
        </View>
      </View>
    </View>
  );
}