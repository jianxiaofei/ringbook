import ePub from 'epubjs';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Book, Chapter } from '../types';
import JSZip from 'jszip';

// Helper function to clean potential chapter titles
const cleanTitle = (title: string | null | undefined): string => {
  if (!title) return '';
  let cleaned = title.trim();
  
  // 首先移除文件扩展名
  cleaned = cleaned.replace(/\.(x?html|htm|xhtml)$/i, '');
  
  // 判断是否已经是格式化好的标题（如"第X卷"或"第X章"）
  if (/^(第|卷|册|部|篇)\s*[一二三四五六七八九十百千万\d]+\s*(章|节|卷|部|篇|话|回)/i.test(cleaned)) {
    // 已经是格式化好的标题，保留原样
    return cleaned;
  }
  
  // 处理卷号和章节号
  const volumeMatch = cleaned.match(/(第|卷|册)\s*([一二三四五六七八九十百千万\d]+)\s*(卷|册|部|篇)/i);
  if (volumeMatch) {
    // 提取卷号部分，保留"第X卷"格式
    const volumeNumber = volumeMatch[2];
    const volumeType = volumeMatch[3] || '卷';
    // 移除卷号部分，保留剩余内容作为标题
    let remainingTitle = cleaned.replace(/(第|卷|册)\s*([一二三四五六七八九十百千万\d]+)\s*(卷|册|部|篇)/i, '').trim();
    
    // 替换文件名中常见的分隔符为空格
    remainingTitle = remainingTitle.replace(/[_\-]/g, ' ').trim();
    
    // 如果剩余标题以特殊字符开头，移除它们
    remainingTitle = remainingTitle.replace(/^[\s\._\-:：]+/, '');
    
    // 如果提取到了标题，则组合返回，否则只返回卷号信息
    if (remainingTitle && remainingTitle.length > 1) {
      return `第${volumeNumber}${volumeType} ${remainingTitle}`;
    } else {
      return `第${volumeNumber}${volumeType}`;
    }
  }
  
  // 处理普通章节标题（包括英文"Chapter"格式）
  const chapterMatch = cleaned.match(/(chapter|第|章)\s*([一二三四五六七八九十百千万\d]+)\s*(章|节)?/i);
  if (chapterMatch) {
    const chapterNumber = chapterMatch[2];
    let remainingTitle = cleaned.replace(/(chapter|第|章)\s*([一二三四五六七八九十百千万\d]+)\s*(章|节)?/i, '').trim();
    
    // 替换下划线和连字符为空格
    remainingTitle = remainingTitle.replace(/[_\-]/g, ' ').trim();
    
    // 如果剩余标题以特殊字符开头，移除它们
    remainingTitle = remainingTitle.replace(/^[\s\._\-:：]+/, '');
    
    // 如果提取到了标题，则组合返回，否则只返回章节号信息
    if (remainingTitle && remainingTitle.length > 1) {
      return `第${chapterNumber}章 ${remainingTitle}`;
    } else {
      return `第${chapterNumber}章`;
    }
  }
  
  // 处理纯数字文件名，如"001"、"01"等
  const numericMatch = cleaned.match(/^(\d+)$/);
  if (numericMatch) {
    return `第${parseInt(numericMatch[1], 10)}章`;
  }
  
  // 处理common文件命名格式，如"001-章节标题"或"01_章节标题"
  const commonFormatMatch = cleaned.match(/^(\d+)[\s\._\-:：]+(.+)$/);
  if (commonFormatMatch) {
    const chapterNumber = commonFormatMatch[1];
    let chapterTitle = commonFormatMatch[2].trim();
    
    // 如果标题很短或只包含无意义文字，则简化为章节号
    if (chapterTitle.length < 2 || /^(chapter|section|part|chap|ch)$/i.test(chapterTitle)) {
      return `第${parseInt(chapterNumber, 10)}章`;
    }
    
    return `第${parseInt(chapterNumber, 10)}章 ${chapterTitle}`;
  }
  
  // 替换下划线/连字符为空格
  cleaned = cleaned.replace(/[_\-]/g, ' ');
  
  // 移除HTML实体
  cleaned = cleaned.replace(/&[a-z]+;/gi, ' ');
  
  // 移除多余空格
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned.trim();
};

