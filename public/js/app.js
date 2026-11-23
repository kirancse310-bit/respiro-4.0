/**
 * @fileoverview Respiro 2.0 Main Client Application Controller.
 * Manages tabs with WCAG 2.1 keyboard roving tabindex, city selection state,
 * dark/light theme persistence, and view controller lifecycle.
 * @module app
 */

import { setLanguage } from './i18n.js';
import { api } from './api.js';
import { renderDashboard } from './dashboard.js';
import { setupRoutineView } from './routine.js';
import { setupNavigatorView } from './navigator.js';
import { setupCADRView } from './cadr.js';
import { setupCommunityView } from './community.js';

/**
 * Active in-memory air quality telemetry object.
 * @type {Object|null}
 */
let currentAirData = null;

/**
 * Retrieves the currently active air quality telemetry payload.
 *
 * @returns {Object|null} Current telemetry or null if uninitialized.
 */
export function getCurrentAirData() {
  return currentAirData;
}

/**
 * Sets up accessible tab switching with full keyboard navigation (WCAG 2.1).
 * Supports ArrowLeft, ArrowRight, Home, and End keys with roving tabindex.
 *
 * @returns {void}
 */
function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  /**
   * Activates a specific tab element and updates ARIA selected states.
   * @param {Element} tab - Target tab DOM element.
   */
  function activateTab(tab) {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach((p) => p.classList.remove('active'));

    tab.setAttribute('aria-selected', 'true');
    tab.removeAttribute('tabindex');

    const targetId = tab.getAttribute('aria-controls');
    if (targetId) {
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) {
        targetPanel.classList.add('active');
      }
    }

    // Announce tab change for screen readers
    const announcer = document.getElementById('aria-live-announcer');
    if (announcer && tab.textContent) {
      announcer.textContent = `Switched to ${tab.textContent.trim()} tab`;
    }
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateTab(tab));

    tab.addEventListener('keydown', (e) => {
      let targetIndex = index;
      if (e.key === 'ArrowRight') {
        targetIndex = (index + 1) % tabs.length;
      } else if (e.key === 'ArrowLeft') {
        targetIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (e.key === 'Home') {
        targetIndex = 0;
      } else if (e.key === 'End') {
        targetIndex = tabs.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      /** @type {HTMLElement} */ (tabs[targetIndex]).focus();
      activateTab(tabs[targetIndex]);
    });
  });
}

/**
 * Initializes and toggles the application theme between 'light' and 'dark',
 * persisting user preference to localStorage.
 *
 * @returns {void}
 */
function setupTheme() {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const storedTheme = localStorage.getItem('respiro-theme') || 'light';
  document.documentElement.setAttribute('data-theme', storedTheme);

  if (toggleBtn) {
    toggleBtn.textContent = storedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    toggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const nextTheme = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('respiro-theme', nextTheme);
      toggleBtn.textContent = nextTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    });
  }
}

/**
 * Loads real-time telemetry for a chosen city and re-renders the dashboard view.
 *
 * @param {string} cityName - Name of target city.
 * @returns {Promise<void>}
 */
async function loadCityData(cityName) {
  const announcer = document.getElementById('aria-live-announcer');
  if (announcer) announcer.textContent = `Loading air telemetry for ${cityName}...`;

  try {
    const data = await api.getAir(cityName);
    currentAirData = data;
    renderDashboard(data);
    if (announcer) announcer.textContent = `Air data for ${cityName} loaded. Current AQI is ${data.aqi}, category ${data.category}.`;
  } catch (err) {
    console.error('Error loading air data:', err);
    if (announcer) announcer.textContent = `Error loading air data for ${cityName}.`;
  }
}

// App Initialization on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupTheme();

  // Language selector
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      const target = /** @type {HTMLSelectElement} */ (e.target);
      setLanguage(target.value);
    });
  }

  // City selector
  const citySelect = document.getElementById('city-select');
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      const target = /** @type {HTMLSelectElement} */ (e.target);
      loadCityData(target.value);
    });
  }

  // Wire feature controllers
  setupRoutineView(getCurrentAirData);
  setupNavigatorView(getCurrentAirData);
  setupCADRView();
  setupCommunityView();

  // Initial load
  loadCityData('Delhi');
});
