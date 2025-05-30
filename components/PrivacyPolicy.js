// e:\Kwentura\Kwentura_Mobile\components\PrivacyPolicy.js
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";

const PrivacyPolicy = ({ navigation }) => {
  // Ensure navigation prop exists before using it
  const handleGoBack = () => {
    if (navigation && navigation.goBack) {
      navigation.goBack();
    } else {
      console.warn(
        "Navigation prop is not available or goBack is not a function"
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* No stray text/whitespace here */}
        <Text style={styles.effectiveDate}>
          Effective Date: April 28th 2025
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          This Privacy Policy explains how we collect, use, disclose, and
          protect your personal information when you use the Kwentura mobile
          application. By accessing or using the App, you agree to the
          collection and use of your information in accordance with this Policy.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          Please read this Privacy Policy carefully to understand our views and
          practices regarding your personal data.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>1. INFORMATION WE COLLECT</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We collect personal information from you when you register for and use
          the App. This information may include:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.subListTitle}>a. Guardian Information:</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• First Name</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Last Name</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Email Address</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Phone Number</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.subListTitle}>b. Student Information:</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• First Name</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Last Name</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Learner’s Reference Number (LRN)</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Grade Level</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>• Section</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We may also collect additional information if you choose to provide it
          for the use of the App.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>2. HOW WE USE YOUR INFORMATION</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          The information we collect is used to:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Provide you with access to the App and its features.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Verify your identity and eligibility to use the App.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Communicate with you regarding updates, notices, and other
          information about the App.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Improve the functionality and services of the App.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Respond to your inquiries and requests.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>3. DATA SECURITY</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We are committed to ensuring that your information is secure. We take
          reasonable measures to protect the personal data you provide to us
          from unauthorized access, disclosure, alteration, or destruction.
          However, please be aware that no method of transmission over the
          internet or electronic storage is 100% secure, and we cannot guarantee
          absolute security.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>4. SHARING YOUR INFORMATION</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We do not share your personal information with third parties without
          your consent, except in the following cases:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Legal Requirements: If we are required by law to do so, we may
          disclose your information to comply with legal obligations, protect
          our rights, or prevent illegal activities.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Service Providers: We may share your information with trusted
          service providers who assist us in operating the App and providing
          services to you. These providers are obligated to keep your data
          confidential.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We will never sell or rent your personal information to third parties.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>5. DATA RETENTION</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We will retain your personal information only for as long as necessary
          for the purposes outlined in this Privacy Policy. Once your
          information is no longer needed, we will securely delete or anonymize
          it, in accordance with applicable laws and regulations.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>6. YOUR RIGHTS AND CHOICES</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          As a user, you have the following rights:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Access to Your Data: You have the right to request a copy of the
          personal data we hold about you.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Correction of Data: You have the right to request corrections to any
          inaccurate or incomplete personal data.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Deletion of Data: You may request that we delete your personal data,
          subject to any legal obligations we may have to retain it.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          To exercise these rights, please contact us using the contact details
          provided at the end of this Policy.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>7. CHILDREN'S PRIVACY</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          The App is intended for children ages 5 to 6 (Kindergarten to Grade
          1). We collect personal information from guardians of children within
          this age range in order to provide access to the App and its services.
          By using the App, you affirm that you are the guardian of a child who
          meets these age requirements.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We do not knowingly collect personal information from children under 5
          years of age. If we become aware that we have inadvertently collected
          personal information from a child under the age of 5, we will take
          steps to delete that information.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>8. CHANGES TO THIS PRIVACY POLICY</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page with an updated "Effective Date." We encourage
          you to review this Privacy Policy periodically to stay informed about
          how we are protecting your personal information.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>9. CONTACT US</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          If you have any questions or concerns about this Privacy Policy or how
          we handle your personal data, please contact us at:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.contactInfo}>
          Email: lopenafv@students.nu-moa.edu.ph
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.contactInfo}>Phone: 09686870844</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.contactInfo}>
          Address: 571 MLQ ST Purok 6 Bagumbayan Taguig City
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          By using the App, you consent to the terms of this Privacy Policy.
          Thank you for trusting us with your personal information.
        </Text>
        {/* No stray text/whitespace here */}
      </ScrollView>
    </SafeAreaView>
  );
};

// --- Styles --- (Keep styles as they are)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#f8f8f8",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 24 + 10,
  },
  scrollContainer: {
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  effectiveDate: {
    fontSize: 14,
    fontStyle: "italic",
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  subHeading: {
    fontSize: 17,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
    color: "#444",
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 15,
    color: "#555",
    textAlign: "justify",
  },
  subListTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    marginLeft: 5,
    color: "#555",
  },
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 15,
    color: "#555",
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 5,
    color: "#555",
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
});

export default PrivacyPolicy;
