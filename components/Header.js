import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { auth, db } from "../FirebaseConfig"; // Adjust path as needed
import { doc, onSnapshot } from "firebase/firestore";
import { rewardsConfig } from "./rewardsConfig";

const AVATAR_OPTIONS = [
  require("../assets/avatars/boy.png"),
  require("../assets/avatars/boy2.png"),
  require("../assets/avatars/boy3.png"),
  require("../assets/avatars/boy4.png"),
  require("../assets/avatars/boy5.png"),
  require("../assets/avatars/boy6.png"),
  require("../assets/avatars/girl.png"),
  require("../assets/avatars/girl2.png"),
  require("../assets/avatars/girl3.png"),
  require("../assets/avatars/girl4.png"),
  require("../assets/avatars/girl5.png"),
  require("../assets/avatars/girl6.png"),
];

const Header = ({ navigation, leftIconType = "drawer" }) => {
  const [avatarConfig, setAvatarConfig] = useState(null);
  const [userStars, setUserStars] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;
    const currentUser = auth.currentUser;

    if (currentUser) {
      // Listen to users collection for stars data
      const userDocRef = doc(db, "users", currentUser.uid);
      const unsubscribeUsers = onSnapshot(
        userDocRef,
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

      // Listen to students collection for avatar data
      const studentDocRef = doc(db, "students", currentUser.uid);
      const unsubscribeStudents = onSnapshot(
        studentDocRef,
        (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            // Use animal avatar index
            if (typeof data.avatarConfig === "number") {
              setAvatarConfig(rewardsConfig[data.avatarConfig]?.image);
            } else {
              setAvatarConfig(data.avatarConfig ?? null);
            }
          } else {
            setAvatarConfig(null);
          }
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching user data:", error);
          setAvatarConfig(null);
          setLoading(false);
        }
      );

      unsubscribe = () => {
        unsubscribeUsers();
        unsubscribeStudents();
      };
    } else {
      setAvatarConfig(null);
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
      <Image source={require('../images/Star.png')} style={styles.star1} />
      <Image source={require('../images/Star.png')} style={styles.star2} />
      <Image source={require('../images/Star.png')} style={styles.star3} />
      <Image source={require('../images/Star.png')} style={styles.star4} />
      
      <Image source={require('../images/Rainbow.png')} style={styles.Rainbow} />  

      <View style={styles.headerRow}>
        {/* Fixed: Single TouchableOpacity for avatar */}
        <TouchableOpacity onPress={handleProfilePress}>
          {avatarConfig ? (
            <Image
              source={avatarConfig}
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
          {/* You can add an icon here if needed */}
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
  star1: {
    position: 'absolute',
    top: '133%',
    left: '15%',
    width: 10,
    height: 10,
  },
  star2: {
    position: 'absolute',
    top: '259%',
    right: '3%',
    width: 15,
    height: 15,
  },
  star3: {
    position: 'absolute',
    top: '225%',
    left: '3%',
    width: 10,
    height: 10,
  },
  star4: {
    position: 'absolute',
    top: '24%',
    left: '43%',
    width: 10,
    height: 10,
  },
});

export default Header;