import { Image, Pressable, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../../navigation/AppNavigator';
import arthumLogoFull from '../../assets/images/arthum-logo-full.png';
import PrimaryButton from '../../components/common/PrimaryButton';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView className="flex-1 bg-[#F5F6FF]">
      <StatusBar barStyle="dark-content" />

      <View className="flex-1 justify-between px-6 pb-6">
        {/* Brand */}
        <View className="flex-1 items-center justify-center">
          <Image
            source={arthumLogoFull}
            resizeMode="contain"
            className="h-[180px] w-[180px]"
          />

          <Text className="mt-5 text-center text-[16px] leading-[24px] text-[#726C8E]">
            Your intelligent AI workspace
          </Text>
        </View>

        {/* Bottom Actions */}
        <View className="w-full">
          <PrimaryButton
            title="Get Started"
            onPress={() => navigation.navigate('Login')}
          />

          <Pressable
            className="mt-3 items-center justify-center py-3"
            onPress={() => navigation.navigate('Login')}
            hitSlop={8}
          >
            <Text className="text-[15px] font-medium text-[#5566EB]">
              Sign In
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default WelcomeScreen;
