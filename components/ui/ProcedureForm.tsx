import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, useStore } from '@tanstack/react-form';
import { DateTime } from 'effect';
import { useRouter } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { Alert, Keyboard, Text, View } from 'react-native';
import { useSpecialsPicker } from '~/contexts/SpecialsPickerContext';
import { medicalCaseTable, procedureTable } from '~/db/schema';
import { useColors } from '~/hooks/useColors';
import {
  AIRWAY_OPTIONS,
  DEPARTMENT_OPTIONS,
  SPECIALS_OPTIONS,
} from '~/lib/options';
import { AgePicker } from './AgePicker';
import {
  FormButtonRow,
  FormChipSelect,
  FormRow,
  FormScrollView,
  FormSection,
  FormSwitchRow,
  FormTextField,
} from './Form';

type Item = {
  caseNumber: string;
  patientAgeYears: number;
  patientAgeMonths: number;
  operationDate: DateTime.Utc;
  asaScore: 1 | 2 | 3 | 4 | 5 | 6;
  airwayManagement: (typeof AIRWAY_OPTIONS)[number];
  department: (typeof DEPARTMENT_OPTIONS)[number];
  departmentOther: string;
  specials: Array<(typeof SPECIALS_OPTIONS)[number]>;
  legacySpecials: string;
  localAnesthetics: boolean;
  localAnestheticsText: string;
  emergency: boolean;
  favorite: boolean;
  procedure: string;
};

const validateFormInternally = (value: Item) => {
  if (!value.caseNumber) {
    return 'No case number';
  }
  if (!value.airwayManagement) {
    return 'No airway management';
  }
  if (!value.department) {
    return 'No department';
  }
};

type ProcedureFormValues = {
  procedure: typeof procedureTable.$inferInsert;
  medicalCase: typeof medicalCaseTable.$inferInsert;
  specials: Array<(typeof SPECIALS_OPTIONS)[number]>;
};

type ProcedureFormProps = {
  procedure: Item;
  validateForm?: (value: Item) => string | undefined;
  onSubmit: (values: ProcedureFormValues) => Promise<void>;
  isEditing?: boolean;
  onDelete?: () => Promise<void>;
  children?: ({
    canSubmit,
    dismiss,
    save,
    tintColor,
  }: {
    canSubmit: boolean;
    dismiss: () => void;
    save: () => void;
    tintColor: string;
  }) => React.ReactNode;
};

