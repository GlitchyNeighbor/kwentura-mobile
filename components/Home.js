import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";

const Home = ({ navigation }) => {

  return (
    <SafeAreaView style={{ width: "100%", height: "100%" }}>
      <View>
        <View
          style={{
            marginTop: 30,
            marginLeft: 10,
            marginRight: 10,
            marginBottom: 20,
          }}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={()=>navigation.navigate('Profile')}>
              <Image
                source={require("../icons/circle-user.png")}
                style={{
                  width: 30,
                  height: 30,
                  alignSelf: "center",
                  marginRight: "auto",
                }}
              />
              </TouchableOpacity>
              <Text
                style={{
                  fontWeight: "bold",
                  fontFamily: "sans-serif-medium",
                  fontSize: 18,
                  marginTop: 8,
                  alignSelf: "center",
                  marginBottom: 10,
                  marginLeft: 5,
                  color: "red",
                }}
              >
                Kwentura
              </Text>
              <TouchableOpacity>
              <Image
                source={require("../icons/bell.png")}
                style={{
                  width: 30,
                  height: 30,
                  alignSelf: "center",
                  marginLeft: "auto",
                }}
              />
              </TouchableOpacity>
          </View>

          <View style={{flexDirection: 'row', display: 'flex', borderWidth: 1, width: '85%', alignSelf: 'center', backgroundColor: '#d3d3d3', borderRadius: 5}}>
                <TextInput
                style={{ borderWidth: 1, width: "75%", alignSelf: "center", marginLeft: 40, borderWidth: 0, fontSize: 16, marginTop: 2}}
                placeholder="Search Stories"/>
                <Image source={require('../icons/search.png')} style={{width: 30, height: 30, marginTop: 6, position: "absolute",marginLeft: 10,}} />
            </View>
        </View>
      </View>

      <View style={{ paddingLeft: 10, paddingRight: 10 }}>
        <View style={{ flexDirection: "row" }}>
          <Text style={{ fontFamily: "sans-serif-medium", fontWeight: "bold" }}>
            Categories
          </Text>

          <TouchableOpacity style={{ marginLeft: "auto" }}>
            <Text
              style={{ fontFamily: "sans-serif-medium", fontWeight: "bold" }}
            >
              View All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.categContainer}>
        <View>
          <TouchableOpacity>
            <Image
              source={require("../books/bawal.png")}
              style={styles.categories}
            />
          </TouchableOpacity>
          <Text style={styles.categoryText}>Fables</Text>
        </View>

        <View>
          <TouchableOpacity>
            <Image
              source={require("../books/buhok.png")}
              style={styles.categories}
            />
          </TouchableOpacity>
          <Text style={styles.categoryText}>Folktales</Text>
        </View>

        <View>
          <TouchableOpacity>
            <Image
              source={require("../books/pinya.png")}
              style={styles.categories}
            />
          </TouchableOpacity>
          <Text style={styles.categoryText}>Legends</Text>
        </View>

        <View>
          <TouchableOpacity>
            <Image
              source={require("../books/rihawani.png")}
              style={styles.categories}
            />
          </TouchableOpacity>
          <Text style={styles.categoryText}>Myths</Text>
        </View>
      </View>

      <View
        style={{
          borderBottomColor: "black",
          borderBottomWidth: 1,
          marginTop: 10,
          marginBottom: 10,
        }}
      ></View>

      <ScrollView>
        <View style={{ paddingLeft: 10, paddingRight: 10 }}>
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{ fontFamily: "sans-serif-medium", fontWeight: "bold" }}
            >
              Recently Viewed
            </Text>

            <TouchableOpacity style={{ marginLeft: "auto" }}>
              <Text style={{ fontFamily: "sans-serif-medium" }}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bookContainer}>
          <View>
            <Image
              source={require("../books/bawal.png")}
              style={styles.books}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.Button}
                onPress={() => navigation.navigate("Bawal")}
              >
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

          <View>
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

          <View>
            <Image source={require("../books/jack.png")} style={styles.books} />

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

        <View style={{ paddingLeft: 10, paddingRight: 10, marginTop: 15 }}>
          <View style={{ flexDirection: "row" }}>
            <Text
              style={{ fontFamily: "sans-serif-medium", fontWeight: "bold" }}
            >
              New Release
            </Text>

            <TouchableOpacity style={{ marginLeft: "auto" }}>
              <Text style={{ fontFamily: "sans-serif-medium" }}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bookContainer}>
          <View>
            <Image
              source={require("../books/kalipay.png")}
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

          <View>
            <Image source={require("../books/lola.png")} style={styles.books} />

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

          <View>
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

      <View
        style={{
          borderBottomColor: "black",
          borderBottomWidth: 1,
          marginTop: "auto",
        }}
      ></View>

      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Image
            source={require("../icons/home-red.png")}
            style={styles.icons}
          />
          <Text style={{ color: "red" }}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Categories")}
        >
          <Image
            source={require("../icons/category.png")}
            style={styles.icons}
          />
          <Text>Categories</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Search")}>
          <Image source={require("../icons/search.png")} style={styles.icons} />
          <Text>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Library")}>
          <Image
            source={require("../icons/bookmark.png")}
            style={styles.icons}
          />
          <Text>Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Profile")}>
          <Image source={require("../icons/user.png")} style={styles.icons} />
          <Text>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navigation: {
    marginTop: "auto",
    height: 70,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },
  navButton: {},
  categories: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderRadius: 8,
    resizeMode: "contain",
  },
  categContainer: {
    flexDirection: "row",
    paddingRight: 10,
    paddingLeft: 10,
    paddingTop: 5,
    justifyContent: "space-evenly",
  },
  books: {
    width: 110,
    height: 150,
    borderWidth: 1,
    resizeMode: "cover",
  },
  bookContainer: {
    flexDirection: "row",
    paddingRight: 10,
    paddingLeft: 10,
    paddingTop: 5,
    justifyContent: "space-evenly",
    marginTop: 12,
  },
  Button: {
    backgroundColor: "red",
    marginLeft: 3,
    marginTop: 5,
    borderRadius: 5,
    width: 80,
    height: 25,
    alignSelf: "left",
  },
  text: {
    alignSelf: "center",
    marginRight: 0,
    marginTop: 5,
    fontSize: 12,
    fontFamily: "sans-serif-medium",
    color: "white",
  },
  categoryText: {
    fontWeight: "bold",
    alignSelf: "center",
    marginTop: 3,
    fontSize: 13,
  },
  bookmark: {
    width: 19,
    height: 19,
    marginLeft: 5,
    marginTop: 5,
    resizeMode: "contain",
  },
  row: {
    flexDirection: "row",
  },
  header: {
    flexDirection: "row",
    marginBottom: 10,
    justifyContent: 'space-between'
  },
  icons: {
    margin: "auto",
    width: 30,
    height: 30,
  },
});

export default Home;
