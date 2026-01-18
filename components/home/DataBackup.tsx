import { Button, ContextMenu, Host } from "@expo/ui/swift-ui";
import { Settings } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useIntl } from "react-intl";
import { View } from "react-native";
import { useDataBackup } from "~/hooks/useDataBackup";

export default function DataBackup() {
    const intl = useIntl();
    const { exportDatabase, importDatabase } = useDataBackup();
    const { colorScheme } = useColorScheme();

    return (<View className="px-2">
        <Host matchContents>
            <ContextMenu>
                <ContextMenu.Items>
                    <Button
                        variant="bordered"
                        systemImage="square.and.arrow.up"
                        onPress={async () => {
                            await exportDatabase();
                        }}>
                        {intl.formatMessage({ id: 'home.export-data' })}
                    </Button>
                    <Button
                        systemImage="square.and.arrow.down"
                        onPress={async () => {
                            await importDatabase();
                        }}>
                        {intl.formatMessage({ id: 'home.import-data' })}
                    </Button>
                </ContextMenu.Items>
                <ContextMenu.Trigger>
                    <Settings size={24} color={colorScheme === 'light' ? '#000' : '#fff'} />
                </ContextMenu.Trigger>
            </ContextMenu>
        </Host>
    </View>)
}