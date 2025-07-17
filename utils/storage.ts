import AsyncStorage from '@react-native-async-storage/async-storage';
import { Book, ReadingProgress } from '../types';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// 存储键
const BOOKS_STORAGE_KEY = 'ringbook_books';
const PROGRESS_STORAGE_KEY = 'ringbook_reading_progress';

// 保存书籍数据
export const saveBooks = async (books: Book[]): Promise<void> => {
  try {
    let booksToSave = books;
    if (Platform.OS === 'web') {
      // Web端去除content字段，避免超限
      booksToSave = books.map(({ content, ...rest }) => rest);
    }
    await AsyncStorage.setItem(BOOKS_STORAGE_KEY, JSON.stringify(booksToSave));
  } catch (error) {
    console.error('Error saving books:', error);
    throw error;
  }
};

// 获取所有书籍
export const getBooks = async (): Promise<Book[]> => {
  try {
    const booksData = await AsyncStorage.getItem(BOOKS_STORAGE_KEY);
    return booksData ? JSON.parse(booksData) : [];
  } catch (error) {
    console.error('Error getting books:', error);
    return [];
  }
};

// 保存阅读进度
export const saveReadingProgress = async (progress: ReadingProgress): Promise<void> => {
  try {
    // 获取现有进度
    const progressData = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    const allProgress: ReadingProgress[] = progressData ? JSON.parse(progressData) : [];
    
    // 更新或添加进度
    const index = allProgress.findIndex(p => p.bookId === progress.bookId);
    if (index > -1) {
      allProgress[index] = progress;
    } else {
      allProgress.push(progress);
    }
    
    await AsyncStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(allProgress));
  } catch (error) {
    console.error('Error saving reading progress:', error);
    throw error;
  }
};

// 获取特定书籍的阅读进度
export const getReadingProgress = async (bookId: string): Promise<ReadingProgress | null> => {
  try {
    const progressData = await AsyncStorage.getItem(PROGRESS_STORAGE_KEY);
    const allProgress: ReadingProgress[] = progressData ? JSON.parse(progressData) : [];
    const bookProgress = allProgress.find(p => p.bookId === bookId);
    
    return bookProgress || null;
  } catch (error) {
    console.error('Error getting reading progress:', error);
    return null;
  }
};

// 添加书籍到书库
export const addBook = async (book: Book): Promise<void> => {
  try {
    const books = await getBooks();
    
    // 检查是否已存在相同标题的书籍
    const existingBookIndex = books.findIndex(b => b.title === book.title);
    
    if (existingBookIndex >= 0) {
      // 更新已有书籍而不是添加新的
      books[existingBookIndex] = book;
    } else {
      // 对于大型书籍，只保留摘要内容用于存储
      const MAX_STORAGE_CONTENT_LENGTH = 10000; // 设置一个合理的长度限制
      
      // 创建一个新的书籍对象，可能包含裁剪后的内容
      const bookToStore = { ...book };
      
      if (book.content && book.content.length > MAX_STORAGE_CONTENT_LENGTH && !book.isEpub) {
        // 保存原始内容到文件系统或IndexedDB (Web)，这里只保留书籍内容的摘要
        const contentSummary = book.content.substring(0, 1000) + 
                               `...\n[内容已省略，完整内容共${book.content.length}字符]`;
        
        // 1. 尝试创建和保存文件（针对本地文件系统）
        if (Platform.OS !== 'web') {
          try {
            const fileUri = `${FileSystem.documentDirectory}books/${book.id}.txt`;
            // 确保目录存在
            await FileSystem.makeDirectoryAsync(
              `${FileSystem.documentDirectory}books/`, 
              { intermediates: true }
            );
            // 写入文件
            await FileSystem.writeAsStringAsync(fileUri, book.content);
            // 更新书籍对象，包含文件URI
            bookToStore.contentFileUri = fileUri;
            bookToStore.content = contentSummary; // 只保存摘要
          } catch (fileError) {
            console.error('保存书籍内容到文件失败:', fileError);
            // 即使保存失败，仍然存储裁剪内容到AsyncStorage
            bookToStore.content = contentSummary;
          }
        } else {
          // Web平台 - 仅保存摘要内容到localStorage
          bookToStore.content = contentSummary;
          bookToStore.hasTruncatedContent = true;
        }
      }
      
      books.push(bookToStore);
    }
    
    await saveBooks(books);
  } catch (error) {
    console.error('Error adding book:', error);
    throw error;
  }
};

// 更新书籍信息
export const updateBook = async (updatedBook: Book): Promise<void> => {
  const books = await getBooks();
  const index = books.findIndex(book => book.id === updatedBook.id);
  
  if (index !== -1) {
    let bookToUpdate = updatedBook;
    if (Platform.OS === 'web') {
      // Web端去除content字段
      const { content, ...rest } = updatedBook;
      bookToUpdate = rest as Book;
    }
    books[index] = bookToUpdate;
    await saveBooks(books);
  }
};

// 删除书籍
export const deleteBook = async (bookId: string): Promise<void> => {
  const books = await getBooks();
  const filteredBooks = books.filter(book => book.id !== bookId);
  await saveBooks(filteredBooks);
};
