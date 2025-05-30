// e:\Kwentura\Kwentura_Mobile\components\StudDetails.js

import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { signOut as firebaseSignOut, deleteUser } from "firebase/auth"; // Ensure signOut is imported
import { auth, db } from "../FirebaseConfig";
// No need for CommonActions for this specific change

const StudDetails = ({ navigation, route }) => {
  const userId = route?.params?.userId;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [schoolId, setSchoolId] = useState(""); // Changed: Now user input instead of auto-generated
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false); // Renamed for clarity

  useEffect(() => {
    if (!userId) {
      console.error("StudDetails: userId is missing from route params!");
      Alert.alert(
        "Error",
        "An error occurred. Cannot proceed without user identification."
      );
      // Attempt to sign out if userId is missing unexpectedly
      firebaseSignOut(auth).catch((err) =>
        console.error("Sign out failed:", err)
      );
      // Optionally navigate back immediately if userId is missing
      // if (navigation.canGoBack()) {
      //   navigation.goBack();
      // }
    }
  }, [userId, navigation]); // Added navigation dependency

  // --- saveStudentDetails function updated to include schoolId validation ---
  const saveStudentDetails = async () => {
    if (!userId) return;
    if (!firstName || !lastName || !schoolId || !gradeLevel || !section) {
      Alert.alert(
        "Missing Information",
        "Please fill in all required fields including the School ID."
      );
      return;
    }
    if (isSaving || isCancelling) return;
    setIsSaving(true);

    try {
      // Check in students collection
      const studentsRef = collection(db, "students");
      const q1 = query(studentsRef, where("schoolId", "==", schoolId));
      const studentsSnap = await getDocs(q1);

      // Check in teachers collection (add more collections as needed)
      const teachersRef = collection(db, "teachers");
      const q2 = query(teachersRef, where("schoolId", "==", schoolId));
      const teachersSnap = await getDocs(q2);

      // If found in any collection and not the current user, alert
      const existsInStudents =
        !studentsSnap.empty &&
        studentsSnap.docs.some((doc) => doc.id !== userId);
      const existsInTeachers = !teachersSnap.empty; // Teachers likely have different IDs

      if (existsInStudents || existsInTeachers) {
        Alert.alert(
          "School ID Exists",
          "This School ID is already registered. Please enter a unique School ID."
        );
        setIsSaving(false);
        return;
      }

      await setDoc(
        doc(db, "students", userId),
        {
          studentFirstName: firstName,
          studentLastName: lastName,
          schoolId,
          gradeLevel,
          section,
          updatedAt: serverTimestamp(),
          role: "student",
        },
        { merge: true }
      );
      // Optionally navigate or show success here
    } catch (error) {
      console.error("Failed to save student details:", error);
      Alert.alert(
        "Save Failed",
        "Could not save student details: " + error.message
      );
      setIsSaving(false);
      return;
    }
    setIsSaving(false);
  };

  const handleBackPress = () => {
    if (isSaving || isCancelling) return;

    Alert.alert(
      "Cancel Registration?",
      "Are you sure you want to go back? All information you entered will be deleted.",
      [
        { text: "Stay", style: "cancel" },
        {
          text: "Cancel",
          style: "destructive",
          onPress: async () => {
            setIsCancelling(true);
            try {
              // Delete the student document from Firestore
              await deleteDoc(doc(db, "students", userId));
              // Delete the user from Firebase Authentication
              if (auth.currentUser) {
                await deleteUser(auth.currentUser);
              }
              // Sign out the user (in case deleteUser fails)
              await firebaseSignOut(auth);

              // Since we're signed out, the auth state change will automatically
              // redirect to the Auth stack. No need for manual navigation reset.
              // The useEffect in App.js will handle the navigation automatically.
            } catch (error) {
              console.error("Error during cancellation:", error);
              Alert.alert(
                "Error",
                "Could not complete the action. Please try again."
              );
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  // --- Main Component Return (JSX) ---
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Student Details</Text>
      <Text style={styles.subheading}>
        Please provide the student's information.
      </Text>

      {/* Input Fields */}
      <TextInput
        style={styles.input}
        placeholder="Student first name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Student last name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      {/* Changed: School ID is now an editable input field */}
      <TextInput
        style={styles.input}
        placeholder="Enter School ID"
        value={schoolId}
        onChangeText={setSchoolId}
        autoCapitalize="none"
        keyboardType="default"
      />
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={gradeLevel}
          onValueChange={(itemValue) => setGradeLevel(itemValue)}
          style={styles.picker}
          prompt="Select Grade Level"
        >
          <Picker.Item
            label="Select Grade Level..."
            value=""
            enabled={false}
            style={{ color: "grey" }}
          />
          <Picker.Item label="Kinder 1" value="Kinder 1" />
          <Picker.Item label="Kinder 2" value="Kinder 2" />
          <Picker.Item label="Grade 1" value="Grade 1" />
        </Picker>
      </View>
      <TextInput
        style={styles.input}
        placeholder="Student section"
        value={section}
        onChangeText={setSection}
        autoCapitalize="words"
      />

      {/* Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.backButton,
            (isSaving || isCancelling) && styles.disabledButton, // Use isCancelling
          ]}
          onPress={handleBackPress}
          disabled={isSaving || isCancelling} // Use isCancelling
        >
          <Text style={styles.backButtonText}>
            {isCancelling ? "Cancelling..." : "Cancel"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.nextButton,
            (isSaving || isCancelling) && styles.disabledButton, // Use isCancelling
          ]}
          onPress={saveStudentDetails}
          disabled={isSaving || isCancelling || !userId} // Use isCancelling
        >
          <Text style={styles.nextButtonText}>
            {isSaving ? "Saving..." : "Confirm"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: "#f9f9f9",
    justifyContent: "center", // Center content vertically
  },
  heading: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#ff4081",
    textAlign: "center",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
    fontSize: 16,
  },
  readOnlyInput: {
    backgroundColor: "#e9e9e9",
    color: "#555",
  },
  pickerContainer: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginBottom: 15,
    justifyContent: "center",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  picker: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20, // Add margin above buttons
  },
  backButton: {
    flex: 1,
    marginRight: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ff4081",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  backButtonText: {
    color: "#ff4081",
    fontWeight: "bold",
    fontSize: 16,
  },
  nextButton: {
    flex: 1,
    marginLeft: 10,
    padding: 15,
    backgroundColor: "#ff4081",
    borderRadius: 8,
    alignItems: "center",
    minHeight: 50,
    justifyContent: "center",
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: "#ff99b9",
    borderColor: "#ff99b9",
    opacity: 0.7,
  },
});

export default StudDetails;
