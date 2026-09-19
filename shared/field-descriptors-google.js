// One entry per question on the Google Form. `getValue` reads from the
// profile (saved once) or the event (edited per booking) and returns the
// value to fill; `type` tells the content script which setter to use.

const DOCFILLER_GOOGLE_FIELDS = [
  {
    matchLabelText: "Name (First and Last)",
    type: "text",
    getValue: (profile) => profile.contact.fullName
  },
  {
    matchLabelText: "Phone Number",
    type: "text",
    getValue: (profile) => profile.contact.phone
  },
  {
    matchLabelText: "UFL Email",
    type: "text",
    getValue: (profile) => profile.contact.uflEmail
  },
  {
    matchLabelText: "This reservation is for",
    type: "radio",
    getValue: (profile) => profile.reservationForType
  },
  {
    // Same answer as "name of the individual or entity" below — the user
    // confirmed these two questions are always filled in identically.
    matchLabelText: "full name of your Student Organization",
    type: "text",
    getValue: (profile) => profile.orgOrDeptName
  },
  {
    matchLabelText: "name of the individual or entity",
    type: "text",
    getValue: (profile) => profile.orgOrDeptName
  },
  {
    matchLabelText: "Event Name/Title",
    type: "text",
    getValue: (profile, event) => event.eventName
  },
  {
    matchLabelText: "Event Date & Time",
    type: "text",
    getValue: (profile, event) => event.eventDateTime
  },
  {
    matchLabelText: "What is your reservation request for",
    type: "radio",
    getValue: (profile, event) => event.reservationRequestType
  },
  {
    matchLabelText: "Event Description",
    type: "text",
    getValue: (profile, event) => event.eventDescription
  },
  {
    matchLabelText: "Do you have an event permit",
    type: "radio",
    getValue: (profile) =>
      profile.permit.hasPermit
        ? "Yes, I have an event permit."
        : "No, I do not have an event permit yet for my event."
  },
  {
    matchLabelText: "name & email address of person who submitted permit",
    type: "text",
    getValue: (profile) => profile.permit.submitterNameEmail
  },
  {
    // The heading for this question is the "submit a permit within 24 hours"
    // notice paragraph; "I certify..." is only the (single) radio option text,
    // not the heading — confirmed against the live form's DOM.
    matchLabelText: "You must submit an event permit within 24 hours",
    type: "radio",
    getValue: () => "I certify"
  },
  {
    matchLabelText: "Which space are you seeking to reserve",
    type: "checkbox",
    getValue: (profile, event) => event.spaceSelections
  }
];
