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
import * as ScreenOrientation from 'expo-screen-orientation';

import AppHeader from "./HeaderReadStory";

const { width, height } = Dimensions.get("window");

const ReadStory = ({ route, navigation }) => {
  const storyId = route.params?.storyId;
  const initialPage = route.params?.initialPage || 0; // Get initial page from route params
  const [pageImages, setPageImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(initialPage); // Set initial page
  const [imagesReady, setImagesReady] = useState(false);
  const [pageTexts, setPageTexts] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [storyTitle, setStoryTitle] = useState("");
  const [storyAuthor, setStoryAuthor] = useState("");
  const [storyData, setStoryData] = useState(null); // Store complete story data
  const [showCompletion, setShowCompletion] = useState(false);
  const [audioData, setAudioData] = useState([]);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [isLandscape, setIsLandscape] = useState(false);
  const [availableLanguages, setAvailableLanguages] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState(null);
  const [originalPageTexts, setOriginalPageTexts] = useState({});
  const uiOpacity = useSharedValue(1);
  
  const flatListRef = useRef(null);
  const isScrollingRef = useRef(false);
  const orientationChangeRef = useRef(false);
  const hasScrolledToInitialPage = useRef(false);

  // Animation values
  const speakerScale = useSharedValue(1);
  const starRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);
  const completionScale = useSharedValue(0);
  const celebrationBounce = useSharedValue(1);

  // Save progress function
  const saveProgress = async (pageIndex) => {
    const auth = getAuth();
    if (!auth.currentUser || !storyData || pageIndex < 0) return;

    try {
      const userId = auth.currentUser.uid;
      const progressRef = doc(db, "students", userId, "progress", storyId);
      
      const progressData = {
        id: storyId,
        title: storyData.title || "Untitled Story",
        author: storyData.author || "",
        imageUrl: storyData.image || "",
        category: storyData.category || "",
        currentPage: pageIndex,
        totalPages: pageImages.length,
        lastReadAt: new Date(),
        synopsis: storyData.synopsis || ""
      };

      await setDoc(progressRef, progressData, { merge: true });
      console.log(`Progress saved: Page ${pageIndex + 1}/${pageImages.length}`);
    } catch (error) {
      console.error("Error saving progress:", error);
    }
  };

  const handleLanguageToggle = () => {
    if (availableLanguages.length < 2) return;

    const currentIndex = availableLanguages.indexOf(currentLanguage);
    const nextIndex = (currentIndex + 1) % availableLanguages.length;
    const nextLanguage = availableLanguages[nextIndex];
    setCurrentLanguage(nextLanguage);

    // Stop any currently playing audio
    if (currentAudio) {
      currentAudio.unloadAsync();
      setCurrentAudio(null);
      setIsPlaying(false);
      speakerScale.value = withSpring(1);
    }
  };

  // Handle orientation change with improved synchronization
  const toggleOrientation = async () => {
    try {
      orientationChangeRef.current = true;
      const targetPage = currentPage;
      
      if (isLandscape) {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        setIsLandscape(false);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        setIsLandscape(true);
      }
      
      // Wait longer for orientation change to complete and force scroll to correct page
      setTimeout(() => {
        if (flatListRef.current && pageImages.length > 0) {
          flatListRef.current.scrollToIndex({ 
            animated: false, 
            index: targetPage 
          });
          // Double check after a short delay
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToIndex({ 
                animated: false, 
                index: targetPage 
              });
            }
            orientationChangeRef.current = false;
          }, 100);
        } else {
          orientationChangeRef.current = false;
        }
      }, 200);
      
    } catch (error) {
      console.error('Error changing orientation:', error);
      orientationChangeRef.current = false;
    }
  };

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
            await updateDoc(storyRef, {
              usersRead: increment(1)
            });
            await setDoc(userReadRef, { readAt: new Date() });
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
        const cachedStory = await AsyncStorage.getItem(`story_${storyId}`);
        if (cachedStory) {
          const { data, timestamp } = JSON.parse(cachedStory);
          if (new Date().getTime() - timestamp < 3600000) { 
            console.log("Loading story from cache");
            await processStoryData(data);
            setLoading(false);
            return;
          }
        }
  
        console.log("Fetching story from Firestore");
        const storyRef = doc(db, "stories", storyId);
        const docSnap = await getDoc(storyRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data();
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
      setStoryData(data); // Store complete story data
  
      // Determine available languages
      const baseLang = data.language || 'fil-PH';
      const translationKeys = data.translations ? Object.keys(data.translations) : [];
      const uniqueLangs = [...new Set([baseLang, ...translationKeys])];
      setAvailableLanguages(uniqueLangs);
      setCurrentLanguage(baseLang);

      // Store all page text variations
      const allPageTexts = {
        [baseLang]: data.pageTexts || [],
        ...data.translations,
      };
      setOriginalPageTexts(allPageTexts);
      setPageTexts(allPageTexts[baseLang] || []);

      // Process page images
      const imageSources = Array.isArray(data.pageImages)
        ? data.pageImages
        : data.pageImages && typeof data.pageImages === 'object'
        ? Object.entries(data.pageImages)
            .sort(([keyA], [keyB]) => parseInt(keyA.replace('page', '')) - parseInt(keyB.replace('page', '')))
            .map(([, value]) => value)
        : [];

      if (imageSources.length > 0) {
        const cachedImages = await Promise.all(imageSources.map(getCachedUri));
        setPageImages(cachedImages);
        setImagesReady(true);
      } else {
        setError("Story or page images not found.");
        setImagesReady(true);
      }
    }
  
    fetchPages();
  }, [storyId]);

  // Effect to update texts and audio when language changes
  useEffect(() => {
    if (!storyData || !currentLanguage) return;

    // Update page texts
    setPageTexts(originalPageTexts[currentLanguage] || []);

    // Update audio data
    const updateAudio = async () => {
      const ttsForLanguage = storyData.ttsAudio?.[currentLanguage];
      if (ttsForLanguage && Array.isArray(ttsForLanguage)) {
        const cachedAudioData = await Promise.all(
          ttsForLanguage.map(async (audio) => ({
            ...audio,
            audioUrl: await getCachedUri(audio.audioUrl),
          }))
        );
        setAudioData(cachedAudioData);
      } else {
        console.log(`No TTS audio found for language: ${currentLanguage}`);
        setAudioData([]);
      }
    };

    updateAudio();
  }, [currentLanguage, storyData, originalPageTexts]);

  // Scroll to initial page when images are ready
  useEffect(() => {
    if (imagesReady && pageImages.length > 0 && !hasScrolledToInitialPage.current) {
      setTimeout(() => {
        if (flatListRef.current && initialPage > 0) {
          flatListRef.current.scrollToIndex({ 
            animated: false, 
            index: initialPage 
          });
        }
        hasScrolledToInitialPage.current = true;
      }, 100);
    }
  }, [imagesReady, pageImages.length, initialPage]);

  // Save progress when page changes
  useEffect(() => {
    if (imagesReady && storyData && currentPage >= 0) {
      saveProgress(currentPage);
    }
  }, [currentPage, imagesReady, storyData]);

  // Auto-play with visual feedback
  useEffect(() => {
    if (imagesReady && pageTexts[currentPage] && !showCompletion) {
      if (currentAudio) {
        currentAudio.unloadAsync();
      }
      
      const audioForPage = audioData.find(audio => audio.pageNumber === currentPage + 1);
      if (audioForPage) {
        setIsPlaying(true);
        speakerScale.value = withRepeat(
          withSequence(
            withSpring(1.2, { damping: 10 }),
            withSpring(1, { damping: 10 })
          ),
          -1, // Loop indefinitely while playing
          true
        );
        
        playAudio(audioForPage);
      }
    }
  }, [currentPage, imagesReady, showCompletion, audioData]);

  // Cleanup audio when component unmounts or loses focus
  useEffect(() => {
    const unsubscribeBlur = navigation.addListener('blur', () => {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
    });

    const unsubscribeBeforeRemove = navigation.addListener('beforeRemove', async () => {
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
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
  const playAudio = async (audioInfo) => {
    setIsLoadingAudio(true);
    
    if (currentAudio) {
      await currentAudio.unloadAsync();
      setCurrentAudio(null);
    }
  
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioInfo.audioUrl },
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

  // Improved viewable items handler with debouncing
  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (!orientationChangeRef.current && !isScrollingRef.current && viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      if (newIndex !== currentPage && newIndex !== null && newIndex !== undefined) {
        setCurrentPage(newIndex);
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
  }).current;

  // Improved navigation functions with better error handling
  const goToPreviousPage = () => {
    if (currentPage > 0 && !isScrollingRef.current) {
      isScrollingRef.current = true;
      
      if (currentAudio) {
        currentAudio.unloadAsync();
        setCurrentAudio(null);
      }
      
      setShowCompletion(false);
      const targetIndex = currentPage - 1;
      
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ 
          animated: true, 
          index: targetIndex 
        });
        
        // Update currentPage immediately for better UX
        setCurrentPage(targetIndex);
        
        setTimeout(() => {
          isScrollingRef.current = false;
        }, 300);
      }
    }
  };

  const goToNextPage = async () => {
    if (!isScrollingRef.current) {
      isScrollingRef.current = true;
      
      if (currentAudio) {
        try {
          await currentAudio.unloadAsync();
        } catch (e) { /* ignore */ }
        setCurrentAudio(null);
      }
      
      if (currentPage < pageImages.length - 1) {
        setShowCompletion(false);
        const targetIndex = currentPage + 1;
        
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({ 
            animated: true, 
            index: targetIndex 
          });
          
          // Update currentPage immediately for better UX
          setCurrentPage(targetIndex);
          
          setTimeout(() => {
            isScrollingRef.current = false;
          }, 300);
        }
      } else {
        setShowCompletion(true);
        completionScale.value = 0;
        completionScale.value = withSpring(1, { damping: 15 });
        isScrollingRef.current = false;
      }
    }
  };

  // Enhanced TTS with visual feedback
  const handleSpeak = () => {
    const audioForPage = audioData.find(audio => audio.pageNumber === currentPage + 1);
    if (!audioForPage) {
      Alert.alert("No Audio", "No audio is available for this page.");
      return;
    }
  
    if (isPlaying && currentAudio) {
      currentAudio.unloadAsync();
      setIsPlaying(false);
      speakerScale.value = withSpring(1);
      setCurrentAudio(null);
    } else {
      playAudio(audioForPage);
    }
  };

  const handleBackToStories = async () => {
    if (currentAudio) {
      currentAudio.unloadAsync();
      setCurrentAudio(null);
    }
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    navigation.navigate('HomeTab', { screen: 'Home' });
  };

  // Improved scroll handler
  const onScrollBeginDrag = () => {
    isScrollingRef.current = true;
  };

  const onMomentumScrollEnd = () => {
    setTimeout(() => {
      isScrollingRef.current = false;
    }, 100);
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
            onPress={async () => {
              if (currentAudio) {
                await currentAudio.unloadAsync();
                setCurrentAudio(null);
              }
              await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
              navigation.navigate('ComQuestions', { storyId, storyTitle });
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
    <View style={isLandscape ? styles.landscapePageImageContainer : styles.pageImageContainer}>
      <View style={isLandscape ? styles.landscapeImageFrame : styles.imageFrame}>
        <Image
          source={{ uri: item }}
          style={isLandscape ? styles.landscapePageImage : styles.pageImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );

  // Handle scroll to index failure
  const onScrollToIndexFailed = (info) => {
    const wait = new Promise(resolve => setTimeout(resolve, 500));
    wait.then(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({ index: info.index, animated: false });
      }
    });
  };

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
    <View style={{ flex: 1 }}>
      <ImageBackground
        source={require('../images/DarkViewStory.png')}
        style={styles.background}
        resizeMode="cover"
      >    
        {!isLandscape && (
          <AppHeader
            navigation={navigation}
            leftIconType="drawer"
            availableLanguages={availableLanguages}
            currentLanguage={currentLanguage}
            onLanguageToggle={handleLanguageToggle}
          />  
        )}

        <GestureHandlerRootView style={{ flex: 1 }}>
          <SafeAreaView style={styles.safeArea}>
            <TouchableWithoutFeedback onPress={() => setShowUI(true)}>
              <View style={{ flex: 1 }}>
                <View style={isLandscape ? styles.landscapeContainer : styles.container}>
                  {pageImages.length > 0 ? (
                    <>
                      {!isLandscape && (
                        <Animated.View style={[styles.storyHeader, uiAnimatedStyle]}>
                          {storyTitle ? (
                            <Text style={styles.storyTitle}>{storyTitle}</Text>
                          ) : null}
                          {storyAuthor ? (
                            <Text style={styles.storyAuthor}>by {storyAuthor}</Text>
                          ) : null}
                        </Animated.View>
                      )}

                      {!isLandscape && (
                        <>
                          <Animated.Text style={[styles.decorativeSparkle, styles.bottomLeft, sparkleAnimatedStyle]}>⭐</Animated.Text>
                          <Animated.Text style={[styles.decorativeSparkle, styles.bottomRight, sparkleAnimatedStyle]}>✨</Animated.Text>
                        </>
                      )}

                      <View style={isLandscape ? styles.landscapeStoryContent : styles.storyContent}>
                        <FlatList
                          ref={flatListRef}
                          data={pageImages}
                          renderItem={renderPage}
                          keyExtractor={(item, index) => `${item}-${index}`}
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          onViewableItemsChanged={onViewableItemsChanged}
                          viewabilityConfig={viewabilityConfig}
                          onScrollToIndexFailed={onScrollToIndexFailed}
                          onScrollBeginDrag={onScrollBeginDrag}
                          onMomentumScrollEnd={onMomentumScrollEnd}
                          removeClippedSubviews={false}
                          initialScrollIndex={initialPage}
                          getItemLayout={(data, index) => ({
                            length: isLandscape ? height : width,
                            offset: (isLandscape ? height : width) * index,
                            index,
                          })}
                        />
                      </View>

                      <Animated.View style={[
                        isLandscape ? styles.landscapeActionButtons : styles.actionButtons, 
                        uiAnimatedStyle
                      ]}>
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

                        <TouchableOpacity
                          style={styles.landscapeButton}
                          onPress={toggleOrientation}
                          activeOpacity={0.8}
                        >
                          <View style={styles.landscapeButtonContent}>
                            <Text style={styles.landscapeButtonEmoji}>
                              {isLandscape ? "📱" : "🔄"}
                            </Text>
                            <Text style={styles.landscapeButtonText}>
                              {isLandscape ? "Portrait" : "Landscape"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </Animated.View>

                      <Animated.View style={[
                        isLandscape ? styles.landscapeControls : styles.controls, 
                        uiAnimatedStyle
                      ]}>
                        <TouchableOpacity
                          style={[styles.navButton, (currentPage === 0 || isScrollingRef.current) && styles.disabledButton]}
                          onPress={goToPreviousPage}
                          disabled={currentPage === 0 || isScrollingRef.current}
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
                          style={[
                            styles.navButton, 
                            currentPage === pageImages.length - 1 && styles.lastPageButton,
                            isScrollingRef.current && styles.disabledButton
                          ]}
                          onPress={goToNextPage}
                          disabled={isScrollingRef.current}
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
      
      {showCompletion && <CompletionScreen />}
    </View>
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
  landscapeContainer: { 
    flex: 1,
    paddingTop: 10,
  },
  centered: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20,
  },
  storyHeader: {
    alignItems: 'center',
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
    marginHorizontal: 20,
    justifyContent: 'center',
    marginTop: 90,
    zIndex: 10,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 5,
  },
  storyAuthor: {
    fontSize: 15,
    color: '#4ECDC4',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  storyContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 50,
  },
  landscapeStoryContent: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 10,
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
    paddingHorizontal: 10,
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
  bottomLeft: { bottom: 100, left: 25 },
  bottomRight: { bottom: 120, right: 20 },
  pageImageContainer: {
    width: width,
    height: height * 0.60,
    justifyContent: "center",
    alignItems: "center",
  },
  landscapePageImageContainer: {
    width: height, // Use height as width in landscape
    height: width * 0.85, // Use most of the available height
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
  landscapeImageFrame: {
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
    height: height * 0.55,
    borderRadius: 10,
  },
  landscapePageImage: { 
    width: height * 0.90, // Use most of the height as width in landscape
    height: width * 0.70, // Use most of the width as height in landscape
    borderRadius: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute space evenly
    alignItems: 'center',
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
    zIndex: 10,
    marginLeft: 10,
    marginRight: 10,
  },
  landscapeActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute space evenly
    alignItems: 'center',
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    marginBottom: 20,
    gap: 450
  },
  listenButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 3,
    borderColor: 'white',
    flex: 0.45, // Use flex to control width instead of fixed values
    marginBottom: 10,
    
  },
  landscapeButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    borderWidth: 3,
    borderColor: 'white',
    flex: 0.45, // Use flex to control width instead of fixed values
    marginBottom: 10,

    
  },
  listenButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

  },
  landscapeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    
  },
  listenButtonEmoji: {
    fontSize: 18,
    marginRight: 10,
    
  },
  landscapeButtonEmoji: {
    fontSize: 18,
    marginRight: 10,
  },
  listenButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  landscapeButtonText: {
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
  landscapeControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "95%",
    marginBottom: 10,
    position: 'absolute',
    bottom: 5,
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