import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ImageBackground,
  Alert,
  Linking,
  Dimensions,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AppHeader from "./HeaderProfileBackOnly";

const { width, height } = Dimensions.get('window');

const CONTACT_INFO = {
  email: "lopenafv@students.nu-moa.edu.ph",
  phone: "+63-XXX-XXX-XXXX", // Add actual phone number
  website: "https://kwentura-39597.web.app/contact", // Add actual website
};

const SYSTEM_FEATURES = [
  {
    icon: "library-outline",
    title: "Storybook Library",
    description: "Access to a rich collection of animated Filipino storybooks with interactive elements."
  },
  {
    icon: "people-outline",
    title: "Parent-Child Learning",
    description: "Designed to encourage collaborative learning between parents and children."
  },
  {
    icon: "play-circle-outline",
    title: "Interactive Content",
    description: "Engaging animations, audio narration, and interactive story elements."
  },
  {
    icon: "book-outline",
    title: "Cultural Education",
    description: "Stories rooted in Filipino culture, values, and traditions."
  },
  {
    icon: "school-outline",
    title: "Age-Appropriate",
    description: "Content specifically designed for Kindergarten to Grade 1 students."
  },
  {
    icon: "phone-portrait-outline",
    title: "Mobile Accessibility",
    description: "Learn anywhere, anytime with our mobile-optimized platform."
  }
];

const TECH_STACK = [
  { name: "React Native", description: "Cross-platform mobile development" },
  { name: "Firebase", description: "Backend services and authentication" },
  { name: "Firestore", description: "Real-time database solution" },
  { name: "Node.js", description: "Server-side runtime environment" }
];

