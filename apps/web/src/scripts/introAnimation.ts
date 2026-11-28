const FALLBACK_IMG_WIDTH = 1011;
const FALLBACK_IMG_HEIGHT = 681;

const WATERLINE_RATIO = 0.435;
const UNDERWATER_FOCAL_RATIO = 0.68;
const VIEWPORT_START_RATIO = 0.72;
const VIEWPORT_END_RATIO = 0.45;

const OVERSCAN_SCALE = 1.08;
const LANDSCAPE_MIN_HEIGHT_MULT = 1.25;
const PORTRAIT_HEIGHT_MULT = 1.65;
const LANDSCAPE_ZOOM_END = 1.42;
const PORTRAIT_ZOOM_END = 1.48;

const SESSION_KEY = "portfolio_intro_seen";
const LINE_1_TEXT = "You didn't land here by accident.";
const LINE_2_TEXT = "The real story lies beneath the surface.";

// Strictly <= 5000ms timeline (milliseconds)
const T_LINE1_START = 100;
const T_LINE1_TYPING_END = 1450;
const T_DESCENT_START = 1550;
const T_LINE1_HIDE = 1750;
const T_LINE2_START = 2050;
const T_DESCENT_END = 3200;
const T_LINE2_TYPING_END = 3400;
const T_EXIT_START = 4350;
const T_COMPLETE = 4950;

// Reduced-motion calm fade <= 1500ms
const REDUCED_EXIT_START = 450;
const REDUCED_COMPLETE = 1000;

interface GeometryMetrics {
  vpWidth: number;
  vpHeight: number;
  baseWidth: number;
  baseHeight: number;
  zoomEnd: number;
  yStart: number;
  yEnd: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 3);
}

function getViewportSize(): { width: number; height: number } {
  const vv = window.visualViewport;
  const width = Math.max(1, vv ? vv.width : window.innerWidth);
  const height = Math.max(1, vv ? vv.height : window.innerHeight);
  return { width, height };
}

function getImageNaturalSize(img: HTMLImageElement): { imgWidth: number; imgHeight: number } {
  const imgWidth = img.naturalWidth > 0 ? img.naturalWidth : FALLBACK_IMG_WIDTH;
  const imgHeight = img.naturalHeight > 0 ? img.naturalHeight : FALLBACK_IMG_HEIGHT;
  return { imgWidth, imgHeight };
}

function computeGeometry(
  vpWidth: number,
  vpHeight: number,
  imgWidth: number,
  imgHeight: number
): GeometryMetrics {
  const aspect = imgWidth / imgHeight;
  const invAspect = imgHeight / imgWidth;
  const isLandscape = vpWidth >= vpHeight;

  let baseWidth: number;
  let baseHeight: number;

  if (isLandscape) {
    baseWidth = vpWidth * OVERSCAN_SCALE;
    baseHeight = baseWidth * invAspect;
    if (baseHeight < vpHeight * LANDSCAPE_MIN_HEIGHT_MULT) {
      baseHeight = vpHeight * LANDSCAPE_MIN_HEIGHT_MULT;
      baseWidth = baseHeight * aspect;
    }
  } else {
    baseHeight = Math.max(vpHeight * PORTRAIT_HEIGHT_MULT, vpWidth * OVERSCAN_SCALE * invAspect);
    baseWidth = baseHeight * aspect;
  }

  const zoomEnd = isLandscape ? LANDSCAPE_ZOOM_END : PORTRAIT_ZOOM_END;

  const minYStart = Math.min(0, vpHeight - baseHeight);
  const rawStart = VIEWPORT_START_RATIO * vpHeight - WATERLINE_RATIO * baseHeight;
  const yStart = clamp(rawStart, minYStart, 0);

  const zoomedHeight = baseHeight * zoomEnd;
  const minYEnd = Math.min(0, vpHeight - zoomedHeight);
  const rawEnd = VIEWPORT_END_RATIO * vpHeight - UNDERWATER_FOCAL_RATIO * zoomedHeight;
  const yEnd = clamp(rawEnd, minYEnd, 0);

  return {
    vpWidth,
    vpHeight,
    baseWidth,
    baseHeight,
    zoomEnd,
    yStart,
    yEnd,
  };
}

