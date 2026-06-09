## ARCHITECTURE BOARD REVIEW & AUDIT REPORT

**To:** Project Development Team

**From:** EventSheet AI Product Board & MVP Directorate

**Status:** Architecture Validated with Critical Conditions (See Section Audits Below)

---

## Executive Summary

The technical translation from `FINAL_MVP_BASELINE.md` into the detailed blueprint in `WORKBOOK_ARCHITECTURE_DRAFT.md` is structurally sound, hyper-focused on the 1-day/1-developer constraint, and treats Excel as a robust operating system. By stripping away multi-user cloud synchronization and over-engineered generative AI seating algorithms, the architecture successfully honors the **Excel-as-the-Product** philosophy.

However, under the harsh reality of field stress (the 72-hour chaotic window before a wedding) and the strict operational constraints of SheetJS (Codex compilation), the architecture contains minor structural blind spots and formula vulnerabilities. If unaddressed, these issues could corrupt data integrity during live demos or on-site execution.

---

## Technical Audit Matrix

| Review Vector | Status | Critical Findings & Core Issues |
| --- | --- | --- |
| **1. Data Model** | **APPROVED** | Flat, relational schema across 1,000 guests and 50 tables is highly clean and lightweight for SheetJS. |
| **2. Sheet Structure** | **NEEDS REVISION** | The exact 6 tabs perfectly align with the baseline, but Tab 5 contains structural design inconsistencies. |
| **3. Relationships** | **APPROVED** | Clean unidirectional upstream flow via native tracking metrics. Cross-tab map is logically air-tight. |
| **4. Formulas** | **NEEDS REVISION** | Contains dangerous logical loops and unhedged text matches that break easily with lowercase user input. |
| **5. Validation Rules** | **NEEDS REVISION** | Dropdown lists are defined, but critical failure safeguards against manual copy-paste overrides are missing. |
| **6. Protection Rules** | **APPROVED** | Global null-string password protection with explicit cell un-locking is optimized for SheetJS capabilities. |
| **7. User Experience** | **APPROVED** | Color-coded conditional formatting maps directly to an event manager's critical operational cognitive load. |
| **8. Academic Suitability** | **APPROVED** | Built directly around a 1-developer, 24-hour delivery target using Lovable and SheetJS client-side compilation. |
| **9. Demo Suitability** | **APPROVED** | The explicit live-friction scenario (headcount shifts, capacity overloads) will execute instantaneously. |
| **10. Implementation Risk** | **NEEDS REVISION** | High risk of formula corruption via native Excel copy-paste actions that bypass data validation rules. |

---

## Detailed Section-by-Section Audit

### 1. Data Model & Cross-Tab Relationships

* **Status:** **APPROVED**
* **Critique:** The decision to scale the architecture to exactly 1,000 guests (Rows 5–1004) and 50 tables (Rows 5–54) is clean and perfectly tuned to the memory layout constraints of SheetJS. The unique ID auto-generation rule in `Guest_Database!A5`:
`=IF(ISBLANK(B5), "", "G-" & TEXT(ROW()-4, "0000"))`
is highly reliable and creates an immediate structural anchor.
* **Weakness Identified:** The model assumes the 5 dropdown values for Category Cohorts are completely hardcoded. If an event manager types a cohort in the web app that isn't exactly one of these five, the downstream `COUNTIFS` arrays in the Seating Engine will completely ignore those guests.

### 2. Formulas & Logical Integrity

* **Status:** **NEEDS REVISION**
* **The "Live Total Operating Cost" Loop Hole:** In `Command_Center!C7`, the formula is written as:
`=SUM('Vendor_Control'!$C$5:$C$54)+'F&B_Ledger'!$D$5`
However, `F&B_Ledger!D5` calculates total catering costs using:
`=D3*D4` (Confirmed Guests $\times$ Cost Per Head).
Crucially, `F&B_Ledger!D3` pulls from the global named range `CC_Live_Confirmed_Guests`, which points back to `Command_Center!C10`. This calculation flow is clean, valid, and avoids circular references.
* **The "String Match" Threat:** The conditional formatting and seating engine summary logic rely heavily on hardcoded text strings (e.g., `="Attending"`, `="Severe Nut Allergen"`, `="Bride Family"`). If a field manager manually types `"attending"` (lowercase) or inserts a trailing space (`"Attending "`), native Excel string matching can fail depending on the operating system environment.
* **Correction Required:** Force uppercase data validation values or explicitly wrap processing ranges in uppercase evaluation formats where feasible.

### 3. Tab 5 Structural Discrepancy (`F&B_Ledger`)

* **Status:** **NEEDS REVISION**
* **Underengineering Flaw:** Rows 8 through 48 allow user-configured fixed logistical expenses. Column D calculates outstanding balances via: `=B8-C8`. However, the total summary row in cell `D50` uses: `=SUM(D8:D48)`.
* **The Missing Metric:** This tab computes the *unpaid balance* but completely fails to sum up the **Gross Cost** of fixed expenses (Column B). As a result, the Event Command Center (`Tab 1`) has no way to pull the total fixed logistics overhead into the master budget tile. It only pulls the dynamic F&B liability and vendor contract feeds.

