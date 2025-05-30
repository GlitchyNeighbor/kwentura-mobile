import React, { useState, useEffect } from "react";
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator, // Import ActivityIndicator
} from "react-native";
import { auth, db } from "../FirebaseConfig";
// Import serverTimestamp for updates
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut as firebaseSignOut } from "firebase/auth";

const Profile = ({ navigation }) => {
  // State variables matching the expected data structure
  const [parentName, setParentName] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState(""); // This is parentContactNumber in Firestore
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState(""); // This is schoolId in Firestore
  const [gradeLevel, setGradeLevel] = useState("");
  const [section, setSection] = useState("");
  const [loading, setLoading] = useState(true); // Add loading state
  const [isSaving, setIsSaving] = useState(false); // Add saving state

  // Fetch user data from Firestore 'students' collection
  useEffect(() => {
    setLoading(true); // Start loading when effect runs

    // Use onAuthStateChanged to react to login/logout and ensure user is available
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in, fetch data
        try {
          // Reference the document in the 'students' collection using user UID
          const docRef = doc(db, "students", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Map Firestore fields to state variables correctly
            setParentName(
              `${data.parentFirstName || ""} ${
                data.parentLastName || ""
              }`.trim()
            );
            setEmail(data.email || ""); // Email stored during registration
            setContactNumber(data.parentContactNumber || ""); // Use parentContactNumber
            setStudentName(
              `${data.studentFirstName || ""} ${
                data.studentLastName || ""
              }`.trim()
            );
            setStudentId(data.schoolId || ""); // Use schoolId from StudDetails
            setGradeLevel(data.gradeLevel || ""); // Grade level from StudDetails
            setSection(data.section || ""); // Section from StudDetails
          } else {
            console.log("No student document found for this user!");
            // Handle cases where student details might be missing
            // Maybe navigate back or show a message to complete profile
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          alert("Failed to fetch user data: " + error.message);
        } finally {
          setLoading(false); // Stop loading after fetch attempt
        }
      } else {
        // User is signed out, clear state and stop loading
        // RootNavigator will handle navigation to Login
        setParentName("");
        setEmail("");
        setContactNumber("");
        setStudentName("");
        setStudentId("");
        setGradeLevel("");
        setSection("");
        setLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs once on mount and cleans up

  // Save changes to Firestore 'students' collection
  const saveChanges = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("No user is logged in!");
      return;
    }
    if (isSaving) return; // Prevent double clicks

    setIsSaving(true); // Start saving indicator

    try {
      // Reference the document in the 'students' collection
      const docRef = doc(db, "students", user.uid);
      await updateDoc(docRef, {
        parentContactNumber: contactNumber, // Update parentContactNumber
        gradeLevel: gradeLevel, // Update gradeLevel
        section: section, // Update section
        updatedAt: serverTimestamp(), // Add/update timestamp
      });

      alert("Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to save changes: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Sign out failed: " + error.message);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="red" />
        <Text>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Kwentura</Text>
          <TouchableOpacity>
            <Image
              source={require("../icons/bell.png")}
              style={styles.bellIcon}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.row}>
            <Image
              source={require("../icons/circle-user-red.png")} // Placeholder icon
              style={styles.profileIcon}
            />
            <Text style={styles.profileName}>
              {parentName || "Parent Name Not Set"}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={parentName}
            editable={false}
            placeholder="Name"
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={email}
            editable={false}
            placeholder="Email"
          />

          <Text style={styles.label}>Contact Number</Text>
          <TextInput
            style={styles.input}
            value={contactNumber}
            onChangeText={setContactNumber}
            keyboardType="phone-pad"
            placeholder="Contact Number"
          />

          <Text style={styles.label}>Student Name</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={studentName}
            editable={false}
            placeholder="Student's Name"
          />

          <Text style={styles.label}>Student ID</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={studentId}
            editable={false}
            placeholder="Student ID"
          />

          <Text style={styles.label}>Student Grade Level</Text>
          <TextInput
            style={styles.input}
            value={gradeLevel}
            onChangeText={setGradeLevel}
            placeholder="Student's Grade Level"
          />

          <Text style={styles.label}>Student Section</Text>
          <TextInput
            style={styles.input}
            value={section}
            onChangeText={setSection}
            placeholder="Student's Section"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.disabledButton]}
          onPress={saveChanges}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save Changes</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "red",
  },
  bellIcon: {
    width: 28,
    height: 28,
  },
  section: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  profileIcon: {
    width: 60,
    height: 60,
    marginRight: 15,
    borderRadius: 30,
    backgroundColor: "#eee",
  },
  profileName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  label: {
    fontSize: 14,
    color: "#555",
    marginBottom: 5,
    marginTop: 15,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 8,
    paddingHorizontal: 5,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  readOnlyInput: {
    backgroundColor: "#f0f0f0",
    color: "#667",
  },
  saveButton: {
    backgroundColor: "#ff4081",
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  signOutButton: {
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "red",
    borderRadius: 8,
  },
  signOutButtonText: {
    color: "red",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ff99b9",
  },
});

export default Profile;
