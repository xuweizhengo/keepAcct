#!/bin/bash

# 云服务器APK打包脚本
# 使用方法: bash build-apk.sh

echo "🏗️ 开始在云服务器上打包Android APK..."

# 设置环境变量
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境
echo -e "${YELLOW}🔍 检查构建环境...${NC}"

# 检查Java
if ! command -v java &> /dev/null; then
    echo -e "${RED}❌ Java未安装${NC}"
    exit 1
fi

# 检查Android SDK
if [ ! -d "$ANDROID_HOME" ]; then
    echo -e "${RED}❌ Android SDK未找到${NC}"
    exit 1
fi

# 检查项目依赖
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 安装项目依赖...${NC}"
    npm install
fi

# 检查Android目录
if [ ! -d "android" ]; then
    echo -e "${RED}❌ Android项目目录未找到${NC}"
    exit 1
fi

# 创建输出目录
mkdir -p build-output

# 清理之前的构建
echo -e "${YELLOW}🧹 清理之前的构建...${NC}"
cd android
./gradlew clean

# 构建Debug APK (更快，适合测试)
echo -e "${YELLOW}🔨 构建Debug APK...${NC}"
./gradlew assembleDebug

# 检查构建结果
DEBUG_APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$DEBUG_APK" ]; then
    echo -e "${GREEN}✅ Debug APK构建成功！${NC}"
    
    # 复制到输出目录
    cp "$DEBUG_APK" "../build-output/SmartAccounting-debug.apk"
    
    # 显示文件信息
    echo -e "${GREEN}📱 APK文件信息：${NC}"
    ls -lh "../build-output/SmartAccounting-debug.apk"
    
    echo -e "${GREEN}📍 APK文件位置：${NC}"
    echo "$(pwd)/../build-output/SmartAccounting-debug.apk"
else
    echo -e "${RED}❌ Debug APK构建失败${NC}"
    exit 1
fi

# 尝试构建Release APK (如果有签名配置)
echo -e "${YELLOW}🔨 尝试构建Release APK...${NC}"
if ./gradlew assembleRelease 2>/dev/null; then
    RELEASE_APK="app/build/outputs/apk/release/app-release.apk"
    if [ -f "$RELEASE_APK" ]; then
        echo -e "${GREEN}✅ Release APK构建成功！${NC}"
        cp "$RELEASE_APK" "../build-output/SmartAccounting-release.apk"
        ls -lh "../build-output/SmartAccounting-release.apk"
    fi
else
    echo -e "${YELLOW}⚠️ Release APK构建失败（可能需要签名配置）${NC}"
fi

# 回到项目根目录
cd ..

echo -e "${GREEN}🎉 APK打包完成！${NC}"
echo ""
echo -e "${YELLOW}📋 下载和安装步骤：${NC}"
echo "1. 从云服务器下载APK文件："
echo "   scp user@server:/path/to/keepAcct/build-output/SmartAccounting-debug.apk ."
echo ""
echo "2. 或者启动HTTP服务器："
echo "   python3 -m http.server 8000"
echo "   然后在手机浏览器访问: http://$(hostname -I | awk '{print $1}'):8000"
echo ""
echo "3. 在手机上安装："
echo "   - 开启'允许安装未知来源应用'"
echo "   - 点击APK文件安装"
echo ""
echo -e "${GREEN}🚀 安装完成后，查找'SmartAccounting'应用进行测试！${NC}"

# 创建简单的HTTP服务器脚本
cat > start-server.sh << 'EOF'
#!/bin/bash
echo "🌐 启动HTTP服务器..."
echo "访问地址: http://$(hostname -I | awk '{print $1}'):8000"
echo "在手机浏览器中打开上述地址下载APK"
echo "按Ctrl+C停止服务器"
cd build-output
python3 -m http.server 8000
EOF

chmod +x start-server.sh

echo ""
echo -e "${YELLOW}💡 提示：运行 ${GREEN}bash start-server.sh${YELLOW} 启动下载服务器${NC}"