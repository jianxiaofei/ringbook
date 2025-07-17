import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  Text, 
  TouchableOpacity, 
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Book } from '../types';
import BookItem from '../components/BookItem';
import BookDetail from '../components/BookDetail';
import EmptyBookshelf from '../components/EmptyBookshelf';
import SearchBar from '../components/SearchBar';
import { getBooks } from '../utils/storage';
import { importBookFile } from '../utils/fileUtils';
import { addBook } from '../utils/storage';
import { useRouter } from 'expo-router'; // 引入 useRouter

const HomeScreen = () => { // 移除 navigation prop
  const router = useRouter(); // 使用 useRouter
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // 获取所有书籍
  const loadBooks = async () => {
    setLoading(true);
    const loadedBooks = await getBooks();
    // 按最后阅读时间排序，最近阅读的在前
    loadedBooks.sort((a, b) => {
      const timeA = a.lastReadTime ? new Date(a.lastReadTime).getTime() : 0;
      const timeB = b.lastReadTime ? new Date(b.lastReadTime).getTime() : 0;
      return timeB - timeA;
    });
    
    setBooks(loadedBooks);
    filterBooks(loadedBooks, searchQuery);
    setLoading(false);
  };

  // 根据搜索词过滤书籍
  const filterBooks = (bookList: Book[], query: string) => {
    if (!query.trim()) {
      setFilteredBooks(bookList);
      return;
    }
    
    const filtered = bookList.filter(book => 
      book.title.toLowerCase().includes(query.toLowerCase()) || 
      (book.author && book.author.toLowerCase().includes(query.toLowerCase()))
    );
    
    setFilteredBooks(filtered);
  };

  useEffect(() => {
    loadBooks();
    // Expo Router 通常不需要手动监听 focus 来刷新，
    // 但如果确实需要，可以使用 useFocusEffect from expo-router
    // const unsubscribe = navigation.addListener('focus', () => {
    //   loadBooks();
    // });
    // return unsubscribe;
  }, []); // 移除 navigation 依赖

  // 处理搜索
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterBooks(books, text);
  };

  // 处理导入新书
  const handleImportBook = async () => {
    try {
      const newBook = await importBookFile();
      
      if (newBook) {
        await addBook(newBook);
        loadBooks(); // 重新加载书籍列表
        Alert.alert('导入成功', `已成功导入《${newBook.title}》`);
      }
    } catch (error) {
      console.error('导入书籍失败:', error);
      Alert.alert('导入失败', '无法导入所选文件，请重试。');
    }
  };

  // 打开书籍详情
  const handleOpenBookDetail = (book: Book) => {
    setSelectedBook(book);
    setShowDetail(true);
  };

  // 打开阅读器
  const handleOpenReader = () => {
    if (selectedBook) {
      setShowDetail(false);
      // 使用 router.push 进行导航，注意路径格式
      router.push(`/reader/${selectedBook.id}`);
    }
  };

  // 关闭书籍详情
  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedBook(null);
  };

  // 书籍被删除后
  const handleBookDeleted = () => {
    setShowDetail(false);
    setSelectedBook(null);
    loadBooks(); // 重新加载书籍列表
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>我的书架</Text>
        <TouchableOpacity style={styles.importButton} onPress={handleImportBook}>
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.importText}>导入</Text>
        </TouchableOpacity>
      </View>

      <SearchBar onSearch={handleSearch} />

      {filteredBooks.length === 0 && !loading ? (
        <EmptyBookshelf />
      ) : (
        <FlatList
          data={filteredBooks}
          renderItem={({ item }) => (
            <BookItem book={item} onPress={handleOpenBookDetail} />
          )}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={loading} 
              onRefresh={loadBooks}
              colors={["#007AFF"]} 
            />
          }
        />
      )}

      {/* 书籍详情弹窗 */}
      <Modal
        visible={showDetail}
        animationType="slide"
        onRequestClose={handleCloseDetail}
      >
        {selectedBook && (
          <BookDetail
            book={selectedBook}
            onClose={handleCloseDetail}
            onRead={handleOpenReader}
            onDeleted={handleBookDeleted}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  importText: {
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
});

export default HomeScreen;
