/**
 * Air Guard – SOS Emergency Handler
 * Handles confirmation modal, live geolocation, and caregiver email dispatch.
 *
 * Dependencies (loaded via CDN in each HTML page):
 *   - EmailJS  https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js
 *
 * Configuration – edit the constants below to match your EmailJS account:
 */

const SOS_CONFIG = {
  // ─── EmailJS ─────────────────────────────────────────────────────────────
  // 1. Sign up at https://www.emailjs.com (free tier: 200 emails/month)
  // 2. Add an Email Service (Gmail, Outlook, etc.) → copy the Service ID here
  // 3. Create an Email Template with variables listed below → copy Template ID
  // 4. Copy your Public Key from Account → API Keys
  EMAILJS_PUBLIC_KEY:  "j5mlcN5Gy0_DXifcy",      // e.g. "user_aBcDeFgHiJkL"
  EMAILJS_SERVICE_ID:  "service_col8oo6",      // e.g. "service_airguard"
  EMAILJS_TEMPLATE_ID: "template_qgo87hj",     // e.g. "template_sos_alert"

  // ─── Caregiver ────────────────────────────────────────────────────────────
  // Default caregiver email – ideally read from the logged-in user's profile.
  // Replace with dynamic lookup if you add a proper auth/profile system.
  CAREGIVER_EMAIL: "eesha.hemani23@gmail.com",
  CAREGIVER_NAME:  "Caregiver",

  // ─── Patient ──────────────────────────────────────────────────────────────
  // Replace with values from your auth/profile system once implemented.
  PATIENT_NAME: "Air Guard User",
};

/* ─── EmailJS template variable reference ───────────────────────────────────
   Create a template in EmailJS with these variables:

   Subject: 🚨 EMERGENCY SOS Alert from {{patient_name}}

   Body:
   Dear {{caregiver_name}},

   {{patient_name}} has triggered an SOS emergency alert via Air Guard.

   📍 Live Location:
   {{location_address}}

   🗺️ Map Link:
   {{map_link}}

   🕒 Time: {{timestamp}}

   Please respond immediately.

   – Air Guard Emergency System
────────────────────────────────────────────────────────────────────────── */

// ─── Bootstrap ────────────────────────────────────────────────────────────────
(function init() {
  // Inject modal HTML + styles into the page
  injectModal();
  injectStyles();

  // Initialise EmailJS
  if (window.emailjs) {
    emailjs.init(SOS_CONFIG.EMAILJS_PUBLIC_KEY);
  } else {
    console.warn("EmailJS SDK not loaded. Ensure the CDN script tag appears before sos.js.");
  }

  // Wire up every .sos-btn on the page
  document.querySelectorAll(".sos-btn").forEach((btn) => {
    // Strip the tel: href so clicking only opens our modal
    btn.removeAttribute("href");
    btn.addEventListener("click", openSOSModal);
  });
})();

// ─── Modal open/close ─────────────────────────────────────────────────────────
function openSOSModal() {
  const overlay = document.getElementById("sos-overlay");
  overlay.classList.add("sos-active");
  // Reset to confirmation state every time
  showStep("confirm");
}

function closeSOSModal() {
  document.getElementById("sos-overlay").classList.remove("sos-active");
}

function showStep(step) {
  document.querySelectorAll(".sos-step").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(`sos-step-${step}`);
  if (target) target.classList.add("active");
}

// ─── Core SOS flow ────────────────────────────────────────────────────────────
async function confirmSOS() {
  showStep("locating");

  try {
    const position = await getLocation();
    const { latitude, longitude } = position.coords;
    const address = await reverseGeocode(latitude, longitude);
    const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

    showStep("sending");
    await sendEmail({ latitude, longitude, address, mapLink });

    showStep("success");

    // Also dial emergency services after a short pause
    setTimeout(() => {
      window.location.href = "tel:911";
    }, 2000);

  } catch (err) {
    console.error("SOS error:", err);
    showStep("error");
    document.getElementById("sos-error-msg").textContent =
      err.message || "An unexpected error occurred.";
  }
}

