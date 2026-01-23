import { GlassContainer, GlassView } from 'expo-glass-effect';
import { ChevronDown, ChevronLeftCircle, Edit } from 'lucide-react-native';
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

cssInterop(ChevronDown, {
  className: 'style',
});

cssInterop(ChevronLeftCircle, {
  className: 'style',
});

cssInterop(Edit, {
  className: 'style',
});
