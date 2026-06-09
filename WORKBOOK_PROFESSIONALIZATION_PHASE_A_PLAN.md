# Workbook Professionalization Phase A — Audit & Implementation Plan

**Prepared:** 2026-06-09  
**Based on:** Full audit of `src/eventsheetWorkbook.js`, `src/main.jsx`, `src/eventStorage.js`, `scripts/qualityCheck.mjs`, `scripts/finalDemoLockCheck.mjs`  
**Status:** Pre-implementation — no code changed, no files staged

---

## 1. Current System Summary

EventSheet AI operates as a one-way pipeline:

1. The user fills in event details via the React UI (`src/main.jsx`) or pastes raw Hebrew text.
2. `parseMessyEventInfo()` in `src/eventsheetWorkbook.js` parses raw text into structured guest, supplier, budget, and risk arrays.
3. The structured data is persisted as a `record` object in `localStorage` via `src/eventStorage.js`, keyed by a stable `eventId`.
4. When the user triggers workbook generation, `buildWorkbook()` in `src/eventsheetWorkbook.js` constructs an ExcelJS workbook from the current `record`.
5. `workbookToBuffer()` applies sheet protection, then the buffer is downloaded as `EventSheet_AI_<name>.xlsx`.

The workbook currently produces **12 operational sheets + 1 hidden metadata sheet** (`_EventSheet_Metadata`):

| # | Sheet Name | Content |
|---|---|---|
| 01 | `01_סיכום_האירוע` | Event summary, formulas, app links |
| 02 | `02_Guest_Database` | Full guest list, editable |
| 03 | `03_RSVP_Status` | RSVP status totals and percentages |
| 04 | `04_Categories` | Category breakdown and dietary counts |
| 05 | `05_Seating` | Table assignments, capacity, seating metrics |
| 06 | `06_Venue` | Venue details |
| 07 | `07_Suppliers` | Supplier list and payment tracking |
| 08 | `08_Budget` | Budget summary and line items |
| 09 | `09_Change_Impact` | Static change impact guide |
| 10 | `10_Risks` | Parsed and auto-generated risks |
| 11 | `11_Final_Brief` | Operational one-page brief |
| 12 | `12_חיפוש_שולחן` | Day-of guest lookup by name |
| — | `_EventSheet_Metadata` | Hidden: eventId, version, generatedAt |

---

## 2. Relevant Files

| Concern | File | Key Location |
|---|---|---|
| Event data model + persistence | `src/eventStorage.js` | `createEventRecord()`, `createEmptyPreview()` |
| Supplier data collection (UI) | `src/main.jsx` | `SupplierForm` (line 1030), `emptySupplier()` (line 1301) |
| Supplier data storage | `src/main.jsx` | `addSupplier()` (line 278), `updateSupplier()` (line 299) |
| Workbook entry point | `src/eventsheetWorkbook.js` | `buildWorkbook()` (line 127) |
| Supplier sheet builder | `src/eventsheetWorkbook.js` | `buildSupplierRows()` (line 440) |
| Sheet editability rules | `src/eventsheetWorkbook.js` | `applySheetEditability()` (line 625) |
| RSVP sheet builder | `src/eventsheetWorkbook.js` | `addSheet(workbook, sheetNames[2], ...)` (line 185) |
| Number/percent formatting | `src/eventsheetWorkbook.js` | `applyNumberFormats()` (line 724) |
| Workbook protection | `src/eventsheetWorkbook.js` | `protectWorkbook()` (line 694) |
| Hidden metadata sheet | `src/eventsheetWorkbook.js` | `addMetadataSheet()` (line 506) |
| Sheet-specific print/style | `src/eventsheetWorkbook.js` | `applyProfessionalSheetStyle()` (line 566) |
| Hebrew sheet names | `src/eventsheetWorkbook.js` | `sheetNames` array (line 3) |
| QA validation suite | `scripts/qualityCheck.mjs` | Entire file — validates all sheets |
| End-to-end demo lock check | `scripts/finalDemoLockCheck.mjs` | Entire file |

---

## 3. Data Flow Audit

