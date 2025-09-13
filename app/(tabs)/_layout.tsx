import { HapticTab } from '@/components/HapticTab';
import CustomTabBar from '@/components/ui/CustomTabBar';
import { FontAwesome6, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

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
        name="categories"
        options={{
          title: 'الأقسام',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="th-large" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="shopping-cart" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'المزيد',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="bars" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
