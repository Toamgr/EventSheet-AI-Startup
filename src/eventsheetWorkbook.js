import ExcelJS from "exceljs";

export const sheetNames = [
  "01_סיכום_האירוע",
  "02_Guest_Database",
  "03_RSVP_Status",
  "04_Categories",
  "05_Seating",
  "06_Venue",
  "07_Suppliers",
  "08_Budget",
  "09_Change_Impact",
  "10_Risks",
  "11_Final_Brief",
];

export const workbookVersion = "2.0-local-event-record";

const PLACEHOLDER = "לא זוהה מידע — לעדכון ידני";
const STATUS_ATTENDING = "מאשר הגעה";
const STATUS_PENDING = "טרם השיב";
const STATUS_DECLINED = "לא מגיע";
const PAYMENT_PAID = "שולם";
const PAYMENT_PARTIAL = "שולם חלקית";
const PAYMENT_OPEN = "פתוח לתשלום";
const DEFAULT_ORIGIN = "http://127.0.0.1:5173";

export function parseMessyEventInfo(eventData = {}) {
  const rawInfo = String(eventData.rawInfo || "");
  const lines = rawInfo.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const guests = [];
  const suppliers = [];
  const budget = [];
  const risks = [];
  const eventPatch = inferEventFields(eventData, lines);
  let mode = "";

  for (const line of lines) {
    const normalized = line.replace(/\s+/g, " ");
    const header = normalized.replace(/[:：-]/g, "").trim();

    if (/^(אורחים|מוזמנים|רשימת אורחים)$/i.test(header)) {
      mode = "guests";
      continue;
    }
    if (/^(ספקים|נותני שירות|ספקי האירוע)$/i.test(header)) {
      mode = "suppliers";
      continue;
    }
    if (/^(תקציב|עלויות|סעיפי תקציב)$/i.test(header)) {
      mode = "budget";
      continue;
    }

    if (looksLikeRisk(normalized)) {
      risks.push({
        risk: cleanupLabel(normalized),
        severity: /אלרג|דחוף|חמור|חסר|חסרים/i.test(normalized) ? "גבוהה" : "בינונית",
        owner: /מטבח|אלרג|קייטרינג/i.test(normalized) ? "מנהל מטבח" : "מנהל אירוע",
        action: "בדיקה ואישור ידני לפני האירוע",
      });
      if (mode !== "guests") continue;
    }

    if (mode === "budget") {
      const amount = extractAmount(normalized);
      if (amount > 0) {
        budget.push({
          item: cleanupLabel(normalized.replace(/\d[\d,.\s]*/g, "")) || "סעיף תקציב",
          amount,
          notes: "זוהה מטקסט חופשי",
        });
      }
      continue;
    }

    if (mode === "suppliers" || looksLikeSupplier(normalized)) {
      const supplier = parseSupplierLine(normalized);
      suppliers.push(supplier);
      if (supplier.amount > 0) {
        budget.push({ item: supplier.category, amount: supplier.amount, notes: "זוהה משורת ספק" });
      }
      continue;
    }

    if (looksLikeBudgetLine(normalized)) {
      const amount = extractAmount(normalized);
      if (amount > 0) {
        budget.push({
          item: cleanupLabel(normalized.replace(/\d[\d,.\s]*/g, "")) || "סעיף תקציב",
          amount,
          notes: "זוהה מטקסט חופשי",
        });
        continue;
      }
    }

    if (mode === "guests" || looksLikeGuest(normalized)) {
      guests.push(parseGuestLine(normalized));
    }
  }

  if (guests.length === 0 && rawInfo.trim()) {
    lines.slice(0, 12).forEach((line) => {
      if (!looksLikeSupplier(line) && !looksLikeBudgetLine(line) && !looksLikeRisk(line) && !/אורחים|ספקים|תקציב/i.test(line)) {
        guests.push(parseGuestLine(line));
      }
    });
  }

  const seating = buildSeatingFromGuestAssignments(guests);
  const seatingRecommendations = generateSeatingRecommendations(guests);
  const eventName = eventPatch.name || eventData.name || "לא הוזן";
  const venue = eventPatch.venue || eventData.venue || "לא הוזן";
  const finalBrief = [
    `בריף תפעולי עבור ${eventName}`,
    `מקום: ${venue} | תאריך: ${eventData.date || "לא הוזן"}`,
    `זוהו ${guests.length} אורחים, ${suppliers.length} ספקים ו-${risks.length} סיכונים.`,
    ...(seatingRecommendations.length ? ["", "המלצות הושבה לבדיקה:", ...seatingRecommendations.map((note) => `- ${note}`)] : []),
    "הנתונים הם טיוטת עבודה. מנהל האירוע מאשר, מתקן ומחליט.",
  ].join("\n");

  return { guests, seating, suppliers, budget, risks, seatingRecommendations, finalBrief, eventPatch };
}

