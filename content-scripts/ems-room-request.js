// Fills the EMS Cloud "Reservation Details" page. No-ops on other EMS pages.

function docfillerIsEmsReservationDetailsPage() {
  return /RoomRequest\.aspx/i.test(location.pathname);
}

function docfillerRunEmsFill(profile, event) {
  const filled = [];
  const missed = [];

  for (const field of DOCFILLER_EMS_FIELDS) {
    const value = field.getValue(profile, event);
    if (typeof value !== "string" || value.length === 0) continue;

    const control = docfillerFindEmsControl(field.matchLabelText);
    if (!control) {
      missed.push(field.matchLabelText);
      continue;
    }

    let ok = false;
    if (field.type === "select") ok = docfillerSetEmsSelect(control, value);
    else ok = docfillerFillEmsText(control, value);

    if (ok) filled.push(field.matchLabelText);
    else missed.push(field.matchLabelText);
  }

  return { ok: true, filled, missed };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "FILL") return;
  if (!docfillerIsEmsReservationDetailsPage()) {
    sendResponse({ ok: false, error: "Not on the EMS reservation details page." });
    return;
  }
  try {
    const result = docfillerRunEmsFill(message.profile, message.event);
    sendResponse(result);
  } catch (err) {
    sendResponse({ ok: false, error: String(err) });
  }
  return true;
});
