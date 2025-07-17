import React, { useRef } from 'react';
import { ScrollView, Text, StyleSheet, ActivityIndicator, View, TouchableWithoutFeedback } from 'react-native';
import { Chapter } from '../../types';
import ChapterNavigation from './ChapterNavigation';

interface ReaderContentProps {
  content: string;
  fontSize: number;
  isLoading: boolean;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onScroll: (event: any) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  scrollViewRef: React.RefObject<ScrollView>;
  onContentPress?: () => void; // 添加点击内容区域的回调函数
}

const ReaderContent: React.FC<ReaderContentProps> = ({
  content,
  fontSize,
  isLoading,
  chapters,
  currentChapter,
  onScroll,
  onPrevChapter,
  onNextChapter,
  scrollViewRef,
  onContentPress,
}) => {
  const hasPrevChapter = currentChapter ? 
    chapters.findIndex(c => c.id === currentChapter.id) > 0 : false;
  
  const hasNextChapter = currentChapter ? 
    chapters.findIndex(c => c.id === currentChapter.id) < chapters.length - 1 : false;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>加载章节中...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <TouchableWithoutFeedback onPress={onContentPress}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          onScroll={onScroll}
          scrollEventThrottle={500}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: 50 }}
        >
          <Text style={[styles.bookContent, { fontSize }]}>
            {content || '无内容'}
          </Text>
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
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
});

export default ReaderContent;