# Ringbook - 智能电子书阅读器

一个基于 React Native 和 Expo 构建的现代化电子书阅读应用，支持多种格式的电子书阅读、语音朗读和智能书籍管理。

## 📱 项目概述

Ringbook 是一个功能丰富的电子书阅读器应用，旨在为用户提供舒适的阅读体验。应用支持跨平台运行（iOS、Android、Web），并提供了直观的用户界面和强大的阅读功能。

## ✨ 核心功能

### 📚 多格式支持
- **TXT 文件** - 支持纯文本格式书籍导入和阅读
- **EPUB 格式** - 完整的 EPUB 电子书支持，包括元数据解析和章节导航
- **智能解析** - 自动识别文件格式并进行相应处理
- **章节分割** - 智能识别和分割书籍章节

### 📖 阅读体验
- **可调字体大小** - 支持动态调整阅读字体大小
- **章节导航** - 便捷的章节列表和快速跳转
- **阅读进度** - 实时显示阅读进度和位置记录
- **翻页模式** - 支持分页阅读和滚动阅读
- **暗黑模式** - 自适应系统主题的深浅色切换

### 🎧 语音朗读 (TTS)
- **智能语音合成** - 支持文字转语音功能
- **语速调节** - 可调节语音播放速度
- **播放控制** - 支持播放、暂停、继续、停止等操作
- **高亮跟随** - 朗读时文本高亮显示当前位置
- **跨平台兼容** - 完美支持 iOS、Android 和 Web 平台

### 📂 书籍管理
- **本地导入** - 支持从设备导入电子书文件
- **智能分类** - 按最后阅读时间自动排序
- **搜索功能** - 快速搜索书籍标题和作者
- **书籍详情** - 显示书籍封面、作者、阅读进度等信息
- **阅读历史** - 记录阅读时间和进度

### 💾 数据管理
- **本地存储** - 使用 AsyncStorage 进行本地数据持久化
- **备份恢复** - 支持书籍数据的备份和恢复
- **跨设备同步** - 准备支持云端同步功能
- **离线阅读** - 完全支持离线阅读模式

## 🛠️ 技术栈

### 核心框架
- **React Native** (0.76.9) - 跨平台移动应用开发框架
- **Expo** (~52.0.46) - React Native 开发平台和工具链
- **TypeScript** (^5.3.3) - 类型安全的 JavaScript 超集
- **Expo Router** (~4.0.20) - 基于文件系统的路由方案

### UI 组件库
- **React Navigation** - 导航管理
  - `@react-navigation/native` (^7.0.14)
  - `@react-navigation/native-stack` (^7.3.10)
  - `@react-navigation/bottom-tabs` (^7.2.0)
- **React Native Vector Icons** (^10.2.0) - 图标库
- **React Native Slider** (^4.5.6) - 滑块组件
- **React Native Gesture Handler** (~2.20.2) - 手势处理
- **React Native Reanimated** (~3.16.1) - 动画库

### 核心功能库
- **EPub.js** (^0.3.93) - EPUB 文件解析和渲染
- **JSZip** (^3.10.1) - ZIP 文件解压缩（EPUB 支持）
- **Expo Speech** (~13.0.1) - 语音合成 (TTS)
- **Expo Document Picker** (~13.0.3) - 文件选择器
- **Expo File System** (~18.0.12) - 文件系统操作

### 数据存储
- **AsyncStorage** (^2.1.2) - 本地数据持久化
- **React Native WebView** (13.12.5) - WebView 组件（EPUB 渲染）

### 设备功能
- **Expo Haptics** (~14.0.1) - 触觉反馈
- **Expo Blur** (~14.0.3) - 模糊效果
- **Expo Constants** (~17.0.8) - 设备常量
- **React Native NetInfo** (^11.4.1) - 网络状态检测

### 开发工具
- **Jest** (^29.2.1) - 单元测试框架
- **ESLint** - 代码规范检查
- **Babel** (^7.25.2) - JavaScript 编译器

## 🏗️ 项目结构

