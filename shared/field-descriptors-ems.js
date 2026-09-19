// One entry per field on the EMS Cloud "Reservation Details" page.
// `type: "select"` fields match against visible <option> text (e.g. "Yes"/"No").
// Group/Contact-name dropdowns (Groups, 1st/2nd Contact + phone/email) are
// left alone entirely — they auto-fill from whoever is logged in.

const DOCFILLER_EMS_FIELDS = [
  {
    matchLabelText: "Event Name",
    type: "text",
    getValue: (profile, event) => event.eventName
  },
  {
    matchLabelText: "Event Type",
    type: "select",
    getValue: (profile, event) => event.emsEventType
  },
  {
    // Only one real option on this dropdown — always "Yes", not user-editable.
    matchLabelText: "I acknowledge that instructional space may be reserved by academic faculty",
    type: "select",
    getValue: () => "Yes"
  },
  {
    matchLabelText: "Please provide a brief description of your requested event",
    type: "text",
    getValue: (profile, event) => event.eventDescription
  },
  {
    // Only one real option on this dropdown — always "Yes", not user-editable.
    matchLabelText: "Departments, faculty and staff may not reserve classroom space",
    type: "select",
    getValue: () => "Yes"
  },
  {
    // Only one real option on this dropdown — always "Yes", not user-editable.
    matchLabelText: "During-term examinations are held during regular class times",
    type: "select",
    getValue: () => "Yes"
  },
  {
    matchLabelText: "Do you expect an attendance of 250 or more",
    type: "select",
    getValue: (profile) => profile.ems.attestations.attendance250Plus
  },
  {
    matchLabelText: "Does your event feature a guest speaker",
    type: "select",
    getValue: (profile) => profile.ems.attestations.guestSpeaker
  },
  {
    matchLabelText: "discuss sensitive topics",
    type: "select",
    getValue: (profile) => profile.ems.attestations.sensitiveTopics
  },
  {
    matchLabelText: "administering your event in collaboration with another organization",
    type: "select",
    getValue: (profile) => profile.ems.attestations.collaboratingOrg
  },
  {
    matchLabelText: "who is also under the age of 18",
    type: "select",
    getValue: (profile) => profile.ems.attestations.under18NonUF
  },
  {
    matchLabelText: "charge an admission fee, sell tickets, or involve any exchange of money",
    type: "select",
    getValue: (profile) => profile.ems.attestations.admissionFee
  },
  {
    matchLabelText: "evening and weekend reservations for classrooms",
    type: "select",
    getValue: (profile) => profile.ems.attestations.eveningWeekendAck
  },
  {
    matchLabelText: "food and drink are prohibited in all instructional spaces",
    type: "select",
    getValue: (profile) => profile.ems.attestations.foodDrinkAck
  },
  {
    matchLabelText: "all chairs, tables or other furniture",
    type: "select",
    getValue: (profile) => profile.ems.attestations.furnitureAck
  },
  {
    matchLabelText: "playing music in or dancing in classrooms is prohibited",
    type: "select",
    getValue: (profile) => profile.ems.attestations.musicDancingAck
  },
  {
    matchLabelText: "university classes and exams always take priority",
    type: "select",
    getValue: (profile) => profile.ems.attestations.classPriorityAck
  },
  {
    matchLabelText: "Propping open exterior building doors",
    type: "select",
    getValue: (profile) => profile.ems.attestations.doorPropAck
  },
  {
    // Only one real option on this dropdown — always "Yes", not user-editable.
    matchLabelText: "Registrar's Office may decline room requests during peak periods",
    type: "select",
    getValue: () => "Yes"
  }
];
