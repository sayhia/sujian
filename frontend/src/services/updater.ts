import { Call, Events } from '@wailsio/runtime';

/**
 * 自动更新 API 层（自包含，不依赖 bindings/updaterhandler.ts）。
 *
 * 直接用 @wailsio/runtime 的 Call.ByName 按方法全名调用后端 UpdaterHandler，
 * 类型在本文件自定义。这样无论 release workflow 是否重新生成 bindings，
 * 本模块都不受影响（wails3 generate 不会动 src/services 下文件）。
 *
 * 方法全名（FQN）：sujian/backend/handlers.UpdaterHandler.<Method>
 * （由 wails3 generator 的 fqn := pkg.Path + "." + typeName + "." + methodName 构造）
 *
 * 在非 Wails 环境（浏览器 dev 预览）下优雅降级，不报错。
 */
const FQN = 'sujian/backend/handlers.UpdaterHandler.';
const EVENT_PROGRESS = 'updater:download-progress';

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

export const updaterApi = {
  /** 获取当前应用版本号。 */
  async currentVersion(): Promise<string> {
    try {
      return await Call.ByName(FQN + 'CurrentVersion');
    } catch {
      return 'dev';
    }
  },

  /** 检查更新，返回更新信息（无更新或失败时返回 null）。 */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      return await Call.ByName(FQN + 'CheckForUpdates');
    } catch {
      return null;
    }
  },

  /** 下载更新资产。下载进度通过 onDownloadProgress 监听。 */
  async downloadUpdate(info: UpdateInfo): Promise<void> {
    await Call.ByName(FQN + 'DownloadUpdate', info.asset.url, info.asset.sha256, info.asset.filename);
  },

  /** 安装已下载的更新并重启应用。 */
  async applyUpdate(): Promise<void> {
    await Call.ByName(FQN + 'ApplyUpdate');
  },

  /**
   * 订阅下载进度事件。
   * @param cb 百分比回调（0-100，-1 表示出错）
   * @returns 取消订阅函数
   */
  onDownloadProgress(cb: (percent: number) => void): () => void {
    // wails3 事件数据可能是裸值或包装对象，统一容错
    const cancel = Events.On(EVENT_PROGRESS, (e: any) => {
      let pct = -1;
      if (typeof e === 'number') pct = e;
      else if (typeof e?.data === 'number') pct = e.data;
      else if (Array.isArray(e) && typeof e[0] === 'number') pct = e[0];
      cb(pct);
    });
    return typeof cancel === 'function' ? cancel : () => {};
  },
};
