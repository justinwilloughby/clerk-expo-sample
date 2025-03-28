import { useSignIn, useSSO } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, TextInput, Button, View, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import React, { useEffect } from 'react'
import { SvgUri } from 'react-native-svg'
import LoadingSpinner from '../components/LoadingSpinner'
import * as WebBrowser from 'expo-web-browser'
import * as AuthSession from 'expo-auth-session'

export const useWarmUpBrowser = () => {
  useEffect(() => {
    // Preloads the browser for Android devices to reduce authentication load time
    // See: https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync()
    return () => {
      // Cleanup: closes browser when component unmounts
      void WebBrowser.coolDownAsync()
    }
  }, [])
}

// Handle any pending authentication sessions
WebBrowser.maybeCompleteAuthSession()

export default function Page() {
  useWarmUpBrowser()

  const { signIn, setActive, isLoaded } = useSignIn()
  const { startSSOFlow } = useSSO()
  const router = useRouter()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({})

  // Handle the google sign in
  const onGoogleSignIn = React.useCallback(async () => {
    try {
      // Start the authentication process by calling `startSSOFlow()`
      const { createdSessionId, setActive, signIn, signUp } = await startSSOFlow({
        strategy: 'oauth_google',
        // Defaults to current path
        redirectUrl: AuthSession.makeRedirectUri(),
      })

      // If sign in was successful, set the active session
      if (createdSessionId) {
        setActive!({ session: createdSessionId })
      } else {
        // If there is no `createdSessionId`,
        // there are missing requirements, such as MFA
        // Use the `signIn` or `signUp` returned from `startSSOFlow`
        // to handle next steps
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }, [])

  // Handle the submission of the sign-in form
  const onSignInPress = React.useCallback(async () => {
    if (!isLoaded) return

    // Clear any existing errors
    setErrors({})

    // Validate fields
    const newErrors: typeof errors = {}
    if (!email) {
      newErrors.email = 'Email is required'
    }
    if (!password) {
      newErrors.password = 'Password is required'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        setErrors({
          general: 'Sign in could not be completed. Please try again.',
        })
      }
    } catch (err: any) {
      // Handle specific error cases from Clerk
      if (err.errors && err.errors.length > 0) {
        const clerkError = err.errors[0]
        switch (clerkError.code) {
          // case 'form_identifier_not_found':
          //   setErrors({ email: 'No account found with this email' })
          //   break
          // case 'form_password_incorrect':
          //   setErrors({ password: 'Incorrect password' })
          //   break
          default:
            setErrors({ 
              general: clerkError.message || 'An error occurred during sign in' 
            })
        }
      } else {
        setErrors({ 
          general: 'An unexpected error occurred. Please try again.' 
        })
      }
    } finally {
      setLoading(false)
    }
  }, [isLoaded, email, password])

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sign in to Expo Sample</Text>
        <Text style={styles.subtitle}>Welcome back! Please sign in to continue</Text>
      </View>

      <TouchableOpacity style={styles.googleButton} onPress={onGoogleSignIn}>
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
            setEmail(text)
            // Clear error when user starts typing
            if (errors.email) {
              setErrors(prev => ({ ...prev, email: undefined }))
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
          placeholder="Enter your password"
          placeholderTextColor="#6b7280"
          secureTextEntry={true}
          autoCapitalize="none"
          value={password}
          onChangeText={(text) => {
            setPassword(text)
            // Clear error when user starts typing
            if (errors.password) {
              setErrors(prev => ({ ...prev, password: undefined }))
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
        onPress={onSignInPress}
      >
        {loading ? (
          <LoadingSpinner />
        ) : (
          <Text style={styles.continueButtonText}>Continue</Text>
        )}
      </TouchableOpacity>

      <View style={styles.signUpContainer}>
        <Text style={styles.signUpText}>Don't have an account? </Text>
        <Link href="/(auth)/sign-up" style={styles.signUpLink}>
          <Text style={styles.signUpLinkText}>Sign up</Text>
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
    borderColor: '#ef4444', // Red border for error state
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
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  signUpText: {
    color: '#6b7280',
    fontSize: 16,
  },
  signUpLink: {
    marginLeft: 4,
  },
  signUpLinkText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '500',
  },
});