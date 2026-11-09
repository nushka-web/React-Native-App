import { useState } from 'react';
import {
    Pressable,
    Text,
    TextInput,
    View,
} from 'react-native';

type AuthInputProps = {
    label: string;
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    textContentType?:
    | 'none'
    | 'name'
    | 'emailAddress'
    | 'password'
    | 'newPassword';
};

function AuthInput({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    keyboardType = 'default',
    autoCapitalize = 'sentences',
    autoCorrect = false,
    textContentType = 'none',
}: AuthInputProps) {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    const isPassword = secureTextEntry;

    return (
        <View>
            <Text className="mb-2 text-[14px] font-medium text-[#16142F]">
                {label}
            </Text>

            <View
                className={`h-[52px] flex-row items-center rounded-[14px] border bg-[#FBFBFF] ${
                    isFocused ? 'border-[#4F5BD5]' : 'border-[#E5E6F2]'
                }`}
            >
                <TextInput
                    className="flex-1 px-4 text-[16px] text-[#16142F]"
                    placeholder={placeholder}
                    placeholderTextColor="#9A96AD"
                    value={value}
                    onChangeText={onChangeText}
                    secureTextEntry={isPassword && !isPasswordVisible}
                    keyboardType={keyboardType}
                    autoCapitalize={autoCapitalize}
                    autoCorrect={autoCorrect}
                    textContentType={textContentType}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                />

                {isPassword && (
                    <Pressable
                        className="mr-3 h-10 w-10 items-center justify-center"
                        onPress={() => setIsPasswordVisible((visible) => !visible)}
                        hitSlop={8}
                    >
                        <Text className="text-[13px] font-medium text-[#5566EB]">
                            {isPasswordVisible ? 'Hide' : 'Show'}
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

export default AuthInput;
