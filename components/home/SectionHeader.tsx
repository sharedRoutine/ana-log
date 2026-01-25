import { useIntl } from 'react-intl';
import { View, Text } from 'react-native';
import { SectionKey } from '~/lib/sections';

interface SectionHeaderProps {
  sectionKey: SectionKey;
}

export function SectionHeader({ sectionKey }: SectionHeaderProps) {
  const intl = useIntl();

  const title =
    sectionKey.type === 'month'
      ? intl.formatDate(sectionKey.date, { month: 'long', year: 'numeric' })
      : intl.formatMessage({ id: `sections.${sectionKey.type}` });

  return (
    <View className="bg-background-primary-light pb-2 pt-6 dark:bg-background-primary-dark">
      <Text className="text-xs font-medium uppercase tracking-wide text-text-secondary-light dark:text-text-secondary-dark">
        {title}
      </Text>
    </View>
  );
}
