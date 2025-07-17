import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  Modal, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  SectionList,
  Dimensions,
  TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { Chapter } from '../../types';
import ChapterItem from '../ChapterItem';

interface ChapterListModalProps {
  visible: boolean;
  chapters: Chapter[];
  currentChapterId?: string;
  onClose: () => void;
  onSelectChapter: (chapter: Chapter) => void;
}

// 章节组的接口
interface ChapterGroup {
  title: string;
  data: Chapter[];
}

const ChapterListModal: React.FC<ChapterListModalProps> = ({
  visible,
  chapters,
  currentChapterId,
  onClose,
  onSelectChapter,
}) => {
  const [groupedChapters, setGroupedChapters] = useState<ChapterGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChapters, setFilteredChapters] = useState<Chapter[]>(chapters);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const sectionListRef = useRef<SectionList>(null);
  
  // 对章节进行分组处理
  useEffect(() => {
    if (!chapters.length) {
      setGroupedChapters([]);
      setFilteredChapters([]);
      return;
    }
    
    // 根据章节数量决定分组策略
    if (chapters.length <= 20) {
      // 章节较少时，不进行分组
      setGroupedChapters([{ title: '目录', data: chapters }]);
    } else {
      // 章节较多时，每20个章节为一组
      const groups: ChapterGroup[] = [];
      for (let i = 0; i < chapters.length; i += 20) {
        const groupChapters = chapters.slice(i, i + 20);
        const startChapter = groupChapters[0].title;
        const endChapter = groupChapters[groupChapters.length - 1].title;
        
        // 获取简洁的章节名称，用于组标题
        const getSimpleTitle = (title: string) => {
          // 提取数字或简短的章节标识
          const match = title.match(/第([一二三四五六七八九十百千万\d]+)[章节]/);
          if (match) return `第${match[1]}章`;
          
          const numMatch = title.match(/^(\d+)/);
          if (numMatch) return numMatch[1];
          
          return title.length > 8 ? title.substring(0, 8) + '...' : title;
        };
        
        groups.push({
          title: `${getSimpleTitle(startChapter)} - ${getSimpleTitle(endChapter)}`,
          data: groupChapters
        });
      }
      setGroupedChapters(groups);
    }
    
    setFilteredChapters(chapters);
  }, [chapters]);
  
  // 处理搜索
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (!text.trim()) {
      setFilteredChapters(chapters);
      return;
    }
    
    const filtered = chapters.filter(chapter => 
      chapter.title.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredChapters(filtered);
  };
  
  // 根据搜索状态确定显示内容
  const renderContent = () => {
    if (searchQuery.trim() || isSearchActive) {
      // 搜索模式 - 使用普通 FlatList
      return (
        <FlatList
          style={styles.chapterList}
          data={filteredChapters}
          renderItem={({ item, index }) => (
            <ChapterItem
              chapter={item}
              isActive={item.id === currentChapterId}
              onPress={onSelectChapter}
              index={index}
            />
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="search-outline" size={32} color="#ccc" />
              <Text style={styles.emptyText}>没有找到相关章节</Text>
            </View>
          }
        />
      );
    } else {
      // 分组模式 - 使用 SectionList
      return (
        <SectionList
          ref={sectionListRef}
          style={styles.chapterList}
          sections={groupedChapters}
          renderItem={({ item, index, section }) => (
            <ChapterItem
              chapter={item}
              isActive={item.id === currentChapterId}
              onPress={onSelectChapter}
              index={section.data.indexOf(item) + groupedChapters.indexOf(section) * 20}
            />
          )}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          initialNumToRender={20}
          stickySectionHeadersEnabled={true}
        />
      );
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top', 'bottom']}>
        <View style={styles.modalHeader}>
          {!isSearchActive ? (
            <>
              <Text style={styles.modalTitle}>目录</Text>
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.searchButton} 
                  onPress={() => setIsSearchActive(true)}
                >
                  <Icon name="search-outline" size={22} color="#333" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose}>
                  <Icon name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.searchContainer}>
              <Icon name="search-outline" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="搜索章节..."
                value={searchQuery}
                onChangeText={handleSearch}
                autoFocus={true}
                clearButtonMode="while-editing"
              />
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setIsSearchActive(false);
                  setSearchQuery('');
                  setFilteredChapters(chapters);
                }}
              >
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <View style={styles.contentContainer}>
          {/* 侧边快速索引 */}
          {!isSearchActive && groupedChapters.length > 1 && (
            <View style={styles.indexBar}>
              {groupedChapters.map((group, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.indexItem}
                  onPress={() => {
                    if (sectionListRef.current) {
                      sectionListRef.current.scrollToLocation({
                        sectionIndex: index,
                        itemIndex: 0,
                        animated: true,
                        viewOffset: 0
                      });
                    }
                  }}
                >
                  <Text style={styles.indexText}>{index + 1}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* 章节列表 */}
          <View style={styles.listContainer}>
            {renderContent()}
          </View>
        </View>
        
        {/* 底部信息栏 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            共 {chapters.length} 章
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9F5E9',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchButton: {
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  indexBar: {
    width: 30,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  indexItem: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 3,
  },
  indexText: {
    fontSize: 10,
    color: '#666',
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
  },
  chapterList: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  sectionHeader: {
    backgroundColor: '#F9F5E9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#DDD',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 36,
    fontSize: 16,
    color: '#333',
  },
  cancelButton: {
    marginLeft: 8,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  cancelText: {
    color: '#007AFF',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: '#999',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  }
});

export default ChapterListModal;