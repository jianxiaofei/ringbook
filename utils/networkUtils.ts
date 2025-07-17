import { Alert } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

/**
 * 检查网络连接状态
 * @returns Promise<boolean> 网络是否连接
 */
export const checkNetworkConnection = async (): Promise<boolean> => {
  const netInfo = await NetInfo.fetch();
  return netInfo.isConnected ?? false;
};

/**
 * 监听网络状态变化
 * @param onConnected 连接网络时的回调
 * @param onDisconnected 断开网络时的回调
 * @returns 取消监听的函数
 */
export const listenNetworkChanges = (
  onConnected?: () => void,
  onDisconnected?: () => void
): (() => void) => {
  return NetInfo.addEventListener(state => {
    if (state.isConnected) {
      onConnected?.();
    } else {
      onDisconnected?.();
    }
  });
};

/**
 * 显示网络错误提示
 * @param message 错误提示信息
 */
export const showNetworkErrorAlert = (message: string = '网络连接失败，请检查您的网络设置'): void => {
  Alert.alert(
    '网络错误',
    message,
    [{ text: '确定' }]
  );
};
