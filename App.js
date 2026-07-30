import React from 'react';
import './src/api/firebase';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import MainScreen from './src/screens/MainScreen';
import MypageScreen from './src/screens/MypageScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import AddScreen from './src/screens/AddScreen';
import SignupScreen from './src/screens/SignupScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import LikelistScreen from './src/screens/LikelistScreen';
import SellinglistScreen from './src/screens/SellinglistScreen';
import AiSearchScreen from './src/screens/AiSearchScreen';
import CategoryItemListScreen from './src/screens/CategoryItemListScreen';
import DetailScreen from './src/screens/DetailScreen';


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();


function TabNavigator() {
  return (
    <Tab.Navigator 
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case '홈':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case '검색':
              iconName = focused ? 'search' : 'search-outline';
              break;
            case '카테고리':
              iconName = focused ? 'grid' : 'grid-outline';
              break;
            case '등록':
              iconName = focused ? 'add-circle' : 'add-circle-outline';
              break;
            case '마이페이지':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              iconName = 'ellipse-outline';  
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#8E8E93'
      })}
    >
      <Tab.Screen 
        name="홈" 
        component={MainScreen} 
      />

      <Tab.Screen 
        name="검색" 
        component={MainScreen}
        listeners={({navigation}) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.navigate('Search');
          },
        })} 
      />

      <Tab.Screen 
        name="카테고리" 
        component={CategoryScreen} 
      />

      <Tab.Screen 
        name="등록" 
        component={AddScreen} 
      />

      <Tab.Screen 
        name="마이페이지" 
        component={MypageScreen} 
      />

    </Tab.Navigator>
  );
}


export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={TabNavigator}
          options={{ 
            headerShown: false 
          }}
        />

        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ 
            title: '로그인' 
          }}
        />

        <Stack.Screen
          name="Signup"
          component={SignupScreen}
          options={{ 
            title: '회원가입' 
          }}
        />

        <Stack.Screen
          name="EditProfile"
          component={EditProfileScreen}
          options={{ 
            title: '프로필 수정' 
          }}
        />

        <Stack.Screen
          name="Mypage"
          component={MypageScreen}
          options={{ 
            title: '마이페이지' 
          }}
        />

        <Stack.Screen
          name="Likelist"
          component={LikelistScreen}
          options={{ 
            title: '찜한 상품' 
          }}
        />

        <Stack.Screen
          name="Sellinglist"
          component={SellinglistScreen}
          options={{ 
            title: '판매 중인 상품' 
          }}
        />

        <Stack.Screen
          name="Search"
          component={AiSearchScreen}
          options={{title:"검색"}}
        />

        <Stack.Screen
          name="CategoryItemList"
          component={CategoryItemListScreen}
          options={{
            title:"상품 목록"
          }}
        />

        <Stack.Screen
          name="Detail"
          component={DetailScreen}
          options={{
            title:"상품 상세"
          }}
        />

        <Stack.Screen
          name="AddScreen"
          component={AddScreen}
          options={{
            title: '상품 등록/수정'
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}