export function buildWorkbook(eventData = {}, preview = {}, appBaseUrl = getDefaultAppBaseUrl()) {
  const safePreview = normalizePreview(preview);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "EventSheet AI";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;

  const eventName = eventData.name || safePreview.eventPatch?.name || "לא הוזן";
  const venue = eventData.venue || safePreview.eventPatch?.venue || "לא הוזן";
  const links = getNavigationLinks(appBaseUrl, eventData.eventId);
  const categories = Object.keys(countBy(safePreview.guests, "category"));
  const guestRows = buildGuestRows(safePreview.guests);
  const seatingRows = buildSeatingRows(safePreview);
  const seatingSummary = getWorkbookSeatingSummary(safePreview);
  const supplierRows = buildSupplierRows(safePreview.suppliers);
  const budgetRows = safePreview.budget.filter((row) => row.notes !== "זוהה משורת ספק").map((row) => [row.item, Number(row.amount) || 0, row.notes || ""]);

  addSheet(workbook, sheetNames[0], [
    ["סיכום האירוע", "ערך", "הערה"],
    ["שם האירוע", eventName, "פרטי האירוע"],
    ["לקוח / משפחה", eventData.clientName || "לא הוזן", "פרטי לקוח"],
    ["תאריך", eventData.date || "לא הוזן", "פרטי האירוע"],
    ["מקום", venue, "פרטי האירוע"],
    ["סה״כ מוזמנים", { formula: "COUNTIF('02_Guest_Database'!B2:B999,\"<>\")" }, "מתעדכן מרשימת האורחים"],
    ["מאשרים הגעה", { formula: `COUNTIF('02_Guest_Database'!C2:C999,"${STATUS_ATTENDING}")` }, "סטטוס אורחים"],
    ["ממתינים לאישור", { formula: `COUNTIF('02_Guest_Database'!C2:C999,"${STATUS_PENDING}")` }, "דורש מעקב"],
    ["לא מגיעים", { formula: `COUNTIF('02_Guest_Database'!C2:C999,"${STATUS_DECLINED}")` }, "סטטוס אורחים"],
    ["מספר שולחנות", { formula: "COUNTIF('05_Seating'!A14:A999,\">0\")" }, "לפי טבלת ההושבה"],
    ["קיבולת כוללת", { formula: "'05_Seating'!B4" }, "סך מושבים שהוגדרו"],
    ["אורחים מאשרים ללא שולחן", { formula: "'05_Seating'!B3" }, "דורש החלטת הושבה"],
    ["אורחים משובצים", { formula: "'05_Seating'!B2" }, "לפי שיוך אורחים"],
    ["פער קיבולת", { formula: "B11-B7" }, "חיובי = עודף מושבים; שלילי = חסר"],
    ["תפוסת הושבה", { formula: "'05_Seating'!B6" }, "לפי שולחנות שהוגדרו"],
    ["שולחנות בחריגה", { formula: "'05_Seating'!B8" }, "דורש בדיקה"],
    ["קבוצות שפוצלו", seatingSummary.splitGroups, "לפי המלצות הושבה אחרונות"],
    ["סה״כ ספקים", { formula: "COUNTIF('07_Suppliers'!B11:B999,\"<>\")" }, "מתעדכן מרשימת הספקים"],
    ["תקציב מתוכנן", { formula: "'08_Budget'!B2" }, "ספקים וסעיפי תקציב"],
    ["שולם", { formula: "'08_Budget'!B3" }, "ספקים"],
    ["יתרה לתשלום", { formula: "'08_Budget'!B8" }, "דורש מעקב"],
    ["עלות לאורח", { formula: "IFERROR(B19/B6,0)" }, "מדד תכנון"],
    ["נושאים לטיפול", { formula: `COUNTIF('10_Risks'!E2:E999,"פעיל")` }, "דורש תשומת לב"],
    ["מקור אמת", "רשומת האירוע והחוברת הם בסיס העבודה התפעולי. האפליקציה היא סביבת עבודה ויזואלית.", "החלטות ידניות של מנהל האירוע"],
    ["", "", ""],
    ["קישורים משניים לאפליקציה", "פתיחה באותו מכשיר/דפדפן שבו האירוע נשמר", "ניווט בלבד"],
    ["סקירה", linkValue("פתח סקירה", links.overview), "אפליקציה"],
    ["אורחים", linkValue("פתח אורחים", links.guests), "אפליקציה"],
    ["הושבה", linkValue("פתח הושבה", links.seating), "אפליקציה"],
    ["ספקים", linkValue("פתח ספקים", links.suppliers), "אפליקציה"],
    ["סיכונים", linkValue("פתח סיכונים", links.risks), "אפליקציה"],
  ]);

  addSheet(workbook, sheetNames[1], guestRows);
  addNavigationPanel(workbook.getWorksheet(sheetNames[1]), [
    ["ניווט לאפליקציה", "האקסל הוא ספר התכנון. הקישור פותח את תצוגת האורחים באפליקציה."],
    ["פתח את תצוגת האורחים", linkValue("פתח את תצוגת האורחים", links.guests)],
  ]);

  addSheet(workbook, sheetNames[2], [
    ["סטטוס", "כמות", "אחוז"],
    [STATUS_ATTENDING, { formula: `COUNTIF('02_Guest_Database'!C2:C999,"${STATUS_ATTENDING}")` }, { formula: "IFERROR(B2/SUM(B2:B4),0)" }],
    [STATUS_PENDING, { formula: `COUNTIF('02_Guest_Database'!C2:C999,"${STATUS_PENDING}")` }, { formula: "IFERROR(B3/SUM(B2:B4),0)" }],
    [STATUS_DECLINED, { formula: `COUNTIF('02_Guest_Database'!C2:C999,"${STATUS_DECLINED}")` }, { formula: "IFERROR(B4/SUM(B2:B4),0)" }],
    ["הערה", "אין כאן מערכת RSVP. זהו סיכום תפעולי לעבודה ידנית.", ""],
  ]);

  addSheet(workbook, sheetNames[3], [
    ["מדד", "ערך", "הערה"],
    ["סה״כ קטגוריות", { formula: "COUNTIF(A15:A999,\"<>\")" }, "מתעדכן מרשימת האורחים"],
    ["קטגוריה גדולה ביותר", { formula: "IFERROR(INDEX(A15:A999,MATCH(MAX(B15:B999),B15:B999,0)),\"\")" }, "מתעדכן מרשימת האורחים"],
    ["גודל קטגוריה מובילה", { formula: "IFERROR(MAX(B15:B999),0)" }, "מתעדכן מרשימת האורחים"],
    ["אורחי VIP", { formula: "COUNTIF('02_Guest_Database'!D2:D999,\"*VIP*\")" }, "מתעדכן מרשימת האורחים"],
    ["אורחים עם מגבלת תזונה", { formula: `COUNTIFS('02_Guest_Database'!E2:E999,"<>",'02_Guest_Database'!E2:E999,"<>ללא")` }, "מתעדכן מרשימת האורחים"],
    ["אורחים רב-קטגוריה", { formula: `COUNTIF('02_Guest_Database'!I2:I999,"כן")` }, "מתעדכן מרשימת האורחים"],
    ["מחברים חברתיים", { formula: `COUNTIF('02_Guest_Database'!J2:J999,"כן")` }, "מתעדכן מרשימת האורחים"],
    ["", "", ""],
    ["סיכום תזונה", "כמות", ""],
    ["טבעוני", { formula: `COUNTIF('02_Guest_Database'!E2:E999,"*טבעוני*")` }, ""],
    ["ללא גלוטן", { formula: `COUNTIF('02_Guest_Database'!E2:E999,"*גלוטן*")` }, ""],
    ["אלרגיה", { formula: `COUNTIF('02_Guest_Database'!E2:E999,"*אלרג*")` }, ""],
    ["קטגוריה", "כמות אורחים", "הערה"],
    ...(categories.length ? categories.map((category) => [category, { formula: `COUNTIF('02_Guest_Database'!D2:D999,"*${escapeFormulaText(category)}*")` }, "מתעדכן אוטומטית"]) : [[PLACEHOLDER, "", ""]]),
  ]);

  addSheet(workbook, sheetNames[4], seatingRows);
  addNavigationPanel(workbook.getWorksheet(sheetNames[4]), [
    ["סקיצת הושבה ויזואלית", "האקסל הוא מקור האמת התפעולי. הקישור פותח את תצוגת ההושבה הוויזואלית באפליקציה."],
    ["פתח את מסך ההושבה", linkValue("פתח את מסך ההושבה", links.seating)],
  ]);

  addSheet(workbook, sheetNames[5], [
    ["נתון אולם", "ערך"],
    ["מקום האירוע", venue],
    ["תאריך", eventData.date || "לא הוזן"],
    ["כמות אורחים משוערת", Number(eventData.estimatedGuests) || 0],
    ["מספר שולחנות שהוגדרו", safePreview.seating.length],
    ["הערות", "אין נתוני אולם שהומצאו אוטומטית. יש לעדכן ידנית לפי המקום."],
  ]);

  addSheet(workbook, sheetNames[6], supplierRows);
  addNavigationPanel(workbook.getWorksheet(sheetNames[6]), [
    ["ניווט לאפליקציה", "האקסל הוא ספר התכנון. הקישור פותח את תצוגת הספקים באפליקציה."],
    ["פתח את תצוגת הספקים", linkValue("פתח את תצוגת הספקים", links.suppliers)],
  ]);

  const budgetBody = budgetRows.length ? budgetRows : [[PLACEHOLDER, "", ""]];
  const budgetDetailStartRow = 11;
  const budgetTotalRow = budgetDetailStartRow + budgetBody.length + 1;
  addSheet(workbook, sheetNames[7], [
    ["מדד", "ערך", "הערה"],
    ["עלות מתוכננת", { formula: `B${budgetTotalRow}` }, "כולל ספקים וסעיפי תקציב"],
    ["עלות בפועל", { formula: "'07_Suppliers'!B7" }, "שולם לספקים"],
    ["עלות לאורח", { formula: "IFERROR(B2/'01_סיכום_האירוע'!B6,0)" }, "מתעדכן לפי מוזמנים"],
    ["עלות לשולחן", { formula: "IFERROR(B2/COUNTIF('05_Seating'!A14:A999,\">0\"),0)" }, "מתעדכן לפי שולחנות"],
    ["סעיף התקציב הגדול ביותר", { formula: `IFERROR(INDEX(A${budgetDetailStartRow}:A${budgetTotalRow - 1},MATCH(MAX(B${budgetDetailStartRow}:B${budgetTotalRow - 1}),B${budgetDetailStartRow}:B${budgetTotalRow - 1},0)),"")` }, "מדד תקציבי"],
    ["ניצול תקציב", { formula: "IFERROR(B3/B2,0)" }, "שולם מתוך המתוכנן"],
    ["יתרה לתשלום", { formula: "'07_Suppliers'!B8" }, "דורש מעקב תשלום"],
    ["", "", ""],
    ["סעיף תקציב", "סכום", "הערות"],
    ["ספקים", { formula: "'07_Suppliers'!B6" }, "נמשך אוטומטית מגיליון ספקים"],
    ...budgetBody,
    ["סה״כ", { formula: `SUM(B${budgetDetailStartRow}:B${budgetTotalRow - 1})` }, ""],
  ]);

  addSheet(workbook, sheetNames[8], [
    ["שינוי", "השפעה", "החלטת מנהל"],
    ["שינוי כמות אורחים", "משפיע על קייטרינג, הושבה ותקציב", "לעדכון ידני"],
    ["שינוי ספק", "משפיע על תקציב ולוחות זמנים", "אישור מנהל אירוע"],
    ["סיכון חדש", "משפיע על בריף וניהול שטח", "תיעוד בגיליון סיכונים"],
  ]);

  addSheet(workbook, sheetNames[9], buildRiskRows(safePreview));
  addNavigationPanel(workbook.getWorksheet(sheetNames[9]), [
    ["ניווט לאפליקציה", "האקסל הוא ספר התכנון. הקישור פותח את תצוגת הסיכונים באפליקציה."],
    ["פתח את תצוגת הסיכונים", linkValue("פתח את תצוגת הסיכונים", links.risks)],
  ]);

  addSheet(workbook, sheetNames[10], [
    ["בריף סופי", "ערך"],
    ["אורחים", { formula: `"סה״כ "&'01_סיכום_האירוע'!B6&" אורחים; "&'01_סיכום_האירוע'!B7&" מאשרים; "&'01_סיכום_האירוע'!B8&" ממתינים"` }],
    ["ספקים", { formula: `"סה״כ ספקים: "&'01_סיכום_האירוע'!B18&"; יתרה לתשלום: "&TEXT('07_Suppliers'!B8,"₪#,##0")` }],
    ["תקציב", { formula: `"תקציב כולל: "&TEXT('08_Budget'!B2,"₪#,##0")&"; עלות לאורח: "&TEXT('08_Budget'!B4,"₪#,##0")` }],
    ["הושבה", { formula: `"תפוסת הושבה: "&TEXT('05_Seating'!B6,"0%")&"; ללא שולחן: "&'05_Seating'!B3` }],
    ["סיכונים", { formula: `"נושאים לטיפול: "&'01_סיכום_האירוע'!B23` }],
    ["המלצות הושבה", safePreview.seatingRecommendations.length ? safePreview.seatingRecommendations.join("\n") : "אין המלצות הושבה אוטומטיות. מנהל האירוע מחליט."],
    ["הערת מקור אמת", "החוברת היא ספר התכנון התפעולי. האפליקציה משמשת לסקירה ויזואלית וניווט."],
  ]);

  addMetadataSheet(workbook, eventData, appBaseUrl);
  return workbook;
}

