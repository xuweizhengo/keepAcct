# 🧠 Smart Accounting - AI智能记账助手

一个基于AI的智能记账应用，支持多种输入方式和自动分类。现已提供**Flutter版本**和**Web演示版本**。

## ✨ 核心功能

### 🎯 多模态输入
- **📷 拍照记账** - 拍摄收据、账单自动识别
- **🎤 语音记账** - 语音输入自动转换为记账信息
- **📱 截屏记账** - 导入支付截图自动提取信息

### 🤖 AI智能识别
- **DeepSeek AI集成** - 强大的图像和文本理解能力
- **自动金额提取** - 从图片或语音中准确识别金额
- **智能商户识别** - 自动识别商户名称和类型
- **分类自动建议** - 根据内容智能分类消费记录

### 💾 数据管理
- **本地存储** - 数据安全存储在本地
- **实时同步** - 记录即时保存和显示
- **历史查询** - 支持时间范围和分类筛选

## 🏗️ 技术架构

### Flutter版本 (推荐)
```
flutter_app/
├── lib/
│   ├── main.dart              # 应用入口
│   ├── models/               # 数据模型
│   │   └── expense_record.dart
│   ├── providers/            # 状态管理
│   │   └── app_provider.dart
│   ├── screens/              # 界面页面
│   │   └── home_screen.dart
│   ├── services/             # 业务服务
│   │   ├── ai_service.dart
│   │   ├── database_service.dart
│   │   ├── image_service.dart
│   │   └── audio_service.dart
│   └── widgets/              # UI组件
│       ├── quick_action_menu.dart
│       ├── expense_list.dart
│       └── expense_item.dart
└── pubspec.yaml              # 依赖配置
```

### Web演示版本
```
web_demo/
└── index.html                # 单文件Web应用
```

### 原React Native版本 (旧版)
```
src/
├── components/          # UI组件
├── services/           # 核心服务
├── types/             # 类型定义
├── utils/             # 工具函数
└── App.tsx           # 主应用组件
```

## 🚀 快速开始

### 方式1: Flutter版本 (完整功能)

#### 环境要求
- Flutter SDK 3.0+
- Dart SDK 2.17+
- Android Studio / VS Code
- Android SDK (移动端)

#### 安装步骤
```bash
# 1. 克隆项目
git clone <repository-url>
cd keepAcct

# 2. 进入Flutter项目
cd flutter_app

# 3. 安装依赖
flutter pub get

# 4. 配置环境变量
echo "DEEPSEEK_API_KEY=your_api_key_here" > .env

# 5. 运行应用
flutter run
```

#### 构建部署
```bash
# Web版本
flutter build web --release

# Android APK
flutter build apk --release

# iOS (需要Mac环境)
flutter build ios --release
```

### 方式2: Web演示版本 (快速体验)

#### 本地运行
```bash
# 进入Web演示目录
cd web_demo

# 启动本地服务器
python3 -m http.server 8080

# 访问 http://localhost:8080
```

#### 云服务器部署
```bash
# 在云服务器上
cd web_demo
python3 -m http.server 8080

# 访问 http://your-server-ip:8080
```

### 方式3: React Native版本 (旧版)

#### 环境要求
- Node.js >= 16
- React Native CLI
- Android Studio / Xcode

#### 安装运行
```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env

# 3. 运行应用
npm run android  # 或 npm run ios
```

## 📱 使用指南

### 基本操作
1. **双击屏幕任意位置** - 打开快速记账菜单
2. **选择输入方式** - 拍照/语音/截屏
3. **等待AI处理** - 自动识别和分类
4. **查看记录** - 所有记录自动保存到首页列表

### 功能特色
- **智能手势** - 双击激活，操作简单
- **实时反馈** - 处理进度和结果即时显示
- **错误处理** - 友好的错误提示和重试机制
- **响应式设计** - 适配不同屏幕尺寸

## 🛠️ 开发指南

### 添加新功能
1. **模型层** - 在`models/`中定义数据结构
2. **服务层** - 在`services/`中实现业务逻辑
3. **状态管理** - 在`providers/`中管理状态
4. **UI层** - 在`widgets/`和`screens/`中实现界面

### 集成新的AI服务
```dart
// 1. 创建新的AI服务类
class NewAIService extends BaseAIService {
  @override
  Future<Map<String, dynamic>> processImage(String imagePath) async {
    // 实现图像处理逻辑
  }
}

// 2. 在AIService中注册
class AIService {
  final NewAIService _newAIService = NewAIService();
  
  Future<Map<String, dynamic>> processImage(String imagePath) async {
    return await _newAIService.processImage(imagePath);
  }
}
```

## 🔧 配置选项

### 环境变量
```bash
# AI服务配置
DEEPSEEK_API_KEY=your_deepseek_api_key

# 应用配置
APP_ENV=development
DEFAULT_CURRENCY=CNY
DEFAULT_LANGUAGE=zh-CN

# 功能开关
ENABLE_VOICE_RECORDING=true
ENABLE_SCREENSHOT_OCR=true
ENABLE_RECEIPT_OCR=true
```

## 🎯 部署选项

### 1. 本地开发测试
```bash
# Flutter热重载开发
flutter run

# Web版本预览
flutter run -d chrome
```

### 2. 云服务器部署
```bash
# 构建Web版本
flutter build web --release

# 部署到云服务器
scp -r build/web/* user@server:/var/www/html/
```

### 3. 移动端分发
```bash
# 构建Android APK
flutter build apk --release

# 构建iOS (需要Mac)
flutter build ios --release
```

### 4. 容器化部署
```dockerfile
FROM nginx:alpine
COPY build/web /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📊 项目版本

### v2.0.0 (Flutter版本) - 当前版本
- ✅ 完整Flutter应用架构
- ✅ DeepSeek AI集成
- ✅ 多平台支持 (Android/iOS/Web)
- ✅ 现代化UI设计
- ✅ 优化的性能和体验

### v1.0.0 (React Native版本) - 旧版本
- ✅ 基础功能实现
- ✅ 多模态输入支持
- ✅ 云服务器部署方案
- ⚠️ 构建复杂度较高

### Web演示版本
- ✅ 快速体验和演示
- ✅ 无需安装，即开即用
- ✅ 响应式设计
- ⚠️ 功能有限制

## 🐛 常见问题

### Q: Web版本功能有限制吗？
A: Web版本主要用于演示，相机和语音功能为模拟实现。完整功能请使用Flutter移动端版本。

### Q: 如何更换AI服务提供商？
A: 修改`services/ai_service.dart`中的实现，或创建新的AI服务类并注册。

### Q: 支持离线使用吗？
A: 数据存储在本地，但AI识别需要网络连接。

### Q: 如何备份数据？
A: 可以导出数据库文件，或实现云同步功能。

### Q: Flutter版本和React Native版本的区别？
A: Flutter版本是推荐的新版本，具有更好的性能、更简单的部署和更丰富的功能。React Native版本是旧版本，仍可使用但建议迁移到Flutter版本。

## 🤝 贡献指南

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交代码
4. 发起Pull Request

### 代码规范
- 遵循Dart/Flutter官方规范
- 添加适当的注释
- 编写单元测试
- 更新文档

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Flutter官方文档](https://flutter.dev/docs)
- [DeepSeek API文档](https://api.deepseek.com)
- [项目演示](web_demo/index.html)

---

**开发者**: Claude Code  
**最后更新**: 2024-07-16  
**版本**: 2.0.0 (Flutter版本)

🚀 **立即体验**: 访问 [Web演示版本](web_demo/index.html) 或下载移动端APK！