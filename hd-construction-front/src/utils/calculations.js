export const TARGET_QUEUE = 2;

export function getQueueError(queue, target = TARGET_QUEUE) {
  return Math.max(0, Number(queue || 0) - target);
}

export function getRelativeErrorPercent(queue, target = TARGET_QUEUE) {
  const safeTarget = Math.max(1, Number(target || TARGET_QUEUE));
  return Math.round((getQueueError(queue, safeTarget) / safeTarget) * 100);
}

export function formatPercent(value) {
  return `${Math.round(Number(value || 0))}%`;
}
