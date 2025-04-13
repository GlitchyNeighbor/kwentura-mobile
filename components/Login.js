import {
  TextInput,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

import { auth } from "../FirebaseConfig";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";

const Login = ({ navigation }) => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signIn = async () => {
    try{ 
      const user = await signInWithEmailAndPassword(auth, email, password)
      if (user) navigation.navigate("Home");
    }
    catch (error) { 
      console.log(error) 
      alert('Sign in failed: ' + error.message)
    }
  }

  return (

    <SafeAreaView style={{ padding: 30, width: "100%", height: "100%" }}>

      <View style={{flexDirection: 'row'}}>
        <Image source={require('../assets/Logo.png')} style={{width: 50, height: 50, marginRight: 10}}/>
        <Text
          style={{
            fontWeight: "bold",
            fontFamily: "Sans Serif",
            fontSize: 20,
            marginTop: 8,
            color: 'red',
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
            color: 'red',
          }}
        >
          Welcome!
        </Text>
        <Text style={{marginTop: 20, color: 'grey', fontSize: 16, alignSelf: 'center'}}>Discover, Imagine, and Grow</Text>
        <Text style={{marginBottom: 20, color: 'grey', fontSize: 16, alignSelf: 'center'}}>with Filipino Stories!</Text>

        <TextInput style={styles.input} placeholder="Email" onChangeText={setEmail}/>
        <TextInput style={styles.input} placeholder="Password" onChangeText={setPassword}/>

        {/* <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("Home")}
        > */}

        <TouchableOpacity
          style={styles.button}
          onPress={signIn}
        >
          <Text
            style={{
              fontWeight: "bold",
              fontSize: 24,
              alignSelf: "center",
              color: 'white',
            }}
          >
            Log in
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
    marginTop: "50%",
  },
  input: {
    borderWidth: 1,
    padding: 10,
    marginBottom: 20,
    borderRadius: 20,
    height: 50,
    boxShadow: '0px 7px rgb(85, 85, 85)',
  },
  button: {
    padding: 12,
    height: "auto",
    borderRadius: 16,
    backgroundColor: 'red',
  },
});

export default Login;
