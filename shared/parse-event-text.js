// Turns one pasted, unstructured blob of event info into a best-effort guess
// at {eventName, eventDateTime, eventDescription}. Pure local regex
// heuristics — no network calls, no AI. It won't always get it right on
// truly free-form text, so the popup always shows the three results as
// editable fields before anything gets filled into a real form.

const DOCFILLER_WEEKDAY_SRC =
  "(?:Mon(?:day)?|Tue(?:s(?:day)?)?|Wed(?:nesday)?|Thu(?:rs(?:day)?)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)";
const DOCFILLER_MONTH_SRC =
  "(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)";

// Built from real regex literals (`.source`) wherever backslashes are
// involved, so the metacharacters are never hand-typed inside plain strings.
const DOCFILLER_TIME_ONE_RE = /\d{1,2}(?::\d{2})?\s*(?:am|pm|a\.m\.|p\.m\.)?/;
const DOCFILLER_RANGE_JOIN_RE = /\s*(?:-|to|through)\s*/;
const DOCFILLER_TIME_RANGE_SRC =
  DOCFILLER_TIME_ONE_RE.source + DOCFILLER_RANGE_JOIN_RE.source + DOCFILLER_TIME_ONE_RE.source;

const DOCFILLER_DATE_PATTERNS = [
  new RegExp("\\b(?:this |next |every )?" + DOCFILLER_WEEKDAY_SRC + "\\b", "gi"),
  new RegExp(
    "\\b" + DOCFILLER_MONTH_SRC + "\\.?\\s+\\d{1,2}(?:st|nd|rd|th)?(?:,?\\s*\\d{4})?\\b",
    "gi"
  ),
  /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/g
];

const DOCFILLER_TIME_PATTERNS = [
  new RegExp("\\b" + DOCFILLER_TIME_RANGE_SRC + "\\b", "gi"),
  new RegExp("\\b" + DOCFILLER_TIME_ONE_RE.source + "\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)\\b", "gi")
];

// How close two date/time-ish matches need to be (in characters) to be
// treated as one contiguous date/time phrase (covers connectors like
// " at ", " from ", ", ").
const DOCFILLER_CONNECTOR_GAP = 15;

const DOCFILLER_LEADING_FILLER_RE =
  /^[\s,.\-:]*\b(?:on|at|for|this|next|every|starting|from)?\b[\s,.\-:]*/i;
const DOCFILLER_TRAILING_FILLER_RE =
  /[\s,.\-:]*\b(?:on|at|for|this|next|every|starting|from)?\b[\s,.\-:]*$/i;

function docfillerCollectMatches(patterns, text) {
  const matches = [];
  for (const re of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      matches.push({ start: m.index, end: m.index + m[0].length });
      if (m[0].length === 0) re.lastIndex++;
    }
  }
  return matches;
}

function docfillerClusterMatches(matches) {
  if (!matches.length) return [];
  const sorted = [...matches].sort((a, b) => a.start - b.start);
  const clusters = [];
  let cur = { start: sorted[0].start, end: sorted[0].end };
  for (let i = 1; i < sorted.length; i++) {
    const m = sorted[i];
    if (m.start - cur.end <= DOCFILLER_CONNECTOR_GAP) {
      cur.end = Math.max(cur.end, m.end);
    } else {
      clusters.push(cur);
      cur = { start: m.start, end: m.end };
    }
  }
  clusters.push(cur);
  return clusters;
}

function docfillerTrimConnectors(s) {
  return s.replace(DOCFILLER_LEADING_FILLER_RE, "").replace(DOCFILLER_TRAILING_FILLER_RE, "").trim();
}

function docfillerFirstClause(s, maxWords = 10) {
  const trimmed = s.trim();
  if (!trimmed) return "";
  const stopMatch = trimmed.match(/^[^.,;\n]+/);
  let clause = stopMatch ? stopMatch[0].trim() : trimmed;
  const words = clause.split(/\s+/);
  if (words.length > maxWords) clause = words.slice(0, maxWords).join(" ");
  return clause;
}

function docfillerParseEventText(rawText) {
  const text = (rawText || "").trim();
  if (!text) return { eventName: "", eventDateTime: "", eventDescription: "" };

  const dateMatches = docfillerCollectMatches(DOCFILLER_DATE_PATTERNS, text);
  const timeMatches = docfillerCollectMatches(DOCFILLER_TIME_PATTERNS, text);
  const allMatches = [...dateMatches, ...timeMatches];

  if (!allMatches.length) {
    return { eventName: docfillerFirstClause(text), eventDateTime: "", eventDescription: text };
  }

  const clusters = docfillerClusterMatches(allMatches)
    .map((c) => ({
      start: c.start,
      end: c.end,
      hasDate: dateMatches.some((d) => d.start >= c.start && d.end <= c.end),
      hasTime: timeMatches.some((t) => t.start >= c.start && t.end <= c.end)
    }))
    .sort((a, b) => {
      const score = (x) => (x.hasDate && x.hasTime ? 2 : x.hasDate || x.hasTime ? 1 : 0);
      return score(b) - score(a) || b.end - b.start - (a.end - a.start);
    });

  const best = clusters[0];
  const eventDateTime = text.slice(best.start, best.end).trim();

  const before = docfillerTrimConnectors(text.slice(0, best.start));
  const after = docfillerTrimConnectors(text.slice(best.end));

  let eventName;
  let eventDescription;

  if (before) {
    eventName = docfillerFirstClause(before, 12);
    eventDescription = (after || text).trim();
  } else if (after) {
    eventName = docfillerFirstClause(after, 10);
    eventDescription = text.trim();
  } else {
    eventName = docfillerFirstClause(text);
    eventDescription = text.trim();
  }

  return { eventName, eventDateTime, eventDescription };
}
