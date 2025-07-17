#!/bin/bash

# Flutter Web 构建脚本
echo "🚀 开始构建 Flutter Web 版本..."

# 检查 Flutter 是否安装
if ! command -v flutter &> /dev/null; then
    echo "❌ Flutter 未安装，正在尝试安装..."
    
    # 下载 Flutter SDK
    if [ ! -d "flutter" ]; then
        echo "📥 下载 Flutter SDK..."
        git clone https://github.com/flutter/flutter.git -b stable flutter
        if [ $? -ne 0 ]; then
            echo "❌ 下载失败，尝试使用备用方案..."
            wget https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.16.0-stable.tar.xz
            tar xf flutter_linux_3.16.0-stable.tar.xz
        fi
    fi
    
    # 设置环境变量
    export PATH="$PATH:`pwd`/flutter/bin"
    
    # 配置 Flutter
    flutter config --enable-web
    flutter doctor
fi

# 获取依赖
echo "📦 获取依赖包..."
flutter pub get

# 构建 Web 版本
echo "🔨 构建 Web 版本..."
flutter build web --release

# 检查构建结果
if [ -d "build/web" ]; then
    echo "✅ Web 版本构建成功！"
    echo "📂 输出目录: build/web"
    echo "🌐 可以使用以下命令启动本地服务器："
    echo "   cd build/web && python3 -m http.server 8080"
    echo "   然后访问 http://localhost:8080"
else
    echo "❌ Web 版本构建失败"
    exit 1
fi

echo "🎉 构建完成！"