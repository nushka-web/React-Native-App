import {PermissionsAndroid, Platform} from 'react-native';
import {
  AuthorizationStatus,
  getMessaging,
  getToken,
  requestPermission,
} from '@react-native-firebase/messaging';
import {apiRequest} from './api';
import {getSession} from './session';

export type NotificationResponse = {
  success: boolean;
  message?: string;
  isSubscribed?: boolean;
};

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
    return true;
  }

  const authStatus = await requestPermission(getMessaging());
  return (
    authStatus === AuthorizationStatus.AUTHORIZED ||
    authStatus === AuthorizationStatus.PROVISIONAL
  );
}

export async function getFCMToken(): Promise<string | null> {
  try {
    return await getToken(getMessaging());
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = getSession().token;

  if (!token) {
    throw new Error('Please log in to manage notification settings.');
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

export async function subscribeToNotifications(): Promise<NotificationResponse> {
  const permissionGranted = await requestNotificationPermission();

  if (!permissionGranted) {
    throw new Error('Please allow notifications in your device settings.');
  }

  const fcmToken = await getFCMToken();

  if (!fcmToken) {
    throw new Error('Unable to register this device for notifications.');
  }

  return apiRequest<NotificationResponse>(
    '/api/notifications/subscribe',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        fcmToken,
        platform: Platform.OS,
      }),
    },
  );
}

export async function unsubscribeFromNotifications(): Promise<NotificationResponse> {
  return apiRequest<NotificationResponse>(
    '/api/notifications/unsubscribe',
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({}),
    },
  );
}