// Helper function to extract title from HTML content
const extractTitleFromHtml = (htmlContent: string): string => {
  let title = '';
  // Try H1 first
  const h1Match = htmlContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    title = h1Match[1];
  } else {
    // Try title tag next
    const titleMatch = htmlContent.match(/<title[^>]*>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1];
    }
  }
  // Clean the extracted title (remove tags, entities, extra spaces)
  return cleanTitle(title.replace(/<[^>]*>/g, ''));
};


/**
 * EPUB处理服务 - 处理EPUB文件的加载、解析和章节提取
 */
export class EpubService {
  // 加载EPUB内容
  static async loadEpubContent(epubUri: string, book: Book | null): Promise<{
    epubBook: any;
    chapters: Chapter[];
    initialContent: string;
  }> {
    console.log('开始加载EPUB内容，URI:', epubUri);

    if (Platform.OS === 'web') {
      try {
        // ... (Web platform logic remains largely the same, focusing on TOC first) ...
        await epubBook.ready;
        console.log('EPUB书籍准备就绪');

        // 获取目录 - 进行兼容性处理
        let toc = [];
        try {
          toc = await epubBook.navigation.toc;
          console.log('EPUB目录获取成功:', toc.length);
        } catch (error) {
          console.error('获取目录失败:', error);
          toc = [];
        }

        let epubChapters: Chapter[] = [];

        // 如果目录为空，尝试从spine获取
        if (!Array.isArray(toc) || toc.length === 0) {
          console.log('使用spine创建目录');
          try {
            if (epubBook.spine && epubBook.spine.items && epubBook.spine.items.length > 0) {
              epubChapters = epubBook.spine.items.map((item: any, index: number) => {
                // 改进：从文件名提取标题
                const filename = item.href.split('/').pop() || '';
                let title = cleanTitle(filename); // Use cleaner function

                // 如果清理后标题无效，则使用最终回退
                if (!title || /^\d+$/.test(title)) { // Check if title is just numbers after cleaning
                  title = `章节 ${index + 1}`;
                }

                return {
                  id: `epub-chapter-${index}`,
                  title: title,
                  href: item.href,
                  startPosition: index,
                  endPosition: index + 1
                };
              });
              console.log(`从spine创建了${epubChapters.length}个章节`);
            } else {
              // 创建单一章节
              epubChapters = [{
                id: 'epub-chapter-0',
                title: '全书内容', // Default title if no spine
                href: '',
                startPosition: 0,
                endPosition: 1
              }];
            }
          } catch (err) {
            console.error('spine处理错误:', err);
            // 创建默认章节
            epubChapters = [{
              id: 'epub-chapter-0',
              title: '全书内容', // Default title on error
              href: '',
              startPosition: 0,
              endPosition: 1
            }];
          }
        } else {
          // 使用正常目录 - 优先使用 label 或 title
          epubChapters = toc.map((item: any, index: number) => {
            let title = cleanTitle(item.label || item.title); // Clean the label/title
            // 如果清理后标题无效，则使用最终回退
            if (!title) {
              title = `章节 ${index + 1}`;
            }
            return {
              id: `epub-chapter-${index}`,
              title: title,
              href: item.href,
              startPosition: index,
              endPosition: index + 1
            };
          });
          console.log(`解析出${epubChapters.length}个EPUB章节，使用原始章节标题`);
        }

        // ... (Rest of web platform logic for loading initial content) ...

      } catch (e) {
        console.error('Web平台加载EPUB失败:', e);
        throw new Error(`加载EPUB失败: ${e.message}`);
      }
    } else {
      // 改进的原生平台处理 (JSZip path)
      try {
        // ... (Check file existence and read data) ...
        const epubData = await FileSystem.readAsStringAsync(epubUri, {
          encoding: FileSystem.EncodingType.Base64
        });

        // 尝试通过简单方法解析EPUB内容 (JSZip)
        try {
          const binary = atob(epubData);
          const zip = new JSZip();
          const result = await zip.loadAsync(binary);

          // 查找 content.opf 文件路径
          let contentOpfPath = '';
          
          // 首先检查 META-INF/container.xml 文件
          if (result.files['META-INF/container.xml']) {
            const containerContent = await result.files['META-INF/container.xml'].async('text');
            const rootfileMatch = containerContent.match(/rootfile\s+[^>]*full-path=["']([^"']*)["']/i);
            if (rootfileMatch && rootfileMatch[1]) {
              contentOpfPath = rootfileMatch[1];
              console.log('找到 content.opf 路径:', contentOpfPath);
            }
          }
          
          // 如果没有找到，尝试直接在根目录或常见位置查找
          if (!contentOpfPath) {
            const commonPaths = ['content.opf', 'OEBPS/content.opf', 'OPS/content.opf'];
            for (const path of commonPaths) {
              if (result.files[path]) {
                contentOpfPath = path;
                console.log('在常见位置找到 content.opf:', contentOpfPath);
                break;
              }
            }
          }
          
          // 如果仍未找到，尝试搜索所有文件
          if (!contentOpfPath) {
            for (const filename in result.files) {
              if (filename.endsWith('.opf') && !result.files[filename].dir) {
                contentOpfPath = filename;
                console.log('通过搜索找到 .opf 文件:', contentOpfPath);
                break;
              }
            }
          }

          let chapters: Chapter[] = [];
          let textContent = '';
          let bookTitle = book?.title || '未知书名';
          let bookAuthor = book?.author || '未知作者';

          if (contentOpfPath && result.files[contentOpfPath]) {
            const opfContent = await result.files[contentOpfPath].async('text');

            // 提取书籍基本信息
            const titleMatch = opfContent.match(/<dc:title[^>]*>(.*?)<\/dc:title>/);
            const authorMatch = opfContent.match(/<dc:creator[^>]*>(.*?)<\/dc:creator>/);
            bookTitle = titleMatch ? cleanTitle(titleMatch[1]) : bookTitle;
            bookAuthor = authorMatch ? cleanTitle(authorMatch[1]) : bookAuthor;

            // 从opf文件中提取manifest项和spine项
            // 1. 构建ID到href的映射
            const idToHref = new Map<string, string>();
            const itemMatches = opfContent.matchAll(/<item[^>]*id=["']([^"']*)["'][^>]*href=["']([^"']*)["'][^>]*\/>/g);
            for (const match of Array.from(itemMatches)) {
              if (match[1] && match[2]) {
                idToHref.set(match[1], match[2]);
              }
            }

            // 2. 从spine中提取itemref顺序
            const itemRefMatches = Array.from(opfContent.matchAll(/<itemref[^>]*idref=["']([^"']*)["'][^>]*\/?>/g));

            // 根据spine顺序创建章节
            const contentFolderPath = contentOpfPath.includes('/')
              ? contentOpfPath.substring(0, contentOpfPath.lastIndexOf('/') + 1)
              : '';

            for (let i = 0; i < itemRefMatches.length; i++) {
              const idRef = itemRefMatches[i][1];
              if (idToHref.has(idRef)) {
                const href = idToHref.get(idRef);
                const fullPath = contentFolderPath + href;

                // 改进：尝试从HTML内容提取标题，然后从文件名提取，最后回退
                let title = '';
                try {
                  if (result.files[fullPath]) {
                    const chapterHtml = await result.files[fullPath].async('text');
                    title = extractTitleFromHtml(chapterHtml); // Use helper
                  }
                } catch (htmlErr) {
                  console.warn(`无法读取或解析章节HTML (${fullPath}) 来提取标题:`, htmlErr);
                }

                // 如果从HTML提取失败，尝试从文件名提取
                if (!title) {
                  const filename = href.split('/').pop() || '';
                  title = cleanTitle(filename);
                }

                // 尝试从文件名中提取更有意义的标题
                if (!title) {
                  const filename = href.split('/').pop() || '';
                  // 移除扩展名
                  const baseFilename = filename.replace(/\.(x?html|htm|xhtml)$/i, '');

                  // 1. 尝试匹配 "Chapter N", "第 N 章" 等模式 (不区分大小写)
                  const chapterMatch = baseFilename.match(/(?:chapter|chap|ch|第)\s*(\d+)/i);
                  if (chapterMatch && chapterMatch[1]) {
                    title = `第${chapterMatch[1]}章`;
                  } else {
                    // 2. 尝试匹配纯数字文件名 (如 01, 002)
                    const numMatch = baseFilename.match(/^(\d+)$/);
                    if (numMatch && numMatch[1]) {
                      // 移除前导零并转换为数字，再格式化
                      const num = parseInt(numMatch[1], 10);
                      title = `第${num}章`;
                    } else {
                      // 3. 替换下划线和连字符为空格作为备选
                      title = baseFilename.replace(/[_\-]/g, ' ').trim();
                      // 进一步清理，移除常见的无意义前缀/后缀
                      title = title.replace(/^(chapter|section|part|chap|ch)\s*/i, '').trim();
                      // 如果清理后只剩下数字，也格式化
                      if (/^\d+$/.test(title)) {
                        title = `第${parseInt(title, 10)}章`;
                      }
                    }
                  }
                }

                // 4. 如果所有尝试都失败或结果太短，使用默认值
                if (!title || title.length < 1) { // 允许单个汉字标题
                  title = `章节 ${i + 1}`; // 使用章节索引作为后备
                }

                chapters.push({
                  id: `epub-chapter-${i}`,
                  title: title,
                  href: fullPath, // Use full path relative to zip root
                  startPosition: i,
                  endPosition: i + 1
                });

                // 提取第一章内容作为初始内容
                if (i === 0 && result.files[fullPath]) {
                  try {
                    const firstChapterContent = await result.files[fullPath].async('text');
                    // 简单移除HTML标签获取文本内容
                    textContent = firstChapterContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                  } catch (readErr) {
                     console.warn(`无法读取第一章内容 (${fullPath}):`, readErr);
                     textContent = '无法加载初始章节内容';
                  }
                }
              }
            }
          }

          // 如果通过OPF spine未能提取章节，尝试遍历HTML文件 (增强的回退)
          if (chapters.length === 0) {
             console.log('OPF spine解析章节失败，尝试遍历HTML文件');
             let potentialChapters: { path: string; title: string; content?: string }[] = [];
             for (const filename in result.files) {
               if ((filename.endsWith('.html') || filename.endsWith('.xhtml') || filename.endsWith('.htm'))
                   && !result.files[filename].dir) {
                 try {
                   const content = await result.files[filename].async('text');
                   let chapterTitle = extractTitleFromHtml(content); // Use helper

                   // 如果从HTML提取失败，尝试从文件名提取
                   if (!chapterTitle) {
                     const filePart = filename.split('/').pop() || '';
                     chapterTitle = cleanTitle(filePart);
                   }

                   // 收集潜在章节信息
                   potentialChapters.push({ path: filename, title: chapterTitle || '', content: content });

                 } catch (readErr) {
                   console.warn(`读取或解析文件 ${filename} 失败:`, readErr);
                 }
               }
             }

             // 尝试根据文件名排序（可能不准确，但比无序好）
             potentialChapters.sort((a, b) => a.path.localeCompare(b.path));

             // 创建章节列表
             chapters = potentialChapters.map((chapInfo, index) => {
               let finalTitle = chapInfo.title;
               // 如果标题无效，使用最终回退
               if (!finalTitle || /^\d+$/.test(finalTitle)) {
                 finalTitle = `章节 ${index + 1}`;
               }
               // 提取第一章内容
               if (index === 0 && chapInfo.content) {
                  textContent = chapInfo.content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
               }
               return {
                 id: `epub-chapter-${index}`,
                 title: finalTitle,
                 href: chapInfo.path,
                 startPosition: index,
                 endPosition: index + 1
               };
             });

             if (chapters.length > 0 && !textContent) {
                textContent = "章节内容将在选择时加载"; // Provide placeholder if first chapter content failed
             }
          }


          // 如果仍然没有章节，添加一个默认章节
          if (chapters.length === 0) {
            console.warn('无法从EPUB中提取任何章节结构');
            chapters.push({
              id: 'epub-info',
              title: '书籍信息',
              href: '', // No specific content file
              startPosition: 0,
              endPosition: 1
            });
            textContent = `EPUB文件: ${bookTitle}\n作者: ${bookAuthor}\n\n未能解析章节列表。`;
          }

          // 返回结果
          return {
            // 传递原始数据和zip实例可能用于后续章节加载
            epubBook: {
              rawData: epubData,
              zipInstance: result, // Pass the JSZip instance
              title: bookTitle,
              author: bookAuthor,
              contentMap: {}, // Initialize cache
              hrefToPath: {} // Initialize href to path cache
            },
            chapters: chapters,
            initialContent: textContent || '无法加载初始内容'
          };

        } catch (parseError) {
          console.error('EPUB解析错误 (JSZip path):', parseError);
          // Fallback to basic info if JSZip parsing fails
        }

        // ... (Fallback logic if JSZip parsing fails, providing basic info) ...

      } catch (e) {
        console.error('原生平台读取EPUB文件失败:', e);
        throw new Error(`原生平台加载EPUB失败: ${e.message}`);
      }
    }
  }

