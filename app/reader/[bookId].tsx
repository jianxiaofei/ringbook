// 确保正确导出
import React from 'react';
import ReaderScreen from '@/screens/ReaderScreen';

// 使用React.memo包装组件以优化性能和避免可能的渲染问题
const BookReaderScreen = React.memo(ReaderScreen);

export default BookReaderScreen;