export async function workbookToBuffer(workbook) {
  await protectWorkbook(workbook);
  return workbook.xlsx.writeBuffer();
}

function buildGuestRows(guests) {
  return withPlaceholder(
    ["מזהה", "שם אורח", "סטטוס הגעה", "קטגוריה", "תזונה", "שולחן", "הערות", "יש שולחן", "רב-קטגוריה", "מחבר חברתי"],
    guests.map((guest, index) => {
      const row = index + 2;
      return [
        `G-${String(index + 1).padStart(4, "0")}`,
        guest.name || "",
        guest.status || STATUS_PENDING,
        guest.category || "כללי",
        guest.dietary || "ללא",
        guest.table || "",
        [guest.side ? `צד: ${guest.side}` : "", guest.notes || ""].filter(Boolean).join(" | "),
        { formula: `IF(OR(F${row}="",F${row}=0),"לא","כן")` },
        { formula: `IF(ISNUMBER(SEARCH(",",D${row})),"כן","לא")` },
        { formula: `IF(OR(ISNUMBER(SEARCH(",",D${row})),ISNUMBER(SEARCH("קבוצות",G${row}))),"כן","לא")` },
      ];
    }),
    ["", PLACEHOLDER, STATUS_PENDING, "", "", "", "", "", "", ""],
  );
}