// ─── Geolocation ──────────────────────────────────────────────────────────────
function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (err) => {
      switch (err.code) {
        case err.PERMISSION_DENIED:
          reject(new Error("Location permission denied. Please enable location access and try again."));
          break;
        case err.POSITION_UNAVAILABLE:
          reject(new Error("Location information is unavailable right now."));
          break;
        case err.TIMEOUT:
          reject(new Error("Location request timed out. Please try again."));
          break;
        default:
          reject(new Error("Unable to retrieve location."));
      }
    }, { timeout: 10000, maximumAge: 0, enableHighAccuracy: true });
  });
}

async function reverseGeocode(lat, lon) {
  try {
    // Uses OpenStreetMap Nominatim – free, no API key required
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await resp.json();
    return data.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }
}

// ─── Email dispatch ───────────────────────────────────────────────────────────
async function sendEmail({ latitude, longitude, address, mapLink }) {
  const now = new Date();
  const timestamp = now.toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long",
    day: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });

  const payload = {
    service_id:   SOS_CONFIG.EMAILJS_SERVICE_ID,
    template_id:  SOS_CONFIG.EMAILJS_TEMPLATE_ID,
    user_id:      SOS_CONFIG.EMAILJS_PUBLIC_KEY,
    template_params: {
      caregiver_name:   SOS_CONFIG.CAREGIVER_NAME,
      caregiver_email:  SOS_CONFIG.CAREGIVER_EMAIL,
      patient_name:     SOS_CONFIG.PATIENT_NAME,
      location_address: address,
      map_link:         mapLink,
      latitude:         latitude.toFixed(6),
      longitude:        longitude.toFixed(6),
      timestamp,
    },
  };

  const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Email failed (${response.status}): ${errText}`);
  }
}

// ─── DOM injection ────────────────────────────────────────────────────────────
function injectModal() {
  const html = `
  <div id="sos-overlay" role="dialog" aria-modal="true" aria-label="SOS Emergency Confirmation">
    <div id="sos-modal">
      <!-- Pulse ring -->
      <div class="sos-pulse-ring"></div>

      <!-- Step: Confirm -->
      <div class="sos-step active" id="sos-step-confirm">
        <div class="sos-icon-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <h2>Emergency SOS</h2>
        <p>This will send your <strong>live location</strong> to your caregiver and they <strong>will be notified</strong>.</p>
        <p class="sos-subtext">Are you sure you want to proceed?</p>
        <div class="sos-btn-row">
          <button class="sos-no-btn"  onclick="closeSOSModal()">No, Cancel</button>
          <button class="sos-yes-btn" onclick="confirmSOS()">Yes, Send SOS</button>
        </div>
      </div>

      <!-- Step: Locating -->
      <div class="sos-step" id="sos-step-locating">
        <div class="sos-spinner"></div>
        <h2>Getting Location…</h2>
        <p>Please allow location access if prompted.</p>
      </div>

      <!-- Step: Sending -->
      <div class="sos-step" id="sos-step-sending">
        <div class="sos-spinner"></div>
        <h2>Sending Alert…</h2>
        <p>Notifying your caregiver now.</p>
      </div>

      <!-- Step: Success -->
      <div class="sos-step" id="sos-step-success">
        <div class="sos-icon-wrap sos-success">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h2>Alert Sent!</h2>
        <p>Your caregiver has been notified with your location.</p>
        <p class="sos-subtext">Connecting to Emergency Services…</p>
        <button class="sos-close-btn" onclick="closeSOSModal()">Close</button>
      </div>

      <!-- Step: Error -->
      <div class="sos-step" id="sos-step-error">
        <div class="sos-icon-wrap sos-error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <h2>Something Went Wrong</h2>
        <p id="sos-error-msg">Unable to send alert.</p>
        <div class="sos-btn-row">
          <button class="sos-no-btn"  onclick="closeSOSModal()">Cancel</button>
          <button class="sos-yes-btn" onclick="window.location.href='tel:911'">Call 911 Directly</button>
        </div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", html);

  // Close on backdrop click
  document.getElementById("sos-overlay").addEventListener("click", (e) => {
    if (e.target.id === "sos-overlay") closeSOSModal();
  });
}

