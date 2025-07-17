import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Slider from '@react-native-community/slider';

interface ReadingControlsProps {
  isSpeaking: boolean;
  speechRate: number;
  progressText: string;
  chapterTitle: string;
  onPlay: () => void;
  onRateChange: (rate: number) => void;
}

const ReadingControls: React.FC<ReadingControlsProps> = ({
  isSpeaking,
  speechRate,
  progressText,
  chapterTitle,
  onPlay,
  onRateChange,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <Text style={styles.chapterTitle} numberOfLines={1} ellipsizeMode="tail">
          {chapterTitle || '未知章节'}
        </Text>
        <Text style={styles.progressText}>
          {progressText}
        </Text>
      </View>
      
      <View style={styles.controlButtons}>
        <TouchableOpacity style={styles.playButton} onPress={onPlay}>
          <Icon 
            name={isSpeaking ? "pause" : "play"} 
            size={24} 
            color="#333" 
          />
          <Text style={styles.buttonText}>
            {isSpeaking ? '暂停' : '朗读'}
          </Text>
        </TouchableOpacity>
        
        <View style={styles.rateControl}>
          <Text style={styles.rateLabel}>语速:</Text>
          <Slider
            style={styles.slider}
            minimumValue={0.1}
            maximumValue={0.9}
            value={speechRate}
            onValueChange={onRateChange}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#DDDDDD"
          />
          <Text style={styles.rateValue}>
            {Math.round(speechRate * 10) / 10}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  progressBar: {
    marginBottom: 16,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    width: 100,
    justifyContent: 'center',
  },
  buttonText: {
    marginLeft: 8,
    fontSize: 16,
  },
  rateControl: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  rateLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  rateValue: {
    fontSize: 14,
    color: '#666',
    width: 30,
    textAlign: 'right',
  },
});

export default ReadingControls;
