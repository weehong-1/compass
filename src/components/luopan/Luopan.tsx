"use client";

import { useEffect, useRef } from "react";
import { shortestDelta } from "@/domain/angle";
import { Base } from "./Base";
import { Dial } from "./Dial";
import { Needle } from "./Needle";
import { Overlay } from "./Overlay";
import { VIEW, hitTest } from "./geometry";

const TAP_SLOP_PX = 8;
const WHEEL_STEP_PX = 60;

export interface LuopanProps {
  /** 未取模的向度：盘面转 -rotation 度，跨过 0° 时不会倒转一圈。 */
  rotation: number;
  label: string;
  /** 磁针有惯性地跟上盘面；减少动态效果时关掉。 */
  springyNeedle: boolean;
  onDragStart: () => void;
  /** 手指在画面上顺时针转了 delta 度。 */
  onDrag: (delta: number) => void;
  /** 点了某一格，要把该格中线对准向线。 */
  onAlign: (center: number) => void;
  /** 滚轮转了一格；正值为向度增加。 */
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
  rotation,
  label,
  springyNeedle,
  onDragStart,
  onDrag,
  onAlign,
  onWheelStep,
}: LuopanProps) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const rotationRef = useRef(rotation);
  const wheelRef = useRef(onWheelStep);

  useEffect(() => {
    rotationRef.current = rotation;
    wheelRef.current = onWheelStep;
  });

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
    const hit = hitTest(p.radius, p.angle, rotationRef.current);
    if (hit) onAlign(hit.center);
  };

  const onPointerCancel = (e: React.PointerEvent) => {
    if (drag.current?.pointerId === e.pointerId) drag.current = null;
  };

  // 滚轮要能 preventDefault，React 的 onWheel 是 passive，所以自己挂
  useEffect(() => {
    const el = ref.current!;
    let acc = 0;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const px = (e.deltaY || e.deltaX) * (e.deltaMode === 1 ? 40 : 1);
      acc += px;
      const steps = Math.trunc(acc / WHEEL_STEP_PX) || (Math.abs(px) >= WHEEL_STEP_PX ? Math.sign(px) : 0);
      if (steps !== 0) {
        acc = 0;
        wheelRef.current(steps, e.shiftKey);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const transform = `rotate(${-rotation}deg)`;

  return (
    <div
      ref={ref}
      role="img"
      aria-label={label}
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
