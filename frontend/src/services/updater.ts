import { Call, Events } from '@wailsio/runtime';

/**
 * 自动更新 API 层（自包含，不依赖 bindings）。
 *
 * 后端为 Wails v3 内置 updater（app.Updater + GitHub provider），由
 * backend/services.UpdateService 桥接暴露。前端直接用 @wailsio/runtime
 * 的 Call.ByName 按方法全名调用，类型在本文件自定义 —— 无论 bindings 是否
 * 重新生成，本模块都不受影响。
 *
 * 方法全名（FQN）：sujian/backend/services.UpdateService.<Method>
 *
 * 下载/安装/重启的进度与阶段由 updater 自身通过 wails:updater:* 事件广播，
 * 这里只订阅下载进度。在非 Wails 环境（浏览器 dev 预览）下优雅降级。
 */
const FQN = 'sujian/backend/services.UpdateService.';
const EVENT_PROGRESS = 'wails:updater:download-progress';

/** 检查更新的返回结果（映射自后端 CheckResult）。 */
export interface UpdateInfo {
  available: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseUrl: string;
  notes: string;
  /** 本次更新将安装的资产文件名（darwin zip / windows 便携 exe / linux AppImage）。 */
  artifactName: string;
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

  /** 检查更新（GitHub Releases），无更新或失败时返回 null。 */
  async checkForUpdates(): Promise<UpdateInfo | null> {
    try {
      const r = await Call.ByName(FQN + 'Check');
      if (!r) return null;
      return {
        available: !!r.hasUpdate,
        currentVersion: r.currentVersion || 'dev',
        latestVersion: r.latestVersion || '',
        releaseUrl: r.releaseUrl || '',
        notes: r.notes || '',
        artifactName: r.artifactName || '',
      };
    } catch {
      return null;
    }
  },

  /**
   * 下载并暂存更新（校验签名/摘要）。完成后应用需重启生效 ——
   * 调用 restartApp() 完成二进制替换并重启。
   */
  async installUpdate(): Promise<void> {
    await Call.ByName(FQN + 'DownloadAndInstall');
  },

  /** 用暂存好的新版本重启应用。调用后进程即退出，不会返回。 */
  async restartApp(): Promise<void> {
    await Call.ByName(FQN + 'Restart');
  },

  /**
   * 订阅下载进度事件（updater 广播 written/total 字节数）。
   * @param cb 百分比回调（0-100，-1 表示进度未知/出错）
   * @returns 取消订阅函数
   */
  onDownloadProgress(cb: (percent: number) => void): () => void {
    // Wails v3 事件负载为 `{ data: [...] }` —— Progress 是 data 的首元素
    const cancel = Events.On(EVENT_PROGRESS, (e: unknown) => {
      const ev = e as { data?: unknown } | undefined;
      const d = (Array.isArray(ev?.data) ? ev!.data[0] : ev?.data) as
        | { written?: number; total?: number }
        | undefined;
      if (d && typeof d.written === 'number' && typeof d.total === 'number' && d.total > 0) {
        cb(Math.min(100, Math.round((d.written * 100) / d.total)));
      } else {
        cb(-1);
      }
    });
    return typeof cancel === 'function' ? cancel : () => {};
  },
};
