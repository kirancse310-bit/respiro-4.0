/**
 * Respiro 2.0 Main Application Controller.
 * Manages tabs, city state, theme toggles, and view wiring.
 */

import { setLanguage } from './i18n.js';
import { api } from './api.js';
import { renderDashboard } from './dashboard.js';
import { setupRoutineView } from './routine.js';
import { setupNavigatorView } from './navigator.js';
import { setupCADRView } from './cadr.js';
import { setupCommunityView } from './community.js';

let currentAirData = null;

export function getCurrentAirData() {
  return currentAirData;
}

// Accessible tab switcher with full keyboard navigation (WCAG 2.1)
function setupTabs() {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  function activateTab(tab) {
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });
    panels.forEach((p) => p.classList.remove('active'));

    tab.setAttribute('aria-selected', 'true');
    tab.removeAttribute('tabindex');

    const targetId = tab.getAttribute('aria-controls');
    const targetPanel = document.getElementById(targetId);
    if (targetPanel) {
      targetPanel.classList.add('active');
    }

    // Announce tab change for screen readers
    const announcer = document.getElementById('aria-live-announcer');
    if (announcer) {
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
      tabs[targetIndex].focus();
      activateTab(tabs[targetIndex]);
    });
  });
}

// Theme handling
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

// City loader
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

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupTabs();
  setupTheme();

  // Language selector
  const langSelect = document.getElementById('lang-select');
  if (langSelect) {
    langSelect.addEventListener('change', (e) => {
      setLanguage(e.target.value);
    });
  }

  // City selector
  const citySelect = document.getElementById('city-select');
  if (citySelect) {
    citySelect.addEventListener('change', (e) => {
      loadCityData(e.target.value);
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
