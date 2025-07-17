import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  Dimensions, 
  TouchableWithoutFeedback,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  useWindowDimensions
} from 'react-native';
import { Chapter } from '../../types';
import ChapterNavigation from './ChapterNavigation';

interface PagedReaderContentProps {
  content: string;
  fontSize: number;
  isLoading: boolean;
  chapters: Chapter[];
  currentChapter: Chapter | null;
  onPrevChapter: () => void;
  onNextChapter: () => void;
  onContentPress?: () => void;
  onPageChange?: (page: number) => void;
  initialPage?: number;
}

const PagedReaderContent: React.FC<PagedReaderContentProps> = ({
  content,
  fontSize,
  isLoading,
  chapters,
  currentChapter,
  onPrevChapter,
  onNextChapter,
  onContentPress,
  onPageChange,
  initialPage = 0
}) => {
  const { width, height } = useWindowDimensions();
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [contentHeight, setContentHeight] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [isCalculating, setIsCalculating] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  
  const hasPrevChapter = currentChapter ? 
    chapters.findIndex(c => c.id === currentChapter.id) > 0 : false;
  
  const hasNextChapter = currentChapter ? 
    chapters.findIndex(c => c.id === currentChapter.id) < chapters.length - 1 : false;

  // 划分内容为页面
  useEffect(() => {
    if (!content || isLoading) return;
    
    setIsCalculating(true);
    
    // 延迟计算以确保布局尺寸已准备好
    const timer = setTimeout(() => {
      divideContentIntoPages();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [content, fontSize, width, height]);

  // 根据文本尺寸计算分页
  const divideContentIntoPages = () => {
    // 获取可用的显示区域高度
    const availableHeight = height - 100; // 减去导航栏等高度
    const availableWidth = width - 32; // 减去左右边距
    
    // 每行可以容纳的字符数（粗略估计）
    const charsPerLine = Math.floor(availableWidth / (fontSize * 0.6));
    
    // 每页可以容纳的行数
    const linesPerPage = Math.floor(availableHeight / (fontSize * 1.6));
    
    // 每页字符数（粗略估计）
    const charsPerPage = charsPerLine * linesPerPage;
    
    // 划分页面
    const totalPages = Math.ceil(content.length / charsPerPage);
    const newPages = [];
    
    for (let i = 0; i < totalPages; i++) {
      const startIndex = i * charsPerPage;
      const endIndex = Math.min(startIndex + charsPerPage, content.length);
      
      // 更智能的分页：尝试在句子或段落结束处断页
      let adjustedEndIndex = endIndex;
      
      if (endIndex < content.length) {
        // 查找向后最近的换行符
        const nextNewline = content.indexOf('\n', endIndex);
        
        // 查找向后最近的句号
        const nextPeriod = content.indexOf('。', endIndex);
        
        // 查找向前最近的换行符
        const prevNewline = content.lastIndexOf('\n', endIndex);
        
        if (nextNewline !== -1 && nextNewline - endIndex < 100) {
          // 如果向后找到换行符且很近，在那里断页
          adjustedEndIndex = nextNewline + 1;
        } else if (nextPeriod !== -1 && nextPeriod - endIndex < 50) {
          // 如果向后找到句号且很近，在那里断页
          adjustedEndIndex = nextPeriod + 1;
        } else if (prevNewline !== -1 && endIndex - prevNewline < 100) {
          // 如果向前找到换行符且很近，在那里断页
          adjustedEndIndex = prevNewline + 1;
        }
      }
      
      newPages.push(content.substring(startIndex, adjustedEndIndex));
    }
    
    setPages(newPages);
    setIsCalculating(false);
    
    // 确保滚动到初始页
    if (flatListRef.current && initialPage > 0 && initialPage < newPages.length) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: initialPage,
          animated: false
        });
      }, 100);
    }
  };

  // 处理滚动事件
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(event.nativeEvent.contentOffset.x / width);
    if (page !== currentPage) {
      setCurrentPage(page);
      if (onPageChange) {
        onPageChange(page);
      }
    }
  };

  // 渲染单页内容
  const renderPage = ({ item }: { item: string }) => (
    <TouchableWithoutFeedback onPress={onContentPress}>
      <View style={[styles.pageContainer, { width, height: height - 60 }]}>
        <Text style={[styles.pageContent, { fontSize }]}>
          {item}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );

  // 处理到达边界
  const handleEndReached = () => {
    if (hasNextChapter) {
      onNextChapter();
    }
  };

  const handleStartReached = () => {
    if (hasPrevChapter) {
      onPrevChapter();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>加载章节中...</Text>
      </View>
    );
  }

  if (isCalculating) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loadingText}>正在排版内容...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(_, index) => `page-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        initialScrollIndex={initialPage}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.1}
      />
      
      <View style={styles.pageIndicator}>
        <Text style={styles.pageNumber}>
          {pages.length > 0 ? `${currentPage + 1} / ${pages.length}` : ''}
        </Text>
      </View>
      
      <ChapterNavigation
        hasPrevChapter={hasPrevChapter}
        hasNextChapter={hasNextChapter}
        onPrevChapter={() => {
          if (currentPage > 0) {
            flatListRef.current?.scrollToIndex({
              index: currentPage - 1,
              animated: true
            });
          } else {
            onPrevChapter();
          }
        }}
        onNextChapter={() => {
          if (currentPage < pages.length - 1) {
            flatListRef.current?.scrollToIndex({
              index: currentPage + 1,
              animated: true
            });
          } else {
            onNextChapter();
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pageContainer: {
    padding: 16,
    justifyContent: 'flex-start',
  },
  pageContent: {
    color: '#333333',
    lineHeight: 28,
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
  pageIndicator: {
    position: 'absolute',
    bottom: 60,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 15,
  },
  pageNumber: {
    color: '#FFF',
    fontSize: 12,
  }
});

export default PagedReaderContent;