### 4. Validation, Protection & Live Operational Risks

* **Status:** **NEEDS REVISION**
* **The Excel Copy-Paste Vulnerability:** Setting `Locked = false` on the `Guest_Database` inputs allows user entry. However, a major operational risk is that **copy-pasting values in Excel completely deletes the cell's underlying Data Validation rules**. If Omer Sdot receives a last-minute list and pastes it directly over Column C, the dropdown constraint is wiped out, allowing invalid text to enter the system and break the Command Center's `COUNTIF` strings.
* **Mitigation:** The generation script must append a hidden validation reference string note in the header configuration of Column B instructing users to "Paste Values Only."

---

## Final MVP Blueprint (Refined)

### Executive Summary

EventSheet AI is a specialized, one-way data-provisioning tool built to run entirely inside Excel once generated. It targets the final 72 hours before a wedding, converting unstructured list formats into an ironclad, formula-driven operational workbook.

### Critical Findings

* SheetJS can generate named ranges and basic sheet protection without errors, but complex legacy mobile Excel versions often fail to render custom conditional format definitions unless they are written using standard Excel GUI rule sets.
* Tab 5 (`F&B_Ledger`) contains a severe functional gap: fixed expenses are tracked but their gross totals never roll up into the master Command Center dashboard.

### What Matters Most

* Strict validation of structural named ranges.
* Protecting tracking equations from accidental deletion or user modification during high-stress field coordination.
* Flashing high-visibility indicators for critical venue capacity issues and severe health/allergen risks.

### What Should Be Removed

* Any dynamic string parsing inside Excel. String validation parameters must be strictly limited to locked dropdown menus.

### MVP Recommendation

Proceed with the Lovable client-side single-page UI wizard layout. Force the compiler script to execute the structural formula corrections outlined below before launching production testing.

---

### Corrected Workbook Architecture & Formula Matrix

To ensure development runs smoothly, use these exact cell coordinates and updated logic configurations:

```
[ EventSheet AI Generated Workbook ]
│
├── Tab 1: Command_Center (KPI Dashboard & Baseline vs. Live Variance)
├── Tab 2: Guest_Database (Flat List with Status and Cohort Dropdowns)
├── Tab 3: Seating_Engine (Capacity Monitoring & Validation Matrix)
├── Tab 4: Vendor_Control (Line-Item Expenses & Payment Schedule)
├── Tab 5: F&B_Ledger (Dynamic Catering Liability & Fixed Cost Registry)
└── Tab 6: AI_Brief (Qualitative Executive Narrative Brief)

```

#### Updated Formula Corrections

* **`F&B_Ledger!B50` (NEW SUMMARY TILE):** * Label: `"Total Gross Fixed Expenses Cost"`
* Formula: `=SUM(B8:B48)` (**LOCKED**)


* **`Command_Center!C7` (REVISED MASTER OPERATING COST):**
* Formula: `=SUM('Vendor_Control'!$C$5:$C$54)+'F&B_Ledger'!$D$5+'F&B_Ledger'!$B$50`
* *Operational Impact:* This fix ensures the master dashboard accurately captures dynamic catering costs, external service vendors, **and** internal fixed operational expenses in a single calculation.



---

### User Flow

1. **Input:** The manager opens the Lovable web wizard app interface.
2. **Configuration:** The user defines the core baseline parameters (Contracted Guests, Initial Cost Budget, and Per-Head Food Rate).
3. **Extraction:** A single payload passes through the Gemini API to format and organize the qualitative narrative for Tab 6.
4. **Compilation:** SheetJS structures the workbook data array, injects formulas, sets cell protection states, and automatically triggers an instant `.xlsx` download to the local machine.

### Demo Strategy

1. **The Setup:** Open a pre-generated workbook representing a 200-guest wedding setup 48 hours prior to execution.
2. **The Friction Step:** Manually alter 8 guests in `Guest_Database` from `"No Response"` to `"Attending"`, then assign them to a VIP table that only has 4 seats left.
3. **The Payoff:** Show the demo audience that without hitting save or refreshing a database, the `Seating_Engine` row instantly flashes deep red (`OVER CAPACITY`), the `F&B_Ledger` automatically increases the dynamic food liability projection, and the `Command Center` flags a financial variance alert.

---

## Recommended Next Steps

1. **Fix the Core Tab 5 Formula Integration:** Update the script compiler to include the `F&B_Ledger!B50` summary cell, and update `Command_Center!C7` to include this new fixed cost total.
2. **Sanitize Data on the Frontend:** Ensure the Lovable entry form automatically forces all Category Cohort entries into clean uppercase or proper title case structures *before* writing the dropdown parameters into the spreadsheet arrays.
3. **Run a Local SheetJS Protection Test:** Run a test compilation script to verify that setting the password property to an empty string (`""`) successfully locks formula-heavy cells while keeping input columns editable across Microsoft Excel, Google Sheets, and mobile viewers.