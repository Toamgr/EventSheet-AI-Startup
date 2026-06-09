# Workbook Professionalization Phase A

## Purpose

The workbook already stored supplier contact details (name, phone, email, contact person, due date) in the data model and in the UI form. These fields were not exported to the Excel file. Event managers working from the printed workbook had no supplier contact information available.

Additionally, the workbook had no visible indicator of when it was generated. The generation timestamp existed only in the hidden metadata sheet, invisible to the event manager.

A minor cosmetic issue was also identified: the `0%` number format was applied to empty note cells in the RSVP sheet, causing them to display as `0%` rather than blank.

---

## Decisions

### Supplier Export

**Added fields:**
- `contact` (איש קשר)
- `email` (אימייל)
- `dueDate` (תאריך יעד)

**Exported as columns in sheet `07_Suppliers`:**
- Column K (11): `איש קשר`
- Column L (12): `אימייל`
- Column M (13): `תאריך יעד`

**Decision:**  
Columns were appended at the end (columns 11–13) rather than inserted between existing columns. Inserting between columns would have shifted the column letter references in the existing summary formulas (rows 2–8 of the supplier sheet reference columns B–F by letter) and in `applySheetEditability()`, which locks/unlocks columns by hard index. Appending avoids all of these breakage points.

The new columns are editable in the protected workbook. `unlockRange(sheet, row, 11, 13)` was added to the `07_Suppliers` branch of `applySheetEditability()`, following the identical pattern used for the existing editable columns.

---

### Workbook Timestamp

**Decision:**  
A visible generation timestamp was added to `01_סיכום_האירוע` as row 32 (label: `נוצר בתאריך`, value: formatted date string).

**Reason:**  
The workbook already stored `generatedAt` as an ISO timestamp in the hidden `_EventSheet_Metadata` sheet. Event managers could not see when the workbook was generated. The visible timestamp closes this gap.

**Constraint:**  
The timestamp was placed at row 32 or later — after the existing 31-row structure — to preserve:
- `printArea = "A1:C31"` (checked by the QA suite)
- Navigation link cells at B27–B31 (also checked by the QA suite)
- The row-number references in `applyProfessionalSheetStyle()` (`[1, 26].forEach(...)`)

The timestamp row is visible when scrolling but does not print unless the manager manually expands the print area. This is acceptable for a reference field.

---

### RSVP Formatting

**Decision:**  
The `0%` percentage formatting behavior for the `אחוז` column in `03_RSVP_Status` is unchanged. Formula cells in rows 2–4 continue to display RSVP percentages correctly.

**Fix:**  
A guard was added in `applyNumberFormats()` to skip applying `numFmt = "0%"` unless the target cell contains a numeric value or a formula. This prevents the empty note cell in row 5 from being formatted as `0%`.

The change is one line:
```javascript
const isNumericOrFormula = typeof cell.value === "number" || Boolean(cell.value?.formula);
if (percentLabels.some(...) && isNumericOrFormula) cell.numFmt = "0%";
```

---

### Hebrew Standard

No existing Hebrew labels were changed.

Approved new labels used:
- `איש קשר`
- `אימייל`
- `תאריך יעד`

---

## Files Changed

| File | Change |
|---|---|
| `src/eventsheetWorkbook.js` | 4 targeted changes — see diff below |

No other files were modified.

**Diff summary (`src/eventsheetWorkbook.js`):**
- `buildWorkbook()`: +1 row appended to `01_סיכום_האירוע` data array (timestamp at row 32)
- `buildSupplierRows()`: header extended from 10 to 13 columns; data rows extended with `contact`, `email`, `dueDate`; placeholder row extended from 10 to 13 empty strings
- `applySheetEditability()`: +1 line — `unlockRange(sheet, row, 11, 13)` inside `07_Suppliers` branch
- `applyNumberFormats()`: +1 guard line — `isNumericOrFormula` check before applying `0%` format

Total: 9 insertions, 3 deletions.

---

## QA Verification

All checks run after implementation and pass.

### Build

```
npm run build  →  ✓ built in 6.99s (no errors)
```

### qualityCheck.mjs

All assertions pass:

| Check | Result |
|---|---|
| `persistenceOk` | ✓ |
| `isolationOk` | ✓ |
| `seatingAlgorithm.ok` | ✓ |
| `seatingCapacityGuardOk` | ✓ |
| `manualAssignCapacityGuardOk` | ✓ |
| `eventScopedCategoriesOk` | ✓ |
| `workbook.sheetCount` | 13 (12 op + 1 metadata) |
| `workbook.missing` | [] |
| `workbook.metadataOk` | ✓ |
| `workbook.navigationLinks` | 9 |
| `workbook.viewsOk` | ✓ |
| `workbook.hasRtlXml` | ✓ |
| `workbook.protectedOk` | ✓ |
| `workbook.formulaChecks` | 7 |
| `workbook.seatingExportOk` | ✓ |
| `workbook.guestLookupOk` | ✓ |
| `workbook.noFakeSeatingExported` | ✓ |
| `workbook.emptyGuestLookupOk` | ✓ |
| `workbook.hiddenTechnicalLanguageOk` | ✓ |
| `workbook.printSetupOk` | ✓ (`printArea = "A1:C31"`) |

### finalDemoLockCheck.mjs

All assertions pass. Sheet count 13, seating link correct, `hebrewOk: true`.

### Manual workbook inspection (outputs/final-demo-lock.xlsx)

| Check | Result |
|---|---|
| Operational sheet count | 12 |
| `07_Suppliers` col 11 header | `איש קשר` |
| `07_Suppliers` col 12 header | `אימייל` |
| `07_Suppliers` col 13 header | `תאריך יעד` |
| New columns editable (locked: false, fill: FFE9F8EF) | ✓ |
| Contact exports correctly ("רועי" for demo supplier) | ✓ |
| Due date exports correctly ("2026-07-01" for demo supplier) | ✓ |
| `01_סיכום_האירוע` row 32 label | `נוצר בתאריך` |
| `01_סיכום_האירוע` row 32 value | `09.06.2026` (he-IL formatted) |
| `01_סיכום_האירוע` row 33 | null (no overflow) |
| `printArea` | `A1:C31` ✓ |
| Navigation links B27–B31 | All intact with correct eventId ✓ |
| Metadata `generatedAt` (B4) | ISO timestamp present ✓ |
| Metadata sheet state | `veryHidden` ✓ |
| RSVP rows 2–4 col C `numFmt` | `0%` ✓ |
| RSVP row 5 col C `numFmt` | `undefined` (not forced to `0%`) ✓ |
| `05_Seating` I14 | Category mix value present ✓ |
| `12_חיפוש_שולחן` A3 | `שם אורח` ✓ |

---

## Future Work

Not included in Phase A:

- **Household Logic** — an additional intelligence layer above categories, below capacity. Architecture audit required before any implementation.
- **Seating Intelligence V3** — no changes planned; current V2 architecture is frozen.
- **Supplier notes export** — the `notes` field exists in the data model but was not in the Phase A spec. Candidate for a future supplier professionalization pass.
- **Supplier summary formula additions** — "חסר אימייל", "חסר תאריך יעד" formula rows in the supplier summary block (rows 2–8). Higher structural risk; deferred.
- **Household Architecture Audit** — prerequisite for any household-related features.
