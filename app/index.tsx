import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { View, TouchableOpacity, Text, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIntl } from 'react-intl';
import { useState, useCallback } from 'react';
import { medicalProceduresOps, filtersOps } from '../db/operations';
import type { MedicalProcedure, Filter, FilterCondition } from '../db/schema';

export default function Home() {
  const router = useRouter();
  const intl = useIntl();
  const [procedures, setProcedures] = useState<MedicalProcedure[]>([]);
  const [allProcedures, setAllProcedures] = useState<MedicalProcedure[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [selectedFilterId, setSelectedFilterId] = useState<number | null>(null);
  const [filterCounts, setFilterCounts] = useState<Record<number, number>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadProcedures = useCallback(async () => {
    try {
      const allProcs = await medicalProceduresOps.getAll();
      setAllProcedures(allProcs);
      
      // If no filter is selected, show all procedures
      if (selectedFilterId === null) {
        setProcedures(allProcs);
      } else {
        // Apply the selected filter
        const filter = filters.find(f => f.id === selectedFilterId);
        if (filter) {
          const conditions: FilterCondition[] = JSON.parse(filter.conditions);
          const filteredProcs = await medicalProceduresOps.getByFilter(conditions);
          setProcedures(filteredProcs);
        }
      }
    } catch (error) {
      console.error('Failed to load procedures:', error);
    }
  }, [selectedFilterId, filters]);

  const loadFilters = useCallback(async () => {
    try {
      const allFilters = await filtersOps.getAll();
      setFilters(allFilters);
      
      // Calculate counts for each filter
      const counts: Record<number, number> = {};
      for (const filter of allFilters) {
        counts[filter.id] = await filtersOps.getFilterCount(filter.id);
      }
      setFilterCounts(counts);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([loadProcedures(), loadFilters()]);
    setIsRefreshing(false);
  }, [loadProcedures, loadFilters]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadFilters().then(() => loadProcedures());
    }, [loadFilters, loadProcedures])
  );

  const selectFilter = useCallback(async (filterId: number | null) => {
    setSelectedFilterId(filterId);
    
    if (filterId === null) {
      setProcedures(allProcedures);
    } else {
      const filter = filters.find(f => f.id === filterId);
      if (filter) {
        try {
          const conditions: FilterCondition[] = JSON.parse(filter.conditions);
          const filteredProcs = await medicalProceduresOps.getByFilter(conditions);
          setProcedures(filteredProcs);
        } catch (error) {
          console.error('Failed to apply filter:', error);
          setProcedures(allProcedures);
        }
      }
    }
  }, [allProcedures, filters]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE');
  };

  const renderProcedureItem = ({ item }: { item: MedicalProcedure }) => (
    <View className="bg-white dark:bg-gray-800 p-4 mb-3 rounded-lg border border-gray-200 dark:border-gray-600">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-lg font-semibold text-gray-900 dark:text-white">
          {item.caseNumber}
        </Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">
          {formatDate(item.operationDate)}
        </Text>
      </View>
      
      <View className="mb-2">
        <Text className="text-sm text-gray-600 dark:text-gray-300">
          <Text className="font-medium">{intl.formatMessage({ id: 'home.department' })}</Text> {item.department}
          {item.departmentOther && ` (${item.departmentOther})`}
        </Text>
        <Text className="text-sm text-gray-600 dark:text-gray-300">
          <Text className="font-medium">{intl.formatMessage({ id: 'home.asa' })}</Text> {item.asaScore} | 
          <Text className="font-medium"> {intl.formatMessage({ id: 'home.airway' })}</Text> {item.airwayManagement}
        </Text>
      </View>
      
      <Text className="text-sm text-gray-700 dark:text-gray-200" numberOfLines={2}>
        {item.procedure}
      </Text>
      
      <View className="flex-row mt-2 space-x-2">
        {item.hasSpecialFeatures && (
          <View className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
            <Text className="text-xs text-blue-800 dark:text-blue-200">{intl.formatMessage({ id: 'home.special-features' })}</Text>
          </View>
        )}
        {item.hasRegionalAnesthesia && (
          <View className="bg-green-100 dark:bg-green-900 px-2 py-1 rounded">
            <Text className="text-xs text-green-800 dark:text-green-200">{intl.formatMessage({ id: 'home.regional-anesthesia' })}</Text>
          </View>
        )}
        {item.isOutpatient && (
          <View className="bg-orange-100 dark:bg-orange-900 px-2 py-1 rounded">
            <Text className="text-xs text-orange-800 dark:text-orange-200">{intl.formatMessage({ id: 'home.outpatient' })}</Text>
          </View>
        )}
      </View>
    </View>
  );

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
      <View className="flex-1 bg-gray-50 dark:bg-gray-900">
        {/* Filter section */}
        {filters.length > 0 && (
          <View className="px-4 pt-4">
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row space-x-2">
                {/* Show All filter */}
                <TouchableOpacity
                  onPress={() => selectFilter(null)}
                  className={`px-4 py-2 rounded-full border ${
                    selectedFilterId === null
                      ? 'bg-blue-500 border-blue-500'
                      : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <Text className={`font-medium ${
                    selectedFilterId === null
                      ? 'text-white'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {intl.formatMessage({ id: 'home.all' })} ({allProcedures.length})
                  </Text>
                </TouchableOpacity>
                
                {/* Individual filters */}
                {filters.map((filter) => (
                  <TouchableOpacity
                    key={filter.id}
                    onPress={() => selectFilter(filter.id)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedFilterId === filter.id
                        ? 'bg-blue-500 border-blue-500'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <Text className={`font-medium ${
                      selectedFilterId === filter.id
                        ? 'text-white'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {filter.name} ({filterCounts[filter.id] || 0})
                    </Text>
                  </TouchableOpacity>
                ))}
                
                {/* Add filter button */}
                <TouchableOpacity
                  onPress={() => router.push('/create-filter')}
                  className="px-4 py-2 rounded-full border border-dashed border-gray-400 dark:border-gray-500"
                >
                  <Text className="font-medium text-gray-500 dark:text-gray-400">
                    + {intl.formatMessage({ id: 'home.filter' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        )}
        
        {/* Add filter button when no filters exist */}
        {filters.length === 0 && (
          <View className="px-4 pt-4">
            <TouchableOpacity
              onPress={() => router.push('/create-filter')}
              className="bg-blue-100 dark:bg-blue-900 border border-blue-300 dark:border-blue-700 p-3 rounded-lg mb-4"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="add" size={20} color="#3B82F6" />
                <Text className="text-blue-600 dark:text-blue-300 font-medium ml-2">
                  {intl.formatMessage({ id: 'home.create-first-filter' })}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Procedures list */}
        <View className="px-4">
          <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
            {intl.formatMessage({ id: 'home.my-items' })} ({procedures.length})
          </Text>
        </View>
        
        {procedures.length === 0 ? (
          <View className="flex-1 justify-center items-center px-4">
            <Ionicons name="document-outline" size={64} color="#9CA3AF" />
            <Text className="text-lg text-gray-500 dark:text-gray-400 mt-4 text-center">
              {intl.formatMessage({ id: 'home.no-procedures' })}
            </Text>
            <Text className="text-sm text-gray-400 dark:text-gray-500 mt-2 text-center">
              {intl.formatMessage({ id: 'home.add-first-procedure' })}
            </Text>
          </View>
        ) : (
          <FlatList
            data={procedures}
            renderItem={renderProcedureItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </>
  );
}