function buildSeatingRows(preview) {
  const startRow = 14;
  const tableRows = preview.seating.map((seat, index) => {
    const row = startRow + index;
    const categoryMix = getTableCategoryMix(preview.guests, seat.table);
    const recommendationNote = (preview.seatingPlan?.recommendations || [])
      .filter((recommendation) => recommendation.tables?.includes(Number(seat.table)))
      .map((recommendation) => recommendation.text)
      .join("\n");
    return [
      Number(seat.table) || "",
      seat.label || `שולחן ${seat.table}`,
      seat.category || "",
      Number(seat.capacity) || "",
      { formula: `IF(A${row}="","",COUNTIF('02_Guest_Database'!F2:F999,A${row}))` },
      { formula: `IF(A${row}="","",MAX(0,D${row}-E${row}))` },
      { formula: `IF(A${row}="","",IFERROR(E${row}/D${row},0))` },
      { formula: `IF(A${row}="","",IF(E${row}>D${row},"חריגת קיבולת",IF(E${row}=D${row},"מלא","תקין")))` },
      categoryMix,
      seat.type || "",
      seat.zone || "",
      [seat.notes || "", recommendationNote].filter(Boolean).join("\n"),
    ];
  });

  return [
    ["מדד", "ערך", "הערה"],
    ["אורחים משובצים", { formula: "COUNTIF('02_Guest_Database'!F2:F999,\">0\")" }, "מתעדכן מרשימת האורחים"],
    ["אורחים מאשרים ללא שולחן", { formula: `COUNTIFS('02_Guest_Database'!B2:B999,"<>",'02_Guest_Database'!C2:C999,"${STATUS_ATTENDING}",'02_Guest_Database'!F2:F999,"")+COUNTIFS('02_Guest_Database'!B2:B999,"<>",'02_Guest_Database'!C2:C999,"${STATUS_ATTENDING}",'02_Guest_Database'!F2:F999,0)` }, "דורש החלטת הושבה"],
    ["סה״כ מושבים", { formula: "SUM(D14:D999)" }, "לפי שולחנות שהוגדרו"],
    ["מושבים תפוסים", { formula: "SUM(E14:E999)" }, "לפי שיוך אורחים"],
    ["אחוז תפוסה", { formula: "IFERROR(B5/B4,0)" }, "מצב הושבה"],
    ["מושבים פנויים", { formula: "SUM(F14:F999)" }, "לפי שולחנות שהוגדרו"],
    ["אזהרות קיבולת", { formula: `SUMPRODUCT(--(H14:H999<>""),--(H14:H999<>"תקין"))` }, "דורש בדיקה"],
    ["", "", ""],
    ["סקיצת הושבה ויזואלית", "האקסל הוא מקור האמת התפעולי. הקישור פותח את תצוגת ההושבה הוויזואלית באפליקציה.", "ניווט בלבד"],
    ["פתח את מסך ההושבה", "", "אפליקציה"],
    ["", "", ""],
    ["שולחן", "כינוי", "קטגוריה", "קיבולת", "אורחים משובצים", "מקומות פנויים", "תפוסה", "אזהרת קיבולת", "תמהיל קטגוריות", "סוג", "אזור", "הערות והמלצות"],
    ...(tableRows.length ? tableRows : [[PLACEHOLDER, "", "", "", "", "", "", "", "", "", "", ""]]),
    ...(preview.seatingRecommendations?.length ? [["", "המלצות הושבה", "", "", "", "", "", "המלצה בלבד", "", "", "", preview.seatingRecommendations.join("\n")]] : []),
  ];
}

function buildSupplierRows(suppliers) {
  return [
    ["מדד", "ערך", "הערה"],
    ["סה״כ ספקים", { formula: "COUNTIF(B11:B999,\"<>\")" }, "מתעדכן מרשימת הספקים"],
    ["חסר טלפון", { formula: "SUMPRODUCT(--(B11:B999<>\"\"),--(C11:C999=\"\"))" }, "דורש השלמה"],
    ["חסר עלות", { formula: "SUMPRODUCT(--(B11:B999<>\"\"),--(D11:D999=0))" }, "דורש השלמה"],
    ["ספקים לא משולמים", { formula: "SUMPRODUCT(--(B11:B999<>\"\"),--(F11:F999>0))" }, "דורש מעקב תשלום"],
    ["עלות ספקים כוללת", { formula: "SUM(D11:D999)" }, "מתעדכן מרשימת הספקים"],
    ["שולם לספקים", { formula: "SUM(E11:E999)" }, "מצב תשלום"],
    ["יתרה לספקים", { formula: "SUM(F11:F999)" }, "מצב תשלום"],
    ["", "", ""],
    ["תחום", "שם ספק", "טלפון", "עלות חוזה", "שולם", "יתרה", "סטטוס", "חסר טלפון", "חסר עלות", "לא שולם"],
    ...(suppliers.length ? suppliers.map((supplier, index) => {
      const row = 11 + index;
      return [
        supplier.category || "ספק כללי",
        supplier.name || "",
        supplier.phone || "",
        Number(supplier.amount) || 0,
        Number(supplier.paid) || 0,
        { formula: `IF(B${row}="","",MAX(0,D${row}-E${row}))` },
        supplier.status || statusFromPayment(supplier.amount, supplier.paid),
        { formula: `IF(B${row}="","",IF(C${row}="","כן","לא"))` },
        { formula: `IF(B${row}="","",IF(D${row}=0,"כן","לא"))` },
        { formula: `IF(B${row}="","",IF(F${row}>0,"כן","לא"))` },
      ];
    }) : [[PLACEHOLDER, "", "", "", "", "", "", "", "", ""]]),
  ];
}

