import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Chapter } from '../types';
import Icon from 'react-native-vector-icons/Ionicons';

interface ChapterItemProps {
  chapter: Chapter;
  isActive: boolean;
  onPress: (chapter: Chapter) => void;
  index?: number; // 添加索引属性用于显示章节序号
}

const ChapterItem: React.FC<ChapterItemProps> = ({ chapter, isActive, onPress }) => {
  // 处理章节标题，进行必要的清理和截断
  const formatTitle = (title: string) => {
    if (!title) return '未命名章节';
    
    // 移除可能存在的换行符和多余空格
    let formattedTitle = title.replace(/[\r\n]+/g, ' ').trim();
    
    // 如果标题过长，截断显示
    if (formattedTitle.length > 50) {
      return formattedTitle.substring(0, 47) + '...';
    }
    
    return formattedTitle;
  };
  
  // 直接使用 chapter.title
  const displayTitle = formatTitle(chapter.title);
  
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.activeContainer]}
      onPress={() => onPress(chapter)}
    >
      <View style={styles.content}>
        {/* 移除数字徽章显示逻辑 */}
        {/* {displayNumber && (
          <View style={[styles.numberBadge, isActive && styles.activeNumberBadge]}>
            <Text style={[styles.numberText, isActive && styles.activeNumberText]}>
              {displayNumber}
            </Text>
          </View>
        )} */}
        
        <View style={styles.titleContainer}>
          <Text 
            style={[styles.title, isActive && styles.activeTitle]} 
            numberOfLines={2}
          >
            {displayTitle} {/* 直接显示格式化后的标题 */}
          </Text>
        </View>
        
        {isActive && (
          <Icon name="bookmark" size={18} color="#007AFF" style={styles.bookmark} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12, // 调整垂直内边距
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, // 使用更细的分割线
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF', // 默认背景色
  },
  activeContainer: {
    backgroundColor: '#E1F0FF', // 激活状态背景色
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  /* 移除 numberBadge 和 numberText 相关样式 */
  titleContainer: {
    flex: 1,
    marginLeft: 8, // 如果没有数字徽章，添加一些左边距
  },
  title: {
    fontSize: 15, // 稍微调整字体大小
    color: '#333',
    lineHeight: 21, // 调整行高
  },
  activeTitle: {
    color: '#007AFF',
    fontWeight: '600', // 激活状态加粗
  },
  bookmark: {
    marginLeft: 12, // 调整书签图标边距
  },
});

export default ChapterItem;
