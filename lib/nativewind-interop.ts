import { GlassContainer, GlassView } from 'expo-glass-effect';
import { cssInterop } from 'nativewind';
import { PressableScale } from 'pressto';

cssInterop(PressableScale, {
  className: 'style',
});

cssInterop(GlassView, {
  className: 'style',
});

cssInterop(GlassContainer, {
  className: 'style',
});
