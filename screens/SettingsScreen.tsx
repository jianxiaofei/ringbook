import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Alert,
  SafeAreaView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';
import ttsService from '../services/ttsService';
import { useRouter } from 'expo-router'; // 引入 useRouter

// 存储键
const SETTINGS_STORAGE_KEY = 'ringbook_settings';
const DEFAULT_SPEECH_RATE = 0.5;
const DEFAULT_THEME = 'light';
const DEFAULT_FONT_SIZE = 18;

interface Settings {
  defaultSpeechRate: number;
  theme: string;
  fontSize: number;
  enableAutoSave: boolean;
  saveInterval: number; // 以分钟为单位
}

const SettingsScreen = () => {
  const [settings, setSettings] = useState<Settings>({
    defaultSpeechRate: DEFAULT_SPEECH_RATE,
    theme: DEFAULT_THEME,
    fontSize: DEFAULT_FONT_SIZE,
    enableAutoSave: true,
    saveInterval: 1,
  });

  const router = useRouter(); // 使用 useRouter

  useEffect(() => {
    loadSettings();
  }, []);

  // 加载设置
  const loadSettings = async () => {
    try {
      const settingsData = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (settingsData) {
        const parsedSettings = JSON.parse(settingsData);
        setSettings(parsedSettings);
        
        // 更新TTS服务的语速设置
        ttsService.setRate(parsedSettings.defaultSpeechRate);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  // 保存设置
  const saveSettings = async (newSettings: Settings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('错误', '保存设置失败，请重试');
    }
  };

  // 处理语速变化
  const handleRateChange = (value: number) => {
    const newSettings = { ...settings, defaultSpeechRate: value };
    saveSettings(newSettings);
    ttsService.setRate(value);
  };

  // 处理字体大小变化
  const handleFontSizeChange = (value: number) => {
    const newSettings = { ...settings, fontSize: value };
    saveSettings(newSettings);
  };

  // 处理主题切换
  const handleThemeChange = () => {
    const newTheme = settings.theme === 'light' ? 'dark' : 'light';
    const newSettings = { ...settings, theme: newTheme };
    saveSettings(newSettings);
  };

  // 处理自动保存开关
  const handleAutoSaveToggle = (value: boolean) => {
    const newSettings = { ...settings, enableAutoSave: value };
    saveSettings(newSettings);
  };

  // 处理保存间隔变化
  const handleSaveIntervalChange = (value: number) => {
    const newSettings = { ...settings, saveInterval: value };
    saveSettings(newSettings);
  };

  // 重置所有设置
  const handleResetSettings = () => {
    Alert.alert(
      '重置设置',
      '确定要将所有设置恢复为默认值吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: () => {
            const defaultSettings = {
              defaultSpeechRate: DEFAULT_SPEECH_RATE,
              theme: DEFAULT_THEME,
              fontSize: DEFAULT_FONT_SIZE,
              enableAutoSave: true,
              saveInterval: 1,
            };
            saveSettings(defaultSettings);
            ttsService.setRate(DEFAULT_SPEECH_RATE);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>朗读设置</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>默认语速</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={0.9}
                step={0.1}
                value={settings.defaultSpeechRate}
                onValueChange={handleRateChange}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#DDDDDD"
              />
              <Text style={styles.sliderValue}>
                {settings.defaultSpeechRate.toFixed(1)}
              </Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.button}
            onPress={() => {
              ttsService.speak('这是测试语音，您可以调整语速来获得最佳体验');
            }}
          >
            <Text style={styles.buttonText}>测试语音</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>显示设置</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>使用深色模式</Text>
            <Switch
              value={settings.theme === 'dark'}
              onValueChange={handleThemeChange}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.theme === 'dark' ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>阅读字号</Text>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={14}
                maximumValue={24}
                step={1}
                value={settings.fontSize}
                onValueChange={handleFontSizeChange}
                minimumTrackTintColor="#007AFF"
                maximumTrackTintColor="#DDDDDD"
              />
              <Text style={styles.sliderValue}>{settings.fontSize}</Text>
            </View>
          </View>
          
          <View style={styles.fontSizeDemo}>
            <Text style={[styles.demoText, { fontSize: settings.fontSize }]}>
              字体大小预览
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>自动保存</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>启用自动保存</Text>
            <Switch
              value={settings.enableAutoSave}
              onValueChange={handleAutoSaveToggle}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
              thumbColor={settings.enableAutoSave ? '#007AFF' : '#f4f3f4'}
            />
          </View>
          
          {settings.enableAutoSave && (
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>保存间隔 (分钟)</Text>
              <View style={styles.sliderContainer}>
                <Slider
                  style={styles.slider}
                  minimumValue={1}
                  maximumValue={10}
                  step={1}
                  value={settings.saveInterval}
                  onValueChange={handleSaveIntervalChange}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor="#DDDDDD"
                />
                <Text style={styles.sliderValue}>{settings.saveInterval}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>备份与恢复</Text>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => router.push('/backup')} // 使用 router.push 导航
          >
            <View style={styles.settingLabelContainer}>
              <Icon name="cloud-upload-outline" size={20} color="#007AFF" style={{marginRight: 10}} />
              <Text style={styles.settingLabel}>备份与恢复</Text>
            </View>
            <Icon name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.resetButton}
          onPress={handleResetSettings}
        >
          <Icon name="refresh-outline" size={18} color="#fff" />
          <Text style={styles.resetButtonText}>恢复默认设置</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    marginVertical: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  sliderContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  sliderValue: {
    width: 30,
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  fontSizeDemo: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  demoText: {
    color: '#333',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default SettingsScreen;
