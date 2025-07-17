export interface Book {
  id: string;
  title: string;
  author?: string;
  coverImage?: string;
  filePath: string;
  content: string;
  currentPosition: number; // 当前阅读位置
  lastReadTime?: Date;
  isEpub?: boolean; // 标记是否为EPUB格式
  epubUri?: string; // EPUB文件的URI，用于按需加载
  chapterContents?: {[chapterId: string]: string}; // 存储已加载的章节内容
  currentChapterId?: string; // 当前加载的章节ID
  contentFileUri?: string; // 内容文件的URI，当内容过大时使用
  hasTruncatedContent?: boolean; // 标记内容是否已被截断
  epubChapters?: Chapter[]; // EPUB章节列表
  epubCfi?: string; // EPUB CFI位置标识
}

export interface Chapter {
  id: string;
  title: string;
  startPosition: number;
  endPosition: number;
  href?: string; // EPUB章节的路径引用，用于加载章节内容
}

export interface ReadingProgress {
  bookId: string;
  position: number;
  timestamp: number;
}
