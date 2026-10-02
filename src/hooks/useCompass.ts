"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { normalize } from "@/domain/angle";
import { headingFromEuler, tiltOf } from "@/lib/heading";

export type CompassAvailability = { ok: true } | { ok: false; reason: string };

export type CompassStatus =
  | { kind: "off" }
  | { kind: "requesting" }
  | { kind: "waiting" }
  /** accuracy：iOS 回报的最大误差度数，负值表示未校准；Android 不提供，为 null。 */
  | { kind: "active"; tilt: number; accuracy: number | null }
  | { kind: "denied" }
  | { kind: "failed" };

type OrientationEventWithCompass = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

type PermissionedOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

const NO_DATA_TIMEOUT_MS = 4000;
const STATUS_INTERVAL_MS = 200;

export function getCompassAvailability(): CompassAvailability {
  if (!window.isSecureContext) return { ok: false, reason: "指南针只能在 HTTPS 网址下使用。" };
  if (!("DeviceOrientationEvent" in window)) return { ok: false, reason: "这个浏览器不支持方位传感器。" };
  if (navigator.maxTouchPoints === 0) return { ok: false, reason: "这台设备没有方位传感器，请用手机打开。" };
  return { ok: true };
}

function screenAngle(): number {
  const legacy = (window as { orientation?: number }).orientation;
  return screen.orientation?.angle ?? legacy ?? 0;
}

/**
 * 读取设备方位。iOS 用 webkitCompassHeading，Android 用 deviceorientationabsolute；两者都以磁北为准。
 * start() 必须在点按事件里同步调用，iOS 才会弹出权限请求。
 */
export function useCompass(onHeading: (heading: number) => void) {
  const [status, setStatus] = useState<CompassStatus>({ kind: "off" });
  const cleanupRef = useRef<(() => void) | null>(null);
  const onHeadingRef = useRef(onHeading);

  useEffect(() => {
    onHeadingRef.current = onHeading;
  });

  const detach = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
  }, []);

  const listen = useCallback(() => {
    setStatus({ kind: "waiting" });
    const absolute = "ondeviceorientationabsolute" in window;
    const type = absolute ? "deviceorientationabsolute" : "deviceorientation";
    let received = false;
    let lastStatusAt = 0;
    let pending: CompassStatus | null = null;
    let flushTimer: number | undefined;
    const flush = () => {
      flushTimer = undefined;
      lastStatusAt = performance.now();
      if (pending) setStatus(pending);
      pending = null;
    };

    const handler = (event: Event) => {
      const e = event as OrientationEventWithCompass;
      let heading: number | null = null;
      if (typeof e.webkitCompassHeading === "number" && !Number.isNaN(e.webkitCompassHeading)) {
        // iOS：以竖屏时手机顶端为准，横放时要加上画面旋转角
        heading = normalize(e.webkitCompassHeading + screenAngle());
      } else if ((absolute || e.absolute) && e.alpha !== null) {
        heading = headingFromEuler(e.alpha, e.beta ?? 0, e.gamma ?? 0, screenAngle());
      }
      if (heading === null) return;
      received = true;
      onHeadingRef.current(heading);

      // 平放与精度状态每 200ms 更新一次就够，最后一笔一定会送出
      pending = {
        kind: "active",
        tilt: tiltOf(e.beta ?? 0, e.gamma ?? 0),
        accuracy: typeof e.webkitCompassAccuracy === "number" ? e.webkitCompassAccuracy : null,
      };
      const wait = STATUS_INTERVAL_MS - (performance.now() - lastStatusAt);
      if (wait <= 0) flush();
      else flushTimer ??= window.setTimeout(flush, wait);
    };

    window.addEventListener(type, handler);
    const timer = window.setTimeout(() => {
      if (received) return;
      detach();
      setStatus({ kind: "failed" });
    }, NO_DATA_TIMEOUT_MS);
    cleanupRef.current = () => {
      window.removeEventListener(type, handler);
      window.clearTimeout(timer);
      window.clearTimeout(flushTimer);
    };
  }, [detach]);

  const start = useCallback(() => {
    detach();
    const DOE = window.DeviceOrientationEvent as PermissionedOrientationEvent | undefined;
    if (typeof DOE?.requestPermission === "function") {
      setStatus({ kind: "requesting" });
      DOE.requestPermission()
        .then((result) => (result === "granted" ? listen() : setStatus({ kind: "denied" })))
        .catch(() => setStatus({ kind: "denied" }));
    } else {
      listen();
    }
  }, [detach, listen]);

  const stop = useCallback(() => {
    detach();
    setStatus({ kind: "off" });
  }, [detach]);

  useEffect(() => detach, [detach]);

  return { status, start, stop };
}
