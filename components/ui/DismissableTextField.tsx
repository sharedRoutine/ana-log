import {
  Button,
  HStack,
  TextField,
  TextFieldProps,
  TextFieldRef,
} from '@expo/ui/swift-ui';
import { useRef, useState } from 'react';
import { mergeRefs } from 'react-merge-refs';

export function DismissableTextField({
  ref,
  ...props
}: Omit<TextFieldProps, 'onChangeFocus'>) {
  const [isFocused, setIsFocused] = useState(false);
  const fieldRef = useRef<TextFieldRef>(null);
  return (
    <HStack>
      <TextField
        onChangeFocus={setIsFocused}
        ref={mergeRefs([fieldRef, ref])}
        {...props}
      />
      {isFocused && (
        <Button
          systemImage="keyboard.chevron.compact.down"
          onPress={() => {
            fieldRef.current?.blur();
          }}
        />
      )}
    </HStack>
  );
}
