// 本机偏好：读写失败（隐私模式、被封锁）时当作没有存过。

const PREFIX = "luopan:";

/** 存在本机的项目：手动模式的向度、所选分页，以及只需显示一次的提示。 */
export type StorageKey = "facing" | "tab" | "ios-hint-dismissed" | "calibration-tip-seen";

export function loadItem(key: StorageKey): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function saveItem(key: StorageKey, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // 存不了就算了
  }
}

export function loadFlag(key: StorageKey): boolean {
  return loadItem(key) === "1";
}

export function saveFlag(key: StorageKey): void {
  saveItem(key, "1");
}
