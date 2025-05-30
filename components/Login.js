import React, { useState } from "react";
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
} from "react-native";
import { auth } from "../FirebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../FirebaseConfig";

const Login = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const signIn = async () => {
    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Fetch student document from Firestore
      const docRef = doc(db, "students", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        // Check if all required student fields are filled
        if (
          data.studentFirstName &&
          data.studentLastName &&
          data.schoolId &&
          data.gradeLevel &&
          data.section
        ) {
          navigation.navigate("Home");
        } else {
          navigation.navigate("StudDetails", { userId: user.uid });
        }
      } else {
        // If no student doc, treat as incomplete
        navigation.navigate("StudDetails", { userId: user.uid });
      }
    } catch (error) {
      console.log("Sign in error:", error);
      let errorMessage = "Sign in failed. Please check your credentials.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Invalid email or password.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address.";
      }
      alert(errorMessage);
    }
  };

  return (
    <SafeAreaView style={{ padding: 30, width: "100%", height: "100%" }}>
      <View style={{ flexDirection: "row" }}>
        <Image
          source={require("../assets/Logo.png")}
          style={{ width: 50, height: 50, marginRight: 10 }}
        />
        <Text
          style={{
            fontWeight: "bold",
            fontFamily: "Sans Serif",
            fontSize: 20,
            marginTop: 8,
            color: "red",
          }}
        >
          Kwentura
        </Text>
      </View>

      <View style={styles.centerContainer}>
        <Text
          style={{
            fontWeight: "bold",
            fontFamily: "Sans Serif",
            fontSize: 26,
            alignSelf: "center",
            color: "red",
          }}
        >
          Welcome!
        </Text>
        <Text
          style={{
            marginTop: 20,
            color: "grey",
            fontSize: 16,
            alignSelf: "center",
          }}
        >
          Discover, Imagine, and Grow
        </Text>
        <Text
          style={{
            marginBottom: 20,
            color: "grey",
            fontSize: 16,
            alignSelf: "center",
          }}
        >
          with Filipino Stories!
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? "eye-off" : "eye"}
              size={24}
              color="#667"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={signIn}>
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 24,
              alignSelf: "center",
              color: "white",
            }}
          >
            Log in
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("ForgotPass")}
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              marginTop: 10,
              fontSize: 16,
              alignSelf: "center",
            }}
          >
            {" "}
            Forgot your password?{" "}
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontWeight: "bold",
              fontSize: 16,
              alignSelf: "center",
              color: "pink",
            }}
          >
            Click here
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("Register")}
          style={{
            display: "flex",
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              marginTop: 10,
              fontSize: 16,
              alignSelf: "center",
            }}
          >
            Don't have an account?
          </Text>
          <Text
            style={{
              marginTop: 10,
              fontWeight: "bold",
              fontSize: 16,
              alignSelf: "center",
              color: "pink",
            }}
          >
            Sign up here
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    width: "100%",
    padding: 10,
    justifyContent: "center",

    marginTop: "30%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 20,
    borderRadius: 20,
    height: 50,
    backgroundColor: "#fff",

    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  passwordInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 5,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
});

export default Login;