```
User input (main.jsx UI)
    → record.rawInfo (free text)
    → parseMessyEventInfo() → structured { guests, suppliers, budget, risks }
    → record.preview (stored in localStorage via saveEventRecord())

User manual edits (UI panels)
    → updatePreview() / updateSupplier() / addSupplier()
    → record.preview (mutated in state, auto-saved via useEffect)

Workbook generation trigger (generateWorkbook() in main.jsx line 211)
    → saveEventRecord(record) — final save before compile
    → compileWorkbook(saved, saved.preview, window.location.origin)
        → buildWorkbook(eventData, preview, appBaseUrl)
            → buildSupplierRows(preview.suppliers)   ← supplier data enters here
            → addSheet(workbook, "07_Suppliers", supplierRows)
            → addMetadataSheet(workbook, eventData, appBaseUrl)
            → protectWorkbook(workbook)
    → workbookToBuffer(workbook) → .xlsx download
```

---

## 4. Supplier Export Audit

### Data Model (src/eventStorage.js + src/main.jsx)

The supplier object in `emptySupplier()` (`main.jsx:1301`) is:

```javascript
{ category, name, contact, phone, email, amount, paid, status, dueDate, notes }
```

The `SupplierForm` UI (`main.jsx:1030–1048`) collects all fields including `contact`, `email`, and `dueDate`.

The `addSupplier()` function (`main.jsx:278–297`) stores all fields into `record.preview.suppliers[]`.

### What the Workbook Currently Exports

`buildSupplierRows()` (`eventsheetWorkbook.js:440–468`) produces this 10-column layout:

| Column | Letter | Label | Source |
|---|---|---|---|
| 1 | A | תחום | `supplier.category` |
| 2 | B | שם ספק | `supplier.name` |
| 3 | C | טלפון | `supplier.phone` |
| 4 | D | עלות חוזה | `supplier.amount` |
| 5 | E | שולם | `supplier.paid` |
| 6 | F | יתרה | Formula: `MAX(0,D-E)` |
| 7 | G | סטטוס | `supplier.status` |
| 8 | H | חסר טלפון | Formula |
| 9 | I | חסר עלות | Formula |
| 10 | J | לא שולם | Formula |

### Gap Analysis

| Field | In Data Model? | Collected in UI? | Exported to Workbook? | Status |
|---|---|---|---|---|
| `contact` (איש קשר) | **Yes** | **Yes** (SupplierForm) | **No** | **Missing from export** |
| `email` (אימייל) | **Yes** | **Yes** (SupplierForm) | **No** | **Missing from export** |
| `dueDate` (תאריך יעד) | **Yes** | **Yes** (SupplierForm, `type="date"`) | **No** | **Missing from export** |
| `phone` (טלפון) | Yes | Yes | Yes (col C) | ✓ Already exported |
| `amount` (עלות חוזה) | Yes | Yes | Yes (col D) | ✓ Already exported |
| `paid` (שולם) | Yes | Yes | Yes (col E) | ✓ Already exported |
| `status` (סטטוס) | Yes | Yes | Yes (col G) | ✓ Already exported |
| `notes` (הערות) | Yes | Yes | **No** | Also missing — out of scope for now |

**Conclusion:** `contact`, `email`, and `dueDate` exist completely in the data model and UI. They are simply not passed through to `buildSupplierRows()`. This is a clean add — no data collection work needed.

### Recommended Safe Change

Add three columns **at the end** (columns K, L, M) to avoid shifting existing column letters and breaking formula references:

| New Column | Letter | Hebrew Label | Source |
|---|---|---|---|
| 11 | K | איש קשר | `supplier.contact` |
| 12 | L | אימייל | `supplier.email` |
| 13 | M | תאריך יעד | `supplier.dueDate` |

**Do NOT insert between existing columns.** `applySheetEditability()` and the summary formulas in rows 2–8 reference specific column letters (C for phone, D for amount, E for paid). Any column insertion before J would break these.

The `applySheetEditability()` function for `07_Suppliers` (`eventsheetWorkbook.js:644–654`) must be extended to unlock columns 11–13 for data rows, making the new fields editable in the protected workbook.

---

## 5. Workbook Timestamp Plan

### What Already Exists

The hidden metadata sheet `_EventSheet_Metadata` already records:

