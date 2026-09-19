# SecretaryFiller — Room Reservation Autofill

A small Chrome extension that fills in the repeated parts of two room-reservation
forms (the COBE Google Form and the UF EMS Cloud room request page) so you only
have to type the event name, date, and room once your profile is saved.

**It never submits anything for you.** It only fills in the boxes — you always
review the page and click the site's own Next / Submit / Create Reservation
button yourself.

## Install (one-time, about 2 minutes)

1. Open Chrome and go to `chrome://extensions` (type that in the address bar).
2. Turn on **Developer mode** using the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select this project's folder (the one containing `manifest.json`).
5. You should see "SecretaryFiller - Room Reservation Autofill" appear in your
   extensions list. Pin it to your toolbar by clicking the puzzle-piece icon
   in Chrome's toolbar, then the pin next to SecretaryFiller, so it's always visible.

## Set up your profile (one-time)

1. Click the SecretaryFiller icon in your toolbar.
2. Go to the **Profile** tab.
3. Fill in your name, phone, email, organization name, and the standard
   Yes/No answers for the UF EMS acknowledgement questions (these rarely
   change between bookings).
4. Click **Save Profile**.

You only need to do this once. Come back and update it if your contact info
or standard answers ever change.

Two things you won't see on the Profile tab, on purpose:
- The **org/dept name** field is used for both the "Student Organization"
  question and the "individual or entity" question on the Google Form, since
  they're always the same answer.
- Four of the EMS acknowledgement dropdowns are always filled with the only
  real option they have, so they're not shown as a choice. EMS contact phone/
  email also aren't shown — EMS fills those in itself from whoever's logged in.

## Fill out a reservation

1. Open the Google Form or the UF EMS room request page like normal.
2. Click the SecretaryFiller icon → **Fill Event** tab.
3. In the **Paste event info** box, type or paste everything about the event
   in one go — name, date/time, and description together, in your own words.
   For example: *"GBM meeting Monday Oct 6 from 5-7pm at La Casita to go over
   budget planning for the semester."*
4. SecretaryFiller automatically splits that into three fields (Event Name, Date &
   Time, Description) right below the paste box. **Glance over them** — the
   splitting is a best guess, not perfect, so fix anything that looks off
   before moving on. It's usually right, but double-check the date/time
   especially.
5. Pick the room(s) and any other options, then click **Fill this page**.
6. Check the boxes it filled in look right, then click the page's own
   **Next** / **Submit** / **Create Reservation** button yourself.

### For recurring events (e.g. filling the same form 10 times)

Every time you click "Fill this page," SecretaryFiller remembers what you typed.
So for the next occurrence:

1. Open a fresh copy of the form.
2. Click the SecretaryFiller icon — your last event details are already filled in.
3. Just change the date.
4. Click **Fill this page** again, review, and submit.

## Notes on the Google Form

This form requires you to be **signed into a Google account** before it will
let you fill anything in — if you see a "Sign in to continue" prompt, sign in
first, then open the SecretaryFiller popup and click Fill.

SecretaryFiller only fills in whatever's currently visible on the page. If the form
ever gets split into multiple pages/sections in the future, just click Fill
again after clicking Google's own **Next** button to fill the next section.

## Notes on the UF EMS Cloud page

You need to be logged into your UF account and have already picked a room/date
before you reach the page SecretaryFiller fills in (the "Reservation Details" step).
If SecretaryFiller says it can't find a field, it's usually because that page's
wording changed slightly — let whoever set this up know so the matching text
can be updated.

## If something looks off

SecretaryFiller tells you after each fill how many fields it found vs. couldn't
find. If a field is listed as "couldn't find," just fill that one in by hand —
everything else it filled should still be correct. Universities sometimes
reword form questions, which can break the text-matching this extension uses
to find fields; if that starts happening a lot, the matching text in the
`shared/field-descriptors-*.js` files needs a small update.
