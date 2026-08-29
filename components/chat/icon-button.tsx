import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type PressableProps } from 'react-native';

type Props = PressableProps & {
  name: React.ComponentProps<typeof Ionicons>['name'];
  accessibilityLabel: string;
  color?: string;
  size?: number;
};

export function IconButton({ name, color = '#20241F', size = 22, style, ...props }: Props) {
  return (
    <Pressable
      hitSlop={8}
      style={(state) => [styles.button, state.pressed && styles.pressed, typeof style === 'function' ? style(state) : style]}
      {...props}>
      <Ionicons name={name} color={color} size={size} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  pressed: { opacity: 0.55 },
});
