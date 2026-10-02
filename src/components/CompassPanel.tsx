import type { CompassStatus } from "@/hooks/useCompass";
import { FLAT_LIMIT } from "@/lib/heading";

interface Props {
  status: CompassStatus;
  locked: boolean;
  ios: boolean;
  /** Android 不提供精度：只在第一次开启时提醒校准方法。 */
  showCalibrationTip: boolean;
  onToggleLock: () => void;
  onRetry: () => void;
  onExit: () => void;
}

export function CompassPanel({
  status,
  locked,
  ios,
  showCalibrationTip,
  onToggleLock,
  onRetry,
  onExit,
}: Props) {
  return (
    <div className="space-y-4">
      {status.kind === "active" && (
        <>
          <button
            type="button"
            onClick={onToggleLock}
            aria-pressed={locked}
            className={`lock-button ${locked ? "lock-button-on" : ""}`}
          >
            {locked ? "🔓 解锁，继续跟随" : "🔒 锁定读数"}
          </button>
          <ul className="space-y-2 text-sm">
            <FlatRow tilt={status.tilt} />
            <AccuracyRow accuracy={status.accuracy} />
          </ul>
          {showCalibrationTip && status.accuracy === null && (
            <p className="rounded-lg bg-surface-2 p-3 text-sm text-muted">
              读数不稳或明显不对时，请拿着手机在空中画几次「8」字来校准，并远离铁器、磁铁和电器。
            </p>
          )}
        </>
      )}

      {(status.kind === "off" || status.kind === "requesting") && (
        <p className="text-sm text-muted">正在请求使用方位传感器……</p>
      )}

      {status.kind === "waiting" && (
        <p className="text-sm text-muted">正在取得方位，请把手机平放。</p>
      )}

      {status.kind === "denied" && (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-danger">没有获得使用方位传感器的权限。</p>
          {ios ? (
            <p className="text-muted">
              请完全关闭 Safari（或主屏幕上的罗盘）后重新打开，再按「开启指南针」，并在弹窗中选「允许」。
            </p>
          ) : (
            <p className="text-muted">
              请点网址栏左侧的图标，打开「网站设置」，允许「动作传感器」后再试一次。
            </p>
          )}
          <button type="button" onClick={onRetry} className="secondary-button">
            再试一次
          </button>
        </div>
      )}

      {status.kind === "failed" && (
        <div className="space-y-2 text-sm">
          <p className="font-semibold text-danger">收不到方位数据。</p>
          <p className="text-muted">这台设备可能没有电子罗盘，或者浏览器不提供方位数据。</p>
          <button type="button" onClick={onRetry} className="secondary-button">
            再试一次
          </button>
        </div>
      )}

      <button type="button" onClick={onExit} className="secondary-button w-full">
        退出指南针
      </button>
    </div>
  );
}

function FlatRow({ tilt }: { tilt: number }) {
  const flat = tilt <= FLAT_LIMIT;
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted">平放</span>
      <span className={flat ? "text-ok" : "font-semibold text-warn"}>
        {flat ? "✓ 已平放" : `请平放手机（倾斜 ${Math.round(tilt)}°）`}
      </span>
    </li>
  );
}

function AccuracyRow({ accuracy }: { accuracy: number | null }) {
  let text: string;
  let tone: string;
  if (accuracy === null) {
    text = "此设备不提供";
    tone = "text-muted";
  } else if (accuracy < 0) {
    text = "未校准：请拿手机在空中画「8」字";
    tone = "font-semibold text-danger";
  } else if (accuracy <= 10) {
    text = `±${Math.round(accuracy)}°（好）`;
    tone = "text-ok";
  } else if (accuracy <= 25) {
    text = `±${Math.round(accuracy)}°（一般）`;
    tone = "text-warn";
  } else {
    text = `±${Math.round(accuracy)}°（差），请画「8」字校准`;
    tone = "font-semibold text-danger";
  }
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="text-muted">精度</span>
      <span className={tone}>{text}</span>
    </li>
  );
}
