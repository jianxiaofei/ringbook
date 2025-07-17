import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { Book } from '../types';
import Icon from 'react-native-vector-icons/Ionicons';

interface BookItemProps {
  book: Book;
  onPress: (book: Book) => void;
}

const BookItem: React.FC<BookItemProps> = ({ book, onPress }) => {
  // 格式化最后阅读时间
  const formatDate = (date?: Date) => {
    if (!date) return '未阅读';
    const d = new Date(date);
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(book)}>
      <View style={styles.coverContainer}>
        {book.coverImage ? (
          <Image source={{ uri: book.coverImage }} style={styles.cover} />
        ) : (
          <View style={styles.defaultCover}>
            <Icon name="book-outline" size={40} color="#666" />
          </View>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {book.title}
        </Text>
        {book.author && (
          <Text style={styles.author} numberOfLines={1}>
            作者: {book.author}
          </Text>
        )}
        <Text style={styles.lastRead}>
          上次阅读: {formatDate(book.lastReadTime)}
        </Text>
      </View>
      
      <Icon name="chevron-forward" size={24} color="#ccc" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  coverContainer: {
    marginRight: 16,
  },
  cover: {
    width: 60,
    height: 80,
    borderRadius: 4,
  },
  defaultCover: {
    width: 60,
    height: 80,
    borderRadius: 4,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  lastRead: {
    fontSize: 12,
    color: '#999',
  },
});

export default BookItem;
