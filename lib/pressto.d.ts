import type { CustomPressableProps } from 'pressto';

declare module 'pressto' {
  export function PressableScale(
    props: CustomPressableProps & { className?: string },
  ): JSX.Element;
}
