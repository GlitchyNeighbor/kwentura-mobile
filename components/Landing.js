import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ImageBackground,
  Image,
  Animated
} from 'react-native'; 
import { Audio } from 'expo-av';
import AppHeader from "./HeaderLanding";

const Landing = ({ navigation }) => {
  const [sound, setSound] = useState();

  // Create animated values for each animal
  const animatedValues = {
    // For bounce on click
    bee: useRef(new Animated.Value(1)).current,
    parrot: useRef(new Animated.Value(1)).current,
    ladybug: useRef(new Animated.Value(1)).current,
    squirrel: useRef(new Animated.Value(1)).current,
    fox: useRef(new Animated.Value(1)).current,
    frog: useRef(new Animated.Value(1)).current,
    chicken: useRef(new Animated.Value(1)).current,
    lion: useRef(new Animated.Value(1)).current,
    capybara: useRef(new Animated.Value(1)).current,
    ostrich: useRef(new Animated.Value(1)).current,
    snail: useRef(new Animated.Value(1)).current,

    // For continuous floating movement
    beePos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    parrotPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    ladybugPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    squirrelPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    foxPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    frogPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    chickenPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    lionPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    capybaraPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    ostrichPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
    snailPos: useRef(new Animated.ValueXY({ x: 0, y: 0 })).current,
  };

  // Load the sound when the component mounts
  useEffect(() => {
    const loadSound = async () => {
      console.log('Loading sound...');
      try {
        const { sound } = await Audio.Sound.createAsync(
           require('../assets/sounds/boink.mp3')
        );
        setSound(sound);
        console.log('Sound loaded successfully');
      } catch (error) {
        console.error('Failed to load the sound', error);
      }
    };

    loadSound();

    // Unload the sound when the component unmounts
    return () => {
      if (sound) {
        console.log('Unloading sound...');
        sound.unloadAsync();
      }
    };
  }, []); // The empty dependency array ensures this runs only once

  // Function for continuous, random floating animation
  const createFloatingAnimation = (positionValue) => {
    const randomX = Math.random() * 10 - 5; // Random value between -5 and 5
    const randomY = Math.random() * 10 - 5; // Random value between -5 and 5
    const duration = Math.random() * 2000 + 3000; // Random duration between 3-5 seconds

    Animated.timing(positionValue, {
      toValue: { x: randomX, y: randomY },
      duration: duration,
      useNativeDriver: true,
    }).start(() => {
      // Loop the animation
      createFloatingAnimation(positionValue);
    });
  };

  // Start floating animations for all animals on mount
  useEffect(() => {
    Object.keys(animatedValues).forEach(key => {
      if (key.endsWith('Pos')) {
        const positionValue = animatedValues[key];
        // Start each animation with a random delay to desynchronize them
        const randomDelay = Math.random() * 2000;
        setTimeout(() => {
          createFloatingAnimation(positionValue);
        }, randomDelay);
      }
    });
  }, []);

  // Function to handle animal clicks with bounce animation and sound
  const handleAnimalClick = async (animalName) => {
    const animatedValue = animatedValues[animalName.toLowerCase()];
    
    // Play the sound if it's loaded
    if (sound) {
      await sound.replayAsync(); // Replay the sound from the beginning
    }
    
    // Create bounce animation
    Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    console.log(`Bounced ${animalName} with boink sound!`);
  };

  const renderAnimal = (animalName, imagePath, style) => {
    const animatedValue = animatedValues[animalName.toLowerCase()];
    const positionValue = animatedValues[`${animalName.toLowerCase()}Pos`];
    
    return (
      <TouchableWithoutFeedback
        key={animalName}
        onPress={() => handleAnimalClick(animalName)}
      >
        <Animated.View 
          style={[
            style,
            {
              transform: [
                { scale: animatedValue },
                ...positionValue.getTranslateTransform()
              ],
            },
          ]}
        >
          <Image source={imagePath} style={styles.animalImage} />
        </Animated.View>
      </TouchableWithoutFeedback>
    );
  };

  return (
    <ImageBackground
      source={require('../images/Background.png')}
      style={styles.background}
      resizeMode="cover"
      accessible={false} // Mark background as not important for accessibility
    >
      {/* Header with stars and rainbow at the top */}
      <AppHeader
        navigation={navigation}
        leftIconType="drawer"
        showSearch={true}
      />

      {/* Main container for all interactive and decorative elements */}
      <View style={styles.mainContainer}>
        {/* Animals positioned in the background layer */}
        <View style={styles.animalsContainer}>
          {/* Top area animals - smaller and more distant */}
          {renderAnimal('Bee', require('../images/animals/Bee.png'), styles.bee)}
          {renderAnimal('Parrot', require('../images/animals/Parrot.png'), styles.parrot)}
          {renderAnimal('Ladybug', require('../images/animals/Ladybug.png'), styles.ladybug)}
          
          {/* Middle area animals - medium size */}
          {renderAnimal('Squirrel', require('../images/animals/Squirrel.png'), styles.squirrel)}
          {renderAnimal('Fox', require('../images/animals/Fox.png'), styles.fox)}
          {renderAnimal('Frog', require('../images/animals/Frog.png'), styles.frog)}
          {renderAnimal('Chicken', require('../images/animals/Chicken.png'), styles.chicken)}
          
          {/* Lower area animals - larger and closer */}
          {renderAnimal('Lion', require('../images/animals/Lion.png'), styles.lion)}
          {renderAnimal('Capybara', require('../images/animals/Capybara.png'), styles.capybara)}
          {renderAnimal('Ostrich', require('../images/animals/Ostrich.png'), styles.ostrich)}
          {renderAnimal('Snail', require('../images/animals/Snail.png'), styles.snail)}
        </View>

        {/* Decorative elements */}
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

        {/* UI elements (Title and Buttons) */}
        <SafeAreaView style={styles.safeArea} pointerEvents="box-none">
          <View style={styles.contentContainer} pointerEvents="box-none">
            <View style={styles.titleContainer}>
              <Text style={[styles.titleLetter, { color: '#E63B3B' }]}>K</Text>
              <Text style={[styles.titleLetter, { color: '#386CD2' }]}>w</Text>
              <Text style={[styles.titleLetter, { color: '#FFD915' }]}>e</Text>
              <Text style={[styles.titleLetter, { color: '#52FF00' }]}>n</Text>
              <Text style={[styles.titleLetter, { color: '#FFD915' }]}>t</Text>
              <Text style={[styles.titleLetter, { color: '#386CD2' }]}>u</Text>
              <Text style={[styles.titleLetter, { color: '#52FF00' }]}>r</Text>
              <Text style={[styles.titleLetter, { color: '#E63B3B' }]}>a</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.signUpButton]}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.signUpButtonText]}>
                Sign up
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.loginButton]}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, styles.loginButtonText]}>Login</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    position: 'relative',
  },
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: 60,
    // This zIndex ensures the buttons are on top of the animals
    // within the mainContainer.
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '55%',
  },
  titleLetter: {
    fontFamily: 'Fredoka-SemiBold',
    fontSize: 50,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 3, height: 4 },
    textShadowRadius: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  buttonContainer: {
    width: "70%",
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: '20%'
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 20,
  },
  signUpButton: {
    backgroundColor: '#4ECDC4',
    marginRight: 12,
    borderWidth: 3,
    borderColor: 'white',
  },
  loginButton: {
    backgroundColor: '#FF6B6B',
    borderWidth: 3,
    borderColor: 'white',
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  signUpButtonText: {
    color: "white",
  },
  loginButtonText: {
    color: "white",
  },
  flowerContainer: {
    position: 'absolute',
    bottom: -20,
    left: -40,
    right: -40,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 1,
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
  bushContainer: {
    position: 'absolute',
    bottom: '-2%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    zIndex: 0,
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
  // Animals container
  animalsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    // This zIndex places the animals behind the buttons.
    // It's absolutely positioned to fill the mainContainer.
  },
  // Common style for animal images
  animalImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  // Top area animals (smaller, more distant)
  bee: {
    position: 'absolute',
    width: 35,
    height: 35,
    bottom: '5%',
    left: '15%',
    opacity: 0.8,
  },
  parrot: {
    position: 'absolute',
    width: 60,
    height: 60,
    top: '22%',
    right: '7%',
    opacity: 0.8,
  },
  ladybug: {
    position: 'absolute',
    width: 30,
    height: 30,
    bottom: '7%',
    right: '37%',
    opacity: 0.8,
  },
  // Middle area animals (medium size)
  squirrel: {
    position: 'absolute',
    width: 50,
    height: 50,
    bottom: '48%',
    left: '5%',
    opacity: 0.9,
  },
  fox: {
    position: 'absolute',
    width: 90,
    height: 90,
    bottom: '25%',
    right: '10%',
    opacity: 0.9,
  },
  cat: {
    position: 'absolute',
    width: 80,
    height: 80,
    bottom: '15%',
    left: '0%',
    opacity: 0.9,
  },
  frog: {
    position: 'absolute',
    width: 40,
    height: 40,
    bottom: '40%',
    right: '7%',
    opacity: 0.9,
  },
  chicken: {
    position: 'absolute',
    width: 60,
    height: 60,
    bottom: '30%',
    left: '40%',
    opacity: 0.9,
  },
  // Lower area animals (larger, closer)
  lion: {
    position: 'absolute',
    width: 120,
    height: 120,
    bottom: '18%',
    left: '0%',
    opacity: 1,
  },
  dog: {
    position: 'absolute',
    width: 60,
    height: 60,
    bottom: '20%',
    right: '35%',
    opacity: 1,
  },
  capybara: {
    position: 'absolute',
    width: 70,
    height: 70,
    bottom: '35%',
    left: '10%',
    opacity: 1,
  },
  kangaroo: {
    position: 'absolute',
    width: 110,
    height: 110,
    bottom: '20%',
    right: '1%',
    opacity: 1,
  },
  ostrich: {
    position: 'absolute',
    width: 130,
    height: 130,
    bottom: '43%',
    left: '35%',
    opacity: 1,
  },
  snail: {
    position: 'absolute',
    width: 40,
    height: 40,
    bottom: '10%',
    right: '2%',
    opacity: 1,
  },
});

export default Landing;