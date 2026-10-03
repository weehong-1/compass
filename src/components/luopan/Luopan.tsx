"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { shortestDelta } from "@/domain/angle";
import { Base } from "./Base";
import { Dial } from "./Dial";
import { Needle } from "./Needle";
import { Overlay } from "./Overlay";
import { SeekMarker } from "./SeekMarker";
import { VIEW, centerAtPoint } from "./geometry";

const TAP_SLOP_PX = 8;
const WHEEL_STEP_PX = 60;

export interface LuopanProps {
  /** 未取模的向度：盘面转 -unwrappedFacing 度，跨过 0° 时不会倒转一圈。 */
  unwrappedFacing: number;
  /** 当前向度（0.1° 精度），给辅助技术用。 */
  facingDeg: number;
  /** 读屏软件念出的读数，例如「坐子向午，向 180.0°」。 */
  valueText: string;
  /** 磁针有惯性地跟上盘面；减少动态效果时关掉。 */
  springyNeedle: boolean;
  /** 寻方目标方位的中线；没有在寻方时为 null。 */
  seekCenter: number | null;
  onDragStart: () => void;
  /** 手指在画面上顺时针转了 delta 度。 */
  onDrag: (delta: number) => void;
  /** 点了某一格，要把该格中线转到天心十道上方（向）。 */
  onAlign: (center: number) => void;
  /** 滚轮转了几格；正值为向度增加。 */
  onWheelStep: (steps: number, fine: boolean) => void;
}

interface DragState {
  pointerId: number;
  startX: number;
  startY: number;
  lastAngle: number | null;
  moved: boolean;
}

export function Luopan({
  unwrappedFacing,
  facingDeg,
  valueText,
  springyNeedle,
  seekCenter,
  onDragStart,
  onDrag,
  onAlign,
  onWheelStep,
}: LuopanProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);

  /** 指针相对罗盘中心的极坐标：radius 以 viewBox 单位计，angle 自上方顺时针。 */
  const polarOf = (clientX: number, clientY: number) => {
    const rect = ref.current!.getBoundingClientRect();
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const scale = VIEW / rect.width;
    return {
      radius: Math.hypot(dx, dy) * scale,
      angle: (Math.atan2(dx, -dy) * 180) / Math.PI,
    };
  };

  // 太靠近中心时角度跳动大，不拿来算转动
  const usableAngle = (clientX: number, clientY: number) => {
    const p = polarOf(clientX, clientY);
    return p.radius < 70 ? null : p.angle;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (drag.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      lastAngle: usableAngle(e.clientX, e.clientY),
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < TAP_SLOP_PX) return;
      d.moved = true;
      onDragStart();
    }
    const angle = usableAngle(e.clientX, e.clientY);
    if (angle !== null && d.lastAngle !== null) onDrag(shortestDelta(d.lastAngle, angle));
    d.lastAngle = angle;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    drag.current = null;
    if (d.moved) return;
    const p = polarOf(e.clientX, e.clientY);
    const center = centerAtPoint(p.radius, p.angle, unwrappedFacing);
    if (center !== null) onAlign(center);
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  };

  const onWheel = useEffectEvent((e: WheelEvent, acc: { px: number }) => {
    e.preventDefault();
    const px = (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 40 : 1);
    acc.px += px;
    const steps = Math.trunc(acc.px / WHEEL_STEP_PX);
    if (steps !== 0) {
      acc.px = 0;
      onWheelStep(steps, e.shiftKey);
    }
  });

  // 滚轮要能 preventDefault，React 的 onWheel 是 passive，所以自己挂
  useEffect(() => {
    const el = ref.current!;
    const acc = { px: 0 };
    const handler = (e: WheelEvent) => onWheel(e, acc);
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const transform = `rotate(${-unwrappedFacing}deg)`;

  return (
    // 罗盘本身就是一个转盘式的 slider：方向键由全局键盘处理调整向度
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label="罗盘"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={facingDeg}
      aria-valuetext={valueText}
      className="luopan relative aspect-square w-full touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Base />
      <div className="absolute inset-0 will-change-transform" style={{ transform }}>
        <Dial />
        {seekCenter !== null && <SeekMarker center={seekCenter} />}
      </div>
      <div
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{
          transform,
          transition: springyNeedle ? "transform 650ms cubic-bezier(0.25, 1.65, 0.45, 1)" : undefined,
        }}
      >
        <Needle />
      </div>
      <Overlay />
    </div>
  );
}
