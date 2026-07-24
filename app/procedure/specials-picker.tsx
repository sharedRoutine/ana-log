import { Stack, useRouter } from 'expo-router';
import { Check, ChevronLeftCircle } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useIntl } from 'react-intl';
import { ScrollView, Text, View } from 'react-native';
import { ACCENT, contrastText, FormSection } from '~/components/ui/Form';
import { useSpecialsPicker } from '~/contexts/SpecialsPickerContext';
import { cn } from '~/lib/cn';
import { SPECIALS_OPTIONS } from '~/lib/options';

export default function SpecialsPicker() {
  const intl = useIntl();
  const router = useRouter();

  const { selection, setSelection, onSelectionComplete } = useSpecialsPicker();

  const SORTED_OPTIONS = SPECIALS_OPTIONS.map((option) => ({
    value: option,
    label: intl.formatMessage({ id: `enum.specials.${option}` }),
  })).sort((a, b) => a.label.localeCompare(b.label));

  const toggleSelection = (value: (typeof SPECIALS_OPTIONS)[number]) => {
    if (selection.includes(value)) {
      setSelection(selection.filter((v) => v !== value));
    } else {
      setSelection([...selection, value]);
    }
  };

  const handleBack = () => {
    onSelectionComplete?.(selection);
    router.back();
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'procedure.form.section.specials' }),
          headerLeft: () => (
            <PressableScale className="px-2" onPress={handleBack}>
              <ChevronLeftCircle
                size={24}
                className="color-black dark:color-white"
              />
            </PressableScale>
          ),
        }}
      />
      <ScrollView
        className="flex-1 bg-background-primary-light px-4 dark:bg-background-primary-dark"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <FormSection>
          {SORTED_OPTIONS.map((item) => {
            const isSelected = selection.includes(item.value);

            return (
              <PressableScale
                key={item.value}
                onPress={() => toggleSelection(item.value)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isSelected }}
              >
                <View className="min-h-[52px] flex-row items-center justify-between gap-3 px-4 py-3">
                  <Text
                    className={cn(
                      'flex-1 text-base text-text-primary-light dark:text-text-primary-dark',
                      isSelected && 'font-semibold',
                    )}
                  >
                    {item.label}
                  </Text>
                  <View
                    className={cn(
                      'h-6 w-6 items-center justify-center rounded-full',
                      !isSelected &&
                        'border border-black/15 dark:border-white/20',
                    )}
                    style={isSelected && { backgroundColor: ACCENT }}
                  >
                    {isSelected && (
                      <Check
                        size={14}
                        color={contrastText(ACCENT)}
                        strokeWidth={3}
                      />
                    )}
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </FormSection>
      </ScrollView>
    </>
  );
}
