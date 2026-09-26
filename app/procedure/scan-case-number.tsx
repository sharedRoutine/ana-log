import {
  BarcodeScanningResult,
  CameraView,
  useCameraPermissions,
} from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { Stack, useRouter } from 'expo-router';
import {
  Camera,
  CircleCheck,
  Flashlight,
  FlashlightOff,
  TriangleAlert,
  X,
} from 'lucide-react-native';
import { PressableScale } from 'pressto';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { Linking, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ACCENT } from '~/components/ui/Form';
import { useBarcodeScanner } from '~/contexts/BarcodeScannerContext';
import { parseCaseNumber } from '~/lib/case-number';
import { cn } from '~/lib/cn';

const SUCCESS_DISMISS_DELAY = 900;
const ERROR_CLEAR_DELAY = 1500;

type ScanState =
  | { status: 'scanning' }
  | { status: 'valid'; caseNumber: string }
  | { status: 'invalid'; value: string };

export default function ScanCaseNumber() {
  const intl = useIntl();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { onScan } = useBarcodeScanner();
  const [permission, requestPermission] = useCameraPermissions();

  const [scan, setScan] = useState<ScanState>({ status: 'scanning' });
  const [torch, setTorch] = useState(false);
  const lastInvalidRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const close = () => {
    clearTimeout(timeoutRef.current);
    router.back();
  };

  const handleBarcodeScanned = ({ data }: BarcodeScanningResult) => {
    const caseNumber = parseCaseNumber(data);

    if (caseNumber) {
      clearTimeout(timeoutRef.current);
      setScan({ status: 'valid', caseNumber });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      timeoutRef.current = setTimeout(() => {
        onScan?.(caseNumber);
        router.back();
      }, SUCCESS_DISMISS_DELAY);
      return;
    }

    if (lastInvalidRef.current !== data) {
      lastInvalidRef.current = data;
      setScan({ status: 'invalid', value: data });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }

    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      lastInvalidRef.current = null;
      setScan({ status: 'scanning' });
    }, ERROR_CLEAR_DELAY);
  };

  const closeButton = (
    <PressableScale
      onPress={close}
      accessibilityRole="button"
      accessibilityLabel={intl.formatMessage({ id: 'scanner.close' })}
    >
      <View className="h-11 w-11 items-center justify-center rounded-full bg-black/50">
        <X size={22} color="#FFFFFF" />
      </View>
    </PressableScale>
  );

  if (!permission) {
    return <View className="flex-1 bg-black" />;
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 bg-background-primary-light px-8 dark:bg-background-primary-dark"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Stack.Screen options={{ headerShown: false }} />
        {closeButton}
        <View className="flex-1 items-center justify-center">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-background-secondary-light dark:bg-background-secondary-dark">
            <Camera size={28} color={ACCENT} />
          </View>
          <Text className="text-center text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {intl.formatMessage({ id: 'scanner.permission.title' })}
          </Text>
          <Text className="mt-2 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {intl.formatMessage({ id: 'scanner.permission.message' })}
          </Text>
          <PressableScale
            onPress={() =>
              permission.canAskAgain
                ? requestPermission()
                : Linking.openSettings()
            }
          >
            <View className="mt-8 rounded-full bg-accent px-6 py-3">
              <Text className="text-base font-semibold text-black">
                {intl.formatMessage({
                  id: permission.canAskAgain
                    ? 'scanner.permission.allow'
                    : 'scanner.permission.settings',
                })}
              </Text>
            </View>
          </PressableScale>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <Stack.Screen options={{ headerShown: false }} />
      <CameraView
        className="absolute inset-0"
        facing="back"
        enableTorch={torch}
        barcodeScannerSettings={{
          barcodeTypes: [
            'code128',
            'code39',
            'code93',
            'codabar',
            'itf14',
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'datamatrix',
            'qr',
            'pdf417',
            'aztec',
          ],
        }}
        onBarcodeScanned={
          scan.status === 'valid' ? undefined : handleBarcodeScanned
        }
      />

      <View
        className="flex-row items-center justify-between px-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        {closeButton}
        <PressableScale
          onPress={() => setTorch(!torch)}
          accessibilityRole="switch"
          accessibilityState={{ checked: torch }}
          accessibilityLabel={intl.formatMessage({ id: 'scanner.torch' })}
        >
          <View
            className={cn(
              'h-11 w-11 items-center justify-center rounded-full',
              torch ? 'bg-white' : 'bg-black/50',
            )}
          >
            {torch ? (
              <FlashlightOff size={20} color="#000000" />
            ) : (
              <Flashlight size={20} color="#FFFFFF" />
            )}
          </View>
        </PressableScale>
      </View>

      <View className="flex-1 items-center justify-center px-8">
        <View
          className={cn(
            'h-44 w-full max-w-[320px] rounded-3xl border-[3px]',
            scan.status === 'scanning' && 'border-white/80',
            scan.status === 'valid' && 'border-emerald-400 bg-emerald-400/15',
            scan.status === 'invalid' && 'border-red-500 bg-red-500/15',
          )}
        />
        <Text className="mt-4 text-center text-sm text-white/80">
          {intl.formatMessage({ id: 'scanner.hint' })}
        </Text>
      </View>

      <View
        className="absolute inset-x-4"
        style={{ bottom: insets.bottom + 24 }}
        pointerEvents="none"
        accessibilityLiveRegion="polite"
      >
        {scan.status === 'valid' && (
          <Animated.View
            key="valid"
            entering={FadeInDown.duration(200)}
            exiting={FadeOut.duration(150)}
          >
            <View className="flex-row items-center gap-3 rounded-2xl bg-emerald-400 px-4 py-4">
              <CircleCheck size={28} color="#000000" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-black/70">
                  {intl.formatMessage({ id: 'scanner.valid.title' })}
                </Text>
                <Text
                  className="text-2xl font-bold text-black"
                  style={{ fontVariant: ['tabular-nums'] }}
                >
                  {scan.caseNumber}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
        {scan.status === 'invalid' && (
          <Animated.View
            key={`invalid-${scan.value}`}
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(150)}
          >
            <View className="flex-row items-center gap-3 rounded-2xl bg-red-500 px-4 py-4">
              <TriangleAlert size={28} color="#FFFFFF" />
              <View className="flex-1">
                <Text className="text-base font-bold text-white">
                  {intl.formatMessage({ id: 'scanner.invalid.title' })}
                </Text>
                <Text className="text-sm text-white/90">
                  {intl.formatMessage({ id: 'scanner.invalid.message' })}
                </Text>
                <Text
                  className="mt-1 font-mono text-xs text-white/70"
                  numberOfLines={1}
                >
                  {scan.value}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </View>
  );
}
