/**
 * 将文本分割成适合朗读的段落
 * @param text 需要分割的文本
 * @param maxLength 每段最大长度
 * @returns 分割后的文本数组
 */
export const splitTextForSpeech = (text: string, maxLength: number = 200): string[] => {
  if (!text) return [];
  
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  // 首先按句子分割文本
  const sentenceRegex = /[.。!！?？\n]+/g;
  let match;
  let lastIndex = 0;
  let sentences: {text: string, start: number, end: number}[] = [];

  // 收集所有句子
  while ((match = sentenceRegex.exec(text)) !== null) {
    sentences.push({
      text: text.substring(lastIndex, match.index + match[0].length),
      start: lastIndex,
      end: match.index + match[0].length
    });
    lastIndex = match.index + match[0].length;
  }

  // 如果最后一个句子后面还有内容，也加入
  if (lastIndex < text.length) {
    sentences.push({
      text: text.substring(lastIndex),
      start: lastIndex,
      end: text.length
    });
  }

  // 如果没有找到句子（没有标点），则按固定长度分割
  if (sentences.length === 0) {
    while (startIndex < text.length) {
      let endIndex = Math.min(startIndex + maxLength, text.length);
      chunks.push(text.substring(startIndex, endIndex));
      startIndex = endIndex;
    }
    return chunks;
  }

  // 将句子组合成块，确保每个块不超过最大长度
  let currentChunk = '';
  for (const sentence of sentences) {
    // 如果当前句子长度超过最大长度，需要进一步分割
    if (sentence.text.length > maxLength) {
      // 先添加之前的内容
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // 将长句子按照空格或字符分割
      let sentenceStart = sentence.start;
      while (sentenceStart < sentence.end) {
        let sentenceEnd = Math.min(sentenceStart + maxLength, sentence.end);
        
        // 尝试在空格处断句
        if (sentenceEnd < sentence.end) {
          for (let i = sentenceEnd; i > sentenceStart; i--) {
            if (text[i] === ' ' || text[i] === '，' || text[i] === ',') {
              sentenceEnd = i + 1;
              break;
            }
          }
        }
        
        chunks.push(text.substring(sentenceStart, sentenceEnd));
        sentenceStart = sentenceEnd;
      }
    }
    // 如果加上当前句子超过最大长度，先保存当前块，再开始新块
    else if (currentChunk.length + sentence.text.length > maxLength) {
      chunks.push(currentChunk);
      currentChunk = sentence.text;
    }
    // 否则直接添加到当前块
    else {
      currentChunk += sentence.text;
    }
  }
  
  // 添加最后一个块
  if (currentChunk) {
    chunks.push(currentChunk);
  }
  
  return chunks;
};

/**
 * 格式化章节标题，去除多余空格和换行
 * @param title 原始章节标题
 * @returns 格式化后的标题
 */
export const formatChapterTitle = (title: string): string => {
  return title.replace(/[\r\n\t]+/g, ' ').trim();
};

/**
 * 估算阅读时间（分钟）
 * @param text 文本内容
 * @param wordsPerMinute 每分钟阅读字数
 * @returns 估计阅读时间（分钟）
 */
export const estimateReadingTime = (text: string, wordsPerMinute: number = 200): number => {
  if (!text) return 0;
  
  // 简单计算字数（对中文可能不太准确）
  const wordCount = text.length;
  
  // 计算阅读时间
  return Math.ceil(wordCount / wordsPerMinute);
};

/**
 * 格式化时间戳为人类可读格式
 * @param timestamp 时间戳
 * @returns 格式化的时间字符串
 */
export const formatTimestamp = (timestamp: number): string => {
  const date = new Date(timestamp);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

/**
 * 从文件名中提取标题
 * @param filename 文件名
 * @returns 提取的标题
 */
export const extractTitleFromFilename = (filename: string): string => {
  // 移除文件扩展名
  const nameWithoutExtension = filename.replace(/\.[^/.]+$/, '');
  
  // 移除特殊字符
  return nameWithoutExtension.replace(/[_\-]/g, ' ');
};

/**
 * 计算阅读进度百分比
 * @param currentPosition 当前位置
 * @param totalLength 总长度
 * @returns 格式化的百分比字符串
 */
export const calculateProgressPercentage = (
  currentPosition: number, 
  totalLength: number
): string => {
  if (!totalLength) return '0%';
  
  const percentage = Math.round((currentPosition / totalLength) * 100);
  return `${percentage}%`;
};