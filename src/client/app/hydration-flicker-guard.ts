const initialHydrationTasks = new Set<Promise<unknown>>();

function resolveWindow(win?: Window) {
  if (win) {
    return win;
  }
  return typeof window !== 'undefined' ? window : undefined;
}

function nextFrame(win?: Window) {
  const targetWindow = resolveWindow(win);
  if (!targetWindow?.requestAnimationFrame) {
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    targetWindow.requestAnimationFrame(() => resolve());
  });
}

async function waitForInitialHydrationTasks() {
  while (initialHydrationTasks.size > 0) {
    await Promise.allSettled(Array.from(initialHydrationTasks));
  }
}

export function isBodyHydrationRevealed(win?: Window) {
  return resolveWindow(win)?.document.body.dataset.ranklandHydrated === 'true';
}

export function shouldDeferInitialHydrationRender() {
  const targetWindow = resolveWindow();
  return !!targetWindow && !isBodyHydrationRevealed(targetWindow);
}

export function registerInitialHydrationTask(task: Promise<unknown>) {
  if (!shouldDeferInitialHydrationRender()) {
    return;
  }
  let wrappedTask: Promise<unknown>;
  wrappedTask = task.finally(() => {
    initialHydrationTasks.delete(wrappedTask);
  });
  initialHydrationTasks.add(wrappedTask);
}

export async function revealBodyAfterInitialHydration(win?: Window) {
  const targetWindow = resolveWindow(win);
  if (!targetWindow || isBodyHydrationRevealed(targetWindow)) {
    return;
  }
  await nextFrame(targetWindow);
  await waitForInitialHydrationTasks();
  await nextFrame(targetWindow);
  targetWindow.document.body.style.opacity = '1';
  targetWindow.document.body.dataset.ranklandHydrated = 'true';
}

export function waitForInitialHydrationFrame(win?: Window) {
  return nextFrame(win);
}
