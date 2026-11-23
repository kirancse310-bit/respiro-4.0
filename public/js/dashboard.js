/**
 * @fileoverview Live Dashboard View Controller.
 * Renders AQI status, pollutant breakdown, and 12-hour forecast strip.
 * Enforces the WCAG 2.2 Twin Representation Rule for visual metrics.
 * @module dashboard-view
 */

/**
 * Renders the live air quality telemetry dashboard into the DOM.
 * Generates visual status cards paired with screen-reader accessible twin description lists.
 *
 * @param {Object} data - Live air telemetry payload.
 * @param {number} data.aqi - Air Quality Index.
 * @param {string} data.category - EPA AQI category name.
 * @param {string} data.symbol - Geometric category symbol.
 * @param {string} data.dominantPollutant - Main pollutant driving AQI.
 * @param {string} data.city - Selected city display name.
 * @param {string} data.source - Provenance source label.
 * @param {string} data.timestamp - ISO observation time string.
 * @param {string} data.action - Recommended action string.
 * @param {string} data.cleanestHour - Cleanest hour of day (HH:MM).
 * @param {number} data.cleanestPm25 - Projected minimum PM2.5.
 * @param {string} data.worstHour - Worst hour of day (HH:MM).
 * @param {number} data.worstPm25 - Projected maximum PM2.5.
 * @param {Object} data.pollutants - Individual pollutant concentrations.
 * @param {Array<{ hour: string, pm25: number, aqi?: number }>} data.hourlyForecast - 12-hr forecast strip.
 * @returns {void}
 */