function readSessionSeen(): boolean {
  try {
    return window.sessionStorage.getItem(SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeSessionSeen(): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // Ignore storage errors in restricted browsing contexts
  }
}

function focusMainContent(): void {
  const main = document.getElementById("main-content");
  if (!main) return;

  const hadTabIndex = main.hasAttribute("tabindex");
  if (!hadTabIndex) {
    main.setAttribute("tabindex", "-1");
  }
  main.focus({ preventScroll: true });
}

export function initIcebergIntro(): () => void {
  const root = document.getElementById("iceberg-intro");
  const img = document.getElementById("iceberg-img") as HTMLImageElement | null;
  const line1El = document.getElementById("iceberg-line-1");
  const line2El = document.getElementById("iceberg-line-2");
  const skipBtn = document.getElementById("iceberg-skip");

  if (!root || !img || !line1El || !line2El) {
    return () => {};
  }

  if (readSessionSeen()) {
    root.classList.remove("is-active", "is-line1-visible", "is-line2-visible", "is-exiting");
    root.classList.add("is-dismissed");
    root.setAttribute("aria-hidden", "true");
    return () => {};
  }

  let cleanedUp = false;
  let rafId: number | null = null;
  const timeoutIds = new Set<number>();
  let resizeObserver: ResizeObserver | null = null;

  const prevHtmlOverflow = document.documentElement.style.overflow;
  const prevBodyOverflow = document.body.style.overflow;
  let scrollLocked = false;

  const lockScroll = (): void => {
    if (scrollLocked) return;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    scrollLocked = true;
  };

  const unlockScroll = (): void => {
    if (!scrollLocked) return;
    document.documentElement.style.overflow = prevHtmlOverflow;
    document.body.style.overflow = prevBodyOverflow;
    scrollLocked = false;
  };

  const scheduleTimeout = (fn: () => void, delayMs: number): void => {
    const id = window.setTimeout(() => {
      timeoutIds.delete(id);
      if (!cleanedUp) {
        fn();
      }
    }, delayMs);
    timeoutIds.add(id);
  };

  const initialVp = getViewportSize();
  const initialImg = getImageNaturalSize(img);
  let currentGeometry: GeometryMetrics = computeGeometry(
    initialVp.width,
    initialVp.height,
    initialImg.imgWidth,
    initialImg.imgHeight
  );
  let currentY = currentGeometry.yStart;
  let currentZoom = 1;

  const applyTransform = (y: number, zoom: number, metrics: GeometryMetrics): void => {
    const minY = Math.min(0, metrics.vpHeight - metrics.baseHeight * zoom);
    const clampedY = clamp(y, minY, 0);
    const xCentered = (metrics.vpWidth - metrics.baseWidth * zoom) / 2;

    currentY = clampedY;
    currentZoom = zoom;
    img.style.transform = `translate3d(${xCentered.toFixed(2)}px, ${clampedY.toFixed(2)}px, 0) scale(${zoom.toFixed(4)})`;
  };

  const applyGeometrySize = (metrics: GeometryMetrics): void => {
    img.style.width = `${metrics.baseWidth.toFixed(2)}px`;
    img.style.height = `${metrics.baseHeight.toFixed(2)}px`;
  };

  let startTime: number | null = null;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const getCurrentElapsed = (): number => {
    if (startTime === null) return 0;
    return Math.max(0, performance.now() - startTime);
  };

  const computePoseForElapsed = (
    elapsed: number,
    metrics: GeometryMetrics
  ): { y: number; zoom: number } => {
    if (reducedMotion || elapsed >= T_DESCENT_END) {
      return { y: metrics.yEnd, zoom: metrics.zoomEnd };
    }
    if (elapsed <= T_DESCENT_START) {
      return { y: metrics.yStart, zoom: 1 };
    }
    const progress = (elapsed - T_DESCENT_START) / (T_DESCENT_END - T_DESCENT_START);
    const eased = easeOutCubic(progress);
    const y = metrics.yStart + (metrics.yEnd - metrics.yStart) * eased;
    const zoom = 1 + (metrics.zoomEnd - 1) * eased;
    return { y, zoom };
  };

  const recalculate = (): void => {
    if (cleanedUp) return;
    const { width, height } = getViewportSize();
    const { imgWidth, imgHeight } = getImageNaturalSize(img);
    currentGeometry = computeGeometry(width, height, imgWidth, imgHeight);
    applyGeometrySize(currentGeometry);
    const pose = computePoseForElapsed(getCurrentElapsed(), currentGeometry);
    applyTransform(pose.y, pose.zoom, currentGeometry);
  };

  const onViewportChange = (): void => {
    recalculate();
  };

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      dismiss(true);
    }
  };

  const onSkipClick = (): void => {
    dismiss(true);
  };

  const cleanup = (): void => {
    if (cleanedUp) return;
    cleanedUp = true;

    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }

    for (const id of timeoutIds) {
      window.clearTimeout(id);
    }
    timeoutIds.clear();

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    window.removeEventListener("resize", onViewportChange);
    window.removeEventListener("orientationchange", onViewportChange);
    window.visualViewport?.removeEventListener("resize", onViewportChange);
    img.removeEventListener("load", onViewportChange);
    document.removeEventListener("keydown", onKeyDown);
    skipBtn?.removeEventListener("click", onSkipClick);

    unlockScroll();
  };

  const dismiss = (restoreFocus: boolean): void => {
    if (cleanedUp) return;
    writeSessionSeen();

    root.classList.remove("is-active", "is-line1-visible", "is-line2-visible", "is-exiting");
    root.classList.add("is-dismissed");
    root.setAttribute("aria-hidden", "true");

    cleanup();

    if (restoreFocus) {
      focusMainContent();
    }
  };

  // Initialize DOM state & geometry
  lockScroll();
  root.classList.remove("is-dismissed", "is-exiting", "is-line1-visible", "is-line2-visible");
  root.classList.add("is-active");
  root.removeAttribute("aria-hidden");

  line1El.textContent = "";
  line2El.textContent = "";

  applyGeometrySize(currentGeometry);
  if (reducedMotion) {
    applyTransform(currentGeometry.yEnd, currentGeometry.zoomEnd, currentGeometry);
  } else {
    applyTransform(currentGeometry.yStart, 1, currentGeometry);
  }

  // Attach listeners & observers
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(onViewportChange);
    resizeObserver.observe(root);
  }
  window.addEventListener("resize", onViewportChange, { passive: true });
  window.addEventListener("orientationchange", onViewportChange, { passive: true });
  window.visualViewport?.addEventListener("resize", onViewportChange, { passive: true });
  if (!img.complete) {
    img.addEventListener("load", onViewportChange, { once: true });
  }
  document.addEventListener("keydown", onKeyDown);
  skipBtn?.addEventListener("click", onSkipClick);

  if (reducedMotion) {
    line2El.textContent = LINE_2_TEXT;
    root.classList.add("is-line2-visible");

    scheduleTimeout(() => {
      root.classList.add("is-exiting");
    }, REDUCED_EXIT_START);

    scheduleTimeout(() => {
      dismiss(true);
    }, REDUCED_COMPLETE);

    return cleanup;
  }

  let line1Started = false;
  let line1Completed = false;
  let line1Hidden = false;
  let line2Started = false;
  let line2Completed = false;
  let exitStarted = false;
  let lastLine1Len = -1;
  let lastLine2Len = -1;

  const tick = (now: number): void => {
    if (cleanedUp) return;
    if (startTime === null) {
      startTime = now;
    }

    const elapsed = now - startTime;

    // 100ms - 1450ms: Even character-by-character typing for Line 1 (~40ms/char)
    if (elapsed >= T_LINE1_START && !line1Started) {
      line1Started = true;
      root.classList.add("is-line1-visible");
    }

    if (elapsed >= T_LINE1_START && !line1Completed) {
      const typingDuration = T_LINE1_TYPING_END - T_LINE1_START;
      const progress = clamp((elapsed - T_LINE1_START) / typingDuration, 0, 1);
      const charCount = Math.floor(progress * LINE_1_TEXT.length);
      if (charCount !== lastLine1Len) {
        lastLine1Len = charCount;
        line1El.textContent = LINE_1_TEXT.slice(0, charCount);
      }
      if (progress >= 1) {
        line1Completed = true;
        line1El.textContent = LINE_1_TEXT;
      }
    }

    // 1750ms - 2050ms: Fade out Line 1
    if (elapsed >= T_LINE1_HIDE && !line1Hidden) {
      line1Hidden = true;
      if (!line1Completed) {
        line1Completed = true;
        line1El.textContent = LINE_1_TEXT;
      }
      root.classList.remove("is-line1-visible");
    }

    // 1550ms - 3200ms: Smooth cubic-out descent + progressive zoom-in
    if (elapsed >= T_DESCENT_START && elapsed <= T_DESCENT_END) {
      const pose = computePoseForElapsed(elapsed, currentGeometry);
      if (
        Math.abs(pose.y - currentY) > 0.01 ||
        Math.abs(pose.zoom - currentZoom) > 0.0001
      ) {
        applyTransform(pose.y, pose.zoom, currentGeometry);
      }
    } else if (
      elapsed > T_DESCENT_END &&
      (Math.abs(currentY - currentGeometry.yEnd) > 0.01 ||
        Math.abs(currentZoom - currentGeometry.zoomEnd) > 0.0001)
    ) {
      applyTransform(currentGeometry.yEnd, currentGeometry.zoomEnd, currentGeometry);
    }

    // 2050ms - 3400ms: Even character-by-character typing for Line 2 (~34ms/char)
    if (elapsed >= T_LINE2_START && !line2Started) {
      line2Started = true;
      root.classList.add("is-line2-visible");
    }

    if (elapsed >= T_LINE2_START && !line2Completed) {
      const typingDuration = T_LINE2_TYPING_END - T_LINE2_START;
      const progress = clamp((elapsed - T_LINE2_START) / typingDuration, 0, 1);
      const charCount = Math.floor(progress * LINE_2_TEXT.length);
      if (charCount !== lastLine2Len) {
        lastLine2Len = charCount;
        line2El.textContent = LINE_2_TEXT.slice(0, charCount);
      }
      if (progress >= 1) {
        line2Completed = true;
        line2El.textContent = LINE_2_TEXT;
      }
    }

    // 4350ms - 4950ms: Dissolve overlay cleanly (never before 4350ms)
    if (elapsed >= T_EXIT_START && !exitStarted) {
      exitStarted = true;
      root.classList.add("is-exiting");
    }

    if (elapsed >= T_COMPLETE) {
      dismiss(true);
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return cleanup;
}
