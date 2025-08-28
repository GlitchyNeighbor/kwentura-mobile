import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { auth, db } from "../FirebaseConfig"; // Adjust path as needed
import { doc, onSnapshot } from "firebase/firestore";
import { useProfile } from '../context/ProfileContext';

const Header = ({ navigation, leftIconType = "drawer" }) => {
  const { profileData } = useProfile();
  const [userStars, setUserStars] = useState(0);
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleLeftIconPress = () => {
    if (leftIconType === "drawer") {
      navigation.openDrawer();
    }
  };

  // Fixed: Navigate to ProfileStack instead of ProfileTab
  const handleProfilePress = () => {
    navigation.navigate("ProfileStack", { screen: "ProfileMain" });
  };

  return (
    <View style={styles.container}>
      
      <View style={styles.starContainer}>
        {Array.from({ length: userStars }).map((_, index) => (
          <Image
            key={index}
            source={require('../images/Star.png')}
            style={styles.dynamicStar}
          />
        ))}
      </View>
      <Image source={require('../images/Rainbow.png')} style={styles.Rainbow} />  

      <View style={styles.headerRow}>
        <TouchableOpacity onPress={handleProfilePress}>
          {profileData.avatarConfig ? (
            <Image
              source={profileData.avatarConfig}
              style={styles.notificationCircle}
            />
          ) : (
            <Image
              source={require("../assets/avatars/default_profile.png")}
              style={styles.notificationCircle}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleLeftIconPress}
          style={styles.iconButton}
        >
        </TouchableOpacity>  

        <View style={[styles.ratingBox, { marginLeft: 'auto' }]}>
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={15} color="#ffde24ff" style={styles.starIcon} />
            <Text style={styles.ratingNumber}>{userStars}</Text>
          </View>
        </View>        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationCircle: {
    borderRadius: 100,
    backgroundColor: "#979797bd",
    width: 35,
    height: 35,
    justifyContent: "center",
    alignItems: "center",
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
  container: {
    width: "100%",
    paddingTop: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 30,
    paddingHorizontal: 16,
    color: "#414141",
    
  },
  iconButton: {
    padding: 5,
    color: "#414141",
  },
  titleText: {
    fontWeight: "bold",
    fontSize: 28,
    color: "#fff",
    fontFamily: "sans-serif",
    letterSpacing: 0.5,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: -2,
    backgroundColor: "#ff2222",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 2,
    borderWidth: 2,
    borderColor: "#fff",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    includeFontPadding: false,
    textAlignVertical: "center",  
  },
  ratingNumber: {
    color: 'white',
    fontSize: 12,
  },
  Rainbow: {
    position: 'absolute',
    top: '-497%',
    width: '150%',
    height: '720.5%',
    alignSelf: 'center',
  },
  starContainer: {
    position: 'absolute',
    top: '133%',
    left: '15%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '70%', // Adjust as needed
  },
  dynamicStar: {
    width: 15,
    height: 15,
    margin: 2, // Adjust spacing between stars
  },
});

export default Header;