import React from 'react';
import { Tabs } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { fontSize: 12 },
        headerShown: false, // 通常 Tab 内部的屏幕不需要自己的 Header
        // 确保Tab栏安全区域正确
        tabBarStyle: {
          height: 60,
          paddingBottom: 10
        }
      }}
    >
      <Tabs.Screen
        name="index" // 对应 app/(tabs)/index.tsx
        options={{
          title: '书架', // Tab 标题
          tabBarIcon: ({ color, size }) => (
            <Icon name="library-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about" // 对应 app/(tabs)/about.tsx
        options={{
          title: '关于',
          tabBarIcon: ({ color, size }) => (
            <Icon name="information-circle-outline" size={size} color={color} />
          ),
        }}
      />
      {/* 设置页面需要确保文件存在 */}
      <Tabs.Screen
        name="settings" // 对应 app/(tabs)/settings.tsx
        options={{
          title: '设置',
          tabBarIcon: ({ color, size }) => (
            <Icon name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
