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

import { auth } from "../FirebaseConfig";
import { signOut as firebaseSignOut } from "firebase/auth";

const Profile = ({ navigation }) => {

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      alert('Sign out failed: ' + error.message);
    }
  };

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
            <Text
              style={{
                fontWeight: "bold",
                fontFamily: "sans-serif-medium",
                fontSize: 24,
                marginTop: 8,
                alignSelf: "center",
                marginBottom: 10,
                color: "red",
              }}
            >
              Kwentura
            </Text>
            <Image
              source={require("../icons/bell.png")}
              style={{
                width: 30,
                height: 30,
                alignSelf: "center",
                marginLeft: "auto",
              }}
            />
          </View>

        </View>
      </View>

      <View
        style={{
          borderBottomColor: "black",
          borderBottomWidth: 1,
        }}
      ></View>

      <View style={{margin: 20}}> 

        <Text style={{fontWeight: 'bold', fontSize: 18}}> 
            Your Profile
        </Text>

        <View style={{flexDirection: 'row', marginTop: 10, }}>
            <Image source={require('../icons/circle-user-red.png')} style={{width: 30, height: 30, marginRight: 10,}}/>
            <Text style={{fontWeight: 'bold', fontSize: 20}}> User </Text>
        </View>
      </View>

      <View
        style={{
          borderBottomColor: "black",
          borderBottomWidth: 1,
        }}
      ></View>

      <View style={{ margin: 20}}> 
        <Text style={{fontWeight: 'bold', fontSize: 18}}>Personal Information</Text>

        <Text style={{fontSize: 16, marginTop: 20}}>First Name</Text>
            <View
            style={{
            borderBottomColor: "black",
            borderBottomWidth: 1,
            marginTop: 8,
            }}>
            </View>
        <Text style={{fontSize: 16, marginTop: 20}}>Last Name</Text>
            <View
            style={{
            borderBottomColor: "black",
            borderBottomWidth: 1,
            marginTop: 8,
            }}>
            </View>
        <Text style={{fontSize: 16, marginTop: 20}}>School ID Number</Text>
            <View
            style={{
            borderBottomColor: "black",
            borderBottomWidth: 1,
            marginTop: 8,
            }}>
            </View>
      </View>

      <View
        style={{
        borderBottomColor: "black",
        borderBottomWidth: 1,
        marginTop: 30,
        }}>
    </View>

        <View style={{margin: 20}}>
                <TouchableOpacity style={styles.row}>
                    <Text style={{fontSize: 18}}>Parental Controls</Text>
                    <Image source={require('../icons/right.png')} style={{width: 21, height: 21, alignSelf: 'center', marginLeft: 'auto'}}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row}>
                    <Text style={{fontSize: 18, marginTop:8}}>Legal</Text>
                    <Image source={require('../icons/right.png')} style={{width: 21, height: 21, alignSelf: 'center', marginLeft: 'auto'}}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row}>
                    <Text style={{fontSize: 18, marginTop:8}}>Support</Text>
                    <Image source={require('../icons/right.png')} style={{width: 21, height: 21, alignSelf: 'center', marginLeft: 'auto'}}/>
                </TouchableOpacity>

                <TouchableOpacity style={styles.row}>
                    <Text style={{fontSize: 18, marginTop:8}}>Settings</Text>
                    <Image source={require('../icons/right.png')} style={{width: 21, height: 21, alignSelf: 'center', marginLeft: 'auto'}}/>
                </TouchableOpacity>
        </View>

        <View
        style={{
        borderBottomColor: "black",
        borderBottomWidth: 1,
        marginLeft: 20,
        marginRight: 20,
        }}>
        </View>

        <View style={{margin: 20}}>
            <TouchableOpacity style={styles.row} onPress={signOut}>
                <Text style={{fontSize: 18, color: 'red'}}>Sign Out</Text>
                <Image source={require('../icons/right.png')} style={{width: 21, height: 21, alignSelf: 'center', marginLeft: 'auto'}}/>
            </TouchableOpacity>
        </View>
      <View style={styles.navigation}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Home")}
        >
          <Image
            source={require("../icons/home.png")}
            style={styles.icons}
          />
          <Text >Home</Text>
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

        <TouchableOpacity style={styles.navButton}>
          <Image source={require("../icons/user-red.png")} style={styles.icons} />
          <Text style={{ color: "red" }}>Profile</Text>
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
    marginBottom: 0,
  },
  icons: {
    margin: "auto",
    width: 30,
    height: 30,
  },
});

export default Profile;
