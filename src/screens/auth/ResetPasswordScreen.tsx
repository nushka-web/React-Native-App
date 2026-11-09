import {
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
import arthumWordmark from '../../assets/images/arthum-wordmark.jpeg';
import PrimaryButton from '../../components/common/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'ResetPassword'>;

function ResetPasswordScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F6FF]">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-10">
            {/* Header */}
            <View className="mt-8">
              <Image
                source={arthumWordmark}
                resizeMode="contain"
                className="h-[42px] w-[240px]"
              />

              <Text className="mt-8 text-[28px] font-bold tracking-[-0.5px] text-[#16142F]">
                Reset your password
              </Text>

              <Text className="mt-3 text-[16px] leading-[24px] text-[#726C8E]">
                Enter your email address and we'll send you a link to reset
                your password.
              </Text>
            </View>

            {/* Form */}
            <View className="mt-10">
              <Text className="mb-2 text-[14px] font-medium text-[#16142F]">
                Email
              </Text>

              <TextInput
                className="h-[52px] rounded-[14px] border border-[#E5E6F2] bg-[#FBFBFF] px-4 text-[16px] text-[#16142F]"
                placeholder="Enter your email"
                placeholderTextColor="#9A96AD"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />

              {/* Reset Button */}
              <PrimaryButton
                className="mt-6"
                title="Send Reset Link"
                onPress={() => { }}
              />
            </View>

            {/* Back to Login */}
            <View className="mt-auto items-center pb-8 pt-10">
              <Pressable
                className="py-2"
                onPress={() => navigation.navigate('Login')}
                hitSlop={8}
              >
                <Text className="text-[15px] font-semibold text-[#5566EB]">
                  Back to Sign In
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ResetPasswordScreen;
