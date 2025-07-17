import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Book, Chapter } from '../types';
import { getBooks, saveReadingProgress, updateBook } from '../utils/storage';
import { extractChapters } from '../utils/fileUtils';
import { useSpeech, SpeechStatus } from '../services/SpeechContext';
import ttsService from '../services/ttsService';
import EpubService from '../utils/epubUtils';
import ReaderHeader from '../components/reader/ReaderHeader';
import ChapterListModal from '../components/reader/ChapterListModal';
import ReaderContent from '../components/reader/ReaderContent';
import EpubReaderContent from '../components/reader/EpubReaderContent';
import ReaderControls from '../components/reader/ReaderControls';
import PagedReaderContent from '../components/reader/PagedReaderContent';

const DEFAULT_FONT_SIZE = 18;

const ReaderScreen = () => {
  const { bookId } = useLocalSearchParams<{ bookId: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [showControls, setShowControls] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
  const [isLoading, setIsLoading] = useState(false);
  const [epubBook, setEpubBook] = useState<any>(null);
  const [currentChapterContent, setCurrentChapterContent] = useState<string>('');
  const [isChapterLoading, setIsChapterLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef(null);
  const { status: speechStatus, rate: speechRate, startReading, pauseReading, resumeReading, stopReading, setRate, currentTextPosition } = useSpeech();

  // 加载书籍数据
  const loadBook = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!bookId) {
        Alert.alert('错误', '无效的书籍ID');
        router.back();
        return;
      }
      const books = await getBooks();
      const foundBook = books.find(b => b.id === bookId);
      if (!foundBook) {
        Alert.alert('错误', '无法找到该书籍');
        router.back();
        return;
      }
      setBook(foundBook);
      if (foundBook.isEpub && foundBook.epubUri) {
        // EPUB 加载
        const { epubBook, chapters, initialContent } = await EpubService.loadEpubContent(foundBook.epubUri, foundBook);
        setEpubBook(epubBook);
        setChapters(chapters);
        setCurrentChapter(chapters[0] || null);
        setCurrentChapterContent(initialContent);
      } else {
        // 普通文本
        const bookChapters = extractChapters(foundBook.content);
        setChapters(bookChapters);
        const position = foundBook.currentPosition;
        const currentChap = bookChapters.find(
          chapter => position >= chapter.startPosition && position <= chapter.endPosition
        ) || bookChapters[0] || null;
        setCurrentChapter(currentChap);
        setCurrentChapterContent(currentChap ? foundBook.content.substring(currentChap.startPosition, currentChap.endPosition) : '');
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookId, router]);

  // 加载章节内容
  const loadChapterContent = useCallback(async (chapter: Chapter) => {
    if (!book || !chapter) return;
    setIsChapterLoading(true);
    try {
      if (book.isEpub && epubBook) {
        // 加载当前章节
        const content = await EpubService.loadChapterContent(epubBook, chapter);
        setCurrentChapterContent(content);
        
        // 预加载相邻章节，提高章节切换速度
        const currentIndex = chapters.findIndex(c => c.id === chapter.id);
        
        // 异步预加载下一章内容 - 不阻塞当前章节显示
        setTimeout(() => {
          if (currentIndex < chapters.length - 1) {
            const nextChapter = chapters[currentIndex + 1];
            EpubService.loadChapterContent(epubBook, nextChapter).catch(err => {
              console.log('预加载下一章失败:', err);
            });
          }
        }, 100);
        
        // 异步预加载上一章内容
        setTimeout(() => {
          if (currentIndex > 0) {
            const prevChapter = chapters[currentIndex - 1];
            EpubService.loadChapterContent(epubBook, prevChapter).catch(err => {
              console.log('预加载上一章失败:', err);
            });
          }
        }, 200);
      } else {
        setCurrentChapterContent(book.content.substring(chapter.startPosition, chapter.endPosition));
      }
    } finally {
      setIsChapterLoading(false);
    }
  }, [book, epubBook, chapters]);

  // 章节切换
  const handleChapterSelect = (chapter: Chapter) => {
    setShowChapters(false);
    setCurrentChapter(chapter);
    loadChapterContent(chapter);
    stopReading();
  };
  const handlePrevChapter = () => {
    if (!currentChapter || chapters.length === 0) return;
    const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
    if (currentIndex > 0) {
      const prevChapter = chapters[currentIndex - 1];
      setCurrentChapter(prevChapter);
      loadChapterContent(prevChapter);
    }
  };
  const handleNextChapter = () => {
    if (!currentChapter || chapters.length === 0) return;
    const currentIndex = chapters.findIndex(c => c.id === currentChapter.id);
    if (currentIndex < chapters.length - 1) {
      const nextChapter = chapters[currentIndex + 1];
      setCurrentChapter(nextChapter);
      loadChapterContent(nextChapter);
    }
  };

  // 保存阅读进度
  const saveProgress = useCallback((chapterId: string, page: number) => {
    if (!book) return;
    
    // 保存当前章节ID
    const updatedBook = {
      ...book,
      currentChapterId: chapterId,
      currentPage: page,
      lastReadTime: new Date()
    };
    
    updateBook(updatedBook).catch(err => {
      console.error('保存阅读进度失败:', err);
    });
  }, [book]);

  // 页面变化处理
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (currentChapter) {
      saveProgress(currentChapter.id, page);
    }
  };

  // 控制栏显示/隐藏
  const toggleControls = () => {
    setShowControls(prev => !prev);
  };

  // 控制栏
  const handleFontSizeChange = (size: number) => setFontSize(size);
  const handleSpeak = () => {
    if (!book || !currentChapter) return;
    if (book.isEpub) {
      // EPUB 格式暂不支持语音朗读，给出友好提示
      Alert.alert('提示', 'EPUB电子书暂不支持语音朗读功能');
      return;
    }
    if (speechStatus === SpeechStatus.SPEAKING) {
      pauseReading();
    } else if (speechStatus === SpeechStatus.PAUSED) {
      resumeReading();
    } else {
      startReading(currentChapterContent, 0);
    }
  };

  // 生命周期
  useEffect(() => { loadBook(); return stopReading; }, [loadBook]);
  useEffect(() => { if (currentChapter) loadChapterContent(currentChapter); }, [currentChapter]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9F5E9' }} edges={['top']}>
      {showControls && (
        <ReaderHeader
          title={book?.title || ''}
          onBack={router.back}
          onShowChapters={() => setShowChapters(true)}
        />
      )}
      <PagedReaderContent
        content={currentChapterContent}
        fontSize={fontSize}
        isLoading={isChapterLoading}
        chapters={chapters}
        currentChapter={currentChapter}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
        onContentPress={toggleControls}
        onPageChange={handlePageChange}
        initialPage={book?.currentPage || 0}
      />
      {showControls && (
        <ReaderControls
          fontSize={fontSize}
          chapterTitle={currentChapter?.title || ''}
          progressText={currentPage > 0 ? `第${currentPage + 1}页` : ''}
          speechStatus={speechStatus}
          speechRate={speechRate}
          isEpub={!!book?.isEpub}
          isIosSimulator={ttsService.isRunningOnIosSimulator()}
          onFontSizeChange={handleFontSizeChange}
          onSpeechToggle={handleSpeak}
          onSpeechRateChange={setRate}
        />
      )}
      <ChapterListModal
        visible={showChapters}
        chapters={chapters}
        currentChapterId={currentChapter?.id}
        onClose={() => setShowChapters(false)}
        onSelectChapter={handleChapterSelect}
      />
    </SafeAreaView>
  );
};

export default ReaderScreen;