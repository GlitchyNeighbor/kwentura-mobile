import React, { useState, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet, Image, View, Text } from "react-native";
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import { ActivityIndicator } from "react-native-paper";
import { auth, db } from "./FirebaseConfig";
import { signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";

import Home from "./components/Home";
import Categories from "./components/Categories";
import Search from "./components/Search";
import Library from "./components/Library";
import Profile from "./components/Profile";
import Register from "./components/Register";
import Login from "./components/Login";
import { Ionicons } from "@expo/vector-icons";
import StudDetails from "./components/StudDetails";
import ChooseVerif from "./components/ChooseVerif";
import ContactVerif from "./components/ContactVerif";
import EmailVerif from "./components/EmailVerif";
import ForgotPassword from "./components/ForgotPassword";
import NewPass from "./components/NewPass";
import TermsCondition from "./components/TermsCondition";
import PrivacyPolicy from "./components/PrivacyPolicy";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

function CustomDrawerContent(props) {
  const { navigation, state } = props;

  const currentTabRoute = state.routes.find(
    (route) => route.name === "KwenturaHome"
  )?.state?.routes[
    state.routes.find((route) => route.name === "KwenturaHome")?.state?.index
  ]?.name;

  const handleSignOut = async () => {
    try {
      await firebaseSignOut(auth);
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Auth",
            state: {
              routes: [{ name: "Login" }],
            },
          },
        ],
      });
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed: " + error.message);
    }
  };

  const createDrawerItemProps = (label, iconSource, targetTab) => ({
    label: label,
    icon: ({ color, size }) => (
      <Image
        source={iconSource}
        style={{ width: size, height: size, tintColor: color }}
      />
    ),
    onPress: () => {
      navigation.closeDrawer();
      navigation.navigate("KwenturaHome", { screen: targetTab });
    },
    focused: currentTabRoute === targetTab,
    activeTintColor: styles.drawerActiveTint.color,
    inactiveTintColor: styles.drawerInactiveTint.color,
    labelStyle: styles.drawerLabel,
    style: styles.drawerItem,
  });

  return (
    <DrawerContentScrollView {...props} style={{ flex: 1 }}>
      <View style={styles.drawerHeader}>
        <Image
          source={require("./assets/Logo.png")}
          style={styles.drawerLogo}
        />
        <Text style={styles.drawerTitle}>Kwentura</Text>
      </View>

      <DrawerItem
        {...createDrawerItemProps(
          "Home",
          require("./icons/home.png"),
          "HomeTab"
        )}
      />
      <DrawerItem
        {...createDrawerItemProps(
          "Me",
          require("./icons/user.png"),
          "ProfileTab"
        )}
      />
      <DrawerItem
        {...createDrawerItemProps(
          "Categories",
          require("./icons/category.png"),
          "CategoriesTab"
        )}
      />
      <DrawerItem
        {...createDrawerItemProps(
          "My Library",
          require("./icons/bookmark.png"),
          "LibraryTab"
        )}
      />

      <View style={styles.drawerDivider} />

      <DrawerItem
        label="Sign Out"
        onPress={handleSignOut}
        icon={({ color, size }) => (
          <Image
            source={require("./icons/logout.png")}
            style={{ width: size, height: size, tintColor: color }}
          />
        )}
        inactiveTintColor={styles.drawerInactiveTint.color}
        labelStyle={[styles.drawerLabel, { fontWeight: "bold" }]}
        style={styles.drawerItem}
      />
    </DrawerContentScrollView>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "HomeTab") {
            iconName = focused ? "home" : "home-outline";
          } else if (route.name === "CategoriesTab") {
            iconName = focused ? "grid" : "grid-outline";
          } else if (route.name === "SearchTab") {
            iconName = focused ? "search" : "search-outline";
          } else if (route.name === "LibraryTab") {
            iconName = focused ? "book" : "book-outline";
          } else if (route.name === "ProfileTab") {
            iconName = focused ? "person" : "person-outline";
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: "#ff4081",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { height: 60, paddingBottom: 5, paddingTop: 5 },
        tabBarLabelStyle: { fontSize: 11 },
      })}
    >
      <Tab.Screen name="HomeTab" component={Home} options={{ title: "Home" }} />
      <Tab.Screen
        name="CategoriesTab"
        component={Categories}
        options={{ title: "Categories" }}
      />
      <Tab.Screen
        name="SearchTab"
        component={Search}
        options={{ title: "Search" }}
      />
      <Tab.Screen
        name="LibraryTab"
        component={Library}
        options={{ title: "Library" }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={Profile}
        options={{ title: "Me" }}
      />
    </Tab.Navigator>
  );
}
function AppDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Drawer.Screen name="KwenturaHome" component={AppTabs} />
    </Drawer.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="Register" component={Register} />
      <Stack.Screen name="StudDetails" component={StudDetails} />
      <Stack.Screen name="ForgotPass" component={ForgotPassword} />
      <Stack.Screen name="ChooseVerify" component={ChooseVerif} />
      <Stack.Screen name="EmailVerif" component={EmailVerif} />
      <Stack.Screen name="ContactVerif" component={ContactVerif} />
      <Stack.Screen name="NewPass" component={NewPass} />
      <Stack.Screen name="TermsCondition" component={TermsCondition} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(null);
  useEffect(() => {
    setInitializing(true);
    setIsProfileComplete(null);
    const unsubscribeAuth = auth.onAuthStateChanged((userAuth) => {
      setUser(userAuth);
      if (!userAuth) {
        setInitializing(false);
        setIsProfileComplete(null);
      }
    });
    return unsubscribeAuth;
  }, []);

  useEffect(() => {
    if (user) {
      setIsProfileComplete(null);
      const docRef = doc(db, "students", user.uid);
      const unsubscribeSnapshot = onSnapshot(
        docRef,
        (docSnap) => {
          if (docSnap.exists() && docSnap.data()?.schoolId) {
            setIsProfileComplete(true);
          } else {
            setIsProfileComplete(false);
          }
          setInitializing(false);
        },
        (error) => {
          console.error("Error listening to profile document:", error);
          setIsProfileComplete(false);
          setInitializing(false);
        }
      );
      return () => unsubscribeSnapshot();
    } else {
      if (initializing) {
        setInitializing(false);
      }
      setIsProfileComplete(null);
    }
  }, [user]);

  if (initializing || (user && isProfileComplete === null)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="red" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : isProfileComplete ? (
          <Stack.Screen name="App" component={AppDrawer} />
        ) : (
          <Stack.Screen
            name="CompleteProfile"
            component={StudDetails}
            initialParams={{ userId: user.uid }}
            options={{ gestureEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },

  drawerHeader: {
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: "#f8f8f8",
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  drawerLogo: {
    width: 45,
    height: 45,
    marginRight: 12,
  },
  drawerTitle: {
    fontSize: 19,
    fontWeight: "bold",
    color: "red",
  },

  drawerItem: {
    marginVertical: 3,
    marginHorizontal: 8,
  },
  drawerLabel: {
    fontSize: 15,
    fontWeight: "500",
  },
  drawerActiveTint: {
    color: "red",
  },
  drawerInactiveTint: {
    color: "gray",
  },
  drawerDivider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 10,
    marginHorizontal: 15,
  },
});
