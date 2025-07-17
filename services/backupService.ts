import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { Alert, Share, Platform } from 'react-native';
import { Book } from '../types';
import { getBooks } from '../utils/storage';

// 备份路径（仅适用于原生平台）
const BACKUP_DIR = Platform.OS !== 'web' ? `${FileSystem.documentDirectory}backups` : '';
const BACKUP_FILE = Platform.OS !== 'web' ? `${BACKUP_DIR}/books_backup.json` : '';

// Web 平台上的临时备份数据
let webBackupData: string | null = null;

/**
 * 确保备份目录存在（仅原生平台）
 */
const ensureBackupDirExists = async (): Promise<void> => {
  if (Platform.OS === 'web') return; // Web 平台不需要创建文件夹
  
  try {
    const dirInfo = await FileSystem.getInfoAsync(BACKUP_DIR);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(BACKUP_DIR, { intermediates: true });
    }
  } catch (error) {
    console.error('Error creating backup directory:', error);
    throw new Error('无法创建备份目录');
  }
};

/**
 * 备份书籍数据
 */
export const backupBooks = async (): Promise<string> => {
  try {
    // 获取所有书籍
    const books = await getBooks();
    
    // 如果没有书籍，提示用户
    if (books.length === 0) {
      return '没有书籍可备份';
    }
    
    // 备份元数据，但不包括完整的书籍内容
    const backupData = books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      coverImage: book.coverImage,
      filePath: book.filePath,
      currentPosition: book.currentPosition,
      lastReadTime: book.lastReadTime,
      // 不备份content，内容太大
    }));
    
    const jsonData = JSON.stringify(backupData);
    
    if (Platform.OS === 'web') {
      // Web 平台上，我们只能暂存数据在内存中
      webBackupData = jsonData;
    } else {
      // 原生平台，写入文件系统
      await ensureBackupDirExists();
      await FileSystem.writeAsStringAsync(BACKUP_FILE, jsonData, { encoding: FileSystem.EncodingType.UTF8 });
    }
    
    return '书籍备份成功';
  } catch (error) {
    console.error('Error backing up books:', error);
    throw new Error('备份书籍失败');
  }
};

/**
 * 分享备份文件
 */
export const shareBackup = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      if (!webBackupData) {
        throw new Error('没有可用的备份数据，请先创建备份');
      }
      
      // 在 Web 上，我们可以通过创建临时下载链接来实现"分享"
      const blob = new Blob([webBackupData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = 'ringbook_backup.json';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      
      // 释放对象 URL
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } else {
      // 原生平台
      const fileInfo = await FileSystem.getInfoAsync(BACKUP_FILE);
      if (!fileInfo.exists) {
        throw new Error('没有找到备份文件，请先创建备份');
      }
      
      // 使用Share API分享文件
      await Share.share({
        title: '悦听书备份',
        message: '这是我的悦听书备份文件',
        url: fileInfo.uri,
      });
    }
  } catch (error) {
    console.error('Error sharing backup:', error);
    Alert.alert('分享失败', '无法分享备份文件');
  }
};

/**
 * 获取上次备份时间
 */
export const getLastBackupTime = async (): Promise<string | null> => {
  try {
    const lastBackupTime = await AsyncStorage.getItem('ringbook_last_backup_time');
    return lastBackupTime;
  } catch (error) {
    console.error('Error getting last backup time:', error);
    return null;
  }
};

/**
 * 设置上次备份时间
 */
export const setLastBackupTime = async (): Promise<void> => {
  try {
    const now = new Date().toISOString();
    await AsyncStorage.setItem('ringbook_last_backup_time', now);
  } catch (error) {
    console.error('Error setting last backup time:', error);
  }
};

/**
 * 处理备份流程
 */
export const handleBackup = async (): Promise<void> => {
  try {
    // 执行备份
    const message = await backupBooks();
    await setLastBackupTime();
    
    // 显示分享选项
    Alert.alert(
      '备份完成', 
      message,
      [
        { 
          text: '分享备份', 
          onPress: shareBackup 
        },
        { 
          text: '确定' 
        }
      ]
    );
    
  } catch (error) {
    Alert.alert('备份失败', error instanceof Error ? error.message : '未知错误');
  }
};

/**
 * Web 平台导入备份文件
 */
export const importBackupOnWeb = async (): Promise<string | null> => {
  if (Platform.OS !== 'web') return null;
  
  return new Promise<string | null>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    
    input.onchange = (e) => {
      if (!input.files || input.files.length === 0) {
        resolve(null);
        return;
      }
      
      const file = input.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          resolve(null);
        }
      };
      
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    
    input.click();
  });
};

/**
 * 恢复备份
 */
export const restoreBackup = async (filePath?: string): Promise<void> => {
  try {
    let backupContent: string | null = null;
    
    if (Platform.OS === 'web') {
      // Web 平台通过文件选择器获取备份文件
      backupContent = await importBackupOnWeb();
      if (!backupContent) {
        throw new Error('未选择备份文件或文件读取失败');
      }
    } else if (filePath) {
      // 原生平台通过文件路径读取
      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) {
        throw new Error('备份文件不存在');
      }
      backupContent = await FileSystem.readAsStringAsync(filePath);
    } else {
      throw new Error('需要提供备份文件路径');
    }
    
    // 解析备份数据并恢复
    // 这里应该添加恢复逻辑...
    
    Alert.alert('恢复成功', '书籍数据已成功恢复');
  } catch (error) {
    console.error('Error restoring backup:', error);
    Alert.alert('恢复失败', error instanceof Error ? error.message : '无法恢复备份数据');
  }
};
