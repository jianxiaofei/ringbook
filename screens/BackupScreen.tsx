import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { handleBackup, getLastBackupTime, shareBackup } from '../services/backupService';
import { useRouter } from 'expo-router';

const BackupScreen = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    loadBackupInfo();
  }, []);

  const loadBackupInfo = async () => {
    const time = await getLastBackupTime();
    setLastBackupTime(time);
  };

  const startBackup = async () => {
    setIsLoading(true);
    try {
      await handleBackup();
      loadBackupInfo(); // 刷新上次备份时间
    } catch (error) {
      console.error('备份失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShareBackup = async () => {
    setIsLoading(true);
    try {
      await shareBackup();
    } catch (error) {
      Alert.alert('分享失败', '无法分享备份文件');
    } finally {
      setIsLoading(false);
    }
  };

  const formatBackupTime = (isoTimeString: string | null): string => {
    if (!isoTimeString) return '从未备份';
    
    try {
      const date = new Date(isoTimeString);
      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch (error) {
      return '未知时间';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          // 针对 Web 平台的特殊处理
          if (Platform.OS === 'web') {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/(tabs)');
            }
          } else {
            router.back();
          }
        }}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>备份与恢复</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>备份信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>上次备份时间:</Text>
            <Text style={styles.infoValue}>{formatBackupTime(lastBackupTime)}</Text>
          </View>
        </View>

        <View style={styles.buttonSection}>
          <TouchableOpacity 
            style={[styles.button, styles.backupButton]}
            onPress={startBackup}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Icon name="save-outline" size={20} color="#FFF" />
                <Text style={styles.buttonText}>备份书籍数据</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.shareButton]}
            onPress={handleShareBackup}
            disabled={isLoading || !lastBackupTime}
          >
            <Icon name="share-outline" size={20} color="#FFF" />
            <Text style={styles.buttonText}>分享备份文件</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.noticeSection}>
          <Icon name="information-circle-outline" size={24} color="#666" />
          <Text style={styles.noticeText}>
            备份功能将保存您的书籍元数据，包括阅读进度等信息。但不包括完整书籍内容，您需要重新导入书籍文件。此功能完全离线，不需要网络连接。
          </Text>
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#666',
  },
  infoValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  buttonSection: {
    padding: 16,
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  backupButton: {
    backgroundColor: '#007AFF',
  },
  shareButton: {
    backgroundColor: '#5AC8FA',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  noticeSection: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
    marginLeft: 8,
    lineHeight: 20,
  },
});

export default BackupScreen;
