import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import Icon from 'react-native-vector-icons/Ionicons';
import { SpeechStatus } from '../../services/SpeechContext';

interface ReaderControlsProps {
  fontSize: number;
  chapterTitle: string;
  progressText: string;
  speechStatus: SpeechStatus;
  speechRate: number;
  isEpub: boolean;
  isIosSimulator: boolean;
  onFontSizeChange: (size: number) => void;
  onSpeechToggle: () => void;
  onSpeechRateChange: (rate: number) => void;
}

const ReaderControls: React.FC<ReaderControlsProps> = ({
  fontSize,
  chapterTitle,
  progressText,
  speechStatus,
  speechRate,
  isEpub,
  isIosSimulator,
  onFontSizeChange,
  onSpeechToggle,
  onSpeechRateChange,
}) => {
  // 朗读状态图标和文本
  const getSpeechButtonText = () => {
    switch (speechStatus) {
      case SpeechStatus.SPEAKING:
        return '暂停';
      case SpeechStatus.PAUSED:
        return '继续';
      default:
        return '朗读';
    }
  };
  
  const getSpeechIcon = () => {
    switch (speechStatus) {
      case SpeechStatus.SPEAKING:
        return "pause";
      case SpeechStatus.PAUSED:
        return "play";
      default:
        return "play";
    }
  };

  return (
    <View style={styles.controls}>
      <View style={styles.progressBar}>
        <Text style={styles.progressText}>
          {chapterTitle || '未知章节'} ({progressText})
        </Text>
      </View>
      
      <View style={styles.fontSizeControl}>
        <TouchableOpacity 
          style={styles.fontButton} 
          onPress={() => onFontSizeChange(Math.max(14, fontSize - 1))}
        >
          <Text style={styles.fontButtonText}>A-</Text>
        </TouchableOpacity>
        <Text style={styles.fontSizeText}>{fontSize}</Text>
        <TouchableOpacity 
          style={styles.fontButton} 
          onPress={() => onFontSizeChange(Math.min(24, fontSize + 1))}
        >
          <Text style={styles.fontButtonText}>A+</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.controlButtons}>
        <TouchableOpacity 
          style={[
            styles.controlButton, 
            (isEpub || isIosSimulator) && styles.disabledButton
          ]} 
          onPress={!isEpub && !isIosSimulator ? onSpeechToggle : undefined}
          disabled={isEpub || isIosSimulator}
        >
          <Icon 
            name={getSpeechIcon()} 
            size={24} 
            color={(isEpub || isIosSimulator) ? "#999" : "#333"} 
          />
          <Text style={[
            styles.buttonText, 
            (isEpub || isIosSimulator) && styles.disabledText
          ]}>
            {isEpub 
              ? '暂不支持' 
              : isIosSimulator
                ? 'iOS模拟器不支持'
                : getSpeechButtonText()
            }
          </Text>
        </TouchableOpacity>
        
        {!isEpub && !isIosSimulator && (
          <View style={styles.rateControl}>
            <Text style={styles.rateLabel}>语速:</Text>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={0.9}
              value={speechRate}
              onValueChange={onSpeechRateChange}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#DDDDDD"
            />
            <Text style={styles.rateValue}>
              {Math.round(speechRate * 10) / 10}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    backgroundColor: '#FFF',
  },
  progressBar: {
    marginBottom: 16,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  fontSizeControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  fontButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 20,
    marginHorizontal: 10,
  },
  fontButtonText: {
    fontSize: 18,
  },
  fontSizeText: {
    fontSize: 18,
  },
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
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
  disabledButton: {
    borderColor: '#999',
  },
  disabledText: {
    color: '#999',
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

export default ReaderControls;