# DECISION 005 — Workbook Professionalization Phase A

**Date:** 2026-06-09  
**Status:** Implemented  
**File modified:** `src/eventsheetWorkbook.js` only

---

## Purpose

Three gaps were identified between the data model and the workbook output:

1. Supplier contact fields (`contact`, `email`, `dueDate`) existed in the data model and were collected in the UI, but were not exported to sheet `07_Suppliers`.
2. The workbook had no visible generation timestamp. The timestamp existed only in the hidden `_EventSheet_Metadata` sheet, inaccessible to the event manager.
3. The `0%` number format was being applied to empty note cells in sheet `03_RSVP_Status`, causing them to display as `0%` rather than blank.

This phase addresses all three. No new features were added. Seating Intelligence and Household Logic were not touched.

---

## Decisions

### Supplier Export

**Fields added to `07_Suppliers` workbook output:**

| Field | Hebrew label | Column |
|---|---|---|
| `supplier.contact` | `איש קשר` | K (11) |
| `supplier.email` | `אימייל` | L (12) |
| `supplier.dueDate` | `תאריך יעד` | M (13) |

**Decision:** Columns appended at positions 11–13 (after the existing column 10). Inserting between existing columns was rejected because the supplier sheet summary formulas (rows 2–8) reference columns by letter (`B`, `C`, `D`, `E`, `F`) and `applySheetEditability()` references columns by hard index (1–10). Appending preserves all existing references without modification.

**Editability:** `unlockRange(sheet, row, 11, 13)` was added to the `07_Suppliers` branch of `applySheetEditability()`. This follows the identical pattern used for the existing user-input columns (1–5 for תחום/שם/טלפון/עלות/שולם and 7 for סטטוס). The result is `locked: false`, fill `#E9F8EF` (green), matching all other editable data columns.

**Editability audit (verified against output):**

| Columns | Treatment | locked | fill |
|---|---|---|---|
| 1–5 (A–E): input data | `unlockRange(1,5)` | false | FFE9F8EF |
| 6 (F): balance formula | `setLockedFormula` | true | FFE5E7EB |
| 7 (G): status | `unlockRange(7,7)` | false | FFE9F8EF |
| 8–10 (H–J): diagnostic formulas | `setLockedFormula` ×3 | true | FFE5E7EB |
| 11–13 (K–M): new input data | `unlockRange(11,13)` | false | FFE9F8EF |

No inconsistency. The new columns follow the same data-input pattern as all existing editable columns.

---

### Workbook Generation Timestamp

**Change:** One row appended to `01_סיכום_האירוע` at row 32:

```
label: "נוצר בתאריך"
value: formatIsoForSheet(new Date().toISOString())   // e.g. "09.06.2026"
note:  "תאריך ושעת הפקת החוברת"
```

**Decision:** Row added at position 32, after the existing 31-row structure. This preserves:
- `printArea = "A1:C31"` — the QA suite asserts this exact string.
- Navigation link cells at B27–B31 — the QA suite reads these exact addresses.
- The `[1, 26].forEach(...)` row-style references in `applyProfessionalSheetStyle()`.

The timestamp is visible when scrolling but falls outside the print area. This is intentional — it is a reference field, not a printable operational row.

`formatIsoForSheet()` was already present in the codebase. No new formatter or dependency was introduced.

---

### RSVP Percentage Formatting

**Existing behavior preserved:** Formula cells in `03_RSVP_Status` column C (header: `"אחוז"`) continue to receive `numFmt = "0%"`. RSVP percentages display correctly.

**Fix:** Added an `isNumericOrFormula` guard in `applyNumberFormats()`:

```javascript
const isNumericOrFormula = typeof cell.value === "number" || Boolean(cell.value?.formula);
if (percentLabels.some(...) && isNumericOrFormula) cell.numFmt = "0%";
```

**Before:** The notes row (row 5, col C, value: `""`) received `numFmt = "0%"`, displaying as `0%`.  
**After:** Empty/string cells are skipped. The notes cell has `numFmt: undefined`. Formula cells in rows 2–4 are unaffected.

---

### Hebrew Labels

No existing Hebrew labels were changed. Three new labels were introduced:

- `איש קשר` (contact person)
- `אימייל` (email)
- `תאריך יעד` (due date)

---

## Files Changed

