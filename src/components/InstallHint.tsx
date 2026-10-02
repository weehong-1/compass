/** iOS Safari 不会自己提示安装：第一次打开时教一次「加入主屏幕」。 */
export function InstallHint({ onClose }: { onClose: () => void }) {
  return (
    <div role="dialog" aria-label="加入主屏幕" className="install-hint">
      <p className="flex-1 text-sm">
        加到主屏幕，没网络也能用：点浏览器的
        <ShareGlyph />
        「分享」，再选「加入主屏幕」。
      </p>
      <button type="button" onClick={onClose} className="icon-button" aria-label="关闭提示">
        ✕
      </button>
    </div>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" className="mx-1 inline-block -translate-y-px" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}
