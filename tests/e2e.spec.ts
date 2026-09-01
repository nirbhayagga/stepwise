/**
 * Browser end-to-end tests against the production build (vite preview).
 */
import { test, expect, type Page } from '@playwright/test';

const ROUTES = ['sort', 'compare', 'path', 'path-compare', 'dp', 'tree', 'graph', 'strings', 'hash', 'geometry', 'backtracking', 'numbers', 'sandbox'];

/** Fail the test on any uncaught exception or console.error. */
const watchConsole = (page: Page) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
};

const selectAlgorithm = async (page: Page, id: string) => {
  await page.getByLabel('Algorithm').selectOption(id);
};

const stepCounter = (page: Page) => page.locator('.counter');

for (const route of ROUTES) {
  test(`/${route} renders without errors`, async ({ page }) => {
    const errors = watchConsole(page);
    await page.goto(`/#/${route}`);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.sidebar .router-link-active')).toHaveCount(1);
    expect(errors).toEqual([]);
  });
}

test('sorting: play to the end sorts the array and counts steps', async ({ page }) => {
  await page.goto('/#/sort');
  await selectAlgorithm(page, 'quick');
  await page.keyboard.press('End');
  const text = await stepCounter(page).innerText();
  const [cur, total] = text.replace(/\D+/g, ' ').trim().split(' ').map(Number);
  expect(cur).toBeGreaterThan(10);
  expect(cur).toBe(total);
  const bars = page.locator('.bar');
  await expect(bars.first()).toHaveClass(/sorted/);
  expect(await bars.count()).toBe(await page.locator('.bar.sorted').count());
  await expect(page.locator('.metric', { hasText: 'Comparisons' })).not.toContainText(/\b0\b/);
});

test('keyboard shortcuts step and rewind', async ({ page }) => {
  await page.goto('/#/sort');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(stepCounter(page)).toContainText('2');
  await page.locator('.pseudocode-panel, .line.active').first().waitFor();
  await page.keyboard.press('Home');
  await expect(stepCounter(page).locator('.num')).toHaveText('0');
});

test('sorting compare: both panes finish sorted', async ({ page }) => {
  await page.goto('/#/compare');
  await page.keyboard.press('End');
  const panes = page.locator('.split-pane');
  await expect(panes).toHaveCount(2);
  for (let i = 0; i < 2; i++) {
    const pane = panes.nth(i);
    expect(await pane.locator('.bar').count()).toBe(await pane.locator('.bar.sorted').count());
  }
});

test('pathfinding: generate a maze, search, draw a wall', async ({ page }) => {
  await page.goto('/#/path');
  await page.getByLabel('Generator').selectOption('backtracker');
  await page.getByRole('button', { name: 'Generate' }).click();
  await page.keyboard.press('End');
  expect(await page.locator('.node.path').count()).toBeGreaterThan(2);
  await expect(page.locator('.metric', { hasText: 'Path length' }).locator('.value')).not.toHaveText(/^0/);

  // Drawing invalidates the search and paints walls along the drag.
  await page.getByRole('button', { name: 'Clear walls' }).click();
  const a = page.locator('.node').nth(3);
  const b = page.locator('.node').nth(4);
  const ba = (await a.boundingBox())!, bb = (await b.boundingBox())!;
  await page.mouse.move(ba.x + ba.width / 2, ba.y + ba.height / 2);
  await page.mouse.down();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 3 });
  await page.mouse.up();
  await expect(a).toHaveClass(/wall/);
  await expect(b).toHaveClass(/wall/);
  await expect(stepCounter(page)).toContainText('—');
});

test('playback never scrolls the page (regression: pseudocode auto-scroll)', async ({ page }) => {
  await page.setViewportSize({ width: 1300, height: 520 });
  await page.goto('/#/sort');
  await page.getByLabel('Speed').fill('90');
  await page.getByLabel('Speed').blur(); // shortcuts ignore focused form controls
  const content = page.locator('main.content');
  await content.evaluate(el => { el.scrollTop = 400; });
  const before = await content.evaluate(el => el.scrollTop);
  expect(before).toBeGreaterThan(100);
  await page.keyboard.press(' ');
  await page.waitForTimeout(1200);
  await expect(stepCounter(page).locator('.num')).not.toHaveText('0');
  expect(await content.evaluate(el => el.scrollTop)).toBe(before);
});

test('titles follow the module and unknown routes get a 404 view', async ({ page }) => {
  await page.goto('/#/sort');
  await expect(page).toHaveTitle('Sorting · Stepwise');
  await page.goto('/#/graph');
  await expect(page).toHaveTitle('Graphs · Stepwise');
  await page.goto('/#/does-not-exist');
  await expect(page.locator('h1')).toContainText('Page not found');
  await expect(page).toHaveTitle('Not found · Stepwise');
  await page.getByRole('link', { name: 'Back to the visualizer' }).click();
  await expect(page).toHaveTitle('Sorting · Stepwise');
  await expect(page.locator('.bar').first()).toBeVisible();
});

