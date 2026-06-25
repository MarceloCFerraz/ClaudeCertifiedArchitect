export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Compact timestamp for filenames, e.g. 20260624-223105. */
export function stamp(date: Date): string {
  const ymd = `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  const hms = `${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
  return `${ymd}-${hms}`;
}

/** Seconds → clock string. Shows hours only when present: 5:09 or 1:05:09. */
export function fmtTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return hours > 0
    ? `${hours}:${pad2(minutes)}:${pad2(seconds)}`
    : `${pad2(minutes)}:${pad2(seconds)}`;
}