function buildRiskRows(preview) {
  return withPlaceholder(
    ["סיכון", "כמות/מצב", "חומרה", "פעולה", "סטטוס"],
    [
      ["אורחים ללא שולחן", { formula: "'05_Seating'!B3" }, "גבוהה", "לעדכן שולחן בגיליון אורחים/הושבה", { formula: `IF(B2>0,"פעיל","תקין")` }],
      ["שולחן מעל קיבולת", { formula: "'05_Seating'!B8" }, "גבוהה", "להקטין שיבוץ או להגדיל קיבולת", { formula: `IF(B3>0,"פעיל","תקין")` }],
      ["חסר טלפון ספק", { formula: "'07_Suppliers'!B3" }, "בינונית", "להשלים טלפון ספק", { formula: `IF(B4>0,"פעיל","תקין")` }],
      ["חסר עלות ספק", { formula: "'07_Suppliers'!B4" }, "בינונית", "להשלים עלות חוזה", { formula: `IF(B5>0,"פעיל","תקין")` }],
      ["ספקים לא משולמים", { formula: "'07_Suppliers'!B5" }, "בינונית", "לוודא סטטוס תשלום", { formula: `IF(B6>0,"פעיל","תקין")` }],
      ["חסר RSVP", { formula: "'01_סיכום_האירוע'!B8" }, "גבוהה", "לסגור אישורי הגעה ידנית", { formula: `IF(B7>0,"פעיל","תקין")` }],
      ["חריגת תקציב", { formula: "'08_Budget'!B7" }, "בינונית", "לבדוק ניצול תקציב", { formula: `IF(B8>1,"פעיל","תקין")` }],
      ...preview.risks.map((risk) => [risk.risk, 1, risk.severity || "בינונית", risk.action || "בדיקה ידנית", "פעיל"]),
      ...(preview.seatingRecommendations?.length ? preview.seatingRecommendations.map((note) => ["המלצת הושבה לבדיקה", 1, "נמוכה", note, "פעיל"]) : []),
    ],
    [PLACEHOLDER, "", "", "", ""],
  );
}

function addSheet(workbook, name, rows) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ rightToLeft: true, state: "frozen", ySplit: 1, showGridLines: false }],
    pageSetup: {
      horizontalCentered: true,
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.2, footer: 0.2 },
    },
  });
  rows.forEach((row) => sheet.addRow(row));
  styleWorksheet(sheet, rows);
  applyProfessionalSheetStyle(sheet);
  applySheetEditability(sheet);
  applyDataValidation(sheet);
}

function addMetadataSheet(workbook, eventData, appBaseUrl) {
  const sheet = workbook.addWorksheet("_EventSheet_Metadata", {
    views: [{ rightToLeft: true, showGridLines: false }],
  });
  sheet.state = "veryHidden";
  sheet.addRows([
    ["שדה", "ערך"],
    ["eventId", eventData.eventId || ""],
    ["eventName", eventData.name || ""],
    ["generatedAt", new Date().toISOString()],
    ["appOrigin", appBaseUrl || getDefaultAppBaseUrl()],
    ["workbookVersion", workbookVersion],
  ]);
  styleWorksheet(sheet, [["שדה", "ערך"]]);
  sheet.getColumn(1).width = 24;
  sheet.getColumn(2).width = 60;
}

function styleWorksheet(sheet, rows) {
  sheet.eachRow((row, rowNumber) => {
    row.eachCell({ includeEmpty: true }, (cell) => {
      const isFormula = typeof cell.value === "object" && Boolean(cell.value?.formula);
      const isHeader = rowNumber === 1;
      const isBlank = cell.value === null || cell.value === undefined || cell.value === "";
      cell.alignment = { horizontal: "right", vertical: "top", wrapText: true, readingOrder: "rtl" };
      cell.border = border();
      cell.protection = { locked: isHeader || isFormula };
      if (isHeader) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = fill("FF1F6F68");
      } else if (isFormula) {
        cell.font = { color: { argb: "FF344054" } };
        cell.fill = fill("FFE5E7EB");
      } else if (cell.value?.hyperlink) {
        applyHyperlinkStyle(cell);
      } else if (!isBlank) {
        cell.protection = { locked: false };
        cell.fill = fill("FFE9F8EF");
      }
      if (cell.value === PLACEHOLDER) {
        cell.font = { italic: true, color: { argb: "FF667985" } };
      }
    });
  });

  const columnCount = rows.reduce((max, row) => Math.max(max, row.length), 1);
  for (let col = 1; col <= columnCount; col += 1) {
    const maxLength = rows.reduce((max, row) => {
      const value = row[col - 1];
      const printable = typeof value === "object" && value?.formula ? value.formula : value?.text || value;
      return Math.max(max, String(printable ?? "").length);
    }, 10);
    sheet.getColumn(col).width = Math.min(Math.max(maxLength + 4, 14), 42);
  }

  sheet.getRow(1).height = 24;
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(columnCount, 1) } };
  applyNumberFormats(sheet);
}

function applyProfessionalSheetStyle(sheet) {
  if (sheet.name === "01_סיכום_האירוע") {
    sheet.pageSetup.orientation = "portrait";
    sheet.pageSetup.printArea = "A1:C31";
    sheet.getColumn(1).width = 28;
    sheet.getColumn(2).width = 32;
    sheet.getColumn(3).width = 38;
    [1, 26].forEach((rowNumber) => {
      sheet.getRow(rowNumber).eachCell({ includeEmpty: true }, (cell) => {
        cell.font = { bold: true, color: { argb: rowNumber === 26 ? "FF475467" : "FFFFFFFF" }, size: rowNumber === 1 ? 14 : 11 };
        cell.fill = fill(rowNumber === 26 ? "FFF2F4F7" : "FF123C43");
      });
    });
  }
  if (sheet.name === "11_Final_Brief") {
    sheet.pageSetup.orientation = "portrait";
    sheet.pageSetup.printArea = "A1:B8";
    sheet.getColumn(1).width = 24;
    sheet.getColumn(2).width = 74;
    sheet.eachRow((row) => { row.height = 28; });
  }
}

