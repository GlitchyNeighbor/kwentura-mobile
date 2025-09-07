import React, { useState, useEffect, useContext } from "react";
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  deleteUser,
  updatePassword,
} from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../FirebaseConfig"; // Corrected import
import Ionicons from "react-native-vector-icons/Ionicons";
import { Checkbox } from "react-native-paper";
import { useAuthFlow } from "../context/AuthFlowContext";

const getFirebaseAuthErrorMessage = (code) => {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/email-already-in-use":
      return "This email address is already registered.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/operation-not-allowed":
      return "Email/password accounts are not enabled.";
    default:
      return "An unexpected error occurred. Please try again.";
  }
};

const Register = ({ navigation }) => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCodeSent, setIsCodeSent] = useState(false); // New state for disabling button
  const { setIsVerifyingEmail, setRegistrationCompleted } = useAuthFlow();
  
  // Effect to check if a user is already signed in (e.g. from a previous attempt)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user && user.emailVerified) {
        setEmail(user.email);
        setIsEmailVerified(true);
      }
    });
    return () => unsubscribe();
  }, []);

  const validatePassword = (pwd) => {
    if (pwd.length < 6) {
      return "Password must be at least 6 characters long.";
    }
    if (!/[A-Z]/.test(pwd)) {
      return "Password must contain at least one capital letter.";
    }
    if (!/\d/.test(pwd)) {
      return "Password must contain at least one number.";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      return "Password must contain at least one symbol.";
    }
    return ""; // No error
  };



  const signUp = async () => {
    if (!firstName || !lastName || !email || !contactNumber || !password || !confirmPassword) {
    Alert.alert("Missing Information", "Please fill in all fields.");
    return;
    }
    if (contactNumber.length !== 11 || !/^\d+$/.test(contactNumber)) {
    Alert.alert("Invalid Contact Number", "Please enter a valid 11-digit contact number.");
    return;
    }
    if (passwordError) {
    Alert.alert("Weak Password", passwordError);
    return;
    }
    if (password !== confirmPassword) {
    Alert.alert("Password Mismatch", "Passwords do not match!");
    return;
    }


    if (isSigningUp) return;
    setIsSigningUp(true);


    try {
    const studentsRef = collection(db, "students");
    const q = query(studentsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);


    if (!querySnapshot.empty) {
    Alert.alert("Email Exists", "This email address is already registered.");
    setIsSigningUp(false);
    return;
    }


    let user = auth.currentUser;
    if (!user || user.email.toLowerCase() !== email.trim().toLowerCase()) {
    Alert.alert("Verification Error", "The verified email does not match. Please start over.");
    setIsSigningUp(false);
    return;
    }


    await updatePassword(user, password);


    await setDoc(doc(db, "students", user.uid), {
    parentFirstName: firstName,
    parentLastName: lastName,
    parentContactNumber: contactNumber,
    email: user.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    studentFirstName: null,
    studentLastName: null,
    schoolId: null,
    gradeLevel: null,
    section: null,
    role: "student",
    status: "pending_approval",
    approvedBy: null,
    activeSessionId: null,
    isArchived: false,
    });


    setIsSigningUp(false);
    setRegistrationCompleted(true);


    if (auth.currentUser) {
    navigation.replace("StudDetails", { userId: auth.currentUser.uid });
    }
    } catch (error) {
    setIsSigningUp(false);
    if (error.code === "auth/email-already-in-use") {
    Alert.alert("Email Exists", "This email is already registered. Please log in or use 'Forgot Password'.", [{ text: "OK" }]);
    } else if (error.code === "auth/requires-recent-login") {
    Alert.alert("Session Expired", "For security, please send the verification code again before continuing.");
    } else {
    console.error("Registration error:", error);
    Alert.alert("Sign Up Failed", getFirebaseAuthErrorMessage(error.code));
    }
    }
  };

const handleVerifyEmail = async () => {
  if (!email.trim()) {
    Alert.alert("Invalid Email", "Please enter an email first.");
    return;
  }
  setIsVerifying(true);
  setIsCodeSent(true); // Disable the button immediately
  setIsVerifyingEmail(true); // Signal to RootNavigator to ignore the next auth change
  try {
    // Check if a user is already logged in (e.g., from a previous failed attempt)
    if (auth.currentUser) {
      // If the email is different, sign out the old user
      if (auth.currentUser.email.toLowerCase() !== email.trim().toLowerCase()) {
        await auth.signOut();
      } else if (auth.currentUser.emailVerified) {
        // If it's the same user and they are already verified
        setIsEmailVerified(true);
        Alert.alert("Already Verified", "Your email is already verified. You can now continue.");
        setIsVerifyingEmail(false); // Reset the flag
        setIsVerifying(false);
        return;
      }
    }

    // Create a temporary user with a secure, random password to send the verification email
    const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
    const tempUser = await createUserWithEmailAndPassword(auth, email.trim(), tempPassword);
    await sendEmailVerification(tempUser.user);

    Alert.alert(
      "Verification Sent",
      `A verification link has been sent to ${email.trim()}. Please check your email (and spam folder), then return here and press "Check Verification".`
    );
  } catch (err) {
    console.error("Email verification error:", err);
    Alert.alert("Error", getFirebaseAuthErrorMessage(err.code));
    setIsCodeSent(false); // Re-enable button on error
  } finally {
    setIsVerifying(false);
    setIsVerifyingEmail(false); // IMPORTANT: Always reset the flag
  }
};

