const pad2 = (n: number): string => String(n).padStart(2, '0');

export const fmtDate = (d: Date): string =>
  `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;

export const fmtTime = (d: Date): string =>
  `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;

export const fmtHM = (v: string | number): string => {
  if (!v) return '';
  const t = String(v).trim().replace('.', ':');
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));

  if (!Number.isFinite(h)) return '';

  const hh = pad2(Math.max(0, Math.min(23, h)));
  const mm = pad2(Number.isFinite(m) ? Math.max(0, Math.min(59, m)) : 0);
  return `${hh}:${mm}`;
};
