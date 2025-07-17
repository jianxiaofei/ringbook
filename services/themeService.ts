import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 主题类型
export type ThemeType = 'light' | 'dark';

// 存储键
const THEME_STORAGE_KEY = 'ringbook_theme';

// 亮色主题
export const lightTheme = {
  background: '#FFFFFF',
  text: '#333333',
  textSecondary: '#666666',
  primary: '#007AFF',
  secondary: '#5AC8FA',
  accent: '#FF9500',
  border: '#E5E5E5',
  card: '#F8F8F8',
  error: '#FF3B30',
  readerBackground: '#F9F5E9', // 类似纸张的米黄色
};

// 深色主题
export const darkTheme = {
  background: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#AEAEB2',
  primary: '#0A84FF',
  secondary: '#64D2FF',
  accent: '#FF9F0A',
  border: '#38383A',
  card: '#2C2C2E',
  error: '#FF453A',
  readerBackground: '#2C2C2E', // 深色模式下的阅读背景
};

/**
 * 主题服务钩子
 * @returns 当前主题和主题切换函数
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeType>('light');
  const [colors, setColors] = useState(lightTheme);

  // 加载保存的主题
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
          setColors(savedTheme === 'dark' ? darkTheme : lightTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    
    loadTheme();
  }, []);

  // 切换主题
  const toggleTheme = async () => {
    const newTheme: ThemeType = theme === 'light' ? 'dark' : 'light';
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      setTheme(newTheme);
      setColors(newTheme === 'dark' ? darkTheme : lightTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  // 设置特定主题
  const setThemeType = async (themeType: ThemeType) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, themeType);
      setTheme(themeType);
      setColors(themeType === 'dark' ? darkTheme : lightTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  return {
    theme,
    colors,
    toggleTheme,
    setTheme: setThemeType,
  };
};