function applySheetEditability(sheet) {
  if (sheet.name === "02_Guest_Database") {
    for (let row = 2; row <= 999; row += 1) {
      unlockRange(sheet, row, 2, 7);
      setLockedFormula(sheet.getCell(row, 8), `IF(OR(F${row}="",F${row}=0),"לא","כן")`);
      setLockedFormula(sheet.getCell(row, 9), `IF(ISNUMBER(SEARCH(",",D${row})),"כן","לא")`);
      setLockedFormula(sheet.getCell(row, 10), `IF(OR(ISNUMBER(SEARCH(",",D${row})),ISNUMBER(SEARCH("קבוצות",G${row}))),"כן","לא")`);
    }
  }
  if (sheet.name === "05_Seating") {
    for (let row = 14; row <= 999; row += 1) {
      unlockRange(sheet, row, 1, 4);
      unlockRange(sheet, row, 9, 12);
      setLockedFormula(sheet.getCell(row, 5), `IF(A${row}="","",COUNTIF('02_Guest_Database'!F2:F999,A${row}))`);
      setLockedFormula(sheet.getCell(row, 6), `IF(A${row}="","",MAX(0,D${row}-E${row}))`);
      setLockedFormula(sheet.getCell(row, 7), `IF(A${row}="","",IFERROR(E${row}/D${row},0))`);
      setLockedFormula(sheet.getCell(row, 8), `IF(A${row}="","",IF(E${row}>D${row},"חריגת קיבולת",IF(E${row}=D${row},"מלא","תקין")))`);
    }
  }
  if (sheet.name === "07_Suppliers") {
    for (let row = 11; row <= 999; row += 1) {
      unlockRange(sheet, row, 1, 5);
      unlockRange(sheet, row, 7, 7);
      setLockedFormula(sheet.getCell(row, 6), `IF(B${row}="","",MAX(0,D${row}-E${row}))`);
      setLockedFormula(sheet.getCell(row, 8), `IF(B${row}="","",IF(C${row}="","כן","לא"))`);
      setLockedFormula(sheet.getCell(row, 9), `IF(B${row}="","",IF(D${row}=0,"כן","לא"))`);
      setLockedFormula(sheet.getCell(row, 10), `IF(B${row}="","",IF(F${row}>0,"כן","לא"))`);
    }
  }
}

function applyDataValidation(sheet) {
  if (sheet.name === "02_Guest_Database") {
    for (let row = 2; row <= 999; row += 1) {
      sheet.getCell(row, 3).dataValidation = { type: "list", allowBlank: true, formulae: [`"${STATUS_ATTENDING},${STATUS_PENDING},${STATUS_DECLINED}"`] };
      sheet.getCell(row, 6).dataValidation = { type: "whole", operator: "between", allowBlank: true, formulae: [0, 999] };
    }
  }
  if (sheet.name === "07_Suppliers") {
    for (let row = 11; row <= 999; row += 1) {
      sheet.getCell(row, 7).dataValidation = { type: "list", allowBlank: true, formulae: [`"${PAYMENT_OPEN},${PAYMENT_PARTIAL},${PAYMENT_PAID}"`] };
    }
  }
}

function addNavigationPanel(sheet, rows) {
  const startColumn = 12;
  rows.forEach((row, index) => {
    const targetRow = sheet.getRow(index + 1);
    row.forEach((value, offset) => {
      const cell = targetRow.getCell(startColumn + offset);
      cell.value = value;
      cell.alignment = { horizontal: "right", vertical: "top", wrapText: true, readingOrder: "rtl" };
      cell.border = border();
      cell.protection = { locked: true };
      if (index === 0) {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = fill("FF1F6F68");
      } else if (value?.hyperlink) {
        applyHyperlinkStyle(cell);
      } else {
        cell.fill = fill("FFF8FAFC");
      }
    });
  });
  sheet.getColumn(startColumn).width = 28;
  sheet.getColumn(startColumn + 1).width = 56;
}

async function protectWorkbook(workbook) {
  await Promise.all(workbook.worksheets.map((sheet) => sheet.protect("EventSheetAI", {
    selectLockedCells: true,
    selectUnlockedCells: true,
    formatColumns: true,
    formatRows: true,
    sort: true,
    autoFilter: true,
  })));
}

function unlockRange(sheet, row, startColumn, endColumn) {
  for (let column = startColumn; column <= endColumn; column += 1) {
    const cell = sheet.getCell(row, column);
    if (cell.value?.formula || cell.value?.hyperlink) continue;
    cell.protection = { locked: false };
    cell.fill = fill("FFE9F8EF");
    cell.alignment = { horizontal: "right", vertical: "top", wrapText: true, readingOrder: "rtl" };
  }
}

function setLockedFormula(cell, formula) {
  cell.value = { formula };
  cell.protection = { locked: true };
  cell.fill = fill("FFE5E7EB");
  cell.font = { color: { argb: "FF344054" } };
  cell.alignment = { horizontal: "right", vertical: "top", wrapText: true, readingOrder: "rtl" };
  cell.border = border();
}

function applyNumberFormats(sheet) {
  const percentLabels = ["אחוז", "תפוסה", "ניצול"];
  sheet.eachRow((row) => {
    const rowLabel = String(row.getCell(1).value || "");
    row.eachCell((cell) => {
      const header = String(sheet.getRow(1).getCell(cell.col).value || "");
      if (percentLabels.some((label) => rowLabel.includes(label) || header.includes(label))) cell.numFmt = "0%";
      if (/עלות|תקציב|שולם|יתרה|סכום/.test(rowLabel) || /עלות|שולם|יתרה|סכום/.test(header)) cell.numFmt = "₪#,##0";
    });
  });
}

