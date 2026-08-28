import { ref, shallowRef, computed, getCurrentInstance, onUnmounted } from 'vue';

/**
 * Generic frame timeline: holds an immutable array of pre-computed frames and
 * a cursor. Playback advances the cursor on a timer whose delay is derived
 * from the reactive `speed` (1..100) so slider changes apply immediately.
 */
export function useTimeline<F>(baseDelayMs: number) {
  const frames = shallowRef<F[]>([]);
  const index = ref(0);
  const isPlaying = ref(false);
  const speed = ref(50);

  const current = computed<F | undefined>(() => frames.value[index.value]);
  const frameCount = computed(() => frames.value.length);
  const lastIndex = computed(() => Math.max(0, frames.value.length - 1));
  const atEnd = computed(() => index.value >= lastIndex.value);
  const atStart = computed(() => index.value <= 0);
  /** speed 50 → base delay; 100 → base/10; 1 → ~base×9.5 */
  const delayMs = computed(() => baseDelayMs * Math.pow(10, (50 - speed.value) / 50));

  let timer: number | null = null;

  const pause = () => {
    isPlaying.value = false;
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const setFrames = (next: F[]) => {
    pause();
    frames.value = next;
    index.value = 0;
  };

  const seek = (i: number) => {
    index.value = Math.min(Math.max(0, Math.floor(i)), lastIndex.value);
  };

  const step = () => {
    if (atEnd.value) {
      pause();
      return;
    }
    index.value++;
  };

  const stepBack = () => {
    pause();
    if (index.value > 0) index.value--;
  };

  const reset = () => {
    pause();
    index.value = 0;
  };

  const tick = () => {
    timer = null;
    if (!isPlaying.value) return;
    const delay = delayMs.value;
    // Below one animation frame, advance several frames per tick instead of
    // spinning a timer faster than the screen can paint.
    const perTick = delay < 16 ? Math.max(1, Math.round(16 / delay)) : 1;
    index.value = Math.min(index.value + perTick, lastIndex.value);
    if (atEnd.value) {
      pause();
      return;
    }
    timer = window.setTimeout(tick, Math.max(16, delay));
  };

  const play = () => {
    if (isPlaying.value || frames.value.length <= 1) return;
    if (atEnd.value) index.value = 0;
    isPlaying.value = true;
    timer = window.setTimeout(tick, Math.max(16, delayMs.value));
  };

  const toggle = () => (isPlaying.value ? pause() : play());

  if (getCurrentInstance()) onUnmounted(pause);

  return {
    frames, index, current, frameCount, lastIndex, atEnd, atStart, isPlaying, speed, delayMs,
    setFrames, seek, step, stepBack, reset, play, pause, toggle
  };
}

export type Timeline<F> = ReturnType<typeof useTimeline<F>>;
