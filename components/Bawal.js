import {
  ScrollView,
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";

const Bawal = ({navigation}) => {
  return (
    <SafeAreaView style={{ width: "100%", height: "100%" }}>

      <View> 
        <View style={{ marginTop:30, marginLeft: 10 ,marginRight: 10}}>
          <View style={styles.header}>
            <Image source={require('../icons/circle-user.png')} style={{width: 30, height: 30, alignSelf: 'center', marginRight: 'auto'}}/>
            <Text
              style={{
                fontWeight: "bold",
                fontFamily: 'sans-serif-medium',
                fontSize: 18,
                marginTop: 8,
                alignSelf: "center",
                color: 'red',
              }}
            >
            Kwentura
            </Text>
            <Image source={require('../icons/bell.png')} style={{width: 30, height: 30, alignSelf: 'center', marginLeft: 'auto'}}/>

          </View>
        </View>
        <View
        style={{
          borderBottomColor: "black",
          borderBottomWidth: 1,
        }}
      ></View>
      </View>

      <View style={styles.bookContainer}> 
        <Image source={require('../books/bawal.png')}style={{borderWidth: 1, width: 170, height: 230, marginLeft: 20, resizeMode: 'contain',}}/>
        <View>
            <Text style={{marginLeft: 10, marginTop: 10, fontSize: 20, fontWeight: 'bold'}}>Ang Batang</Text>
            <Text style={{marginLeft: 10, fontSize: 20, fontWeight: 'bold'}}>Maraming Bawal</Text>
            <Text style={{marginLeft: 10, marginTop: 5, fontSize: 16,}}>By: Fernando Rosal</Text>
            <Text style={{marginLeft: 10, marginTop: 5, fontSize: 16,}}>Gonzales</Text>

            <View style={{flexDirection: 'row', marginTop: 'auto', marginLeft: 10}}> 
                <TouchableOpacity style={styles.Button}> 
                    <Text style={styles.text}> Explore </Text>
                </TouchableOpacity>

                <TouchableOpacity> 
                    <Image source={require('../icons/bookmark-red.png')} style={styles.bookmark}/>
                </TouchableOpacity>
            </View>
        </View>
      </View>

    <View style={{marginLeft: 18, marginTop: 10, marginRight: 18, height: 350}}>
        <Text style={{fontSize: 16, fontWeight: 'bold',}}>Synopsis</Text>
        <Text>Adventure | Most Viewed | New Release</Text>
        <ScrollView style={{height: 200, marginTop: 10}}>
            <Text>
            Romeo the Day Dreamer grew up very sickly. But what exempts him from others is his ability to re-create life through his dreams, hence his nickname.
            Fernando Gonzales shatters the idea that children with delicate conditions are not able to experience life through their innocent hopes and dreams.
            Gonzales does not only show how one fragile child can inspire other kids of the same age, but also how supporting one another can strengthen the Filipino family.
            </Text>
        </ScrollView>
    </View>

        <View
        style={{
          borderBottomColor: "black",
          borderBottomWidth: 1,
          marginTop: 'auto',
        }}>
      </View>

      <View style={styles.navigation}>
        <TouchableOpacity style={styles.navButton} onPress={()=>navigation.navigate('Home')}>
          <Image source={require('../icons/home.png')} style={styles.icons} />
          <Text>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={()=>navigation.navigate('Categories')}>
        <Image source={require('../icons/category.png')} style={styles.icons}/>
        <Text>Categories</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Search")}>
        <Image source={require('../icons/search.png')} style={styles.icons} />
        <Text>Search</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Library")}>
        <Image source={require('../icons/bookmark.png')} style={styles.icons} />
        <Text>Library</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate("Profile")}>
        <Image source={require('../icons/user.png')} style={styles.icons} />
        <Text>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  navigation: {
    marginTop: "auto",
    height: 50,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginBottom: 20,
  },
  navButton: {

  },
  categories: {
    width: 90,
    height: 90,
    borderWidth: 1,
    borderRadius: 8,
  },
  categContainer: {
    flexDirection: "row",
    paddingRight: 10,
    paddingLeft: 10,
    paddingTop: 5,
    justifyContent: "space-evenly",
  },
  books: {
    width: 110,
    height: 120,
    borderWidth: 1,
  },
  bookContainer: {
    flexDirection: "row",
    marginTop: 12,
  },
  Button: { 
    backgroundColor: 'red',
    marginLeft: 3,
    marginTop: 5,
    borderRadius: 3,
    width: 100,
    height: 35,
    alignSelf: 'left',
  }, 
  text: { 
    alignSelf: "center",
    marginRight: 0,
    marginTop: 10, 
    fontSize: 12, 
    fontFamily: 'sans-serif-medium', 
    color: 'white',
  }, 
  categoryText: { 
    fontWeight: 'bold',
    alignSelf: "center", 
    marginTop: 3,
    fontSize: 13,
  }, 
  bookmark: { 
    width: 40, 
    height: 40,
    marginLeft: 5,
    marginTop: 5,
    resizeMode: 'contain',
  },
  row: { 
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  icons: { 
    margin: "auto", 
    width: 30, 
    height: 30
  },
});

export default Bawal;