export function renderDashboard(data) {
  const container = document.getElementById('dashboard-view');
  if (!container) return;

  /**
   * Resolves CSS class name for a given AQI category.
   * @param {string} category - Clinical AQI category string.
   * @returns {string} CSS modifier class.
   */
  const getBadgeClass = (category) => {
    switch (category) {
      case 'Good': return 'aqi-good';
      case 'Moderate': return 'aqi-moderate';
      case 'Unhealthy for Sensitive Groups': return 'aqi-sensitive';
      case 'Unhealthy': return 'aqi-unhealthy';
      case 'Very Unhealthy': return 'aqi-veryunhealthy';
      default: return 'aqi-hazardous';
    }
  };

  const badgeClass = getBadgeClass(data.category);

  container.innerHTML = `
    <section class="card aqi-hero-card" aria-labelledby="live-telemetry-heading">
      <div class="aqi-badge-block ${badgeClass}-block" style="background: var(--${badgeClass}-bg); color: var(--${badgeClass}-text);">
        <h2 id="live-telemetry-heading" class="sr-only">Live Air Quality Status</h2>
        <div class="aqi-value" aria-label="Air Quality Index ${data.aqi}">${data.aqi}</div>
        <div class="aqi-category" role="status">
          <span aria-hidden="true">${data.symbol}</span> ${data.category}
        </div>
        <div style="font-size: 0.85rem; margin-top: 8px;">
          Dominant: <strong>${data.dominantPollutant}</strong>
        </div>
      </div>
      <div>
        <div class="card-header" style="border: none; padding-bottom: 0;">
          <div>
            <h3 class="card-title">${data.city} Air Quality</h3>
            <p style="font-size: 0.85rem; color: var(--text-dim);">
              Telemetry Source: <em>${data.source}</em> · Updated: ${new Date(data.timestamp).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <p class="alert-box alert-warning" style="margin-top: 12px;" role="note">
          <strong>Advisory:</strong> ${data.action}
        </p>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px;">
          <div style="background: var(--bg-elevated); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <span style="font-size: 0.8rem; color: var(--text-dim); display: block;">Cleanest Hour</span>
            <strong style="font-size: 1.1rem; color: #10b981;">${data.cleanestHour}</strong> (~${data.cleanestPm25} µg/m³)
          </div>
          <div style="background: var(--bg-elevated); padding: 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
            <span style="font-size: 0.8rem; color: var(--text-dim); display: block;">Peak Smog Hour</span>
            <strong style="font-size: 1.1rem; color: #ef4444;">${data.worstHour}</strong> (~${data.worstPm25} µg/m³)
          </div>
        </div>
      </div>
    </section>

    <!-- Pollutants Grid with Twin Representation Rule (Screen Reader Description List) -->
    <section class="card" aria-labelledby="pollutants-heading">
      <h3 id="pollutants-heading" class="card-title">Key Pollutant Concentrations</h3>
      
      <!-- Twin Representation for Assistive Tech -->
      <div class="sr-only" aria-label="Urban pollutant concentration description list">
        <dl>
          <div>
            <dt>PM2.5 fine particulate</dt>
            <dd>${Math.round(data.pollutants.pm2_5)} micrograms per cubic meter</dd>
          </div>
          <div>
            <dt>PM10 coarse particulate</dt>
            <dd>${Math.round(data.pollutants.pm10)} micrograms per cubic meter</dd>
          </div>
          <div>
            <dt>Nitrogen Dioxide (NO2)</dt>
            <dd>${Math.round(data.pollutants.no2)} micrograms per cubic meter</dd>
          </div>
          <div>
            <dt>Carbon Monoxide (CO)</dt>
            <dd>${Math.round(data.pollutants.co)} micrograms per cubic meter</dd>
          </div>
          <div>
            <dt>Ozone (O3)</dt>
            <dd>${Math.round(data.pollutants.o3)} micrograms per cubic meter</dd>
          </div>
        </dl>
      </div>

      <div class="pollutants-grid" aria-hidden="true">
        <div class="pollutant-card">
          <div class="pollutant-name">PM2.5</div>
          <div class="pollutant-val">${Math.round(data.pollutants.pm2_5)}</div>
          <div class="pollutant-unit">µg/m³</div>
        </div>
        <div class="pollutant-card">
          <div class="pollutant-name">PM10</div>
          <div class="pollutant-val">${Math.round(data.pollutants.pm10)}</div>
          <div class="pollutant-unit">µg/m³</div>
        </div>
        <div class="pollutant-card">
          <div class="pollutant-name">NO₂</div>
          <div class="pollutant-val">${Math.round(data.pollutants.no2)}</div>
          <div class="pollutant-unit">µg/m³</div>
        </div>
        <div class="pollutant-card">
          <div class="pollutant-name">CO</div>
          <div class="pollutant-val">${Math.round(data.pollutants.co)}</div>
          <div class="pollutant-unit">µg/m³</div>
        </div>
        <div class="pollutant-card">
          <div class="pollutant-name">O₃ (Ozone)</div>
          <div class="pollutant-val">${Math.round(data.pollutants.o3)}</div>
          <div class="pollutant-unit">µg/m³</div>
        </div>
      </div>
    </section>

    <!-- Hourly Forecast with Twin Representation -->
    <section class="card" aria-labelledby="forecast-heading">
      <h3 id="forecast-heading" class="card-title">12-Hour Hourly PM2.5 Forecast</h3>
      
      <!-- Twin Representation Description List -->
      <div class="sr-only" aria-label="12-hour PM2.5 forecast trend description list">
        <dl>
          ${data.hourlyForecast.map((h) => `
            <div>
              <dt>Hour ${h.hour}</dt>
              <dd>Estimated PM2.5: ${h.pm25} micrograms per cubic meter</dd>
            </div>
          `).join('')}
        </dl>
      </div>

      <div class="timeline-strip" role="region" aria-label="Hourly timeline" aria-hidden="true">
        ${data.hourlyForecast.map((h) => `
          <div class="timeline-cell">
            <div class="timeline-hour">${h.hour}</div>
            <div class="timeline-pm" style="color: ${h.pm25 > 150 ? '#ef4444' : h.pm25 > 60 ? '#c2410c' : '#047857'}; font-weight: 800;">${h.pm25}</div>
            <div style="font-size: 0.7rem; color: var(--text-dim);">µg/m³</div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}
