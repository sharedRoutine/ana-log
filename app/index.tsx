import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIntl } from 'react-intl';

export default function Home() {
  const router = useRouter();
  const intl = useIntl();

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity onPress={() => router.push('/settings')} className="mr-3">
                <Ionicons name="settings-outline" size={24} color="#000" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/add-item')} className="mr-2">
                <Ionicons name="add" size={24} color="#000" />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View className="px-4 pt-4">
        <TouchableOpacity
          onPress={() => router.push('/create-filter')}
          className="mb-4 rounded-lg border border-blue-300 bg-blue-100 p-3 dark:border-blue-700 dark:bg-blue-900">
          <View className="flex-row items-center justify-center">
            <Ionicons name="add" size={20} color="#3B82F6" />
            <Text className="ml-2 font-medium text-blue-600 dark:text-blue-300">
              {intl.formatMessage({ id: 'home.create-first-filter' })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </>
  );
}