export default function ProcedureForm({
  procedure,
  validateForm,
  onSubmit,
  isEditing,
  onDelete,
  children,
}: ProcedureFormProps) {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const { setSelection, setOnSelectionComplete } = useSpecialsPicker();

  const form = useForm({
    defaultValues: procedure,
    validators: {
      onBlur: ({ value }) =>
        validateForm ? validateForm(value) : validateFormInternally(value),
      onMount: ({ value }) =>
        validateForm ? validateForm(value) : validateFormInternally(value),
      onChange: ({ value }) =>
        validateForm ? validateForm(value) : validateFormInternally(value),
    },
    onSubmit: async ({ value }) => {
      Keyboard.dismiss();

      const itemValues = {
        caseNumber: value.caseNumber,
        ageYears: value.patientAgeYears,
        ageMonths: value.patientAgeMonths,
        date: value.operationDate.epochMillis,
        asaScore: value.asaScore,
        airwayManagement: value.airwayManagement,
        department: value.department,
        departmentOther:
          value.department === 'other' ? value.departmentOther : null,
        localAnesthetics: value.localAnesthetics,
        localAnestheticsText: value.localAnesthetics
          ? value.localAnestheticsText
          : null,
        emergency: value.emergency,
        description: value.procedure,
      };

      const medicalCaseValues = {
        caseNumber: value.caseNumber,
        favorite: value.favorite,
      };

      await onSubmit({
        procedure: itemValues,
        medicalCase: medicalCaseValues,
        specials: [...value.specials],
      });

      form.reset();
    },
  });

  const { getDepartmentHexColor } = useColors();

  const departmentValue = useStore(
    form.store,
    (state) => state.values.department,
  );
  const tintColor = getDepartmentHexColor(departmentValue);

  const localAnestheticsValue = useStore(
    form.store,
    (state) => state.values.localAnesthetics,
  );
  const legacySpecialsValue = useStore(
    form.store,
    (state) => state.values.legacySpecials,
  );

  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);

  const SORTED_AIRWAY_OPTIONS = AIRWAY_OPTIONS.map((option) => ({
    value: option,
    label: intl.formatMessage({ id: `enum.airway-management.${option}` }),
  })).sort((a, b) => a.label.localeCompare(b.label));

  const SORTED_DEPARTMENT_OPTIONS = DEPARTMENT_OPTIONS.map((option) => ({
    value: option,
    label: intl.formatMessage({ id: `enum.department.${option}` }),
    color: getDepartmentHexColor(option),
  })).sort((a, b) => a.label.localeCompare(b.label));

  const getSpecialsLabel = (value: (typeof SPECIALS_OPTIONS)[number]) =>
    intl.formatMessage({ id: `enum.specials.${value}` });

  const openSpecialsPicker = (
    currentSelection: Array<(typeof SPECIALS_OPTIONS)[number]>,
    onComplete: (selection: Array<(typeof SPECIALS_OPTIONS)[number]>) => void,
  ) => {
    setSelection(currentSelection);
    setOnSelectionComplete(onComplete);
    router.push('/procedure/specials-picker');
  };

  const dismiss = () => Keyboard.dismiss();
  const save = () => form.handleSubmit();

  const handleDelete = () => {
    Alert.alert(
      intl.formatMessage({ id: 'edit-item.delete.confirm.title' }),
      intl.formatMessage({ id: 'edit-item.delete.confirm.message' }),
      [
        {
          text: intl.formatMessage({ id: 'edit-item.delete.confirm.cancel' }),
          style: 'cancel',
        },
        {
          text: intl.formatMessage({ id: 'edit-item.delete.confirm.delete' }),
          style: 'destructive',
          onPress: () => onDelete?.(),
        },
      ],
    );
  };

  return (
    <>
      {children
        ? children({
            canSubmit: canSubmit && !isSubmitting,
            dismiss,
            save,
            tintColor,
          })
        : null}
      <FormScrollView>
        <FormSection
          title={intl.formatMessage({ id: 'procedure.form.section.case-info' })}
        >
          <form.Field name="caseNumber">
            {({ state, handleChange }) => (
              <FormTextField
                autoCorrect={false}
                onChangeText={(text) => handleChange(text)}
                defaultValue={state.value}
                placeholder={intl.formatMessage({
                  id: 'procedure.form.case-number',
                })}
                keyboardType="numeric"
              />
            )}
          </form.Field>
          <form.Field name="favorite">
            {({ state, handleChange }) => (
              <FormSwitchRow
                label={intl.formatMessage({ id: 'procedure.form.favorite' })}
                value={state.value}
                onValueChange={handleChange}
                tint={tintColor}
              />
            )}
          </form.Field>
        </FormSection>
        <FormSection
          title={intl.formatMessage({
            id: 'procedure.form.section.department',
          })}
        >
          <form.Field name="department">
            {({ state, handleChange }) => (
              <FormRow stacked>
                <FormChipSelect
                  options={SORTED_DEPARTMENT_OPTIONS}
                  value={state.value}
                  onChange={(department) => handleChange(department)}
                />
              </FormRow>
            )}
          </form.Field>
          {departmentValue === 'other' && (
            <form.Field name="departmentOther">
              {({ state, handleChange }) => (
                <FormTextField
                  placeholder={intl.formatMessage({
                    id: 'procedure.form.department.other.placeholder',
                  })}
                  defaultValue={state.value}
                  onChangeText={handleChange}
                  autoCorrect={false}
                />
              )}
            </form.Field>
          )}
        </FormSection>
        <FormSection
          title={intl.formatMessage({
            id: 'procedure.form.section.patient-info',
          })}
        >
          <form.Field name="patientAgeYears">
            {({ state: yearsState, handleChange: handleYearsChange }) => (
              <form.Field name="patientAgeMonths">
                {({ state: monthsState, handleChange: handleMonthsChange }) => (
                  <AgePicker
                    years={yearsState.value}
                    months={monthsState.value}
                    onYearsChange={handleYearsChange}
                    onMonthsChange={handleMonthsChange}
                    maxYears={99}
                    maxMonths={11}
                  />
                )}
              </form.Field>
            )}
          </form.Field>
        </FormSection>
        <FormSection
          title={intl.formatMessage({
            id: 'procedure.form.section.operation-info',
          })}
        >
          <form.Field name="operationDate">
            {({ state, handleChange }) => (
              <FormRow
                label={intl.formatMessage({
                  id: 'procedure.form.operation-date',
                })}
              >
                <DateTimePicker
                  value={DateTime.toDate(state.value)}
                  mode="date"
                  display="compact"
                  themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
                  accentColor={tintColor}
                  onChange={(_, date) => {
                    if (date) handleChange(DateTime.unsafeMake(date));
                  }}
                />
              </FormRow>
            )}
          </form.Field>
          <form.Field name="asaScore">
            {({ state, handleChange }) => (
              <FormRow
                stacked
                label={intl.formatMessage({ id: 'procedure.form.asa-score' })}
              >
                <FormChipSelect
                  options={[1, 2, 3, 4, 5, 6].map((score) => ({
                    label: `${score}`,
                    value: score as 1 | 2 | 3 | 4 | 5 | 6,
                  }))}
                  value={state.value}
                  onChange={(score) => handleChange(score)}
                  tint={tintColor}
                />
              </FormRow>
            )}
          </form.Field>
          <form.Field name="airwayManagement">
            {({ state, handleChange }) => (
              <FormRow
                stacked
                label={intl.formatMessage({
                  id: 'procedure.form.airway-management',
                })}
              >
                <FormChipSelect
                  options={SORTED_AIRWAY_OPTIONS}
                  value={state.value}
                  onChange={(airway) => handleChange(airway)}
                  tint={tintColor}
                />
              </FormRow>
            )}
          </form.Field>
          <form.Field name="localAnesthetics">
            {({ state, handleChange }) => (
              <FormSwitchRow
                label={intl.formatMessage({
                  id: 'procedure.form.local-anesthetics',
                })}
                value={state.value}
                onValueChange={handleChange}
                tint={tintColor}
              />
            )}
          </form.Field>
          {localAnestheticsValue && (
            <form.Field name="localAnestheticsText">
              {({ state, handleChange }) => (
                <FormTextField
                  placeholder={intl.formatMessage({
                    id: 'procedure.form.local-anesthetics.placeholder',
                  })}
                  defaultValue={state.value}
                  onChangeText={handleChange}
                  multiline
                  autoCorrect={false}
                />
              )}
            </form.Field>
          )}
          <form.Field name="emergency">
            {({ state, handleChange }) => (
              <FormSwitchRow
                label={intl.formatMessage({ id: 'procedure.form.emergency' })}
                value={state.value}
                onValueChange={handleChange}
                tint={tintColor}
              />
            )}
          </form.Field>
        </FormSection>
        <FormSection
          title={intl.formatMessage({ id: 'procedure.form.section.specials' })}
        >
          <form.Field name="specials">
            {({ state, handleChange }) => {
              const selectedLabels = state.value
                .map((v) => getSpecialsLabel(v))
                .sort((a, b) => a.localeCompare(b))
                .join(', ');

              return (
                <PressableScale
                  onPress={() =>
                    openSpecialsPicker([...state.value], handleChange)
                  }
                  accessibilityRole="button"
                >
                  <View className="min-h-[52px] flex-row items-center justify-between gap-3 px-4 py-3">
                    <Text
                      className="flex-1 text-base text-text-primary-light dark:text-text-primary-dark"
                      numberOfLines={3}
                    >
                      {state.value.length > 0
                        ? selectedLabels
                        : intl.formatMessage({ id: 'create-filter.select' })}
                    </Text>
                    <ChevronRight
                      size={18}
                      color={colorScheme === 'dark' ? '#94A3B8' : '#64748B'}
                    />
                  </View>
                </PressableScale>
              );
            }}
          </form.Field>
          {legacySpecialsValue ? (
            <View className="px-4 py-3">
              <Text className="text-base text-text-secondary-light dark:text-text-secondary-dark">
                {legacySpecialsValue}
              </Text>
            </View>
          ) : null}
        </FormSection>
        <FormSection
          title={intl.formatMessage({ id: 'procedure.form.procedure' })}
        >
          <form.Field name="procedure">
            {({ state, handleChange }) => (
              <FormTextField
                placeholder={intl.formatMessage({
                  id: 'procedure.form.procedure.placeholder',
                })}
                defaultValue={state.value}
                onChangeText={handleChange}
                multiline
                autoCorrect={false}
              />
            )}
          </form.Field>
        </FormSection>
        {isEditing && (
          <FormSection>
            <FormButtonRow
              label={intl.formatMessage({ id: 'edit-item.delete' })}
              destructive
              onPress={handleDelete}
            />
          </FormSection>
        )}
      </FormScrollView>
    </>
  );
}
