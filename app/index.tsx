import { Stack, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIntl } from 'react-intl';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { desc } from 'drizzle-orm';
import { FlashList } from '@shopify/flash-list';
import { db } from '~/db/db';
import { filterTable, itemTable } from '~/db/schema';
import { useColorScheme } from 'nativewind';
import { DEPARTMENT_OPTIONS } from '~/lib/options';

export default function Home() {
  const router = useRouter();
  const intl = useIntl();
  const { data: procedures } = useLiveQuery(db.select().from(itemTable).orderBy(desc(itemTable.date)));
  const { data: filters } = useLiveQuery(db.select().from(filterTable));

  const { colorScheme } = useColorScheme();

  const getDepartmentColor = (department: string) => {
    const colors: string[] = [
      '#EF4444', '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', 
      '#DC2626', '#6B7280', '#EC4899', '#14B8A6', '#F97316',
      '#8B5CF6', '#06B6D4', '#84CC16', '#F59E0B', '#EF4444', '#6B7280'
    ];
    const index = DEPARTMENT_OPTIONS.indexOf(department as any);
    return colors[index] || '#6B7280';
  };

  const getTranslatedAirwayManagement = (airway: string) => {
    return intl.formatMessage({ id: `enum.airway-management.${airway}` });
  };

  return (
    <View className="flex-1 bg-white dark:bg-black">
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'app.title' }),
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity onPress={() => router.push('/settings')} className="mr-3">
                <Ionicons
                  name="settings-outline"
                  size={24}
                  color={colorScheme === 'light' ? '#000' : '#fff'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/add-item')} className="mr-2">
                <Ionicons name="add" size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View className="bg-white px-4 pt-4 dark:bg-black">
        <Text className="mb-4 text-lg font-bold text-black dark:text-gray-300">
          {procedures.length === 1
            ? intl.formatMessage({ id: 'home.number-of-items-created.single' })
            : intl.formatMessage(
                { id: 'home.number-of-items-created' },
                { count: procedures.length }
              )}
        </Text>
        <Text className="mb-4 text-lg font-bold text-black dark:text-gray-300">
          {filters.length === 1
            ? intl.formatMessage({ id: 'home.number-of-items-created.single' })
            : intl.formatMessage({ id: 'home.number-of-items-created' }, { count: filters.length })}
        </Text>
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
        
        <Text className="mb-3 text-xl font-bold text-black dark:text-white">
          My Procedures
        </Text>
      </View>
      
      <View className="flex-1 px-4">
        <FlashList
          data={procedures}
          renderItem={({ item }) => (
            <View className="mb-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-xl font-bold text-black dark:text-white">
                    {item.caseNumber}
                  </Text>
                  <Text className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(item.date).toLocaleDateString()}
                  </Text>
                </View>
                <View 
                  className="px-2 py-1 rounded-full"
                  style={{ backgroundColor: getDepartmentColor(item.department) }}
                >
                  <Text className="text-xs font-medium text-white">
                    {item.department}
                  </Text>
                </View>
              </View>
              
              <Text className="mt-2 text-base text-black dark:text-white">
                {item.procedure}
              </Text>
              
              <View className="flex-row flex-wrap gap-2 mt-2">
                <View className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Text className="text-xs text-gray-700 dark:text-gray-300">
                    ASA {item.asaScore}
                  </Text>
                </View>
                <View className="px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    {item.ageYears}y {item.ageMonths}m
                  </Text>
                </View>
                <View className="px-2 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <Text className="text-xs text-green-700 dark:text-green-300">
                    {getTranslatedAirwayManagement(item.airwayManagement)}
                  </Text>
                </View>
              </View>
            </View>
          )}
          getItemType={() => 'procedure'}
          keyExtractor={(item) => item.caseNumber}
        />
      </View>
    </View>
  );
}
