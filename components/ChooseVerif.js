import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { RadioButton } from "react-native-paper";
import { useState } from "react";

const ChooseVerif = ({ navigation }) => {
  const [selectedOption, setSelectedOption] = useState("email");

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../assets/Logo.png")} style={styles.logo} />
        <Text style={styles.title}>Kwentura</Text>
      </View>

      <View style={styles.userInfo}>
        <Image style={styles.userIcon} />
        <Text style={styles.userName}>James Magno Espina</Text>
      </View>

      <Text style={styles.heading}>Choose your verification</Text>
      <Text style={styles.subheading}>
        How do you want to get the code to reset your password?
      </Text>

      <View style={styles.radioGroup}>
        <View style={styles.radioOption}>
          <RadioButton
            value="sms"
            status={selectedOption === "sms" ? "checked" : "unchecked"}
            onPress={() => setSelectedOption("sms")}
            color="#ff4081"
          />
          <Text style={styles.radioText}>Send code via SMS</Text>
        </View>
        <View style={styles.radioOption}>
          <RadioButton
            value="email"
            status={selectedOption === "email" ? "checked" : "unchecked"}
            onPress={() => setSelectedOption("email")}
            color="#ff4081"
          />
          <Text style={styles.radioText}>Send code via Email account</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.notYouButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.notYouButtonText}>Not you?</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => {
            if (selectedOption === "email") {
              navigation.navigate("EmailVerif");
            } else if (selectedOption === "sms") {
              navigation.navigate("ContactVerif");
            }
          }}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    position: "absolute",
    top: 20,
    left: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 10,
  },
  title: {
    fontWeight: "bold",
    fontSize: 20,
    color: "red",
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 20,
  },
  userIcon: {
    width: 50,
    height: 50,
    marginBottom: 10,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ff4081",
    textAlign: "center",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  radioGroup: {
    width: "100%",
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  radioText: {
    fontSize: 16,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  notYouButton: {
    flex: 1,
    marginRight: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ff4081",
    borderRadius: 8,
    alignItems: "center",
  },
  notYouButtonText: {
    color: "#ff4081",
    fontWeight: "bold",
  },
  continueButton: {
    flex: 1,
    marginLeft: 10,
    padding: 15,
    backgroundColor: "#ff4081",
    borderRadius: 8,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ChooseVerif;
