# Chrome Web Store listing copy — SecretaryFiller

Copy-paste these into the Developer Dashboard fields. Everything here is drafted to be accurate and honest about what the extension actually does and who it's for — it's a narrow, single-org internal tool, not a general product, so the copy says that plainly rather than oversell it.

## Short description (≤132 characters)

```
Autofills your org's COBE Google Form and UF EMS room-reservation forms from a saved profile. Never auto-submits.
```
(113 characters)

## Detailed description

```
SecretaryFiller autofills the repeated parts of two specific room-reservation forms:

• The "Reservation form COBE 26-27" Google Form
• The UF EMS Cloud Service room request page

It's built for one specific student organization's officer who books the same rooms
and fills the same org/contact details over and over — including recurring events
(GBMs, cabinet meetings, etc.) that need the same title and description every time,
just a different date.

What it does:
- Saves your contact info, organization name, and standard EMS acknowledgement
  answers once, then fills them in automatically.
- Lets you paste one freeform sentence about an event ("GBM Monday Oct 6 5-7pm at
  La Casita...") and splits it into title, date/time, and description fields for
  you to review.
- Saves reusable templates for recurring event types, so repeating a booking is
  just: pick the template, change the date, click Fill.
- NEVER submits either form for you. It only fills in fields — you always review
  the page and click the site's own Next/Submit/Create Reservation button yourself.

What it doesn't do:
- It does not work on any other Google Form — only the one specific COBE
  reservation form it's scoped to.
- It collects no data and makes no network requests of its own. Everything you
  enter is stored locally in your browser only. See the privacy policy for details.

This extension is scoped to one organization's specific forms and will not be
useful outside that context.
```

## Single purpose statement

```
Autofills two specific university room-reservation forms (a designated Google
Form and the UF EMS Cloud Service page) with information the user has saved in
the extension, so the user doesn't have to retype the same organization and
contact details on every booking.
```

## Permission justifications

**`host_permissions`: `https://docs.google.com/forms/d/e/1FAIpQLSfHkpvwhzcbWnO7VV-VL_wQcl0xC1A_S0a-admjNk_cDdZWnA/*`**
```
This extension fills form fields on one specific, designated Google Form used by
the organization for room reservations. The permission is scoped to that exact
form's URL, not to Google Forms generally, so the extension cannot read or modify
any other form.
```

**`host_permissions`: `https://ufl.emscloudservice.com/*`**
```
This extension fills form fields on the University of Florida's EMS Cloud Service
room-request page, which the organization uses for a second, separate room-booking
system. The extension only activates on the reservation-details step of this site.
```

**`permissions`: `storage`**
```
Used to save the user's profile (contact/org info, standard EMS answers), their
most recent event details, and any saved templates locally via chrome.storage.local,
so they don't have to re-enter the same information on every booking. Nothing is
ever transmitted off the device.
```

## Data disclosure questionnaire (Privacy practices tab)

- **Does this item collect or use personal or sensitive user data?** Technically yes — the user's own name, phone number, and email are stored (locally) so the extension can autofill them. Answer honestly: personal communications / contact info is *used* by the extension's core functionality, but never collected by the developer, never transmitted, never sold, and never used for purposes unrelated to filling the two specific forms.
- **Is data sold to third parties?** No.
- **Is data used for purposes unrelated to the item's core functionality?** No.
- **Is data used to determine creditworthiness or for lending purposes?** No.
- **Privacy policy URL:** `https://miguelcarrasco-png.github.io/SecretaryFiller/`

## Visibility

Set to **Unlisted** — this extension is hardcoded to one organization's specific form and one university's system, so it provides no value to the general public and shouldn't be searchable. Share the direct Chrome Web Store item link with whoever needs to install it.
