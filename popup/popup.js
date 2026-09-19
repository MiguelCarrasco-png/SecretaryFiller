const DOCFILLER_ATTESTATIONS = [
  ["attendance250Plus", "Expecting 250+ attendance?"],
  ["guestSpeaker", "Has an outside guest speaker?"],
  ["sensitiveTopics", "Discusses sensitive topics?"],
  ["collaboratingOrg", "Collaborating with another org?"],
  ["under18NonUF", "Non-UF attendee under 18 present?"],
  ["admissionFee", "Charges admission / sells tickets?"],
  ["eveningWeekendAck", "Ack: evening/weekend reservations"],
  ["foodDrinkAck", "Ack: no food/drink in classrooms"],
  ["furnitureAck", "Ack: furniture returned to place"],
  ["musicDancingAck", "Ack: no music/dancing"],
  ["classPriorityAck", "Ack: classes/exams take priority"],
  ["doorPropAck", "Ack: no propping exterior doors"]
];

function $(id) {
  return document.getElementById(id);
}

function setupTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      $(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

function buildAttestationRows(values) {
  const container = $("pr-attestations");
  container.innerHTML = "";
  for (const [slug, label] of DOCFILLER_ATTESTATIONS) {
    const row = document.createElement("div");
    row.className = "attestation-row";
    const span = document.createElement("span");
    span.textContent = label;
    const select = document.createElement("select");
    select.id = `pr-att-${slug}`;
    for (const opt of ["Yes", "No"]) {
      const o = document.createElement("option");
      o.value = opt;
      o.textContent = opt;
      select.appendChild(o);
    }
    select.value = values[slug] || "No";
    row.appendChild(span);
    row.appendChild(select);
    container.appendChild(row);
  }
}

function readAttestationRows() {
  const result = {};
  for (const [slug] of DOCFILLER_ATTESTATIONS) {
    result[slug] = $(`pr-att-${slug}`).value;
  }
  return result;
}

async function loadProfileIntoForm() {
  const profile = await docfillerGetProfile();
  $("pr-fullName").value = profile.contact.fullName;
  $("pr-phone").value = profile.contact.phone;
  $("pr-uflEmail").value = profile.contact.uflEmail;
  $("pr-reservationForType").value = profile.reservationForType;
  $("pr-orgOrDeptName").value = profile.orgOrDeptName;
  $("pr-hasPermit").checked = !!profile.permit.hasPermit;
  $("pr-submitterNameEmail").value = profile.permit.submitterNameEmail;
  buildAttestationRows(profile.ems.attestations);
}

function readProfileFromForm() {
  return {
    contact: {
      fullName: $("pr-fullName").value.trim(),
      phone: $("pr-phone").value.trim(),
      uflEmail: $("pr-uflEmail").value.trim()
    },
    reservationForType: $("pr-reservationForType").value,
    orgOrDeptName: $("pr-orgOrDeptName").value.trim(),
    permit: {
      hasPermit: $("pr-hasPermit").checked,
      submitterNameEmail: $("pr-submitterNameEmail").value.trim()
    },
    ems: {
      attestations: readAttestationRows()
    }
  };
}

function applyParsedFields(parsed) {
  $("ev-eventName").value = parsed.eventName;
  $("ev-eventDateTime").value = parsed.eventDateTime;
  $("ev-eventDescription").value = parsed.eventDescription;
}

function handleRawTextInput() {
  const rawText = $("ev-rawText").value;
  applyParsedFields(docfillerParseEventText(rawText));
}

async function loadEventIntoForm() {
  const event = await docfillerGetLastEvent();
  $("ev-rawText").value = event.rawText;
  $("ev-eventName").value = event.eventName;
  $("ev-eventDateTime").value = event.eventDateTime;
  $("ev-eventDescription").value = event.eventDescription;
  $("ev-reservationRequestType").value = event.reservationRequestType;
  $("ev-emsEventType").value = event.emsEventType;
  const selected = new Set(event.spaceSelections || []);
  document.querySelectorAll('#ev-spaceSelections input[type="checkbox"]').forEach((cb) => {
    cb.checked = selected.has(cb.value);
  });
}

function readEventFromForm() {
  const spaceSelections = Array.from(
    document.querySelectorAll('#ev-spaceSelections input[type="checkbox"]:checked')
  ).map((cb) => cb.value);

  return {
    rawText: $("ev-rawText").value,
    eventName: $("ev-eventName").value.trim(),
    eventDateTime: $("ev-eventDateTime").value.trim(),
    eventDescription: $("ev-eventDescription").value.trim(),
    reservationRequestType: $("ev-reservationRequestType").value,
    spaceSelections,
    emsEventType: $("ev-emsEventType").value.trim()
  };
}

// Templates hold the fields that stay the same across a recurring event
// (title, description, reservation type, room(s), EMS event type) - not
// eventDateTime or rawText, since the date is the one thing that changes
// each time a recurring booking gets refilled.
let docfillerTemplates = [];

function templateFieldsFromEvent(event) {
  return {
    eventName: event.eventName,
    eventDescription: event.eventDescription,
    reservationRequestType: event.reservationRequestType,
    spaceSelections: event.spaceSelections,
    emsEventType: event.emsEventType
  };
}

function findTemplateByName(name) {
  const target = name.trim().toLowerCase();
  return docfillerTemplates.find((t) => t.name.trim().toLowerCase() === target);
}

function applyTemplateToForm(template) {
  $("ev-rawText").value = "";
  $("ev-eventName").value = template.eventName || "";
  $("ev-eventDescription").value = template.eventDescription || "";
  if (template.reservationRequestType) {
    $("ev-reservationRequestType").value = template.reservationRequestType;
  }
  const selected = new Set(template.spaceSelections || []);
  document.querySelectorAll('#ev-spaceSelections input[type="checkbox"]').forEach((cb) => {
    cb.checked = selected.has(cb.value);
  });
  $("ev-emsEventType").value = template.emsEventType || "";
}

function renderTemplateOptions(selectedName) {
  const select = $("template-select");
  select.innerHTML = "";
  const emptyOpt = document.createElement("option");
  emptyOpt.value = "";
  emptyOpt.textContent = "— none —";
  select.appendChild(emptyOpt);
  for (const t of docfillerTemplates) {
    const opt = document.createElement("option");
    opt.value = t.name;
    opt.textContent = t.name;
    select.appendChild(opt);
  }
  select.value = selectedName || "";
  $("template-delete-btn").hidden = !select.value;
}

async function loadTemplatesIntoUI() {
  docfillerTemplates = await docfillerGetTemplates();
  renderTemplateOptions("");
}

function handleTemplateSelectChange() {
  const name = $("template-select").value;
  $("template-delete-btn").hidden = !name;
  $("template-name-input").value = name;
  if (!name) return;
  const template = findTemplateByName(name);
  if (template) applyTemplateToForm(template);
}

// Shared by both the Save button inside the Templates dropdown and the
// "Save Template" button at the bottom of the form, next to Fill this page -
// both save under whatever name is currently in the name field. If that
// field is empty (nothing's been typed or selected yet), open the Templates
// dropdown and focus it instead of saving a nameless template - this matters
// most for the bottom button, since the name field may be collapsed out of
// sight at that point.
async function handleTemplateSave() {
  const nameInput = $("template-name-input");
  const name = nameInput.value.trim();
  if (!name) {
    $("templates-section").open = true;
    nameInput.focus();
    return;
  }
  const fields = templateFieldsFromEvent(readEventFromForm());
  const template = { name, ...fields };
  const existingIndex = docfillerTemplates.findIndex((t) => t.name.trim().toLowerCase() === name.toLowerCase());
  if (existingIndex >= 0) {
    docfillerTemplates[existingIndex] = template;
  } else {
    docfillerTemplates.push(template);
  }
  await docfillerSaveTemplates(docfillerTemplates);
  renderTemplateOptions(name);
}

async function handleTemplateDelete() {
  const name = $("template-select").value;
  if (!name) return;
  docfillerTemplates = docfillerTemplates.filter((t) => t.name.trim().toLowerCase() !== name.toLowerCase());
  await docfillerSaveTemplates(docfillerTemplates);
  $("template-name-input").value = "";
  renderTemplateOptions("");
}

// Same form id as manifest.json's host_permissions/content_scripts match for
// docs.google.com - keeps detection scoped to the COBE 26-27 form and not
// every Google Form the boss might ever open.
const DOCFILLER_GOOGLE_FORM_ID = "1FAIpQLSfHkpvwhzcbWnO7VV-VL_wQcl0xC1A_S0a-admjNk_cDdZWnA";

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function detectDocfillerSite(url) {
  if (!url) return null;
  if (url.includes(DOCFILLER_GOOGLE_FORM_ID)) return "google";
  if (url.includes("ufl.emscloudservice.com")) return "ems";
  return null;
}

async function updateActiveSiteHint() {
  const tab = await getActiveTab();
  const dot = $("status-dot");
  const text = $("status-text");
  const emsOnlySection = $("fieldset-ems-only");

  const setStatus = (className, message) => {
    dot.className = "status-dot" + (className ? ` ${className}` : "");
    text.textContent = message;
  };

  const site = detectDocfillerSite(tab?.url);
  emsOnlySection.style.display = site === "google" ? "none" : "";

  if (!tab?.url) {
    setStatus("warn", "No active tab detected.");
  } else if (site === "google") {
    setStatus("ok", "COBE Reservation");
  } else if (site === "ems") {
    setStatus("ok", "EMS Reservation");
  } else {
    setStatus(null, "Open the Google Form or EMS reservation page, then click Fill.");
  }
}

function playFlipIn(el) {
  el.classList.remove("flip-in");
  void el.offsetWidth;
  el.classList.add("flip-in");
}

async function handleFillClick() {
  const resultEl = $("fill-result");
  resultEl.textContent = "Filling...";

  const event = readEventFromForm();
  await docfillerSaveLastEvent(event);
  const profile = await docfillerGetProfile();

  const tab = await getActiveTab();
  if (!tab?.id) {
    resultEl.textContent = "No active tab.";
    return;
  }

  chrome.tabs.sendMessage(tab.id, { type: "FILL", profile, event }, (response) => {
    if (chrome.runtime.lastError) {
      resultEl.textContent =
        "Couldn't reach this page. Open the Google Form or EMS reservation page and try again.\n" +
        chrome.runtime.lastError.message;
      return;
    }
    if (!response?.ok) {
      resultEl.textContent = "Fill failed: " + (response?.error || "unknown error");
      return;
    }
    const { filled = [], missed = [] } = response;
    let text = `Filled ${filled.length} field(s).`;
    if (missed.length) {
      text += `\nCouldn't find: ${missed.join(", ")}`;
    }
    text += "\n\nReview the page, then click the site's own Next/Submit button.";
    resultEl.textContent = text;
    playFlipIn(resultEl);
  });
}

async function handleSaveProfileClick() {
  const resultEl = $("save-result");
  await docfillerSaveProfile(readProfileFromForm());
  resultEl.textContent = "Profile saved.";
  playFlipIn(resultEl);
  setTimeout(() => (resultEl.textContent = ""), 2000);
}

function getStoredTheme() {
  try {
    return localStorage.getItem("docfiller_theme") || "dark";
  } catch (e) {
    return "dark";
  }
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const icon = $("theme-toggle-icon");
  const btn = $("theme-toggle");
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  icon.innerHTML = theme === "light" ? "&#9728;" : "&#9789;";
  btn.title = label;
  btn.setAttribute("aria-label", label);
}

function setupThemeToggle() {
  applyTheme(getStoredTheme());
  $("theme-toggle").addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    try {
      localStorage.setItem("docfiller_theme", next);
    } catch (e) {}
    applyTheme(next);
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupTabs();
  setupThemeToggle();
  await Promise.all([loadProfileIntoForm(), loadEventIntoForm(), loadTemplatesIntoUI(), updateActiveSiteHint()]);
  $("fill-btn").addEventListener("click", handleFillClick);
  $("save-profile-btn").addEventListener("click", handleSaveProfileClick);
  $("ev-rawText").addEventListener("input", handleRawTextInput);
  $("template-select").addEventListener("change", handleTemplateSelectChange);
  $("template-save-btn").addEventListener("click", handleTemplateSave);
  $("template-save-bottom-btn").addEventListener("click", handleTemplateSave);
  $("template-delete-btn").addEventListener("click", handleTemplateDelete);
});
