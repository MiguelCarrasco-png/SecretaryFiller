// Fills whichever Google Form questions are currently visible on the page.
// Multi-page forms are handled by calling this again after the user clicks
// Google's own "Next" button — see popup/popup.js.

function docfillerRunGoogleFill(profile, event) {
  const filled = [];
  const missed = [];

  for (const field of DOCFILLER_GOOGLE_FIELDS) {
    const listItem = docfillerFindListItemByLabel(field.matchLabelText);
    if (!listItem) continue; // not on this page — fine, try again after Next

    const value = field.getValue(profile, event);
    const hasValue =
      (field.type === "checkbox" && Array.isArray(value) && value.length > 0) ||
      (field.type !== "checkbox" && typeof value === "string" && value.length > 0);
    if (!hasValue) continue; // nothing saved for this field yet — leave it for the human

    let ok = false;
    if (field.type === "text") ok = docfillerFillGoogleText(listItem, value);
    else if (field.type === "radio") ok = docfillerSelectGoogleRadio(listItem, value);
    else if (field.type === "checkbox") ok = docfillerSetGoogleCheckboxes(listItem, value);

    if (ok) filled.push(field.matchLabelText);
    else missed.push(field.matchLabelText);
  }

  return { ok: true, filled, missed };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "FILL") return;
  try {
    const result = docfillerRunGoogleFill(message.profile, message.event);
    sendResponse(result);
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
  }
  return true;
});