function injectStyles() {
  const css = `
  /* ── SOS Overlay ───────────────────────────────────────────────── */
  #sos-overlay {
    display: none;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.65);
    backdrop-filter: blur(4px);
    z-index: 9999;
    justify-content: center;
    align-items: center;
    padding: 20px;
  }
  #sos-overlay.sos-active { display: flex; animation: sosFadeIn .2s ease; }

  @keyframes sosFadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Modal Card ─────────────────────────────────────────────────── */
  #sos-modal {
    position: relative;
    background: #fff;
    border-radius: 24px;
    padding: 40px 32px 36px;
    width: 100%;
    max-width: 400px;
    text-align: center;
    box-shadow: 0 30px 80px rgba(0,0,0,0.35);
    animation: sosSlideUp .25s cubic-bezier(.4,0,.2,1);
    overflow: hidden;
  }

  @keyframes sosSlideUp {
    from { transform: translateY(30px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  /* ── Pulse ring (top accent) ────────────────────────────────────── */
  .sos-pulse-ring {
    position: absolute;
    top: -60px; left: 50%; transform: translateX(-50%);
    width: 160px; height: 160px;
    border-radius: 50%;
    background: rgba(255,77,77,0.08);
    animation: sosPulse 1.8s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes sosPulse {
    0%,100% { transform: translateX(-50%) scale(1);   opacity:.6; }
    50%      { transform: translateX(-50%) scale(1.15); opacity:1; }
  }

  /* ── Steps ──────────────────────────────────────────────────────── */
  .sos-step { display: none; flex-direction: column; align-items: center; }
  .sos-step.active { display: flex; }

  #sos-modal h2 {
    font-size: 1.4rem;
    font-weight: 700;
    color: #1a1a1a;
    margin: 16px 0 10px;
  }

  #sos-modal p {
    font-size: 0.95rem;
    color: #555;
    line-height: 1.6;
    margin: 0 0 8px;
  }

  .sos-subtext { font-size: 0.85rem !important; color: #999 !important; }

  /* ── Icon circles ───────────────────────────────────────────────── */
  .sos-icon-wrap {
    width: 72px; height: 72px;
    border-radius: 50%;
    background: #fff1f1;
    border: 3px solid #ff4d4d;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 4px;
  }
  .sos-icon-wrap svg { width: 32px; height: 32px; color: #ff4d4d; }

  .sos-icon-wrap.sos-success {
    background: #f0fdf4; border-color: #22c55e;
  }
  .sos-icon-wrap.sos-success svg { color: #22c55e; }

  .sos-icon-wrap.sos-error-icon {
    background: #fff7ed; border-color: #f97316;
  }
  .sos-icon-wrap.sos-error-icon svg { color: #f97316; }

  /* ── Spinner ─────────────────────────────────────────────────────── */
  .sos-spinner {
    width: 52px; height: 52px;
    border: 5px solid #ffe5e5;
    border-top-color: #ff4d4d;
    border-radius: 50%;
    animation: sosSpin .8s linear infinite;
    margin-bottom: 8px;
  }
  @keyframes sosSpin { to { transform: rotate(360deg); } }

  /* ── Buttons ─────────────────────────────────────────────────────── */
  .sos-btn-row {
    display: flex; gap: 12px; margin-top: 24px; width: 100%;
  }

  .sos-yes-btn, .sos-no-btn, .sos-close-btn {
    flex: 1; padding: 13px 16px;
    border-radius: 50px; font-weight: 700; font-size: 0.95rem;
    cursor: pointer; border: none; transition: all .2s;
  }

  .sos-yes-btn {
    background: #ff4d4d; color: #fff;
    box-shadow: 0 4px 16px rgba(255,77,77,0.35);
  }
  .sos-yes-btn:hover { background: #e53535; transform: translateY(-1px); }

  .sos-no-btn {
    background: #f3f4f6; color: #374151;
  }
  .sos-no-btn:hover { background: #e5e7eb; }

  .sos-close-btn {
    background: #22c55e; color: #fff; margin-top: 20px; width: 100%;
  }
  .sos-close-btn:hover { background: #16a34a; }
  `;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
}