import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { buildWorkbook, parseMessyEventInfo, sheetNames, workbookToBuffer, workbookVersion } from "../src/eventsheetWorkbook.js";
import { createEventRecord, deleteEventRecord, listEventRecords, loadEventRecord, saveEventRecord } from "../src/eventStorage.js";
import { applySeatingRecommendationPlan, buildSeatingRecommendationPlan, seatingPlanToNotes } from "../src/seatingIntelligence.js";

const store = new Map();
global.localStorage = {
  getItem: (key) => store.get(key) || null,
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
};

const localRecord = saveEventRecord(createEventRecord({
  name: "חתונת דמו",
  date: "2026-07-18",
  venue: "גן עדן אירועים",
}));
const loadedLocalRecord = loadEventRecord(localRecord.eventId);
const secondRecord = saveEventRecord(createEventRecord({ name: "אירוע שני" }));
const persistenceOk = Boolean(loadedLocalRecord)
  && loadedLocalRecord.eventId === localRecord.eventId
  && listEventRecords().length === 2
  && listEventRecords()[0].eventId === secondRecord.eventId;
deleteEventRecord(secondRecord.eventId);
const isolationOk = listEventRecords().length === 1 && listEventRecords()[0].eventId === localRecord.eventId;

const seatingGuests = [
  { name: "אורי", status: "מאשר הגעה", category: "חברי צבא", table: 0 },
  { name: "רן", status: "מאשר הגעה", category: "חברי צבא", table: 0 },
  { name: "גל", status: "מאשר הגעה", category: "חברי צבא", table: 0 },
  { name: "דנה", status: "מאשר הגעה", category: "משפחה כלה", table: 0 },
  { name: "מיכל", status: "מאשר הגעה", category: "משפחה כלה", table: 0 },
  { name: "עידו", status: "מאשר הגעה", category: "משפחה כלה", table: 0 },
  { name: "שיר", status: "מאשר הגעה", category: "משפחה כלה", table: 0 },
  { name: "ליאור", status: "טרם השיב", category: "חברי צבא", table: 0 },
];
const seatingTables = [
  { table: 1, label: "שולחן 1", capacity: 3, category: "חברי צבא" },
  { table: 2, label: "שולחן 2", capacity: 2, category: "משפחה כלה" },
  { table: 3, label: "שולחן 3", capacity: 2, category: "משפחה כלה" },
];
seatingGuests.forEach((guest, index) => {
  guest.status = index < 7 ? "attending" : "pending";
});
const seatingPlan = buildSeatingRecommendationPlan(seatingGuests, seatingTables);
const appliedSeatingGuests = applySeatingRecommendationPlan(seatingGuests, seatingPlan);
const seatingAlgorithmOk = seatingPlan.recommendations.some((recommendation) => recommendation.category === "חברי צבא" && recommendation.status === "together" && recommendation.tables.includes(1))
  && seatingPlan.recommendations.some((recommendation) => recommendation.category === "משפחה כלה" && recommendation.status === "split" && recommendation.tables.length === 2)
  && seatingPlan.pendingGuests.length === 1
  && seatingTables.every((table) => appliedSeatingGuests.filter((guest) => Number(guest.table) === Number(table.table)).length <= table.capacity);

const eventScopedCategoriesOk = (() => {
  const first = saveEventRecord(createEventRecord({ name: "קטגוריות א", preview: { guests: [{ name: "א", category: "צבא", status: "מאשר הגעה" }] } }));
  const second = saveEventRecord(createEventRecord({ name: "קטגוריות ב", preview: { guests: [{ name: "ב", category: "עבודה", status: "מאשר הגעה" }] } }));
  return loadEventRecord(first.eventId).preview.guests[0].category === "צבא"
    && loadEventRecord(second.eventId).preview.guests[0].category === "עבודה"
    && loadEventRecord(first.eventId).preview.guests[0].category !== loadEventRecord(second.eventId).preview.guests[0].category;
})();

const parsed = parseMessyEventInfo({
  eventId: localRecord.eventId,
  name: "",
  date: "2026-07-18",
  venue: "",
  estimatedGuests: "250",
  rawInfo: `אירוע: חתונת נועה ודניאל
מקום: גן עדן אירועים
אורחים:
מולר חבר גרעין
מידן חבר גרעין
תואם חבר גרעין וחבר לימודים
זוהר חברה לימודים
פלג חברה לימודים
נועה כהן - משפחת הכלה - מאשר הגעה - שולחן 1 - טבעוני
דניאל לוי - משפחת החתן - טרם השיב - שולחן 2
ספקים:
קייטרינג טעם טוב 42000 מקדמה 12000 050-8887766
צילום רגעים 11000 שולם 4000
תקציב:
אולם 65000
סיכון: אלרגיה חמורה לאגוזים אצל אורח VIP`,
});
parsed.seatingPlan = buildSeatingRecommendationPlan(parsed.guests, parsed.seating);
parsed.seatingRecommendations = seatingPlanToNotes(parsed.seatingPlan);