```javascript
["generatedAt", new Date().toISOString()]   // e.g. "2026-06-09T14:23:00.000Z"
```

This is confirmed by `addMetadataSheet()` at `eventsheetWorkbook.js:506–522`. The metadata sheet is `state: "veryHidden"` — not accessible to the event manager in normal Excel use.

The ExcelJS workbook object also sets `workbook.created = new Date()`, which appears in the file's Office XML metadata but is not visible as a cell value.

### What Is Missing

No user-facing sheet displays when the workbook was generated. The event manager opening the .xlsx file cannot tell if they are looking at a fresh workbook or a week-old one.

### Recommendation

Add a visible timestamp as a **new data row at the end of `01_סיכום_האירוע`**, after the existing 31 rows:

```javascript
["חותמת זמן", formatIsoForSheet(new Date().toISOString()), "תאריך ושעת הפקת החוברת"]
```

`formatIsoForSheet()` already exists in the codebase (`eventsheetWorkbook.js:980–987`) and returns a Hebrew-locale formatted date string.

**Critical constraint:** Place the row at position 32 or later — **after** the existing 31 rows. Do NOT insert it within rows 1–31. This preserves:
- `printArea = "A1:C31"` (checked by QA)
- Navigation link row positions at B27–B31 (checked by QA)
- The `[1, 26]` row style references in `applyProfessionalSheetStyle()`
- All internal formula row references (`B7`, `B11`, `B6`, etc.)

The timestamp row will be visible when scrolling but will not print unless the manager manually expands the print area. This is acceptable — the timestamp is a reference, not a printable field.

---

## 6. RSVP Formatting Plan

### Current State

Sheet `03_RSVP_Status` is built at `eventsheetWorkbook.js:185–191`:

```javascript
["סטטוס", "כמות", "אחוז"],
[STATUS_ATTENDING, { formula: `COUNTIF(...)` }, { formula: "IFERROR(B2/SUM(B2:B4),0)" }],
[STATUS_PENDING,   { formula: `COUNTIF(...)` }, { formula: "IFERROR(B3/SUM(B2:B4),0)" }],
[STATUS_DECLINED,  { formula: `COUNTIF(...)` }, { formula: "IFERROR(B4/SUM(B2:B4),0)" }],
["הערה", "אין כאן מערכת RSVP. זהו סיכום תפעולי לעבודה ידנית.", ""],
```

The percentage formulas correctly return decimal values between 0 and 1.

### Number Format Applied

`applyNumberFormats()` at `eventsheetWorkbook.js:724–734` applies `numFmt = "0%"` when:

```javascript
percentLabels.some((label) => rowLabel.includes(label) || header.includes(label))
```

where `percentLabels = ["אחוז", "תפוסה", "ניצול"]`.

For column C in this sheet, `header = "אחוז"`, which matches. The `0%` format is applied to all cells in column C including the formula cells in rows 2–4. With `numFmt = "0%"`, Excel renders `0.65` as `65%`. **This is correct behavior.**

### Minor Issue Identified

Row 5 ("הערה" row) has an empty string `""` in column C. With `numFmt = "0%"` applied to all column C cells, Excel will display this as `0%` rather than blank. This is cosmetically imprecise.

### Recommendation

Two safe options (pick either):

**Option A (minimal):** Accept current behavior. The `0%` in the note row is harmless since the note row label "הערה" clearly signals it is not a data row.

**Option B (clean):** In `applyNumberFormats()`, add a guard to skip applying percent format to rows where column A is "הערה" (or more generally, to non-formula cells in percentage-formatted columns). This is a 2-line change inside `applyNumberFormats`.

Recommendation: implement **Option B** as a clean improvement — the change is isolated to `applyNumberFormats()` and cannot break any formula or protection logic.

---

## 7. Hebrew Cleanup Audit

### Sheet Names — Clean

All 12 operational sheet names are professional Hebrew. No change needed:
- `01_סיכום_האירוע`, `02_Guest_Database`, `03_RSVP_Status`, `04_Categories`, `05_Seating`, `06_Venue`, `07_Suppliers`, `08_Budget`, `09_Change_Impact`, `10_Risks`, `11_Final_Brief`, `12_חיפוש_שולחן`

