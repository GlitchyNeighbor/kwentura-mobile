import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { auth, db } from "../FirebaseConfig"; // Adjust path as needed
import { doc, onSnapshot } from "firebase/firestore";
import { useProfile } from '../context/ProfileContext';

const HeaderViewStory = ({ navigation }) => {
  const [userStars, setUserStars] = useState(0);
  const { profileData } = useProfile();

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
    <View style={styles.container}>
      <Image source={require('../images/Star.png')} style={styles.star1} />
      <Image source={require('../images/Star.png')} style={styles.star2} />
      <Image source={require('../images/Star.png')} style={styles.star3} />
      <Image source={require('../images/Star.png')} style={styles.star4} />
    
      <Image source={require('../images/Rainbow.png')} style={styles.Rainbow} />        
      
      <View style={styles.headerRow}> 
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >          
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>  

        <View style={styles.rightContainer}>
          <View style={styles.statsContainer}>
            <View style={styles.ratingBox}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={15} color="#ffde24ff" style={styles.starIcon} />
                <Text style={styles.ratingNumber}>{userStars}</Text>
              </View>
            </View>
          </View>
     
            {profileData.avatarConfig ? (
              <Image
                source={profileData.avatarConfig}
                style={styles.notificationCircle}
              />
            ) : (
              <View style={styles.defaultAvatarContainer} />
            )}
  
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ratingBox: {
    backgroundColor: '#979797bd',
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center'
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
  ratingNumber: {
    color: 'white',
    fontSize: 12,
  },
  Rainbow: {
    position: 'absolute',
    top: '-520%',
    width: '150%',
    height: '730%',
    alignSelf: 'center',
  },
  star1: {
    position: 'absolute',
    top: '100%',
    left: '20%',
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
    top: '190%',
    left: '1%',
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
  backButton: {
    backgroundColor: '#FFCF2D',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
});

export default HeaderViewStory;