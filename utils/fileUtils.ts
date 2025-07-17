import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import { Book } from '../types';
import { Platform } from 'react-native';
// 新增：引入epubjs
import ePub from 'epubjs';

// 导入本地文本文件或epub文件
export const importBookFile = async (): Promise<Book | null> => {
  try {
    // 打开文件选择器，增加epub类型
    const result = await DocumentPicker.getDocumentAsync({
      type: ['text/plain', 'application/pdf', 'application/epub+zip', '.epub'],
      copyToCacheDirectory: true,
    });

    // 用户取消了选择
    if (result.canceled) {
      return null;
    }

    const pickedFile = result.assets[0];
    const fileType = pickedFile.mimeType;
    const fileName = pickedFile.name || '';
    const isEpub = fileType === 'application/epub+zip' || fileName.toLowerCase().endsWith('.epub');

    // 处理epub文件 - 增强版，更好地处理移动平台
    if (isEpub) {
      console.log('导入EPUB文件:', fileName);
      
      // Web平台
      if (Platform.OS === 'web') {
        try {
          const response = await fetch(pickedFile.uri);
          const blob = await response.blob();
          
          // 只加载epub的元数据和第一章内容作为预览
          const book = ePub(blob);
          await book.ready;
          
          // 获取元数据
          const metadata = book.packaging?.metadata || {};
          const title = metadata.title || pickedFile.name || 'EPUB书籍';
          const author = metadata.creator || '未知作者';
          
          // 只加载第一章的部分内容作为预览 - 修复render方法错误
          let previewText = '';
          try {
            // 安全获取第一章内容
            if (book.spine && book.spine.items && book.spine.items.length > 0) {
              const firstItem = book.spine.items[0];
              // 直接使用字符串摘要作为预览，避免使用render方法
              previewText = `《${title}》(EPUB格式) - 作者: ${author}\n\n` + 
                            '此EPUB书籍已成功导入，但仅显示预览信息。\n' +
                            '为提高性能，应用将在阅读时按需加载章节内容。';
            } else {
              previewText = '【EPUB解析成功，准备阅读】';
            }
          } catch (e) {
            console.warn('无法加载EPUB预览内容:', e);
            previewText = '【此EPUB书籍导入成功，点击开始阅读】';
          }
          
          return {
            id: Date.now().toString(),
            title: title,
            author: author,
            filePath: pickedFile.uri,
            content: previewText, // 只保存预览内容
            currentPosition: 0,
            lastReadTime: new Date(),
            isEpub: true, // 标记为EPUB格式，供后续处理
            epubUri: pickedFile.uri // 保存原始URI以便后续按需加载
          };
        } catch (err) {
          console.error('Web平台epub解析失败:', err);
          // 提供更友好的错误处理
          return {
            id: Date.now().toString(),
            title: fileName.replace(/\.epub$/i, '') || 'EPUB书籍',
            author: '未知作者',
            filePath: pickedFile.uri,
            content: `该EPUB文件解析出错，但已成功导入。\n\n错误信息: ${err.message}\n\n尝试打开阅读看看能否正常显示。`,
            currentPosition: 0,
            lastReadTime: new Date(),
            isEpub: true,
            epubUri: pickedFile.uri
          };
        }
      } else {
        // 原生平台：轻量级处理，优化提示信息
        try {
          // 检查文件是否可访问
          const fileInfo = await FileSystem.getInfoAsync(pickedFile.uri);
          if (!fileInfo.exists) {
            console.error('EPUB文件不存在:', pickedFile.uri);
            return null;
          }

          // 只存储文件路径，不立即解析整个EPUB
          const newBook: Book = {
            id: Date.now().toString(),
            title: fileName.replace(/\.epub$/i, '') || 'EPUB书籍',
            author: '未知作者',
            filePath: pickedFile.uri,
            content: `《${fileName.replace(/\.epub$/i, '')}》(EPUB格式)\n\n此电子书已成功导入，点击阅读按钮开始阅读。\n\n提示：EPUB解析功能仍在改进中，如遇到显示问题，请尝试使用文本格式的书籍。`, 
            currentPosition: 0,
            lastReadTime: new Date(),
            isEpub: true,
            epubUri: pickedFile.uri
          };
          
          return newBook;
        } catch (err) {
          console.error('原生平台epub处理失败:', err);
          // 即使出错也尝试导入
          return {
            id: Date.now().toString(),
            title: fileName.replace(/\.epub$/i, '') || 'EPUB书籍',
            author: '未知作者',
            filePath: pickedFile.uri,
            content: `该EPUB文件处理过程中遇到问题，但已尝试导入。\n\n点击打开看看能否正常阅读。`,
            currentPosition: 0,
            lastReadTime: new Date(),
            isEpub: true,
            epubUri: pickedFile.uri
          };
        }
      }
    }

    if (Platform.OS === 'web') {
      // Web 平台特定的文件读取逻辑
      try {
        // 在 Web 上，我们需要使用 fetch 来读取文件内容
        const response = await fetch(pickedFile.uri);
        const fileContent = await response.text();
        
        // 创建书籍对象
        const newBook: Book = {
          id: Date.now().toString(),
          title: pickedFile.name || 'Unknown Book',
          filePath: pickedFile.uri,
          content: fileContent,
          currentPosition: 0,
          lastReadTime: new Date()
        };
        
        return newBook;
      } catch (error) {
        console.error('Web 平台读取文件失败:', error);
        // 对于 Web 平台，如果直接读取失败，尝试使用 FileReader API
        if (pickedFile.file && typeof FileReader !== 'undefined') {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target && typeof e.target.result === 'string') {
                const newBook: Book = {
                  id: Date.now().toString(),
                  title: pickedFile.name || 'Unknown Book',
                  filePath: pickedFile.uri,
                  content: e.target.result,
                  currentPosition: 0,
                  lastReadTime: new Date()
                };
                resolve(newBook);
              } else {
                reject(new Error('读取文件内容失败'));
              }
            };
            reader.onerror = () => reject(new Error('FileReader 错误'));
            // 类型断言为Blob
            reader.readAsText(pickedFile.file as Blob);
          });
        }
      }
    } else {
      // 非 Web 平台（iOS, Android）
      // 如果是文本文件，直接读取
      if (fileType === 'text/plain') {
        const fileContent = await FileSystem.readAsStringAsync(pickedFile.uri);
        
        // 创建书籍对象
        const newBook: Book = {
          id: Date.now().toString(),
          title: pickedFile.name || 'Unknown Book',
          filePath: pickedFile.uri,
          content: fileContent,
          currentPosition: 0,
          lastReadTime: new Date()
        };
        
        return newBook;
      }
      // PDF文件处理 (简化版，实际应使用PDF解析库)
      else if (fileType === 'application/pdf') {
        // 这里应该添加PDF解析的代码
        // 简化处理，仅保存文件路径
        const newBook: Book = {
          id: Date.now().toString(),
          title: pickedFile.name || 'Unknown PDF Book',
          filePath: pickedFile.uri,
          content: "PDF内容需要专门的解析器处理", // 实际场景中应该解析PDF内容
          currentPosition: 0,
          lastReadTime: new Date()
        };
        
        return newBook;
      }
    }
    
    return null;
  } catch (error) {
    console.error('文件选择错误:', error);
    return null;
  }
};