const checkIfVerified = async () => {
  const user = auth.currentUser;
  if (!user) {
    Alert.alert("Verification Error", "Please send the verification email first.");
    return;
  }
  await user.reload();
  if (user.emailVerified) {
    setIsEmailVerified(true);
    Alert.alert("Success!", "Your email has been verified. You can now fill out the rest of the form and continue.");
  } else {
    Alert.alert("Not Verified Yet", "Please click the link in the email we sent you, then try again.");
  }
};

  const handleCancel = async () => {
    const user = auth.currentUser;
    // Only delete if there's a temporary, unverified user.
    if (user && !user.emailVerified) {
      try {
        await deleteUser(user);
        console.log("Temporary user deleted on cancel.");
      } catch (error) {
        console.error("Failed to delete temporary user on cancel:", error);
        // Don't block navigation, but the user might need to sign out manually if they come back.
      }
    }
    navigation.goBack();
  };

  return (
    <ImageBackground
      source={require('../images/Signup.png')}
      style={styles.background}
      resizeMode="cover"
    >

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

    <Image source={require('../images/Star.png')} style={styles.star1} />
    <Image source={require('../images/Star.png')} style={styles.star2} />
    <Image source={require('../images/Star.png')} style={styles.star3} />
    <Image source={require('../images/Star.png')} style={styles.star4} />

    <Image source={require('../images/Rainbow.png')} style={styles.Rainbow} />

    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}

          <Text style={styles.heading}>Start reading with us</Text>
          <Text style={styles.subheading}>
            Please fill the information that is needed.
          </Text>
          <TextInput
            style={styles.input}
            placeholder="Parent's first name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Parent's last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.emailInput}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={styles.verificationRow}>
            <TouchableOpacity
              style={[styles.verifyButton, (isVerifying || isEmailVerified || isCodeSent) && styles.disabledButton]}
              onPress={handleVerifyEmail}
              disabled={isVerifying || isEmailVerified || isCodeSent}
            >
              {isVerifying ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.verifyButtonText}>{isCodeSent ? "Code Sent" : "Send Code"}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.checkVerifyButton, isEmailVerified && styles.disabledButton]}
              onPress={checkIfVerified}
              disabled={isEmailVerified}
            >
              <Text style={styles.verifyButtonText}>
                {isEmailVerified ? "Verified" : "Check Verification"}
              </Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.input}
            placeholder="Parent's contact number"
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            maxLength={11}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(validatePassword(text));
              }}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={24}
                color="#667"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? "eye-off" : "eye"}
                size={24}
                color="#667"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.termsContainer}>
            <View style={styles.termsRow}>
              <Checkbox
                status={termsAgreed ? "checked" : "unchecked"}
                onPress={() => setTermsAgreed(!termsAgreed)}
                color="#FFEA00"
              />
              <View style={styles.termsTextContainer}>
                <Text style={styles.termsText}>By continuing, you agree to our </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("TermsCondition")}
                  style={styles.linkButton}
                >
                  <Text style={styles.termsLink}>Terms & Conditions</Text>
                </TouchableOpacity>
                <Text style={styles.termsText}> and </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("PrivacyPolicy")}
                  style={styles.linkButton}
                >
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                isSigningUp && styles.disabledButton,
              ]}
              onPress={handleCancel}
              disabled={isSigningUp}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.continueButton,
                (!termsAgreed || !isEmailVerified || isSigningUp) && styles.disabledButton,
              ]}
              onPress={signUp}
              disabled={!termsAgreed || !isEmailVerified || isSigningUp}
              >
              {isSigningUp ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.continueButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.linkRow}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkAction}>Click here</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>        
    </ImageBackground>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  Rainbow: {
    position: 'absolute',
    top: -130,
    width: '100%',
    height: '30%',
    alignSelf: 'center',
  },
  star1: {
    position: 'absolute',
    top: '10%',
    left: '20%',
    width: 15,
    height: 15,
  },
  star2: {
    position: 'absolute',
    top: '13%',
    right: '3%',
    width: 15,
    height: 15,
  },
  star3: {
    position: 'absolute',
    top: '13%',
    left: '5%',
    width: 10,
    height: 10,
  },
  star4: {
    position: 'absolute',
    top: '13%',
    right: '38%',
    width: 10,
    height: 10,
  },

  keyboardAvoidingContainer: {
    flex: 1,
    
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 30,
    
    
  },
  headerView: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start", // Align to the start of the scroll view content
    marginBottom: 30, // Space below header
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  heading: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: "black",
    textAlign: "center",
    marginBottom: 5,
  },
  subheading: {
    fontSize: 14,
    color: "black",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: "#929292ff",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "90%",
    borderWidth: 1,
    borderColor: "#929292ff",
    borderRadius: 15,
    paddingHorizontal: 15,
    marginBottom: 10,
    backgroundColor: "#fff",
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
  },
  termsContainer: {
    width: "90%",
    marginTop: 5,
    marginBottom: 15,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  termsTextContainer: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    paddingTop: 8,
    paddingLeft: 4,
  },
  termsText: {
    fontSize: 13,
    color: "white",
    lineHeight: 18,
  },
  termsLink: {
    fontSize: 13,
    color: "#FFEA00",
    fontWeight: "bold",
    textDecorationLine: "underline",
    lineHeight: 18,
  },
  linkButton: {
    // Remove any padding or margin that might affect alignment
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: "#FFCF2D",
    backgroundColor: "#fff",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  cancelButtonText: {
    color: "#FFCF2D",
    fontWeight: "bold",
    fontSize: 16,
  },
  continueButton: {
    flex: 1,
    marginLeft: 10,
    paddingVertical: 15,
    backgroundColor: "#FFCF2D",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
    
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#FFCF2D",
    borderColor: "#FFCF2D",
    opacity: 0.7,
  },
  footerText: {
    marginTop: 20,
    textAlign: "center",
    color: "#FFEA00",
    fontWeight: "bold",
    fontSize: 15,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },
  linkText: {
    fontSize: 13,
    color: "white",
  },
  linkAction: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#FFEA00",
    textDecorationLine: "underline",
  },
  
  flowerContainer: {
    position: 'absolute',
    bottom: -20, // Allow flowers to slightly overflow the bottom
    left: -40,
    right: -40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end', // Align items to the bottom
  },
  flower1: {
    width: 110,
    height: 110,
    left: '10%', // Adjusts the horizontal position of the flower
    bottom: '-10%', // Adjusts the vertical position of the flower
    transform: [{ rotate: '50deg' }],
  },
  flower2: {
    width: 100, // Reduce width
    height: 100, // Reduce height
    left: '7%', // Adjusts the horizontal position of the flower
    bottom: '-15%', // Adjusts the vertical position of the flower
  },
  flower3: {
    width: 100, // Reduce width
    height: 100, // Reduce height
    left: '2%', // Adjusts the horizontal position of the flower
    bottom: '-15%',
  },
  flower4: {
    width: 100, // Reduce width
    height: 100, // Reduce height
    right: '5%', // Adjusts the horizontal position of the flower
    bottom: '-11.5%'
  },
  flower5: {
    width: 130, // Reduce width
    height: 130, // Reduce height
    right: '10%', // Adjusts the horizontal position of the flower
    bottom: '-25%', // Reduce bottom margin
    transform: [{ rotate: '-20deg' }]
  },
  bushContainer: {
    position: 'absolute',
    bottom: '-2%', // Allow flowers to slightly overflow the bottom
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end', // Align items to the bottom
  },
  bush1: {
    width: 200,
    height: 100,
    bottom: '-20%', // Adjusts the vertical position of the flower
    left: '-10%' // Adjusts the horizontal position of the flower
  },
  bush2: {
    width: 200,
    height: 100,
    bottom: '-20%', // Adjusts the vertical position of the flower
    left: '-20%', // Adjusts the horizontal position of the flower
  },
  bush3: {
    width: 200,
    height: 100,
    bottom: '-20%',
    right: '30%'
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginBottom: 10,
    width: "90%",
    textAlign: "left",
  },
verificationRow: {
  flexDirection: "row",
  alignItems: "center",
  width: "90%",
  marginBottom: 10,
  justifyContent: 'space-between',
},
emailInput: {
  borderWidth: 1,
  borderColor: "#929292ff",
  borderRadius: 15,
  paddingHorizontal: 15,
  backgroundColor: "#fff",
  height: 50,
  width: '90%',
  marginBottom: 10,
},
verifyButton: {
  flex: 1,
  marginRight: 5,
  backgroundColor: "#FFCF2D",
  borderRadius: 15,
  paddingHorizontal: 15,
  height: 50,
  justifyContent: "center",
  alignItems: "center",
},
checkVerifyButton: {
  flex: 1,
  marginLeft: 5,
  backgroundColor: "#4CAF50", // A different color to distinguish
  borderRadius: 15,
  paddingHorizontal: 15,
  height: 50,
  justifyContent: "center",
  alignItems: "center",
},
verifyButtonText: {
  color: "#fff",
  fontWeight: "bold",
  fontSize: 14,
},

});

export default Register;