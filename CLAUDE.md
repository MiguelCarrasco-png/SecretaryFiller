# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SecretaryFiller is a Chrome extension (Manifest V3) that autofills two specific university room-reservation forms:

1. A Google Form ("Reservation form COBE 26-27") at `docs.google.com/forms/*`.
2. The UF EMS Cloud Service room request page at `ufl.emscloudservice.com/web/RoomRequest.aspx`.

It never submits either form — it only fills fields; a human always reviews and clicks the site's own Next/Submit/Create Reservation button. This is a small internal tool for one student org secretary, installed via Chrome's "Load unpacked" (Developer Mode), not published to the Web Store.

`main.py` in the repo root is an empty, unused leftover — unrelated to the extension.

## Commands

There is no build step, package manager, linter, or automated test suite — this is plain, no-dependency JS/HTML/CSS loaded directly by Chrome. Development consists of editing files and reloading the unpacked extension.

Checks used during development (run from the repo root):

```bash
# Syntax-check a JS file (no test runner exists, so this is the primary sanity check)
node --check shared/field-finder.js

# Validate manifest.json is well-formed
node -e "JSON.parse(require('fs').readFileSync('manifest.json','utf8'))"
```

To actually test behavior:

1. `chrome://extensions` → enable Developer Mode → **Load unpacked** → select this folder.
2. After editing any file, click the reload icon for SecretaryFiller on `chrome://extensions` (content scripts do not hot-reload).
3. Open the real Google Form or EMS Cloud reservation page, open the SecretaryFiller popup, and click Fill — there is no way to test the actual field-matching logic without the live pages, since both sites lack stable DOM ids and the field-finders depend on their real markup.

## Architecture

Three parts, no bundler — content scripts are multiple plain `<script>` files listed in `manifest.json`'s `content_scripts[].js` arrays and loaded in order into one shared isolated-world scope (not ES modules), so load order matters and every shared identifier is a plain global. To avoid collisions, everything shared uses a `docfiller`/`DOCFILLER_` prefix.

- **`popup/`** — the UI. `popup.js` reads/writes the profile and the current event via `shared/storage.js`, and sends a `{type: "FILL", profile, event}` message to the active tab's content script via `chrome.tabs.sendMessage`. It never touches the target page's DOM directly.
- **`content-scripts/google-form.js`** and **`content-scripts/ems-room-request.js`** — one per site, injected only on their matching host. Each listens for the `FILL` message, walks its site's declarative field list, and replies with `{ok, filled: [...], missed: [...]}` so the popup can show what it found vs. couldn't (site wording changes over time and silently breaks label matching).
- **`shared/`** — logic shared by both content scripts (and, for storage, the popup):
  - `field-finder.js` — two independent DOM-walking strategies, since the two sites have no stable ids/names to key off of. Google Forms: find `div[role="listitem"]` by its `[role="heading"]` text, then set inputs via the native value setter + dispatched events (required because Forms is a JS app that ignores plain `el.value =`), and click `[role="radio"]`/`[role="checkbox"]` elements matched by `aria-label`. EMS/ASP.NET: find a leaf label-ish element containing the target text, then locate the nearest `input`/`select`/`textarea` via the containing row or a short sibling walk, since it's a server-rendered page without predictable ids. `docfillerSetNativeValue` deliberately clears a field before writing a new value (empty → new value, each with a dispatched `input` event, ending in `blur`) — a plain single overwrite can silently no-op on a field that's already been filled once.
  - `field-descriptors-google.js` / `field-descriptors-ems.js` — declarative `{matchLabelText, type, getValue(profile, event)}` rows, one per form question. This is the table to edit when a university site rewords a question or adds/removes a field; nothing else needs to change. Note the EMS list intentionally omits 1st/2nd Contact fields (EMS auto-fills those from the logged-in account) and hardcodes four single-option attestation dropdowns to `"Yes"` rather than sourcing them from the profile.
  - `storage.js` — `chrome.storage.local` wrapper with two keys: `docfiller_profile_v1` (org/contact info + standard EMS attestation answers, edited once) and `docfiller_lastEvent_v1` (the most recent per-booking fields, auto-saved on every fill so repeating a recurring booking is just "open popup, change the date, Fill"). `docfillerDeepMerge` merges stored data onto the current default shape, so old/removed keys in a saved profile are silently dropped and new keys get defaults — this is what makes the schema safe to evolve.
  - `parse-event-text.js` — a pure local regex heuristic (no AI, no network) that takes one freeform pasted paragraph and splits it into `{eventName, eventDateTime, eventDescription}`: it locates a date/time-ish phrase (weekday/month/numeric-date/time patterns clustered by proximity), then treats the text before it as the title and the text after as the description. Because it can't be perfect on arbitrary phrasing, the popup always shows its output as editable fields rather than filling the target form directly from it. When building regex patterns here, prefer composing from real regex literals' `.source` over hand-writing escaped backslashes in plain strings — the two aren't interchangeable and a wrong escape count fails silently (a pattern with a dropped `\b`/`\d`/`\s` still compiles, it just stops matching).

## Data flow for a single fill

`popup.js` reads the raw pasted text + the parsed/edited event fields + the saved profile → sends both to the content script → the content script's descriptor table resolves each field's value and calls the matching field-finder setter → results (`filled`/`missed`) go back to the popup for display. The target form is never auto-submitted at any point in this chain.
