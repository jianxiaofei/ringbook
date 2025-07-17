import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

interface ChapterNavigationProps {
  hasPrevChapter: boolean;
  hasNextChapter: boolean;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

const ChapterNavigation: React.FC<ChapterNavigationProps> = ({
  hasPrevChapter,
  hasNextChapter,
  onPrevChapter,
  onNextChapter,
}) => {
  return (
    <View style={styles.chapterNavigation}>
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onPrevChapter}
        disabled={!hasPrevChapter}
      >
        <Icon 
          name="chevron-back" 
          size={20} 
          color={!hasPrevChapter ? "#ccc" : "#007AFF"} 
        />
        <Text style={[
          styles.navButtonText, 
          {color: !hasPrevChapter ? "#ccc" : "#007AFF"}
        ]}>
          上一章
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.navButton}
        onPress={onNextChapter}
        disabled={!hasNextChapter}
      >
        <Text style={[
          styles.navButtonText, 
          {color: !hasNextChapter ? "#ccc" : "#007AFF"}
        ]}>
          下一章
        </Text>
        <Icon 
          name="chevron-forward" 
          size={20} 
          color={!hasNextChapter ? "#ccc" : "#007AFF"} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  chapterNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButtonText: {
    fontSize: 16,
    marginHorizontal: 8,
  },
});

export default ChapterNavigation;