import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { buildWorkbook, parseMessyEventInfo, sheetNames, workbookToBuffer, workbookVersion } from "../src/eventsheetWorkbook.js";
import { createEventRecord, deleteEventRecord, listEventRecords, loadEventRecord, saveEventRecord } from "../src/eventStorage.js";
import { applySeatingRecommendationPlan, buildSeatingRecommendationPlan, checkManualAssignCapacity, seatingPlanToNotes, validateAndApplySeatingPlan } from "../src/seatingIntelligence.js";

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

const seatingCapacityGuardOk = (() => {
  // Master invariant: no table ever exceeds capacity after apply
  const g1 = [
    { name: "א", status: "attending", category: "X", table: 0 },
    { name: "ב", status: "attending", category: "X", table: 0 },
    { name: "ג", status: "attending", category: "X", table: 0 },
    { name: "ד", status: "attending", category: "Y", table: 0 },
    { name: "ה", status: "attending", category: "Y", table: 0 },
  ];
  const t1 = [
    { table: 1, label: "שולחן 1", capacity: 3, category: "X" },
    { table: 2, label: "שולחן 2", capacity: 2, category: "Y" },
  ];
  const p1 = buildSeatingRecommendationPlan(g1, t1, { includeExistingAssignments: true });
  const a1 = applySeatingRecommendationPlan(g1, p1);
  const masterInvariant = t1.every((t) => a1.filter((g) => Number(g.table) === t.table).length <= t.capacity);

  // Exact capacity: all placed, none unassigned
  const g2 = [
    { name: "א", status: "attending", category: "X", table: 0 },
    { name: "ב", status: "attending", category: "X", table: 0 },
    { name: "ג", status: "attending", category: "X", table: 0 },
  ];
  const t2 = [{ table: 1, label: "שולחן 1", capacity: 3, category: "X" }];
  const p2 = buildSeatingRecommendationPlan(g2, t2, { includeExistingAssignments: true });
  const exactCapacity = p2.assignments.length === 3 && p2.unassignedGuests.length === 0
    && p2.recommendations[0]?.status === "together";

  // Over capacity: unassigned guests and warnings
  const g3 = Array.from({ length: 10 }, (_, i) => ({ name: `אורח${i}`, status: "attending", category: "X", table: 0 }));
  const t3 = [{ table: 1, label: "שולחן 1", capacity: 8, category: "X" }];
  const p3 = buildSeatingRecommendationPlan(g3, t3, { includeExistingAssignments: true });
  const a3 = applySeatingRecommendationPlan(g3, p3);
  const overCapacity = p3.unassignedGuests.length === 2
    && p3.warnings.length > 0
    && a3.filter((g) => Number(g.table) === 1).length <= 8;

  // Zero-capacity table gets no guests
  const g4 = [{ name: "א", status: "attending", category: "X", table: 0 }];
  const t4 = [
    { table: 1, label: "שולחן 1", capacity: 0, category: "X" },
    { table: 2, label: "שולחן 2", capacity: 5, category: "X" },
  ];
  const p4 = buildSeatingRecommendationPlan(g4, t4, { includeExistingAssignments: true });
  const a4 = applySeatingRecommendationPlan(g4, p4);
  const zeroCapacity = a4.filter((g) => Number(g.table) === 1).length === 0;

  // No tables: all confirmed guests unassigned
  const g5 = [{ name: "א", status: "attending", category: "X", table: 0 }];
  const p5 = buildSeatingRecommendationPlan(g5, []);
  const noTables = p5.assignments.length === 0 && p5.warnings.length > 0 && p5.unassignedGuests.length === 1;

  // Split across two tables: all placed, none unassigned
  const g6 = Array.from({ length: 5 }, (_, i) => ({ name: `אורח${i}`, status: "attending", category: "X", table: 0 }));
  const t6 = [
    { table: 1, label: "שולחן 1", capacity: 3, category: "X" },
    { table: 2, label: "שולחן 2", capacity: 3, category: "X" },
  ];
  const p6 = buildSeatingRecommendationPlan(g6, t6, { includeExistingAssignments: true });
  const a6 = applySeatingRecommendationPlan(g6, p6);
  const splitAllPlaced = p6.assignments.length === 5 && p6.unassignedGuests.length === 0
    && t6.every((t) => a6.filter((g) => Number(g.table) === t.table).length <= t.capacity);

  // Split with leftovers: 5 guests, capacity 4 total → 1 unassigned
  const g7 = Array.from({ length: 5 }, (_, i) => ({ name: `אורח${i}`, status: "attending", category: "X", table: 0 }));
  const t7 = [
    { table: 1, label: "שולחן 1", capacity: 2, category: "X" },
    { table: 2, label: "שולחן 2", capacity: 2, category: "X" },
  ];
  const p7 = buildSeatingRecommendationPlan(g7, t7, { includeExistingAssignments: true });
  const splitWithLeftovers = p7.unassignedGuests.length === 1 && p7.assignments.length === 4;

  // Manual override locked: existing table preserved in default mode
  const g8 = [
    { name: "מנואל", status: "attending", category: "X", table: 2 },
    { name: "אוטו", status: "attending", category: "X", table: 0 },
  ];
  const t8 = [
    { table: 1, label: "שולחן 1", capacity: 5, category: "X" },
    { table: 2, label: "שולחן 2", capacity: 5, category: "X" },
  ];
  const p8 = buildSeatingRecommendationPlan(g8, t8, { includeExistingAssignments: false });
  const a8 = applySeatingRecommendationPlan(g8, p8);
  const manualLocked = Number(a8.find((g) => g.name === "מנואל")?.table) === 2;

  // Pre-apply guard: tampered plan with over-capacity assignment is rejected
  const g9 = Array.from({ length: 3 }, (_, i) => ({ name: `אורח${i}`, status: "attending", category: "X", table: 0 }));
  const t9 = [{ table: 1, label: "שולחן 1", capacity: 2, category: "X" }];
  const tamperedPlan = {
    assignments: [
      { guestIndex: 0, guestName: "אורח0", category: "X", table: 1, tableLabel: "שולחן 1" },
      { guestIndex: 1, guestName: "אורח1", category: "X", table: 1, tableLabel: "שולחן 1" },
      { guestIndex: 2, guestName: "אורח2", category: "X", table: 1, tableLabel: "שולחן 1" },
    ],
  };
  const r9 = validateAndApplySeatingPlan(g9, t9, tamperedPlan);
  const preApplyGuard = r9.ok === false && typeof r9.error === "string" && r9.error.length > 0;

  return masterInvariant && exactCapacity && overCapacity && zeroCapacity && noTables && splitAllPlaced && splitWithLeftovers && manualLocked && preApplyGuard;
})();

