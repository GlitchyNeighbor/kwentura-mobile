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
} from "react-native";
import React, { useState, useEffect } from "react";
import { db } from "../FirebaseConfig";
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import AppHeader from "./Header";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const Search = ({ navigation }) => {
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState([
    "Marikit and the Ocean of Stars",
    "Ang Kahon ni Lola",
    "Sandangaw",
  ]);
  const [suggestedSearches] = useState([
    "Ang Alamat ng Pinya",
    "Kalipay and the Tiniest Tiktik",
    "Ang Pagong at Ang Matsing",
  ]);

  useEffect(() => {
    fetchStories();
  }, []);

  useEffect(() => {
    filterStories();
  }, [searchQuery, stories]);

  const fetchStories = async () => {
    setLoading(true);
    setError(null);
    try {
      const storiesCollectionRef = collection(db, "stories");
      const q = query(storiesCollectionRef, orderBy("createdAt", "desc"));

      const querySnapshot = await getDocs(q);
      const fetchedStories = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

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
  };

  const handleSuggestionPress = (suggestion) => {
    setSearchQuery(suggestion);
    setIsSearchFocused(false);
    if (!recentSearches.includes(suggestion)) {
      setRecentSearches((prev) => [suggestion, ...prev.slice(0, 2)]);
    }
  };

  const handleViewStory = (story) => {
    navigation.navigate("StoryDetails", {
      storyId: story.id,
      story: story,
    });
  };

  const handleBookmark = (story) => {
    console.log("Bookmarking story:", story.title);
    // Implement bookmark functionality here
  };

  const clearSearch = () => {
    setSearchQuery("");
    setIsSearchFocused(false);
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
            <Text style={styles.bookmarkIcon}>🔖</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategorySection = (categoryName, categoryKey) => {
    const categoryStories = stories.filter(
      (story) => story.category?.toLowerCase() === categoryKey.toLowerCase()
    );

    if (categoryStories.length === 0) return null;

    return (
      <View key={categoryKey} style={styles.categorySection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{categoryName}</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("CategoriesTab", {
                selectedCategory: categoryKey,
              })
            }
          >
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

  const getAllCategories = () => {
    const categories = stories
      .map((story) => story.category)
      .filter((cat) => !!cat);
    return Array.from(new Set(categories));
  };

  const renderStoriesByCategory = () => {
    const categories = getAllCategories();
    return (
      <View style={styles.categoriesContainer}>
        {categories.map((category) =>
          renderCategorySection(category, category)
        )}
      </View>
    );
  };

  const renderSuggestionChip = (item, index, isRecent = false) => (
    <TouchableOpacity
      key={index}
      style={[styles.suggestionChip, isRecent && styles.recentChip]}
      onPress={() => handleSuggestionPress(item)}
    >
      <Text
        style={[styles.suggestionChipText, isRecent && styles.recentChipText]}
      >
        {isRecent ? "🕒 " : "💡 "}
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />

      <AppHeader
        navigation={navigation}
        leftIconType="drawer"
        showSearch={false}
      />

      {/* Enhanced Search Bar */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchInputContainer,
            isSearchFocused && styles.searchInputFocused,
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search stories, authors, categories..."
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Enhanced Suggestions */}
      {!searchQuery.trim() && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionSectionTitle}>Recent Searches</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionScrollView}
          >
            {recentSearches.map((item, index) =>
              renderSuggestionChip(item, index, true)
            )}
          </ScrollView>

          <Text style={styles.suggestionSectionTitle}>Suggested for You</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.suggestionScrollView}
          >
            {suggestedSearches.map((item, index) =>
              renderSuggestionChip(item, index, false)
            )}
          </ScrollView>
        </View>
      )}

      {/* Search Results Header */}
      {searchQuery.trim() && (
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsText}>
            Found {filteredStories.length} result
            {filteredStories.length !== 1 ? "s" : ""} for "{searchQuery}"
          </Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
      >
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
            <TouchableOpacity style={styles.retryButton} onPress={fetchStories}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : searchQuery.trim() ? (
          filteredStories.length > 0 ? (
            <View style={styles.searchResultsContainer}>
              {filteredStories.map(renderBookItem)}
            </View>
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResultsIcon}>🔍</Text>
              <Text style={styles.noResultsText}>No stories found</Text>
              <Text style={styles.noResultsSubtext}>
                Try different keywords or browse our categories below
              </Text>
            </View>
          )
        ) : (
          renderStoriesByCategory()
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  searchInputFocused: {
    borderColor: "#FF6B6B",
    shadowOpacity: 0.15,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    color: "#999",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "sans-serif",
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: "#999",
  },
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  suggestionSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginTop: 8,
  },
  suggestionScrollView: {
    marginBottom: 15,
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
  searchResultsHeader: {
    paddingHorizontal: 20,
    paddingBottom: 15,
  },
  searchResultsText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 20,
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
  searchResultsContainer: {
    paddingHorizontal: 20,
  },
  categoriesContainer: {
    paddingTop: 10,
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
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  noResultsIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  noResultsSubtext: {
    textAlign: "center",
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
});

export default Search;
