// UpdaterHandler 自动更新处理器的前端绑定。
//
// 说明：本文件为手写（非 wails3 generate 生成），使用 @wailsio/runtime 的 Call.ByName
// 按方法全名调用，因此无需重新生成 bindings、不影响现有 notehandler.ts。
// 方法全名（FQN）格式：<go包完整路径>.<类型名>.<方法名>，由 wails3 generator 的
// fqn := path + "." + obj.Name() + "." + method.Name() 构造（见 wails v3 generator/collect/service.go）。
//
// 本包路径为 sujian/backend/handlers，故 FQN 前缀固定如下：
const FQN = 'sujian/backend/handlers.UpdaterHandler.';

import { Call } from '@wailsio/runtime';

/** 单个平台的下载资产信息。 */
export interface PlatformAsset {
  url: string;
  filename: string;
  sha256: string;
  size: number;
}

/** 检查更新的返回结果。 */
export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  notes: string;
  asset: PlatformAsset;
}

/** 返回当前应用版本号（构建时通过 ldflags 注入）。 */
export function CurrentVersion(): Promise<string> {
  return Call.ByName(FQN + 'CurrentVersion');
}

/** 拉取清单并比对版本，返回更新信息。 */
export function CheckForUpdates(): Promise<UpdateInfo | null> {
  return Call.ByName(FQN + 'CheckForUpdates');
}

/**
 * 下载指定资产到临时目录并校验 SHA256。
 * 下载进度通过 Wails 事件 "updater:download-progress" 推送（percent 0-100，-1 表示错误）。
 */
export function DownloadUpdate(url: string, sha256: string, filename: string): Promise<void> {
  return Call.ByName(FQN + 'DownloadUpdate', url, sha256, filename);
}

/** 安装已下载的资产并重启应用（内部启动 detached 安装流程后退出进程）。 */
export function ApplyUpdate(): Promise<void> {
  return Call.ByName(FQN + 'ApplyUpdate');
}
