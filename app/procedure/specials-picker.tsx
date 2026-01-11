import { Stack, useRouter } from 'expo-router';
import { View } from 'react-native';
import { Form, Host, Section, Switch } from '@expo/ui/swift-ui';
import { scrollContentBackground, tint } from '@expo/ui/swift-ui/modifiers';
import { useIntl } from 'react-intl';
import { useColorScheme } from 'nativewind';
import { ChevronLeftCircle } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useSpecialsPicker } from '~/contexts/SpecialsPickerContext';
import { SPECIALS_OPTIONS } from '~/lib/options';

export default function SpecialsPicker() {
  const intl = useIntl();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isLight = colorScheme === 'light';

  const { selection, setSelection, onSelectionComplete } = useSpecialsPicker();

  const SORTED_OPTIONS = SPECIALS_OPTIONS.map((option) => ({
    value: option,
    label: intl.formatMessage({ id: `enum.specials.${option}` }),
  })).sort((a, b) => a.label.localeCompare(b.label));

  const toggleSelection = (value: (typeof SPECIALS_OPTIONS)[number], checked: boolean) => {
    if (checked) {
      setSelection([...selection, value]);
    } else {
      setSelection(selection.filter((v) => v !== value));
    }
  };

  const handleBack = () => {
    onSelectionComplete?.(selection);
    router.back();
  };

  return (
    <View className="flex-1" style={{ backgroundColor: isLight ? '#F2F2F7' : '#000000' }}>
      <Stack.Screen
        options={{
          title: intl.formatMessage({ id: 'procedure.form.section.specials' }),
          headerLeft: () => (
            <PressableScale style={{ paddingHorizontal: 8 }} onPress={handleBack}>
              <ChevronLeftCircle size={24} color={isLight ? '#000' : '#fff'} />
            </PressableScale>
          ),
        }}
      />
      <Host style={{ flex: 1 }}>
        <Form modifiers={[scrollContentBackground('visible'), tint('#3B82F6')]}>
          <Section>
            {SORTED_OPTIONS.map((item) => {
              const isSelected = selection.includes(item.value);

              return (
                <Switch
                  key={item.value}
                  label={item.label}
                  value={isSelected}
                  onValueChange={(checked) => toggleSelection(item.value, checked)}
                />
              );
            })}
          </Section>
        </Form>
      </Host>
    </View>
  );
}
