import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

const Header = ({
  navigation,
  title = "Kwentura",
  showSearch = true,
  leftIconType = "drawer",
}) => {
  const handleLeftIconPress = () => {
    if (leftIconType === "drawer") {
      navigation.openDrawer();
    } else if (leftIconType === "profile") {
      navigation.navigate("ProfileTab");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {leftIconType !== "none" && (
          <TouchableOpacity
            onPress={handleLeftIconPress}
            style={styles.iconButton}
          >
            {leftIconType === "drawer" && (
              <Image
                source={require("../icons/burger-menu.png")}
                style={styles.icon}
              />
            )}
            {leftIconType === "profile" && (
              <Image
                source={require("../icons/circle-user.png")}
                style={styles.icon}
              />
            )}
          </TouchableOpacity>
        )}

        <Text style={styles.titleText}>{title}</Text>

        <TouchableOpacity style={styles.iconButton}>
          <Image source={require("../icons/bell.png")} style={styles.icon} />
        </TouchableOpacity>
      </View>

      {/* {showSearch && (
        <View style={styles.searchContainer}>
          <Image
            source={require("../icons/search.png")}
            style={styles.searchIcon}
          />
          <TextInput style={styles.searchInput} placeholder="Search Stories" />
        </View>
      )} */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    minHeight: 30,
  },
  iconButton: {
    padding: 5,
  },
  icon: {
    width: 30,
    height: 30,
    resizeMode: "contain",
  },
  titleText: {
    fontWeight: "bold",
    fontFamily: "sans-serif-medium",
    fontSize: 18,
    color: "red",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "gray",
    width: "85%",
    alignSelf: "center",
    backgroundColor: "#d3d3d3",
    borderRadius: 5,
    paddingHorizontal: 10,
    height: 45,
  },
  searchIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
    tintColor: "#555",
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    paddingVertical: 0,
  },
});

export default Header;
