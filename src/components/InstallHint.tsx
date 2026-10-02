import { ShareIcon } from "./icons";

/** iOS Safari 不会自己提示安装：第一次打开时教一次「加入主屏幕」。 */
export function InstallHint({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-label="加入主屏幕" className="install-hint">
      <p className="flex-1 text-sm">
        加到主屏幕，没网络也能用：点浏览器的
        <ShareIcon size={16} className="mx-1 inline-block -translate-y-px" />
        「分享」，再选「加入主屏幕」。
      </p>
      <button type="button" onClick={onClose} className="icon-button" aria-label="关闭提示">
        ✕
      </button>
    </div>
  );
}