The mixed Hebrew/English sheet names are intentional for technical stability. Do not rename.

### 07_Suppliers Column Headers — Needs Update

Current header (10 columns):
```
תחום | שם ספק | טלפון | עלות חוזה | שולם | יתרה | סטטוס | חסר טלפון | חסר עלות | לא שולם
```

After Phase A, adding 3 new columns:
```
תחום | שם ספק | טלפון | עלות חוזה | שולם | יתרה | סטטוס | חסר טלפון | חסר עלות | לא שולם | איש קשר | אימייל | תאריך יעד
```

**Minor consideration:** "חסר טלפון" is clear in context but "חסר מספר טלפון" is slightly more professional. This is a cosmetic-only change and is OPTIONAL. Recommend skipping for Phase A to minimize surface area.

### 01_סיכום_האירוע — Labels Are Professional

Current row labels are appropriate. After adding the timestamp row:

```
"חותמת זמן" | "09/06/2026" | "תאריך ושעת הפקת החוברת"
```

This label is clear and professional.

### Other Sheets — No Changes Needed

`02_Guest_Database`, `05_Seating`, `08_Budget`, `10_Risks`, `11_Final_Brief`, `12_חיפוש_שולחן` — all Hebrew column headers are professional and clear. No cleanup required for Phase A.

### PLACEHOLDER String

`"לא זוהה מידע — לעדכון ידני"` — professional and clear. No change.

### Status Constants

`"מאשר הגעה"`, `"טרם השיב"`, `"לא מגיע"`, `"שולם"`, `"שולם חלקית"`, `"פתוח לתשלום"` — professional Hebrew. No change.

---

## 8. Risk Assessment

### Risk 1: Column Insertion in Supplier Sheet — HIGH RISK if done wrong

**Scenario:** If `contact`, `email`, `dueDate` are inserted *between* existing columns (e.g., after column C `טלפון`), this would shift all subsequent columns. The following would break:
- Summary formula rows 3–8 referencing `SUMPRODUCT(--(B11...),--(C11...=0))`, `SUM(D11...)`, `SUM(E11...)`, `SUM(F11...)`
- `applySheetEditability()` which unlocks columns 1–5 and 7 and sets formulas at 6, 8, 9, 10 by hard index

**Mitigation:** Add only at columns 11, 12, 13 (after existing column 10). Confirmed safe: the summary formulas reference columns B–F by letter, not position relative to new columns.

### Risk 2: Row Insertion in Summary Sheet — HIGH RISK if done within rows 1–31

**Scenario:** If the timestamp row is inserted within the existing 31 rows (e.g., after row 24 as originally considered), the following would break:
- `applyProfessionalSheetStyle()` hardcodes `[1, 26].forEach(...)` — row 26 would become the wrong row
- `printArea = "A1:C31"` — the QA script checks this exact string
- Navigation link cells B27–B31 — the QA script (`navigationLinksOk`) reads these exact cell addresses

**Mitigation:** Append timestamp as row 32 (after existing row 31). Print area unchanged. Navigation links unchanged. Professional style rows unchanged.

### Risk 3: RSVP Formatting Change — LOW RISK

The proposed Option B fix to `applyNumberFormats()` only adds an exclusion for the "הערה" row. It cannot affect formula rows 2–4 which are the actual RSVP data. The QA suite does not assert specific percent formats in the RSVP sheet.

### Risk 4: Workbook Protection Regression — LOW RISK

`protectWorkbook()` protects all worksheets uniformly. Adding columns to `07_Suppliers` and extending `applySheetEditability()` to unlock columns 11–13 follows the exact same pattern as existing columns. If the unlock extension is omitted, the new cells will be locked (protected) by default — a conservative failure rather than a destructive one.

### Risk 5: QA Script Failure

The `qualityCheck.mjs` checks that are most sensitive to Phase A changes:

