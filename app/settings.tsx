import { Stack, router } from 'expo-router';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIntl } from 'react-intl';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { medicalProceduresOps } from '../db/operations';

export default function Settings() {
  const intl = useIntl();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      
      // Export data as JSON
      const jsonData = await medicalProceduresOps.exportAll();
      
      // Create file path
      const fileName = `analog-export-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Write to file
      await FileSystem.writeAsStringAsync(fileUri, jsonData);
      
      // Check if sharing is available
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: intl.formatMessage({ id: 'settings.export.dialog-title' }),
        });
      } else {
        Alert.alert(
          intl.formatMessage({ id: 'settings.export.complete' }),
          intl.formatMessage({ id: 'settings.export.complete.message' }, { fileName }),
          [{ text: intl.formatMessage({ id: 'common.ok' }) }]
        );
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert(
        intl.formatMessage({ id: 'settings.export.failed' }),
        intl.formatMessage({ id: 'settings.export.failed.message' }),
        [{ text: intl.formatMessage({ id: 'common.ok' }) }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    try {
      setIsImporting(true);
      
      // Pick a file
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      
      if (result.canceled) {
        setIsImporting(false);
        return;
      }
      
      // Read the file
      const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      
      // Confirm import
      Alert.alert(
        intl.formatMessage({ id: 'settings.import.confirm' }),
        intl.formatMessage({ id: 'settings.import.confirm.message' }),
        [
          { text: intl.formatMessage({ id: 'settings.import.cancel' }), style: 'cancel' },
          {
            text: intl.formatMessage({ id: 'settings.import.import' }),
            onPress: async () => {
              try {
                const importedCount = await medicalProceduresOps.importFromJson(fileContent);
                Alert.alert(
                  intl.formatMessage({ id: 'settings.import.successful' }),
                  intl.formatMessage({ id: 'settings.import.successful.message' }, { count: importedCount }),
                  [{ text: intl.formatMessage({ id: 'common.ok' }) }]
                );
              } catch (error) {
                console.error('Import processing failed:', error);
                Alert.alert(
                  intl.formatMessage({ id: 'settings.import.failed' }),
                  intl.formatMessage({ id: 'settings.import.failed.message' }),
                  [{ text: intl.formatMessage({ id: 'common.ok' }) }]
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert(
        intl.formatMessage({ id: 'settings.import.failed' }),
        intl.formatMessage({ id: 'settings.import.failed.generic' }),
        [{ text: intl.formatMessage({ id: 'common.ok' }) }]
      );
    } finally {
      setIsImporting(false);
    }
  };

  const SettingsItem = ({ 
    icon, 
    title, 
    description, 
    onPress, 
    isLoading = false 
  }: {
    icon: string;
    title: string;
    description: string;
    onPress: () => void;
    isLoading?: boolean;
  }) => (
    <TouchableOpacity 
      onPress={onPress}
      disabled={isLoading}
      className="bg-white dark:bg-gray-800 p-4 mb-3 rounded-lg border border-gray-200 dark:border-gray-600"
    >
      <View className="flex-row items-center">
        <View className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full items-center justify-center mr-4">
          <Ionicons name={icon as any} size={20} color="#3B82F6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-medium text-gray-900 dark:text-white">
            {title}
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {description}
          </Text>
        </View>
        {isLoading ? (
          <View className="ml-2">
            <Ionicons name="reload" size={20} color="#9CA3AF" />
          </View>
        ) : (
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'settings.title' }),
          presentation: 'modal',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-blue-500 font-medium">{intl.formatMessage({ id: 'settings.close' })}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
        <View className="p-4">
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-gray-600 dark:text-gray-300">
              {intl.formatMessage({ id: 'settings.data-management' })}
            </Text>
            
            <SettingsItem
              icon="download-outline"
              title={intl.formatMessage({ id: 'settings.export-data' })}
              description={intl.formatMessage({ id: 'settings.export-data.description' })}
              onPress={handleExportData}
              isLoading={isExporting}
            />
            
            <SettingsItem
              icon="cloud-upload-outline"
              title={intl.formatMessage({ id: 'settings.import-data' })}
              description={intl.formatMessage({ id: 'settings.import-data.description' })}
              onPress={handleImportData}
              isLoading={isImporting}
            />
          </View>

          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-gray-600 dark:text-gray-300">
              {intl.formatMessage({ id: 'settings.about' })}
            </Text>
            
            <View className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <Text className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {intl.formatMessage({ id: 'settings.app-name' })}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                {intl.formatMessage({ id: 'settings.app-description' })}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {intl.formatMessage({ id: 'settings.version' })}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}