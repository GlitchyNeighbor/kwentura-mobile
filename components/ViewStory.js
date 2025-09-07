import React, { useState, useEffect, useRef } from "react";
import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  ImageBackground,
  Animated,
  Dimensions,
  Platform,
} from "react-native";
import { db, auth } from "../FirebaseConfig";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import Header from "./HeaderViewStory";

const { width, height } = Dimensions.get('window');

const ViewStory = ({ navigation, route }) => {
  const { storyId, story: initialStory } = route.params || {};

  const [currentStory, setCurrentStory] = useState(initialStory);
  const [isLoading, setIsLoading] = useState(!!storyId);
  const [error, setError] = useState(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const readButtonScale = useRef(new Animated.Value(1)).current;

  // Listen for auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Diagnostic log for navigation state
  useEffect(() => {
    if (navigation && typeof navigation.dangerouslyGetState === 'function') {
      console.log("ViewStory Navigation State:", JSON.stringify(navigation.dangerouslyGetState(), null, 2));
    }
  }, [navigation]);

  useEffect(() => {
    if (storyId) {
      const fetchStoryDetails = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const storyRef = doc(db, "stories", storyId);
          const docSnap = await getDoc(storyRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setCurrentStory({
              id: docSnap.id,
              ...data,
              imageUrl: data.image,
              synopsis: data.generatedSynopsis || data.synopsis || "",
            });
          } else {
            setError("Story not found.");
            setCurrentStory(null);
          }
        } catch (err) {
          console.error("Error fetching story details:", err);
          setError("Failed to load story details. Please try again.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchStoryDetails();
    } else {
      setCurrentStory(initialStory ? {
        ...initialStory,
        imageUrl: initialStory.image || initialStory.imageUrl,
        synopsis: initialStory.generatedSynopsis || initialStory.synopsis || "",
      } : null);
      setIsLoading(false);
      if (!initialStory) {
        setError("No story data provided.");
      }
    }
  }, [storyId, initialStory]);

  // Check if bookmarked
  useEffect(() => {
    const checkBookmark = async () => {
      if (user && currentStory?.id) {
        const bookmarkRef = doc(
          db,
          "students",
          user.uid,
          "bookmarks",
          currentStory.id
        );
        const snap = await getDoc(bookmarkRef);
        setIsBookmarked(snap.exists());
      } else {
        setIsBookmarked(false);
      }
    };
    checkBookmark();
  }, [user, currentStory?.id]);

  // Animated bookmark toggle
  const toggleBookmark = async () => {
    if (!user || !currentStory?.id) {
      Alert.alert(
        "Login Required",
        "Please log in to bookmark stories!",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    setBookmarkLoading(true);

    // Bounce animation
    Animated.sequence([
      Animated.timing(bookmarkScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    const bookmarkRef = doc(
      db,
      "students",
      user.uid,
      "bookmarks",
      currentStory.id
    );
    
    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        console.log("Bookmark removed:", currentStory.title);
        setIsBookmarked(false);
        Alert.alert("📚", "Story removed from your library.", [{ text: "OK" }]);
      } else {
        const bookmarkData = {
          storyId: currentStory.id,
          title: currentStory.title || "Untitled Story",
          author: currentStory.author || "Unknown Author",
          imageUrl: currentStory.imageUrl || null,
          category: currentStory.category || "Story",
          synopsis: currentStory.synopsis || "No synopsis available.",
          bookmarkedAt: new Date(),
          createdAt: currentStory.createdAt,
        };
        await setDoc(bookmarkRef, bookmarkData);
        console.log("Story bookmarked:", currentStory.title);
        setIsBookmarked(true);
        Alert.alert("⭐", "Story added to your library.", [{ text: "OK!" }]);
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
      Alert.alert("Oops!", "Something went wrong. Please try again!", [{ text: "OK" }]);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleReadStory = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(readButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(readButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (currentStory?.id) {
      navigation.navigate("ReadStory", { storyId: currentStory.id });
    }
  };

  const displayStory = currentStory;
  const title = displayStory?.title || "Untitled Story";
  const author = displayStory?.author || "Unknown Author";
  const imageUrl = displayStory?.imageUrl;
  const categoryDisplay = displayStory?.category || "Story";
  const synopsis = displayStory?.synopsis || "No synopsis available.";

  if (isLoading && !displayStory) {
    return (
      <ImageBackground
        source={require('../images/About.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={[styles.container, styles.centeredMessageContainer]}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>📖 Loading your story...</Text>
            <Text style={styles.loadingSubText}>Almost there!</Text>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (error && !displayStory) {
    return (
      <ImageBackground
        source={require('../images/About.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={[styles.container, styles.centeredMessageContainer]}>
          <View style={styles.errorContainer}>
            <Ionicons name="sad-outline" size={64} color="#4A90E2" />
            <Text style={styles.errorText}>Oops! {error}</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.goBackButton}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  if (!isLoading && !displayStory) {
    return (
      <ImageBackground
        source={require('../images/About.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={[styles.container, styles.centeredMessageContainer]}>
          <View style={styles.errorContainer}>
            <Ionicons name="book-outline" size={64} color="#4A90E2" />
            <Text style={styles.errorText}>Story not available</Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.goBackButton}
            >
              <Ionicons name="arrow-back" size={20} color="#FFF" />
              <Text style={styles.goBackButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    <ImageBackground
      source={require('../images/About.png')}
      style={styles.background}
      resizeMode="cover"
    >   
      <SafeAreaView style={styles.container}>
        

        <ScrollView 
          style={styles.scrollViewContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
        <Header navigation={navigation} />
          <Animated.View 
            style={[
              styles.contentContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <Text style={styles.titleText}>Story Details</Text>

            <View style={styles.storyCard}>
              {/* Book Cover with Shadow */}
              <View style={styles.bookCoverContainer}>
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.bookCover}
                    onError={() => console.log("Failed to load image in ViewStory:", imageUrl)}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.bookCover, styles.placeholderCover]}>
                    <Ionicons name="book" size={48} color="#B8D4F0" />
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
                {/* Category badge positioned in upper left corner */}
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{categoryDisplay}</Text>
                </View>
              </View>

              {/* Story Info */}
              <View style={styles.storyInfo}>
                {/* Title and Author Container - Fixed positioning */}
                <View style={styles.titleAuthorContainer}>
                  <Text style={styles.storyTitle} numberOfLines={3}>
                    {title}
                  </Text>
                  <Text style={styles.storyAuthor} numberOfLines={2}>
                    ✍️ {author}
                  </Text>
                </View>
                
                {/* Action Buttons - Always at bottom */}
                <View style={styles.actionButtons}>
                  <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
                    <TouchableOpacity
                      style={[styles.bookmarkButton, isBookmarked && styles.bookmarkButtonActive]}
                      onPress={toggleBookmark}
                      disabled={bookmarkLoading}
                      activeOpacity={0.7}
                    >
                      {bookmarkLoading ? (
                        <ActivityIndicator size="small" color="#FF6B6B" />
                      ) : (
                        <Ionicons
                          name={isBookmarked ? "heart" : "heart-outline"}
                          size={22}
                          color="#FF6B6B"
                        />
                      )}
                    </TouchableOpacity>
                  </Animated.View>

                  <Animated.View style={{ transform: [{ scale: readButtonScale }] }}>
                    <TouchableOpacity
                      style={styles.readButton}
                      onPress={handleReadStory}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="play" size={20} color="#FFF" />
                      <Text style={styles.readButtonText}>Read</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </View>
            </View>

            {/* Synopsis Section */}
            <View style={styles.synopsisCard}>
              <View style={styles.synopsisHeader}>
                <Ionicons name="document-text" size={24} color="#4A90E2" />
                <Text style={styles.synopsisTitle}>Story Summary</Text>
              </View>
              
              {isLoading && storyId ? (
                <View style={styles.synopsisLoading}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={styles.synopsisLoadingText}>Loading summary...</Text>
                </View>
              ) : (
                <Text style={styles.synopsisContent}>
                  {synopsis}
                </Text>
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground> 
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  scrollViewContainer: {
    flex: 1,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  
  },
  contentContainer: {
    paddingHorizontal: 20,
    alignItems: 'center', // Center children horizontally
    
  },
  titleText: {
    fontSize: 28,
    marginTop: 20,
    marginBottom: 15,
    fontFamily: 'Fredoka-SemiBold',
    color: "#2C3E50",
    textAlign: "center",
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  storyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    width: '100%', // Ensure card takes full width of its container
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  bookCoverContainer: {
    position: 'relative',
    marginRight: 15,
    width: 140,
    flexShrink: 0,
  },
  bookCover: {
    width: 140,
    height: 200,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  placeholderCover: {
    backgroundColor: '#F8F9FA',
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: '#E9ECEF',
    borderStyle: 'dashed',
  },
  placeholderText: {
    marginTop: 8,
    color: "#6C757D",
    fontSize: 12,
    fontWeight: '500',
  },
  categoryBadge: {
    position: 'absolute',
    top: 8, // Inside the container, not overlapping
    left: 8, // Upper left corner
    backgroundColor: "rgba(0,0,0,0.7)",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    maxWidth: 100, // Prevent it from being too wide
    zIndex: 1, // Ensure it appears above the image
  },
  categoryBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  storyInfo: {
    flex: 1,
    justifyContent: "space-between", // This ensures buttons stay at bottom
    minWidth: 0,
    paddingRight: 5,
  },
  // NEW: Container for title and author that keeps them together
  titleAuthorContainer: {
    flex: 0, // Don't expand this container
    marginBottom: 15, // Space between title/author and buttons
  },
  storyTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#2C3E50",
    lineHeight: 22,
    fontFamily: 'Fredoka-SemiBold',
    flexShrink: 1,
    marginTop: 5,
    marginBottom: 5, // Small space between title and author
  },
  storyAuthor: {
    fontSize: 14,
    color: "#6C757D",
    fontStyle: "italic",
    flexShrink: 1,
    // Removed marginBottom to keep author right under title
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 8,
    flexWrap: "wrap",
    maxWidth: "100%",
    // This will always be at the bottom due to justifyContent: "space-between" on parent
  },
  readButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 20,
    paddingVertical: 11,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    flex: 0,
    maxWidth: "80%",
    minWidth: 90,
  },
  readButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 13,
    marginLeft: 6,
    fontFamily: 'Fredoka-SemiBold',
  },
  bookmarkButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexShrink: 0,
  },
  bookmarkButtonActive: {
    backgroundColor: '#FFF',
  },
  synopsisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    width: '100%', // Ensure card takes full width of its container
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  synopsisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  synopsisTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    color: "#2C3E50",
    marginLeft: 10,
  },
  synopsisContent: {
    fontSize: 15,
    lineHeight: 24,
    color: "#495057",
    textAlign: "justify",
  },
  synopsisLoading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  synopsisLoadingText: {
    marginLeft: 10,
    color: "#6C757D",
    fontStyle: "italic",
  },
  centeredMessageContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: "#2C3E50",
    fontWeight: "bold",
    fontFamily: 'Fredoka-SemiBold',
  },
  loadingSubText: {
    marginTop: 5,
    fontSize: 14,
    color: "#6C757D",
    fontStyle: "italic",
  },
  errorContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  errorText: {
    fontSize: 18,
    color: "#E74C3C",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 20,
    fontWeight: "bold",
    fontFamily: 'Fredoka-SemiBold',
  },
  goBackButton: {
    backgroundColor: "#4A90E2",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#4A90E2",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  goBackButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Fredoka-SemiBold',
  },
});

export default ViewStory;