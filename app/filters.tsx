import { Stack, useRouter } from 'expo-router';
import { ChevronLeftCircle } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FilterGrid from '~/components/home/FilterGrid';

export default function FiltersModal() {
  const intl = useIntl();
  const router = useRouter();

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-background-primary-light dark:bg-background-primary-dark">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'home.my-filters' }),
          headerLeft: () => (
            <PressableScale
              className="px-2"
              onPress={() => {
                router.back();
              }}
            >
              <ChevronLeftCircle
                size={24}
                className="color-black dark:color-white"
              />
            </PressableScale>
          ),
        }}
      />
      <View className="flex-1 px-4 pt-4">
        <FilterGrid />
      </View>
    </SafeAreaView>
  );
}
