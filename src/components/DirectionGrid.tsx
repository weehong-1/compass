import { Fragment, type ReactNode } from "react";
import { DIRECTIONS } from "@/domain/trigrams";

interface Props {
  /** 正在寻的方位；没有时为 null。 */
  seek: number | null;
  onSeek: (index: number) => void;
  /** 没有方位传感器就无从寻方。 */
  disabled?: boolean;
  /** 九宫格正中的按钮：手动模式是「开启指南针」，指南针模式是「退出指南针」。 */
  center: ReactNode;
}

// 九宫格，北在上
const GRID: (number | "center")[] = [7, 0, 1, 6, "center", 2, 5, 4, 3];

/** 寻方的九宫格：按下一个方位，盘面会标出它的实际位置。 */
export function DirectionGrid({ seek, onSeek, disabled = false, center }: Props) {
  return (
    <div>
      <h2 className="panel-label">寻方：按方位，盘面会指出它的实际位置</h2>
      <div className="grid grid-cols-3 gap-2">
        {GRID.map((cell) =>
          cell === "center" ? (
            <Fragment key="center">{center}</Fragment>
          ) : (
            <button
              key={cell}
              type="button"
              id={`seek-${cell}`}
              onClick={() => onSeek(cell)}
              disabled={disabled}
              aria-pressed={seek === cell}
              className="grid-button font-serif"
            >
              {DIRECTIONS[cell].name}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
