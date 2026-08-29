package handlers

import (
	"os"
	"path/filepath"
	"sync"

	"github.com/wailsapp/wails/v3/pkg/application"

	"sujian/backend/updater"
)

// 下载进度事件名（前端 Events.On 监听）
const eventDownloadProgress = "updater:download-progress"

// UpdaterHandler 暴露自动更新能力给前端。
//
// 方法全名（Wails FQN）：sujian/backend/handlers.UpdaterHandler.<Method>
// 前端通过 @wailsio/runtime 的 Call.ByName 调用，无需重新生成 bindings。
type UpdaterHandler struct {
	mu sync.Mutex

	// window 在 main.go 创建应用后通过 SetWindow 注入，用于推送下载进度事件。
	window *application.WebviewWindow

	// 已下载资产的本地路径（DownloadUpdate 后缓存，ApplyUpdate 使用）
	downloadedPath string
	// 已下载资产元信息
	downloadedAsset updater.PlatformAsset
}

// NewUpdaterHandler 创建更新处理器（window 稍后由 SetWindow 注入）。
func NewUpdaterHandler() *UpdaterHandler {
	return &UpdaterHandler{}
}

// SetWindow 注入主窗口引用，启用下载进度事件推送。
func (h *UpdaterHandler) SetWindow(w *application.WebviewWindow) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.window = w
}

// CurrentVersion 返回当前应用版本号。
func (h *UpdaterHandler) CurrentVersion() string {
	return updater.Version
}

// CheckForUpdates 拉取清单并比对版本，返回更新信息。
func (h *UpdaterHandler) CheckForUpdates() (*updater.UpdateInfo, error) {
	return updater.CheckForUpdates()
}

// DownloadUpdate 下载指定资产到临时目录并校验 SHA256。
// 下载进度通过 "updater:download-progress" 事件推送给前端（percent 0-100）。
// url/sha256/filename 来自 CheckForUpdates 返回的 UpdateInfo.Asset。
func (h *UpdaterHandler) DownloadUpdate(url, sha256, filename string) error {
	if url == "" {
		// 若未传 url，则用上次检查结果中缓存的资产（便捷调用）
		h.mu.Lock()
		asset := h.downloadedAsset
		h.mu.Unlock()
		if asset.URL == "" {
			return nil
		}
		url, sha256, filename = asset.URL, asset.SHA256, asset.Filename
	}

	// 临时目录：系统 temp / sujian-update / filename
	tmpDir := filepath.Join(os.TempDir(), "sujian-update")
	dest := filepath.Join(tmpDir, filename)

	h.emitProgress(0)
	err := updater.Download(url, dest, sha256, func(pct int) {
		h.emitProgress(pct)
	})
	if err != nil {
		h.emitProgress(-1) // -1 表示错误
		return err
	}
	h.emitProgress(100)

	h.mu.Lock()
	h.downloadedPath = dest
	h.downloadedAsset = updater.PlatformAsset{
		URL:      url,
		SHA256:   sha256,
		Filename: filename,
	}
	h.mu.Unlock()
	return nil
}

// ApplyUpdate 安装已下载的资产并重启应用。
// 必须在 DownloadUpdate 成功后调用；内部会启动 detached 安装/替换流程并退出进程。
func (h *UpdaterHandler) ApplyUpdate() error {
	h.mu.Lock()
	path := h.downloadedPath
	asset := h.downloadedAsset
	h.mu.Unlock()

	if path == "" {
		// 兜底：若未下载，尝试用缓存资产重新下载
		if asset.URL == "" {
			return nil
		}
		dest := filepath.Join(os.TempDir(), "sujian-update", asset.Filename)
		if err := updater.Download(asset.URL, dest, asset.SHA256, nil); err != nil {
			return err
		}
		path = dest
	}
	return updater.Apply(path, asset)
}

// emitProgress 推送下载进度事件。window 未注入时静默跳过。
func (h *UpdaterHandler) emitProgress(percent int) {
	h.mu.Lock()
	w := h.window
	h.mu.Unlock()
	if w == nil {
		return
	}
	w.EmitEvent(eventDownloadProgress, percent)
}
