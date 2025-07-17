import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const EmptyBookshelf: React.FC = () => {
  return (
    <View style={styles.container}>
      <Icon name="book-outline" size={80} color="#ccc" />
      <Text style={styles.title}>您的书架还没有书籍</Text>
      <Text style={styles.subtitle}>点击右上角导入按钮添加您喜爱的书籍</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default EmptyBookshelf;
