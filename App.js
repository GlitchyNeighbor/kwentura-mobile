
import Login from './components/Login.js';
import Home from './components/Home.js';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import Categories from './components/Categories.js';
import Bawal from './components/Bawal.js';
import Library from './components/Library.js';
import Profile from './components/Profile.js';
import Search from './components/Search.js';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer> 
      <Stack.Navigator screenOptions={{headerShown: false}} >
        <Stack.Screen name='Login' component={Login}/>
        <Stack.Screen name='Home' component={Home}/>
        <Stack.Screen name='Categories' component={Categories}/>
        <Stack.Screen name='Bawal' component={Bawal}/>
        <Stack.Screen name='Library' component={Library}/>
        <Stack.Screen name='Profile' component={Profile}/>
        <Stack.Screen name='Search' component={Search}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