const manualAssignCapacityGuardOk = (() => {
  const guests = [
    { name: "א", status: "attending", category: "X", table: 1 },
    { name: "ב", status: "attending", category: "X", table: 1 },
    { name: "ג", status: "attending", category: "X", table: 1 },
    { name: "ד", status: "attending", category: "Y", table: 0 },
    { name: "ה", status: "attending", category: "Y", table: 2 },
  ];
  const tables = [
    { table: 1, label: "שולחן 1", capacity: 3, category: "X" },
    { table: 2, label: "שולחן 2", capacity: 2, category: "Y" },
  ];

  // Block: table 1 is full (3/3), adding guest 3 (table 0) must fail
  const blockWhenFull = checkManualAssignCapacity(guests, tables, [3], 1).ok === false;

  // Allow: table 2 has 1 guest, capacity 2 — adding guest 3 must succeed
  const allowWhenRoom = checkManualAssignCapacity(guests, tables, [3], 2).ok === true;

  // Allow: unassign (target = 0) is always valid
  const allowUnassign = checkManualAssignCapacity(guests, tables, [0], 0).ok === true;

  // Allow: table not in seating list — no capacity constraint
  const allowUnknownTable = checkManualAssignCapacity(guests, tables, [3], 99).ok === true;

  // No double-count: guest 0 already on table 1, "assigning" them there again is ok (3 ≤ 3)
  const noDoubleCount = checkManualAssignCapacity(guests, tables, [0], 1).ok === true;

  // Block: assign 3 guests to table 2 (1 already there, capacity 2) — total would be 4
  const blockGroup = checkManualAssignCapacity(guests, tables, [3, 4, 0], 2).ok === false;

  // Exact fit: 1 slot left on table 2, add 1 guest — must succeed
  const exactFit = checkManualAssignCapacity(guests, tables, [3], 2).ok === true;

  return blockWhenFull && allowWhenRoom && allowUnassign && allowUnknownTable && noDoubleCount && blockGroup && exactFit;
})();

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
const guestLookup = loaded.getWorksheet("12_חיפוש_שולחן");
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

const guestLookupOk = Boolean(guestLookup)
  && String(guestLookup.getCell("A1").value || "").includes("חיפוש")
  && guestLookup.getCell("A3").value === "שם אורח"
  && guestLookup.getCell("A4").value !== null;

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
const emptyGuestLookupOk = Boolean(emptyLoaded.getWorksheet("12_חיפוש_שולחן"))
  && emptyLoaded.getWorksheet("12_חיפוש_שולחן").getCell("A3").value === "שם אורח";

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
  !seatingCapacityGuardOk ||
  !manualAssignCapacityGuardOk ||
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
  !guestLookupOk ||
  !noFakeSeatingExported ||
  !emptyGuestLookupOk ||
  !hiddenTechnicalLanguageOk ||
  !printSetupOk
) {
  throw new Error(JSON.stringify({
    persistenceOk,
    isolationOk,
    seatingAlgorithmOk,
    seatingCapacityGuardOk,
    manualAssignCapacityGuardOk,
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
    guestLookupOk,
    noFakeSeatingExported,
    emptyGuestLookupOk,
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
    capacityGuard: seatingCapacityGuardOk,
    manualAssignGuard: manualAssignCapacityGuardOk,
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
    seatingExportOk,
    guestLookupOk,
    noFakeSeatingExported,
    emptyGuestLookupOk,
    hiddenTechnicalLanguageOk,
    printSetupOk,
  },
}, null, 2));
