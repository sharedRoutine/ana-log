import DateTimePicker from '@react-native-community/datetimepicker';
import { Minus, Plus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { PressableScale } from 'pressto';
import { Children, Fragment, isValidElement, ReactNode, Ref } from 'react';
import { useIntl } from 'react-intl';
import { Switch, Text, TextInput, TextInputProps, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';
import { cn } from '~/lib/cn';

export const ACCENT = '#34D399';

export const contrastText = (hex: string) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#000000' : '#FFFFFF';
};

export function FormScrollView({ children }: { children: ReactNode }) {
  const intl = useIntl();

  return (
    <>
      <KeyboardAwareScrollView
        className="flex-1 bg-background-primary-light px-4 dark:bg-background-primary-dark"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
        bottomOffset={62}
      >
        {children}
      </KeyboardAwareScrollView>
      <KeyboardToolbar
        doneText={intl.formatMessage({ id: 'form.keyboard.done' })}
      />
    </>
  );
}

export function FormDivider() {
  return <View className="ml-4 h-px bg-black/5 dark:bg-white/10" />;
}

type FormSectionProps = {
  title?: string;
  accessory?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function FormSection({
  title,
  accessory,
  children,
  className,
}: FormSectionProps) {
  const rows = Children.toArray(children).filter((child) =>
    isValidElement(child),
  );

  return (
    <View className={cn('mb-6', className)}>
      {(title || accessory) && (
        <View className="mb-2 ml-1 flex-row items-center justify-between">
          <Text className="text-xs font-semibold uppercase tracking-widest text-text-secondary-light dark:text-text-secondary-dark">
            {title}
          </Text>
          {accessory}
        </View>
      )}
      <View className="overflow-hidden rounded-2xl border border-black/5 bg-background-secondary-light dark:border-white/5 dark:bg-background-secondary-dark">
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 && <FormDivider />}
            {row}
          </Fragment>
        ))}
      </View>
    </View>
  );
}

export function FormRow({
  label,
  children,
  stacked,
}: {
  label?: string;
  children: ReactNode;
  stacked?: boolean;
}) {
  if (stacked) {
    return (
      <View className="px-4 py-3">
        {label && (
          <Text className="mb-2 text-base text-text-primary-light dark:text-text-primary-dark">
            {label}
          </Text>
        )}
        {children}
      </View>
    );
  }
  return (
    <View className="min-h-[52px] flex-row items-center justify-between gap-3 px-4 py-2">
      {label && (
        <Text className="shrink-0 text-base text-text-primary-light dark:text-text-primary-dark">
          {label}
        </Text>
      )}
      {children}
    </View>
  );
}

type FormTextFieldProps = TextInputProps & {
  label?: string;
  ref?: Ref<TextInput>;
};

export function FormTextField({ label, ref, ...props }: FormTextFieldProps) {
  const { colorScheme } = useColorScheme();

  const input = (
    <TextInput
      ref={ref}
      placeholderTextColor={colorScheme === 'dark' ? '#64748B' : '#94A3B8'}
      className={cn(
        'py-0 text-[16px] text-text-primary-light dark:text-text-primary-dark',
        label ? 'flex-1 text-right' : 'flex-1',
        props.multiline && 'min-h-[72px] text-left leading-[22px]',
      )}
      {...props}
    />
  );

  if (props.multiline) {
    return (
      <View className="px-4 py-3">
        {label && (
          <Text className="mb-1 text-base text-text-primary-light dark:text-text-primary-dark">
            {label}
          </Text>
        )}
        {input}
      </View>
    );
  }

  return (
    <View className="min-h-[52px] flex-row items-center justify-between gap-3 px-4 py-2">
      {label && (
        <Text className="shrink-0 text-base text-text-primary-light dark:text-text-primary-dark">
          {label}
        </Text>
      )}
      {input}
    </View>
  );
}

export function FormSwitchRow({
  label,
  value,
  onValueChange,
  tint = ACCENT,
}: {
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  tint?: string;
}) {
  return (
    <View className="h-auto py-4 flex-row items-center justify-between gap-3 px-4">
      <Text className="flex-1 text-[16px] text-text-primary-light dark:text-text-primary-dark">
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: tint }}
      />
    </View>
  );
}

type Option<T> = {
  label: string;
  value: T;
  color?: string;
};