const parserOk = parsed.guests.length >= 7
  && parsed.suppliers.length === 2
  && parsed.budget.length >= 3
  && parsed.risks.length >= 1
  && parsed.seating.length === 2
  && parsed.seatingRecommendations.length >= 1
  && parsed.guests.some((guest) => guest.name === "תואם" && guest.category.includes("חבר גרעין") && guest.category.includes("לימודים"));

const noDefaultSeating = parseMessyEventInfo({
  name: "אירוע ללא שולחנות",
  rawInfo: `אורחים:
מולר חבר גרעין
מידן חבר גרעין`,
}).seating.length === 0;

const eventData = {
  eventId: localRecord.eventId,
  clientName: "משפחת כהן-לוי",
  name: "חתונת נועה ודניאל",
  date: "2026-07-18",
  venue: "גן עדן אירועים",
  estimatedGuests: "250",
};

const workbook = buildWorkbook(eventData, parsed, "http://127.0.0.1:5173");
const buffer = await workbookToBuffer(workbook);
mkdirSync("outputs", { recursive: true });
writeFileSync("outputs/eventsheet-quality-check.xlsx", Buffer.from(buffer));

const loaded = new ExcelJS.Workbook();
await loaded.xlsx.load(readFileSync("outputs/eventsheet-quality-check.xlsx"));

const names = loaded.worksheets.map((sheet) => sheet.name);
const missing = sheetNames.filter((name) => !names.includes(name));
const summary = loaded.getWorksheet("01_סיכום_האירוע");
const guestsSheet = loaded.getWorksheet("02_Guest_Database");
const seating = loaded.getWorksheet("05_Seating");
const suppliers = loaded.getWorksheet("07_Suppliers");
const budget = loaded.getWorksheet("08_Budget");
const risks = loaded.getWorksheet("10_Risks");
const finalBrief = loaded.getWorksheet("11_Final_Brief");
const metadata = loaded.getWorksheet("_EventSheet_Metadata");

const viewsOk = loaded.worksheets.every((sheet) => sheet.views?.[0]?.rightToLeft === true || sheet.name === "_EventSheet_Metadata");
const protectedOk = loaded.worksheets.every((sheet) => Boolean(sheet.sheetProtection));
const zip = await JSZip.loadAsync(buffer);
const sheetOneXml = await zip.file("xl/worksheets/sheet1.xml").async("string");
const hasRtlXml = sheetOneXml.includes('rightToLeft="1"');
const metadataOk = metadata?.state === "veryHidden"
  && metadata.getCell("B2").value === localRecord.eventId
  && metadata.getCell("B6").value === workbookVersion;

const navigationLinks = [
  summary.getCell("B27").value?.hyperlink,
  summary.getCell("B28").value?.hyperlink,
  summary.getCell("B29").value?.hyperlink,
  summary.getCell("B30").value?.hyperlink,
  summary.getCell("B31").value?.hyperlink,
  guestsSheet.getCell("M2").value?.hyperlink,
  seating.getCell("M2").value?.hyperlink,
  suppliers.getCell("M2").value?.hyperlink,
  risks.getCell("M2").value?.hyperlink,
].filter(Boolean);
const navigationLinksOk = navigationLinks.length >= 9
  && navigationLinks.every((link) => link.includes(`?eventId=${encodeURIComponent(localRecord.eventId)}`))
  && ["#overview", "#guests", "#seating", "#suppliers", "#risks"].every((hash) => navigationLinks.some((link) => link.endsWith(hash)));

const guestInputCellsEditable = ["B2", "C2", "D2", "E2", "F2", "G2", "B20", "C20", "D20", "E20", "F20", "G20"].every((address) => {
  const cell = guestsSheet.getCell(address);
  return cell.protection?.locked === false && cell.fill?.fgColor?.argb === "FFE9F8EF";
});
const guestFormulaCellsLocked = ["H2", "I2", "J2", "H20", "I20", "J20"].every((address) => {
  const cell = guestsSheet.getCell(address);
  return Boolean(cell.value?.formula) && cell.protection?.locked !== false && cell.fill?.fgColor?.argb === "FFE5E7EB";
});
const supplierInputCellsEditable = ["A11", "B11", "C11", "D11", "E11", "G11", "A20", "B20", "C20", "D20", "E20", "G20"].every((address) => {
  const cell = suppliers.getCell(address);
  return cell.protection?.locked === false && cell.fill?.fgColor?.argb === "FFE9F8EF";
});

