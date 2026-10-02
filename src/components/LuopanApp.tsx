"use client";

import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useRef, useState } from "react";
import { formatDegree, normalize, roundTenth, shortestDelta } from "@/domain/angle";
import { readingAt, sittingFacingText } from "@/domain/reading";
import {
  getCompassAvailability,
  useCompass,
  type CompassAvailability,
} from "@/hooks/useCompass";
import { isIOS, isStandalone, useInstallPrompt } from "@/hooks/useInstall";
import { useWakeLock } from "@/hooks/useWakeLock";
import { FLAT_LIMIT } from "@/lib/heading";
import { loadFlag, loadItem, saveFlag, saveItem } from "@/lib/storage";
import { CompassPanel } from "./CompassPanel";
import { ControlPanel } from "./ControlPanel";
import { DetailPanel } from "./DetailPanel";
import { InstallHint } from "./InstallHint";
import { Luopan } from "./luopan/Luopan";
import { ReadingBar, type CompassState } from "./ReadingBar";
import { Toast, type ToastMessage } from "./Toast";

type Tab = "controls" | "details";

const TABS: readonly [Tab, string][] = [
  ["controls", "操作"],
  ["details", "详情"],
];

const DEFAULT_FACING = 180; // 坐子向午
const ALIGN_MS = 300;
/** 指南针读数的平滑时间常数。 */
const SMOOTHING_MS = 120;

/** 只能在浏览器里取得的环境资料；静态导出的 HTML 里为 null。 */
interface BrowserEnv {
  availability: CompassAvailability;
  ios: boolean;
  showIosHint: boolean;
  reducedMotion: boolean;
}