| Check | Risk | Mitigation |
|---|---|---|
| `printSetupOk` checks `printArea === "A1:C31"` | Breaks if timestamp is within rows 1–31 | Add at row 32+ |
| `navigationLinksOk` reads B27–B31 | Breaks if summary rows are shifted | Add at row 32+ |
| `supplierInputCellsEditable` checks A11–G20 | Safe — new columns are K–M | No change to A–G |
| `formulaChecks.length >= 7` | Safe — we're adding data, not removing formulas | No change to formulas |
| `seatingExportOk` | Safe — seating sheet untouched | No change to sheet 05 |
| `guestLookupOk` | Safe — lookup sheet untouched | No change to sheet 12 |
| `metadataOk` | Safe — metadata sheet untouched | `generatedAt` already there |
| `missing.length === 0` | Safe — no sheets added or removed | Sheet count unchanged |

### Risk 6: RTL and Print Layout

Adding columns K–M to `07_Suppliers` may slightly change the print layout of that sheet, but the sheet has no explicit `printArea` defined (`applyProfessionalSheetStyle` only sets print areas for sheets 01, 05, 11, 12). The sheet auto-fits columns. No RTL impact — the `rightToLeft: true` view is set in `addSheet()` and applies globally to the sheet.

### Risk 7: `formatIsoForSheet` for Timestamp

The function already exists and is used in the codebase. It takes an ISO string and returns a localized Hebrew date string. For the timestamp, pass `new Date().toISOString()` at workbook build time (same as the metadata sheet does). This is stable.

---

## 9. Implementation Plan

**Scope:** Minimal, targeted changes to `src/eventsheetWorkbook.js` only. No changes to `src/main.jsx`, `src/eventStorage.js`, `src/seatingIntelligence.js`, or QA scripts.

---

### Step 1: Add Contact, Email, Due Date to Supplier Sheet

**File:** `src/eventsheetWorkbook.js`  
**Function:** `buildSupplierRows()` (line 440)

**Change A — Header row:**  
Extend the 10-column header to 13 columns by appending `"איש קשר"`, `"אימייל"`, `"תאריך יעד"`.

**Change B — Summary formula rows (rows 2–8):**  
No changes needed. These reference columns B–F by letter. Adding K–M does not affect them.

**Change C — Data rows (the supplier map):**  
Append `supplier.contact || ""`, `supplier.email || ""`, `supplier.dueDate || ""` as columns 11, 12, 13 to each supplier row.

**Change D — Placeholder row:**  
Extend from 10 to 13 empty strings.

---

### Step 2: Unlock New Supplier Columns in Protection Layer

**File:** `src/eventsheetWorkbook.js`  
**Function:** `applySheetEditability()` (line 625), `07_Suppliers` branch (line 644)

**Change:**  
Add `unlockRange(sheet, row, 11, 13)` so the new contact/email/dueDate cells are editable in the protected workbook. This follows the identical pattern used for columns 1–5 and 7.

---

### Step 3: Add Workbook Generation Timestamp to Summary Sheet

**File:** `src/eventsheetWorkbook.js`  
**Function:** `buildWorkbook()` (line 127), the `addSheet(workbook, sheetNames[0], [...])` call (line 145)

**Change:**  
Append one row at the END of the summary sheet data array (after the existing closing `"]"`) with the generation timestamp:

```javascript
["חותמת זמן", formatIsoForSheet(new Date().toISOString()), "תאריך ושעת הפקת החוברת"],
```

This becomes row 32. The `printArea = "A1:C31"` in `applyProfessionalSheetStyle()` is unchanged. Navigation link rows remain at positions 27–31.

---

### Step 4: Fix RSVP Percentage Format for Note Row (Optional but Recommended)

**File:** `src/eventsheetWorkbook.js`  
**Function:** `applyNumberFormats()` (line 724)

**Change:**  
Inside the `sheet.eachRow` loop, skip applying `numFmt` to cells in rows where the row is a notes/header row. The simplest safe guard: only apply percent format if the cell contains a formula or a numeric value (not a string).

```javascript
if (percentLabels.some(...)) {
  const isNumericOrFormula = typeof cell.value === "number" || cell.value?.formula;
  if (isNumericOrFormula) cell.numFmt = "0%";
}
```

This is a targeted, non-breaking change.

---

### Step 5: Hebrew Cleanup (Minimal)

No label changes required for Phase A. The column labels for the three new columns (`איש קשר`, `אימייל`, `תאריך יעד`) are already standard professional Hebrew.

