import { Stack } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useForm } from '@tanstack/react-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIntl } from 'react-intl';
import { DateTime } from 'effect';
import { cssInterop } from 'nativewind';

cssInterop(DateTimePicker, {
  className: 'style',
});

interface LogEntry {
  caseNumber: string;
  operationDate: DateTime.Utc;
  patientBirthDate: DateTime.Utc | null;
}

export default function AddItem() {
  const intl = useIntl();

  const form = useForm({
    defaultValues: {
      caseNumber: '',
      operationDate: DateTime.unsafeNow(),
      patientBirthDate: DateTime.unsafeNow(),
    } satisfies LogEntry,
    onSubmit: async ({ value }) => {
      // TODO: Handle form submission
      console.log('Form submitted:', value);
    },
  });

  const calculateAge = (birthDate: DateTime.Utc): number => {
    const today = DateTime.unsafeNow();
    const duration = DateTime.distance(birthDate, today);
    return Math.floor(duration / (1000 * 60 * 60 * 24 * 365.25));
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'add-item.title' }),
          headerBackTitle: intl.formatMessage({ id: 'add-item.back' }),
        }}
      />
      <ScrollView className="flex-1 bg-white">
        <View className="p-4">
          {/* Basic Info Section */}
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-gray-600">
              {intl.formatMessage({ id: 'add-item.basic-info' })}
            </Text>

            {/* Case Number */}
            <form.Field name="caseNumber">
              {(field) => (
                <View className="mb-4">
                  <Text className="mb-2 text-lg font-medium">
                    {intl.formatMessage({ id: 'add-item.case-number' })}
                  </Text>
                  <TextInput
                    className="rounded-lg border border-gray-300 px-3 py-2 text-base"
                    placeholder={intl.formatMessage({ id: 'add-item.case-number.placeholder' })}
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                  />
                </View>
              )}
            </form.Field>

            <HorizontalLine />

            <form.Field name="operationDate">
              {({ state, handleChange }) => (
                <View className="mb-4 flex flex-row items-center justify-between">
                  <Text className="text-lg font-medium">
                    {intl.formatMessage({ id: 'add-item.operation-date' })}
                  </Text>
                  <DateTimePicker
                    value={new Date(DateTime.formatIso(state.value))}
                    mode="date"
                    display={'compact'}
                    onChange={(_, selectedDate) => {
                      if (selectedDate) {
                        handleChange(DateTime.unsafeMake(selectedDate));
                      }
                    }}
                  />
                </View>
              )}
            </form.Field>

            <HorizontalLine />

            <form.Field name="patientBirthDate">
              {({ state, handleChange }) => (
                <>
                  <View className="mb-4 flex flex-row items-center justify-between">
                    <Text className="text-lg font-medium">
                      {intl.formatMessage({ id: 'add-item.age-of-patient' })}
                    </Text>
                    <View className="flex flex-col items-end">
                      <DateTimePicker
                        value={state.value ? new Date(DateTime.formatIso(state.value)) : new Date()}
                        mode="date"
                        display={'compact'}
                        className="self-start"
                        maximumDate={new Date()}
                        onChange={(_, selectedDate) => {
                          if (selectedDate) {
                            handleChange(DateTime.unsafeMake(selectedDate));
                          }
                        }}
                      />
                    </View>
                  </View>
                  <View className="flex flex-col items-start">
                    {state.value && (
                      <Text className="text-sm text-gray-600">
                        {intl.formatMessage(
                          { id: 'add-item.age' },
                          { age: calculateAge(state.value) }
                        )}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </form.Field>
          </View>

          <HorizontalLine />

          <TouchableOpacity
            className="mt-4 rounded-lg bg-blue-500 py-3"
            onPress={() => form.handleSubmit()}
            disabled>
            <Text className="text-center font-medium text-white">
              {intl.formatMessage({ id: 'add-item.save-item' })}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const HorizontalLine = () => <View className="mb-4 border-b border-gray-100" />;
