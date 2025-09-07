import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image, StatusBar } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from "react-native-vector-icons/Ionicons";
import { auth, db } from "../FirebaseConfig"; // Adjust path as needed
import { doc, onSnapshot } from "firebase/firestore";
import { useProfile } from '../context/ProfileContext';

const HeaderReadStory = ({ navigation, availableLanguages, currentLanguage, onLanguageToggle }) => {
  const { profileData } = useProfile();
  const [userStars, setUserStars] = useState(0);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    let unsubscribe;
    const currentUser = auth.currentUser;

    if (currentUser) {
      const studentDocRef = doc(db, "students", currentUser.uid);
      const unsubscribeUsers = onSnapshot(
        studentDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserStars(userData.stars || 0);
          } else {
            setUserStars(0);
          }
        },
        (error) => {
          console.error("Error fetching user stars:", error);
          setUserStars(0);
        }
      );

      unsubscribe = () => {
        unsubscribeUsers();
      };
    } else {
      setUserStars(0);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleProfilePress = () => {
    navigation.navigate("ProfileStack", { screen: "ProfileMain" });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      
      <View style={styles.headerRow}> 
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >          
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>  

        <View style={styles.rightContainer}>
          <View style={styles.statsContainer}>
            <View style={[styles.ratingBox, { marginRight: 5 }]}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={15} color="#ffde24ff" style={styles.starIcon} />
                <Text style={styles.ratingNumber}>{userStars}</Text>
              </View>
            </View>
            {availableLanguages && availableLanguages.length > 1 && (
              <TouchableOpacity
                style={styles.languageButton}
                onPress={onLanguageToggle}
              >
                <Ionicons name="language-outline" size={15} color="white" />
                <Text style={styles.languageButtonText}>{currentLanguage === 'en-US' ? 'EN' : 'FIL'}</Text>
              </TouchableOpacity>
            )}
          </View>
  
          <TouchableOpacity onPress={handleProfilePress}>
            {profileData.avatarConfig ? (
              <Image
                source={profileData.avatarConfig}
                style={styles.notificationCircle}
              />
            ) : (
              <View style={styles.defaultAvatarContainer}>
                <Ionicons name="person" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: "100%",
    zIndex: 1000,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 30,
    paddingHorizontal: 16,
    paddingVertical: 5,
    color: "#414141",
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  notificationCircle: {
    borderRadius: 100,
    backgroundColor: "#979797bd",
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
  },
  defaultAvatarContainer: {
    borderRadius: 100,
    backgroundColor: "#979797bd",
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF40",
  },
  ratingBox: {
    backgroundColor: '#979797bd',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  starIcon: {
    marginRight: 5,
  },
  ratingNumber: {
    color: 'white',
    fontSize: 12,
  },
  languageButton: {
    backgroundColor: '#979797bd',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  languageButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  backButton: {
    backgroundColor: '#FFCF2D',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  Rainbow: {
    position: 'absolute',
    top: -100,
    width: '170%',
    height: 200,
    alignSelf: 'center',
    opacity: 0.9,
    zIndex: -1,
  },
  star1: {
    position: 'absolute',
    top: 60,
    left: '15%',
    width: 10,
    height: 10,
    opacity: 0.5,
    zIndex: -1,
  },
  star2: {
    position: 'absolute',
    top: 80,
    right: '3%',
    width: 15,
    height: 15,
    opacity: 0.5,
    zIndex: -1,
  },
  star3: {
    position: 'absolute',
    top: 70,
    left: '3%',
    width: 10,
    height: 10,
    opacity: 0.5,
    zIndex: -1,
  },
  star4: {
    position: 'absolute',
    top: 45,
    left: '43%',
    width: 10,
    height: 10,
    opacity: 0.5,
    zIndex: -1,
  },
});

export default HeaderReadStory;