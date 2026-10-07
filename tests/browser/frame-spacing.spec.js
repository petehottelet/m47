import { test, expect } from '@playwright/test';

for (const demo of ['youtube', 'google']) {
  test(`${demo} rail has uniform gutters through nested navigation and both elbows`, async ({
    page,
    context,
  }, testInfo) => {
    // Geometry checks need only local assets, including when the demo has remote thumbnails.
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      return url.origin === 'http://127.0.0.1:4747' ? route.continue() : route.abort();
    });
    for (const width of [1440, 1024, 721, 720, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${demo}.html`);
      await page.evaluate(() => document.fonts.ready);
      const segments = await page
        .locator(
          '.top-elbow, .rail > a, .rail .nav-bank > button, .rail .nav-bank > a, .rail-fill, .bottom-elbow',
        )
        .evaluateAll((elements) =>
          elements
            .filter((element) => element.getClientRects().length)
            .map((element) => {
              const rect = element.getBoundingClientRect();
              return { name: element.textContent.trim(), top: rect.top, bottom: rect.bottom };
            }),
        );
      expect(segments).toHaveLength(width > 720 ? 7 : 3);
      for (let index = 1; index < segments.length; index++) {
        const previous = segments[index - 1];
        const current = segments[index];
        expect(
          current.top - previous.bottom,
          `${demo} at ${width}px: ${previous.name} to ${current.name}`,
        ).toBeCloseTo(3, 1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      if (testInfo.project.name === 'chromium' && [1440, 390].includes(width)) {
        const elbow = await page.locator('.top-elbow').boundingBox();
        const rail = await page.locator('.rail').boundingBox();
        await page.screenshot({
          path: testInfo.outputPath(`${demo}-rail-${width}.png`),
          clip: { x: elbow.x, y: elbow.y, width: rail.width + 24, height: 430 },
        });
      }
      if (width === 1440) {
        await page.keyboard.press('Tab');
        for (const control of await page.locator('.rail a, .rail button').all()) {
          await control.focus();
          await expect(control).toBeFocused();
          const outline = await control.evaluate((element) => {
            const style = getComputedStyle(element);
            return [
              style.outlineColor,
              style.outlineOffset,
              style.outlineStyle,
              style.outlineWidth,
            ];
          });
          expect(outline).toEqual(['rgb(0, 0, 0)', '-5px', 'solid', '2px']);
        }
      }
    }
  });
}