export function LuopanApp() {
  // 未取模的向度，盘面转 -unwrappedFacing 度
  const [unwrappedFacing, setUnwrappedFacing] = useState(DEFAULT_FACING);
  const facingRef = useRef(DEFAULT_FACING);
  const [compassState, setCompassStateValue] = useState<CompassState>("off");
  const compassRef = useRef<CompassState>("off");
  const [tab, setTab] = useState<Tab>("controls");
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [env, setEnv] = useState<BrowserEnv | null>(null);
  const [calibrationTip, setCalibrationTip] = useState(false);
  const animation = useRef<number | null>(null);
  /** 动画进行中的目标向度（已取模），连按时以它为起点。 */
  const animationTarget = useRef<number | null>(null);
  const lastSampleAt = useRef<number | null>(null);
  /** 切换模式后，原本有焦点的按钮会消失，焦点要交给这个元素。 */
  const focusAfterSwitch = useRef<string | null>(null);
  const install = useInstallPrompt();

  const apply = useCallback((r: number) => {
    facingRef.current = r;
    setUnwrappedFacing(r);
  }, []);

  const setCompassState = (next: CompassState) => {
    compassRef.current = next;
    setCompassStateValue(next);
    lastSampleAt.current = null;
  };

  const showToast = useCallback((text: string) => setToast({ id: Date.now(), text }), []);
  const clearToast = useCallback(() => setToast(null), []);

  const compass = useCompass(
    useCallback(
      (heading: number) => {
        if (compassRef.current !== "following") return;
        const now = performance.now();
        const prev = lastSampleAt.current;
        lastSampleAt.current = now;
        const k = prev === null ? 1 : 1 - Math.exp(-(now - prev) / SMOOTHING_MS);
        const cur = facingRef.current;
        apply(cur + shortestDelta(normalize(cur), heading) * k);
      },
      [apply],
    ),
  );

  /** 停止对准动画；返回动画原本要到达的未取模向度。 */
  const cancelAnimation = (): number => {
    const cur = facingRef.current;
    const target = animationTarget.current;
    if (animation.current !== null) cancelAnimationFrame(animation.current);
    animation.current = null;
    animationTarget.current = null;
    return target === null ? cur : cur + shortestDelta(normalize(cur), target);
  };

  /** 任何手动操作都先退出指南针模式；返回操作应当接着的向度。 */
  const takeManual = (): number => {
    const base = cancelAnimation();
    if (compassRef.current !== "off") {
      compass.stop();
      setCompassState("off");
      showToast("已退出指南针模式");
    }
    return base;
  };

  const alignTo = (target: number, animate = true) => {
    takeManual();
    const from = facingRef.current;
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
    apply(takeManual() + delta);
  };

  const jumpMountain = (dir: 1 | -1) => {
    const r = readingAt(animationTarget.current ?? facingRef.current);
    alignTo(normalize(r.facing.center + dir * 15));
  };

  const startCompass = () => {
    cancelAnimation();
    setCompassState("following");
    setTab("controls");
    focusAfterSwitch.current = "exit-compass";
    compass.start();
    if (!loadFlag("calibration-tip-seen")) {
      setCalibrationTip(true);
      saveFlag("calibration-tip-seen");
    }
  };

  const exitCompass = () => {
    compass.stop();
    setCompassState("off");
    setCalibrationTip(false);
    focusAfterSwitch.current = "start-compass";
  };

  const toggleLock = () => {
    setCompassState(compassRef.current === "locked" ? "following" : "locked");
  };

  const share = async () => {
    const r = readingAt(facingRef.current);
    const url = new URL(window.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("d", r.facingDeg.toFixed(1));
    const link = url.toString();
    if (window.matchMedia("(pointer: coarse)").matches && navigator.share) {
      try {
        await navigator.share({
          title: "风水罗盘",
          text: `${sittingFacingText(r)}（向 ${formatDegree(r.facingDeg)}）`,
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
      showIosHint: ios && !isStandalone() && !loadFlag("ios-hint-dismissed"),
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    });
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [apply]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    }
  }, []);

  // 只记住手动模式下的度数
  useEffect(() => {
    if (compassState !== "off") return;
    const id = window.setTimeout(() => saveItem("facing", roundTenth(unwrappedFacing).toFixed(1)), 400);
    return () => window.clearTimeout(id);
  }, [unwrappedFacing, compassState]);

  // 按下的按钮随模式切换消失时，把焦点交给另一种模式里对应的按钮
  useEffect(() => {
    const id = focusAfterSwitch.current;
    focusAfterSwitch.current = null;
    if (id && (document.activeElement === null || document.activeElement === document.body)) {
      // 不卷动：矮屏幕上卷到按钮会把上方的状态文字卷出画面
      document.getElementById(id)?.focus({ preventScroll: true });
    }
  }, [compassState]);

  useWakeLock(compassState !== "off");

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

  const reading = readingAt(unwrappedFacing);
  const status = compass.status;
  const tilted = compassState === "following" && status.kind === "active" && status.tilt > FLAT_LIMIT;
  const stale = compassState === "following" && (status.kind !== "active" || tilted);

  const selectTab = (next: Tab, focus = false) => {
    setTab(next);
    saveItem("tab", next);
    if (focus) document.getElementById(`tab-${next}`)?.focus();
  };

  // 分页之间用方向键切换；先 preventDefault，全局的方向键就不会转动盘面
  const onTabKeyDown = (e: React.KeyboardEvent) => {
    const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const index = TABS.findIndex(([key]) => key === tab);
    const next =
      e.key === "Home" ? 0 : e.key === "End" ? TABS.length - 1 : (index + (e.key === "ArrowRight" ? 1 : -1) + TABS.length) % TABS.length;
    selectTab(TABS[next][0], true);
  };

  return (
    <main className="app">
      <h1 className="sr-only">风水罗盘</h1>

      <div className="app-luopan">
        <Luopan
          unwrappedFacing={unwrappedFacing}
          facingDeg={reading.facingDeg}
          valueText={`${sittingFacingText(reading)}，向 ${formatDegree(reading.facingDeg)}`}
          springyNeedle={!(env?.reducedMotion ?? true)}
          onDragStart={takeManual}
          onDrag={(delta) => apply(facingRef.current - delta)}
          onAlign={(center) => alignTo(center)}
          onWheelStep={(steps, fine) => nudge(steps * (fine ? 0.1 : 1))}
        />
      </div>

      <div className="app-reading">
        <ReadingBar
          reading={reading}
          compass={compassState}
          stale={stale}
          tilted={tilted}
          onToggleLock={toggleLock}
          onShare={() => void share()}
        />
      </div>

      <section className="app-panel" aria-label="操作与详情">
        <div role="tablist" aria-label="面板" className="tabs">
          {TABS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls={`tabpanel-${key}`}
              tabIndex={tab === key ? 0 : -1}
              onClick={() => selectTab(key)}
              onKeyDown={onTabKeyDown}
              className="tab"
            >
              {label}
            </button>
          ))}
        </div>
        <div
          role="tabpanel"
          id="tabpanel-controls"
          aria-labelledby="tab-controls"
          hidden={tab !== "controls"}
          className="tabpanel"
        >
          {tab === "controls" &&
            (compassState !== "off" ? (
              <CompassPanel
                status={status}
                locked={compassState === "locked"}
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
            ))}
        </div>
        <div
          role="tabpanel"
          id="tabpanel-details"
          aria-labelledby="tab-details"
          hidden={tab !== "details"}
          className="tabpanel"
        >
          {tab === "details" && <DetailPanel sitting={reading.sitting} facing={reading.facing} />}
        </div>
      </section>

      {env?.showIosHint && (
        <InstallHint
          onClose={() => {
            saveFlag("ios-hint-dismissed");
            setEnv({ ...env, showIosHint: false });
          }}
        />
      )}
      <Toast toast={toast} onDone={clearToast} />
    </main>
  );
}
