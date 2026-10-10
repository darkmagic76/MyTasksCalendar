import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Comprueba que la página no tenga desbordamiento horizontal y, si lo hay,
 * lista los elementos culpables en el mensaje.
 *
 * Helper compartido (spec 001, T7): lo usan `app.spec.ts` y los specs del
 * mapa de calor para verificar el RNF de desbordamiento en 1440 y 390 px.
 */
export async function expectNoHorizontalOverflow(page: Page) {
  const report = await page.evaluate(() => {
    const doc = document.documentElement;
    const viewportWidth = doc.clientWidth;
    const offenders: string[] = [];
    if (doc.scrollWidth > viewportWidth + 1) {
      for (const el of Array.from(document.querySelectorAll('body *'))) {
        const rect = el.getBoundingClientRect();
        if (rect.right > viewportWidth + 1) {
          const cls = typeof el.className === 'string' ? el.className : '';
          offenders.push(
            `${el.tagName.toLowerCase()}${cls ? `.${cls.trim().split(/\s+/).join('.')}` : ''}`,
          );
        }
      }
    }
    return { scrollWidth: doc.scrollWidth, clientWidth: viewportWidth, offenders };
  });

  expect(
    report.scrollWidth,
    `Desbordamiento horizontal (${report.scrollWidth} > ${report.clientWidth}). Elementos: ${report.offenders
      .slice(0, 10)
      .join(' | ')}`,
  ).toBeLessThanOrEqual(report.clientWidth + 1);
}
