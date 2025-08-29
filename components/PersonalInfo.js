import React, { useState, useEffect, useCallback } from "react";
import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import { auth, db } from "../FirebaseConfig";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { signOut as firebaseSignOut, sendEmailVerification } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "./HeaderProfileBackOnly";

const { width } = Dimensions.get('window');

const AVATAR_OPTIONS = [
  require("../images/animals/Bee.png"),
  require("../images/animals/Capybara.png"),
  require("../images/animals/Cat.png"),
  require("../images/animals/Chicken.png"),
  require("../images/animals/Dog.png"),
  require("../images/animals/Fox.png"),
  require("../images/animals/Frog.png"),
  require("../images/animals/Kangaroo.png"),
  require("../images/animals/Ladybug.png"),
  require("../images/animals/Lion.png"),
  require("../images/animals/Ostrich.png"),
  require("../images/animals/Parrot.png"),
  require("../images/animals/Raccoon.png"),
  require("../images/animals/Snail.png"),
  require("../images/animals/Squirrel.png"),
];

const PersonalInfo = ({ navigation }) => {
  // Form state
  const [formData, setFormData] = useState({
    parentFirstName: "",
    parentLastName: "",
    email: "",
    contactNumber: "",
    studentFirstName: "",
    studentLastName: "",
    studentId: "",
    gradeLevel: "",
    section: "",
  });

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [avatarConfig, setAvatarConfig] = useState(AVATAR_OPTIONS[0]);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);

  // Form validation state
  const [errors, setErrors] = useState({});

  // Memoized validation function
  const validateForm = useCallback(() => {
    const newErrors = {};
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation (basic)
    const phoneRegex = /^[+]?[\d\s-()]+$/;
    if (formData.contactNumber && !phoneRegex.test(formData.contactNumber)) {
      newErrors.contactNumber = "Please enter a valid contact number";
    }

    // Required field validation
    if (!formData.parentFirstName.trim()) {
      newErrors.parentFirstName = "Parent's first name is required";
    }

    if (!formData.parentLastName.trim()) {
      newErrors.parentLastName = "Parent's last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  // Update form data and track changes
  const updateFormData = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
    
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [errors]);

  // Parse parent name for display
  const handleParentNameChange = useCallback((text) => {
    const names = text.trim().split(/\s+/);
    const firstName = names[0] || "";
    const lastName = names.slice(1).join(" ") || "";
    
    updateFormData('parentFirstName', firstName);
    updateFormData('parentLastName', lastName);
  }, [updateFormData]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          setLoading(true);
          setEmailVerified(user.emailVerified);
          const docRef = doc(db, "students", user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            setFormData({
              parentFirstName: data.parentFirstName || "",
              parentLastName: data.parentLastName || "",
              email: data.email || "",
              contactNumber: data.parentContactNumber || "",
              studentFirstName: data.studentFirstName || "",
              studentLastName: data.studentLastName || "",
              studentId: data.schoolId || "",
              gradeLevel: data.gradeLevel || "",
              section: data.section || "",
            });

            // Handle avatar config
            if (data.avatarConfig) {
              if (typeof data.avatarConfig === "number") {
                setAvatarConfig(AVATAR_OPTIONS[data.avatarConfig] || AVATAR_OPTIONS[0]);
              } else {
                setAvatarConfig(data.avatarConfig);
              }
            }
          } else {
            console.log("No student document found for this user!");
            Alert.alert("Error", "No student information found for this account.");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Failed to fetch user data. Please try again.");
        } finally {
          setLoading(false);
        }
      } else {
        // Reset form if no user
        setFormData({
          parentFirstName: "",
          parentLastName: "",
          email: "",
          contactNumber: "",
          studentFirstName: "",
          studentLastName: "",
          studentId: "",
          gradeLevel: "",
          section: "",
        });
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleVerifyEmail = async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        Alert.alert("Verification Email Sent", "Please check your email to verify your account.");
      } catch (error) {
        Alert.alert("Error", error.message);
      }
    }
  };

  const saveChanges = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "No user is logged in!");
      return;
    }

    if (isSaving) return;

    // Validate form before saving
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors in the form before saving.");
      return;
    }

    setIsSaving(true);

    try {
      const docRef = doc(db, "students", user.uid);
      const updateData = {
        parentFirstName: formData.parentFirstName.trim(),
        parentLastName: formData.parentLastName.trim(),
        email: formData.email.trim(),
        parentContactNumber: formData.contactNumber.trim(),
        updatedAt: serverTimestamp(),
        avatarConfig: avatarConfig,
      };

      await updateDoc(docRef, updateData);
      setHasChanges(false);
      Alert.alert("Success", "Changes saved successfully!");
    } catch (error) {
      console.error("Error saving changes:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectAvatar = (avatar, index) => {
    setSelectedAvatar({ avatar, index });
  };

  const confirmAvatarSelection = () => {
    if (selectedAvatar) {
      setAvatarConfig(selectedAvatar.avatar);
      setHasChanges(true);
    }
    setAvatarModalVisible(false);
    setSelectedAvatar(null);
  };

  const renderAvatarOption = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.avatarOption,
        selectedAvatar?.index === index && styles.selectedAvatarOption
      ]}
      onPress={() => selectAvatar(item, index)}
    >
      <Image source={item} style={styles.avatarImage} />
    </TouchableOpacity>
  );

  const renderInputField = (label, value, onChangeText, options = {}) => {
    const {
      editable = true,
      keyboardType = "default",
      placeholder = "",
      multiline = false,
      error = null
    } = options;

    return (
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          style={[
            styles.input,
            !editable && styles.readOnlyInput,
            error && styles.inputError
          ]}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          keyboardType={keyboardType}
          placeholder={placeholder}
          multiline={multiline}
          placeholderTextColor="#999"
        />
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFCF2D" />
        <Text style={styles.loadingText}>Loading Profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ImageBackground
      source={require('../images/ProfileSubs.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

                    <AppHeader
            navigation={navigation}
            leftIconType="drawer"
            showSearch={true}
          />

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Personal Information</Text>

              {/* Avatar Section
              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={styles.avatarContainer}
                  onPress={() => setAvatarModalVisible(true)}
                >
                  <Image source={avatarConfig} style={styles.avatarImage} />
                  <View style={styles.editIcon}>
                    <Ionicons name="pencil" size={16} color="#fff" />
                  </View>
                </TouchableOpacity>
                <Text style={styles.avatarLabel}>Tap to change avatar</Text>
              </View> */}

              {/* Student Information */}
              <Text style={styles.subsectionTitle}>Student Information</Text>
              <Text style={styles.readOnlyNote}>Student information is read-only.</Text>

              {renderInputField(
                "Student Name",
                `${formData.studentFirstName} ${formData.studentLastName}`.trim(),
                null,
                { editable: false, placeholder: "Student's Name" }
              )}

              {renderInputField(
                "Student ID",
                formData.studentId,
                null,
                { editable: false, placeholder: "Student ID" }
              )}

              {renderInputField(
                "Grade Level",
                formData.gradeLevel,
                null,
                { editable: false, placeholder: "Student's Grade Level" }
              )}

              {renderInputField(
                "Section",
                formData.section,
                null,
                { editable: false, placeholder: "Student's Section" }
              )}

              {/* Parent Information */}
              <Text style={styles.subsectionTitle}>Parent Information</Text>
              <Text style={styles.editableNote}>Parent information is editable.</Text>

              {renderInputField(
                "Parent's Name",
                `${formData.parentFirstName} ${formData.parentLastName}`.trim(),
                handleParentNameChange,
                {
                  placeholder: "Enter parent's full name",
                  error: errors.parentFirstName || errors.parentLastName
                }
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.emailContainer}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.emailInput,
                      !auth.currentUser?.emailVerified && styles.unverifiedInput,
                      auth.currentUser?.emailVerified && styles.readOnlyInput,
                      errors.email && styles.inputError
                    ]}
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    editable={false}
                    keyboardType="email-address"
                    placeholder="Enter email address"
                    placeholderTextColor="#999"
                  />
                  {!auth.currentUser?.emailVerified && (
                    <TouchableOpacity
                      style={styles.verifyButton}
                      onPress={handleVerifyEmail}
                    >
                      <Text style={styles.verifyButtonText}>Verify</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
                <Text style={emailVerified ? styles.verifiedText : styles.unverifiedText}>
                  {emailVerified ? "Email is verified" : "Email is not verified"}
                </Text>
              </View>

              {renderInputField(
                "Contact Number",
                formData.contactNumber,
                (value) => updateFormData('contactNumber', value),
                {
                  keyboardType: "phone-pad",
                  placeholder: "Enter contact number",
                  error: errors.contactNumber
                }
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.saveButton,
                (isSaving || !hasChanges) && styles.disabledButton
              ]}
              onPress={saveChanges}
              disabled={isSaving || !hasChanges}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {hasChanges ? "Save Changes" : "No Changes to Save"}
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Avatar Selection Modal */}
        <Modal
          visible={avatarModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAvatarModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Choose Your Avatar</Text>
              <FlatList
                data={AVATAR_OPTIONS}
                renderItem={renderAvatarOption}
                keyExtractor={(item, index) => index.toString()}
                numColumns={3}
                style={styles.avatarGrid}
                contentContainerStyle={styles.avatarGridContent}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setAvatarModalVisible(false);
                    setSelectedAvatar(null);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.confirmButton,
                    !selectedAvatar && styles.disabledButton
                  ]}
                  onPress={confirmAvatarSelection}
                  disabled={!selectedAvatar}
                >
                  <Text style={styles.confirmButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFCF2D",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Fredoka-SemiBold',
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    paddingHorizontal: 30,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Fredoka-SemiBold',
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  subsectionTitle: {
    fontSize: 18,
    color: "#333",
    marginTop: 10,
    marginBottom: 15,
    fontFamily: 'Fredoka-SemiBold',
  },
  editableNote: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  readOnlyNote: {
    fontSize: 12,
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ff4081",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarLabel: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: "#333",
    marginBottom: 5,
    fontWeight: "500",
  },
  input: {
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  readOnlyInput: {
    backgroundColor: "#f5f5f5",
    color: "#666",
    borderColor: "#e0e0e0",
  },
  inputError: {
    borderColor: "#ff4444",
  },
  errorText: {
    fontSize: 12,
    color: "#ff4444",
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    backgroundColor: "#FFCF2D",
    paddingVertical: 15,
    marginHorizontal: 30,
    marginTop: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  disabledButton: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    width: width * 0.9,
    maxHeight: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  avatarGrid: {
    maxHeight: 300,
  },
  avatarGridContent: {
    paddingVertical: 10,
  },
  avatarOption: {
    margin: 8,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: "#ddd",
    overflow: "hidden",
  },
  selectedAvatarOption: {
    borderColor: "#FFCF2D",
    borderWidth: 3,
  },
  modalButtons: {
    flexDirection: "row",
    marginTop: 20,
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#FFCF2D",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "bold",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emailInput: {
    flex: 1,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  verifyButton: {
    paddingHorizontal: 15,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFCF2D',
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  verifyButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  verifiedText: {
    color: 'green',
    fontSize: 12,
    marginTop: 5,
  },
  unverifiedText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  unverifiedInput: {
    borderColor: 'red',
ght: "bold",
ght: "bold",
  },
});
export default PersonalInfo;
