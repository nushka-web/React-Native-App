import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import arthumWordmark from '../../assets/images/arthum-wordmark.png';
import PrimaryButton from '../../components/common/PrimaryButton';
import { loginUser } from '../../services/authApi';
import { setSession } from '../../services/session';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    try {
      setIsLoading(true);

      const response = await loginUser({
        email: email.trim(),
        password,
      });

      if (response.success && response.token) {
        setSession(response.token, response.user ?? null);

        if (response.user?.category === 'Student') {
          navigation.reset({ index: 0, routes: [{ name: 'StudentHome' }] });
        } else {
          setError('You are signed in, but the home screen for your role is not available in the app yet.');
        }
      } else {
        setError(response.message || 'Login failed.');
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F6FF]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="flex-1 px-6 pt-10">
            <View className="mt-8 items-center">
              <Image
                source={arthumWordmark}
                resizeMode="contain"
                className="h-[42px] w-[240px]"
              />

              <Text className="mt-5 text-center text-[16px] leading-[24px] text-[#726C8E]">
                Sign in to continue with your AI workspace
              </Text>
            </View>

            <View className="mt-8">
              <View>
                <Text className="mb-2 text-[14px] font-medium text-[#16142F]">
                  Email
                </Text>

                <TextInput
                  className="h-[52px] rounded-[14px] border border-[#E5E6F2] bg-[#FBFBFF] px-4 text-[16px] text-[#16142F]"
                  placeholder="Enter your email"
                  placeholderTextColor="#9A96AD"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="emailAddress"
                />
              </View>

              <View className="mt-4">
                <Text className="mb-2 text-[14px] font-medium text-[#16142F]">
                  Password
                </Text>

                <View className="h-[52px] flex-row items-center rounded-[14px] border border-[#E5E6F2] bg-[#FBFBFF] px-4">
                  <TextInput
                    className="flex-1 text-[16px] text-[#16142F]"
                    placeholder="Enter your password"
                    placeholderTextColor="#9A96AD"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!isPasswordVisible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                  />

                  <Pressable
                    className="h-10 items-center justify-center pl-2"
                    onPress={() => setIsPasswordVisible(v => !v)}
                    hitSlop={8}>
                    <Text className="text-[13px] font-medium text-[#5566EB]">
                      {isPasswordVisible ? 'Hide' : 'Show'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              <Pressable
                className="mt-3 self-end py-1"
                onPress={() => navigation.navigate('ResetPassword')}
                hitSlop={8}>
                <Text className="text-[14px] font-medium text-[#5566EB]">
                  Forgot password?
                </Text>
              </Pressable>

              {error ? (
                <Text className="mt-3 text-center text-[14px] text-red-500">
                  {error}
                </Text>
              ) : null}

              <PrimaryButton
                className="mt-6"
                title={isLoading ? 'Signing In...' : 'Sign In'}
                onPress={handleLogin}
                disabled={isLoading}
              />

              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color="#4F5BD5"
                  className="mt-3"
                />
              ) : null}
            </View>

            <View className="items-center pb-8 pt-8">
              <View className="flex-row items-center">
                <Text className="text-[15px] text-[#726C8E]">
                  Don't have an account?
                </Text>

                <Pressable
                  className="ml-1 py-1"
                  onPress={() => navigation.navigate('Register')}
                  hitSlop={8}>
                  <Text className="text-[15px] font-semibold text-[#5566EB]">
                    Create one
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default LoginScreen;