const formulaChecks = [
  summary.getCell("B6").value?.formula,
  summary.getCell("B23").value?.formula,
  seating.getCell("B6").value?.formula,
  suppliers.getCell("B3").value?.formula,
  budget.getCell("B4").value?.formula,
  risks.getCell("E2").value?.formula,
  finalBrief.getCell("B2").value?.formula,
].filter(Boolean);
const seatingExportOk = seating.getCell("I14").value
  && seating.getCell("L14").value !== undefined
  && String(finalBrief.getCell("B7").value || "").includes("המלצה");

const emptyWorkbook = buildWorkbook({ eventId: "empty-event", name: "בדיקת ריק" }, {
  guests: [],
  seating: [],
  suppliers: [],
  budget: [],
  risks: [],
  seatingRecommendations: [],
}, "http://127.0.0.1:5173");
const emptyBuffer = await workbookToBuffer(emptyWorkbook);
const emptyLoaded = new ExcelJS.Workbook();
await emptyLoaded.xlsx.load(emptyBuffer);
const emptySeating = emptyLoaded.getWorksheet("05_Seating");
const noFakeSeatingExported = emptySeating.getCell("A14").value === "לא זוהה מידע — לעדכון ידני"
  && emptySeating.getCell("A15").value !== 1
  && emptyLoaded.getWorksheet("06_Venue").getCell("B5").value === 0;

const combinedText = [
  summary.getCell("B2").value,
  summary.getCell("B5").value,
  guestsSheet.getCell("B2").value,
  finalBrief.getCell("B7").value,
].join(" ");
const summaryVisibleText = [];
summary.eachRow((row) => {
  row.eachCell((cell) => {
    if (cell.value?.formula) return;
    summaryVisibleText.push(cell.value?.text || cell.value || "");
  });
});
const hiddenTechnicalLanguageOk = ![
  "01_Command_Center",
  "Guest_Database_02",
  "Budget_08",
  "Seating_05",
  "Risks_10",
].some((term) => summaryVisibleText.join(" ").includes(term));
const printSetupOk = summary.pageSetup?.fitToPage === true
  && summary.pageSetup?.printArea === "A1:C31"
  && finalBrief.pageSetup?.printArea === "A1:B8";

if (
  !persistenceOk ||
  !isolationOk ||
  !seatingAlgorithmOk ||
  !eventScopedCategoriesOk ||
  !parserOk ||
  !noDefaultSeating ||
  missing.length ||
  combinedText.includes("????") ||
  !viewsOk ||
  !hasRtlXml ||
  !protectedOk ||
  !metadataOk ||
  !navigationLinksOk ||
  !guestInputCellsEditable ||
  !guestFormulaCellsLocked ||
  !supplierInputCellsEditable ||
  formulaChecks.length < 7 ||
  !seatingExportOk ||
  !noFakeSeatingExported ||
  !hiddenTechnicalLanguageOk ||
  !printSetupOk
) {
  throw new Error(JSON.stringify({
    persistenceOk,
    isolationOk,
    seatingAlgorithmOk,
    eventScopedCategoriesOk,
    parserOk,
    parserDetails: {
      guests: parsed.guests.length,
      suppliers: parsed.suppliers.length,
      budget: parsed.budget.length,
      risks: parsed.risks.length,
      seating: parsed.seating.length,
      recommendations: parsed.seatingRecommendations.length,
      guestsPreview: parsed.guests.slice(0, 8),
      suppliersPreview: parsed.suppliers,
    },
    noDefaultSeating,
    missing,
    viewsOk,
    hasRtlXml,
    protectedOk,
    metadataOk,
    navigationLinks,
    navigationLinksOk,
    guestInputCellsEditable,
    guestFormulaCellsLocked,
    supplierInputCellsEditable,
    formulaChecks,
    seatingExportOk,
    noFakeSeatingExported,
    hiddenTechnicalLanguageOk,
    printSetupOk,
    combinedText,
  }, null, 2));
}

console.log(JSON.stringify({
  persistenceOk,
  isolationOk,
  seatingAlgorithm: {
    ok: seatingAlgorithmOk,
    recommendations: seatingPlan.recommendations.length,
    assignments: seatingPlan.assignments.length,
    pendingGuests: seatingPlan.pendingGuests.length,
  },
  eventScopedCategoriesOk,
  parser: {
    guests: parsed.guests.length,
    suppliers: parsed.suppliers.length,
    seatingTables: parsed.seating.length,
    recommendations: parsed.seatingRecommendations.length,
    noDefaultSeating,
  },
  workbook: {
    sheetCount: names.length,
    missing,
    metadataOk,
    navigationLinks: navigationLinks.length,
    viewsOk,
    hasRtlXml,
    protectedOk,
    formulaChecks: formulaChecks.length,
    noFakeSeatingExported,
    hiddenTechnicalLanguageOk,
    printSetupOk,
  },
}, null, 2));
