package services

import (
	"context"
	"errors"
	"strings"

	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/github"
)

// UpdateService 把 Wails v3 updater（app.Updater）桥接给前端。
// 应用创建后作为 Service 注册，前端通过生成的绑定驱动 Check /
// DownloadAndInstall，并订阅 wails:updater:* 事件获取进度。
type UpdateService struct {
	updater *updater.Updater
}

func NewUpdateService(u *updater.Updater) *UpdateService {
	return &UpdateService{updater: u}
}

// CheckResult 是前端渲染所需的检查结果。HasUpdate 为 false 时其余字段
// 为零值 —— 当前构建已是最新发布。
type CheckResult struct {
	HasUpdate      bool   `json:"hasUpdate"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	ReleaseURL     string `json:"releaseUrl"`
	Notes          string `json:"notes"`
	ArtifactName   string `json:"artifactName"`
}

// Check 向配置的更新源询问是否有新版本。已是最新时返回 HasUpdate=false
// 的结果（不视为错误）。
func (s *UpdateService) Check() (*CheckResult, error) {
	if s.updater == nil {
		return nil, errors.New("updater not configured")
	}
	rel, err := s.updater.Check(context.Background())
	if err != nil {
		return nil, err
	}
	res := &CheckResult{CurrentVersion: s.updater.CurrentVersion()}
	if rel != nil {
		res.HasUpdate = true
		res.LatestVersion = rel.Version
		res.Notes = rel.Notes
		res.ArtifactName = rel.Artifact.Filename
		if u, ok := rel.Metadata["github.release.htmlURL"].(string); ok {
			res.ReleaseURL = u
		}
	}
	return res, nil
}

// DownloadAndInstall 下载此前 Check 选中的发布、校验并暂存，等待二进制
// 替换。应用需重启后新版本才生效 —— 前端监听 wails:updater:update-ready
// 事件并提示用户。
func (s *UpdateService) DownloadAndInstall() error {
	if s.updater == nil {
		return errors.New("updater not configured")
	}
	return s.updater.DownloadAndInstall(context.Background())
}

// State 返回 updater 生命周期阶段（idle/checking/downloading/…）。
func (s *UpdateService) State() string {
	if s.updater == nil {
		return "unconfigured"
	}
	return string(s.updater.State())
}

// Restart 用暂存好的新版本重启应用。Wails updater 会以 helper 模式重新
// 执行当前进程：等待当前进程退出 → 替换磁盘上的二进制 → 重新拉起，
// 因此该调用不会返回（替换期间进程即退出）。
func (s *UpdateService) Restart() error {
	if s.updater == nil {
		return errors.New("updater not configured")
	}
	return s.updater.Restart(context.Background())
}

// CurrentVersion 返回构建时经 -ldflags 注入的版本号。
func (s *UpdateService) CurrentVersion() string {
	if s.updater == nil {
		return Version
	}
	return s.updater.CurrentVersion()
}

// SujianAssetMatcher 从 GitHub Release 资产中挑出 updater 可安装的那个。
//
// updater 只会解压 zip / tar.gz 并替换单个顶层条目（.app bundle 或裸可执
// 行文件），因此：
//   - darwin  → 含 sujian.app 的 .zip（不能是 .dmg —— updater 无法挂载）
//   - windows → 便携版 .exe（不能是 NSIS -installer.exe —— 那是自解压安
//     装程序，updater 无法替换）
//   - linux   → .AppImage（单个可重定位的可执行文件）
//
// 导出以便测试锁定选择规则。
func SujianAssetMatcher(req updater.CheckRequest, assets []github.ReleaseAsset) int {
	plat := strings.ToLower(req.Platform)
	arch := strings.ToLower(req.Arch)

	var wantSuffix string
	switch plat {
	case "darwin":
		wantSuffix = ".zip"
	case "windows":
		wantSuffix = ".exe"
	case "linux":
		wantSuffix = ".appimage"
	}

	for i, a := range assets {
		name := strings.ToLower(a.Name)
		if !strings.Contains(name, plat) {
			continue
		}
		if !matchArch(name, arch) {
			continue
		}
		// Windows：NSIS 安装包同样以 .exe 结尾且含平台/架构 token —— 跳过，
		// 让便携版胜出。
		if plat == "windows" && strings.Contains(name, "installer") {
			continue
		}
		if wantSuffix != "" && !strings.HasSuffix(name, wantSuffix) {
			continue
		}
		return i
	}
	return -1
}

// matchArch 与 github.DefaultAssetMatcher 的架构别名一致：amd64 ↔
// x86_64/x64，arm64 ↔ aarch64。
func matchArch(name, arch string) bool {
	if arch == "" {
		return true
	}
	if strings.Contains(name, arch) {
		return true
	}
	if arch == "amd64" && (strings.Contains(name, "x86_64") || strings.Contains(name, "x64")) {
		return true
	}
	if arch == "arm64" && strings.Contains(name, "aarch64") {
		return true
	}
	return false
}
