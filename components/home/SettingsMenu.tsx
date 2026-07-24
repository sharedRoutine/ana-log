import { Button, Host, Image, Menu } from '@expo/ui/swift-ui';
import { useColorScheme } from 'nativewind';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { useDataBackup } from '~/hooks/useDataBackup';

export default function SettingsMenu() {
  const intl = useIntl();
  const { backupToICloudNow, restoreFromICloud } = useDataBackup();
  const { colorScheme } = useColorScheme();

  return (
    <View className="px-2">
      <Host matchContents>
        <Menu
          label={
            <Image
              systemName="externaldrive.badge.icloud"
              size={22}
              color={colorScheme === 'light' ? '#000000' : '#FFFFFF'}
            />
          }
        >
          <Button
            systemImage="icloud.and.arrow.up"
            label={intl.formatMessage({ id: 'home.backup-icloud' })}
            onPress={async () => {
              await backupToICloudNow();
            }}
          />
          <Button
            systemImage="clock.arrow.circlepath"
            label={intl.formatMessage({ id: 'home.restore-icloud' })}
            onPress={async () => {
              await restoreFromICloud();
            }}
          />
        </Menu>
      </Host>
    </View>
  );
}