function parseGuestLine(text) {
  const inlineGuest = parseInlineGroupGuest(text);
  if (inlineGuest) return inlineGuest;
  const parts = text.split(/\s+-\s+|,/).map((part) => part.trim()).filter(Boolean);
  const tags = detectGroupTags(text);
  return {
    name: cleanupLabel(parts[0] || text),
    status: detectStatus(text),
    category: tags.length ? tags.join(", ") : detectCategory(text),
    side: detectSide(text),
    dietary: detectDietary(text),
    table: extractTable(text),
    notes: tags.length > 1 ? `קבוצות: ${tags.join(", ")}` : "",
  };
}

function parseInlineGroupGuest(text) {
  if (/[₪\d]|:/.test(text) || looksLikeSupplier(text) || looksLikeBudgetLine(text) || looksLikeRisk(text)) return null;
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length < 2 || words.length > 8) return null;
  const tags = detectGroupTags(text);
  if (!tags.length) return null;
  return {
    name: words[0],
    status: STATUS_PENDING,
    category: tags.join(", "),
    side: detectSide(text),
    dietary: "ללא",
    table: 0,
    notes: tags.length > 1 ? `קבוצות: ${tags.join(", ")}` : "",
  };
}

function parseSupplierLine(text) {
  const amount = extractAmount(text);
  const allAmounts = extractAmounts(text);
  const paid = /שולם|מקדמה/i.test(text) ? (allAmounts[1] || Math.round(amount * 0.3)) : 0;
  return {
    category: detectSupplierCategory(text),
    name: cleanupLabel(text.replace(/\d[\d,.\s]*/g, "")) || text,
    contact: "",
    phone: extractPhone(text),
    email: extractEmail(text),
    amount,
    paid,
    status: statusFromPayment(amount, paid),
    dueDate: "",
    notes: "",
  };
}

function inferEventFields(eventData, lines) {
  const patch = {};
  const firstLine = lines[0] || "";
  if (!eventData.name && /חתונה|בר מצווה|בת מצווה|אירוע|כנס/i.test(firstLine)) patch.name = cleanupLabel(firstLine.split(/[,.]/)[0]);
  if (!eventData.venue) {
    const venueLine = lines.find((line) => /(מקום|אולם|גן|מתחם|Venue)/i.test(line));
    if (venueLine) {
      const explicit = venueLine.match(/(?:מקום|Venue)\s*[:：-]?\s*(.+)$/i);
      patch.venue = cleanupLabel(explicit?.[1] || venueLine.split(",").pop() || venueLine);
    }
  }
  return patch;
}

function looksLikeGuest(text) {
  if (detectGroupTags(text).length > 0 && !looksLikeSupplier(text) && !looksLikeBudgetLine(text)) return true;
  return /מאשר|מאשרים|מגיע|טרם|שולחן|משפחת|חברים|חבר|חברה|גרעין|לימודים|משפחה|עבודה|VIP|כלה|חתן/i.test(text);
}

function looksLikeSupplier(text) {
  if (/^(חתונה|אירוע|בר מצווה|בת מצווה|כנס)/i.test(text)) return false;
  if (detectGroupTags(text).length && !extractAmount(text)) return false;
  return /(קייטרינג|צילום|צלם|די.?ג|דיגיי|DJ|אולם|גן אירועים|בר משקאות|פרחים|הפקה|עיצוב|ספק)/i.test(text);
}

