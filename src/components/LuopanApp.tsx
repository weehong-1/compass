"use client";

import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { formatDegree, normalize, roundTenth, shortestDelta } from "@/domain/angle";
import { readingAt, zuoXiangText } from "@/domain/reading";
import {
  getCompassAvailability,
  useCompass,
  type CompassAvailability,
} from "@/hooks/useCompass";
import { isIOS, isStandalone, useInstallPrompt } from "@/hooks/useInstall";
import { useWakeLock } from "@/hooks/useWakeLock";
import { FLAT_LIMIT } from "@/lib/heading";
import { loadItem, saveItem } from "@/lib/storage";
import { CompassPanel } from "./CompassPanel";
import { ControlPanel } from "./ControlPanel";
import { DetailPanel } from "./DetailPanel";
import { InstallHint } from "./InstallHint";
import { Luopan } from "./luopan/Luopan";
import { ReadingBar } from "./ReadingBar";
import { Toast, type ToastMessage } from "./Toast";

type Mode = "manual" | "compass";
type Tab = "controls" | "details";

const DEFAULT_FACING = 180; // 坐子向午
const ALIGN_MS = 300;
/** 指南针读数的平滑时间常数。 */
const SMOOTHING_MS = 120;

interface Env {
  availability: CompassAvailability;
  ios: boolean;
  showIosHint: boolean;
  reducedMotion: boolean;
}

