// 本机偏好：读写失败（隐私模式、被封锁）时当作没有存过。

const PREFIX = "luopan:";

export function loadItem(key: string): string | null {
  try {
    return window.localStorage.getItem(PREFIX + key);
  } catch {
    return null;
  }
}

export function saveItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(PREFIX + key, value);
  } catch {
    // 存不了就算了
  }
}
