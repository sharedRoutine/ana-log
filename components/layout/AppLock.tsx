import * as LocalAuthentication from 'expo-local-authentication';
import { LockKeyhole, ScanFace } from 'lucide-react-native';
import { PressableScale } from 'pressto';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useIntl } from 'react-intl';
import { AppState, View, Text } from 'react-native';

export function AppLock({ children }: { children: ReactNode }) {
  const intl = useIntl();
  const [locked, setLocked] = useState(true);
  const lockedRef = useRef(true);
  const inFlight = useRef(false);

  const applyLocked = (value: boolean) => {
    lockedRef.current = value;
    setLocked(value);
  };

  const unlock = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    try {
      const canAuthenticate =
        (await LocalAuthentication.hasHardwareAsync()) &&
        (await LocalAuthentication.isEnrolledAsync());
      // Without enrolled biometrics or a device passcode there is nothing to
      // authenticate against — don't lock the user out of their own data.
      if (!canAuthenticate) {
        applyLocked(false);
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: intl.formatMessage({ id: 'lock.prompt' }),
      });
      if (result.success) applyLocked(false);
    } finally {
      inFlight.current = false;
    }
  }, [intl]);

  useEffect(() => {
    unlock();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') applyLocked(true);
      else if (state === 'active' && lockedRef.current) unlock();
    });
    return () => subscription.remove();
  }, [unlock]);

  return (
    <View className="flex-1">
      {children}
      {locked && (
        <View className="absolute inset-0 items-center justify-center bg-background-primary-light px-8 dark:bg-background-primary-dark">
          <View className="mb-5 h-16 w-16 items-center justify-center rounded-2xl bg-background-secondary-light dark:bg-background-secondary-dark">
            <LockKeyhole size={28} color="#34D399" />
          </View>
          <Text className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark">
            {intl.formatMessage({ id: 'lock.title' })}
          </Text>
          <Text className="mt-1 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
            {intl.formatMessage({ id: 'lock.subtitle' })}
          </Text>
          <PressableScale onPress={unlock}>
            <View className="mt-8 flex-row items-center gap-2 rounded-full bg-accent px-6 py-3">
              <ScanFace size={18} color="#000000" />
              <Text className="text-base font-semibold text-black">
                {intl.formatMessage({ id: 'lock.unlock' })}
              </Text>
            </View>
          </PressableScale>
        </View>
      )}
    </View>
  );
}
