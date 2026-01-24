import { Button, ContextMenu, Host } from '@expo/ui/swift-ui';
import { useRouter } from 'expo-router';
import { Menu } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useIntl } from 'react-intl';
import { View } from 'react-native';
import { useDataBackup } from '~/hooks/useDataBackup';

export default function SettingsMenu() {
  const intl = useIntl();
  const router = useRouter();
  const { exportDatabase, importDatabase } = useDataBackup();
  const { colorScheme } = useColorScheme();

  return (
    <View className="px-2">
      <Host matchContents>
        <ContextMenu>
          <ContextMenu.Items>
            <ContextMenu>
              <ContextMenu.Items>
                <Button
                  systemImage="square.and.arrow.up"
                  onPress={async () => {
                    await exportDatabase();
                  }}
                >
                  {intl.formatMessage({ id: 'home.export-data' })}
                </Button>
                <Button
                  systemImage="square.and.arrow.down"
                  onPress={async () => {
                    await importDatabase();
                  }}
                >
                  {intl.formatMessage({ id: 'home.import-data' })}
                </Button>
              </ContextMenu.Items>
              <ContextMenu.Trigger>
                <Button systemImage="externaldrive">
                  {intl.formatMessage({ id: 'menu.backup-restore' })}
                </Button>
              </ContextMenu.Trigger>
            </ContextMenu>
            <Button
              systemImage="line.3.horizontal.decrease.circle"
              onPress={() => router.push('/filters')}
            >
              {intl.formatMessage({ id: 'menu.filters' })}
            </Button>
          </ContextMenu.Items>
          <ContextMenu.Trigger>
            <Menu
              size={24}
              color={colorScheme === 'light' ? '#000' : '#fff'}
            />
          </ContextMenu.Trigger>
        </ContextMenu>
      </Host>
    </View>
  );
}
