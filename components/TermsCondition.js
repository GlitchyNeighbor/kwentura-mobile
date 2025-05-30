// e:\Kwentura\Kwentura_Mobile\components\TermsCondition.js
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

const TermsCondition = ({ navigation }) => {
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
        <Text style={styles.headerTitle}>Terms & Conditions</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* No stray text/whitespace here */}
        <Text style={styles.effectiveDate}>Effective Date: APRIL 28, 2025</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          Welcome to the Kwentura mobile application. The following Terms and
          Conditions govern your use of the App, and by registering for or using
          the App, you agree to comply with these Terms. If you do not agree to
          these Terms, please refrain from using the App.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>Please read these Terms carefully.</Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>1. ACCEPTANCE OF TERMS</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          By accessing or using the App, you acknowledge that you have read,
          understood, and agree to be bound by these Terms and Conditions. If
          you do not agree with these Terms, you are not authorized to use the
          App.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>2. ELIGIBILITY FOR REGISTRATION</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          You may only register for and use the App if you meet the following
          criteria:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • You are a parent or legal guardian of a student currently enrolled
          at Monlimar Development Academy.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • If your child is not enrolled at Monlimar Development Academy, you
          are not permitted to use or register for the App.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>3. ACCOUNT REGISTRATION</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          To use the App, you must complete the registration process. You are
          required to provide the following information:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Guardian Information: First Name, Last Name, and Phone Number
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Student Information: First Name, Last Name, Learner’s Reference
          Number (LRN), Grade Level, and Section
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          You agree to provide accurate, complete, and current information. You
          are responsible for maintaining the confidentiality of your login
          credentials and for all activities that occur under your account.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>4. RESTRICTIONS ON USE</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>You may not use the App to:</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Register if your child is not currently enrolled at Monlimar
          Development Academy.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Engage in illegal activities, including but not limited to, fraud,
          data theft, or harassment.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.listItem}>
          • Violate any applicable local, state, or national laws or
          regulations.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We reserve the right to suspend or terminate any account found in
          violation of these restrictions.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>5. DATA PRIVACY AND SECURITY</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We are committed to protecting your privacy. The personal information
          you provide during the registration process is collected and stored
          securely. We will use your data solely for the purposes of operating
          the App and providing related services. We will not share your
          personal information with third parties without your consent, unless
          required by law.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          All data is handled in compliance with applicable data protection
          laws, including the Data Privacy Act of 2012 of the Republic of the
          Philippines.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          For further details, please refer to our Privacy Policy.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>6. INTELLECTUAL PROPERTY</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          The App and all its contents, including but not limited to, text,
          graphics, logos, images, software, and designs, are the exclusive
          intellectual property of the student developers of "I.Think" from the
          NU MOA Group and Monlimar Development Academy. You are granted a
          limited, non-transferable license to access and use the App for
          personal, non-commercial purposes. Any unauthorized use or
          reproduction of the content is prohibited.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>
          7. ACCOUNT SUSPENSION AND TERMINATION
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We reserve the right, at our sole discretion, to suspend or terminate
          your account and access to the App at any time, with or without
          notice, for any reason, including without limitation if we believe
          that you have violated these Terms. Upon termination, you must
          immediately cease all use of the App.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>
          8. MODIFICATIONS TO THE TERMS AND CONDITIONS
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We may update these Terms at any time, and such changes will be
          effective immediately upon posting the revised Terms on the App. You
          are encouraged to review these Terms periodically. Your continued use
          of the App after any changes constitutes your acceptance of the
          modified Terms.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>9. LIMITATION OF LIABILITY</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          To the fullest extent permitted by law, Monlimar Development Academy
          and the developers of the App shall not be liable for any indirect,
          incidental, special, consequential, or punitive damages, or any loss
          of data, profits, or revenue arising out of your use or inability to
          use the App.
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          We are not liable for any technical issues, interruptions, or
          unauthorized access to your account, or for any losses that may result
          from such incidents.
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>
          10. GOVERNING LAW AND DISPUTE RESOLUTION
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          These Terms and Conditions are governed by and construed in accordance
          with the laws of the Republic of the Philippines. Any disputes arising
          from or in connection with these Terms shall be resolved through
          binding arbitration, in accordance with the rules of the Philippine
          Dispute Resolution Center, Inc (PDRCI).
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.subHeading}>11. CONTACT INFORMATION</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          If you have any questions or concerns about these Terms, please
          contact us at:
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.contactInfo}>
          Email: lopenafv@students.nu-moa.edu.ph
        </Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.contactInfo}>Phone: 09686870844</Text>
        {/* No stray text/whitespace here */}
        <Text style={styles.contactInfo}>
          Address: 571 MLQ ST PUROK 6 BAGUMBAYAN TAGUIG CITY
        </Text>
        {/* No stray text/whitespace here */}
        <View style={styles.divider} />
        {/* No stray text/whitespace here */}
        <Text style={styles.paragraph}>
          By registering and using the App, you acknowledge that you have read,
          understood, and agreed to these Terms and Conditions. Thank you for
          using the Kwentura mobile application.
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
    fontSize: 18,
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
  listItem: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
    marginLeft: 10,
    color: "#555",
  },
  contactInfo: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 5,
    color: "#555",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
});

export default TermsCondition;