const About = ({ navigation }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const handleContactPress = useCallback(async (type, value) => {
    try {
      let url = '';
      switch (type) {
        case 'email':
          url = `mailto:${value}`;
          break;
        case 'phone':
          url = `tel:${value}`;
          break;
        case 'website':
          url = value;
          break;
        default:
          return;
      }

      // Directly attempt to open the URL. `canOpenURL` is unreliable for mailto on Android.
      // The catch block will handle cases where no email client is available.
      await Linking.openURL(url);
    } catch (error) {
      console.error(`Error opening ${type}:`, error);
      Alert.alert("Unable to Open", `Could not open the ${type} client. Please ensure one is installed and configured on your device.`);
    }
  }, []);

  const toggleSection = useCallback((section) => {
    setExpandedSection(current => current === section ? null : section);
  }, []);

  const renderFeatureCard = ({ icon, title, description }, index) => (
    <View key={index} style={styles.featureCard}>
      <View style={styles.featureHeader}>
        <Ionicons name={icon} size={24} color="#FFCF2D" style={styles.featureIcon} />
        <Text style={styles.featureTitle}>{title}</Text>
      </View>
      <Text style={styles.featureDescription}>{description}</Text>
    </View>
  );

  const renderTechItem = ({ name, description }, index) => (
    <View key={index} style={styles.techItem}>
      <View style={styles.techBullet} />
      <View style={styles.techContent}>
        <Text style={styles.techName}>{name}</Text>
        <Text style={styles.techDescription}>{description}</Text>
      </View>
    </View>
  );

  const renderExpandableSection = (title, content, sectionKey) => (
    <View style={styles.expandableSection}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => toggleSection(sectionKey)}
        activeOpacity={0.7}
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        <Ionicons
          name={expandedSection === sectionKey ? "chevron-up" : "chevron-down"}
          size={20}
          color="#666"
        />
      </TouchableOpacity>
      {expandedSection === sectionKey && (
        <View style={styles.sectionContent}>
          {content}
        </View>
      )}
    </View>
  );

  return (
    <ImageBackground
      source={require('../images/About.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.contentContainer}>

          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >

                    <AppHeader
            navigation={navigation}
            leftIconType="drawer"
            showSearch={true}
          />
          
            <View style={styles.textContainer}>
              {/* Header Section */}
              <View style={styles.headerSection}>
                <Text style={styles.title}>About Kwentura</Text>
                <Text style={styles.subtitle}>
                  Bringing Filipino Culture to Young Learners
                </Text>
              </View>

              {/* Overview Card */}
              <View style={styles.overviewCard}>
                <Text style={styles.cardTitle}>System Overview</Text>
                <Text style={styles.paragraph}>
                  Kwentura is an innovative mobile platform designed to make Filipino culture
                  accessible and engaging for young learners. Through animated storybooks and
                  interactive learning resources, we provide an immersive educational experience
                  tailored specifically for Kindergarten to Grade 1 students and their parents
                  from Monlimar Development Academy.
                </Text>
              </View>

              {/* Key Features Section */}
              <View style={styles.section}>
                <Text style={styles.mainSectionTitle}>Key Features</Text>
                <View style={styles.featuresGrid}>
                  {SYSTEM_FEATURES.map((feature, index) => renderFeatureCard(feature, index))}
                </View>
              </View>

              {/* Expandable Sections */}
              {renderExpandableSection(
                "Target Users",
                <View>
                  <View style={styles.targetUserCard}>
                    <Ionicons name="people" size={20} color="#FFCF2D" />
                    <Text style={styles.targetUserText}>
                      Parents and students (K-Grade 1) of Monlimar Development Academy
                    </Text>
                  </View>
                </View>,
                "users"
              )}

              {renderExpandableSection(
                "Technologies Used",
                <View style={styles.techContainer}>
                  {TECH_STACK.map((tech, index) => renderTechItem(tech, index))}
                </View>,
                "tech"
              )}

              {renderExpandableSection(
                "Goals & Objectives",
                <View style={styles.goalsContainer}>
                  <View style={styles.goalItem}>
                    <Ionicons name="flag" size={16} color="#FFCF2D" />
                    <Text style={styles.goalText}>
                      Promote Filipino culture learning through mobile accessibility
                    </Text>
                  </View>
                  <View style={styles.goalItem}>
                    <Ionicons name="heart" size={16} color="#FFCF2D" />
                    <Text style={styles.goalText}>
                      Strengthen parent-child bonds through collaborative learning
                    </Text>
                  </View>
                  <View style={styles.goalItem}>
                    <Ionicons name="book" size={16} color="#FFCF2D" />
                    <Text style={styles.goalText}>
                      Provide engaging, portable educational resources for students
                    </Text>
                  </View>
                </View>,
                "goals"
              )}

              {/* Contact Section */}
              <View style={styles.contactSection}>
                <Text style={styles.contactTitle}>Get in Touch</Text>
                <Text style={styles.contactSubtitle}>
                  Have questions or feedback? We'd love to hear from you!
                </Text>
                
                
                <View style={styles.contactButtons}>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleContactPress('email', CONTACT_INFO.email)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="mail" size={18} color="#fff" />
                    <Text style={styles.contactButtonText}>Email Us</Text>
                  </TouchableOpacity>

                  {/* Uncomment when phone number is available
                  <TouchableOpacity
                    style={[styles.contactButton, styles.phoneButton]}
                    onPress={() => handleContactPress('phone', CONTACT_INFO.phone)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="call" size={18} color="#FFCF2D" />
                    <Text style={[styles.contactButtonText, styles.phoneButtonText]}>Call Us</Text>
                  </TouchableOpacity>
                  */}
                </View>
              </View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  © 2025 Kwentura - Monlimar Development Academy
                </Text>
                <Text style={styles.versionText}>Version 1.0.0</Text>
              </View>
            </View>
          </ScrollView>
        </View>
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
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 30,
  },
  textContainer: {
    paddingHorizontal: 20,
  },
  headerSection: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Fredoka-SemiBold',
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  overviewCard: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  section: {
    marginBottom: 25,
  },
  mainSectionTitle: {
    fontSize: 20,
    fontFamily: 'Fredoka-SemiBold',
    color: "#333",
    marginBottom: 15,
  },
  featuresGrid: {
    gap: 12,
  },
  featureCard: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  featureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  featureIcon: {
    marginRight: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  expandableSection: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  targetUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
  },
  targetUserText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    flex: 1,
  },
  techContainer: {
    gap: 8,
  },
  techItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 4,
  },
  techBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFCF2D",
    marginTop: 8,
    marginRight: 12,
  },
  techContent: {
    flex: 1,
  },
  techName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  techDescription: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  goalsContainer: {
    gap: 12,
  },
  goalItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  goalText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  contactSection: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    padding: 20,
    marginTop: 10,
    marginBottom: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  contactSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  contactButtons: {
    flexDirection: "row",
    gap: 12,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFCF2D",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  phoneButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FFCF2D",
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 6,
  },
  phoneButtonText: {
    color: "#FFCF2D",
  },
  footer: {
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  footerText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  versionText: {
    fontSize: 10,
    color: "#999",
    marginTop: 4,
  },
  paragraph: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
    textAlign: "justify",
  },
});

export default About;