import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from 'pressto';
import { LucideIcon } from 'lucide-react-native';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon size={48} color="#8E8E93" />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <PressableScale style={styles.actionButton} onPress={onAction}>
          <Text style={styles.actionButtonText}>{actionLabel}</Text>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#000',
  },
  iconContainer: {
    marginBottom: 16,
    opacity: 0.6,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  actionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

