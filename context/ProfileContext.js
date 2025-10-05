import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { auth, db } from '../FirebaseConfig';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { getUnlockedAnimalAvatars } from '../components/rewardsConfig'; // Adjust path as needed

const ProfileContext = createContext(null);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

export const ProfileProvider = ({ children }) => {
  const [profileData, setProfileData] = useState({
    parentFirstName: "",
    parentLastName: "",
    email: "",
    contactNumber: "",
    studentFirstName: "",
    studentLastName: "",
    studentId: "",
    gradeLevel: "",
    section: "",
    avatarConfig: null
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [unlockedAnimalAvatars, setUnlockedAnimalAvatars] = useState([]);

  // Effect to listen for unlocked animal avatars
  useEffect(() => {
    const handleUserData = (user) => {
      if (user) {
        setLoading(true);
        const docRef = doc(db, "students", user.uid);
  
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            
            // Process unlocked avatars
            const unlockedRewardsArr = data.unlockedRewards || [];
            const unlockedSet = new Set(unlockedRewardsArr);
            const animalAvatars = getUnlockedAnimalAvatars(unlockedSet);
            setUnlockedAnimalAvatars(animalAvatars.length > 0 ? animalAvatars : []);
  
            // Determine avatarConfig
            let avatarConfig = null;
            if (animalAvatars.length > 0) {
              if (typeof data.avatarConfig === "number" && animalAvatars[data.avatarConfig]) {
                avatarConfig = animalAvatars[data.avatarConfig];
              } else if (animalAvatars.includes(data.avatarConfig)) {
                avatarConfig = data.avatarConfig;
              } else {
                avatarConfig = animalAvatars[0];
              }
            }
  
            // Set profile data
            setProfileData({
              parentFirstName: data.parentFirstName || "",
              parentLastName: data.parentLastName || "",
              email: data.email || "",
              contactNumber: data.parentContactNumber || "",
              studentFirstName: data.studentFirstName || "",
              studentLastName: data.studentLastName || "",
              studentId: data.schoolId || "",
              gradeLevel: data.gradeLevel || "",
              section: data.section || "",
              avatarConfig: avatarConfig,
            });
          } else {
            // Handle case where user document doesn't exist
            setProfileData({
              parentFirstName: "",
              parentLastName: "",
              email: "",
              contactNumber: "",
              studentFirstName: "",
              studentLastName: "",
              studentId: "",
              gradeLevel: "",
              section: "",
              avatarConfig: null,
            });
            setUnlockedAnimalAvatars([]);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error listening to user data:", error);
          setLoading(false);
        });
  
        return unsubscribe;
      } else {
        // Handle user logout
        setProfileData({
          parentFirstName: "",
          parentLastName: "",
          email: "",
          contactNumber: "",
          studentFirstName: "",
          studentLastName: "",
          studentId: "",
          gradeLevel: "",
          section: "",
          avatarConfig: null,
        });
        setUnlockedAnimalAvatars([]);
        setLoading(false);
        return () => {};
      }
    };
  
    const unsubscribeAuth = auth.onAuthStateChanged(handleUserData);
  
    return () => {
      unsubscribeAuth();
    };
  }, []);

  const updateAvatar = useCallback(async (newAvatar) => {
    const user = auth.currentUser;
    if (!user) return false;

    try {
      const docRef = doc(db, "students", user.uid);
      const avatarIndex = unlockedAnimalAvatars.indexOf(newAvatar);
      await updateDoc(docRef, {
        avatarConfig: avatarIndex,
        updatedAt: serverTimestamp(),
      });
      setProfileData(prev => ({ ...prev, avatarConfig: newAvatar }));
      return true;
    } catch (error) {
      console.error("Error updating avatar:", error);
      // Alert.alert("Error", "Failed to save avatar: " + error.message);
      return false;
    }
  }, [unlockedAnimalAvatars]);

  const saveChanges = useCallback(async (updates) => {
    const user = auth.currentUser;
    if (!user || isSaving) return false;

    setIsSaving(true);
    try {
      const docRef = doc(db, "students", user.uid);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      setProfileData(prev => ({ ...prev, ...updates }));
      // Alert.alert("Success", "Changes saved successfully!");
      return true;
    } catch (error) {
      console.error("Error saving changes:", error);
      // Alert.alert("Error", "Failed to save changes: " + error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [isSaving]);

  const value = {
    profileData,
    loading,
    isSaving,
    updateAvatar,
    saveChanges,
    unlockedAnimalAvatars,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
