#!/bin/bash

# 智能记账应用测试脚本

echo "🚀 开始准备智能记账应用测试..."

# 1. 检查 Node.js 版本
echo "📋 检查开发环境..."
node --version
npm --version

# 2. 检查 Android 环境
echo "📱 检查 Android 环境..."
if command -v adb &> /dev/null; then
    echo "✅ ADB 已安装"
    adb version
else
    echo "❌ ADB 未安装，请先安装 Android SDK"
    exit 1
fi

# 3. 检查连接的设备
echo "🔍 检查连接的设备..."
adb devices

# 4. 安装依赖（如果需要）
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    npm install
fi

# 5. 清理之前的构建
echo "🧹 清理缓存..."
rm -rf /tmp/metro-*
rm -rf /tmp/react-*

# 6. 启动 Metro 服务器
echo "🏃 启动 Metro 服务器..."
echo "在新终端中运行以下命令来构建应用："
echo "npx react-native run-android"

# 7. 提供使用说明
echo "
📖 使用说明：
1. 确保 Android 设备已连接并开启 USB 调试
2. 运行 'npx react-native run-android' 来构建并安装应用
3. 应用安装后，双击屏幕测试手势功能
4. 尝试三种记账方式（截屏、语音、拍照）

🎯 测试重点：
- 双击手势是否响应
- 菜单是否正常显示
- 三种记账方式是否正常工作
- 记录列表是否正常显示

📞 如遇问题，请检查：
- 设备连接状态：adb devices
- 端口占用：lsof -i :8081
- 缓存清理：npx react-native start --reset-cache
"

# 启动开发服务器
npx react-native start