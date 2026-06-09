const INDEX_KEY = "eventsheet:eventIndex";
const EVENT_KEY_PREFIX = "eventsheet:event:";

export function createEventId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyPreview() {
  return {
    guests: [],
    seating: [],
    suppliers: [],
    budget: [],
    risks: [],
    seatingRecommendations: [],
    seatingPlan: null,
    finalBrief: "",
  };
}

export function createEventRecord(initial = {}) {
  const now = new Date().toISOString();
  const eventId = initial.eventId || createEventId();
  return {
    eventId,
    clientName: initial.clientName || "",
    name: initial.name || "",
    date: initial.date || "",
    venue: initial.venue || "",
    estimatedGuests: initial.estimatedGuests || "",
    rawInfo: initial.rawInfo || "",
    createdAt: initial.createdAt || now,
    updatedAt: initial.updatedAt || now,
    status: initial.status || "טיוטה",
    preview: normalizePreview(initial.preview),
    workbookMeta: initial.workbookMeta || null,
  };
}

export function normalizePreview(preview = {}) {
  return {
    ...createEmptyPreview(),
    ...preview,
    guests: Array.isArray(preview.guests) ? preview.guests : [],
    seating: Array.isArray(preview.seating) ? preview.seating : [],
    suppliers: Array.isArray(preview.suppliers) ? preview.suppliers : [],
    budget: Array.isArray(preview.budget) ? preview.budget : [],
    risks: Array.isArray(preview.risks) ? preview.risks : [],
    seatingRecommendations: Array.isArray(preview.seatingRecommendations) ? preview.seatingRecommendations : [],
    seatingPlan: preview.seatingPlan || null,
  };
}

export function saveEventRecord(record) {
  if (!canUseStorage()) return record;
  const updated = {
    ...createEventRecord(record),
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(eventKey(updated.eventId), JSON.stringify(updated));
  const index = listEventRecords().filter((item) => item.eventId !== updated.eventId);
  index.unshift(toIndexEntry(updated));
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  return updated;
}

export function loadEventRecord(eventId) {
  if (!canUseStorage() || !eventId) return null;
  try {
    const raw = localStorage.getItem(eventKey(eventId));
    return raw ? createEventRecord(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function listEventRecords() {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const index = raw ? JSON.parse(raw) : [];
    return Array.isArray(index) ? index : [];
  } catch {
    return [];
  }
}

export function deleteEventRecord(eventId) {
  if (!canUseStorage() || !eventId) return;
  localStorage.removeItem(eventKey(eventId));
  const index = listEventRecords().filter((item) => item.eventId !== eventId);
  localStorage.setItem(INDEX_KEY, JSON.stringify(index));
}

export function getEventIdFromUrl(url = window.location.href) {
  try {
    return new URL(url).searchParams.get("eventId") || "";
  } catch {
    return "";
  }
}

export function buildEventUrl(eventId, hash = "overview", origin = getDefaultOrigin()) {
  const safeHash = String(hash || "overview").replace(/^#/, "");
  return `${String(origin || getDefaultOrigin()).replace(/\/+$/, "")}/?eventId=${encodeURIComponent(eventId)}#${safeHash}`;
}

function toIndexEntry(record) {
  return {
    eventId: record.eventId,
    clientName: record.clientName || "",
    name: record.name || "אירוע ללא שם",
    date: record.date || "",
    venue: record.venue || "",
    updatedAt: record.updatedAt,
    status: record.status || "טיוטה",
  };
}

function eventKey(eventId) {
  return `${EVENT_KEY_PREFIX}${eventId}`;
}

function canUseStorage() {
  try {
    return typeof localStorage !== "undefined";
  } catch {
    return false;
  }
}

function getDefaultOrigin() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "http://127.0.0.1:5173";
}
