// Package updater 实现素笺 Sujian 的自动更新能力。
//
// 背景：Wails v3 alpha.59 尚未内置 updater 包，此处自建一套轻量更新机制：
//   - 版本号：构建时通过 ldflags -X 注入（默认 "0.0.0-dev"）
//   - 更新源：GitHub Releases 上的 latest.json 清单（由 release workflow 生成）
//   - 流程：检查(manifest) → 下载(带进度+SHA256校验) → 安装(跨平台)
//
// 设计原则：纯逻辑、无 Wails 依赖，进度通过回调上报，由 handler 层桥接到前端事件。
package updater

import (
	"archive/zip"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"time"
)

// Version 当前应用版本。构建时注入：
//
//	go build -ldflags="-X 'sujian/backend/updater.Version=1.2.3'"
//
// 未注入时为开发占位版本，CheckForUpdates 会据此判断是否需要更新。
var Version = "0.0.0-dev"

// ManifestURL 更新清单地址。默认指向本仓库 GitHub Releases 的 latest 资产。
// 私有仓库或自建源时，构建时同样用 -X 覆盖。
var ManifestURL = "https://github.com/sunmking/panda-time-note/releases/latest/download/latest.json"

// httpTimeoutFactor 单次 HTTP 请求超时倍数（下载用独立大超时）。
const httpTimeout = 30 * time.Second

// Manifest 是 release workflow 上传到 GitHub Release 的 latest.json 结构。
type Manifest struct {
	Version    string                   `json:"version"`     // 最新版本号，如 "1.2.3"
	ReleasedAt string                   `json:"releasedAt"`  // ISO8601 发布时间
	ReleaseURL string                   `json:"releaseUrl"`  // Release 页面链接
	Notes      string                   `json:"notes"`       // 更新说明（markdown）
	Platforms  map[string]PlatformAsset `json:"platforms"`   // 平台 → 资产
}

// PlatformAsset 单个平台的下载资产信息。
type PlatformAsset struct {
	URL      string `json:"url"`      // 直链下载地址
	Filename string `json:"filename"` // 文件名（含平台与版本）
	SHA256   string `json:"sha256"`   // 校验和（hex）
	Size     int64  `json:"size"`     // 字节数（可选，用于预估）
}

// UpdateInfo 是检查更新的结果，序列化后返回给前端。
type UpdateInfo struct {
	Available      bool         `json:"available"`       // 是否有新版本
	CurrentVersion string       `json:"currentVersion"`  // 当前版本
	LatestVersion  string       `json:"latestVersion"`   // 最新版本
	ReleaseURL     string       `json:"releaseUrl"`      // Release 页面
	Notes          string       `json:"notes"`           // 更新说明
	Asset          PlatformAsset `json:"asset"`          // 当前平台对应的资产
}

// PlatformKey 返回当前运行平台在 manifest 中的 key（GOOS-GOARCH）。
// 与 release.yml 的矩阵名约定一致：darwin-arm64 / linux-amd64 / windows-amd64 等。
func PlatformKey() string {
	return runtime.GOOS + "-" + runtime.GOARCH
}

// CheckForUpdates 拉取清单并比对版本，返回更新信息。
// 若当前平台无对应资产，返回错误（不阻断应用，调用方按需提示）。
func CheckForUpdates() (*UpdateInfo, error) {
	info := &UpdateInfo{CurrentVersion: Version}
	m, err := fetchManifest()
	if err != nil {
		return nil, fmt.Errorf("拉取更新清单失败: %w", err)
	}
	info.LatestVersion = m.Version
	info.ReleaseURL = m.ReleaseURL
	info.Notes = m.Notes

	asset, ok := m.Platforms[PlatformKey()]
	if !ok {
		return nil, fmt.Errorf("当前平台 %s 暂无可用更新资产", PlatformKey())
	}
	info.Asset = asset
	info.Available = isNewer(Version, m.Version)
	return info, nil
}

// fetchManifest 请求并解析清单 JSON。
func fetchManifest() (*Manifest, error) {
	client := &http.Client{Timeout: httpTimeout}
	req, err := http.NewRequest(http.MethodGet, ManifestURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "sujian-updater/"+Version)
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("清单请求返回 %s", resp.Status)
	}
	var m Manifest
	if err := json.NewDecoder(resp.Body).Decode(&m); err != nil {
		return nil, fmt.Errorf("清单解析失败: %w", err)
	}
	return &m, nil
}