  // 加载特定章节内容 - 调整以使用 zipInstance 和 href
  static async loadChapterContent(epubBook: any, chapter: Chapter): Promise<string> {
    if (!epubBook || !chapter) {
      return '无法加载章节内容 (参数无效)';
    }

    try {
      console.log('正在加载EPUB章节，id:', chapter.id, 'href:', chapter.href);

      // 检查缓存
      if (epubBook.contentMap && epubBook.contentMap[chapter.id]) {
        console.log('使用缓存的章节内容');
        return epubBook.contentMap[chapter.id];
      }

      // 处理特殊章节ID
      if (chapter.id === 'epub-info' || !chapter.href) {
         return epubBook.initialContent || `书籍信息: ${epubBook.title || '未知'}`; // Return initial content or basic info
      }

      if (Platform.OS === 'web') {
        // Web平台使用 epubjs 的 section 方法
        if (!epubBook.section) { // Check if it's an epubjs object
             console.error('Web平台加载章节错误：epubBook对象无效');
             return '加载章节出错 (Web)';
        }
        const section = epubBook.section(chapter.href);
        if (section) {
          const text = await section.text();
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = text;
          const content = tempDiv.textContent || tempDiv.innerText || text;
          // 缓存
          if (!epubBook.contentMap) epubBook.contentMap = {};
          epubBook.contentMap[chapter.id] = content;
          return content;
        } else {
           console.warn(`无法加载Web章节 section: ${chapter.href}`);
           return '无法加载此章节内容 (Web)';
        }
      } else {
        // 原生平台使用缓存的 zipInstance
        if (!epubBook.zipInstance || !epubBook.zipInstance.files) {
           console.error('原生平台加载章节错误：zipInstance无效');
           return '加载章节出错 (Native)';
        }
        const zip = epubBook.zipInstance as JSZip;
        const targetPath = chapter.href; // href should now be the full path within the zip

        if (zip.files[targetPath]) {
          try {
            const file = zip.files[targetPath];
            const content = await file.async('text');

            // 简化的HTML处理：提取文本内容
            const extractedText = content
              .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // 移除scripts
              .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')   // 移除styles
              .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')      // 移除head
              .replace(/<[^>]*>/g, ' ')                                          // 移除其他标签
              .replace(/\s+/g, ' ')                                              // 合并空格
              .trim();

            // 缓存章节内容
            if (!epubBook.contentMap) epubBook.contentMap = {};
            epubBook.contentMap[chapter.id] = extractedText;

            return extractedText || '章节内容为空';
          } catch (error) {
            console.error(`解析章节内容失败 (${targetPath}):`, error);
            return `解析章节 ${chapter.title} 时出错。`;
          }
        } else {
          console.warn(`在zip文件中找不到章节路径: ${targetPath}`);
          // 尝试查找相似路径（如果需要，但会增加复杂性）
          return `无法找到章节 ${chapter.title} 的内容文件。`;
        }
      }
    } catch (error) {
      console.error('加载EPUB章节失败:', error);
      return `加载章节 ${chapter.title} 时遇到问题。`;
    }
  }
}

export default EpubService;