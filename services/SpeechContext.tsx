import React, { createContext, useState, useContext, useEffect, ReactNode, useRef } from 'react';
import ttsService from './ttsService';
import { splitTextForSpeech } from '../utils/textUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// 朗读状态类型
export enum SpeechStatus {
  IDLE = 'idle',
  SPEAKING = 'speaking',
  PAUSED = 'paused'
}

// 上下文类型
interface SpeechContextType {
  status: SpeechStatus;
  rate: number;
  startReading: (text: string, startPosition?: number) => void;
  pauseReading: () => void;
  resumeReading: () => void;
  stopReading: () => void;
  setRate: (rate: number) => void;
  currentTextPosition: number;
}

// 默认值
const defaultContext: SpeechContextType = {
  status: SpeechStatus.IDLE,
  rate: 0.5,
  startReading: () => {},
  pauseReading: () => {},
  resumeReading: () => {},
  stopReading: () => {},
  setRate: () => {},
  currentTextPosition: 0
};

// 创建上下文
const SpeechContext = createContext<SpeechContextType>(defaultContext);

// 存储键
const SPEECH_RATE_KEY = 'ringbook_speech_rate';

interface SpeechProviderProps {
  children: ReactNode;
}

// 提供者组件
export const SpeechProvider: React.FC<SpeechProviderProps> = ({ children }) => {
  const [status, setStatus] = useState<SpeechStatus>(SpeechStatus.IDLE);
  const [rate, setRateState] = useState<number>(0.5);
  const [textChunks, setTextChunks] = useState<string[]>([]);
  const [currentChunkIndex, setCurrentChunkIndex] = useState<number>(0);
  const [currentTextPosition, setCurrentTextPosition] = useState<number>(0);
  const [basePosition, setBasePosition] = useState<number>(0);
  
  // 引用来存储原始文本以便需要时重新开始
  const fullTextRef = useRef<string>('');
  // 引用来跟踪朗读状态和位置
  const speechStateRef = useRef<{
    isPlaying: boolean;
    currentPosition: number;
    fullText: string;
    originalStartPosition: number;
  }>({
    isPlaying: false,
    currentPosition: 0,
    fullText: '',
    originalStartPosition: 0
  });

  // 初始化
  useEffect(() => {
    const init = async () => {
      // 加载保存的语速
      try {
        const savedRate = await AsyncStorage.getItem(SPEECH_RATE_KEY);
        if (savedRate) {
          const parsedRate = parseFloat(savedRate);
          setRateState(parsedRate);
          ttsService.setRate(parsedRate);
        }
      } catch (error) {
        console.error('Error loading speech rate:', error);
      }

      // 设置TTS事件监听
      ttsService.addEventListener('tts-start', handleSpeechStart);
      ttsService.addEventListener('tts-finish', handleSpeechFinish);
      ttsService.addEventListener('tts-cancel', handleSpeechCancel);
      ttsService.addEventListener('tts-error', handleSpeechError);
      ttsService.addEventListener('tts-pause', handleSpeechPause);
      ttsService.addEventListener('tts-resume', handleSpeechResume);
    };

    init();

    // 清理
    return () => {
      ttsService.stop();
      ttsService.removeEventListener('tts-start', handleSpeechStart);
      ttsService.removeEventListener('tts-finish', handleSpeechFinish);
      ttsService.removeEventListener('tts-cancel', handleSpeechCancel);
      ttsService.removeEventListener('tts-error', handleSpeechError);
      ttsService.removeEventListener('tts-pause', handleSpeechPause);
      ttsService.removeEventListener('tts-resume', handleSpeechResume);
    };
  }, []);
  
  // 处理朗读开始
  const handleSpeechStart = () => {
    setStatus(SpeechStatus.SPEAKING);
    speechStateRef.current.isPlaying = true;
  };

  // 处理朗读暂停
  const handleSpeechPause = () => {
    setStatus(SpeechStatus.PAUSED);
    speechStateRef.current.isPlaying = false;
  };

  // 处理朗读恢复
  const handleSpeechResume = () => {
    setStatus(SpeechStatus.SPEAKING);
    speechStateRef.current.isPlaying = true;
  };

  // 处理朗读取消
  const handleSpeechCancel = () => {
    // 在 Web 平台上，我们需要更智能地处理取消事件
    if (Platform.OS === 'web') {
      // 仅在用户明确停止朗读时才设置为 IDLE
      if (speechStateRef.current.isPlaying) {
        // 在取消事件之后，可能是章节已读完成，而不是真正的取消
        // 延迟处理以让其他事件（如完成事件）有机会先触发
        setTimeout(() => {
          // 如果状态未被其他事件处理（如完成事件），则设为 IDLE
          if (speechStateRef.current.isPlaying) {
            setStatus(SpeechStatus.IDLE);
            speechStateRef.current.isPlaying = false;
          }
        }, 200);
      } else {
        setStatus(SpeechStatus.IDLE);
      }
    } else {
      // 非 Web 平台的处理保持不变
      setStatus(SpeechStatus.IDLE);
      speechStateRef.current.isPlaying = false;
    }
  };
  
  // 处理朗读错误
  const handleSpeechError = (error: any) => {
    console.error('语音朗读错误:', error);
    
    // 错误恢复逻辑
    if (status === SpeechStatus.SPEAKING && textChunks.length > 0) {
      // 尝试从下一个片段继续
      if (currentChunkIndex < textChunks.length - 1) {
        setTimeout(() => {
          continueWithNextChunk();
        }, 500);
      } else {
        setStatus(SpeechStatus.IDLE);
        setTextChunks([]);
        setCurrentChunkIndex(0);
      }
    } else {
      setStatus(SpeechStatus.IDLE);
      setTextChunks([]);
      setCurrentChunkIndex(0);
    }
  };

  // 保存语速
  const saveRate = async (newRate: number) => {
    try {
      await AsyncStorage.setItem(SPEECH_RATE_KEY, newRate.toString());
    } catch (error) {
      console.error('Error saving speech rate:', error);
    }
  };

  // 处理朗读完成
  const handleSpeechFinish = () => {
    if (currentChunkIndex < textChunks.length - 1) {
      // 继续朗读下一段
      continueWithNextChunk();
    } else {
      // 全部朗读完毕
      setStatus(SpeechStatus.IDLE);
      setTextChunks([]);
      setCurrentChunkIndex(0);
    }
  };
  
  // 继续朗读下一个文本块
  const continueWithNextChunk = () => {
    const nextIndex = currentChunkIndex + 1;
    
    if (nextIndex < textChunks.length) {
      setCurrentChunkIndex(nextIndex);
      
      // 计算下一个文本块的位置
      const newPosition = calculatePosition(nextIndex);
      setCurrentTextPosition(basePosition + newPosition);
      
      // 更新引用中的状态
      speechStateRef.current.currentPosition = basePosition + newPosition;
      
      // 朗读下一段
      const nextChunk = textChunks[nextIndex];
      if (nextChunk && nextChunk.trim()) {
        // 添加更长的延迟来避免 Web 平台上的连续朗读问题
        const delay = Platform.OS === 'web' ? 300 : 150;
        
        setTimeout(() => {
          if (speechStateRef.current.isPlaying) {
            ttsService.speak(nextChunk);
          }
        }, delay);
      } else {
        // 如果下一段为空，继续前进
        continueWithNextChunk();
      }
    } else {
      // 所有块都已朗读完毕
      setStatus(SpeechStatus.IDLE);
      speechStateRef.current.isPlaying = false;
      setTextChunks([]);
      setCurrentChunkIndex(0);
    }
  };

  // 计算当前文本位置
  const calculatePosition = (chunkIndex: number): number => {
    let position = 0;
    for (let i = 0; i < chunkIndex; i++) {
      position += textChunks[i]?.length || 0;
    }
    return position;
  };

  // 开始朗读
  const startReading = (text: string, startPosition: number = 0) => {
    if (!text || text.trim() === '') return;

    // 停止当前朗读
    ttsService.stop();
    
    // 存储原始文本和起始位置
    fullTextRef.current = text;
    speechStateRef.current = {
      isPlaying: true,
      currentPosition: startPosition,
      fullText: text,
      originalStartPosition: startPosition
    };
    
    // 根据平台调整块大小 - Web 平台使用更小的块以提高响应性
    const chunkSize = Platform.OS === 'web' ? 80 : 200;
    
    // 将文本分割为适合朗读的小块
    const chunks = splitTextForSpeech(text, chunkSize);
    setTextChunks(chunks);
    setBasePosition(startPosition);
    
    // 开始朗读第一段
    setCurrentChunkIndex(0);
    setStatus(SpeechStatus.SPEAKING);
    setCurrentTextPosition(startPosition);
    
    // 添加短延迟确保状态已更新
    setTimeout(() => {
      if (chunks.length > 0) {
        ttsService.speak(chunks[0]);
      }
    }, 50);
  };

  // 暂停朗读
  const pauseReading = () => {
    if (status === SpeechStatus.SPEAKING) {
      ttsService.pause();
      // handleSpeechPause 将在事件触发时调用
    }
  };

  // 恢复朗读
  const resumeReading = () => {
    if (status === SpeechStatus.PAUSED) {
      // 在 Web 平台上，我们可能需要重新开始朗读当前块
      ttsService.resume();
      // handleSpeechResume 将在事件触发时调用
    }
  };

  // 停止朗读
  const stopReading = () => {
    ttsService.stop();
    setStatus(SpeechStatus.IDLE);
    setTextChunks([]);
    setCurrentChunkIndex(0);
    speechStateRef.current.isPlaying = false;
  };

  // 设置朗读语速
  const setRate = (newRate: number) => {
    ttsService.setRate(newRate);
    setRateState(newRate);
    saveRate(newRate);
  };

  // 上下文值
  const contextValue: SpeechContextType = {
    status,
    rate,
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    setRate,
    currentTextPosition
  };

  return (
    <SpeechContext.Provider value={contextValue}>
      {children}
    </SpeechContext.Provider>
  );
};

// 自定义钩子
export const useSpeech = () => useContext(SpeechContext);

export default SpeechContext;
