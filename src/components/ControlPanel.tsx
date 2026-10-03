"use client";

import { useState } from "react";
import { normalize } from "@/domain/angle";
import type { CompassAvailability } from "@/hooks/useCompass";
import { DirectionGrid } from "./DirectionGrid";
import { CompassIcon } from "./icons";

interface Props {
  facingDeg: number;
  availability: CompassAvailability | null;
  install: (() => Promise<void>) | null;
  seek: number | null;
  onSeek: (index: number) => void;
  onSlide: (deg: number) => void;
  onNudge: (delta: number) => void;
  onEnter: (deg: number) => void;
  onStartCompass: () => void;
}

export function ControlPanel({
  facingDeg,
  availability,
  install,
  seek,
  onSeek,
  onSlide,
  onNudge,
  onEnter,
  onStartCompass,
}: Props) {
  const compassOk = availability?.ok ?? false;

  return (
    <div className="space-y-5">
      <div>
        <DirectionGrid
          seek={seek}
          onSeek={onSeek}
          disabled={!compassOk}
          center={
            <button
              type="button"
              id="start-compass"
              onClick={onStartCompass}
              disabled={!compassOk}
              className="grid-button grid-button-compass"
            >
              <CompassIcon />
              <span>开启指南针</span>
            </button>
          }
        />
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
          <DegreeInput facingDeg={facingDeg} onEnter={onEnter} />
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

/** 编辑时显示草稿，不编辑时显示当前向度；不随度数重建，焦点才不会丢。 */
function DegreeInput({ facingDeg, onEnter }: { facingDeg: number; onEnter: (deg: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);

  const commit = (keepEditing: boolean) => {
    if (draft === null) return;
    const text = draft.trim().replace(/°$/, "");
    const value = Number(text);
    if (text === "" || !Number.isFinite(value) || value < 0 || value > 360) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    if (!keepEditing) setDraft(null);
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
        value={draft ?? facingDeg.toFixed(1)}
        aria-invalid={invalid}
        aria-describedby={invalid ? "facing-input-error" : undefined}
        onChange={(e) => {
          setDraft(e.target.value);
          setInvalid(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit(true);
        }}
        onBlur={() => commit(false)}
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
