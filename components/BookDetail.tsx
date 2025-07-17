import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Book } from '../types';
import { formatTimestamp } from '../utils/textUtils';
import { deleteBook } from '../utils/storage';

interface BookDetailProps {
  book: Book;
  onClose: () => void;
  onRead: () => void;
  onDeleted: () => void;
}

const BookDetail: React.FC<BookDetailProps> = ({ 
  book, 
  onClose, 
  onRead,
  onDeleted
}) => {
  // 获取阅读进度百分比
  const getProgressPercentage = () => {
    // 增加对 book.content 的检查
    if (!book || !book.content || book.content.length === 0) return '0%';
    return `${Math.round((book.currentPosition / book.content.length) * 100)}%`;
  };

  // 格式化最后阅读时间
  const getLastReadTime = () => {
    if (!book.lastReadTime) return '未阅读';
    return formatTimestamp(new Date(book.lastReadTime).getTime());
  };

  // 处理删除书籍
  const handleDelete = () => {
    Alert.alert(
      '删除书籍',
      `确定要删除《${book.title}》吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        { 
          text: '删除', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBook(book.id);
              onDeleted();
            } catch (error) {
              console.error('Error deleting book:', error);
              Alert.alert('错误', '删除书籍失败，请重试');
            }
          }
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>书籍详情</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.bookInfo}>
          <View style={styles.coverContainer}>
            {book.coverImage ? (
              <Image source={{ uri: book.coverImage }} style={styles.cover} />
            ) : (
              <View style={styles.defaultCover}>
                <Icon name="book-outline" size={60} color="#666" />
              </View>
            )}
          </View>
          
          <View style={styles.details}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            {book.author && (
              <Text style={styles.author}>作者: {book.author}</Text>
            )}
            <Text style={styles.infoItem}>
              阅读进度: {getProgressPercentage()}
            </Text>
            <Text style={styles.infoItem}>
              上次阅读: {getLastReadTime()}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.readButton} onPress={onRead}>
          <Icon name="book-outline" size={20} color="#FFF" />
          <Text style={styles.readButtonText}>
            {book.currentPosition > 0 ? '继续阅读' : '开始阅读'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Icon name="trash-outline" size={20} color="#FF3B30" />
          <Text style={styles.deleteText}>删除书籍</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    padding: 20,
  },
  bookInfo: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  coverContainer: {
    marginRight: 16,
  },
  cover: {
    width: 120,
    height: 160,
    borderRadius: 8,
  },
  defaultCover: {
    width: 120,
    height: 160,
    borderRadius: 8,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  author: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  readButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  readButtonText: {
    fontSize: 16,
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default BookDetail;
