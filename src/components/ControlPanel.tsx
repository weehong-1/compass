"use client";

import { useState } from "react";
import { normalize } from "@/domain/angle";
import { DIRECTIONS, directionAt } from "@/domain/trigrams";
import type { CompassAvailability } from "@/hooks/useCompass";

interface Props {
  facingDeg: number;
  availability: CompassAvailability | null;
  install: (() => Promise<void>) | null;
  onDirection: (center: number) => void;
  onSlide: (deg: number) => void;
  onNudge: (delta: number) => void;
  onEnter: (deg: number) => void;
  onStartCompass: () => void;
}

// 九宫格，北在上；中间一格是开启指南针
const GRID: (number | "compass")[] = [7, 0, 1, 6, "compass", 2, 5, 4, 3];

export function ControlPanel({
  facingDeg,
  availability,
  install,
  onDirection,
  onSlide,
  onNudge,
  onEnter,
  onStartCompass,
}: Props) {
  const current = directionAt(facingDeg).index;
  const compassOk = availability?.ok ?? false;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="panel-label">按方位对准向</h2>
        <div className="grid grid-cols-3 gap-2">
          {GRID.map((cell) =>
            cell === "compass" ? (
              <button
                key="compass"
                type="button"
                onClick={onStartCompass}
                disabled={!compassOk}
                className="grid-button grid-button-compass"
              >
                <CompassIcon />
                <span>指南针</span>
              </button>
            ) : (
              <button
                key={cell}
                type="button"
                onClick={() => onDirection(DIRECTIONS[cell].center)}
                aria-pressed={current === cell}
                className="grid-button font-serif"
              >
                {DIRECTIONS[cell].name}
              </button>
            ),
          )}
        </div>
        {availability && !availability.ok && (
          <p className="mt-2 text-xs text-muted">{availability.reason}</p>
        )}
      </div>

      <div>
        <label htmlFor="facing-slider" className="panel-label">
          拖动调整向度
        </label>
        <input
          id="facing-slider"
          type="range"
          min={0}
          max={359.9}
          step={0.1}
          value={facingDeg}
          onChange={(e) => onSlide(Number(e.target.value))}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-muted tabular-nums" aria-hidden="true">
          <span>0°</span>
          <span>90°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </div>
      </div>

      <div>
        <label htmlFor="facing-input" className="panel-label">
          输入向度
        </label>
        <div className="flex items-stretch gap-2">
          <button type="button" className="step-button" onClick={() => onNudge(-1)} aria-label="向度减 1 度">
            −1°
          </button>
          {/* 换了外部度数就重建，草稿跟着重置 */}
          <DegreeInput key={facingDeg} facingDeg={facingDeg} onEnter={onEnter} />
          <button type="button" className="step-button" onClick={() => onNudge(1)} aria-label="向度加 1 度">
            +1°
          </button>
        </div>
      </div>

      {install && (
        <button type="button" onClick={() => void install()} className="w-full text-center text-sm text-muted underline underline-offset-4">
          安装到主屏幕
        </button>
      )}
    </div>
  );
}

function DegreeInput({ facingDeg, onEnter }: { facingDeg: number; onEnter: (deg: number) => void }) {
  const [draft, setDraft] = useState(facingDeg.toFixed(1));
  const [invalid, setInvalid] = useState(false);

  const commit = () => {
    const text = draft.trim().replace(/°$/, "");
    const value = Number(text);
    if (text === "" || !Number.isFinite(value) || value < 0 || value > 360) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (Math.abs(normalize(value) - facingDeg) > 0.01) onEnter(normalize(value));
  };

  return (
    <div className="relative flex-1">
      <input
        id="facing-input"
        type="text"
        inputMode="decimal"
        enterKeyHint="go"
        autoComplete="off"
        value={draft}
        aria-invalid={invalid}
        aria-describedby={invalid ? "facing-input-error" : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
        onBlur={commit}
        className="degree-input"
      />
      <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted">°</span>
      {invalid && (
        <p id="facing-input-error" className="absolute top-full mt-1 text-xs text-danger">
          请输入 0 到 360 之间的度数
        </p>
      )}
    </div>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
