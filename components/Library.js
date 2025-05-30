import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import AppHeader from "./Header";

const { width, height } = Dimensions.get("window");

const Library = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader
        navigation={navigation}
        leftIconType="drawer"
        showSearch={true}
      />

      <ScrollView>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Fables (Pabula)</Text>
          <TouchableOpacity style={{ marginLeft: "auto" }}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.bookContainer}>
          <View style={styles.bookItem}>
            <Image
              source={require("../books/sandangaw.png")}
              style={styles.books}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.Button}>
                <Text style={styles.text}>View Story</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={require("../icons/bookmark-clicked.png")}
                  style={styles.bookmark}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.bookItem}>
            <Image
              source={require("../books/palay.png")}
              style={styles.books}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.Button}>
                <Text style={styles.text}>View Story</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={require("../icons/bookmark-clicked.png")}
                  style={styles.bookmark}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.bookItem}>
            <Image
              source={require("../books/kalabaw.png")}
              style={styles.books}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.Button}>
                <Text style={styles.text}>View Story</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={require("../icons/bookmark-clicked.png")}
                  style={styles.bookmark}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.bookContainer}>
          <View style={styles.bookItem}>
            <Image
              source={require("../books/buhok.png")}
              style={styles.books}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.Button}>
                <Text style={styles.text}>View Story</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={require("../icons/bookmark-red.png")}
                  style={styles.bookmark}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.bookItem}>
            <Image
              source={require("../books/kalabaw.png")}
              style={styles.books}
            />
            <View style={styles.row}>
              <TouchableOpacity style={styles.Button}>
                <Text style={styles.text}>View Story</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={require("../icons/bookmark-clicked.png")}
                  style={styles.bookmark}
                />
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.bookItem}>
            <Image source={require("../books/tuko.png")} style={styles.books} />
            <View style={styles.row}>
              <TouchableOpacity style={styles.Button}>
                <Text style={styles.text}>View Story</Text>
              </TouchableOpacity>
              <TouchableOpacity>
                <Image
                  source={require("../icons/bookmark-red.png")}
                  style={styles.bookmark}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },

  sectionHeader: {
    flexDirection: "row",
    paddingHorizontal: 10,
    marginTop: 15,
    marginBottom: 5,
    alignItems: "center",
  },
  sectionTitle: {
    fontFamily: "sans-serif-medium",
    fontWeight: "bold",
    fontSize: 16,
  },
  viewAllText: {
    fontFamily: "sans-serif-medium",
    fontWeight: "bold",
    fontSize: 14,
    color: "red",
  },
  books: {
    width: width * 0.28,
    height: height * 0.18,
    borderWidth: 1,
    borderColor: "#ddd",
    resizeMode: "cover",
    borderRadius: 4,
  },
  bookContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 5,
    justifyContent: "space-around",
    marginTop: 10,
  },
  bookItem: {
    marginBottom: 20,
    alignItems: "center",
    width: width * 0.3,
  },
  Button: {
    backgroundColor: "red",
    marginTop: 8,
    borderRadius: 5,
    paddingVertical: 5,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginRight: 5,
  },
  text: {
    alignSelf: "center",
    fontSize: 11,
    fontFamily: "sans-serif-medium",
    color: "white",
  },
  bookmark: {
    width: 22,
    height: 22,
    marginTop: 8,
    resizeMode: "contain",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    width: "100%",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
});

export default Library;
