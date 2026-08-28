/**
 * Runs user code off the main thread. The code is wrapped in an async
 * function that receives `visualizer`; every drawing call awaits a pacing
 * delay so the UI can animate, and the worker is simply terminated to stop.
 */
let delayMs = 50;
const speedToDelay = (speed: number) => 40 * Math.pow(10, (50 - speed) / 50);
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ExecuteMessage { type: 'execute'; code: string; speed: number; array?: number[]; rows?: number; cols?: number }
interface SpeedMessage { type: 'update-speed'; speed: number }

self.onmessage = async (e: MessageEvent<ExecuteMessage | SpeedMessage>) => {
  const msg = e.data;
  if (msg.type === 'update-speed') { delayMs = speedToDelay(msg.speed); return; }

  delayMs = speedToDelay(msg.speed);
  const post = (m: Record<string, unknown>) => (self as unknown as Worker).postMessage(m);
  const visualizer = {
    array: msg.array ?? [],
    rows: msg.rows ?? 0,
    cols: msg.cols ?? 0,
    async compare(i: number, j: number) { post({ action: 'compare', i, j }); await wait(delayMs); },
    async swap(i: number, j: number) {
      const a = this.array; [a[i], a[j]] = [a[j], a[i]];
      post({ action: 'swap', i, j }); await wait(delayMs);
    },
    async write(i: number, value: number) { this.array[i] = value; post({ action: 'write', i, value }); await wait(delayMs); },
    async mark(i: number) { post({ action: 'mark', i }); await wait(delayMs); },
    async sorted(i: number) { post({ action: 'sorted', i }); await wait(delayMs); },
    async visit(r: number, c: number) { post({ action: 'visit', r, c }); await wait(delayMs); },
    async frontier(r: number, c: number) { post({ action: 'frontier', r, c }); await wait(delayMs); },
    async path(r: number, c: number) { post({ action: 'path', r, c }); await wait(delayMs); },
    log(...args: unknown[]) { post({ action: 'log', text: args.map(a => (typeof a === 'string' ? a : JSON.stringify(a))).join(' ') }); },
  };

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const fn = new AsyncFunction('visualizer', msg.code);
    await fn(visualizer);
    post({ action: 'finish' });
  } catch (err) {
    post({ action: 'error', message: err instanceof Error ? `${err.name}: ${err.message}` : String(err) });
  }
};
