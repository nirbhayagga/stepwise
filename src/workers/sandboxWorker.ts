let delayMs = 50;

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

self.onmessage = async (e) => {
  const { type, code, speed } = e.data;
  
  if (type === 'update-speed') {
    delayMs = Math.max(10, 1000 - (speed * 9.9));
    return;
  }

  if (type === 'execute') {
    const visualizer = {
      swap: async (i: number, j: number) => {
        postMessage({ action: 'swap', i, j });
        await wait(delayMs);
      },
      compare: async (i: number, j: number) => {
        postMessage({ action: 'compare', i, j });
        await wait(delayMs);
      },
      visit: async (r: number, c: number) => {
        postMessage({ action: 'visit', r, c });
        await wait(delayMs);
      },
      finish: () => {
        postMessage({ action: 'finish' });
      }
    };

    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const userFunc = new AsyncFunction('visualizer', code);
      await userFunc(visualizer);
      visualizer.finish();
    } catch (error: any) {
      postMessage({ action: 'error', message: error.message || error.toString() });
    }
  }
};
