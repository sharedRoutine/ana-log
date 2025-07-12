import { Stack } from 'expo-router';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useForm } from '@tanstack/react-form';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useIntl } from 'react-intl';
import { DateTime } from 'effect';
import { cssInterop } from 'nativewind';
import { Picker } from '@expo/ui/swift-ui';

cssInterop(DateTimePicker, {
  className: 'style',
});

cssInterop(Picker, {
  className: 'style',
});

export default function AddItem() {
  const intl = useIntl();

  const form = useForm({
    defaultValues: {
      caseNumber: '',
      patientBirthDate: DateTime.unsafeNow(),
      operationDate: DateTime.unsafeNow(),
      asaScore: 1,
      airwayManagement: null,
      department: null,
      departmentOther: '',
      specialFeatures: false,
      specialFeaturesText: '',
      regionalAnesthesia: false,
      regionalAnesthesiaText: '',
      outpatient: false,
      procedure: '',
    },
    onSubmit: async ({ value }) => {
      // TODO: Handle form submission
      console.log('Form submitted:', value);
    },
  });

  const calculateAge = (birthDate: DateTime.Utc): { years: number; months: number } => {
    const today = DateTime.unsafeNow();
    const duration = DateTime.distance(birthDate, today);
    const totalMonths = Math.floor(duration / (1000 * 60 * 60 * 24 * 30.44)); // Average month length
    const years = Math.floor(totalMonths / 12);
    const months = totalMonths % 12;
    return { years, months };
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
                        {(() => {
                          const age = calculateAge(state.value);
                          return intl.formatMessage(
                            { id: 'add-item.age' },
                            { years: age.years, months: age.months }
                          );
                        })()}
                      </Text>
                    )}
                  </View>
                </>
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
          </View>

          {/* Details Section */}
          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-gray-600">
              {intl.formatMessage({ id: 'add-item.details' })}
            </Text>

            {/* ASA Score */}
            <form.Field name="asaScore">
              {({ state, handleChange }) => (
                <View className="mb-4">
                  <Text className="mb-2 text-lg font-medium">
                    {intl.formatMessage({ id: 'add-item.asa-score' })}
                  </Text>
                  <Picker
                    options={['1', '2', '3', '4', '5', '6']}
                    selectedIndex={state.value ? state.value - 1 : -1}
                    onOptionSelected={({ nativeEvent: { index } }) => {
                      handleChange(index + 1);
                    }}
                    variant="segmented"
                    style={{
                      height: 40,
                    }}
                  />
                </View>
              )}
            </form.Field>

            {/* Airway Management */}
            <form.Field name="airwayManagement">
              {({ state, handleChange }) => {
                const options = [
                  '',
                  intl.formatMessage({ id: 'add-item.atemwegssicherung.tubus' }),
                  intl.formatMessage({ id: 'add-item.atemwegssicherung.lama' }),
                  intl.formatMessage({ id: 'add-item.atemwegssicherung.trachealkanüle' }),
                  intl.formatMessage({ id: 'add-item.atemwegssicherung.maske' }),
                  intl.formatMessage({ id: 'add-item.atemwegssicherung.spontan' }),
                  intl.formatMessage({ id: 'add-item.atemwegssicherung.koniotomie' }),
                ];
                const values = [
                  null,
                  'tubus',
                  'lama',
                  'trachealkanüle',
                  'maske',
                  'spontan',
                  'koniotomie',
                ];
                const selectedIndex = values.indexOf(state.value as string | null);

                return (
                  <View className="mb-4">
                    <Text className="mb-2 text-lg font-medium">
                      {intl.formatMessage({ id: 'add-item.atemwegssicherung' })}
                    </Text>
                    <Picker
                      options={options}
                      selectedIndex={selectedIndex}
                      onOptionSelected={({ nativeEvent: { index } }) => {
                        handleChange(values[index]);
                      }}
                      variant="wheel"
                      style={{
                        height: 200,
                      }}
                    />
                  </View>
                );
              }}
            </form.Field>

            {/* Department */}
            <form.Field name="department">
              {({ state, handleChange }) => {
                const options = [
                  '',
                  'TC',
                  'NC',
                  'AC',
                  'GC',
                  'HNO',
                  'HG',
                  'DE',
                  'PC',
                  'UC',
                  'URO',
                  'GYN',
                  'MKG',
                  'RAD',
                  'NRAD',
                  intl.formatMessage({ id: 'add-item.fachrichtung.other' }),
                ];
                const values = [
                  null,
                  'TC',
                  'NC',
                  'AC',
                  'GC',
                  'HNO',
                  'HG',
                  'DE',
                  'PC',
                  'UC',
                  'URO',
                  'GYN',
                  'MKG',
                  'RAD',
                  'NRAD',
                  'other',
                ];
                const selectedIndex = values.indexOf(state.value as string | null);

                return (
                  <View className="mb-4 w-full">
                    <Text className="mb-2 text-lg font-medium">
                      {intl.formatMessage({ id: 'add-item.fachrichtung' })}
                    </Text>
                    <Picker
                      options={options}
                      selectedIndex={selectedIndex}
                      onOptionSelected={({ nativeEvent: { index } }) => {
                        handleChange(values[index]);
                      }}
                      variant="wheel"
                      style={{
                        height: 200,
                      }}
                    />
                  </View>
                );
              }}
            </form.Field>

            {/* Department Other */}
            <form.Field name="departmentOther">
              {({ state, handleChange }) => (
                <>
                  {form.getFieldValue('department' as any) === 'other' && (
                    <View className="mb-4">
                      <TextInput
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base"
                        placeholder={intl.formatMessage({
                          id: 'add-item.fachrichtung.other.placeholder',
                        })}
                        value={state.value}
                        onChangeText={handleChange}
                      />
                    </View>
                  )}
                </>
              )}
            </form.Field>

            {/* Special Features */}
            <form.Field name="specialFeatures">
              {({ state, handleChange }) => (
                <View className="mb-4">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-lg font-medium">
                      {intl.formatMessage({ id: 'add-item.besonderheiten' })}
                    </Text>
                    <Switch value={state.value} onValueChange={handleChange} />
                  </View>
                </View>
              )}
            </form.Field>

            {/* Special Features Text */}
            <form.Field name="specialFeaturesText">
              {({ state, handleChange }) => (
                <>
                  {form.getFieldValue('specialFeatures' as any) && (
                    <View className="mb-4">
                      <TextInput
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base"
                        placeholder={intl.formatMessage({
                          id: 'add-item.besonderheiten.placeholder',
                        })}
                        value={state.value}
                        onChangeText={handleChange}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  )}
                </>
              )}
            </form.Field>

            {/* Regional Anesthesia */}
            <form.Field name="regionalAnesthesia">
              {({ state, handleChange }) => (
                <View className="mb-4">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-lg font-medium">
                      {intl.formatMessage({ id: 'add-item.regionalanästhesie' })}
                    </Text>
                    <Switch value={state.value} onValueChange={handleChange} />
                  </View>
                </View>
              )}
            </form.Field>

            {/* Regional Anesthesia Text */}
            <form.Field name="regionalAnesthesiaText">
              {({ state, handleChange }) => (
                <>
                  {form.getFieldValue('regionalAnesthesia' as any) && (
                    <View className="mb-4">
                      <TextInput
                        className="rounded-lg border border-gray-300 px-3 py-2 text-base"
                        placeholder={intl.formatMessage({
                          id: 'add-item.regionalanästhesie.placeholder',
                        })}
                        value={state.value}
                        onChangeText={handleChange}
                        multiline
                        numberOfLines={3}
                      />
                    </View>
                  )}
                </>
              )}
            </form.Field>

            {/* Outpatient */}
            <form.Field name="outpatient">
              {({ state, handleChange }) => (
                <View className="mb-4">
                  <View className="flex flex-row items-center justify-between">
                    <Text className="text-lg font-medium">
                      {intl.formatMessage({ id: 'add-item.ambulant' })}
                    </Text>
                    <Switch value={state.value} onValueChange={handleChange} />
                  </View>
                </View>
              )}
            </form.Field>

            {/* Procedure */}
            <form.Field name="procedure">
              {({ state, handleChange }) => (
                <View className="mb-4">
                  <Text className="mb-2 text-lg font-medium">
                    {intl.formatMessage({ id: 'add-item.eingriff' })}
                  </Text>
                  <TextInput
                    className="rounded-lg border border-gray-300 px-3 py-2 text-base"
                    placeholder={intl.formatMessage({ id: 'add-item.eingriff.placeholder' })}
                    value={state.value}
                    onChangeText={handleChange}
                    multiline
                    numberOfLines={4}
                  />
                </View>
              )}
            </form.Field>
          </View>

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