```
ringbook/
├── app/                    # 应用入口和路由
│   ├── (tabs)/            # 标签页导航
│   ├── reader/            # 阅读器页面
│   ├── _layout.tsx        # 布局组件
│   └── index.tsx          # 主页面
├── components/            # 可复用组件
│   ├── reader/            # 阅读器相关组件
│   │   ├── EpubReaderContent.tsx
│   │   ├── ReaderControls.tsx
│   │   ├── ChapterListModal.tsx
│   │   └── PagedReaderContent.tsx
│   ├── BookDetail.tsx     # 书籍详情
│   ├── BookItem.tsx       # 书籍列表项
│   ├── SearchBar.tsx      # 搜索栏
│   └── EmptyBookshelf.tsx # 空书架提示
├── screens/               # 页面组件
│   ├── HomeScreen.tsx     # 主页
│   ├── ReaderScreen.tsx   # 阅读器页面
│   ├── SettingsScreen.tsx # 设置页面
│   └── BackupScreen.tsx   # 备份页面
├── services/              # 服务层
│   ├── SpeechContext.tsx  # 语音服务上下文
│   ├── ttsService.ts      # 语音合成服务
│   ├── themeService.ts    # 主题服务
│   └── backupService.ts   # 备份服务
├── utils/                 # 工具函数
│   ├── storage.ts         # 数据存储
│   ├── fileUtils.ts       # 文件处理
│   └── epubUtils.ts       # EPUB 处理
├── types/                 # TypeScript 类型定义
│   └── index.ts           # 全局类型
├── navigation/            # 导航配置
├── assets/               # 资源文件
└── scripts/              # 脚本文件
```

## 🚀 快速开始

### 环境要求
- Node.js (>= 18.0.0)
- npm 或 yarn
- Expo CLI
- iOS Simulator 或 Android Emulator（可选）

### 安装依赖
```bash
npm install
# 或
yarn install
```

### 运行应用
```bash
# 启动开发服务器
npm start
# 或
yarn start

# 在 iOS 上运行
npm run ios
# 或
yarn ios

# 在 Android 上运行
npm run android
# 或
yarn android

# 在 Web 上运行
npm run web
# 或
yarn web
```

### 测试
```bash
# 运行测试
npm test
# 或
yarn test
```

## 🎯 核心特性详解

### 1. 智能文件处理
- 支持拖拽导入和文件选择器导入
- 自动识别文件格式并进行相应处理
- 大文件分块加载，避免内存溢出
- 智能章节分割和内容提取

### 2. 高级阅读功能
- 可调节字体大小和行间距
- 智能分页和滚动阅读模式
- 书签和笔记功能（开发中）
- 阅读进度同步和恢复

### 3. 语音朗读系统
- 支持多种语音引擎
- 智能断句和语调调节
- 背景播放和锁屏控制
- 朗读位置高亮显示

### 4. 跨平台兼容
- 完美支持 iOS、Android 和 Web
- 响应式设计，适配不同屏幕尺寸
- 平台特定功能优化
- 原生性能体验

## 📊 性能优化

- **懒加载** - 章节内容按需加载
- **内存管理** - 智能内存释放和垃圾回收
- **缓存策略** - 多级缓存提升响应速度
- **包大小优化** - 代码分割和资源优化

## 🔧 配置选项

### 应用配置 (app.json)
```json
{
  "expo": {
    "name": "Ringbook",
    "slug": "ringbook",
    "version": "1.0.0",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"]
  }
}
```

### 开发配置
- TypeScript 严格模式
- ESLint 代码规范
- Jest 测试配置
- Expo 开发工具集成

## 📱 支持的平台

- **iOS** - 完整功能支持
- **Android** - 完整功能支持  
- **Web** - 基础功能支持（部分原生功能受限）

## 🔮 未来计划

- [ ] 云端同步功能
- [ ] 书签和笔记系统
- [ ] 更多电子书格式支持（PDF、MOBI）
- [ ] 个性化推荐系统
- [ ] 社交分享功能
- [ ] 离线翻译功能

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

**Ringbook** - 让阅读更智能，让知识更有声。