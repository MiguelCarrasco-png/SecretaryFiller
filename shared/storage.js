// Shared chrome.storage.local wrapper. Loaded before field-finder.js and the
// per-site content script, in the same isolated-world scope (plain globals,
// no modules/build step).

const DOCFILLER_PROFILE_KEY = "docfiller_profile_v1";
const DOCFILLER_LAST_EVENT_KEY = "docfiller_lastEvent_v1";
const DOCFILLER_TEMPLATES_KEY = "docfiller_templates_v1";

const DOCFILLER_DEFAULT_PROFILE = {
  contact: { fullName: "", phone: "", uflEmail: "" },
  reservationForType: "University of Florida Registered Student Organization",
  orgOrDeptName: "",
  permit: { hasPermit: false, submitterNameEmail: "" },
  ems: {
    // academicPurposeAck, onBehalfOfOtherOrgAck, examTimesAck, and
    // peakPeriodAck aren't here — those EMS dropdowns only have one real
    // option, so they're hardcoded to "Yes" in field-descriptors-ems.js
    // instead of being a user-editable choice.
    attestations: {
      attendance250Plus: "No",
      guestSpeaker: "No",
      sensitiveTopics: "No",
      collaboratingOrg: "No",
      under18NonUF: "No",
      admissionFee: "No",
      eveningWeekendAck: "Yes",
      foodDrinkAck: "Yes",
      furnitureAck: "Yes",
      musicDancingAck: "Yes",
      classPriorityAck: "Yes",
      doorPropAck: "Yes"
    }
  }
};

const DOCFILLER_DEFAULT_EVENT = {
  rawText: "",
  eventName: "",
  eventDateTime: "",
  reservationRequestType: "Meeting (GBM, Staff Meetings, etc..) Class",
  eventDescription: "",
  spaceSelections: [],
  emsEventType: ""
};

function docfillerGetProfile() {
  return chrome.storage.local.get(DOCFILLER_PROFILE_KEY).then((result) => {
    const stored = result[DOCFILLER_PROFILE_KEY];
    if (!stored) return structuredClone(DOCFILLER_DEFAULT_PROFILE);
    // Merge so new fields added in later versions get sane defaults.
    return docfillerDeepMerge(structuredClone(DOCFILLER_DEFAULT_PROFILE), stored);
  });
}

function docfillerSaveProfile(profile) {
  return chrome.storage.local.set({ [DOCFILLER_PROFILE_KEY]: profile });
}

function docfillerGetLastEvent() {
  return chrome.storage.local.get(DOCFILLER_LAST_EVENT_KEY).then((result) => {
    const stored = result[DOCFILLER_LAST_EVENT_KEY];
    if (!stored) return structuredClone(DOCFILLER_DEFAULT_EVENT);
    return docfillerDeepMerge(structuredClone(DOCFILLER_DEFAULT_EVENT), stored);
  });
}

function docfillerSaveLastEvent(event) {
  return chrome.storage.local.set({ [DOCFILLER_LAST_EVENT_KEY]: event });
}

// Templates hold the fields that stay the same across a recurring event
// (title, description, reservation type, room(s), EMS event/setup type) -
// deliberately not eventDateTime or rawText, since the date is the one
// thing that changes each time a recurring booking is refilled. Stored as
// an array, matched/overwritten by exact template name (case-insensitive)
// rather than a generated id, since names are the only thing the user picks
// a template by.
function docfillerGetTemplates() {
  return chrome.storage.local.get(DOCFILLER_TEMPLATES_KEY).then((result) => {
    const stored = result[DOCFILLER_TEMPLATES_KEY];
    return Array.isArray(stored) ? stored : [];
  });
}

function docfillerSaveTemplates(templates) {
  return chrome.storage.local.set({ [DOCFILLER_TEMPLATES_KEY]: templates });
}

function docfillerDeepMerge(base, override) {
  if (Array.isArray(base)) return Array.isArray(override) ? override : base;
  if (typeof base !== "object" || base === null) {
    return override === undefined ? base : override;
  }
  const result = { ...base };
  for (const key of Object.keys(base)) {
    result[key] = docfillerDeepMerge(base[key], override ? override[key] : undefined);
  }
  return result;
}
