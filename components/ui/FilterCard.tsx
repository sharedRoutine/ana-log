import { useRouter } from 'expo-router';
import { PressableScale } from 'pressto';
import { View, Text } from 'react-native';

interface FilterCardProps {
  filter: {
    id: number;
    name: string;
  };
  index: number;
  conditionText: string;
  matchingCount: number;
}

export function FilterCard({ filter, index, conditionText, matchingCount }: FilterCardProps) {
  const router = useRouter();
  return (
    <PressableScale
      onPress={() => {
        router.push(`/filter/${filter.id}`);
      }}
      key={filter.id}
      style={{
        backgroundColor: '#1C1C1E',
        borderColor: '#2C2C2E',
        borderWidth: 1,
        height: 96,
        width: '48%',
        justifyContent: 'space-between',
        borderRadius: 16,
        padding: 12,
      }}>
      <View className="flex-row items-start justify-between">
        <Text className="text-sm font-medium text-white" numberOfLines={1}>
          {filter.name}
        </Text>
        <Text className="text-lg font-bold text-white">{matchingCount}</Text>
      </View>
      <View className="flex-row flex-wrap gap-1">
        <View className="rounded-full bg-[#4A5568] px-2 py-1">
          <Text className="text-xs text-white">{conditionText}</Text>
        </View>
      </View>
    </PressableScale>
  );
}
