import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { onSnapshot } from "firebase/firestore";
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Linking,
  ImageBackground,
  AppState,
  Alert,
  Dimensions
} from "react-native";
import { auth, db } from "../FirebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut as firebaseSignOut } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AppHeader from "./HeaderProfile";
import { useProfile } from '../context/ProfileContext';
import { getUnlockedAnimalAvatars } from "./rewardsConfig";

const DAILY_USAGE_LIMIT_MS = 90 * 60 * 1000;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const useTimer = (userId) => {
  const [appIsGloballySleeping, setAppIsGloballySleeping] = useState(false);
  const [timerDisplay, setTimerDisplay] = useState("--:--:--");
  const [timerTrigger, setTimerTrigger] = useState(0);

  const usageTimeoutIdRef = useRef(null);
  const countdownIntervalIdRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  const activeSessionStartTimeRef = useRef(null);
  const initialDurationForCountdownRef = useRef(0);

  // Utility functions
  const formatTime = useCallback((ms) => {
    if (ms < 0) ms = 0;
    let totalSeconds = Math.floor(ms / 1000);
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    const pad = (num) => String(num).padStart(2, '0');
    return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
  }, []);

  // Storage key generators
  const getSleepKey = useCallback((id) => `appSleepUntilNextDayTimestamp_${id}`, []);
  const getCumulativeUsageKey = useCallback((id) => `appCumulativeUsageMs_${id}`, []);
  const getLastUsageDateKey = useCallback((id) => `appLastUsageDate_${id}`, []);

  const saveCurrentUsage = useCallback(async (userIdForSave, isBackgrounding = false) => {
    if (!userIdForSave) {
      const fallbackUserId = auth.currentUser?.uid;
      if (!fallbackUserId) return 0;
      userIdForSave = fallbackUserId;
    }

    if (activeSessionStartTimeRef.current && !appIsGloballySleeping) {
      const timeSpentActiveInSessionMs = Date.now() - activeSessionStartTimeRef.current;
      let cumulativeUsageMs = 0;
      
      try {
        const storedCumulativeUsageStr = await AsyncStorage.getItem(getCumulativeUsageKey(userIdForSave));
        if (storedCumulativeUsageStr) {
          cumulativeUsageMs = parseInt(storedCumulativeUsageStr, 10) || 0;
        }
        
        const newCumulativeUsage = cumulativeUsageMs + timeSpentActiveInSessionMs;
        await AsyncStorage.setItem(getCumulativeUsageKey(userIdForSave), newCumulativeUsage.toString());
        await AsyncStorage.setItem(getLastUsageDateKey(userIdForSave), new Date().toDateString());

        if (isBackgrounding) {
          const remainingTotal = DAILY_USAGE_LIMIT_MS - newCumulativeUsage;
          setTimerDisplay(formatTime(Math.max(0, remainingTotal)));
        }
        
        activeSessionStartTimeRef.current = null;
        return newCumulativeUsage;
      } catch (error) {
        console.error('Error saving usage data:', error);
        return 0;
      }
    }

    try {
      const storedCumulativeUsageStr = await AsyncStorage.getItem(getCumulativeUsageKey(userIdForSave));
      return storedCumulativeUsageStr ? (parseInt(storedCumulativeUsageStr, 10) || 0) : 0;
    } catch (error) {
      console.error('Error reading usage data:', error);
      return 0;
    }
  }, [appIsGloballySleeping, getCumulativeUsageKey, getLastUsageDateKey, formatTime]);

  const activateRestMode = useCallback(async () => {
    if (appIsGloballySleeping && !usageTimeoutIdRef.current && !countdownIntervalIdRef.current) {
      return;
    }

    await saveCurrentUsage(userId);

    setAppIsGloballySleeping(true);
    if (usageTimeoutIdRef.current) {
      clearTimeout(usageTimeoutIdRef.current);
      usageTimeoutIdRef.current = null;
    }
    if (countdownIntervalIdRef.current) {
      clearInterval(countdownIntervalIdRef.current);
      countdownIntervalIdRef.current = null;
    }
    activeSessionStartTimeRef.current = null;

    try {
      await AsyncStorage.setItem(getSleepKey(userId), new Date().toISOString());
      await AsyncStorage.setItem(getCumulativeUsageKey(userId), DAILY_USAGE_LIMIT_MS.toString());
      await AsyncStorage.setItem(getLastUsageDateKey(userId), new Date().toDateString());
    } catch (error) {
      console.error('Failed to set sleep timestamp:', error);
    }
  }, [userId, appIsGloballySleeping, saveCurrentUsage, getSleepKey, getCumulativeUsageKey, getLastUsageDateKey]);

  const startTimer = useCallback((durationMs) => {
    setAppIsGloballySleeping(false);
    activeSessionStartTimeRef.current = Date.now();
    initialDurationForCountdownRef.current = durationMs;

    if (usageTimeoutIdRef.current) clearTimeout(usageTimeoutIdRef.current);
    if (countdownIntervalIdRef.current) clearInterval(countdownIntervalIdRef.current);

    usageTimeoutIdRef.current = setTimeout(activateRestMode, durationMs);

    const updateDisplay = () => {
      if (!activeSessionStartTimeRef.current || appIsGloballySleeping) {
        if (countdownIntervalIdRef.current) {
          clearInterval(countdownIntervalIdRef.current);
          countdownIntervalIdRef.current = null;
        }
        return;
      }
      
      const elapsedInActiveSegment = Date.now() - activeSessionStartTimeRef.current;
      const currentRemainingTime = initialDurationForCountdownRef.current - elapsedInActiveSegment;

      if (currentRemainingTime <= 0) {
        setTimerDisplay(formatTime(0));
        if (countdownIntervalIdRef.current) {
          clearInterval(countdownIntervalIdRef.current);
          countdownIntervalIdRef.current = null;
        }
      } else {
        setTimerDisplay(formatTime(currentRemainingTime));
      }
    };
    
    updateDisplay();
    countdownIntervalIdRef.current = setInterval(updateDisplay, 1000);
  }, [activateRestMode, appIsGloballySleeping, formatTime]);

  const checkAppStatusAndInitializeTimer = useCallback(async () => {
    const now = new Date();
    const todayDateStr = now.toDateString();

    try {
      const sleepTimestampStr = await AsyncStorage.getItem(getSleepKey(userId));
      if (sleepTimestampStr) {
        const sleepUntilDate = new Date(sleepTimestampStr);
        if (sleepUntilDate.toDateString() === todayDateStr || sleepUntilDate > now) {
          setAppIsGloballySleeping(true);
          if (usageTimeoutIdRef.current) clearTimeout(usageTimeoutIdRef.current);
          if (countdownIntervalIdRef.current) clearInterval(countdownIntervalIdRef.current);
          activeSessionStartTimeRef.current = null;
          setTimerDisplay(formatTime(0));
          return;
        } else {
          await AsyncStorage.removeItem(getSleepKey(userId));
          await AsyncStorage.removeItem(getCumulativeUsageKey(userId));
          await AsyncStorage.removeItem(getLastUsageDateKey(userId));
        }
      }
      
      setAppIsGloballySleeping(false);

      let cumulativeUsageMs = 0;
      const lastUsageDateStr = await AsyncStorage.getItem(getLastUsageDateKey(userId));
      const storedCumulativeUsageStr = await AsyncStorage.getItem(getCumulativeUsageKey(userId));

      if (lastUsageDateStr === todayDateStr && storedCumulativeUsageStr) {
        cumulativeUsageMs = parseInt(storedCumulativeUsageStr, 10) || 0;
      } else {
        cumulativeUsageMs = 0;
        await AsyncStorage.setItem(getCumulativeUsageKey(userId), "0");
        await AsyncStorage.setItem(getLastUsageDateKey(userId), todayDateStr);
      }

      const remainingActiveTimeMs = DAILY_USAGE_LIMIT_MS - cumulativeUsageMs;

      if (remainingActiveTimeMs <= 0) {
        activateRestMode();
      } else {
        startTimer(remainingActiveTimeMs);
      }
    } catch (error) {
      console.error('Error checking app status:', error);
    }
  }, [userId, getSleepKey, getCumulativeUsageKey, getLastUsageDateKey, formatTime, activateRestMode, startTimer]);

  const handleAppStateChange = useCallback(async (nextAppState) => {
    const currentAppState = appStateRef.current;
    appStateRef.current = nextAppState;

    if (appIsGloballySleeping) {
      if (nextAppState === 'active') {
        if (usageTimeoutIdRef.current) clearTimeout(usageTimeoutIdRef.current);
        if (countdownIntervalIdRef.current) clearInterval(countdownIntervalIdRef.current);
        activeSessionStartTimeRef.current = null;
        setTimerDisplay(formatTime(0));
      }
      return;
    }

    if (currentAppState.match(/inactive|background/) && nextAppState === 'active') {
      if (usageTimeoutIdRef.current) clearTimeout(usageTimeoutIdRef.current);
      if (countdownIntervalIdRef.current) clearInterval(countdownIntervalIdRef.current);
      await checkAppStatusAndInitializeTimer();
    } else if (currentAppState === 'active' && nextAppState.match(/inactive|background/)) {
      if (usageTimeoutIdRef.current) clearTimeout(usageTimeoutIdRef.current);
      if (countdownIntervalIdRef.current) clearInterval(countdownIntervalIdRef.current);
      await saveCurrentUsage(userId, true);
    }
  }, [appIsGloballySleeping, checkAppStatusAndInitializeTimer, saveCurrentUsage, userId, formatTime]);

  const handleRestartCountdown = useCallback(async () => {
    if (!userId) return;
    
    if (usageTimeoutIdRef.current) {
      clearTimeout(usageTimeoutIdRef.current);
      usageTimeoutIdRef.current = null;
    }
    if (countdownIntervalIdRef.current) {
      clearInterval(countdownIntervalIdRef.current);
      countdownIntervalIdRef.current = null;
    }
    activeSessionStartTimeRef.current = null;

    try {
      await AsyncStorage.removeItem(getSleepKey(userId));
      await AsyncStorage.removeItem(getCumulativeUsageKey(userId));
      await AsyncStorage.removeItem(getLastUsageDateKey(userId));
    } catch (error) {
      console.error('Failed to clear storage on restart:', error);
    }
    
    setAppIsGloballySleeping(false);
    setTimerTrigger(prev => prev + 1);
  }, [userId, getSleepKey, getCumulativeUsageKey, getLastUsageDateKey]);

  // Timer effect
  useEffect(() => {
    if (!userId) {
      activeSessionStartTimeRef.current = null;
      setTimerDisplay("--:--:--");
      setAppIsGloballySleeping(false);
      return;
    }

    if (usageTimeoutIdRef.current) clearTimeout(usageTimeoutIdRef.current);
    if (countdownIntervalIdRef.current) clearInterval(countdownIntervalIdRef.current);

    const appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
    checkAppStatusAndInitializeTimer();

    return () => {
      const cleanup = async () => {
        if (userId && activeSessionStartTimeRef.current && !appIsGloballySleeping) {
          await saveCurrentUsage(userId, false);
        }
        appStateSubscription?.remove();
        if (usageTimeoutIdRef.current) {
          clearTimeout(usageTimeoutIdRef.current);
          usageTimeoutIdRef.current = null;
        }
        if (countdownIntervalIdRef.current) {
          clearInterval(countdownIntervalIdRef.current);
          countdownIntervalIdRef.current = null;
        }
      };
      cleanup().catch(console.error);
    };
  }, [userId, timerTrigger, handleAppStateChange, checkAppStatusAndInitializeTimer, saveCurrentUsage, appIsGloballySleeping]);

  return {
    appIsGloballySleeping,
    timerDisplay,
    handleRestartCountdown,
    formatTime
  };
};