// 提取章节信息的增强实现
export const extractChapters = (content: string) => {
  // 更全面的章节标题匹配模式
  const chapterPatterns = [
    // 常规数字章节 (第1章, 第一章, 第1节 等)
    /第[一二三四五六七八九十百千万\d]+[章节回集卷][^。\n]{0,50}[\r\n]/g,
    
    // 卷/章节格式 (第一卷 xxxx章)
    /第[一二三四五六七八九十百千万\d]+[卷][^。\n]{0,50}[\r\n]/g,
    
    // 章节名 (章节一、章节1、Chapter 1 等)
    /[章节][一二三四五六七八九十百千万\d]+[：:\s][^。\n]{0,50}[\r\n]/g,
    
    // 纯数字格式 (1. xxx、1、xxx 等)
    /^[\d]+[、.．：:\s][^。\n]{0,50}[\r\n]/gm,
    
    // 中文数字序号 (一、xxx)
    /^[一二三四五六七八九十][、.．：:\s][^。\n]{0,50}[\r\n]/gm,
    
    // 特殊标记章节 (*** 等)
    /^[*=\-]{3,}[^。\n]{0,50}[\r\n]/gm,
    
    // 字数较少的行，可能是短标题
    /^.{1,20}$[\r\n]/gm
  ];
  
  // 收集所有可能的章节信息
  let potentialChapters = [];
  
  // 对每种模式进行匹配
  for (const pattern of chapterPatterns) {
    let match;
    // 重置正则表达式的lastIndex
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(content)) !== null) {
      // 确保章节标题不是太长的段落
      if (match[0].length < 100) {
        potentialChapters.push({
          title: match[0].trim(),
          position: match.index,
          length: match[0].length
        });
      }
    }
  }
  
  // 按位置排序
  potentialChapters.sort((a, b) => a.position - b.position);
  
  // 合并重叠的章节标记
  let filteredChapters = [];
  for (let i = 0; i < potentialChapters.length; i++) {
    const current = potentialChapters[i];
    
    // 跳过已被合并的章节
    if (current.merged) continue;
    
    // 检查是否与下一个章节重叠
    let overlapped = false;
    for (let j = i + 1; j < potentialChapters.length; j++) {
      const next = potentialChapters[j];
      if (!next.merged && 
          next.position > current.position && 
          next.position < current.position + current.length + 10) {
        next.merged = true;
        overlapped = true;
      }
    }
    
    if (!overlapped) {
      filteredChapters.push(current);
    }
  }
  
  // 最少需要有1000字符才考虑为有效章节
  const MIN_CHAPTER_LENGTH = 1000;
  
  // 过滤无效章节 (位置太接近的可能不是真正的章节)
  let validChapters = [];
  for (let i = 0; i < filteredChapters.length; i++) {
    const current = filteredChapters[i];
    const next = filteredChapters[i + 1];
    
    // 检查章节长度
    if (next && next.position - current.position >= MIN_CHAPTER_LENGTH) {
      validChapters.push(current);
    } else if (!next && content.length - current.position >= MIN_CHAPTER_LENGTH) {
      // 最后一个章节
      validChapters.push(current);
    }
  }
  
  // 如果没有找到有效章节，尝试按段落分割
  if (validChapters.length === 0) {
    // 如果内容少于5000字符，则视为单章节
    if (content.length < 5000) {
      return [{
        id: 'chapter-0',
        title: '全文',
        startPosition: 0,
        endPosition: content.length
      }];
    }
    
    // 否则尝试每20段落作为一章
    const paragraphs = content.split(/\n\s*\n/);
    const chunkSize = 20;
    
    for (let i = 0; i < paragraphs.length; i += chunkSize) {
      if (i === 0) continue; // 跳过第一段
      
      const paragraph = paragraphs[i];
      const position = content.indexOf(paragraph);
      
      if (position > 0) {
        validChapters.push({
          title: `第${Math.floor(i/chunkSize) + 1}章`,
          position: position
        });
      }
    }
  }
  
  // 转换为最终格式
  let chapters = validChapters.map((chapter, index) => ({
    id: `chapter-${index}`,
    title: chapter.title,
    startPosition: chapter.position,
    endPosition: content.length // 默认到文末，后续会更新
  }));
  
  // 设置每章的结束位置
  for (let i = 0; i < chapters.length - 1; i++) {
    chapters[i].endPosition = chapters[i + 1].startPosition - 1;
  }
  
  // 如果仍然没有章节，创建一个单一章节
  if (chapters.length === 0) {
    chapters.push({
      id: 'chapter-0',
      title: '全文',
      startPosition: 0,
      endPosition: content.length
    });
  }
  
  return chapters;
};
