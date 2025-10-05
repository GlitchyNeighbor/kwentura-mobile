import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Animated,
} from "react-native";
import { auth } from "../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import {
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db } from "../FirebaseConfig";

// Constants
const COLORS = {
  primary: '#FFCF2D',
  primaryDark: '#E6B800',
  white: '#FFFFFF',
  gray: '#888888',
  lightGray: '#929292ff',
  red: '#E63B3B',
  blue: '#386CD2',
  yellow: '#FFD915',
  green: '#52FF00',
  yellowBright: '#FFEA00',
  black: '#000000',
};

const TITLE_COLORS = [
  COLORS.red, COLORS.blue, COLORS.yellow, COLORS.green,
  COLORS.yellow, COLORS.blue, COLORS.green, COLORS.red
];

// Utility functions
const validateInputs = (schoolId, password) => {
  if (!schoolId?.trim()) return "Please enter your School ID";
  if (!password?.trim()) return "Please enter your password";
  if (schoolId.trim().length < 3) return "School ID must be at least 3 characters";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const Login = ({ navigation }) => {
  const [schoolId, setSchoolId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const titleOpacity = useRef(new Animated.Value(1)).current;

  // Memoized title letters to prevent unnecessary re-renders
  const titleLetters = useMemo(() => 
    'Kwentura'.split('').map((letter, index) => ({
      letter,
      color: TITLE_COLORS[index]
    })), []
  );

  useEffect(() => {
    const showKeyboard = () => {
      setIsKeyboardVisible(true);
      Animated.timing(titleOpacity, {
        toValue: 0, // Fade out
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const hideKeyboard = () => {
      setIsKeyboardVisible(false);
      Animated.timing(titleOpacity, {
        toValue: 1, // Fade in
        duration: 250,
        useNativeDriver: true,
      }).start();
    };

    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', showKeyboard);
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', hideKeyboard);

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [titleOpacity]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  const showAlert = useCallback((title, message) => {
    Alert.alert(title, message, [{ text: "OK" }]);
  }, []);

  const findStudentBySchoolId = async (schoolId) => {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("schoolId", "==", schoolId.trim()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error("No student found with this School ID");
    }
    
    return querySnapshot.docs[0].data();
  };

  const authenticateUser = async (email, password) => {
    const emailForAuth = email.toLowerCase();
    const userCredential = await signInWithEmailAndPassword(auth, emailForAuth, password);
    return userCredential.user;
  };

  const getStudentProfile = async (userId) => {
    const studentDocRef = doc(db, "students", userId);
    const studentDocSnap = await getDoc(studentDocRef);
    
    if (!studentDocSnap.exists()) {
      throw new Error("User profile not found after login");
    }
    
    return studentDocSnap.data();
  };

  const checkProfileCompleteness = (studentData) => {
    const requiredFields = [
      'studentFirstName', 'studentLastName', 'schoolId', 'gradeLevel', 'section'
    ];
    return requiredFields.every(field => studentData[field]?.trim());
  };

  const handleOTPFlow = (user, studentData, isProfileComplete) => {
    const otp = generateOTP();
    
    // In production, this should be sent via your backend service
    console.log(`Generated OTP for ${studentData.email}: ${otp}`);
    
    Alert.alert(
      "OTP Verification Required",
      `A verification code has been sent to ${studentData.email}.\n\nFor testing purposes: ${otp}`,
      [
        {
          text: "OK",
          onPress: () => {
            navigation.navigate("OtpVerification", {
              userId: user.uid,
              email: studentData.email,
              generatedOtp: otp,
              isProfileComplete,
            });
          }
        }
      ]
    );
  };

  const signIn = async () => {
    // Validate inputs
    const validationError = validateInputs(schoolId, password);
    if (validationError) {
      showAlert("Validation Error", validationError);
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      // Step 1: Find student by School ID
      const studentData = await findStudentBySchoolId(schoolId);
      
      if (!studentData.email) {
        throw new Error("Student record is incomplete. Missing email address.");
      }

      // Step 2: Authenticate with Firebase Auth
      const user = await authenticateUser(studentData.email, password);

      // Step 3: Get complete student profile
      const studentProfile = await getStudentProfile(user.uid);

      // Step 4: Check account status
      if (studentProfile.status !== "approved") {
        const statusMessage = `Your account status is: ${studentProfile.status || "pending"}. Please wait for approval or contact support.`;
        showAlert("Account Not Approved", statusMessage);
        await auth.signOut();
        return;
      }

      // Step 5: Check profile completeness and handle OTP
      const isProfileComplete = checkProfileCompleteness(studentProfile);
      // handleOTPFlow(user, studentProfile, isProfileComplete); // Removed OTP flow

      // The RootNavigator will handle the navigation to the correct screen
      // based on the authentication state.

    } catch (error) {
      console.error("Login error:", error);
      
      let errorMessage = "Sign in failed. Please try again.";
      
      // Handle specific Firebase Auth errors
      switch (error.code) {
        case "auth/user-not-found":
        case "auth/wrong-password":
        case "auth/invalid-credential":
          errorMessage = "Invalid School ID or password.";
          break;
        case "auth/invalid-email":
          errorMessage = "An issue occurred with the email format. Please contact support.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your connection and try again.";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later.";
          break;
        default:
          if (error.message.includes("School ID")) {
            errorMessage = error.message;
          }
          break;
      }
      
      showAlert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToForgotPassword = useCallback(() => {
    navigation.navigate("ForgotPass");
  }, [navigation]);

  const navigateToRegister = useCallback(() => {
    navigation.navigate("Register");
  }, [navigation]);

  return (
    <ImageBackground
      source={require('../images/LoginBg.png')}
      style={styles.background}
      resizeMode="cover"
    >
      {/* Decorative Elements */}
      <View style={styles.bushContainer}>
        <Image source={require('../images/Bush.png')} style={styles.bush1} />
        <Image source={require('../images/Bush.png')} style={styles.bush2} />
        <Image source={require('../images/Bush.png')} style={styles.bush3} />
      </View>

      <View style={styles.flowerContainer}>
        <Image source={require('../images/Flower1.png')} style={styles.flower1} />
        <Image source={require('../images/Flower2.png')} style={styles.flower2} />
        <Image source={require('../images/Flower3.png')} style={styles.flower3} />
        <Image source={require('../images/Flower4.png')} style={styles.flower4} />
        <Image source={require('../images/Flower5.png')} style={styles.flower5} />
      </View>

      {/* Stars */}
      {[1, 2, 3, 4, 5, 6].map(index => (
        <Image 
          key={`star-${index}`}
          source={require('../images/Star.png')} 
          style={styles[`star${index}`]} 
        />
      ))}

      <Image source={require('../images/Rainbow.png')} style={styles.rainbow} />

      {/* Title - Fixed position, won't move with keyboard */}
      <Animated.View
        style={[styles.titleContainer, { opacity: titleOpacity }]}
      >
        {titleLetters.map(({ letter, color }, index) => (
          <Text key={index} style={[styles.titleLetter, { color }]}>
            {letter}
          </Text>
        ))}
      </Animated.View>

      {/* Form Container - Separate KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={styles.formKeyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.formSafeArea}>
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome text - only show when keyboard is hidden */}
            {!isKeyboardVisible && (
              <Text style={styles.welcome}>Welcome, Monlimarians!</Text>
            )}
            
            {/* School ID Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="School ID"
                value={schoolId}
                onChangeText={setSchoolId}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
                maxLength={20}
                accessibilityLabel="School ID input"
                accessibilityHint="Enter your school identification number"
              />
            </View>

            {/* Password Input */}
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor={COLORS.gray}
                editable={!isLoading}
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none"
                accessibilityLabel="Password input"
                accessibilityHint="Enter your password"
              />
              <TouchableOpacity 
                onPress={togglePasswordVisibility}
                style={styles.eyeButton}
                disabled={isLoading}
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={24}
                  color={COLORS.gray}
                />
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={signIn}
              disabled={isLoading}
              accessibilityLabel="Login button"
              accessibilityHint="Tap to sign in to your account"
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.buttonText}>Login</Text>
              )}
            </TouchableOpacity>

            {/* Links - only show when keyboard is hidden */}
            {!isKeyboardVisible && (
              <View style={styles.linkContainer}>
                <View style={styles.linkRow}>
                  <Text style={styles.linkText}>Forgot your password? </Text>
                  <TouchableOpacity 
                    onPress={navigateToForgotPassword}
                    disabled={isLoading}
                    accessibilityLabel="Forgot password link"
                  >
                    <Text style={styles.linkAction}>Click here</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.linkRow}>
                  <Text style={styles.linkText}>Don't have an account? </Text>
                  <TouchableOpacity 
                    onPress={navigateToRegister}
                    disabled={isLoading}
                    accessibilityLabel="Sign up link"
                  >
                    <Text style={styles.linkAction}>Sign up here</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  
  // Title stays fixed between trees
  titleContainer: {
    position: 'absolute',
    top: '28%', // Position between trees
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 10, // Above other elements
  },
  
  // Form container takes bottom portion
  formKeyboardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '55%', // Takes bottom 55% of screen
  },
  
  formSafeArea: {
    flex: 1,
  },
  
  formContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start", // Start from top of container
    paddingHorizontal: 24,
    paddingTop: 10, // Small top padding
    marginBottom:90,
  },

  welcome: {
    fontFamily: 'Fredoka-SemiBold',
    fontSize: 22,
    color: COLORS.white,
    textAlign: "center",
    marginBottom: 20,
    marginTop: 20,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  inputContainer: {
    width: "90%",
    marginBottom: 15,
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    height: 48,
    fontSize: 16,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    height: 48,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    width: "90%",
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    height: 50,
    elevation: 3,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  buttonDisabled: {
    backgroundColor: COLORS.primary,
    elevation: 1,
  },
  buttonText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  linkContainer: {
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  linkText: {
    fontSize: 14,
    color: COLORS.white,
    textAlign: "center",
  },
  linkAction: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.yellowBright,
    textDecorationLine: "underline",
    marginBottom: 2,
  },
  titleLetter: {
    fontFamily: 'Fredoka-SemiBold',
    fontSize: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 3, height: 4 },
    textShadowRadius: 6,
  },
  rainbow: {
    position: 'absolute',
    top: -20,
    width: '100%',
    height: '28%',
    alignSelf: 'center',
  },
  // Star styles
  star1: {
    position: 'absolute',
    top: '6%',
    right: '3%',
    width: 15,
    height: 15,
  },
  star2: {
    position: 'absolute',
    top: '22%',
    left: '20%',
    width: 15,
    height: 15,
  },
  star3: {
    position: 'absolute',
    top: '24%',
    right: '17%',
    width: 10,
    height: 10,
  },
  star4: {
    position: 'absolute',
    top: '5%',
    left: '13%',
    width: 10,
    height: 10,
  },
  star5: {
    position: 'absolute',
    top: '10%',
    right: '43%',
    width: 10,
    height: 10,
  },
  star6: {
    position: 'absolute',
    top: '7%',
    left: '3%',
    width: 10,
    height: 10,
  },
  // Flower styles
  flowerContainer: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    right: -40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  flower1: {
    width: 110,
    height: 110,
    left: '10%',
    bottom: '-10%',
    transform: [{ rotate: '50deg' }],
  },
  flower2: {
    width: 100,
    height: 100,
    left: '7%',
    bottom: '-15%',
  },
  flower3: {
    width: 100,
    height: 100,
    left: '2%',
    bottom: '-15%',
  },
  flower4: {
    width: 100,
    height: 100,
    right: '5%',
    bottom: '-11.5%'
  },
  flower5: {
    width: 130,
    height: 130,
    right: '10%',
    bottom: '-25%',
    transform: [{ rotate: '-20deg' }]
  },
  // Bush styles
  bushContainer: {
    position: 'absolute',
    bottom: '-2%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  bush1: {
    width: 200,
    height: 100,
    bottom: '-20%',
    left: '-10%'
  },
  bush2: {
    width: 200,
    height: 100,
    bottom: '-20%',
    left: '-20%',
  },
  bush3: {
    width: 200,
    height: 100,
    bottom: '-20%',
    right: '30%'
  },
});

export default Login;