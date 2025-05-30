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
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import AppHeader from "./Header";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const Categories = ({ navigation }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookmarkedStories, setBookmarkedStories] = useState(new Set());

  useEffect(() => {
    fetchAllStories();
  }, []);

  const fetchAllStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const storiesCollectionRef = collection(db, "stories");
      const q = query(storiesCollectionRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const allStories = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setStories(allStories);
    } catch (error) {
      console.error("Error fetching stories: ", error);
      setError("Failed to fetch stories. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Group stories by category
  const getAllCategories = () => {
    const categories = stories
      .map((story) => story.category)
      .filter((cat) => !!cat);
    return Array.from(new Set(categories));
  };

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

  const handleViewAll = (category) => {
    navigation.navigate("CategoryStories", { category });
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

  const renderCategorySection = (category) => {
    const categoryStories = stories.filter(
      (story) => story.category?.toLowerCase() === category.toLowerCase()
    );
    if (categoryStories.length === 0) return null;

    return (
      <View key={category} style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{category}</Text>
          <TouchableOpacity onPress={() => handleViewAll(category)}>
            <Text style={styles.viewAllText}>View All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScrollContainer}
        >
          {categoryStories.slice(0, 6).map(renderBookItem)}
        </ScrollView>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          navigation={navigation}
          leftIconType="drawer"
          showSearch={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader
          navigation={navigation}
          leftIconType="drawer"
          showSearch={true}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchAllStories}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const categories = getAllCategories();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <AppHeader
        navigation={navigation}
        leftIconType="drawer"
        showSearch={true}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <View style={styles.categoriesContainer}>
          {categories.map((category) => renderCategorySection(category))}
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
  categoriesContainer: {
    paddingTop: 10,
  },
  categorySection: {
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
  horizontalScrollContainer: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  bookItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginRight: 15,
    marginBottom: 15,
    padding: 12,
    width: width * 0.42,
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
});

export default Categories;
