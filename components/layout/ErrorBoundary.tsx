import { PressableScale } from 'pressto';
import React, { Component, ReactNode } from 'react';
import { IntlProvider, useIntl } from 'react-intl';
import { View, Text, StyleSheet } from 'react-native';
import deMessages from '../../locales/de.json';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function ErrorFallbackContent({ onRetry }: { onRetry: () => void }) {
  const intl = useIntl();
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {intl.formatMessage({ id: 'error.generic.title' })}
        </Text>
        <Text style={styles.message}>
          {intl.formatMessage({ id: 'error.generic.message' })}
        </Text>
        <PressableScale style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>
            {intl.formatMessage({ id: 'common.retry' })}
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <IntlProvider locale="de" messages={deMessages}>
      <ErrorFallbackContent onRetry={onRetry} />
    </IntlProvider>
  );
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return <ErrorFallback onRetry={this.handleRetry} />;
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
