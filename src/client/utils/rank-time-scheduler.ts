export function scheduleRankTimeCalculation(task: () => void, win = resolveWindow()) {
  const runAfterFrame = win?.setTimeout ? win.setTimeout.bind(win) : setTimeout;

  if (win?.requestAnimationFrame) {
    win.requestAnimationFrame(() => {
      runAfterFrame(task, 0);
    });
    return;
  }

  runAfterFrame(task, 0);
}

function resolveWindow() {
  return typeof window === 'undefined' ? undefined : window;
}
