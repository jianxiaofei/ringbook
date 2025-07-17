import { EventEmitter } from 'events';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// 检测是否为iOS模拟器
const isIosSimulator = () => {
  return (
    Platform.OS === 'ios' && 
    Constants.executionEnvironment === 'simulator'
  );
};

// 使用条件导入和错误处理
let Speech: any = null;
try {
  Speech = require('expo-speech');
} catch (error) {
  console.warn('无法加载 expo-speech 模块，语音功能将不可用', error);
}

class TtsService {
  private static instance: TtsService;
  private isSpeaking: boolean = false;
  private isPaused: boolean = false;
  private currentRate: number = 0.5;
  private eventEmitter: EventEmitter;
  private currentUtteranceId: string | null = null;
  private currentText: string = '';
  private webSynthesis: SpeechSynthesis | null = null;
  private webUtterance: SpeechSynthesisUtterance | null = null;
  private webVoices: SpeechSynthesisVoice[] = [];
  private isModuleAvailable: boolean = true;
  private isIosSimulator: boolean = false;

  private constructor() {
    this.eventEmitter = new EventEmitter();
    this.isIosSimulator = isIosSimulator();
    
    if (this.isIosSimulator) {
      // iOS模拟器环境下显示特定的警告
      console.warn('在iOS模拟器中运行，语音功能不可用。请在真机上测试完整功能。');
      this.isModuleAvailable = false;
      return;
    }
    
    // 检查模块是否可用
    if (!Speech) {
      this.isModuleAvailable = false;
      console.warn('TTS 服务初始化失败：语音模块不可用');
      return;
    }
    
    // 如果是 Web 平台，初始化 Web Speech API
    if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.webSynthesis = window.speechSynthesis;
      
      // 预防性地取消任何可能正在进行的发音
      try {
        this.webSynthesis.cancel();
      } catch (e) {
        console.warn('无法取消初始化时的 Web 语音合成', e);
      }
      
      // 预加载语音
      this.preloadVoices();
    }
    