// Download 下载资产到 dest 路径，并通过 progress 回报百分比(0-100)。
// progress 可为 nil。下载完成后若 expectedSHA256 非空则校验。
func Download(url, dest, expectedSHA256 string, progress func(percent int)) error {
	if err := os.MkdirAll(filepath.Dir(dest), 0o755); err != nil {
		return err
	}
	client := &http.Client{Timeout: 0} // 下载不设整体超时，靠连接阶段保障
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "sujian-updater/"+Version)
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("下载返回 %s", resp.Status)
	}

	total := resp.ContentLength
	out, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer out.Close()

	// 进度上报：每 256KB 或结尾回报一次
	const bufSize = 256 * 1024
	buf := make([]byte, bufSize)
	var written int64
	lastPct := -1
	for {
		n, rerr := resp.Body.Read(buf)
		if n > 0 {
			if _, werr := out.Write(buf[:n]); werr != nil {
				return werr
			}
			written += int64(n)
			if progress != nil && total > 0 {
				pct := int(written * 100 / total)
				if pct != lastPct {
					lastPct = pct
					progress(pct)
				}
			}
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			return rerr
		}
	}
	if progress != nil {
		progress(100)
	}

	if expectedSHA256 != "" {
		if err := VerifySHA256(dest, expectedSHA256); err != nil {
			os.Remove(dest)
			return err
		}
	}
	return nil
}

// VerifySHA256 计算文件 SHA256 并与期望值比对。
func VerifySHA256(path, expected string) error {
	f, err := os.Open(path)
	if err != nil {
		return err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.Copy(h, f); err != nil {
		return err
	}
	got := hex.EncodeToString(h.Sum(nil))
	if !strings.EqualFold(got, expected) {
		return fmt.Errorf("校验失败: 期望 %s，实际 %s", expected, got)
	}
	return nil
}

// Apply 执行平台相关的安装并（在 detached 子进程接管后）退出当前进程。
// archivePath 是已下载并校验通过的资产路径；asset 用于判断安装方式。
func Apply(archivePath string, asset PlatformAsset) error {
	switch runtime.GOOS {
	case "darwin":
		return applyDarwin(archivePath, asset)
	case "windows":
		return applyWindows(archivePath, asset)
	case "linux":
		return applyLinux(archivePath, asset)
	default:
		return fmt.Errorf("不支持的平台: %s", runtime.GOOS)
	}
}

// applyDarwin：资产是含 sujian.app 的 zip。
// 解压到临时目录 → 写替换脚本（删除旧 .app、复制新 .app、重新打开）→ detached 启动 → 主进程退出。
func applyDarwin(zipPath string, _ PlatformAsset) error {
	// 解压
	tmpDir, err := os.MkdirTemp("", "sujian-update-*")
	if err != nil {
		return err
	}
	if err := unzipTo(zipPath, tmpDir); err != nil {
		return err
	}
	// 定位解压出的 .app
	newApp, err := findAppBundle(tmpDir)
	if err != nil {
		return err
	}
	// 当前可执行文件 → 上溯两级得到当前 .app 路径
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	curApp := filepath.Dir(filepath.Dir(exe)) // .../sujian.app

	script := fmt.Sprintf(`#!/bin/bash
sleep 1
rm -rf "%s"
cp -R "%s" "%s"
open "%s"
`, curApp, newApp, curApp, curApp)
	scriptPath := filepath.Join(tmpDir, "apply-update.sh")
	if err := os.WriteFile(scriptPath, []byte(script), 0o755); err != nil {
		return err
	}
	if err := exec.Command("bash", scriptPath).Start(); err != nil {
		return err
	}
	go func() {
		time.Sleep(800 * time.Millisecond)
		os.Exit(0)
	}()
	return nil
}

// applyWindows：资产是 NSIS installer.exe。
// detached 启动安装器 → 主进程退出，安装器接管（默认带 UI 引导）。
func applyWindows(installerPath string, _ PlatformAsset) error {
	// /S 可选静默；这里使用默认（带 UI），便于用户选择安装目录
	cmd := exec.Command(installerPath)
	cmd.Stdin = nil
	cmd.Stdout = nil
	cmd.Stderr = nil
	if err := cmd.Start(); err != nil {
		return err
	}
	go func() {
		time.Sleep(800 * time.Millisecond)
		os.Exit(0)
	}()
	return nil
}

// applyLinux：
//   - AppImage：替换当前可执行文件并重启（最自然的自更新路径）
//   - deb/rpm：无 root 权限自动安装，降级为用 xdg-open 打开文件管理器，提示用户手动安装
func applyLinux(pkgPath string, asset PlatformAsset) error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}
	switch {
	case strings.HasSuffix(strings.ToLower(asset.Filename), ".appimage"):
		// AppImage 可直接替换运行中的文件（Linux 允许覆盖运行中的二进制）
		if err := os.Chmod(pkgPath, 0o755); err != nil {
			return err
		}
		// 先把旧的挪开，再把新的挪到原位
		old := exe + ".old"
		_ = os.Remove(old)
		if err := os.Rename(exe, old); err != nil {
			return err
		}
		if err := os.Rename(pkgPath, exe); err != nil {
			// 回滚
			_ = os.Rename(old, exe)
			return err
		}
		cmd := exec.Command(exe)
		cmd.Stdin = nil
		cmd.Stdout = nil
		cmd.Stderr = nil
		if err := cmd.Start(); err != nil {
			return err
		}
		go func() {
			time.Sleep(800 * time.Millisecond)
			os.Exit(0)
		}()
		return nil
	case strings.HasSuffix(strings.ToLower(asset.Filename), ".deb"),
		strings.HasSuffix(strings.ToLower(asset.Filename), ".rpm"):
		// 无 root：打开文件管理器，由用户双击安装
		if err := exec.Command("xdg-open", pkgPath).Start(); err != nil {
			return err
		}
		return nil
	default:
		return fmt.Errorf("无法识别的 Linux 安装包格式: %s", asset.Filename)
	}
}

