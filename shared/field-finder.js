// Label-text based field location for sites with no stable id/name attributes.
// Two independent walkers: Google Forms (accessible listitem/heading/role
// structure) and the EMS ASP.NET WebForms page (label-proximity).

function docfillerNormalize(s) {
  return (s || "")
    .replace(/\*\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

// ---------- Google Forms ----------

function docfillerFindListItemByLabel(matchText) {
  const items = document.querySelectorAll('div[role="listitem"]');
  const target = docfillerNormalize(matchText);
  for (const item of items) {
    if (item.offsetParent === null) continue; // not currently visible/mounted
    const heading = item.querySelector('[role="heading"]');
    if (heading && docfillerNormalize(heading.textContent).includes(target)) {
      return item;
    }
  }
  return null;
}

function docfillerSetNativeValue(el, value) {
  const proto =
    el.tagName === "TEXTAREA"
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const setter = Object.getOwnPropertyDescriptor(proto, "value").set;

  el.focus({ preventScroll: true });

  // Some sites (Google Forms in particular) only pick up a *second*
  // programmatic write to a field that's already been filled once if the
  // value actually transitions (old -> "" -> new) with a full input/change
  // cycle, rather than being overwritten in a single assignment. Clearing
  // first forces that transition so re-filling an already-filled field
  // reliably replaces it instead of silently no-op'ing.
  if (el.value !== "") {
    setter.call(el, "");
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  setter.call(el, value);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.dispatchEvent(new Event("change", { bubbles: true }));
  el.blur();
}

function docfillerFillGoogleText(listItem, value) {
  const input = listItem.querySelector('input[type="text"], textarea');
  if (!input) return false;
  docfillerSetNativeValue(input, value);
  return true;
}

function docfillerSelectGoogleRadio(listItem, optionText) {
  const target = docfillerNormalize(optionText);
  for (const r of listItem.querySelectorAll('[role="radio"]')) {
    const label = r.getAttribute("aria-label") || r.textContent;
    if (docfillerNormalize(label).includes(target)) {
      r.click();
      return true;
    }
  }
  return false;
}

function docfillerSetGoogleCheckboxes(listItem, optionTexts) {
  const targets = optionTexts.map(docfillerNormalize);
  let anySet = false;
  for (const b of listItem.querySelectorAll('[role="checkbox"]')) {
    const label = b.getAttribute("aria-label") || b.textContent;
    const normLabel = docfillerNormalize(label);
    const shouldCheck = targets.some((t) => normLabel.includes(t));
    const isChecked = b.getAttribute("aria-checked") === "true";
    if (shouldCheck !== isChecked) b.click();
    if (shouldCheck) anySet = true;
  }
  return anySet;
}

// ---------- EMS / ASP.NET WebForms ----------

function docfillerFindEmsControl(matchText) {
  const target = docfillerNormalize(matchText);
  const candidates = document.querySelectorAll("label, b, strong, td, span, div");
  for (const el of candidates) {
    if (el.children.length > 0) continue; // leaf text nodes only
    if (!docfillerNormalize(el.textContent).includes(target)) continue;
    if (el.offsetParent === null) continue;

    const row = el.closest('tr, .form-group, [class*="row"]');
    let control = row ? row.querySelector("input, select, textarea") : null;
    if (!control) control = docfillerFindNextEmsControl(el);
    if (control) return control;
  }
  return null;
}

function docfillerFindNextEmsControl(el) {
  let node = el;
  for (let i = 0; i < 6 && node; i++) {
    node = node.nextElementSibling || node.parentElement?.nextElementSibling;
    if (!node) break;
    if (node.matches?.("input,select,textarea")) return node;
    const nested = node.querySelector?.("input,select,textarea");
    if (nested) return nested;
  }
  return null;
}

function docfillerFillEmsText(control, value) {
  if (!control || !(control.tagName === "INPUT" || control.tagName === "TEXTAREA")) return false;
  docfillerSetNativeValue(control, value);
  return true;
}

function docfillerSetEmsSelect(control, optionText) {
  if (!control || control.tagName !== "SELECT") return false;
  const target = docfillerNormalize(optionText);
  for (const opt of control.options) {
    if (docfillerNormalize(opt.text).includes(target)) {
      control.value = opt.value;
      control.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
  }
  return false;
}