// Components
const LoadingScreen = () => (
  <SafeAreaView style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#FFCF2D" />
    <Text style={styles.loadingText}>Loading Profile...</Text>
  </SafeAreaView>
);

const RestModeOverlay = ({ onRestart, formatTime }) => {
  const restMessage = useMemo(() => {
    const totalMinutes = Math.floor(DAILY_USAGE_LIMIT_MS / (60 * 1000));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let message = "You've used the app for ";
    if (hours > 0) message += `${hours} hour${hours > 1 ? 's' : ''} `;
    if (minutes > 0 || hours === 0) message += `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    message = message.trim();
    message += " today. That's enough for today. The app will be available again tomorrow.";
    return message;
  }, []);

  return (
    <View style={styles.timeoutOverlayContainer}>
      <Ionicons name="time-outline" size={80} color="#fff" style={styles.timeoutIcon} />
      <Text style={styles.timeoutOverlayTitle}>Time for a Rest!</Text>
      <Text style={styles.timeoutOverlayMessage}>{restMessage}</Text>
      <TouchableOpacity
        style={styles.restartButton}
        onPress={onRestart}
        activeOpacity={0.8}
      >
        <Text style={styles.restartButtonText}>Start New Session</Text>
      </TouchableOpacity>
    </View>
  );
};

const AvatarPicker = ({ visible, onClose, onSave, currentAvatar, avatarOptions }) => {
  const [selectedAvatar, setSelectedAvatar] = useState(null);

  const handleSave = useCallback(async () => {
    if (!selectedAvatar) return;
    const success = await onSave(selectedAvatar);
    if (success) {
      onClose();
      setSelectedAvatar(null);
    }
  }, [selectedAvatar, onSave, onClose]);

  const handleClose = useCallback(() => {
    onClose();
    setSelectedAvatar(null);
  }, [onClose]);

  const renderAvatarItem = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.avatarOption,
        selectedAvatar === item && styles.avatarOptionSelected,
      ]}
      onPress={() => setSelectedAvatar(item)}
      activeOpacity={0.7}
    >
      <Image source={item} style={styles.avatarOptionImage} />
    </TouchableOpacity>
  ), [selectedAvatar]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Pick Your Animal Friend</Text>
          <FlatList
            data={avatarOptions}
            keyExtractor={(_, idx) => idx.toString()}
            numColumns={3}
            renderItem={renderAvatarItem}
            extraData={selectedAvatar}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.avatarGrid}
          />
          <View style={styles.modalButtonContainer}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleClose}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.saveButton,
                !selectedAvatar && styles.disabledModalButton,
              ]}
              disabled={!selectedAvatar}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const ProfileMenuItem = ({ icon, title, onPress }) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.menuItemContent}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={22} color="#FFCF2D" />
      </View>
      <Text style={styles.menuItemText}>{title}</Text>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </View>
  </TouchableOpacity>
);

const TimerDisplay = ({ timerDisplay, appIsGloballySleeping }) => (
  <View style={styles.timerContainer}>
    <Text style={styles.timerLabel}>Time Remaining:</Text>
    <Text style={[
      styles.timerDisplay,
      appIsGloballySleeping && styles.timerDisplayResting
    ]}>
      {appIsGloballySleeping ? "Resting" : timerDisplay}
    </Text>
  </View>
);

// Main Component
const Profile = ({ navigation }) => {
  const currentUser = auth.currentUser;
  // FIX: Add unlockedAnimalAvatars to destructure from useProfileData
  const { profileData, loading, updateAvatar, unlockedAnimalAvatars } = useProfile();
  const { appIsGloballySleeping, timerDisplay, handleRestartCountdown, formatTime } = useTimer(currentUser?.uid);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);

  const handleSignOut = useCallback(async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            const user = auth.currentUser;
            if (!user) {
              // Should not happen if on this screen, but handle defensively.
              firebaseSignOut(auth).catch(err => console.error("Sign out error (no user):", err));
              return;
            }

            try {
              // Perform cleanup tasks that must succeed before logging out.
              const userDocRef = doc(db, "students", user.uid);
              await updateDoc(userDocRef, {
                activeSessionId: null,
              });
              await AsyncStorage.removeItem("userSessionId"); // Clear local session ID

              // Initiate sign out. We don't show an alert in a .catch()
              // to prevent a race condition where the component unmounts
              // before the Alert can be displayed.
              firebaseSignOut(auth).catch(err => {
                console.error("Firebase sign out failed:", err);
                // The user will remain logged in. They can try again.
              });
            } catch (error) {
              // This catches errors from cleanup (updateDoc, AsyncStorage).
              console.error("Sign out cleanup error:", error);
              Alert.alert("Error", "An error occurred during sign-out. Please try again.");
            }
          }
        }
      ]
    );
  }, []);

  const handleAvatarPress = useCallback(() => {
    setAvatarModalVisible(true);
  }, []);

  const handleAvatarModalClose = useCallback(() => {
    setAvatarModalVisible(false);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (appIsGloballySleeping) {
    return (
      <RestModeOverlay
        onRestart={handleRestartCountdown}
        formatTime={formatTime}
      />
    );
  }

  return (
    <ImageBackground
      source={require('../images/Home.png')}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContentContainer}
          >
            <AppHeader
              navigation={navigation}
              leftIconType="drawer"
              showSearch={true}
            />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>My Profile</Text>
              
              <View style={styles.profileHeader}>
                <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8}>
                  <View style={styles.avatarCircle}>
                    <Image
                      source={profileData.avatarConfig}
                      style={styles.avatarImage}
                    />
                    <View style={styles.editIcon}>
                      <Ionicons name="pencil" size={20} color="#fff" />
                    </View>
                  </View>
                </TouchableOpacity>

                <Text style={styles.profileName}>
                  {profileData.studentFirstName} {profileData.studentLastName}
                </Text>

                <TimerDisplay
                  timerDisplay={timerDisplay}
                  appIsGloballySleeping={appIsGloballySleeping}
                />
              </View>

              <View style={styles.menuContainer}>
                <ProfileMenuItem
                  icon="person"
                  title="Personal Information"
                  onPress={() => navigation.navigate("PersonalInfo")}
                />
                <ProfileMenuItem
                  icon="lock-closed"
                  title="Change Password"
                  onPress={() => navigation.navigate("ChangePassword")}
                />
                <ProfileMenuItem
                  icon="information-circle"
                  title="About"
                  onPress={() => navigation.navigate("About")}
                />
              </View>
            </View>
          </ScrollView>

          <View style={styles.bottomSection}>
            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={24} color="white" />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        <AvatarPicker
          visible={avatarModalVisible}
          onClose={handleAvatarModalClose}
          onSave={updateAvatar}
          currentAvatar={profileData.avatarConfig}
          avatarOptions={unlockedAnimalAvatars}
        />
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20, // Add padding to prevent content cutoff
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFCF2D",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#333",
    fontFamily: 'Fredoka-SemiBold',
  },
  section: {
    flex: 1,
    padding: 20,
    paddingBottom: 0, // Remove bottom padding to let bottomSection handle spacing
  },
  sectionTitle: {
    fontSize: 28,
    fontFamily: 'Fredoka-SemiBold',
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "#E4FFE0",
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#FFCF2D",
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: "#333",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  // Timer styles
  timerContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 200,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  timerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    marginBottom: 5,
  },
  timerDisplay: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    color: "#FFCF2D",
    letterSpacing: 1,
  },
  timerDisplayResting: {
    color: "#999",
    fontStyle: 'italic',
  },
  // Menu styles
  menuContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    marginBottom: 20, // Add margin to separate from bottom section
  },
  menuItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 207, 45, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  // Bottom section styles - FIXED
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20, // Ensure proper bottom spacing
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 10, // Add margin between button and any text below
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  signOutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  attributionContainer: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingBottom: 20, // Extra bottom padding for attribution text
  },
  attributionText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    textDecorationLine: 'underline',
    opacity: 0.8,
  },
  // Rest mode overlay styles
  timeoutOverlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    paddingHorizontal: 30,
  },
  timeoutIcon: {
    marginBottom: 25,
  },
  timeoutOverlayTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Fredoka-SemiBold',
  },
  timeoutOverlayMessage: {
    fontSize: 18,
    color: '#ddd',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
    maxWidth: SCREEN_WIDTH - 60,
  },
  restartButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  restartButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 25,
    color: '#333',
    fontFamily: 'Fredoka-SemiBold',
  },
  avatarGrid: {
    paddingBottom: 10,
  },
  avatarOption: {
    margin: 8,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: '#eee',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  avatarOptionSelected: {
    borderColor: '#FFCF2D',
    borderWidth: 4,
  },
  avatarOptionImage: {
    width: 70,
    height: 70,
    borderRadius: 100,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 25,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  saveButton: {
    backgroundColor: '#27e62eff',
  },
  disabledModalButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
});

export default Profile;