export function FormSegmented<T>({
  options,
  value,
  onChange,
  tint = ACCENT,
}: {
  options: Array<Option<T>>;
  value: T;
  onChange: (value: T) => void;
  tint?: string;
}) {
  return (
    <View className="flex-1 flex-row rounded-full bg-black/5 p-1 dark:bg-white/10">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <PressableScale
            key={String(option.value)}
            className="flex-1"
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <View
              className="items-center justify-center rounded-full py-1.5"
              style={isActive && { backgroundColor: tint }}
            >
              <Text
                className={cn(
                  'text-sm',
                  !isActive &&
                    'text-text-secondary-light dark:text-text-secondary-dark',
                )}
                style={
                  isActive && {
                    color: contrastText(tint),
                    fontWeight: '600',
                  }
                }
              >
                {option.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function FormChipSelect<T>({
  options,
  value,
  onChange,
  tint = ACCENT,
}: {
  options: Array<Option<T>>;
  value: T | undefined;
  onChange: (value: T) => void;
  tint?: string;
}) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => {
        const isActive = option.value === value;
        const activeColor = option.color ?? tint;
        return (
          <PressableScale
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            accessibilityRole="button"
            accessibilityState={{ selected: isActive }}
          >
            <View
              className={cn(
                'rounded-full px-3 py-1.5',
                !isActive && 'bg-black/5 dark:bg-white/10',
              )}
              style={isActive && { backgroundColor: activeColor }}
            >
              <Text
                className={cn(
                  'text-sm',
                  !isActive &&
                    'text-text-secondary-light dark:text-text-secondary-dark',
                )}
                style={
                  isActive && {
                    color: contrastText(activeColor),
                    fontWeight: '600',
                  }
                }
              >
                {option.label}
              </Text>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function FormStepperRow({
  label,
  value,
  onChange,
  min = 0,
  max = 1000,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}) {
  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#FFFFFF' : '#000000';

  const StepButton = ({
    icon,
    disabled,
    onPress,
  }: {
    icon: ReactNode;
    disabled: boolean;
    onPress: () => void;
  }) => (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <View
        className={cn(
          'h-8 w-8 items-center justify-center rounded-full bg-black/5 dark:bg-white/10',
          disabled && 'opacity-30',
        )}
      >
        {icon}
      </View>
    </PressableScale>
  );

  return (
    <View className="h-[52px] flex-row items-center justify-between gap-3 px-4">
      <Text className="flex-1 text-base leading-5 text-text-primary-light dark:text-text-primary-dark">
        {label}
      </Text>
      <View className="flex-row items-center gap-3">
        <StepButton
          icon={<Minus size={16} color={iconColor} />}
          disabled={value <= min}
          onPress={() => onChange(Math.max(min, value - 1))}
        />
        <Text className="min-w-[36px] text-center text-lg font-semibold tabular-nums text-text-primary-light dark:text-text-primary-dark">
          {value}
        </Text>
        <StepButton
          icon={<Plus size={16} color={iconColor} />}
          disabled={value >= max}
          onPress={() => onChange(Math.min(max, value + 1))}
        />
      </View>
    </View>
  );
}

export function FormDateRow({
  label,
  value,
  onChange,
  minimumDate,
  maximumDate,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  minimumDate?: Date;
  maximumDate?: Date;
}) {
  const { colorScheme } = useColorScheme();

  return (
    <View className="min-h-[52px] flex-row items-center justify-between gap-3 px-4 py-2">
      <Text className="shrink-0 text-base text-text-primary-light dark:text-text-primary-dark">
        {label}
      </Text>
      <DateTimePicker
        value={new Date(value)}
        mode="date"
        display="compact"
        themeVariant={colorScheme === 'dark' ? 'dark' : 'light'}
        minimumDate={minimumDate}
        maximumDate={maximumDate}
        onChange={(_, date) => {
          if (date) onChange(date.getTime());
        }}
      />
    </View>
  );
}

export function FormValueRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="min-h-[52px] flex-row items-start justify-between gap-4 px-4 py-3.5">
      <Text className="shrink-0 text-base text-text-secondary-light dark:text-text-secondary-dark">
        {label}
      </Text>
      <Text className="flex-1 text-right text-base text-text-primary-light dark:text-text-primary-dark">
        {value}
      </Text>
    </View>
  );
}

export function FormButtonRow({
  label,
  onPress,
  destructive,
  icon,
}: {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  icon?: ReactNode;
}) {
  return (
    <PressableScale onPress={onPress} accessibilityRole="button">
      <View className="min-h-[52px] flex-row items-center justify-center gap-2 px-4 py-3">
        {icon}
        <Text
          className={cn(
            'text-base font-medium',
            destructive
              ? 'text-red-500'
              : 'text-text-primary-light dark:text-text-primary-dark',
          )}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
