import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import { buildWorkbook, parseMessyEventInfo, sheetNames, workbookToBuffer } from "../src/eventsheetWorkbook.js";
import { buildEventUrl, createEventRecord, listEventRecords, loadEventRecord, saveEventRecord } from "../src/eventStorage.js";
import { applySeatingRecommendationPlan, buildSeatingRecommendationPlan, seatingPlanToNotes } from "../src/seatingIntelligence.js";

const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const rawInfo = `אירוע: חתונת נועה ודניאל
לקוח: משפחת כהן-לוי
מקום: גן עדן אירועים
תאריך: 2026-07-18
אורחים:
מולר חבר גרעין
מידן חבר גרעין
תואם חבר גרעין וחבר לימודים
זוהר חברה לימודים
פלג חברה לימודים
נועה כהן - משפחת הכלה - מאשר הגעה - שולחן 1 - טבעוני
דניאל לוי - משפחת החתן - טרם השיב - שולחן 2
ספקים:
קייטרינג טעם טוב - 42000 - מקדמה 12000 - 050-8887766
צילום רגעים - 11000 - שולם 4000
תקציב:
אולם - 65000
סיכון: אלרגיה חמורה לאגוזים אצל אורח VIP`;

let eventRecord = saveEventRecord(createEventRecord({
  clientName: "משפחת כהן-לוי",
  name: "חתונת QA",
  date: "2026-07-18",
  venue: "גן עדן אירועים",
  estimatedGuests: "250",
  rawInfo,
}));

const parsed = parseMessyEventInfo(eventRecord);
eventRecord = saveEventRecord({
  ...eventRecord,
  ...parsed.eventPatch,
  status: "מאורגן",
  preview: parsed,
});

const reloaded = loadEventRecord(eventRecord.eventId);
if (!reloaded || reloaded.eventId !== eventRecord.eventId || listEventRecords().length !== 1) {
  throw new Error("Event persistence failed.");
}

const guestIndex = reloaded.preview.guests.findIndex((guest) => guest.name === "דניאל לוי");
reloaded.preview.guests[guestIndex] = {
  ...reloaded.preview.guests[guestIndex],
  status: "מאשר הגעה",
  category: "משפחה, VIP",
};
reloaded.preview.guests = reloaded.preview.guests.map((guest) => ["מולר", "מידן", "תואם", "זוהר", "פלג"].includes(guest.name) ? { ...guest, status: "מאשר הגעה" } : guest);
reloaded.preview.suppliers.push({
  category: "בר",
  name: "בר הבית",
  contact: "רועי",
  phone: "050-1112233",
  email: "",
  amount: 18000,
  paid: 0,
  status: "פתוח לתשלום",
  dueDate: "2026-07-01",
  notes: "נוסף בבדיקת QA",
});
reloaded.preview.seating.push({ table: 3, label: "שולחן 3", capacity: 10, category: "חברים", notes: "נוסף בבדיקת QA" });
reloaded.preview.seatingPlan = buildSeatingRecommendationPlan(reloaded.preview.guests, reloaded.preview.seating, { includeExistingAssignments: true });
reloaded.preview.guests = applySeatingRecommendationPlan(reloaded.preview.guests, reloaded.preview.seatingPlan);
reloaded.preview.seatingRecommendations = seatingPlanToNotes(reloaded.preview.seatingPlan);
eventRecord = saveEventRecord(reloaded);

const workbook = buildWorkbook(eventRecord, eventRecord.preview, "http://127.0.0.1:5173");
const buffer = await workbookToBuffer(workbook);
mkdirSync("outputs", { recursive: true });
const filePath = "outputs/final-demo-lock.xlsx";
writeFileSync(filePath, Buffer.from(buffer));

const loaded = new ExcelJS.Workbook();
await loaded.xlsx.load(readFileSync(filePath));
const names = loaded.worksheets.map((sheet) => sheet.name);
const missing = sheetNames.filter((name) => !names.includes(name));
const summary = loaded.getWorksheet("01_סיכום_האירוע");
const guests = loaded.getWorksheet("02_Guest_Database");
const seating = loaded.getWorksheet("05_Seating");
const suppliers = loaded.getWorksheet("07_Suppliers");
const metadata = loaded.getWorksheet("_EventSheet_Metadata");
const seatingLink = seating.getCell("M2").value?.hyperlink;
const expectedUrl = buildEventUrl(eventRecord.eventId, "seating", "http://127.0.0.1:5173");
const text = [
  summary.getCell("B2").value,
  guests.getCell("B2").value,
  suppliers.getCell("B12").value,
  loaded.getWorksheet("11_Final_Brief").getCell("B7").value,
].join(" ");

const ok = missing.length === 0
  && metadata?.getCell("B2").value === eventRecord.eventId
  && seatingLink === expectedUrl
  && seating.getColumn(1).values.includes(3)
  && guests.getColumn(6).values.some((value) => Number(value) === 3)
  && String(seating.getColumn(12).values.join(" ")).includes("המלצה")
  && !text.includes("????");

if (!ok) {
  throw new Error(JSON.stringify({
    missing,
    metadataEventId: metadata?.getCell("B2").value,
    eventId: eventRecord.eventId,
    seatingLink,
    expectedUrl,
    seatingA16: seating.getCell("A16").value,
    seatingNotes: seating.getColumn(12).values,
    text,
  }, null, 2));
}

console.log(JSON.stringify({
  eventId: eventRecord.eventId,
  persisted: Boolean(loadEventRecord(eventRecord.eventId)),
  eventCount: listEventRecords().length,
  parsedGuests: parsed.guests.length,
  parsedSuppliers: parsed.suppliers.length,
  editedGuest: "דניאל לוי",
  addedSupplier: "בר הבית",
  assignedTable: 3,
  recommendations: reloaded.preview.seatingPlan.recommendations.length,
  workbook: filePath,
  sheetCount: names.length,
  missing,
  seatingLink,
  hebrewOk: true,
}, null, 2));