test('new modules produce results at the end of their timelines', async ({ page }) => {
  // Hash navigation swaps lazily-loaded views in place, so wait for each
  // view's canvas before using keyboard shortcuts.
  await page.goto('/#/strings');
  await page.locator('.cell').first().waitFor();
  await page.keyboard.press('End');
  await expect(page.locator('.metric', { hasText: 'Occurrences' }).locator('.value')).not.toHaveText('0');

  await page.goto('/#/hash');
  await page.locator('.slot').first().waitFor();
  await page.keyboard.press('End');
  await expect(page.locator('.metric', { hasText: 'Stored' }).locator('.value')).toHaveText('8');

  await page.goto('/#/geometry');
  await page.locator('.pt').first().waitFor();
  await page.keyboard.press('End');
  expect(await page.locator('.pt.hull').count()).toBeGreaterThan(2);

  await page.goto('/#/backtracking');
  await page.locator('.cell').first().waitFor();
  await page.keyboard.press('End');
  await expect(page.locator('.cell.fixed')).toHaveCount(6);

  await page.goto('/#/numbers');
  await page.locator('.cell').first().waitFor();
  await page.keyboard.press('End');
  await expect(page.locator('.cell.placed')).toHaveCount(30); // π(120)
});

test.describe('mobile viewport', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  for (const route of ['sort', 'compare', 'path', 'dp', 'tree', 'graph', 'strings', 'hash', 'geometry', 'backtracking', 'numbers', 'sandbox']) {
    test(`/${route} fits the screen width`, async ({ page }) => {
      const errors = watchConsole(page);
      await page.goto(`/#/${route}`);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      const content = page.locator('main.content');
      expect(await content.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }

  test('touch draws walls and playback works', async ({ page }) => {
    await page.goto('/#/path');
    const cell = page.locator('.node').nth(5);
    await cell.scrollIntoViewIfNeeded();
    const box = (await cell.boundingBox())!;
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
    await expect(cell).toHaveClass(/wall/);
    await page.getByRole('button', { name: 'Play' }).tap();
    await expect(stepCounter(page).locator('.num')).not.toHaveText('0');
  });
});

test('pathfinding compare: the right grid mirrors the left and both find a path', async ({ page }) => {
  await page.goto('/#/path-compare');
  await page.getByLabel('Generator').selectOption('prim');
  await page.getByRole('button', { name: 'Generate' }).click();
  await page.keyboard.press('End');
  const panes = page.locator('.split-pane');
  expect(await panes.nth(0).locator('.node.wall').count()).toBe(await panes.nth(1).locator('.node.wall').count());
  for (let i = 0; i < 2; i++) expect(await panes.nth(i).locator('.node.path').count()).toBeGreaterThan(2);
});

test('dynamic programming: table fills and inputs are validated', async ({ page }) => {
  await page.goto('/#/dp');
  await selectAlgorithm(page, 'edit-distance');
  await page.keyboard.press('End');
  expect(await page.locator('.cell.filled').count()).toBe(7 * 8);
  await expect(page.locator('.vars')).toContainText('result');

  // Editing an input rebuilds the table from step 0.
  const input = page.getByLabel('String A');
  await input.fill('AB');
  await input.press('Enter');
  await expect(stepCounter(page).locator('.num')).toHaveText('0');
  await page.locator('h1').click(); // shortcuts are ignored while an input has focus
  await page.keyboard.press('End');
  expect(await page.locator('.cell.filled').count()).toBe(3 * 8);

  // Invalid input shows an error and disables playback.
  await selectAlgorithm(page, 'knapsack');
  const cap = page.getByLabel('Capacity W');
  await cap.fill('abc');
  await cap.press('Enter');
  await expect(page.locator('.error-text')).toContainText('integer');
  await expect(page.getByRole('button', { name: 'Play' })).toBeDisabled();
});

test('trees: red-black insertion colours nodes and traversal emits output', async ({ page }) => {
  await page.goto('/#/tree');
  await selectAlgorithm(page, 'red-black');
  await page.keyboard.press('End');
  await expect(page.locator('.node')).toHaveCount(10);
  expect(await page.locator('.node.black').count()).toBeGreaterThan(0);
  expect(await page.locator('.node.red').count()).toBeGreaterThan(0);
  await selectAlgorithm(page, 'inorder');
  await page.keyboard.press('End');
  await expect(page.locator('.output .tok')).toHaveText(['20', '30', '35', '40', '45', '50', '60', '65', '70', '80']);
});

test('graphs: topological order covers every vertex and source can be changed', async ({ page }) => {
  await page.goto('/#/graph');
  await selectAlgorithm(page, 'topo');
  await page.keyboard.press('End');
  await expect(page.locator('.output .tok')).toHaveCount(12);
  await selectAlgorithm(page, 'dijkstra');
  await page.getByLabel('Source').selectOption('3');
  await expect(page.locator('.node.source text').first()).toHaveText('3');
  await page.keyboard.press('End');
  expect(await page.locator('.edge.tree').count()).toBe(11);
});

test('sandbox: user code runs in the worker and sorts the array', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/#/sandbox');
  await page.locator('input.range').fill('100');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.status')).toBeVisible();
  await expect(page.locator('.status')).toBeHidden({ timeout: 80_000 });
  expect(await page.locator('.bar').count()).toBe(await page.locator('.bar.sorted').count());
  await expect(page.locator('.logs')).toContainText('done');

  // A runtime error is surfaced, not swallowed.
  await page.locator('textarea').fill('throw new Error("boom")');
  await page.getByRole('button', { name: 'Run' }).click();
  await expect(page.locator('.error-text')).toContainText('boom');
});
