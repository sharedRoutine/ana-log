import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
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
            <TouchableOpacity onPress={() => router.push('/add-item')} className="mr-2">
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 bg-white p-4">{/* Main content goes here */}</View>
    </>
  );
}