| File | Lines changed |
|---|---|
| `src/eventsheetWorkbook.js` | +9 / −3 (4 locations) |

No other files were modified.

**Change locations:**

1. `buildWorkbook()` — `addSheet(sheetNames[0], [...])` array: +1 timestamp row appended after row 31.
2. `buildSupplierRows()` — header row: +3 column labels. Data rows: +3 fields (`contact`, `email`, `dueDate`). Placeholder row: +3 empty strings.
3. `applySheetEditability()` — `07_Suppliers` branch: +1 `unlockRange(sheet, row, 11, 13)`.
4. `applyNumberFormats()` — +1 `isNumericOrFormula` guard line before `numFmt = "0%"` assignment.

---

## QA Verification

All three QA commands pass after implementation:

```
npm run build          →  ✓ no errors
npm run qualityCheck   →  all 20 checks pass (see below)
npm run finalDemoLock  →  ✓ pass, sheetCount: 13, hebrewOk: true
```

**qualityCheck results:**

| Check | Result |
|---|---|
| `persistenceOk` | ✓ |
| `isolationOk` | ✓ |
| `seatingAlgorithm.ok` | ✓ |
| `seatingCapacityGuardOk` | ✓ |
| `manualAssignCapacityGuardOk` | ✓ |
| `eventScopedCategoriesOk` | ✓ |
| `parserOk` | ✓ |
| `workbook.sheetCount` | 13 (12 operational + 1 hidden metadata) |
| `workbook.missing` | [] |
| `workbook.metadataOk` | ✓ (eventId and version correct) |
| `workbook.navigationLinks` | 9 |
| `workbook.viewsOk` | ✓ (RTL on all sheets) |
| `workbook.hasRtlXml` | ✓ |
| `workbook.protectedOk` | ✓ |
| `workbook.formulaChecks` | 7 |
| `workbook.seatingExportOk` | ✓ |
| `workbook.guestLookupOk` | ✓ |
| `workbook.noFakeSeatingExported` | ✓ |
| `workbook.emptyGuestLookupOk` | ✓ |
| `workbook.hiddenTechnicalLanguageOk` | ✓ |
| `workbook.printSetupOk` | ✓ (`printArea = "A1:C31"`) |

**Manual workbook verification (outputs/final-demo-lock.xlsx):**

| Check | Result |
|---|---|
| Operational sheet count | 12 |
| `07_Suppliers` col 11 header | `איש קשר` |
| `07_Suppliers` col 12 header | `אימייל` |
| `07_Suppliers` col 13 header | `תאריך יעד` |
| All 13 columns correct editability (rows 11 and 20) | ✓ all 26 cells pass |
| Contact exports: "רועי" in demo supplier row 13 col 11 | ✓ |
| Due date exports: "2026-07-01" in demo supplier row 13 col 13 | ✓ |
| `01_סיכום_האירוע` row 32 label | `נוצר בתאריך` |
| `01_סיכום_האירוע` row 32 value | `09.06.2026` |
| `01_סיכום_האירוע` row 33 | null (no overflow) |
| `printArea` | `A1:C31` ✓ |
| Navigation links B27–B31 | intact with correct eventId ✓ |
| `_EventSheet_Metadata` state | `veryHidden` ✓ |
| `_EventSheet_Metadata` B4 (generatedAt) | ISO timestamp present ✓ |
| RSVP rows 2–4 col C `numFmt` | `0%` ✓ |
| RSVP row 5 col C `numFmt` | `undefined` (not `0%`) ✓ |
| `05_Seating` I14 | category mix value present ✓ (unchanged) |
| `12_חיפוש_שולחן` A3 | `שם אורח` ✓ (unchanged) |

---

## What Was Not Part of This Phase

- **Household Logic** — not implemented. No data model changes for household groupings. No seating algorithm changes.
- **Seating Intelligence V3** — not part of this phase. `src/seatingIntelligence.js` was not touched.
- **Supplier `notes` field export** — the `notes` field exists in the data model but was not in the Phase A specification. Not implemented.
- **Supplier summary formula additions** — additional formula rows for "חסר אימייל" or "חסר תאריך יעד" in the supplier sheet summary block (rows 2–8) were considered but deferred due to higher structural risk.
- **Any new sheets, tabs, or major UI changes** — not part of this phase.
