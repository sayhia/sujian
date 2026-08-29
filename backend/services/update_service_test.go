package services

import (
	"testing"

	"github.com/wailsapp/wails/v3/pkg/updater"
	"github.com/wailsapp/wails/v3/pkg/updater/providers/github"
)

func assets(names ...string) []github.ReleaseAsset {
	out := make([]github.ReleaseAsset, len(names))
	for i, n := range names {
		out[i] = github.ReleaseAsset{Name: n}
	}
	return out
}

func TestSujianAssetMatcher(t *testing.T) {
	// 真实的 release 会同时带 macOS 的 .dmg/.zip、Windows 的 .exe + 安装包、
	// Linux 的 AppImage/deb/rpm。
	macRelease := assets(
		"sujian-darwin-arm64-0.1.0.dmg",
		"sujian-darwin-arm64-0.1.0.zip",
		"sujian-darwin-amd64-0.1.0.dmg",
		"sujian-darwin-amd64-0.1.0.zip",
	)
	winRelease := assets(
		"sujian-windows-amd64-0.1.0-installer.exe",
		"sujian-windows-amd64-0.1.0.exe",
	)
	linuxRelease := assets(
		"sujian-linux-amd64-0.1.0.AppImage",
		"sujian-linux-amd64-0.1.0.deb",
		"sujian-linux-amd64-0.1.0.rpm",
	)

	cases := []struct {
		name string
		req  updater.CheckRequest
		want string
	}{
		{"darwin arm64 → zip", updater.CheckRequest{Platform: "darwin", Arch: "arm64"}, "sujian-darwin-arm64-0.1.0.zip"},
		{"darwin amd64 → zip", updater.CheckRequest{Platform: "darwin", Arch: "amd64"}, "sujian-darwin-amd64-0.1.0.zip"},
		{"windows amd64 → portable exe", updater.CheckRequest{Platform: "windows", Arch: "amd64"}, "sujian-windows-amd64-0.1.0.exe"},
		{"linux amd64 → AppImage", updater.CheckRequest{Platform: "linux", Arch: "amd64"}, "sujian-linux-amd64-0.1.0.AppImage"},
		// linux arm64 在上面的资产切片中不存在
		{"linux arm64 → 无匹配", updater.CheckRequest{Platform: "linux", Arch: "arm64"}, ""},
	}

	allAssets := append(append(append([]github.ReleaseAsset{}, macRelease...), winRelease...), linuxRelease...)
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			idx := SujianAssetMatcher(c.req, allAssets)
			if c.want == "" {
				if idx != -1 {
					t.Fatalf("expected no match (-1), got %d (%s)", idx, allAssets[idx].Name)
				}
				return
			}
			if idx < 0 || idx >= len(allAssets) {
				t.Fatalf("index %d out of range", idx)
			}
			if got := allAssets[idx].Name; got != c.want {
				t.Fatalf("got %q, want %q", got, c.want)
			}
		})
	}
}

func TestSujianAssetMatcher_DarwinSkipsDMG(t *testing.T) {
	// 只发布了 dmg（无 zip）—— 匹配器不能选中它，updater 无法安装 DMG。
	a := assets("sujian-darwin-arm64-0.1.0.dmg")
	if idx := SujianAssetMatcher(updater.CheckRequest{Platform: "darwin", Arch: "arm64"}, a); idx != -1 {
		t.Fatalf("darwin must not select a .dmg; got index %d (%s)", idx, a[idx].Name)
	}
}

func TestSujianAssetMatcher_WindowsSkipsInstaller(t *testing.T) {
	// 只有 NSIS 安装包 —— 必须跳过，便携版 exe 才是 updater 能替换的。
	a := assets("sujian-windows-amd64-0.1.0-installer.exe")
	if idx := SujianAssetMatcher(updater.CheckRequest{Platform: "windows", Arch: "amd64"}, a); idx != -1 {
		t.Fatalf("windows must not select an installer; got index %d (%s)", idx, a[idx].Name)
	}
}
