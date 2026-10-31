/**
 * Runs `callback` once the browser has painted the next frame, so that a
 * pending state set just before is on screen before slow work, like a query
 * or reading a package, holds the main thread.
 *
 * `requestAnimationFrame` runs right before that frame is painted, and a task
 * queued from it runs right after. A hidden page paints no frame, so there it
 * runs on the next task. Returns a function that cancels it.
 */
export function afterNextPaint(callback: () => void) {
  if (document.visibilityState === "hidden") {
    const timeout = window.setTimeout(callback, 0);
    return () => window.clearTimeout(timeout);
  }

  let timeout: number | undefined;
  const frame = window.requestAnimationFrame(() => {
    timeout = window.setTimeout(callback, 0);
  });
  return () => {
    window.cancelAnimationFrame(frame);
    window.clearTimeout(timeout);
  };
}