export function LuopanApp() {
  // 未取模的向度，盘面转 -rotation 度
  const [rotation, setRotation] = useState(DEFAULT_FACING);
  const rotationRef = useRef(DEFAULT_FACING);
  const [mode, setMode] = useState<Mode>("manual");
  const modeRef = useRef<Mode>("manual");
  const [locked, setLocked] = useState(false);
  const lockedRef = useRef(false);
  const [tab, setTab] = useState<Tab>("controls");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [env, setEnv] = useState<Env | null>(null);
  const [calibrationTip, setCalibrationTip] = useState(false);
  const animation = useRef<number | null>(null);
  /** 动画进行中的目标向度（已取模），连按时以它为起点。 */
  const animationTarget = useRef<number | null>(null);
  const lastSampleAt = useRef<number | null>(null);
  const install = useInstallPrompt();

  const apply = useCallback((r: number) => {
    rotationRef.current = r;
    setRotation(r);
  }, []);

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const clearToast = useCallback(() => setToast(null), []);

  const compass = useCompass(
    useCallback(
      (heading: number) => {
        if (modeRef.current !== "compass" || lockedRef.current) return;
        const now = performance.now();
        const prev = lastSampleAt.current;
        lastSampleAt.current = now;
        const k = prev === null ? 1 : 1 - Math.exp(-(now - prev) / SMOOTHING_MS);
        const cur = rotationRef.current;
        apply(cur + shortestDelta(normalize(cur), heading) * k);
      },
      [apply],
    ),
  );

  const setCompassMode = (next: Mode) => {
    modeRef.current = next;
    setMode(next);
    lockedRef.current = false;
    setLocked(false);
    lastSampleAt.current = null;
  };

  const cancelAnimation = () => {
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    animationTarget.current = null;
  };

  /** 任何手动操作都先退出指南针模式。 */
  const takeManual = () => {
    cancelAnimation();
    if (modeRef.current === "compass") {
      compass.stop();
      setCompassMode("manual");
      showToast("已退出指南针模式");
    }
  };

  const alignTo = (target: number, animate = true) => {
    takeManual();
    const from = rotationRef.current;
    const to = from + shortestDelta(normalize(from), target);
    if (!animate || env?.reducedMotion || Math.abs(to - from) < 0.05) {
      apply(to);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / ALIGN_MS);
      apply(from + (to - from) * (1 - (1 - p) ** 3));
      if (p < 1) animation.current = requestAnimationFrame(step);
      else cancelAnimation();
    };
    animationTarget.current = normalize(target);
    animation.current = requestAnimationFrame(step);
  };

  const nudge = (delta: number) => {
    takeManual();
    apply(rotationRef.current + delta);
  };

  const jumpMountain = (dir: 1 | -1) => {
    const r = readingAt(animationTarget.current ?? rotationRef.current);
    alignTo(normalize(r.facing.center + dir * 15));
  };

  const startCompass = () => {
    cancelAnimation();
    setCompassMode("compass");
    setTab("controls");
    compass.start();
    if (loadItem("calibration-tip-seen") !== "1") {
      setCalibrationTip(true);
      saveItem("calibration-tip-seen", "1");
    }
  };

  const exitCompass = () => {
    compass.stop();
    setCompassMode("manual");
    setCalibrationTip(false);
  };

  const toggleLock = () => {
    const next = !lockedRef.current;
    lockedRef.current = next;
    setLocked(next);
    lastSampleAt.current = null;
  };

  const share = async () => {
    const r = readingAt(rotationRef.current);
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("d", r.facingDeg.toFixed(1));
    const link = url.toString();
    if (window.matchMedia("(pointer: coarse)").matches && navigator.share) {
      try {
        await navigator.share({
          title: "风水罗盘",
          text: `${zuoXiangText(r)}（向 ${formatDegree(r.facingDeg)}）`,
          url: link,
        });
      } catch {
        // 使用者取消分享
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      showToast("链接已复制");
    } catch {
      window.prompt("复制这个链接：", link);
    }
  };

  // 打开时：分享链接的度数优先，其次是本机记住的度数
  useLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("d");
    let initial: number | null = null;
    if (shared !== null && shared.trim() !== "" && Number.isFinite(Number(shared))) {
      initial = normalize(Number(shared));
      window.history.replaceState(null, "", window.location.pathname + window.location.hash);
    } else {
      const saved = Number(loadItem("facing") ?? NaN);
      if (Number.isFinite(saved)) initial = normalize(saved);
    }
    const savedTab = loadItem("tab");
    const ios = isIOS();
    // 浏览器环境只能在挂载后读取，静态导出的 HTML 先用默认值；在绘制前套用，画面不会闪
    /* eslint-disable react-hooks/set-state-in-effect */
    if (initial !== null) apply(initial);
    if (savedTab === "controls" || savedTab === "details") setTab(savedTab);
    setEnv({
      availability: getCompassAvailability(),
      ios,
      showIosHint: ios && !isStandalone() && loadItem("ios-hint-dismissed") !== "1",
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [apply]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // 只记住手动模式下的度数
  useEffect(() => {
    if (mode !== "manual") return;
    const id = window.setTimeout(() => saveItem("facing", roundTenth(rotation).toFixed(1)), 400);
    return () => window.clearTimeout(id);
  }, [rotation, mode]);

  useWakeLock(mode === "compass");

  const onKeyDown = useEffectEvent((e: KeyboardEvent) => {
    if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    const t = e.target;
    if (t instanceof HTMLInputElement && t.type !== "range") return;
    if (t instanceof HTMLTextAreaElement || (t instanceof HTMLElement && t.isContentEditable)) return;
    const fine = e.shiftKey ? 0.1 : 1;
    if (e.key === "ArrowRight") nudge(fine);
    else if (e.key === "ArrowLeft") nudge(-fine);
    else if (e.key === "ArrowUp") jumpMountain(1);
    else if (e.key === "ArrowDown") jumpMountain(-1);
    else return;
    e.preventDefault();
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKeyDown(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const reading = readingAt(rotation);
  const status = compass.status;
  const unreliable =
    mode === "compass" && !locked && (status.kind !== "active" || status.tilt > FLAT_LIMIT);

  const selectTab = (next: Tab) => {
    setTab(next);
    saveItem("tab", next);
  };

  return (
    <main className="app">
      <h1 className="sr-only">风水罗盘</h1>

      <div className="app-luopan">
        <Luopan
          rotation={rotation}
          label={`罗盘，当前${zuoXiangText(reading)}`}
          springyNeedle={!(env?.reducedMotion ?? true)}
          onDragStart={takeManual}
          onDrag={(delta) => apply(rotationRef.current - delta)}
          onAlign={(center) => alignTo(center)}
          onWheelStep={(steps, fine) => nudge(steps * (fine ? 0.1 : 1))}
        />
      </div>

      <div className="app-reading">
        <ReadingBar
          reading={reading}
          compass={mode === "compass" ? (locked ? "locked" : "following") : "off"}
          unreliable={unreliable}
          onToggleLock={toggleLock}
          onShare={() => void share()}
        />
      </div>

      <section className="app-panel" aria-label="操作与详情">
        <div role="tablist" aria-label="面板" className="tabs">
          {(
            [
              ["controls", "操作"],
              ["details", "详情"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`tabpanel-${key}`}
              onClick={() => selectTab(key)}
              className="tab"
            >
              {label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id={`tabpanel-${tab}`}
          aria-labelledby={`tab-${tab}`}
          className="tabpanel"
        >
          {tab === "details" ? (
            <DetailPanel sitting={reading.sitting} facing={reading.facing} />
          ) : mode === "compass" ? (
            <CompassPanel
              status={status}
              locked={locked}
              ios={env?.ios ?? false}
              showCalibrationTip={calibrationTip}
              onToggleLock={toggleLock}
              onRetry={startCompass}
              onExit={exitCompass}
            />
          ) : (
            <ControlPanel
              facingDeg={reading.facingDeg}
              availability={env?.availability ?? null}
              install={install}
              onDirection={(center) => alignTo(center)}
              onSlide={(deg) => alignTo(deg, false)}
              onNudge={nudge}
              onEnter={(deg) => alignTo(deg)}
              onStartCompass={startCompass}
            />
          )}
        </div>
      </section>

      {env?.showIosHint && (
        <InstallHint
          onClose={() => {
            saveItem("ios-hint-dismissed", "1");
            setEnv({ ...env, showIosHint: false });
          }}
        />
      )}
      <Toast toast={toast} onDone={clearToast} />
    </main>
  );
}
