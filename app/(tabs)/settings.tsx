// 确保导出并清除任何可能导致问题的缓存
import SettingsScreen from '@/screens/SettingsScreen';

// 明确地使用 React.memo 包装组件以避免可能的渲染问题
import React from 'react';
const MemoizedSettingsScreen = React.memo(SettingsScreen);

export default MemoizedSettingsScreen;
