import * as UpdaterHandler from '../../bindings/sujian/backend/handlers/updaterhandler';
import { Events } from '@wailsio/runtime';

export type { UpdateInfo, PlatformAsset } from '../../bindings/sujian/backend/handlers/updaterhandler';

/** 下载进度事件名（与后 updater_handler.go 的 eventDownloadProgress 一致）。 */
const EVENT_PROGRESS = 'updater:download-progress';

/**
 * 自动更新 API 层。
 *
 * 在非 Wails 环境（浏览器 dev 预览）下，所有方法优雅降级：
 *   - currentVersion → 'dev'
 *   - checkForUpdates → null（无更新）
 *   - download/apply → no-op
 * 这样 AboutSection 在浏览器预览时不会因缺少后端而报错。
 */
export const updaterApi = {
  /** 获取当前应用版本号。 */
  async currentVersion(): Promise<string> {
    try {
      return await UpdaterHandler.CurrentVersion();
    } catch {
      return 'dev';
    }
  },

  /** 检查更新，返回更新信息（无更新或失败时返回 null）。 */
  async checkForUpdates(): Promise<UpdaterHandler.UpdateInfo | null> {
    try {
      const info = await UpdaterHandler.CheckForUpdates();
      return info;
    } catch {
      return null;
    }
  },

  /** 下载更新资产。下载进度通过 onDownloadProgress 监听。 */
  async downloadUpdate(info: UpdaterHandler.UpdateInfo): Promise<void> {
    await UpdaterHandler.DownloadUpdate(info.asset.url, info.asset.sha256, info.asset.filename);
  },

  /** 安装已下载的更新并重启应用。 */
  async applyUpdate(): Promise<void> {
    await UpdaterHandler.ApplyUpdate();
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
