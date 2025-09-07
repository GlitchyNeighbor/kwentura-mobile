import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Alert,
  ImageBackground,
  Modal,
  TouchableWithoutFeedback, Animated
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { useRoute } from '@react-navigation/native';
import { db, auth } from "../FirebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  getDocs,
  orderBy,
  query,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import AppHeader from "./Header";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get("window");

import { rewardsConfig } from "./rewardsConfig";

const Rewards = ({ navigation }) => {
  const route = useRoute();
  // const { starsEarned } = route.params || {}; // Removed as stars are added in ComQuestions.js
  // const starsAddedRef = useRef(false); // Removed as stars are added in ComQuestions.js

  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [popularAuthors, setPopularAuthors] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickFilters, setQuickFilters] = useState([]);
  const [bookmarkedStories, setBookmarkedStories] = useState(new Set());
  const [user, setUser] = useState(null);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [userStars, setUserStars] = useState(0);
  const [unlockedRewards, setUnlockedRewards] = useState(new Set());
  const [userRewardsLoading, setUserRewardsLoading] = useState(true);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewReward, setPreviewReward] = useState(null);
  const [unlockedModalVisible, setUnlockedModalVisible] = useState(false);
  const [unlockedReward, setUnlockedReward] = useState(null);
  const searchTimeoutRef = useRef(null);
  const [boinkSound, setBoinkSound] = useState();
  const unlockedAvatarScale = useRef(new Animated.Value(1)).current;

  // Create animated values for each reward for bounce animation
  const animatedValues = useRef({});
  
  // Initialize animated values for all rewards
  useEffect(() => {
    rewardsConfig.forEach(reward => {
      if (!animatedValues.current[reward.id]) {
        animatedValues.current[reward.id] = new Animated.Value(1);
      }
    });
  }, []);

  // Keys for AsyncStorage
  const RECENT_SEARCHES_KEY = "@recent_searches";
  const SEARCH_HISTORY_KEY = "@search_history";

  useEffect(() => {
    fetchStories();
    loadStoredSearchData();
  }, []);

  useEffect(() => {
    filterStories();
    generateSearchSuggestions();
  }, [searchQuery, stories]);

  useEffect(() => {
    generateQuickSearchData();
  }, [stories]);

  // Listen for authentication state changes and load user data
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        loadUserBookmarks(currentUser.uid);
        loadUserRewardsData(currentUser.uid);
      } else {
        setBookmarkedStories(new Set());
        setUserStars(0);
        setUnlockedRewards(new Set());
        setUserRewardsLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  // Cleanup speech on component unmount
  useEffect(() => {
    return () => {
      Speech.stop();
    };
  }, []);

  // Load and unload the boink sound for the unlocked modal
  useEffect(() => {
    const loadSound = async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
           require('../assets/sounds/boink.mp3')
        );
        setBoinkSound(sound);
      } catch (error) {
        console.error('Failed to load the boink sound', error);
      }
    };

    loadSound();

    return () => boinkSound?.unloadAsync();
  }, []);

  // Effect to handle stars earned from quiz - REMOVED
  // useEffect(() => {
  //   if (starsEarned && user && !starsAddedRef.current) {
  //     addStars(starsEarned, "quiz completion");
  //     starsAddedRef.current = true; // Mark stars as added
  //   }
  // }, [starsEarned, user]);

  // Load user's stars and unlocked rewards
  const loadUserRewardsData = (userId) => {
    setUserRewardsLoading(true);
    const userDocRef = doc(db, "students", userId);
    const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
      try {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserStars(userData.stars || 0);
          setUnlockedRewards(new Set(userData.unlockedRewards || []));
        } else {
          // Create user document if it doesn't exist
          await setDoc(userDocRef, {
            stars: 0,
            unlockedRewards: [],
            createdAt: new Date(),
          });
          setUserStars(0);
          setUnlockedRewards(new Set());
        }
      } catch (error) {
        console.error("Error loading user rewards data:", error);
      } finally {
        setUserRewardsLoading(false);
      }
    }, (error) => {
      console.error("Error listening to user rewards data:", error);
      setUserRewardsLoading(false);
    });
    return unsubscribe;
  };

  // Function to unlock a reward
  const unlockReward = async (rewardId) => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to unlock rewards.");
      return;
    }

    const reward = rewardsConfig.find(r => r.id === rewardId);
    if (!reward) return;

    if (userStars < reward.starsRequired) {
      Alert.alert(
        "Insufficient Stars",
        `You need ${reward.starsRequired} stars to unlock "${reward.title}". You currently have ${userStars} stars.`,
        [{ text: "OK" }]
      );
      return;
    }

    if (unlockedRewards.has(rewardId)) {
      Alert.alert("Already Unlocked", "This reward has already been unlocked!");
      return;
    }

    try {
      const userDocRef = doc(db, "students", user.uid);
      const userDocSnap = await getDoc(userDocRef); // Fetch current user data
      
      if (!userDocSnap.exists()) {
        Alert.alert("Error", "User data not found. Please try again.");
        return;
      }

      const currentStars = userDocSnap.data().stars || 0;

      if (currentStars < reward.starsRequired) {
        Alert.alert(
          "Insufficient Stars",
          `You need ${reward.starsRequired} stars to unlock "${reward.title}". You currently have ${currentStars} stars.`,
          [{ text: "OK" }]
        );
        return;
      }

      // Update user document
      await updateDoc(userDocRef, {
        stars: increment(-reward.starsRequired),
        unlockedRewards: [...Array.from(unlockedRewards), rewardId],
      });

      // Update local state (this will also be updated by the onSnapshot listener)
      setUserStars(prev => prev - reward.starsRequired);
      setUnlockedRewards(prev => new Set([...prev, rewardId]));

      // Show styled unlocked modal instead of alert
      setUnlockedReward(reward);
      setUnlockedModalVisible(true);

      // Congratulate the user with speech
      const speechMessage = `Congratulations ! You've unlocked the ${reward.title}!`;
      Speech.speak(speechMessage, { language: 'en-US' });

    } catch (error) {
      console.error("Error unlocking reward:", error);
      Alert.alert("Error", "Failed to unlock reward. Please try again.");
    }
  };

  // Function to add stars (you can call this when user completes actions)
  const addStars = async (amount, reason = "Story completion") => {
    if (!user) return;

    try {
      const userDocRef = doc(db, "students", user.uid);
      await updateDoc(userDocRef, {
        stars: increment(amount),
      });
      
      setUserStars(prev => prev + amount);
      
      Alert.alert(
        "Stars Earned! ⭐",
        `You earned ${amount} stars for ${reason}!`,
        [{ text: "Great!" }]
      );
    } catch (error) {
      console.error("Error adding stars:", error);
    }
  };

  // Load stored search data from AsyncStorage
  const loadStoredSearchData = async () => {
    try {
      const storedRecentSearches = await AsyncStorage.getItem(
        RECENT_SEARCHES_KEY
      );
      const storedSearchHistory = await AsyncStorage.getItem(
        SEARCH_HISTORY_KEY
      );

      if (storedRecentSearches) {
        setRecentSearches(JSON.parse(storedRecentSearches));
      }

      if (storedSearchHistory) {
        setSearchHistory(JSON.parse(storedSearchHistory));
      }
    } catch (error) {
      console.error("Error loading search data:", error);
    }
  };

  // Save search data to AsyncStorage
  const saveSearchData = async (searches, history) => {
    try {
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Error saving search data:", error);
    }
  };

  // Generate trending searches, popular authors, and quick filters
  const generateQuickSearchData = () => {
    if (stories.length === 0) return;

    // Generate trending searches based on story titles and categories
    const categoryCount = {};
    const authorCount = {};
    const titleWords = [];

    stories.forEach((story) => {
      // Count categories
      if (story.category) {
        categoryCount[story.category] =
          (categoryCount[story.category] || 0) + 1;
      }

      // Count authors
      if (story.author) {
        authorCount[story.author] = (authorCount[story.author] || 0) + 1;
      }

      // Extract meaningful words from titles
      if (story.title) {
        const words = story.title
          .split(" ")
          .filter(
            (word) =>
              word.length > 3 &&
              ![
                "and",
                "the",
                "of",
                "in",
                "at",
                "to",
                "for",
                "with",
                "by",
              ].includes(word.toLowerCase())
          );
        titleWords.push(...words);
      }
    });

    // Set trending searches (top categories and popular title words)
    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    const topTitleWords = [...new Set(titleWords)].slice(0, 2);

    setTrendingSearches([...topCategories, ...topTitleWords]);

    // Set popular authors
    const topAuthors = Object.entries(authorCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([author]) => author);

    setPopularAuthors(topAuthors);

    // Set quick filters
    const filters = [
      "Latest Stories",
      "Most Popular",
      "Adventure",
      "Fantasy",
    ];
    setQuickFilters(filters);
  };

  // Generate search suggestions based on current query
  const generateSearchSuggestions = () => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchSuggestions([]);
      return;
    }

    const query = searchQuery.toLowerCase();
    const suggestions = [];

    // Add matching story titles
    stories.forEach((story) => {
      if (story.title && story.title.toLowerCase().includes(query)) {
        suggestions.push({
          type: "story",
          text: story.title,
          icon: "📖",
          data: story,
        });
      }
    });

    // Add matching authors
    const uniqueAuthors = [
      ...new Set(stories.map((s) => s.author).filter(Boolean)),
    ];
    uniqueAuthors.forEach((author) => {
      if (author.toLowerCase().includes(query)) {
        suggestions.push({
          type: "author",
          text: `by ${author}`,
          icon: "✍️",
          data: author,
        });
      }
    });

    // Add matching categories
    const uniqueCategories = [
      ...new Set(stories.map((s) => s.category).filter(Boolean)),
    ];
    uniqueCategories.forEach((category) => {
      if (category.toLowerCase().includes(query)) {
        suggestions.push({
          type: "category",
          text: `${category} stories`,
          icon: "📚",
          data: category,
        });
      }
    });

    setSearchSuggestions(suggestions.slice(0, 6));
  };

  const loadUserBookmarks = (userId) => {
    try {
      const bookmarksRef = collection(db, "students", userId, "bookmarks");
      const unsubscribe = onSnapshot(
        bookmarksRef,
        (snapshot) => {
          const bookmarkIds = new Set();
          snapshot.forEach((doc) => {
            bookmarkIds.add(doc.data().storyId);
          });
          setBookmarkedStories(bookmarkIds);
        },
        (error) => {
          console.error("Error loading bookmarks: ", error);
        }
      );
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up bookmark listener: ", error);
    }
  };

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const storiesCollectionRef = collection(db, "stories");
      const q = query(storiesCollectionRef, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const fetchedStories = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          imageUrl: data.image, // Map Firestore 'image' to 'imageUrl'
          synopsis: data.generatedSynopsis || data.synopsis, // Map 'generatedSynopsis' or 'synopsis'
        };
      });

      setStories(fetchedStories);
      setFilteredStories(fetchedStories);
    } catch (error) {
      console.error("Error fetching stories: ", error);
      setError("Failed to fetch stories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const filterStories = () => {
    if (!searchQuery.trim()) {
      setFilteredStories(stories);
      return;
    }

    const filtered = stories.filter((story) => {
      const title = story.title?.toLowerCase() || "";
      const author = story.author?.toLowerCase() || "";
      const category = story.category?.toLowerCase() || "";
      const searchTerm = searchQuery.toLowerCase();

      return (
        title.includes(searchTerm) ||
        author.includes(searchTerm) ||
        category.includes(searchTerm)
      );
    });

    setFilteredStories(filtered);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for search tracking
    searchTimeoutRef.current = setTimeout(() => {
      if (text.trim() && text.length > 2) {
        trackSearch(text.trim());
      }
    }, 1000);
  };

  const trackSearch = async (searchTerm) => {
    const timestamp = new Date().toISOString();
    const searchEntry = {
      term: searchTerm,
      timestamp,
      resultsCount: filteredStories.length,
    };

    // Update recent searches
    const updatedRecent = [
      searchTerm,
      ...recentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);

    // Update search history
    const updatedHistory = [searchEntry, ...searchHistory].slice(0, 20);

    setRecentSearches(updatedRecent);
    setSearchHistory(updatedHistory);

    // Save to storage
    await saveSearchData(updatedRecent, updatedHistory);
  };

  const handleSuggestionPress = (suggestion) => {
    if (typeof suggestion === "string") {
      setSearchQuery(suggestion);
    } else {
      switch (suggestion.type) {
        case "story":
          handleViewStory(suggestion.data);
          return;
        case "author":
          setSearchQuery(suggestion.data);
          break;
        case "category":
          setSearchQuery(suggestion.data);
          break;
        default:
          setSearchQuery(suggestion.text);
      }
    }
    setIsSearchFocused(false);
  };

  const handleQuickFilter = (filter) => {
    let filteredResults = [...stories];

    switch (filter) {
      case "Latest Stories":
        filteredResults = stories.slice(0, 10);
        break;
      case "Most Popular":
        // Sort by some popularity metric (you can customize this)
        filteredResults = stories
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 10);
        break;
      default:
        filteredResults = stories.filter((s) =>
          s.category?.toLowerCase().includes(filter.toLowerCase())
        );
    }

    setFilteredStories(filteredResults);
    setSearchQuery(filter);
    setIsSearchFocused(false);
  };

  const clearSearchHistory = async () => {
    Alert.alert(
      "Clear Search History",
      "Are you sure you want to clear your search history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            setRecentSearches([]);
            setSearchHistory([]);
            await saveSearchData([], []);
          },
        },
      ]
    );
  };

  const handleViewStory = (story) => {
    // Navigate to the HomeTab, then to the ViewStory screen within HomeStack
    navigation.navigate("HomeTab", {
      screen: "ViewStory",
      params: { storyId: story.id, story: story },
    });
  };

  const handleBookmark = async (story) => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to bookmark stories.", [
        { text: "Cancel", style: "cancel" },
        { text: "Login", onPress: () => navigation.navigate("Login") },
      ]);
      return;
    }
    setBookmarkLoading(true);
    try {
      const bookmarkRef = doc(db, "students", user.uid, "bookmarks", story.id);
      const isBookmarked = bookmarkedStories.has(story.id);
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        console.log("Bookmark removed:", story.title);
      } else {
        const bookmarkData = {
          storyId: story.id,
          title: story.title,
          author: story.author || "Unknown",
          imageUrl: story.imageUrl || null,
          category: story.category || "Story",
          synopsis: story.synopsis || "No synopsis available.",
          bookmarkedAt: new Date(),
          createdAt: story.createdAt,
        };
        await setDoc(bookmarkRef, bookmarkData);
        console.log("Story bookmarked:", story.title);
      }
    } catch (error) {
      console.error("Error handling bookmark: ", error);
      Alert.alert("Error", "Failed to update bookmark. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
    setFilteredStories(stories);
  };

  // Function to handle unlocked animal clicks with bounce animation and sound
  const handleUnlockedAnimalClick = async (rewardId) => {
    const animatedValue = animatedValues.current[rewardId];
    
    // Play the sound if it's loaded
    if (boinkSound) {
      await boinkSound.replayAsync();
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
    
    console.log(`Bounced unlocked animal ${rewardId} with boink sound!`);
  };
  
// Simple and clear renderAnimalReward function
const renderAnimalReward = (reward, index) => {
  const isUnlocked = unlockedRewards.has(reward.id);
  const hasEnoughStars = userStars >= reward.starsRequired;
  const animatedValue = animatedValues.current[reward.id] || new Animated.Value(1);
  
  // Simple logic:
  // - If already unlocked: show as unlocked
  // - If not unlocked BUT has enough stars: show as unlockable (can tap)
  // - If not unlocked AND doesn't have enough stars: show as locked (cannot tap)
  
  const canUnlock = !isUnlocked && hasEnoughStars;
  const isLocked = !isUnlocked && !hasEnoughStars;

  return (
    <TouchableWithoutFeedback
      key={reward.id}
      onPress={() => {
        if (isUnlocked) {
          // If unlocked, play animation and sound
          handleUnlockedAnimalClick(reward.id);
        } else if (isLocked) {
          // Cannot unlock - show alert
          Alert.alert(
            "Not Enough Stars",
            `You need ${reward.starsRequired} stars to unlock the ${reward.title}. You currently have ${userStars} stars.`
          );
        } else {
          // Can view/unlock - show preview
          setPreviewReward({
            ...reward,
            isUnlocked,
            canUnlock,
            isLocked,
          });
          setPreviewVisible(true);
        }
      }}
    >
      <Animated.View
        style={[
          styles.animalRewardContainer,
          isUnlocked && styles.animalRewardUnlocked,
          canUnlock && styles.animalRewardCanUnlock,
          isLocked && styles.animalRewardLocked,
          {
            transform: [{ scale: animatedValue }],
          },
        ]}
      >
        <View style={[
          styles.animalCircle,
          { 
            backgroundColor: isUnlocked 
              ? reward.bgColor 
              : canUnlock
              ? '#FFF8E1'  // Yellow for unlockable
              : '#F0F0F0'  // Gray for locked
          }
        ]}>
          <LinearGradient
            colors={
              isUnlocked
                ? [reward.color, `${reward.color}DD`]
                : canUnlock
                ? ["#FFD700", "#FFA000"]  // Gold for unlockable
                : ["#CCCCCC", "#999999"]  // Gray for locked
            }
            style={styles.animalCircleInner}
          >
            {isUnlocked ? (
              // Already unlocked - show crown
              <View style={styles.unlockedAnimalContainer}>
                <Image 
                  source={reward.image}
                  style={styles.animalImage}
                  resizeMode="contain"
                />
                <View style={styles.crownContainer}>
                  <Text style={styles.crownEmoji}>👑</Text>
                </View>
              </View>
            ) : canUnlock ? (
              // Can unlock - show TAP with star
              <View style={styles.canUnlockAnimalContainer}>
                <Image 
                  source={reward.image}
                  style={styles.animalImage}
                  resizeMode="contain"
                />
                <View style={styles.unlockPulse}>
                  <Text style={styles.unlockStarIcon}>⭐</Text>
                </View>
                <Text style={styles.tapToUnlockText}>TAP</Text>
              </View>
            ) : (
              // Locked - show lock icon
              <View style={styles.lockedAnimalContainer}>
                <Image 
                  source={reward.image}
                  style={[styles.animalImage, styles.animalImageLocked]}
                  resizeMode="contain"
                />
                <View style={styles.lockOverlay}>
                  <Ionicons name="lock-closed" size={16} color="#666" />
                </View>
              </View>
            )}
          </LinearGradient>
        </View>
        
        <Text style={[
          styles.animalRewardTitle,
          isUnlocked && styles.animalRewardTitleUnlocked,
          canUnlock && styles.animalRewardTitleCanUnlock,
          isLocked && styles.animalRewardTitleLocked,
        ]}>
          {reward.title}
        </Text>
        
        <Text style={[
          styles.animalRewardDescription,
          isUnlocked && styles.animalRewardDescriptionUnlocked,
          isLocked && styles.animalRewardDescriptionLocked,
        ]}>
          {reward.description}
        </Text>
        
        {!isUnlocked && (
          <View style={[
            styles.starsRequiredContainer,
            canUnlock && styles.starsRequiredContainerCanUnlock,
            isLocked && styles.starsRequiredContainerLocked,
          ]}>
            <Text style={[
              styles.starsNeededText,
              canUnlock && styles.starsNeededTextCanUnlock,
              isLocked && styles.starsNeededTextLocked,
            ]}>
              {reward.starsRequired} ⭐
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

  const renderRewardsGrid = () => {
    if (userRewardsLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6DA8" />
          <Text style={styles.loadingText}>Loading your animal friends...</Text>
        </View>
      );
    }

    return (
      <View style={styles.rewardsContainer}>
        <Text style={styles.rewardsSubtitle}>
          Collect animal friends by reading stories and earning stars! 
        </Text>
        <View style={styles.animalRewardsGrid}>
          {rewardsConfig.map((reward, index) => renderAnimalReward(reward, index))}
        </View>
      </View>
    );
  };

  // Handle unlocked animal avatar click with bounce animation and sound (for modal)
  const handleModalUnlockedAvatarClick = async () => {
    // Create bounce animation
    Animated.sequence([
      Animated.timing(unlockedAvatarScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(unlockedAvatarScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(unlockedAvatarScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Play the sound if it's loaded
    if (boinkSound) {
      await boinkSound.replayAsync();
    }
  };

  // Demo function to add stars (for testing purposes)
  const handleAddStarsDemo = () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to earn stars.");
      return;
    }
    
    Alert.alert(
      "Demo: Add Stars",
      "How many stars would you like to add for testing?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "+5 Stars", onPress: () => addStars(5, "demo action") },
        { text: "+25 Stars", onPress: () => addStars(25, "demo action") },
        { text: "+50 Stars", onPress: () => addStars(50, "demo action") },
      ]
    );
  };

  return (
    <ImageBackground
      source={require('../images/About.png')}
      style={[styles.background, styles.backgroundImage]}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
        <AppHeader
          navigation={navigation}
          leftIconType="drawer"
          showSearch={true}
          hideStars={true}  // This will hide only the decorative stars
        />

          {/* Removed starsEarned display as stars are now added in ComQuestions.js */}
          {/* {starsEarned > 0 && (
            <View style={styles.starsEarnedContainer}>
              <Text style={styles.starsEarnedText}>You earned {starsEarned} ⭐ from the quiz!</Text>
            </View>
          )} */}

          {/* Demo button to add stars - remove this in production */}
          {user && (
            <View style={styles.demoContainer}>
              <TouchableOpacity style={styles.demoButton} onPress={handleAddStarsDemo}>
                <Text style={styles.demoButtonText}>+ Add Stars (Demo)</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.titleText}>Animal Friends Collection</Text>
          
          {!user ? (
            <View style={styles.loginPromptContainer}>
              <Text style={styles.loginPromptAnimal}>🐾</Text>
              <Text style={styles.loginPromptTitle}>Login to Collect Animal Friends</Text>
              <Text style={styles.loginPromptSubtitle}>
                Read stories, bookmark favorites, and unlock adorable animal companions!
              </Text>
              <TouchableOpacity 
                style={styles.loginButton}
                onPress={() => navigation.navigate("Login")}
              >
                <Text style={styles.loginButtonText}>Start Your Adventure</Text>
              </TouchableOpacity>
            </View>
          ) : (
            renderRewardsGrid()
          )}
        </ScrollView>

        {/* Modal for Animal Preview */}
        <Modal
          visible={previewVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.previewOverlay}>
            <View style={styles.previewContainer}>
              <View style={styles.previewImageWrapper}>
                <View style={[
                  styles.previewAnimalCircle,
                  { backgroundColor: previewReward?.bgColor || "#fff" }
                ]}>
                  <LinearGradient
                    colors={
                      previewReward?.isUnlocked
                        ? [previewReward.color, `${previewReward.color}DD`]
                        : previewReward?.canUnlock
                        ? ["#FFD700", "#FFA000"]
                        : ["#E0E0E0", "#BDBDBD"]
                    }
                    style={styles.previewAnimalCircleInner}
                  >
                    <View style={styles.previewUnlockedAnimalContainer}>
                      <Image
                        source={previewReward?.image}
                        style={styles.previewAnimalImage}
                        resizeMode="contain"
                      />
                      {previewReward?.isUnlocked && (
                        <View style={styles.previewCrownContainer}>
                          <Text style={styles.previewCrownEmoji}>👑</Text>
                        </View>
                      )}
                      {previewReward?.canUnlock && !previewReward?.isUnlocked && (
                        <View style={styles.previewUnlockPulse}>
                          <Text style={styles.previewUnlockStarIcon}>⭐</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </View>
              </View>
              
              <Text style={styles.previewAnimalName}>{previewReward?.title}</Text>
              <Text style={styles.previewAnimalDesc}>{previewReward?.description}</Text>
              
              <View style={styles.previewStarsRow}>
                <Ionicons name="star" size={18} color="#FFD700" />
                <Text style={styles.previewStarsText}>{previewReward?.starsRequired} stars required</Text>
                {previewReward?.isUnlocked && (
                  <Text style={styles.previewUnlockedText}>Unlocked!</Text>
                )}
                {previewReward?.canUnlock && !previewReward?.isUnlocked && (
                  <Text style={[styles.previewUnlockedText, { color: "#FF6DA8" }]}>Can Unlock!</Text>
                )}
                {previewReward?.isLocked && !previewReward?.isUnlocked && (
                  <Text style={[styles.previewUnlockedText, { color: "#999" }]}>Locked</Text>
                )}
              </View>
              
              {/* Unlock button only for animals that can be unlocked */}
              {previewReward?.canUnlock && !previewReward?.isUnlocked && (
                <TouchableOpacity
                  style={[
                    styles.previewActionButton,
                    { backgroundColor: "#FFD700", marginBottom: 8 }
                  ]}
                  onPress={() => {
                    unlockReward(previewReward.id);
                    setPreviewVisible(false);
                  }}
                >
                  <Text style={[styles.previewActionButtonText, { color: "#333" }]}>Unlock</Text>
                </TouchableOpacity>
              )}
              
              {/* Disabled unlock button for locked animals */}
              {previewReward?.isLocked && !previewReward?.isUnlocked && !previewReward?.canUnlock && (
                <TouchableOpacity
                  style={[
                    styles.previewActionButton,
                    { backgroundColor: "#E0E0E0", marginBottom: 8 }
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "Not Enough Stars",
                      `You need ${previewReward.starsRequired} stars to unlock this animal. You currently have ${userStars} stars.`
                    );
                  }}
                >
                  <Text style={[styles.previewActionButtonText, { color: "#999" }]}>Need More Stars</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                style={styles.previewCloseButton}
                onPress={() => setPreviewVisible(false)}
              >
                <Text style={styles.previewCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Styled Animal Unlocked Modal */}
        <Modal
          visible={unlockedModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {
            Speech.stop();
            setUnlockedModalVisible(false);
          }}
        >
          <View style={styles.unlockedOverlay}>
            <View style={styles.unlockedContainer}>
              {/* Celebration Header */}
              <View style={styles.celebrationHeader}>
                <Text style={styles.celebrationEmoji}>🎉</Text>
                <Text style={styles.celebrationTitle}>Animal Friend Unlocked!</Text>
                <Text style={styles.celebrationEmoji}>🎉</Text>
              </View>

              {/* Animal Image Display */}
              <TouchableWithoutFeedback onPress={handleModalUnlockedAvatarClick}>
                <Animated.View style={[styles.unlockedImageWrapper, { transform: [{ scale: unlockedAvatarScale }] }]}>
                  <View style={[
                    styles.unlockedAnimalCircle,
                    { backgroundColor: unlockedReward?.bgColor || "#fff" }
                  ]}>
                    <LinearGradient
                      colors={[unlockedReward?.color || "#FFD700", `${unlockedReward?.color || "#FFD700"}DD`]}
                      style={styles.unlockedAnimalCircleInner}
                    >
                      <View style={styles.unlockedAnimalImageContainer}>
                        <Image
                          source={unlockedReward?.image}
                          style={styles.unlockedAnimalImage}
                          resizeMode="contain"
                        />
                        <View style={styles.unlockedCrownContainer}>
                          <Text style={styles.unlockedCrownEmoji}>👑</Text>
                        </View>
                        {/* Sparkle effects
                      <View style={styles.sparkleEffect}>
                        <Text style={[styles.sparkle, styles.sparkle1]}>✨</Text>
                        <Text style={[styles.sparkle, styles.sparkle2]}>⭐</Text>
                        <Text style={[styles.sparkle, styles.sparkle3]}>✨</Text>
                        <Text style={[styles.sparkle, styles.sparkle4]}>⭐</Text>
                      </View> */}
                      </View>
                    </LinearGradient>
                  </View>
                </Animated.View>
              </TouchableWithoutFeedback>
              
              {/* Animal Info */}
              <Text style={styles.unlockedAnimalName}>
                Congratulations! You've unlocked the "{unlockedReward?.title}"!
              </Text>
              <Text style={styles.unlockedAnimalDesc}>{unlockedReward?.description}</Text>
              
              {/* Stars Display */}
              <View style={styles.unlockedStarsRow}>
                <Ionicons name="star" size={20} color="#FFD700" />
                <Text style={styles.unlockedStarsText}>
                  Cost: {unlockedReward?.starsRequired} stars
                </Text>
              </View>
              
              {/* Awesome Button */}
              <TouchableOpacity
                style={styles.unlockedAwesomeButton}
                onPress={() => {
                  Speech.stop();
                  setUnlockedModalVisible(false);
                }}
              >
                <Text style={styles.unlockedAwesomeText}>Awesome!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground> 
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
  },
  titleText: {
    fontSize: 25,
    marginTop: 10,
    fontFamily: 'Fredoka-SemiBold',
    color: "#222",
    textAlign: "center",
    marginBottom: 5,
  },
  
  demoContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  demoButton: {
    backgroundColor: '#FF6DA8',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Login Prompt Styles
  loginPromptContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  loginPromptAnimal: {
    fontSize: 48,
    marginBottom: 16,
  },
  loginPromptTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  loginPromptSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#FF6DA8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Loading Styles
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  // Rewards Grid Styles
  rewardsContainer: {
    flex: 1,
    paddingHorizontal: 15,
    minHeight: height * 0.6,
  },
  rewardsSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Fredoka-Regular',
    lineHeight: 20,
  },
  animalRewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    paddingHorizontal: 5,
  },
  
  // Animal Reward Styles - Updated for 3 columns
  animalRewardContainer: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 20,
    padding: 5,
  },
  animalRewardUnlocked: {
    transform: [{ scale: 1.02 }],
  },
  animalRewardCanUnlock: {
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  
  // Animal Circle Styles - Reduced size for 3 columns
  animalCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  animalCircleInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  // Animal Image Styles
  animalImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  animalImageShadow: {
    opacity: 0.7,
  },
  animalImageLocked: {
    opacity: 0.3,
  },
  
  // Unlocked Animal Styles
  unlockedAnimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  crownContainer: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  crownEmoji: {
    fontSize: 12,
  },
  
  // Can Unlock Animal Styles
  canUnlockAnimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unlockPulse: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockStarIcon: {
    fontSize: 10,
  },
  tapToUnlockText: {
    fontSize: 7,
    fontWeight: '700',
    color: '#333',
    letterSpacing: 0.5,
    marginTop: 3,
  },
  
  // Locked Animal Styles
  lockedAnimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lockOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Animal Reward Text Styles - Adjusted for smaller layout
  animalRewardTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: 'Fredoka-SemiBold',
    lineHeight: 12,
  },
  animalRewardTitleUnlocked: {
    color: '#333',
    fontSize: 11,
  },
  animalRewardTitleCanUnlock: {
    color: '#FF6DA8',
    fontSize: 11,
  },
  animalRewardDescription: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
    lineHeight: 10,
    marginBottom: 3,
    paddingHorizontal: 2,
  },
  animalRewardDescriptionUnlocked: {
    color: '#666',
    fontWeight: '500',
  },
  starsRequiredContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    marginTop: 2,
  },
  starsNeededText: {
    fontSize: 9,
    color: '#FF6DA8',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Preview Modal Styles - Fixed positioning and consistent with unlocked animals
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '80%',
    maxWidth: 350,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    borderColor: '#FFD700',
    borderWidth: 3,
  },
  previewImageWrapper: {
    alignItems: 'center',
    marginBottom: 18,
  },
  
  // Preview Animal Circle - matches the unlocked animal style
  previewAnimalCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  previewAnimalCircleInner: {
    width: 108,
    height: 108,
    borderRadius: 54,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  
  // Preview Animal Container - matches unlocked style
  previewUnlockedAnimalContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  previewAnimalImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  previewCrownContainer: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'transparent',
  },
  previewCrownEmoji: {
    fontSize: 24,
  },
  previewUnlockPulse: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewUnlockStarIcon: {
    fontSize: 16,
  },
  
  previewAnimalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: 'Fredoka-SemiBold',
  },
  previewAnimalDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: 'Fredoka-Regular',
  },
  previewStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  previewStarsText: {
    fontSize: 14,
    color: '#FFD700',
    marginLeft: 4,
    fontWeight: '600',
  },
  previewUnlockedText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 8,
    fontWeight: '600',
  },
  previewActionButton: {
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 5,
  },
  previewActionButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  previewCloseButton: {
    backgroundColor: '#FF6DA8',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
  },
  previewCloseText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  // NEW: Styled Unlocked Modal Styles - matching preview container style
  unlockedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    width: '85%',
    maxWidth: 380,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    borderColor: '#FFD700',
    borderWidth: 4,
  },
  
  // Celebration Header
  celebrationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  celebrationEmoji: {
    fontSize: 28,
    marginHorizontal: 8,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6DA8',
    textAlign: 'center',
    fontFamily: 'Fredoka-SemiBold',
  },
  
  // Unlocked Animal Image Display
  unlockedImageWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  unlockedAnimalCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  unlockedAnimalCircleInner: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unlockedAnimalImageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unlockedAnimalImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  unlockedCrownContainer: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: 'transparent',
  },
  unlockedCrownEmoji: {
    fontSize: 28,
  },
  
  // Sparkle Effects
  sparkleEffect: {
    position: 'absolute',
    width: 200,
    height: 200,
    top: -30,
    left: -30,
  },
  sparkle: {
    position: 'absolute',
    fontSize: 20,
  },
  sparkle1: {
    top: 10,
    left: 20,
    color: '#FFD700',
  },
  sparkle2: {
    top: 30,
    right: 15,
    color: '#FF6DA8',
  },
  sparkle3: {
    bottom: 40,
    left: 10,
    color: '#4CAF50',
  },
  sparkle4: {
    bottom: 20,
    right: 20,
    color: '#FF5722',
  },
  
  // Unlocked Animal Info
  unlockedAnimalName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
    fontFamily: 'Fredoka-SemiBold',
    lineHeight: 22,
  },
  unlockedAnimalDesc: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Fredoka-Regular',
    lineHeight: 20,
  },
  
  // Unlocked Stars Display
  unlockedStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 15,
  },
  unlockedStarsText: {
    fontSize: 16,
    color: '#FFD700',
    marginLeft: 6,
    fontWeight: '600',
  },
  
  // Awesome Button
  unlockedAwesomeButton: {
    backgroundColor: '#FF6DA8',
    borderRadius: 15,
    paddingVertical: 14,
    paddingHorizontal: 40,
    elevation: 5,
    shadowColor: '#FF6DA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  unlockedAwesomeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    fontFamily: 'Fredoka-SemiBold',
  },

  // New styles for earned stars display
  starsEarnedContainer: {
    backgroundColor: '#D4EDDA', // Light green background
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  starsEarnedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#155724', // Dark green text
    textAlign: 'center',
  },

  // Existing styles from original component
  bookItem: {
    borderRadius: 8,
    textAlign: "center",
    width: width * 0.32,
    borderRadius: 12,
    marginRight: 15,
  },
  bookImageContainer: {
    position: "relative",
    marginBottom: 5,
  },
  bookImage: {
    width: "100%",
    height: height * 0.20,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  bookInfo: {
    flex: 1,
  },
  storyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    lineHeight: 16,
    textAlign: "center",
  },
  storyAuthor: {
    fontSize: 10,
    color: "black",
    fontStyle: "italic",
    textAlign: "center",
  },
  storySynopsis: {
    fontSize: 10,
    color: "#666",
    textAlign: "center",
    marginTop: 4,
  },
  bookActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  readButton: {
    backgroundColor: "#FF6DA8",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    flex: 1,
    marginRight: 8,
  },
  readButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  bookmarkButton: {
    padding: 6,
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  bookmarkButtonDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
    color: "#222",
    textAlign: "left",
  },
  viewAllText: {
    fontSize: 12,
    color: "darkGray",
    fontWeight: "600",
  },
  categorySection: {
    marginBottom: 20,
  },
  horizontalScrollContainer: {
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
  },
  suggestionChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  recentChip: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FFE0E0",
  },
  suggestionChipText: {
    fontSize: 14,
    color: "#666",
  },
  recentChipText: {
    color: "#FF6B6B",
  },
  trendingChip: { 
    backgroundColor: "#E6FFFA", 
    borderColor: "#B2F5EA" 
  },
  trendingChipText: { 
    color: "#2C7A7B" 
  },
  authorChip: { 
    backgroundColor: "#FEFCE8", 
    borderColor: "#FDE68A" 
  },
  authorChipText: { 
    color: "#A16207" 
  },
  filterChip: { 
    backgroundColor: "#EFF6FF", 
    borderColor: "#BFDBFE" 
  },
  filterChipText: { 
    color: "#1E40AF" 
  },
  searchSuggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  suggestionIcon: {
    fontSize: 16,
    marginRight: 10,
    color: "#555",
  },
  searchSuggestionText: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  suggestionArrow: {
    transform: [{ rotate: "45deg" }],
  },
  
});

export default Rewards;