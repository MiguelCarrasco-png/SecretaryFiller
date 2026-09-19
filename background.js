// SecretaryFiller toolbar icon: a small drawn "plate" mark (amber rounded
// square) that always stays put, plus a status dot in its bottom-right
// corner that only appears while the active tab is on a detected page.
// The very first moment a tab matches, the dot pulses - grows and shrinks
// with a sine-eased curve, easing in and out rather than snapping - then
// settles at a steady resting size for as long as the tab stays there.
const DOCFILLER_GOOGLE_FORM_ID = "1FAIpQLSfHkpvwhzcbWnO7VV-VL_wQcl0xC1A_S0a-admjNk_cDdZWnA";

// Plate accent colors by detected site - the COBE Google Form gets a green
// plate (distinct at a glance from the default amber), EMS and the resting/
// no-site state stay amber.
const DOCFILLER_PALETTES = {
  default: { top: "#F0BC6E", bottom: "#C97C22", border: "#7A4A14" },
  ems: { top: "#F0BC6E", bottom: "#C97C22", border: "#7A4A14" },
  google: { top: "#8FCB84", bottom: "#3E7A45", border: "#244F29" }
};

const DOCFILLER_PAPER = "#ECE6D9";
const DOCFILLER_PAPER_SHADOW = "#C9C2B2";
const DOCFILLER_INK_LINE = "#2A2E3A";
const DOCFILLER_DOT_COLOR = "#1B1E27";
const DOCFILLER_DOT_RING = "#ECE6D9";
const DOCFILLER_ICON_SIZES = [16, 32];

// Tracks the last detected site per tab so the pulse only fires on the
// transition into a matching page, not on every onUpdated/onActivated event
// while already sitting on one. Lost on service-worker restart - harmless,
// worst case a tab pulses again once instead of never.
const docfillerLastSite = new Map();

function docfillerDetectSite(url) {
  if (!url) return null;
  if (url.includes(DOCFILLER_GOOGLE_FORM_ID)) return "google";
  if (url.includes("ufl.emscloudservice.com")) return "ems";
  return null;
}

function docfillerRoundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Pure paint routine: draws one icon frame into any 2D context (an
// OffscreenCanvas context here; a plain <canvas> context in the standalone
// preview harness this was designed in - identical either way). The mark is
// a small "checklist" card - a folded-corner paper with a bold checkmark -
// sitting on a shaded plate (color depends on the detected site), so it
// reads as a deliberate logo rather than a flat block even at 16px. dotScale
// 0 draws the plate with no dot (tab isn't on a matching page); any other
// value draws the corner status dot at that size multiple.
function docfillerPaintIcon(ctx, size, dotScale, site) {
  ctx.clearRect(0, 0, size, size);

  const palette = DOCFILLER_PALETTES[site] || DOCFILLER_PALETTES.default;
  const inset = size * 0.07;
  const plateSize = size - inset * 2;
  const radius = size * 0.24;

  // Plate with a diagonal gradient (lit top-left to shaded bottom-right)
  // plus a dark border, so it has real depth instead of a flat fill.
  docfillerRoundRectPath(ctx, inset, inset, plateSize, plateSize, radius);
  const grad = ctx.createLinearGradient(inset, inset, inset + plateSize, inset + plateSize);
  grad.addColorStop(0, palette.top);
  grad.addColorStop(1, palette.bottom);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.lineWidth = Math.max(1, size * 0.045);
  ctx.strokeStyle = palette.border;
  ctx.stroke();

  // Soft sheen in the upper-left so the plate reads as lit, not flat.
  ctx.save();
  ctx.clip();
  ctx.globalAlpha = 0.22;
  ctx.beginPath();
  ctx.ellipse(inset + plateSize * 0.3, inset + plateSize * 0.26, plateSize * 0.42, plateSize * 0.24, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  ctx.restore();

  // Paper glyph: axis-aligned (stays crisp at 16px) with a folded corner
  // and a bold checkmark, plus one extra detail line once there's room.
  ctx.save();
  ctx.translate(size * 0.45, size * 0.53);
  const pw = plateSize * 0.52;
  const ph = plateSize * 0.6;
  const fold = pw * 0.34;
  ctx.beginPath();
  ctx.moveTo(-pw / 2, -ph / 2);
  ctx.lineTo(pw / 2 - fold, -ph / 2);
  ctx.lineTo(pw / 2, -ph / 2 + fold);
  ctx.lineTo(pw / 2, ph / 2);
  ctx.lineTo(-pw / 2, ph / 2);
  ctx.closePath();
  ctx.fillStyle = DOCFILLER_PAPER;
  ctx.fill();
  ctx.lineWidth = Math.max(0.75, size * 0.02);
  ctx.strokeStyle = palette.border;
  ctx.stroke();
  // Fold triangle shadow, with a crisp diagonal edge.
  ctx.beginPath();
  ctx.moveTo(pw / 2 - fold, -ph / 2);
  ctx.lineTo(pw / 2, -ph / 2 + fold);
  ctx.lineTo(pw / 2 - fold, -ph / 2 + fold);
  ctx.closePath();
  ctx.fillStyle = DOCFILLER_PAPER_SHADOW;
  ctx.fill();
  ctx.stroke();

  // Bold checkmark - reads clearly even at 16px.
  ctx.strokeStyle = DOCFILLER_INK_LINE;
  ctx.lineWidth = Math.max(1.4, size * 0.1);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(-pw * 0.26, ph * 0.02);
  ctx.lineTo(-pw * 0.04, ph * 0.24);
  ctx.lineTo(pw * 0.3, -ph * 0.18);
  ctx.stroke();

  // Extra detail line under the checkmark once there's room to spare.
  if (size >= 28) {
    ctx.lineWidth = Math.max(1, size * 0.035);
    ctx.beginPath();
    ctx.moveTo(-pw * 0.28, ph * 0.38);
    ctx.lineTo(pw * 0.28, ph * 0.38);
    ctx.stroke();
  }
  ctx.restore();

  // Status dot, bottom-right, with a light ring for contrast against the
  // amber plate.
  if (dotScale > 0) {
    const cx = size * 0.78;
    const cy = size * 0.78;
    const baseRadius = size * 0.155;
    const r = baseRadius * dotScale;
    ctx.beginPath();
    ctx.arc(cx, cy, r + Math.max(0.6, size * 0.02), 0, Math.PI * 2);
    ctx.fillStyle = DOCFILLER_DOT_RING;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = DOCFILLER_DOT_COLOR;
    ctx.fill();
  }
}

// dotScale 0 draws the plain plate with no dot (tab isn't on a matching
// page); any other value draws the corner dot at that size multiple.
function docfillerDrawIconFrame(size, dotScale, site) {
  const canvas = new OffscreenCanvas(size, size);
  const ctx = canvas.getContext("2d");
  docfillerPaintIcon(ctx, size, dotScale, site);
  return ctx.getImageData(0, 0, size, size);
}

function docfillerSetIcon(tabId, dotScale, site) {
  const imageData = {};
  for (const size of DOCFILLER_ICON_SIZES) {
    imageData[size] = docfillerDrawIconFrame(size, dotScale, site);
  }
  chrome.action.setIcon(tabId === undefined ? { imageData } : { tabId, imageData });
}

// MV3 service workers get suspended after ~30s idle, so an animation can't
// loop forever - instead this fires one short, self-contained burst of
// pulses right when a matching page is detected, then leaves the dot at its
// steady resting size (scale 1) for the rest of the time the tab stays
// there. The burst is several breathing cycles back to back (not one slow
// swell) so it reads as smooth, noticeable motion over ~6-7 seconds total;
// each cycle is independently sine-eased so it grows and shrinks with no
// snapping.
function docfillerPulseDot(tabId, site) {
  const cycles = 4;
  const frameInterval = 80; // ms between setIcon calls - smooth but not wasteful
  const framesPerCycle = 20; // 20 * 80ms = 1.6s per breathing cycle
  const totalFrames = framesPerCycle * cycles; // 4 cycles * 1.6s = ~6.4s
  const restScale = 1;
  const peakScale = 1.6;

  for (let f = 0; f <= totalFrames; f++) {
    const cycleT = (f % framesPerCycle) / framesPerCycle;
    const ease = Math.sin(Math.PI * cycleT); // 0 at each cycle's start/end, 1 at its midpoint
    const scale = restScale + (peakScale - restScale) * ease;
    setTimeout(() => docfillerSetIcon(tabId, scale, site), f * frameInterval);
  }
  // Land explicitly on the resting size once the burst finishes (~6.5s in).
  setTimeout(() => docfillerSetIcon(tabId, restScale, site), (totalFrames + 1) * frameInterval);
}

function docfillerUpdateIcon(tabId, url) {
  const site = docfillerDetectSite(url);
  const wasSite = docfillerLastSite.get(tabId);

  if (site) {
    if (wasSite !== site) {
      docfillerPulseDot(tabId, site);
    } else {
      docfillerSetIcon(tabId, 1, site);
    }
  } else if (wasSite) {
    chrome.action.setIcon({ tabId }); // clear the per-tab override, falls back to the plain plate
  }

  docfillerLastSite.set(tabId, site);
}

function docfillerInitAllTabs() {
  docfillerSetIcon(undefined, 0); // plain amber plate as the extension-wide default
  chrome.tabs.query({}, (tabs) => {
    for (const tab of tabs) {
      docfillerUpdateIcon(tab.id, tab.url);
    }
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url || changeInfo.status === "complete") {
    docfillerUpdateIcon(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    docfillerUpdateIcon(tabId, tab.url);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  docfillerLastSite.delete(tabId);
});

chrome.runtime.onInstalled.addListener(docfillerInitAllTabs);
chrome.runtime.onStartup.addListener(docfillerInitAllTabs);
