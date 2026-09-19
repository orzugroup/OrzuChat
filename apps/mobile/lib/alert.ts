import { Alert, Platform } from 'react-native';

export function showAlert(title: string, message: string): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.alert(`${title}\n${message}`);
    return;
  }
  Alert.alert(title, message);
}
