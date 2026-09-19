# Publishing SecretaryFiller to the Chrome Web Store

Everything local is prepared (icons, manifest, privacy policy, listing copy, packaged zip). This checklist covers what's left in the actual [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole) — I can't do this part for you since it's your paid developer account.

## 1. Grab 1-2 screenshots

The dashboard requires at least one screenshot (1280×800 or 640×400 PNG/JPEG). Fastest way: open the extension popup yourself on the real Google Form or EMS page and take a screenshot or two — you already use it daily, so this takes seconds for you versus me trying to fake a convincing one.

## 2. Upload the package

1. Go to the dashboard → **New Item**.
2. Upload `secretaryfiller.zip` (built by the packaging step — see `README.md`/ask me to rebuild it if you've made further edits since).

## 3. Fill in the Store Listing tab

Copy-paste from `store-listing.md` in this repo:
- **Short description** → the short description block
- **Detailed description** → the detailed description block
- **Category** → Productivity (or "Tools", whichever fits best in the current dropdown)
- **Screenshots** → the ones you grabbed in step 1
- **Icon** → `icons/icon128.png` (also already embedded in the package via the manifest)

## 4. Privacy practices tab

- **Single purpose** → paste the single-purpose statement from `store-listing.md`
- **Permission justifications** → one field per permission; paste the matching justification from `store-listing.md` for `storage` and each `host_permissions` entry
- **Data usage questionnaire** → answer per the "Data disclosure questionnaire" section in `store-listing.md`
- **Privacy policy URL** → `https://miguelcarrasco-png.github.io/SecretaryFiller/`

## 5. Distribution / Visibility

Set **Visibility** to **Unlisted** (not Public) — confirmed choice, since this extension only works for your org's specific form and university system.

## 6. Submit for review

Submit. Google's review for a simple, narrowly-scoped extension like this is typically fast (often under a few days), but can occasionally ask follow-up questions about permissions — if that happens, send me what they're asking and I can help draft a response or adjust the code if something needs to change.

## 7. After approval

You'll get an Unlisted item link from the dashboard (something like `https://chromewebstore.google.com/detail/<id>`). That's the link to send your boss — it installs in two clicks, no Developer Mode required.
