import { createNativeStackNavigator } from '@react-navigation/native-stack';

import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';
import EmailVerificationScreen from '../screens/auth/EmailVerificationScreen';
import StudentHomeScreen from '../screens/home/StudentHomeScreen';
import TryAiScreen from '../screens/tryai/TryAiScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ResetPassword: undefined;
  EmailVerification: { email: string; parentEmail?: string };
  StudentHome: undefined;
  // Opened from a shared link such as arthumai://try?input=...&utm_source=instagram
  TryAi:
    | {
        input?: string;
        utm_source?: string;
        utm_medium?: string;
        utm_campaign?: string;
        utm_content?: string;
        utm_term?: string;
      }
    | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="ResetPassword"
        component={ResetPasswordScreen}
      />
      <Stack.Screen
        name="EmailVerification"
        component={EmailVerificationScreen}
      />
      <Stack.Screen
        name="StudentHome"
        component={StudentHomeScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="TryAi" component={TryAiScreen} />
    </Stack.Navigator>
  );
}

export default AppNavigator;