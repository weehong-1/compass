import { formatDegree } from "@/domain/angle";
import { sittingFacingParts, voidText, type Reading } from "@/domain/reading";
import { seekText, type SeekGuide } from "@/domain/seek";
import { ShareIcon } from "./icons";

/** 指南针模式的状态：关闭、跟随实际方位、已锁定。 */
export type CompassState = "off" | "following" | "locked";

interface Props {
  reading: Reading;
  compass: CompassState;
  /** 指南针模式下读数尚未可靠（还没收到方位，或手机没放平），读数变灰。 */
  stale: boolean;
  /** 手机倾斜超过限度，要提示平放。 */
  tilted: boolean;
  /** 指南针模式下寻方的指引；没有在寻方时为 null。 */
  guide: SeekGuide | null;
  onToggleLock: () => void;
  onShare: () => void;
}

export function ReadingBar({ reading, compass, stale, tilted, guide, onToggleLock, onShare }: Props) {
  const warning = voidText(reading);
  const { base, jian } = sittingFacingParts(reading);

  return (
    <section aria-label="读数" className="reading w-full">
      <div className="flex items-start gap-3">
        <div className={`min-w-0 flex-1 transition-opacity ${stale ? "opacity-45" : ""}`}>
          <p aria-live="polite" className="font-serif text-[1.65rem] leading-tight font-bold tracking-wide">
            {base}
            {jian && <span className="text-accent">{jian}</span>}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted tabular-nums">
            <span>
              向 <b className="font-semibold text-ink">{formatDegree(reading.facingDeg)}</b>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              坐 <b className="font-semibold text-ink">{formatDegree(reading.sittingDeg)}</b>
            </span>
            <span aria-hidden="true">·</span>
            <span>磁北</span>
            <span
              className={`rounded-full px-2 py-px text-xs font-medium ${
                jian ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok"
              }`}
            >
              {jian ? "兼向" : "正向"}
            </span>
          </p>
        </div>
        <div className="flex flex-none items-center gap-2 pt-1">
          {compass !== "off" && (
            <button
              type="button"
              onClick={onToggleLock}
              aria-pressed={compass === "locked"}
              className={`chip ${compass === "locked" ? "chip-on" : ""}`}
            >
              {compass === "locked" ? "已锁定" : "跟随中"}
            </button>
          )}
          <button type="button" onClick={onShare} className="icon-button" aria-label="分享这个坐向">
            <ShareIcon />
          </button>
        </div>
      </div>
      {guide && (
        // 指引随手机转动不停变化，不放进 role=status，免得读屏软件念个不停
        <p
          className={`mt-2 inline-flex rounded-full px-3 py-1 font-semibold tabular-nums transition-opacity ${
            guide.onTarget ? "bg-ok-soft text-ok" : "bg-seek-soft text-seek"
          } ${stale ? "opacity-45" : ""}`}
        >
          {guide.onTarget && <span aria-hidden="true">✓&nbsp;</span>}
          {seekText(guide)}
        </p>
      )}
      <p role="status" className="mt-1 flex min-h-6 flex-wrap gap-x-3 text-sm font-semibold">
        {guide?.onTarget && <span className="sr-only">{seekText(guide)}</span>}
        {warning && <span className="text-danger">⚠ {warning}</span>}
        {tilted && <span className="text-warn">请平放手机</span>}
      </p>
    </section>
  );
}
