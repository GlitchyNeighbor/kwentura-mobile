import React, { useState } from 'react';
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../FirebaseConfig';

const ForgotPassword = ({ navigation }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Phone validation regex (basic international format)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

  const validateInput = (input) => {
    const trimmedInput = input.trim();
    
    if (!trimmedInput) {
      return 'Email or phone number is required';
    }
    
    // Check if it's an email or phone number
    const isEmail = trimmedInput.includes('@');
    const isPhone = /^\d/.test(trimmedInput.replace(/[\s\-\(\)\+]/g, ''));
    
    if (isEmail && !emailRegex.test(trimmedInput)) {
      return 'Please enter a valid email address';
    }
    
    if (isPhone && !phoneRegex.test(trimmedInput.replace(/[\s\-\(\)]/g, ''))) {
      return 'Please enter a valid phone number';
    }
    
    if (!isEmail && !isPhone) {
      return 'Please enter a valid email or phone number';
    }
    
    return null;
  };

  const handleSearch = async () => {
    const error = validateInput(emailOrPhone);
    
    if (error) {
      setErrors({ input: error });
      Alert.alert('Invalid Input', error);
      return;
    }

    setErrors({});
    setIsLoading(true);

    const isEmail = emailOrPhone.includes('@');

    if (isEmail) {
      try {
        await sendPasswordResetEmail(auth, emailOrPhone.trim());
        Alert.alert(
          'Password Reset Email Sent',
          'Please check your email to reset your password.'
        );
        navigation.navigate('Login');
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setIsLoading(false);
      }
    } else {
      // For phone numbers, navigate to the verification screen
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Navigate to verification screen
        navigation.navigate('ChooseVerify', { 
          emailOrPhone: emailOrPhone.trim(),
          isEmail: false
        });
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (text) => {
    setEmailOrPhone(text);
    if (errors.input) {
      setErrors({});
    }
  };

  const DecorativeElement = ({ source, style, accessibilityLabel }) => (
    <Image 
      source={source} 
      style={style} 
      accessibilityLabel={accessibilityLabel}
      importantForAccessibility="no"
    />
  );

  return (
    <ImageBackground
      source={require('../images/NewBackground.png')}
      style={styles.background}
      resizeMode="cover"
      accessibilityLabel="Colorful garden background"
    >
      {/* Decorative Elements */}
      <View style={styles.decorativeContainer}>
        {/* Rainbow */}
        <DecorativeElement 
          source={require('../images/Rainbow.png')} 
          style={styles.rainbow} 
          accessibilityLabel="Rainbow decoration"
        />
        
        {/* Stars */}
        <DecorativeElement source={require('../images/Star.png')} style={styles.star1} />
        <DecorativeElement source={require('../images/Star.png')} style={styles.star2} />
        <DecorativeElement source={require('../images/Star.png')} style={styles.star3} />
        <DecorativeElement source={require('../images/Star.png')} style={styles.star4} />

        {/* Bushes */}
        <View style={styles.bushContainer}>
          <DecorativeElement source={require('../images/Bush.png')} style={styles.bush1} />
          <DecorativeElement source={require('../images/Bush.png')} style={styles.bush2} />
          <DecorativeElement source={require('../images/Bush.png')} style={styles.bush3} />
        </View>

        {/* Flowers */}
        <View style={styles.flowerContainer}>
          <DecorativeElement source={require('../images/Flower1.png')} style={styles.flower1} />
          <DecorativeElement source={require('../images/Flower2.png')} style={styles.flower2} />
          <DecorativeElement source={require('../images/Flower3.png')} style={styles.flower3} />
          <DecorativeElement source={require('../images/Flower4.png')} style={styles.flower4} />
          <DecorativeElement source={require('../images/Flower5.png')} style={styles.flower5} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <SafeAreaView style={styles.container}>
            <View style={styles.contentContainer}>
              <Text style={styles.heading} accessibilityRole="header">
                Find your account
              </Text>
              
              <Text style={styles.subheading}>
                Please enter your email or mobile number to search for your account.
              </Text>

              <View style={styles.inputContainer}>
                <TextInput
                  style={[
                    styles.input,
                    errors.input && styles.inputError
                  ]}
                  placeholder="Email or mobile number"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={emailOrPhone}
                  onChangeText={handleInputChange}
                  editable={!isLoading}
                  accessibilityLabel="Email or phone number input"
                  accessibilityHint="Enter your email address or phone number to find your account"
                />
                
                {errors.input && (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {errors.input}
                  </Text>
                )}
              </View>

              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, isLoading && styles.buttonDisabled]}
                  onPress={() => navigation.navigate("Login")}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel and go back to login"
                >
                  <Text style={[styles.cancelButtonText, isLoading && styles.buttonTextDisabled]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.searchButton, isLoading && styles.buttonDisabled]}
                  onPress={handleSearch}
                  disabled={isLoading}
                  accessibilityRole="button"
                  accessibilityLabel="Search for account"
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.searchButtonText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  rainbow: {
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
  container: {
    flex: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    marginHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  heading: {
    fontSize: 28,
    fontFamily: 'Fredoka-SemiBold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    color: '#666',
    width: '90%',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 30,
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 15,
    paddingHorizontal: 18,
    paddingVertical: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#333',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF6B6B',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
    marginTop: 8,
    marginLeft: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: '#FFCF2D',
    backgroundColor: '#fff',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
  },
  cancelButtonText: {
    color: '#FFCF2D',
    fontWeight: 'bold',
    fontSize: 16,
  },
  searchButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#FFCF2D',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    shadowColor: '#FFCF2D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonTextDisabled: {
    opacity: 0.7,
  },
  // Decorative element styles
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
    bottom: '-11.5%',
  },
  flower5: {
    width: 130,
    height: 130,
    right: '10%',
    bottom: '-25%',
    transform: [{ rotate: '-20deg' }],
  },
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
    left: '-10%',
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
    right: '30%',
  },
});

export default ForgotPassword;