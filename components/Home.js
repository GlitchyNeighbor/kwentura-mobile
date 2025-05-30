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
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { db } from "../FirebaseConfig";
import { collection, getDocs, orderBy, query, limit } from "firebase/firestore";
import AppHeader from "./Header";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const Home = ({ navigation }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedStories, setBookmarkedStories] = useState(new Set());

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      setError(null);
      try {
        const storiesCollectionRef = collection(db, "stories");
        const q = query(
          storiesCollectionRef,
          orderBy("createdAt", "desc"),
          limit(20)
        );

        const querySnapshot = await getDocs(q);
        const fetchedStories = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setStories(fetchedStories);
      } catch (error) {
        console.error("Error fetching stories: ", error);
        setError("Failed to fetch stories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchStories();
  }, []);

  const handleViewStory = (story) => {
    navigation.navigate("StoryDetails", {
      storyId: story.id,
      story: story,
    });
  };

  const handleBookmark = (story) => {
    const newBookmarkedStories = new Set(bookmarkedStories);
    if (bookmarkedStories.has(story.id)) {
      newBookmarkedStories.delete(story.id);
    } else {
      newBookmarkedStories.add(story.id);
    }
    setBookmarkedStories(newBookmarkedStories);
    console.log("Bookmarking story:", story.title);
  };

  const renderBookItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.bookItem}
      onPress={() => handleViewStory(item)}
      activeOpacity={0.8}
    >
      <View style={styles.bookImageContainer}>
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={styles.bookImage}
            onError={() => console.log("Failed to load image:", item.imageUrl)}
          />
        ) : (
          <LinearGradient
            colors={["#FF6B6B", "#FF8E8E"]}
            style={[styles.bookImage, styles.placeholderImage]}
          >
            <Text style={styles.placeholderText}>📚</Text>
          </LinearGradient>
        )}
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>
            {item.category?.substring(0, 3).toUpperCase() || "STY"}
          </Text>
        </View>
      </View>

      <View style={styles.bookInfo}>
        <Text style={styles.storyTitle} numberOfLines={2}>
          {item.title || "Untitled Story"}
        </Text>

        {item.author && (
          <Text style={styles.storyAuthor} numberOfLines={1}>
            by {item.author}
          </Text>
        )}

        <View style={styles.bookActions}>
          <TouchableOpacity
            style={styles.readButton}
            onPress={() => handleViewStory(item)}
          >
            <Text style={styles.readButtonText}>Read Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.bookmarkButton}
            onPress={() => handleBookmark(item)}
          >
            <Text style={styles.bookmarkIcon}>
              {bookmarkedStories.has(item.id) ? "🔖" : "🏷️"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryCard = (category, image, gradient) => (
    <TouchableOpacity
      key={category}
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(category)}
      activeOpacity={0.8}
    >
      <LinearGradient colors={gradient} style={styles.categoryGradient}>
        <Image source={image} style={styles.categoryImage} />
        <View style={styles.categoryOverlay}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const handleCategoryPress = (category) => {
    navigation.navigate("CategoriesTab", { selectedCategory: category });
  };

  const categoryData = [
    {
      name: "Fables",
      image: require("../books/bawal.png"),
      gradient: ["#FF6B6B", "#FF8E8E"],
    },
    {
      name: "Folktales",
      image: require("../books/buhok.png"),
      gradient: ["#4ECDC4", "#44A08D"],
    },
    {
      name: "Legends",
      image: require("../books/pinya.png"),
      gradient: ["#A8E6CF", "#88D8A3"],
    },
    {
      name: "Myths",
      image: require("../books/rihawani.png"),
      gradient: ["#FFD93D", "#FF9A3D"],
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />

      <AppHeader
        navigation={navigation}
        leftIconType="drawer"
        showSearch={true}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Discover Amazing Stories</Text>
          <Text style={styles.welcomeSubtitle}>
            Explore Filipino tales, legends, and folklore
          </Text>
        </View>

        {/* Categories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Browse Categories</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("CategoriesTab")}
            >
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categoryData.map((category) =>
              renderCategoryCard(
                category.name,
                category.image,
                category.gradient
              )
            )}
          </ScrollView>
        </View>

        {/* Featured Stories Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Featured Stories ({stories.length})
            </Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>
                Discovering amazing stories...
              </Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>📚</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  fetchStories();
                }}
              >
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : stories.length > 0 ? (
            <View style={styles.storiesGrid}>
              {stories.map(renderBookItem)}
            </View>
          ) : (
            <View style={styles.noStoriesContainer}>
              <Text style={styles.noStoriesIcon}>📖</Text>
              <Text style={styles.noStoriesText}>No stories found</Text>
              <Text style={styles.noStoriesSubtext}>
                Check your internet connection or try again later
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  welcomeSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
  },
  viewAllText: {
    fontSize: 14,
    color: "#FF6B6B",
    fontWeight: "600",
  },
  categoriesContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  categoryCard: {
    marginRight: 15,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryGradient: {
    width: width * 0.35,
    height: width * 0.35,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  categoryImage: {
    width: "70%",
    height: "70%",
    resizeMode: "cover",
    borderRadius: 12,
  },
  categoryOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  storiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 10,
    justifyContent: "space-between",
  },
  bookItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 20,
    padding: 12,
    width: width * 0.44,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bookImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  bookImage: {
    width: "100%",
    height: height * 0.18,
    borderRadius: 8,
    backgroundColor: "#F0F0F0",
  },
  placeholderImage: {
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 24,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
    lineHeight: 18,
  },
  storyAuthor: {
    fontSize: 12,
    color: "#666",
    marginBottom: 12,
    fontStyle: "italic",
  },
  bookActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readButton: {
    backgroundColor: "#FF6B6B",
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
  },
  bookmarkIcon: {
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  errorText: {
    textAlign: "center",
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  noStoriesContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noStoriesIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noStoriesText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  noStoriesSubtext: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default Home;
