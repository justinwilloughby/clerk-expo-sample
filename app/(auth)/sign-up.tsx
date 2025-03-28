import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Pressable } from 'react-native';
import { SvgUri } from 'react-native-svg';
import { Link, useRouter } from 'expo-router';
import { useSignUp } from '@clerk/clerk-expo';
import { useSharedValue } from 'react-native-reanimated';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [code, setCode] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    code?: string;
    general?: string;
  }>({});
  const [verificationCode, setVerificationCode] = React.useState(['', '', '', '', '', '']);
  const inputRefs = React.useRef<Array<TextInput | null>>([null, null, null, null, null, null]);
  const [countdown, setCountdown] = React.useState(0);

  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleCodeChange = (text: string, index: number) => {
    // Remove any non-numeric characters
    const sanitizedText = text.replace(/[^0-9]/g, '');

    if (sanitizedText.length === 6) {
      // Handle pasted 6-digit code
      const codeArray = sanitizedText.split('');
      setVerificationCode(codeArray);
      // Focus last input
      inputRefs.current[5]?.focus();
    } else if (sanitizedText.length === 1) {
      // Handle single digit input
      const newCode = [...verificationCode];
      newCode[index] = sanitizedText;
      setVerificationCode(newCode);
      
      // Auto-advance to next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    // Clear any existing errors
    if (errors.code) {
      setErrors(prev => ({ ...prev, code: undefined }));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!verificationCode[index] && index > 0) {
        // If current input is empty and backspace is pressed, move to previous input
        const newCode = [...verificationCode];
        newCode[index - 1] = '';
        setVerificationCode(newCode);
        inputRefs.current[index - 1]?.focus();
      } else {
        // Clear current input
        const newCode = [...verificationCode];
        newCode[index] = '';
        setVerificationCode(newCode);
      }
    }
  };

  const onSignUpPress = React.useCallback(async () => {
    if (!isLoaded) return;

    setErrors({});
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send verification email
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      
      // Switch to verification view
      setVerifying(true);
      setCountdown(30);
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        switch (clerkError.code) {
          case 'form_param_format_invalid':
            setErrors({ email: 'Please enter a valid email address' });
            break;
          case 'form_param_exists':
            setErrors({ email: 'An account with this email already exists' });
            break;
          default:
            setErrors({ general: clerkError.message });
        }
      } else {
        setErrors({ general: 'An unexpected error occurred' });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded, email, password]);

  const onVerifyPress = React.useCallback(async (code: string) => {
    if (!isLoaded) return;

    setErrors({});
    if (!code) {
      setErrors({ code: 'Verification code is required' });
      return;
    }

    setLoading(true);
    try {
      const completeSignUp = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status !== 'complete') {
        setErrors({ code: 'Verification failed. Please try again.' });
        return;
      }

      // Set the user's session active
      await setActive({ session: completeSignUp.createdSessionId });
      router.replace('/');
    } catch (err: any) {
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0];
        switch (clerkError.code) {
          case 'form_code_incorrect':
            setErrors({ code: 'Incorrect code. Please try again.' });
            break;
          default:
            setErrors({ general: clerkError.message });
        }
      } else {
        setErrors({ general: 'Verification failed' });
      }
    } finally {
      setLoading(false);
    }
  }, [isLoaded]);

  if (verifying) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Verify your email</Text>
          <Text style={styles.subtitle}>
            Enter the verification code sent to your email
          </Text>
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{email}</Text>
            <TouchableOpacity onPress={() => setVerifying(false)}>
              <Text style={styles.editButton}>✏️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.codeContainer}>
          {verificationCode.map((digit, index) => (
            <TextInput
              key={index}
              ref={ref => inputRefs.current[index] = ref}
              style={[
                styles.codeInput,
                errors.code && styles.codeInputError
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={6}
              selectTextOnFocus
              onPaste={(e) => {
                // Handle paste event if available
                const pastedText = e?.nativeEvent?.text;
                if (pastedText) {
                  handleCodeChange(pastedText, index);
                }
              }}
            />
          ))}
        </View>

        {errors.code && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>
              This field is required and cannot be empty.
            </Text>
          </View>
        )}

        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => onVerifyPress(verificationCode.join(''))}
        >
          {loading ? (
            <LoadingSpinner />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.resendContainer}
          onPress={async () => {
            if (countdown === 0) {
              try {
                await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
                setCountdown(30);
              } catch (err) {
                setErrors({ general: 'Failed to resend code' });
              }
            }
          }}
          disabled={countdown > 0}
        >
          <Text style={[
            styles.resendText, 
            countdown > 0 && styles.resendTextDisabled
          ]}>
            Didn't receive a code? Resend {countdown > 0 ? `(${countdown})` : ''}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>Welcome! Please fill in the details to get started.</Text>
      </View>

      <TouchableOpacity style={styles.googleButton}>
        <SvgUri 
          width={24}
          height={24}
          uri="https://img.clerk.com/static/google.svg?width=160"
          style={styles.googleIcon}
        />
        <Text style={styles.googleButtonText}>Continue with Google</Text>
      </TouchableOpacity>

      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.divider} />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email address</Text>
        <TextInput
          style={[styles.input, errors.email && styles.inputError]}
          placeholder="Enter your email address"
          placeholderTextColor="#6b7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (errors.email) {
              setErrors(prev => ({ ...prev, email: undefined }));
            }
          }}
        />
        {errors.email && (
          <Text style={styles.errorText}>{errors.email}</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Password</Text>
        <TextInput
          style={[styles.input, errors.password && styles.inputError]}
          placeholder="Create a password"
          placeholderTextColor="#6b7280"
          secureTextEntry={true}
          autoCapitalize="none"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) {
              setErrors(prev => ({ ...prev, password: undefined }));
            }
          }}
        />
        {errors.password && (
          <Text style={styles.errorText}>{errors.password}</Text>
        )}
      </View>

      {errors.general && (
        <Text style={[styles.errorText, styles.generalError]}>
          {errors.general}
        </Text>
      )}

      <TouchableOpacity 
        style={styles.continueButton}
        onPress={onSignUpPress}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Text style={styles.continueButtonText}>Sign up</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signInContainer}>
        <Text style={styles.signInText}>Already have an account? </Text>
        <Link href="/(auth)/sign-in" style={styles.signInLink}>
          <Text style={styles.signInLinkText}>Sign in</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
  },
  header: {
    alignItems: 'center',
    marginVertical: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginVertical: 16,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  googleButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#6b7280',
  },
  formContainer: {
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#374151',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 4,
  },
  generalError: {
    textAlign: 'center',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
    minHeight: 52,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signInText: {
    color: '#6b7280',
    fontSize: 16,
  },
  signInLink: {
    marginLeft: 4,
  },
  signInLinkText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '500',
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendText: {
    color: '#7c3aed',
    fontSize: 16,
  },
  resendTextDisabled: {
    color: '#9ca3af',
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#374151',
  },
  editButton: {
    marginLeft: 8,
    fontSize: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  codeInput: {
    width: 45,
    height: 45,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 20,
    textAlign: 'center',
    backgroundColor: '#f9fafb',
  },
  codeInputError: {
    borderColor: '#ef4444',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#ef4444',
  },
});