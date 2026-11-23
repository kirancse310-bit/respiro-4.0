import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';
import axe from 'axe-core';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Accessibility & WCAG 2.2 Level AA Compliance Audit', () => {
  const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  it('contains essential accessibility landmarks and skip link', () => {
    const dom = new JSDOM(htmlContent);
    const { document } = dom.window;

    // WCAG 2.4.1 Skip Link
    const skipLink = document.querySelector('a.skip-link');
    expect(skipLink).not.toBeNull();
    expect(skipLink.getAttribute('href')).toBe('#main-content');

    // Semantic Landmarks
    expect(document.querySelector('header[role="banner"]')).not.toBeNull();
    expect(document.querySelector('nav[role="navigation"]')).not.toBeNull();
    expect(document.querySelector('main#main-content')).not.toBeNull();
    expect(document.querySelector('footer[role="contentinfo"]')).not.toBeNull();

    // Screen reader live region
    const announcer = document.getElementById('aria-live-announcer');
    expect(announcer).not.toBeNull();
    expect(announcer.getAttribute('aria-live')).toBe('polite');
  });

  it('has proper ARIA tablist relationships and control ids', () => {
    const dom = new JSDOM(htmlContent);
    const { document } = dom.window;

    const tabs = document.querySelectorAll('[role="tab"]');
    const panels = document.querySelectorAll('[role="tabpanel"]');

    expect(tabs.length).toBe(5);
    expect(panels.length).toBe(5);

    tabs.forEach((tab) => {
      const panelId = tab.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      const correspondingPanel = document.getElementById(panelId);
      expect(correspondingPanel).not.toBeNull();
      expect(correspondingPanel.getAttribute('aria-labelledby')).toBe(tab.id);
    });
  });

  it('verifies form field labels and input bindings', () => {
    const dom = new JSDOM(htmlContent);
    const { document } = dom.window;

    const inputs = document.querySelectorAll('input:not([type="hidden"]), select, textarea');
    inputs.forEach((input) => {
      const hasId = !!input.id;
      const hasAriaLabel = !!input.getAttribute('aria-label');
      const hasAssociatedLabel = document.querySelector(`label[for="${input.id}"]`);
      const hasParentLabel = input.closest('label');

      expect(hasAriaLabel || hasAssociatedLabel || hasParentLabel).toBeTruthy();
    });
  });

  it('passes automated axe-core accessibility audit with zero critical violations', async () => {
    const dom = new JSDOM(htmlContent, { runScripts: 'outside-only' });
    const { document } = dom.window;

    // Run axe audit on the document body
    const results = await axe.run(document.body, {
      rules: {
        'color-contrast': { enabled: false }, // Requires browser visual engine
      },
    });

    const criticalViolations = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
    if (criticalViolations.length > 0) {
      console.error('Axe violations found:', JSON.stringify(criticalViolations, null, 2));
    }
    expect(criticalViolations.length).toBe(0);
  });
});