// unzipTo 将 zip 解压到 dest 目录。
func unzipTo(zipPath, dest string) error {
	r, err := zip.OpenReader(zipPath)
	if err != nil {
		return err
	}
	defer r.Close()
	for _, f := range r.File {
		outPath := filepath.Join(dest, f.Name)
		// 防 zip slip
		if !strings.HasPrefix(filepath.Clean(outPath)+string(os.PathSeparator), filepath.Clean(dest)+string(os.PathSeparator)) {
			return fmt.Errorf("非法的 zip 路径: %s", f.Name)
		}
		if f.FileInfo().IsDir() {
			if err := os.MkdirAll(outPath, 0o755); err != nil {
				return err
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(outPath), 0o755); err != nil {
			return err
		}
		rc, err := f.Open()
		if err != nil {
			return err
		}
		out, err := os.OpenFile(outPath, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, f.Mode())
		if err != nil {
			rc.Close()
			return err
		}
		if _, err := io.Copy(out, rc); err != nil {
			rc.Close()
			out.Close()
			return err
		}
		rc.Close()
		out.Close()
	}
	return nil
}

// findAppBundle 在目录下查找第一个 .app。
func findAppBundle(dir string) (string, error) {
	var found string
	err := filepath.Walk(dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() && strings.HasSuffix(path, ".app") {
			found = path
			return filepath.SkipDir
		}
		return nil
	})
	if err != nil || found == "" {
		return "", fmt.Errorf("更新包内未找到 .app")
	}
	return found, nil
}

// isNewer 简单的语义版本比较：latest 是否比 current 新。
// 按点分段解析数字逐段比较，忽略 pre-release 后缀（足够覆盖素笺的发版节奏）。
func isNewer(current, latest string) bool {
	if current == "" || current == "0.0.0-dev" {
		return latest != "" && latest != current
	}
	c := parseVer(current)
	l := parseVer(latest)
	n := len(c)
	if len(l) < n {
		n = len(l)
	}
	for i := 0; i < n; i++ {
		if l[i] > c[i] {
			return true
		}
		if l[i] < c[i] {
			return false
		}
	}
	return len(l) > len(c)
}

// parseVer 把 "v1.2.3" 解析为 [1,2,3]，非数字段按 0 处理。
func parseVer(v string) []int {
	v = strings.TrimPrefix(v, "v")
	// 去掉 pre-release 后缀，如 1.2.3-beta
	if idx := strings.IndexAny(v, "-+"); idx >= 0 {
		v = v[:idx]
	}
	parts := strings.Split(v, ".")
	out := make([]int, len(parts))
	for i, p := range parts {
		n := 0
		fmt.Sscanf(p, "%d", &n)
		out[i] = n
	}
	return out
}
