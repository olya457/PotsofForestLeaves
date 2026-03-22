import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MainTabParamList } from './types';

import MenuScreen from '../screens/MenuforestScreen';
import QuizScreen from '../screens/QuizforestScreen';
import ListScreen from '../screens/ListforestScreen';
import StoriesScreen from '../screens/StoriesforestScreen';
import SavedScreen from '../screens/SavedforestScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({
  source,
  focused,
}: {
  source: any;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Image
        source={source}
        style={[
          styles.iconImage,
          {
            tintColor: focused ? '#FFD7A1' : '#E0A35C',
          },
        ]}
        resizeMode="contain"
      />
    </View>
  );
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Menu"
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 22,
          right: 22,
          bottom: Math.max(insets.bottom + 10, 18),
          height: 58,
          backgroundColor: '#6A381C',
          borderRadius: 30,
          borderTopWidth: 0,
          borderWidth: 1.2,
          borderColor: '#C89B5A',
          elevation: 8,
          shadowColor: '#000',
          shadowOpacity: 0.22,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 4 },
          paddingHorizontal: 10,
          paddingTop: 7,
          paddingBottom: 7,
        },
        tabBarItemStyle: {
          marginHorizontal: 2,
        },
      }}
    >
      <Tab.Screen
        name="Stories"
        component={StoriesScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('../assets/icons/tab_stories.png')}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('../assets/icons/tab_quiz.png')}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Menu"
        component={MenuScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('../assets/icons/tab_home.png')}
            />
          ),
        }}
      />

      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('../assets/icons/tab_saved.png')}
            />
          ),
        }}
      />

      <Tab.Screen
        name="List"
        component={ListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              source={require('../assets/icons/tab_list.png')}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255, 214, 160, 0.12)',
  },
  iconImage: {
    width: 22,
    height: 22,
  },
});