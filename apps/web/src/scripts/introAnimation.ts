const FALLBACK_IMG_WIDTH = 1011;
const FALLBACK_IMG_HEIGHT = 681;

const WATERLINE_RATIO = 0.435;
const UNDERWATER_FOCAL_RATIO = 0.78;
const VIEWPORT_START_RATIO = 0.78;
const VIEWPORT_END_RATIO = 0.40;

const OVERSCAN_SCALE = 1.08;
const LANDSCAPE_MIN_HEIGHT_MULT = 1.95;
const PORTRAIT_HEIGHT_MULT = 2.15;
const LANDSCAPE_ZOOM_END = 1.15;
const PORTRAIT_ZOOM_END = 1.18;
const EDGE_BLEED_PX = 4;
const RESIZE_DEBOUNCE_MS = 150;

const SESSION_KEY = "portfolio_intro_seen";
const LINE_1_TEXT = "You didn't land here by accident.";
const LINE_2_TEXT = "The real story lies beneath the surface.";

// Strictly <= 5000ms compositor-only timeline (milliseconds)
const T_LINE1_SHOW = 150;
const T_DESCENT_START = 1450;
const T_LINE1_HIDE = 1450;
const T_DESCENT_END = 3150;
const T_LINE2_SHOW = 3050;
const T_EXIT_START = 4350;
const T_COMPLETE = 4950;

// Reduced-motion calm fade <= 1500ms
const REDUCED_EXIT_START = 450;
const REDUCED_COMPLETE = 1000;

interface GeometryMetrics {
  vpWidth: number;
  vpHeight: number;
  imgWidth: number;
  imgHeight: number;
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
  const width = Math.max(1, Math.round(vv ? vv.width : window.innerWidth));
  const height = Math.max(1, Math.round(vv ? vv.height : window.innerHeight));
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

  const minYStart = Math.min(-EDGE_BLEED_PX, vpHeight - baseHeight + EDGE_BLEED_PX);
  const maxYStart = -EDGE_BLEED_PX;
  const rawStart = VIEWPORT_START_RATIO * vpHeight - WATERLINE_RATIO * baseHeight;
  const yStart = clamp(rawStart, minYStart, maxYStart);

  const zoomedHeight = baseHeight * zoomEnd;
  const minYEnd = Math.min(-EDGE_BLEED_PX, vpHeight - zoomedHeight + EDGE_BLEED_PX);
  const maxYEnd = -EDGE_BLEED_PX;
  const rawEnd = VIEWPORT_END_RATIO * vpHeight - UNDERWATER_FOCAL_RATIO * zoomedHeight;
  const yEnd = clamp(rawEnd, minYEnd, maxYEnd);

  return {
    vpWidth,
    vpHeight,
    imgWidth,
    imgHeight,
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

  if (!main.hasAttribute("tabindex")) {
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
  let resizeDebounceId: number | null = null;
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
    const minY = Math.min(-EDGE_BLEED_PX, metrics.vpHeight - metrics.baseHeight * zoom + EDGE_BLEED_PX);
    const clampedY = clamp(y, minY, -EDGE_BLEED_PX);
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

    if (
      width === currentGeometry.vpWidth &&
      height === currentGeometry.vpHeight &&
      imgWidth === currentGeometry.imgWidth &&
      imgHeight === currentGeometry.imgHeight
    ) {
      return;
    }

    currentGeometry = computeGeometry(width, height, imgWidth, imgHeight);
    applyGeometrySize(currentGeometry);
    const pose = computePoseForElapsed(getCurrentElapsed(), currentGeometry);
    applyTransform(pose.y, pose.zoom, currentGeometry);
  };

  const onViewportChange = (): void => {
    if (cleanedUp) return;
    if (resizeDebounceId !== null) {
      window.clearTimeout(resizeDebounceId);
    }
    resizeDebounceId = window.setTimeout(() => {
      resizeDebounceId = null;
      recalculate();
    }, RESIZE_DEBOUNCE_MS);
  };

  const onImageLoad = (): void => {
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
    if (resizeDebounceId !== null) {
      window.clearTimeout(resizeDebounceId);
      resizeDebounceId = null;
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
    img.removeEventListener("load", onImageLoad);
    document.removeEventListener("keydown", onKeyDown);
    skipBtn?.removeEventListener("click", onSkipClick);

    img.style.willChange = "auto";
    root.style.willChange = "auto";

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

  // Set both lines once (smooth GPU-composited opacity + translate3d reveals, zero per-char mutations)
  line1El.textContent = LINE_1_TEXT;
  line2El.textContent = LINE_2_TEXT;

  // Initialize DOM state & geometry
  lockScroll();
  root.classList.remove("is-dismissed", "is-exiting", "is-line1-visible", "is-line2-visible");
  root.classList.add("is-active");
  root.removeAttribute("aria-hidden");

  applyGeometrySize(currentGeometry);
  if (reducedMotion) {
    applyTransform(currentGeometry.yEnd, currentGeometry.zoomEnd, currentGeometry);
  } else {
    applyTransform(currentGeometry.yStart, 1, currentGeometry);
  }

  // Attach listeners & debounced observers
  if (typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(onViewportChange);
    resizeObserver.observe(root);
  }
  window.addEventListener("resize", onViewportChange, { passive: true });
  window.addEventListener("orientationchange", onViewportChange, { passive: true });
  window.visualViewport?.addEventListener("resize", onViewportChange, { passive: true });
  if (!img.complete) {
    img.addEventListener("load", onImageLoad, { once: true });
  }
  document.addEventListener("keydown", onKeyDown);
  skipBtn?.addEventListener("click", onSkipClick);

  if (reducedMotion) {
    root.classList.add("is-line2-visible");

    scheduleTimeout(() => {
      root.classList.add("is-exiting");
    }, REDUCED_EXIT_START);

    scheduleTimeout(() => {
      dismiss(true);
    }, REDUCED_COMPLETE);

    return cleanup;
  }

  let line1Shown = false;
  let line1Hidden = false;
  let line2Shown = false;
  let exitStarted = false;

  const tick = (now: number): void => {
    if (cleanedUp) return;
    if (startTime === null) {
      startTime = now;
    }

    const elapsed = now - startTime;

    if (elapsed >= T_LINE1_SHOW && !line1Shown) {
      line1Shown = true;
      root.classList.add("is-line1-visible");
    }

    if (elapsed >= T_LINE1_HIDE && !line1Hidden) {
      line1Hidden = true;
      root.classList.remove("is-line1-visible");
    }

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

    if (elapsed >= T_LINE2_SHOW && !line2Shown) {
      line2Shown = true;
      root.classList.add("is-line2-visible");
    }

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