function looksLikeBudgetLine(text) {
  return extractAmount(text) > 0 && /(תקציב|עלות|מחיר|₪|שח|ש"ח|אולם|בר|קייטרינג|צילום|דיגיי|DJ)/i.test(text);
}

function looksLikeRisk(text) {
  return /סיכון|בעיה|דחוף|אלרג|חסר|חסרים|חסרה|רגיש|לא ידוע|חוסר/i.test(text);
}

function detectStatus(text) {
  if (/לא מגיע|לא מאשר|ביטל|לא יגיע/i.test(text)) return STATUS_DECLINED;
  if (/מאשר|מאשרים|מגיע|יגיע/i.test(text)) return STATUS_ATTENDING;
  return STATUS_PENDING;
}

function detectCategory(text) {
  const tags = detectGroupTags(text);
  if (tags.length) return tags.join(", ");
  if (/כלה/i.test(text)) return "משפחת הכלה";
  if (/חתן/i.test(text)) return "משפחת החתן";
  if (/חברים|חבר/i.test(text)) return "חברים";
  if (/VIP|עסק|כבוד/i.test(text)) return "VIP";
  if (/ילד|ילדים/i.test(text)) return "ילדים";
  return "כללי";
}

function detectGroupTags(text) {
  const normalized = text.replace(/\s+/g, " ");
  const tags = [];
  if (/חבר(?:ה|ים)?\s+גרעין|גרעין/i.test(normalized)) tags.push("חבר גרעין");
  if (/חבר(?:ה|ים)?\s+לימודים|לימודים/i.test(normalized)) tags.push("לימודים");
  if (/משפחה|משפחת/i.test(normalized)) tags.push("משפחה");
  if (/עבודה|קולגה|קולגות/i.test(normalized)) tags.push("עבודה");
  if (/VIP|כבוד/i.test(normalized)) tags.push("VIP");
  if (/צבא/i.test(normalized)) tags.push("צבא");
  if (/שכנים|שכן|שכנה/i.test(normalized)) tags.push("שכנים");
  return [...new Set(tags)];
}

function detectSide(text) {
  if (/כלה/i.test(text)) return "צד הכלה";
  if (/חתן/i.test(text)) return "צד החתן";
  return "";
}

function detectDietary(text) {
  if (/אגוז|אלרג/i.test(text)) return "אלרגיה";
  if (/ללא גלוטן/i.test(text)) return "ללא גלוטן";
  if (/טבעונ/i.test(text)) return "טבעוני";
  if (/צמחונ/i.test(text)) return "צמחוני";
  return "ללא";
}

function detectSupplierCategory(text) {
  if (/אולם|גן/i.test(text)) return "אולם/גן אירועים";
  if (/קייטרינג|בר/i.test(text)) return "קייטרינג ובר";
  if (/די.?ג|דיגיי|DJ|להקה/i.test(text)) return "דיג׳יי/להקה";
  if (/צילום|צלם/i.test(text)) return "צילום";
  if (/פרח|עיצוב|הפקה/i.test(text)) return "הפקה ועיצוב";
  return "ספק כללי";
}

function buildSeatingFromGuestAssignments(guests) {
  const seatingMap = new Map();
  guests.forEach((guest) => {
    const table = Number(guest.table) || 0;
    if (table > 0 && !seatingMap.has(table)) {
      seatingMap.set(table, { table, label: `שולחן ${table}`, capacity: 10, category: guest.category || "כללי", notes: "נוצר לפי שיוך אורחים שהוזן" });
    }
  });
  return Array.from(seatingMap.values()).sort((a, b) => Number(a.table) - Number(b.table));
}

export function generateSeatingRecommendations(guests = []) {
  const tagToGuests = new Map();
  guests.forEach((guest) => {
    splitTags(guest.category).forEach((tag) => {
      if (!tagToGuests.has(tag)) tagToGuests.set(tag, []);
      tagToGuests.get(tag).push(guest);
    });
  });
  const bridgeGuest = guests.find((guest) => splitTags(guest.category).length > 1);
  if (bridgeGuest) {
    const related = new Map();
    splitTags(bridgeGuest.category).forEach((tag) => (tagToGuests.get(tag) || []).forEach((guest) => related.set(guest.name, guest)));
    const names = Array.from(related.values()).map((guest) => guest.name).filter(Boolean);
    const groups = splitTags(bridgeGuest.category);
    if (names.length >= 3) {
      return [`מומלץ לשקול להושיב את ${names.join(", ")} קרוב או באותו שולחן, כי ${bridgeGuest.name} מחבר/ת בין קבוצת ${groups.join(" לקבוצת ")}. המלצה בלבד — מנהל האירוע מחליט.`];
    }
  }
  const recommendations = [];
  tagToGuests.forEach((members, tag) => {
    if (members.length >= 3) {
      recommendations.push(`מומלץ לשקול קרבה בהושבה עבור קבוצת ${tag}: ${members.map((guest) => guest.name).join(", ")}. המלצה בלבד — מנהל האירוע מחליט.`);
    }
  });
  return recommendations.slice(0, 3);
}

function getNavigationLinks(appBaseUrl, eventId) {
  const base = String(appBaseUrl || getDefaultAppBaseUrl()).replace(/\/+$/, "");
  const query = eventId ? `/?eventId=${encodeURIComponent(eventId)}` : "";
  return {
    overview: `${base}${query}#overview`,
    guests: `${base}${query}#guests`,
    seating: `${base}${query}#seating`,
    suppliers: `${base}${query}#suppliers`,
    risks: `${base}${query}#risks`,
    workbook: `${base}${query}#workbook`,
  };
}

function getDefaultAppBaseUrl() {
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return DEFAULT_ORIGIN;
}

function normalizePreview(preview) {
  return {
    guests: Array.isArray(preview.guests) ? preview.guests : [],
    seating: Array.isArray(preview.seating) ? preview.seating : [],
    suppliers: Array.isArray(preview.suppliers) ? preview.suppliers : [],
    budget: Array.isArray(preview.budget) ? preview.budget : [],
    risks: Array.isArray(preview.risks) ? preview.risks : [],
    seatingRecommendations: Array.isArray(preview.seatingRecommendations) ? preview.seatingRecommendations : [],
    seatingPlan: preview.seatingPlan || null,
    eventPatch: preview.eventPatch || {},
  };
}

function getWorkbookSeatingSummary(preview) {
  return {
    splitGroups: (preview.seatingPlan?.recommendations || []).filter((recommendation) => recommendation.status === "split").length,
  };
}

function getTableCategoryMix(guests, tableNumber) {
  const counts = guests
    .filter((guest) => Number(guest.table) === Number(tableNumber))
    .reduce((result, guest) => {
      const category = String(guest.category || "ללא קטגוריה").trim() || "ללא קטגוריה";
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});
  return Object.entries(counts).map(([category, count]) => `${category}: ${count}`).join(" | ");
}

function linkValue(text, hyperlink) {
  return { text, hyperlink };
}

function withPlaceholder(headers, rows, placeholderRow) {
  return [headers, ...(rows.length > 0 ? rows : [placeholderRow])];
}

function countBy(rows, key) {
  return rows.reduce((result, row) => {
    splitTags(row[key] || "לא מסווג").forEach((value) => {
      result[value] = (result[value] || 0) + 1;
    });
    return result;
  }, {});
}

function splitTags(value) {
  return String(value || "").split(/,|،|\/|\|/).map((part) => part.trim()).filter(Boolean);
}

function statusFromPayment(amount = 0, paid = 0) {
  const total = Number(amount) || 0;
  const paidAmount = Number(paid) || 0;
  if (total > 0 && paidAmount >= total) return PAYMENT_PAID;
  if (paidAmount > 0) return PAYMENT_PARTIAL;
  return PAYMENT_OPEN;
}

function extractAmount(text) {
  return extractAmounts(text)[0] || 0;
}

function extractAmounts(text) {
  const matches = String(text).match(/\d[\d,.]*/g);
  if (!matches) return [];
  return matches.map((value) => Number(value.replace(/[,.]/g, ""))).filter((value) => value > 99);
}

function extractTable(text) {
  const match = String(text).match(/שולחן\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function extractPhone(text) {
  return String(text).match(/0\d{1,2}[-\s]?\d{7}/)?.[0] || "";
}

function extractEmail(text) {
  return String(text).match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function cleanupLabel(value) {
  return String(value || "")
    .replace(/^(סיכון|בעיה|תקציב|ספקים|אורחים|מקום)\s*[:：-]?/i, "")
    .replace(/\s+-\s+$/g, "")
    .trim();
}

function escapeFormulaText(value) {
  return String(value || "").replace(/"/g, '""');
}

function fill(argb) {
  return { type: "pattern", pattern: "solid", fgColor: { argb } };
}

function border() {
  return {
    top: { style: "thin", color: { argb: "FFD9E1E5" } },
    left: { style: "thin", color: { argb: "FFD9E1E5" } },
    bottom: { style: "thin", color: { argb: "FFD9E1E5" } },
    right: { style: "thin", color: { argb: "FFD9E1E5" } },
  };
}

function applyHyperlinkStyle(cell) {
  cell.font = { color: { argb: "FF2451B2" }, underline: true, bold: true };
  cell.fill = fill("FFEAF1FF");
  cell.protection = { locked: true };
}
