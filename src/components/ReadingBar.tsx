import { formatDegree } from "@/domain/angle";
import { voidText, type Reading } from "@/domain/reading";

interface Props {
  reading: Reading;
  compass: "off" | "following" | "locked";
  /** 指南针模式下手机没放平，读数不可靠。 */
  unreliable: boolean;
  onToggleLock: () => void;
  onShare: () => void;
}

export function ReadingBar({ reading, compass, unreliable, onToggleLock, onShare }: Props) {
  const warning = voidText(reading);
  const base = `坐${reading.sitting.name}向${reading.facing.name}`;
  const jian = reading.jian ? `兼${reading.jian.sitting.name}${reading.jian.facing.name}` : null;

  return (
    <section
      aria-label="读数"
      className={`reading w-full transition-opacity ${unreliable ? "opacity-45" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
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
      <p role="status" className="mt-1 min-h-6 text-sm font-semibold text-danger">
        {warning && <>⚠ {warning}</>}
        {!warning && unreliable && <span className="text-warn">请平放手机</span>}
      </p>
    </section>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}
