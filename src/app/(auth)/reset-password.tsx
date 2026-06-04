import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '../../components/layout/screen-container';
import { authService } from '../../services/auth';

type Step = 'email' | 'otp' | 'newPw' | 'success';

interface PasswordRuleProps {
  valid: boolean;
  label: string;
}

function PasswordRule({ valid, label }: PasswordRuleProps) {
  return (
    <View className="flex-row items-center gap-2 mb-1.5">
      <Text 
        style={{ color: valid ? '#22c55e' : '#ef4444', fontSize: 16 }} 
        className="font-bold mr-1"
      >
        {valid ? '✓' : '•'}
      </Text>
      <Text className={`font-inter text-sm ${valid ? 'text-green-400' : 'text-[#A3A3A3]'}`}>
        {label}
      </Text>
    </View>
  );
}

export default function ResetPasswordScreen() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [expiredAt, setExpiredAt] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  
  // New password inputs
  const [pass, setPass] = useState('');
  const [cPass, setCPass] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  
  // Password focus states
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordFocusedOnce, setPasswordFocusedOnce] = useState(false);
  const [passwordValidationDismissed, setPasswordValidationDismissed] = useState(false);

  const router = useRouter();
  const otpRefs = useRef<(TextInput | null)[]>([]);

  // Password rules validation
  const passwordRules = {
    length: pass.length >= 8,
    uppercase: /[A-Z]/.test(pass),
    number: /\d/.test(pass),
    special: /[^A-Za-z0-9]/.test(pass),
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  useEffect(() => {
    if (!isPasswordValid) {
      setPasswordValidationDismissed(false);
    }
  }, [isPasswordValid]);

  const showPasswordValidation =
    !passwordValidationDismissed && (passwordFocusedOnce || passwordFocused);

  // OTP Countdown timer
  useEffect(() => {
    if (step !== 'otp' || !expiredAt) return;

    const target = new Date(expiredAt).getTime();
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        return;
      }

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [step, expiredAt]);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setErrorMsg('');
    if (!email) {
      setErrorMsg('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({ email, action: 'send-otp' });
      if (res && !res.error) {
        setExpiredAt(res.expires_at || new Date(Date.now() + 5 * 60 * 1000).toISOString());
        setStep('otp');
      } else {
        setErrorMsg(res.error || 'Failed to send OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async () => {
    setErrorMsg('');
    const code = otp.join('');
    if (code.length < 6) {
      setErrorMsg('Please enter a valid 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.verifyOtp({
        email,
        otp: code,
        purpose: 'reset-password',
      });

      if (res && res.otp_verified) {
        setStep('newPw');
      } else {
        setErrorMsg(res.error || 'Failed to verify OTP code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Alt: Resend OTP
  const handleResendOtp = async () => {
    setResending(true);
    setErrorMsg('');
    try {
      const res = await authService.sendOtp({ email, purpose: 'reset-password' });
      if (res && res.expires_at) {
        setExpiredAt(res.expires_at);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => {
          otpRefs.current[0]?.focus();
        }, 100);
      } else {
        setErrorMsg('Failed to resend code.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // Step 3: Change Password
  const handleChangePassword = async () => {
    setErrorMsg('');
    if (!pass || !cPass) {
      setErrorMsg('Please fill in both fields.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Password does not meet the requirements.');
      return;
    }

    if (pass !== cPass) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await authService.resetPassword({
        action: 'change-password',
        email,
        new_password: pass,
      });

      if (res && res.status === 'success') {
        setStep('success');
      } else {
        setErrorMsg(res.error || 'Failed to change password.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChangeText = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];

    if (cleanText === '') {
      newOtp[index] = '';
      setOtp(newOtp);
      if (index > 0) {
        otpRefs.current[index - 1]?.focus();
      }
      return;
    }

    newOtp[index] = cleanText[cleanText.length - 1];
    setOtp(newOtp);

    if (index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '') {
        if (index > 0) {
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
          otpRefs.current[index - 1]?.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  return (
    <ScreenContainer useSafeArea={false} style={{ paddingHorizontal: 0 }}>
      {/* Background Bubbles from Web */}
      <View className="absolute inset-0 z-0 pointer-events-none bg-black">
        {/* Top Right Bubble */}
        <Image
          source={require('../../../assets/images/login/bubble-1.png')}
          className="absolute top-0 right-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
        {/* Bottom Left Bubble */}
        <Image
          source={require('../../../assets/images/login/bubble-2.png')}
          className="absolute bottom-0 left-0 w-[280px] h-[280px]"
          resizeMode="contain"
        />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 z-10"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          className="w-full px-4"
        >
          {/* Top Section: Logo */}
          <View className="w-full mt-10">
            <View className="py-[22px] flex-row justify-start">
              <Text className="text-[36px] font-extrabold tracking-wider text-white font-genos">
                <Text className="text-[#9457FF]">GRA</Text>DIA
              </Text>
            </View>
          </View>

          {/* STEP 1: EMAIL INPUT */}
          {step === 'email' && (
            <View className="flex-1 justify-center">
              <View className="items-center mt-4">
                <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                  Forgot Password?
                </Text>
                <Text className="text-center text-[#A3A3A3] mt-3 px-4 text-sm leading-5 font-inter">
                  Enter your email to reset password
                </Text>
              </View>

              <View
                style={styles.bodySection}
                className="bg-white/5 rounded-[12px] p-6 mt-8 border border-white/10"
              >
                <View className="flex-col gap-2">
                  <Text className="text-white text-sm font-inter">Email</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your-email@mail.com"
                    placeholderTextColor="#A3A3A3"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                  />
                </View>

                <Text
                  className={`text-sm mt-3 font-inter ${
                    errorMsg ? 'text-red-400 opacity-100' : 'opacity-0'
                  }`}
                  style={{ height: 20 }}
                >
                  {errorMsg || ' '}
                </Text>

                <View className="flex-col gap-4 mt-6">
                  <TouchableOpacity onPress={handleSendOtp} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#34146C', '#28073B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 8,
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}
                    >
                      {loading && (
                        <ActivityIndicator size="small" color="#FAFAFA" style={{ marginRight: 8 }} />
                      )}
                      <Text className="text-white text-base font-inter text-center">
                        {loading ? 'Sending...' : 'Next'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View className="w-full items-center mt-2">
                    <TouchableOpacity onPress={() => router.back()}>
                      <Text className="text-sm text-[#A3A3A3] font-inter underline">
                        Back to Login
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === 'otp' && (
            <View className="flex-1 justify-center">
              <View className="items-center mt-4">
                <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                  Verify OTP
                </Text>
                <Text className="text-center text-[#A3A3A3] mt-3 px-4 text-sm leading-5 font-inter">
                  Enter the 6-digit code sent to your email
                </Text>
              </View>

              <View
                style={styles.bodySection}
                className="bg-white/5 rounded-[12px] p-6 mt-8 border border-white/10"
              >
                <View className="flex-row justify-between w-full my-4">
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={el => { otpRefs.current[index] = el; }}
                      value={digit}
                      onChangeText={text => handleOtpChangeText(text, index)}
                      onKeyPress={e => handleOtpKeyPress(e, index)}
                      keyboardType="number-pad"
                      maxLength={2}
                      selectTextOnFocus
                      className="w-[14%] aspect-square text-center text-xl font-semibold border border-white/10 bg-black/20 text-white rounded-[8px] font-inter"
                    />
                  ))}
                </View>

                <Text
                  className={`text-sm mt-1 font-inter ${
                    errorMsg ? 'text-red-400 opacity-100' : 'opacity-0'
                  }`}
                  style={{ height: 20 }}
                >
                  {errorMsg || ' '}
                </Text>

                <View className="w-full text-center items-center my-3">
                  <Text className="text-sm text-[#A3A3A3] font-inter">
                    {timeLeft || '--:--'}
                  </Text>
                </View>

                <View className="flex-col gap-4 mt-4">
                  <Text className="text-sm text-[#A3A3A3] font-inter text-center">
                    Didn't receive the code?{' '}
                    <Text
                      onPress={resending ? undefined : handleResendOtp}
                      className={`underline font-bold ${resending ? 'text-white/40' : 'text-[#9457FF]'}`}
                    >
                      {resending ? 'Resending...' : 'Resend Code'}
                    </Text>
                  </Text>

                  <TouchableOpacity onPress={handleVerifyOtp} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#34146C', '#28073B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 8,
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}
                    >
                      {loading && (
                        <ActivityIndicator size="small" color="#FAFAFA" style={{ marginRight: 8 }} />
                      )}
                      <Text className="text-white text-base font-inter text-center">
                        {loading ? 'Verifying...' : 'Verify'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View className="w-full items-center mt-2">
                    <TouchableOpacity onPress={() => setStep('email')}>
                      <Text className="text-sm text-[#A3A3A3] font-inter underline">
                        Change Email
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'newPw' && (
            <View className="flex-1 justify-center">
              <View className="items-center mt-4">
                <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                  New Password
                </Text>
                <Text className="text-center text-[#A3A3A3] mt-3 px-4 text-sm leading-5 font-inter">
                  Enter your new password for <Text className="font-semibold text-white">{email}</Text>
                </Text>
              </View>

              <View
                style={styles.bodySection}
                className="bg-white/5 rounded-[12px] p-6 mt-8 border border-white/10"
              >
                <View className="flex-col gap-5">
                  <View className="flex-col gap-2">
                    <Text className="text-white text-sm font-inter">New Password</Text>
                    <TextInput
                      value={pass}
                      onChangeText={setPass}
                      placeholder="********"
                      placeholderTextColor="#A3A3A3"
                      secureTextEntry
                      autoCapitalize="none"
                      onFocus={() => {
                        setPasswordFocused(true);
                        setPasswordFocusedOnce(true);
                      }}
                      onBlur={() => {
                        setPasswordFocused(false);
                        if (isPasswordValid) {
                          setPasswordValidationDismissed(true);
                        }
                      }}
                      className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                    />
                  </View>

                  {showPasswordValidation && (
                    <View className="flex-col gap-1.5 p-3.5 bg-black/30 rounded-[12px] border border-white/5">
                      <PasswordRule
                        valid={passwordRules.length}
                        label="At least 8 characters"
                      />
                      <PasswordRule
                        valid={passwordRules.uppercase}
                        label="At least one capital letter"
                      />
                      <PasswordRule
                        valid={passwordRules.number}
                        label="At least one number"
                      />
                      <PasswordRule
                        valid={passwordRules.special}
                        label="At least one special character"
                      />
                    </View>
                  )}

                  <View className="flex-col gap-2">
                    <Text className="text-white text-sm font-inter">Confirm Password</Text>
                    <TextInput
                      value={cPass}
                      onChangeText={setCPass}
                      placeholder="********"
                      placeholderTextColor="#A3A3A3"
                      secureTextEntry
                      autoCapitalize="none"
                      className="w-full border border-white/10 bg-black/20 text-white px-3 py-3.5 rounded-[12px] font-inter"
                    />
                  </View>
                </View>

                <Text
                  className={`text-sm mt-3 font-inter ${
                    errorMsg ? 'text-red-400 opacity-100' : 'opacity-0'
                  }`}
                  style={{ height: 20 }}
                >
                  {errorMsg || ' '}
                </Text>

                <View className="flex-col gap-4 mt-6">
                  <TouchableOpacity onPress={handleChangePassword} disabled={loading} activeOpacity={0.85}>
                    <LinearGradient
                      colors={['#34146C', '#28073B']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        borderRadius: 8,
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row'
                      }}
                    >
                      {loading && (
                        <ActivityIndicator size="small" color="#FAFAFA" style={{ marginRight: 8 }} />
                      )}
                      <Text className="text-white text-base font-inter text-center">
                        {loading ? 'Changing Password...' : 'Change Password'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* STEP 4: SUCCESS MESSAGE */}
          {step === 'success' && (
            <View className="flex-1 justify-center">
              <View className="items-center mt-4">
                <Text className="font-bold text-[32px] text-white text-center font-montserrat">
                  Password Reset Successfully
                </Text>
                <Text className="text-center text-[#A3A3A3] mt-8 px-4 text-sm leading-6 font-inter">
                  Your password has been successfully updated. You can now log in and continue managing your goals with Gradia.
                </Text>
              </View>

              <View className="flex-row justify-center items-center mt-12">
                <Text className="text-base text-[#A3A3A3] font-inter text-center">
                  Back to{' '}
                  <Text
                    onPress={() => router.replace('/(auth)/login')}
                    className="underline text-[#9457FF] font-bold font-inter"
                  >
                    Login
                  </Text>
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  bodySection: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
});