    this.init();
  }

  public static getInstance(): TtsService {
    if (!TtsService.instance) {
      TtsService.instance = new TtsService();
    }
    return TtsService.instance;
  }

  private init(): void {
    // 检查是否支持 Speech
    this.checkSpeechSupport();
  }
  
  // 预加载语音列表
  private preloadVoices(): void {
    if (!this.webSynthesis) return;
    
    // 立即尝试获取语音
    this.webVoices = this.webSynthesis.getVoices();
    
    // 如果语音列表为空，添加事件监听器等待加载
    if (this.webVoices.length === 0) {
      this.webSynthesis.onvoiceschanged = () => {
        this.webVoices = this.webSynthesis?.getVoices() || [];
        console.log(`Web 平台已加载语音数量: ${this.webVoices.length}`);
      };
    }
  }

  private async checkSpeechSupport(): Promise<void> {
    if (!this.isModuleAvailable) return;
    
    try {
      // 获取可用的语音
      const voices = await Speech.getAvailableVoicesAsync();
      console.log(`可用语音数量: ${voices.length}`);
      
      // 在 Web 平台上，确保我们有语音列表
      if (Platform.OS === 'web' && this.webSynthesis) {
        this.preloadVoices();
      }
    } catch (error) {
      console.warn('语音功能检查失败:', error);
      this.isModuleAvailable = false;
    }
  }

  // 获取中文语音（Web 平台）
  private getChineseVoice(): SpeechSynthesisVoice | null {
    if (!this.webSynthesis) return null;
    
    // 确保我们有最新的语音列表
    const voices = this.webVoices.length ? this.webVoices : this.webSynthesis.getVoices();
    
    // 按优先级寻找中文语音
    // 1. 简体中文
    let chineseVoice = voices.find(v => 
      v.lang === 'zh-CN' || 
      v.lang === 'zh-Hans-CN' || 
      v.lang.startsWith('zh-Hans')
    );
    
    // 2. 任何中文
    if (!chineseVoice) {
      chineseVoice = voices.find(v => 
        v.lang.startsWith('zh') || 
        v.lang.includes('Chinese')
      );
    }
    
    // 3. 返回任何语音
    return chineseVoice || (voices.length > 0 ? voices[0] : null);
  }

  public addEventListener(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.on(event, listener);
  }

  public removeEventListener(event: string, listener: (...args: any[]) => void): void {
    this.eventEmitter.off(event, listener);
  }

  public async speak(text: string): Promise<void> {
    if (!this.isModuleAvailable) {
      console.warn('语音功能不可用');
      this.eventEmitter.emit('tts-error', new Error('语音模块不可用'));
      return;
    }
    
    if (!text || text.trim() === '') {
      console.warn('TTS: 文本为空，无法朗读');
      return;
    }

    try {
      // 存储当前文本
      this.currentText = text;
      
      // 先停止现有朗读
      await this.stop();
      
      // 确保停止后再重新开始，添加短暂延迟
      setTimeout(() => {
        this.isSpeaking = true;
        this.isPaused = false;
        
        // 处理 Web 平台
        if (Platform.OS === 'web' && this.webSynthesis) {
          this.speakWithWebApi(text);
        } else {
          // 非 Web 平台使用 Expo Speech
          this.speakWithExpo(text);
        }
      }, 100);
    } catch (error) {
      console.error('语音合成错误:', error);
      this.isSpeaking = false;
      this.isPaused = false;
      this.eventEmitter.emit('tts-error', error);
    }
  }
  
  // 使用 Web Speech API 朗读
  private speakWithWebApi(text: string): void {
    if (!this.webSynthesis) return;
    
    try {
      // 创建语音合成配置
      this.webUtterance = new SpeechSynthesisUtterance(text);
      
      // 设置语速（Web 平台语速范围是 0.1-10，而 Expo 是 0-1）
      this.webUtterance.rate = this.currentRate + 0.5;
      this.webUtterance.pitch = 1.0;
      this.webUtterance.lang = 'zh-CN';
      
      // 尝试使用中文语音
      const chineseVoice = this.getChineseVoice();
      if (chineseVoice) {
        this.webUtterance.voice = chineseVoice;
      }
      
      // 设置事件处理器
      this.webUtterance.onstart = () => {
        this.eventEmitter.emit('tts-start');
      };
      
      this.webUtterance.onend = () => {
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtteranceId = null;
        this.webUtterance = null;
        this.eventEmitter.emit('tts-finish');
      };
      
      this.webUtterance.onerror = (event) => {
        console.error('Web 语音错误:', event);
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtteranceId = null;
        this.webUtterance = null;
        this.eventEmitter.emit('tts-error', event);
      };
      
      this.webUtterance.onpause = () => {
        this.isPaused = true;
        this.isSpeaking = false;
        this.eventEmitter.emit('tts-pause');
      };
      
      this.webUtterance.onresume = () => {
        this.isPaused = false;
        this.isSpeaking = true;
        this.eventEmitter.emit('tts-resume');
      };
      
      // 开始朗读前确保语音合成服务已准备好
      if (this.webSynthesis.speaking || this.webSynthesis.pending) {
        this.webSynthesis.cancel();
      }
      
      // 开始朗读
      this.webSynthesis.speak(this.webUtterance);
      this.currentUtteranceId = 'web-speech-api';
      this.eventEmitter.emit('tts-start');
    } catch (webError) {
      console.warn('Web Speech API 错误，降级到 Expo Speech:', webError);
      // 如果 Web Speech API 失败，降级到 Expo Speech
      this.speakWithExpo(text);
    }
  }
  
  // 使用 Expo Speech 朗读
  private async speakWithExpo(text: string): Promise<void> {
    try {
      const options = {
        rate: this.currentRate,
        language: 'zh-CN',
        pitch: 1.0,
        onStart: () => {
          this.eventEmitter.emit('tts-start');
        },
        onDone: () => {
          this.isSpeaking = false;
          this.isPaused = false;
          this.currentUtteranceId = null;
          this.eventEmitter.emit('tts-finish');
        },
        onStopped: () => {
          this.isSpeaking = false;
          this.isPaused = false;
          this.currentUtteranceId = null;
          this.eventEmitter.emit('tts-cancel');
        },
        onError: (error: any) => {
          console.error('Speech error:', error);
          this.isSpeaking = false;
          this.isPaused = false;
          this.currentUtteranceId = null;
          this.eventEmitter.emit('tts-error', error);
        }
      };

      const utteranceId = await Speech.speak(text, options);
      this.currentUtteranceId = utteranceId;
    } catch (error) {
      console.error('Expo Speech 错误:', error);
      this.isSpeaking = false;
      this.isPaused = false;
      this.eventEmitter.emit('tts-error', error);
    }
  }

  public pause(): void {
    if (!this.isModuleAvailable) return;
    
    if (this.isSpeaking && !this.isPaused) {
      if (Platform.OS === 'web' && this.webSynthesis) {
        try {
          this.webSynthesis.pause();
          this.isPaused = true;
          this.isSpeaking = false;
          this.eventEmitter.emit('tts-pause');
        } catch (error) {
          console.warn('Web Speech API 暂停失败:', error);
          // 如果暂停失败，尝试停止
          this.stop();
        }
      } else {
        Speech.pause();
        this.isPaused = true;
        this.isSpeaking = false;
        this.eventEmitter.emit('tts-pause');
      }
    }
  }

  public resume(): void {
    if (!this.isModuleAvailable) return;
    
    if (this.isPaused) {
      if (Platform.OS === 'web' && this.webSynthesis) {
        try {
          this.webSynthesis.resume();
          this.isPaused = false;
          this.isSpeaking = true;
          this.eventEmitter.emit('tts-resume');
        } catch (error) {
          console.warn('Web Speech API 恢复失败:', error);
          // 如果恢复失败且有当前文本，尝试重新开始
          if (this.currentText) {
            this.speak(this.currentText);
          }
        }
      } else {
        Speech.resume();
        this.isPaused = false;
        this.isSpeaking = true;
        this.eventEmitter.emit('tts-resume');
      }
    }
  }

  public stop(): void {
    if (!this.isModuleAvailable) return;
    
    // 在 Web 平台上，我们需要更谨慎地处理停止行为
    if (Platform.OS === 'web' && this.webSynthesis) {
      try {
        this.webSynthesis.cancel();
        // 在某些浏览器中，cancel 是异步的，需要确保状态正确更新
        setTimeout(() => {
          this.isSpeaking = false;
          this.isPaused = false;
          this.currentUtteranceId = null;
          this.webUtterance = null;
          this.eventEmitter.emit('tts-cancel');
        }, 50);
      } catch (error) {
        console.warn('Web Speech API 停止失败:', error);
        // 即使出错也要重置状态
        this.isSpeaking = false;
        this.isPaused = false;
        this.currentUtteranceId = null;
        this.webUtterance = null;
        this.eventEmitter.emit('tts-cancel');
      }
    } else {
      // 非 Web 平台使用 Expo Speech
      Speech.stop();
      this.isSpeaking = false;
      this.isPaused = false;
      this.currentUtteranceId = null;
      this.eventEmitter.emit('tts-cancel');
    }
  }

  public setRate(rate: number): void {
    this.currentRate = rate;
  }

  public getRate(): number {
    return this.currentRate;
  }

  public checkSpeaking(): boolean {
    return this.isSpeaking && !this.isPaused;
  }

  public checkPaused(): boolean {
    return this.isPaused;
  }

  // 添加一个方法以检查是否在iOS模拟器上运行
  public isRunningOnIosSimulator(): boolean {
    return this.isIosSimulator;
  }
}

export default TtsService.getInstance();
