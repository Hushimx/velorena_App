import { HapticTab } from '@/components/HapticTab';
import CustomTabBar from '@/components/ui/CustomTabBar';
import { FontAwesome6 } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2a1e1e',
        tabBarInactiveTintColor: '#8B7355',
        tabBarButton: HapticTab,
        tabBarStyle: { backgroundColor: 'transparent' },
        tabBarLabelStyle: { fontSize: 11, fontFamily: 'NotoSansArabic_600SemiBold' },
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'الاشعارات',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="bell" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الاعدادات',
          href: null,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="gear" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'الدعم',
          href: null,
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="headset" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
