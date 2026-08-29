#!/usr/bin/env bash
# collect-artifacts.sh — 收集打包产物并重命名为「sujian-<平台>-<架构>-<版本>.<类型>」
#
# Usage: collect-artifacts.sh <platform-name> <version>
#   platform-name: 矩阵名，如 linux-amd64 / darwin-arm64 / windows-amd64
#
# 产物映射（来自 Taskfile 打包输出，APP_NAME=sujian）：
#   - linux-*   → bin/*.AppImage、bin/*.deb、bin/*.rpm
#   - darwin-*  → bin/sujian.app（压缩为 zip）+ bin/sujian.dmg（磁盘镜像）
#   - windows-* → bin/sujian.exe、bin/*-installer.exe（NSIS 安装器，由 project.nsi OutFile 输出到 bin/）

set -euo pipefail

NAME="${1:?usage: collect-artifacts.sh <platform-name> <version>}"
VERSION="${2:?usage: collect-artifacts.sh <platform-name> <version>}"

OUT="dist/release"
mkdir -p "$OUT"

case "$NAME" in
  linux-*)
    for f in bin/*.AppImage bin/*.deb bin/*.rpm; do
      [ -e "$f" ] || continue
      ext="${f##*.}"          # AppImage / deb / rpm
      cp "$f" "$OUT/sujian-${NAME}-${VERSION}.${ext}"
    done
    ;;
  darwin-*)
    [ -d bin/sujian.app ] || { echo "!! missing bin/sujian.app" >&2; exit 1; }
    zip -qry "$OUT/sujian-${NAME}-${VERSION}.zip" bin/sujian.app
    if [ -f bin/sujian.dmg ]; then
      cp bin/sujian.dmg "$OUT/sujian-${NAME}-${VERSION}.dmg"
    fi
    ;;
  windows-*)
    if [ -f bin/sujian.exe ]; then
      cp bin/sujian.exe "$OUT/sujian-${NAME}-${VERSION}.exe"
    fi
    for f in bin/*-installer.exe; do
      [ -e "$f" ] || continue
      cp "$f" "$OUT/sujian-${NAME}-${VERSION}-installer.exe"
    done
    ;;
  *)
    echo "!! unknown platform: $NAME" >&2
    exit 1
    ;;
esac

# 校验：必须有产物，否则 job 失败（上传步骤 if-no-files-found: error 兜底）
count="$(ls -1 "$OUT" | wc -l | tr -d ' ')"
if [ "$count" -eq 0 ]; then
  echo "!! no artifacts collected" >&2
  exit 1
fi

echo ">> Collected $count artifact(s) into $OUT/"
ls -la "$OUT"
