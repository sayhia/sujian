#!/usr/bin/env bash
# collect-artifacts.sh — 收集打包产物并重命名为「sujian-<平台>-<架构>-<版本>.<类型>」
#
# Usage: collect-artifacts.sh <platform-name> <version>
#   platform-name: 矩阵名，如 linux-amd64 / darwin-arm64 / windows-amd64
#
# 产物映射（来自 Taskfile 打包输出）：
#   - linux-*   → bin/*.AppImage、bin/*.deb、bin/*.rpm
#   - darwin-*  → bin/sujian.app（压缩为 zip）
#   - windows-* → bin/sujian.exe、bin/*-installer.exe（NSIS 安装器）

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

# 生成更新清单元数据（主自动更新资产的 sha256 + size），供 publish job 合并为 latest.json
case "$NAME" in
  darwin-*)  main="$OUT/sujian-${NAME}-${VERSION}.zip" ;;
  windows-*) main="$OUT/sujian-${NAME}-${VERSION}-installer.exe" ;;
  linux-*)   main="$OUT/sujian-${NAME}-${VERSION}.AppImage" ;;
esac
if [ -n "${main:-}" ] && [ -f "$main" ]; then
  sha="$(shasum -a 256 "$main" | cut -d' ' -f1)"
  size="$(wc -c < "$main" | tr -d ' ')"
  mkdir -p dist/meta
  printf '{"platform":"%s","filename":"%s","sha256":"%s","size":%s}\n' \
    "$NAME" "$(basename "$main")" "$sha" "$size" > "dist/meta/${NAME}.json"
  echo ">> meta: dist/meta/${NAME}.json (sha256=$sha size=$size)"
fi

# 校验：必须有产物，否则 job 失败（上传步骤 if-no-files-found: error 兜底）
count="$(ls -1 "$OUT" | wc -l | tr -d ' ')"
if [ "$count" -eq 0 ]; then
  echo "!! no artifacts collected" >&2
  exit 1
fi

echo ">> Collected $count artifact(s) into $OUT/"
ls -la "$OUT"
