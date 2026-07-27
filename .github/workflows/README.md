# 📜 素笺 Sujian - GitHub Actions 自动构建

本项目配置了 GitHub Actions 自动构建和发布流程，支持多平台打包。

## 🚀 构建触发条件

工作流在以下情况下自动触发：

- 推送到 `main` 或 `develop` 分支
- 创建以 `v` 开头的标签（如 `v1.0.0`）
- 手动触发 (`workflow_dispatch`)
- 创建针对 `main` 分支的 Pull Request

## 📦 支持的平台

| 平台 | 架构 | 输出文件 |
|------|------|----------|
| Windows | amd64 | `sujian-windows-amd64.zip` |
| macOS | Intel (amd64) | `sujian-macos-amd64.tar.gz` |
| macOS | Apple Silicon (arm64) | `sujian-macos-arm64.tar.gz` |
| Linux | amd64 | `sujian-linux-amd64.tar.gz` |

## 🏗️ 构建过程

1. **环境准备**
   - 安装 Go $GO_VERSION
   - 安装 Node.js $NODE_VERSION
   - 缓存 Go 模块和 Node.js 依赖

2. **系统依赖**
   - Ubuntu: 安装 GTK 和 WebKit 依赖
   - macOS: 安装 UPX 压缩工具
   - Windows: 安装 UPX 压缩工具

3. **前端构建**
   - 安装依赖 (`npm ci`)
   - 构建前端 (`npm run build`)

4. **Go 应用构建**
   - 跨平台编译
   - macOS 创建 .app 应用包
   - UPX 压缩减小文件大小

5. **打包和上传**
   - 创建平台特定的压缩包
   - 上传为 GitHub Actions 构件

## 🎉 发布流程

当推送带有 `v` 前缀的标签时（如 `v1.0.0`），工作流会：

1. 自动构建所有平台的二进制文件
2. 创建 GitHub Release
3. 下载所有构件并附加到 Release
4. 自动生成变更日志

## 📋 如何发布新版本

1. 确保所有更改已合并到 `main` 分支
2. 创建并推送标签：
   ```bash
   git tag -a v1.0.0 -m "Release version 1.0.0"
   git push origin v1.0.0
   ```
3. GitHub Actions 会自动构建并创建 Release

## 🔧 本地构建

如果需要在本地构建，可以使用提供的 `build.sh` 脚本：

```bash
# Linux/macOS
./build.sh linux amd64
./build.sh darwin amd64
./build.sh darwin arm64

# Windows (在 Git Bash 或 WSL 中)
./build.sh windows amd64
```

## 📁 构建输出

- Windows: 可执行文件 `.exe`
- macOS: 应用包 `.app` (包含 Info.plist)
- Linux: 可执行文件

所有输出都使用 UPX 压缩以减小文件大小。

## 🔍 故障排除

如果构建失败，请检查：

1. Go 版本是否与 `go.mod` 中要求的版本兼容
2. 前端依赖是否能正确安装
3. 跨平台编译所需的 CGO 工具链是否完整
4. 标签格式是否正确（必须以 `v` 开头）