import React, { useEffect, useState, useRef } from "react";
import {
  View,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  Image,
  Text,
  TouchableOpacity,
  ImageBackground,
  Alert,
  TouchableWithoutFeedback,
  FlatList,
} from "react-native";
import { doc, getDoc, updateDoc, increment, setDoc, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../FirebaseConfig";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  withSequence,
  withRepeat,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedUri } from "../services/preloadService";

import AppHeader from "./HeaderReadStory";

const { width, height } = Dimensions.get("window");

const ReadStory = ({ route, navigation }) => {
  const storyId = route.params?.storyId;
  const [pageImages, setPageImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [imagesReady, setImagesReady] = useState(false);
  const [pageTexts, setPageTexts] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyAuthor, setStoryAuthor] = useState("");
  const [showCompletion, setShowCompletion] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showUI, setShowUI] = useState(true); // State to control UI visibility
  const uiOpacity = useSharedValue(1); // For animating UI visibility
  
  const flatListRef = useRef(null);

  // Animation values
  const speakerScale = useSharedValue(1);
  const starRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const completionScale = useSharedValue(0);
  const celebrationBounce = useSharedValue(1);

  // Start sparkle animation on load
  useEffect(() => {
    sparkleOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    );
    
    starRotation.value = withRepeat(
      withTiming(360, { duration: 3000 }),
      -1,
      false
    );
  }, []);

  // Completion screen animations
  useEffect(() => {
    if (showCompletion) {
      completionScale.value = withSpring(1, { damping: 15 });
    }
  }, [showCompletion]);

  // UI visibility timer
  useEffect(() => {
    let timer;
    if (showUI) {
      uiOpacity.value = withTiming(1, { duration: 300 });
      timer = setTimeout(() => {
        uiOpacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(setShowUI)(false);
        });
      }, 2000);
    } else {
      uiOpacity.value = withTiming(0, { duration: 300 });
    }
    return () => clearTimeout(timer);
  }, [showUI]);

  // Increment "users read" count when story is completed
  useEffect(() => {
    const auth = getAuth();
    if (showCompletion && auth.currentUser && storyId) {
      const userId = auth.currentUser.uid;
      const storyRef = doc(db, "stories", storyId);
      const userReadRef = doc(collection(storyRef, "readers"), userId);

      const checkIfUserRead = async () => {
        try {
          const userReadSnap = await getDoc(userReadRef);
          if (!userReadSnap.exists()) {
            // User hasn't read this story before, increment count and mark as read
            await updateDoc(storyRef, {
              usersRead: increment(1)
            });
            await setDoc(userReadRef, { readAt: new Date() }); // Mark as read
            console.log(`Story ${storyId} read count incremented for user ${userId}`);
          } else {
            console.log(`User ${userId} already read story ${storyId}. Not incrementing.`);
          }
        } catch (error) {
          console.error("Error updating usersRead count:", error);
        }
      };
      checkIfUserRead();
    }
  }, [showCompletion, storyId]);

  useEffect(() => {
    async function fetchPages() {
      if (!storyId) {
        setError("Story ID is missing.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      setImagesReady(false);
  
      try {
        // Try to load from cache first
        const cachedStory = await AsyncStorage.getItem(`story_${storyId}`);
        if (cachedStory) {
          const { data, timestamp } = JSON.parse(cachedStory);
          // Cache is valid for 1 hour
          if (new Date().getTime() - timestamp < 3600000) { 
            console.log("Loading story from cache");
            await processStoryData(data);
            setLoading(false);
            return;
          }
        }
  
        // If not in cache or cache is invalid, fetch from Firestore
        console.log("Fetching story from Firestore");
        const storyRef = doc(db, "stories", storyId);
        const docSnap = await getDoc(storyRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Cache the fetched data with a timestamp
          await AsyncStorage.setItem(`story_${storyId}`, JSON.stringify({ data, timestamp: new Date().getTime() }));
          await processStoryData(data);
        } else {
          setError("Story not found.");
          setImagesReady(true);
        }
      } catch (err) {
        console.error("Error fetching page images:", err);
        setError("Failed to load story pages. Please try again.");
        setImagesReady(true);
      }
      setLoading(false);
    }
  
    async function processStoryData(data) {
      let images = [];
      let texts = [];
  
      setStoryTitle(data.title || "");
      setStoryAuthor(data.author || "");
  
      if (Array.isArray(data.pageImages)) {
        images = data.pageImages;
      } else if (data.pageImages && typeof data.pageImages === "object") {
        images = Object.keys(data.pageImages)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => data.pageImages[k]);
      }
  
      if (Array.isArray(data.pageTexts)) {
        texts = data.pageTexts;
      } else if (data.pageTexts && typeof data.pageTexts === "object") {
        texts = Object.keys(data.pageTexts)
          .sort((a, b) => Number(a) - Number(b))
          .map((k) => data.pageTexts[k]);
      }
      setPageTexts(texts);
  
      if (images.length > 0) {
        const contentImages = images.slice(1);
        const cachedImages = await Promise.all(contentImages.map(getCachedUri));
        setPageImages(cachedImages);

        if (data.ttsAudioData && Array.isArray(data.ttsAudioData)) {
          const cachedAudioData = await Promise.all(
            data.ttsAudioData.map(async (audio) => ({
              ...audio,
              audioUrl: await getCachedUri(audio.audioUrl),
            }))
          );
          setAudioData(cachedAudioData);
        }

        setImagesReady(true);
      } else {
        setError("Story or page images not found.");
        setImagesReady(true);
      }
    }
  
    fetchPages();
  }, [storyId]);

  // Auto-play with visual feedback
  useEffect(() => {
    if (imagesReady && pageTexts[currentPage] && !showCompletion) {
      if (currentAudio) {
        currentAudio.unloadAsync();
      }
      
      if (audioData[currentPage]) {
        setIsPlaying(true);
        speakerScale.value = withRepeat(
          withSequence(
            withSpring(1.2, { damping: 10 }),
            withSpring(1, { damping: 10 })
          ),
          3,
          true
        );
        
        playAudio(audioData[currentPage]);
      }
    }
  }, [currentPage, imagesReady, pageTexts, showCompletion, audioData]);

  // Cleanup audio when component unmounts or loses focus
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null); // Clear the audio object
      }
    });

    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', () => {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
    });

    return () => {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
      unsubscribeBlur();
      unsubscribeBeforeRemove();
    };
  }, [currentAudio, navigation]);

  // Speaker animation
  const speakerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: speakerScale.value }],
  }));

  // Star rotation animation
  const starAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${starRotation.value}deg` }],
  }));

  // Sparkle animation
  const sparkleAnimatedStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  // Completion screen animations
  const completionAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: completionScale.value }],
  }));

  const celebrationAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: celebrationBounce.value }],
  }));

  // UI opacity animation
  const uiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: uiOpacity.value,
  }));

  // Play audio function
  const playAudio = async (audioUrl) => {
    setIsLoadingAudio(true);
    
    if (currentAudio) {
      await currentAudio.unloadAsync();
      setCurrentAudio(null);
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl.audioUrl },
        { shouldPlay: true },
        (status) => {
          if (status.didJustFinish) {
            setIsPlaying(false);
            speakerScale.value = withSpring(1);
            setCurrentAudio(null);
          }
        }
      );
      setCurrentAudio(sound);
      setIsPlaying(true);
    } catch (error) {
      console.error('Failed to load sound:', error);
      setIsPlaying(false);
      speakerScale.value = withSpring(1);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentPage) {
        setCurrentPage(newIndex);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Enhanced navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
      setShowCompletion(false);
      flatListRef.current.scrollToIndex({ animated: true, index: currentPage - 1 });
    }
  };

  const goToNextPage = () => {
    if (currentPage < pageImages.length - 1) {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
      setShowCompletion(false);
      flatListRef.current.scrollToIndex({ animated: true, index: currentPage + 1 });
    } else {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
      setShowCompletion(true);
      completionScale.value = 0;
      completionScale.value = withSpring(1, { damping: 15 });
    }
  };

  // Enhanced TTS with visual feedback
  const handleSpeak = () => {
    if (!audioData[currentPage]) {
      Alert.alert("No Audio", "No audio is available for this page.");
      return;
    }

    if (isPlaying && currentAudio) {
      currentAudio.unloadAsync();
      setIsPlaying(false);
      speakerScale.value = withSpring(1);
      setCurrentAudio(null); // Add this line
    } else {
      playAudio(audioData[currentPage]);
    }
  };

  const handleBackToStories = () => {
    if (currentAudio) {
      currentAudio.unloadAsync();
      setCurrentAudio(null);
    }
    navigation.navigate('Home');
  };

  // Completion Screen Component
  const CompletionScreen = () => (
    <Animated.View style={[styles.completionOverlay, completionAnimatedStyle]}>
      <View style={styles.completionContainer}>
        <Text style={styles.completionTitle}>🎉 Story Complete! 🎉</Text>
        
        <Text style={styles.completionMessage}>
          Great job! You finished the story!
        </Text>
        
        <View style={styles.completionButtons}>
          <TouchableOpacity
            style={[styles.completionButton, styles.readAgainButton]}
            onPress={() => {
              if (currentAudio) {
                currentAudio.unloadAsync();
                setCurrentAudio(null);
              }
              navigation.navigate('ComQuestions', { storyId: storyId, storyTitle: storyTitle });
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.completionButtonEmoji}>📝</Text>
            <Text style={styles.completionButtonText}>Answer Questions</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.completionButton, styles.backButton]}
            onPress={handleBackToStories}
            activeOpacity={0.8}
          >
            <Text style={styles.completionButtonEmoji}>🏠</Text>
            <Text style={styles.completionButtonText}>Back to Stories</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  const renderPage = ({ item }) => (
    <View style={styles.pageImageContainer}>
      <View style={styles.imageFrame}>
        <Image
          source={{ uri: item }}
          style={styles.pageImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  if (loading || !imagesReady) {
    return (
      <ImageBackground
        source={require('../images/DarkHome.png')}
        style={styles.background}
        resizeMode="cover"
      >
        <SafeAreaView style={styles.centered}>
          <Animated.View style={[styles.loadingContainer, sparkleAnimatedStyle]}>
            <Text style={styles.loadingTitle}>✨ Getting Your Story Ready!</Text>
            <ActivityIndicator size="large" color="#FFD700" />
            <Text style={styles.loadingText}>
              {loading ? "📚 Loading magical pages..." : "Preparing the images... ✨"}
            </Text>
            <Animated.Text style={[styles.sparkle, starAnimatedStyle]}>⭐</Animated.Text>
          </Animated.View>
        </SafeAreaView>
      </ImageBackground>
    );
  }

  return (
    
    <ImageBackground
      source={require('../images/DarkViewStory.png')}
      style={styles.background}
      resizeMode="cover"
    >    
    <AppHeader
              navigation={navigation}
              leftIconType="drawer"
              showSearch={true}
            />  

      <GestureHandlerRootView style={{ flex: 1 }}>
      
        <SafeAreaView style={styles.safeArea}>
          <TouchableWithoutFeedback onPress={() => setShowUI(true)}>
            <View style={{ flex: 1 }}>

           <View style={styles.container}>
            

            {pageImages.length > 0 ? (
              <>
                {/* Story Title and Author */}
                <Animated.View style={[styles.storyHeader, uiAnimatedStyle]}>
                  {storyTitle ? (
                    <Text style={styles.storyTitle}>{storyTitle}</Text>
                  ) : null}
                  {storyAuthor ? (
                    <Text style={styles.storyAuthor}>by {storyAuthor}</Text>
                  ) : null}
                </Animated.View>
              

                {/* Show completion screen when story is finished */}
                {showCompletion && <CompletionScreen />}
                
                {/* Decorative sparkles */}
                <Animated.Text style={[styles.decorativeSparkle, styles.bottomLeft, sparkleAnimatedStyle]}>⭐</Animated.Text>
                <Animated.Text style={[styles.decorativeSparkle, styles.bottomRight, sparkleAnimatedStyle]}>✨</Animated.Text>

                <FlatList
                  ref={flatListRef}
                  data={pageImages}
                  renderItem={renderPage}
                  keyExtractor={(item, index) => index.toString()}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  onViewableItemsChanged={onViewableItemsChanged}
                  viewabilityConfig={viewabilityConfig}
                  onScrollToIndexFailed={()=>{}}
                />
                

                {/* Enhanced Listen Button */}
                <Animated.View style={uiAnimatedStyle}>
                  <TouchableOpacity
                    style={styles.listenButton}
                    onPress={handleSpeak}
                    activeOpacity={0.8}
                    disabled={isLoadingAudio}
                  >
                    <Animated.View style={[styles.listenButtonContent, speakerAnimatedStyle]}>
                      <Text style={styles.listenButtonEmoji}>
                        {isLoadingAudio ? "⌛" : isPlaying ? "🔊" : "🎧"}
                      </Text>
                      <Text style={styles.listenButtonText}>
                        {isLoadingAudio ? "Loading..." : isPlaying ? "Stop" : "Listen"}
                      </Text>
                    </Animated.View>
                  </TouchableOpacity>
                </Animated.View>

                {/* Enhanced Controls */}
                <Animated.View style={[styles.controls, uiAnimatedStyle]}>
                  <TouchableOpacity
                    style={[styles.navButton, currentPage === 0 && styles.disabledButton]}
                    onPress={goToPreviousPage}
                    disabled={currentPage === 0}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.navButtonText}>{"⬅️ Back"}</Text>
                  </TouchableOpacity>
                  
                  <View style={styles.pageIndicatorContainer}>
                    <Text style={styles.pageIndicator}>
                       Page {currentPage + 1} of {pageImages.length}
                    </Text>
                    <View style={styles.progressBar}>
                      <View 
                        style={[
                          styles.progressFill, 
                          { width: `${((currentPage + 1) / pageImages.length) * 100}%` }
                        ]} 
                      />
                    </View>
                  </View>
                  
                  <TouchableOpacity
                    style={[styles.navButton, currentPage === pageImages.length - 1 && styles.lastPageButton]}
                    onPress={goToNextPage}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.navButtonText}>
                      {currentPage === pageImages.length - 1 ? "🎉 Finish" : "Next ➡️"}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              </>
            ) : (
              <View style={styles.centered}>
                <Text style={styles.errorTitle}>📚 Oops!</Text>
                <Text style={styles.errorText}>{error || "No pages found for this story."}</Text>
                <Text style={styles.subText}>Let's try again or pick a different story!</Text>
                <TouchableOpacity 
                  style={styles.retryButton}
                  onPress={() => navigation.goBack()}
                >
                  <Text style={styles.retryButtonText}>🌟 Choose Another Story</Text>
                </TouchableOpacity>
              </View>
            )}
            
          </View>
          
            </View>
          </TouchableWithoutFeedback>
        </SafeAreaView>
        
      </GestureHandlerRootView>
      
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  safeArea: { 
    flex: 1 
  },
  container: { 
    flex: 1, 
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20,
  },
  // Story Header Styles
  storyHeader: {
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 10,
    borderWidth: 2,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
    marginTop: 100,
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 5,
  },
  storyAuthor: {
    fontSize: 16,
    color: '#4ECDC4',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  loadingContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4ECDC4',
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  sparkle: {
    fontSize: 30,
    position: 'absolute',
    top: -15,
    right: -15,
  },
  // Completion Screen Styles
  completionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  completionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    maxWidth: width * 0.85,
  },
  completionTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 20,
    textAlign: 'center',
  },
  completionMessage: {
    fontSize: 16,
    color: '#4ECDC4',
    textAlign: 'center',
    marginBottom: 25,
    fontWeight: '600',
  },
  completionButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  completionButton: {
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderWidth: 3,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  readAgainButton: {
    backgroundColor: '#4ECDC4',
  },
  backButton: {
    backgroundColor: '#FF6B6B',
  },
  completionButtonEmoji: {
    fontSize: 20,
    marginBottom: 5,
  },
  completionButtonText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  floatingEmoji: {
    position: 'absolute',
    fontSize: 20,
  },
  float1: { top: 10, left: 20 },
  float2: { top: 20, right: 15 },
  float3: { bottom: 15, left: 15 },
  float4: { bottom: 10, right: 20 },
  decorativeSparkle: {
    position: 'absolute',
    fontSize: 25,
    zIndex: 1,
  },
  topLeft: { top: 100, left: 20 },
  topRight: { top: 120, right: 30 },
  bottomLeft: { bottom: 160, left: 25 },
  bottomRight: { bottom: 180, right: 20 },
  pageImageContainer: {
    width: width,
    height: height * 0.8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageFrame: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    borderWidth: 3,
    borderColor: '#FFD700',
  },
  pageImage: { 
    width: width * 0.85, 
    height: height * 0.6,
    borderRadius: 10,
  },
  listenButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginBottom: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 3,
    borderColor: 'white',
    position: 'absolute',
    bottom: 70,
    alignSelf: 'center',
    zIndex: 10,
  },
  listenButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  listenButtonEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  listenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "95%",
    marginBottom: 15,
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    zIndex: 10,
  },
  navButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  lastPageButton: {
    backgroundColor: '#FFD700',
  },
  navButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  pageIndicatorContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 15,
    padding: 10,
    minWidth: 120,
  },
  pageIndicator: { 
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 5,
  },
  progressBar: {
    width: 100,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  helpText: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 15,
    marginTop: 10,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
    marginBottom: 10,
  },
  errorText: { 
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
    backgroundColor: 'rgba(255, 107, 107, 0.8)',
    padding: 15,
    borderRadius: 10,
  },
  subText: { 
    color: '#4ECDC4',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FFD700',
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ReadStory;