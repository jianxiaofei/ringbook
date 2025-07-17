import React from 'react';
import { Stack } from 'expo-router';
import { SpeechProvider } from '@/services/SpeechContext';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function RootLayout() {
  return (
    // 添加 SafeAreaProvider 包装整个应用
    <SafeAreaProvider>
      <SpeechProvider>
        {/* 设置 StatusBar */}
        <StatusBar barStyle="dark-content" />
        <Stack 
          screenOptions={{ 
            headerShown: false,
            // 确保内容不会被状态栏遮挡
            contentStyle: { 
              backgroundColor: '#FFFFFF'
            },
            // 启用安全区域
            safeAreaInsets: { top: 'always', bottom: 'always' }
          }}
        >
          {/* 主 Tab 导航 */}
          <Stack.Screen name="(tabs)" />
          {/* 阅读器屏幕，动态路由 */}
          <Stack.Screen name="reader/[bookId]" />
          {/* 备份屏幕 */}
          <Stack.Screen name="backup" />
        </Stack>
      </SpeechProvider>
    </SafeAreaProvider>
  );
}

export default RootLayout;
