#!/bin/bash

# 手机部署脚本
# 使用方法：bash deploy-to-phone.sh

echo "🚀 开始部署智能记账应用到手机..."

# 设置环境变量
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查函数
check_command() {
    if command -v "$1" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ $1 已安装${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 未安装${NC}"
        return 1
    fi
}

# 1. 检查必要工具
echo -e "${YELLOW}📋 检查环境...${NC}"
check_command "node" || { echo "请先安装Node.js"; exit 1; }
check_command "npm" || { echo "请先安装npm"; exit 1; }
check_command "adb" || { echo "请先安装Android SDK"; exit 1; }

# 2. 检查手机连接
echo -e "${YELLOW}📱 检查手机连接...${NC}"
device_count=$(adb devices | grep -c "device$")
if [ "$device_count" -eq 0 ]; then
    echo -e "${RED}❌ 没有检测到连接的设备${NC}"
    echo "请确保："
    echo "1. 手机已开启开发者模式"
    echo "2. 手机已开启USB调试"
    echo "3. 手机已连接到电脑"
    echo "4. 手机上已允许USB调试授权"
    echo ""
    echo "检查设备状态："
    adb devices
    exit 1
else
    echo -e "${GREEN}✅ 检测到 $device_count 个设备${NC}"
    adb devices
fi

# 3. 检查API密钥
echo -e "${YELLOW}🔑 检查API密钥...${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️ 未找到.env文件，创建示例文件...${NC}"
    cp .env.example .env
    echo -e "${RED}❌ 请编辑.env文件并添加你的DeepSeek API密钥${NC}"
    echo "DEEPSEEK_API_KEY=your_api_key_here"
    echo ""
    echo "编辑完成后重新运行此脚本"
    exit 1
fi

if grep -q "your_api_key_here" .env; then
    echo -e "${YELLOW}⚠️ 请在.env文件中设置真实的API密钥${NC}"
    echo "当前配置："
    grep DEEPSEEK_API_KEY .env
    echo ""
    echo "请替换为你的真实API密钥后重新运行"
    exit 1
fi

echo -e "${GREEN}✅ API密钥配置完成${NC}"

# 4. 安装依赖
echo -e "${YELLOW}📦 安装依赖...${NC}"
npm install

# 5. 清理缓存
echo -e "${YELLOW}🧹 清理缓存...${NC}"
npm start -- --reset-cache &
METRO_PID=$!
sleep 3
kill $METRO_PID 2>/dev/null || true

# 6. 启动Metro服务器
echo -e "${YELLOW}🚀 启动Metro服务器...${NC}"
npm start &
METRO_PID=$!
echo "Metro进程ID: $METRO_PID"

# 等待Metro启动
sleep 10

# 7. 部署到手机
echo -e "${YELLOW}📱 部署到手机...${NC}"
npm run android

# 8. 等待部署完成
echo -e "${YELLOW}⏳ 等待部署完成...${NC}"
sleep 30

# 9. 检查应用是否成功安装
echo -e "${YELLOW}🔍 检查应用状态...${NC}"
if adb shell pm list packages | grep -q "com.smartaccounting"; then
    echo -e "${GREEN}✅ 应用已成功安装到手机${NC}"
else
    echo -e "${RED}❌ 应用安装失败${NC}"
fi

# 10. 输出测试指南
echo -e "${GREEN}🎉 部署完成！${NC}"
echo ""
echo "📱 手机测试指南："
echo "1. 在手机上找到'SmartAccounting'应用"
echo "2. 双击屏幕任意位置"
echo "3. 应该看到快速记账菜单"
echo "4. 测试各项功能："
echo "   - 📷 拍照记账"
echo "   - 🎤 语音记账"
echo "   - 📱 截屏记账"
echo ""
echo "🐛 如果遇到问题："
echo "1. 查看Metro日志"
echo "2. 检查手机权限设置"
echo "3. 确认API密钥正确"
echo ""
echo "📊 查看日志："
echo "adb logcat | grep SmartAccounting"
echo ""
echo "🔄 重新部署："
echo "bash deploy-to-phone.sh"

# 保持Metro服务器运行
echo -e "${YELLOW}🔧 Metro服务器继续运行中...${NC}"
echo "按Ctrl+C停止服务器"
wait $METRO_PID