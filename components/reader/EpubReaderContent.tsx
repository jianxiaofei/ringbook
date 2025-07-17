import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { Chapter } from '../../types';
import ChapterNavigation from './ChapterNavigation';

interface EpubReaderContentProps {
  content: string;
  fontSize: number;
  isLoading: boolean;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onContentPress?: () => void;
}

const EpubReaderContent: React.FC<EpubReaderContentProps> = ({
  content,
  fontSize,
  isLoading,
  chapters,
  currentChapter,
  onPrevChapter,
  onNextChapter,
  onContentPress
}) => {
  const hasPrevChapter = currentChapter ? 
    chapters.findIndex(c => c.id === currentChapter.id) > 0 : false;
  
  const hasNextChapter = currentChapter ? 
    chapters.findIndex(c => c.id === currentChapter.id) < chapters.length - 1 : false;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载EPUB章节中...</Text>
        <Text style={styles.loadingSubText}>首次加载可能需要一点时间，请耐心等待</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={onContentPress}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          {content ? (
            <Text style={[styles.bookContent, { fontSize }]}>
              {content}
            </Text>
          ) : (
            <View style={styles.contentPlaceholder}>
              <Text style={styles.placeholderText}>正在准备内容...</Text>
            </View>
          )}
        </ScrollView>
      </TouchableWithoutFeedback>
      
      <ChapterNavigation
        hasPrevChapter={hasPrevChapter}
        hasNextChapter={hasNextChapter}
        onPrevChapter={onPrevChapter}
        onNextChapter={onNextChapter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    padding: 16,
  },
  bookContent: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F5E9',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  loadingSubText: {
    marginTop: 8,
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    paddingHorizontal: 30,
  },
  contentPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  placeholderText: {
    fontSize: 16,
    color: '#888',
  }
});

export default EpubReaderContent;