Optional: rename "חסר טלפון" → "חסר מספר" and "חסר עלות" → "חסר עלות חוזה" for additional clarity. **Recommend deferring** — this changes existing column headers that the QA script indirectly relies on through the supplier input editability check.

---

## 10. Test Plan

Run these tests after implementation, before committing:

### A. Build and basic generation

```
npm run build
```
Must succeed with no errors.

### B. Quality check suite

```
npm run qualityCheck
```

Expected: all checks pass, including:
- `sheetCount` remains 13 (12 operational + 1 metadata)
- `missing.length === 0`
- `printSetupOk === true` (printArea still `"A1:C31"`)
- `navigationLinksOk === true` (B27–B31 unchanged)
- `supplierInputCellsEditable === true` (cols A–G unchanged)
- `guestInputCellsEditable === true` (unchanged)
- `guestFormulaCellsLocked === true` (unchanged)
- `metadataOk === true` (metadata sheet unchanged)
- `seatingExportOk === true` (seating unchanged)
- `guestLookupOk === true` (lookup unchanged)
- `formulaChecks.length >= 7` (no formulas removed)

### C. Final demo lock check

```
npm run finalDemoLockCheck
```

Must pass. This script adds a supplier with `dueDate` and `email` fields (it already does in its setup at line 62–72). After Phase A, those fields should appear in the workbook output.

### D. Manual workbook inspection

Generate a workbook from the demo sample data. Open the .xlsx in Excel and verify:

1. **Sheet count:** File shows 12 tabs (metadata is hidden).
2. **07_Suppliers sheet:**
   - Column K header: `איש קשר`
   - Column L header: `אימייל`
   - Column M header: `תאריך יעד`
   - If demo data has contact/email/dueDate populated, they appear in the data rows.
   - New columns are editable (green background, not locked).
   - Columns A–J are unchanged.
3. **01_סיכום_האירוע sheet:**
   - Row 32 contains `חותמת זמן` with today's date.
   - Rows 27–31 still contain the navigation links.
   - Print preview: rows 32+ do NOT appear in print (printArea stops at row 31).
4. **03_RSVP_Status sheet:**
   - Rows 2–4 show percentage values formatted as `65%` style (not `0.65`).
   - Row 5 ("הערה") column C: shows blank or `0%` — acceptable either way.
5. **Hebrew:** All sheet labels, headers, and cell values are RTL Hebrew. No question marks or garbled text.
6. **Protection:** Attempting to edit a formula cell shows "This cell is protected" message. Editing an editable cell (guest name, supplier phone) works normally.
7. **Seating:** Sheet 05 unchanged. Sheet 12 (guest lookup) unchanged. All formulas still resolve.
8. **Metadata sheet:** Hidden — cannot be seen in normal Excel tab list. (Verify via "Format > Hide/Unhide Sheet" — it will show as `veryHidden`.)

---

## 11. Final Recommendation

**Phase A is safe to implement now.**

All three supplier export fields (`contact`, `email`, `dueDate`) already exist in the data model and UI. This is a pure export gap — no data collection changes needed. The implementation is additive only (new columns at end of existing layout).

The workbook timestamp is a simple row append with no structural impact.

The RSVP formatting is already functionally correct. The proposed fix is a minor cosmetic improvement.

**What must wait — not for Household Architecture, but by design:**

- The `notes` field for suppliers is also missing from the workbook export. It is structurally identical to the contact/email/dueDate gap. However, since it was not named in the Phase A spec, **defer it** to Phase B or a dedicated supplier professionalization pass.
- A "חסר אימייל" or "חסר תאריך יעד" formula column in the supplier summary (rows 2–8) would be valuable professionally but requires adding new formula rows to the existing summary block. This has higher structural risk and should be a separate, explicitly scoped task.

**What must wait for Household Architecture Audit:**

- Household Logic — explicitly frozen per product rules.
- Any change to seating intelligence, category priority, or assignment flow.
- New workbook tabs or major sheet redesign.

**Phase A implementation surface:**
- 1 file: `src/eventsheetWorkbook.js`
- 4 targeted changes (Steps 1–4 above)
- No new files, no new sheets, no schema changes
- Full QA suite covers all critical regressions
