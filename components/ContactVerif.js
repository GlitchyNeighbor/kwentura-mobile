import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
} from "react-native";
import { useState } from "react";

const ContactVerif = ({ navigation }) => {
  const [code, setCode] = useState(["", "", "", ""]);

  const handleInputChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);
    if (text && index < 3) {
      const nextInput = `input-${index + 1}`;
      const nextInputRef = inputRefs[nextInput];
      if (nextInputRef) {
        nextInputRef.focus();
      }
    }
  };

  const inputRefs = {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require("../assets/Logo.png")} style={styles.logo} />
        <Text style={styles.title}>Kwentura</Text>
      </View>

      <Text style={styles.heading}>Mobile Phone Verification</Text>
      <Text style={styles.subheading}>
        Enter the 4-digit code we just sent you on your phone number.
      </Text>
      <View style={styles.codeContainer}>
        {code.map((digit, index) => (
          <TextInput
            key={index}
            style={styles.codeInput}
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            keyboardType="numeric"
            maxLength={1}
            ref={(ref) => (inputRefs[`input-${index}`] = ref)}
          />
        ))}
      </View>

      <TouchableOpacity>
        <Text style={styles.resendText}>
          Didn’t receive code? <Text style={styles.resendLink}>Resend</Text>
        </Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.navigate("Login")}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.verifyButton}
          onPress={() => navigation.navigate("NewPass")}
        >
          <Text style={styles.verifyButtonText}>Verify</Text>
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
  codeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    width: "80%",
  },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  resendText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  resendLink: {
    color: "#ff4081",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    marginRight: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ff4081",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#ff4081",
    fontWeight: "bold",
  },
  verifyButton: {
    flex: 1,
    marginLeft: 10,
    padding: 15,
    backgroundColor: "#ff4081",
    borderRadius: 8,
    alignItems: "center",
  },
  verifyButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default ContactVerif;
