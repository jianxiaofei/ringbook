import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRouter } from 'expo-router'; // 引入 useRouter

const AboutScreen = () => { // 移除 navigation prop
  const router = useRouter(); // 使用 useRouter
  // 应用版本号
  const appVersion = '1.0.0';
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>关于应用</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Icon name="book" size={80} color="#007AFF" />
          <Text style={styles.appName}>悦听书</Text>
          <Text style={styles.version}>版本 {appVersion}</Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>应用介绍</Text>
          <Text style={styles.description}>
            悦听书是一款专为爱书之人设计的iOS应用，让您能够随时随地享受阅读与听书的乐趣。支持导入本地书籍，自定义语速，记录阅读进度，让您的阅读体验更加便捷舒适。本应用完全离线运行，不需要网络连接。
          </Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>功能特点</Text>
          <View style={styles.featureItem}>
            <Icon name="document-text-outline" size={20} color="#007AFF" />
            <Text style={styles.featureText}>导入本地书籍文件</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="volume-high-outline" size={20} color="#007AFF" />
            <Text style={styles.featureText}>文本朗读功能</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="speedometer-outline" size={20} color="#007AFF" />
            <Text style={styles.featureText}>自定义朗读语速</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="list-outline" size={20} color="#007AFF" />
            <Text style={styles.featureText}>章节目录导航</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="bookmark-outline" size={20} color="#007AFF" />
            <Text style={styles.featureText}>自动记录阅读进度</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="lock-closed-outline" size={20} color="#007AFF" />
            <Text style={styles.featureText}>完全离线，保护隐私</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  version: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#444',
  }
});

export default AboutScreen;
