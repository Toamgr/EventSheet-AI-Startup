# PRODUCTION-READY EXCEL WORKBOOK ARCHITECTURE SPECIFICATION

**Document Classification:** Technical Design Document (TDD)

**Target Engine:** SheetJS (Codex Compiler Compatible)

**Core Baseline Alignment:** `FINAL_MVP_BASELINE.md`

**Operating Philosophy:** Rigidly Structured, Formula-Validated, Deterministic Event Operating System

---

## SECTION 1: GLOBAL WORKBOOK ARCHITECTURE Standards

To ensure the workbook runs reliably under field stress without breaking formulas, it avoids complex array formulas (`INDEX/MATCH`, `XLOOKUP` arrays, or dynamic spill arrays) that can behave inconsistently across different versions of Excel. Instead, it uses standard, high-performance native functions (`SUM`, `COUNTA`, `COUNTIF`, `COUNTIFS`, `SUMIF`, simple cell subtraction) combined with strict sheet protection matrices.

### 1.1 Global Named Ranges

The generation script must programmatically inject these absolute named ranges into the workbook to keep formulas decoupled from row drift:

* `CC_Baseline_Guests` $\rightarrow$ `='Command_Center'!$C$3`
* `CC_Live_Total_Guests` $\rightarrow$ `='Command_Center'!$C$4`
* `CC_Live_Confirmed_Guests` $\rightarrow$ `='Command_Center'!$C$10`
* `CC_FB_Cost_Per_Head` $\rightarrow$ `='Command_Center'!$C$19`
* `GD_Status_Range` $\rightarrow$ `='Guest_Database'!$C$5:$C$1004`
* `GD_Cohort_Range` $\rightarrow$ `='Guest_Database'!$D$5:$D$1004`
* `GD_Table_Range` $\rightarrow$ `='Guest_Database'!$F$5:$F$1004`
* `SE_Table_ID_Range` $\rightarrow$ `='Seating_Engine'!$A$5:$A$54`

### 1.2 Global Protection Engine Rules

* **Password Constraint:** Blank/Null string via code execution, but protection state is explicitly enabled (`SheetProtectSettings.Password := ""; SheetProtectSettings.Objects := true; SheetProtectSettings.Scenarios := true;`).
* **Behavior:** Every cell in the workbook is locked by default (`Locked = true`). Only cells explicitly marked as **UNLOCKED** in this document will have their property set to `Locked = false` during generation to allow user edits.

---

## SECTION 2: SHEET SPECIFICATIONS

### Tab 1: Event Command Center (`Command_Center`)

#### 1. Purpose

The primary operational dashboard. It aggregates key performance metrics and live variances, giving the event manager immediate visibility into guest fluctuations and budget deltas during the final 72 hours before execution.

#### 2. Layout, Structure & Row Mapping

| Cell Coordinate | Label / Element | Data Type | Validation Rule | Formula / Generating Logic | Protected? |
| --- | --- | --- | --- | --- | --- |
| **A1:D1** | **EVENT COMMAND CENTER - EXECUTIVE DASHBOARD** | String | None | Merge & Center, Title Block Theme | **LOCKED** |
| **A3** | Baseline Contract Guests | String | None | Static Label | **LOCKED** |
| **C3** | [Value] Baseline Contract Guests | Integer | None | *Hardcoded at generation from Web Form Input* | **LOCKED** |
| **D3** | *Instructions Reference* | String | None | Static Text: `"Original contract value"` | **LOCKED** |
| **A4** | Live Loaded Guests | String | None | Static Label | **LOCKED** |
| **C4** | [Value] Live Loaded Guests | Integer | None | `=COUNTA('Guest_Database'!$B$5:$B$1004)` | **LOCKED** |
| **D4** | Guest Load Delta | Integer | None | `=C4-C3` | **LOCKED** |
| **A6** | Baseline Cost Budget | String | None | Static Label | **LOCKED** |
| **C6** | [Value] Baseline Cost Budget | Currency | None | *Hardcoded at generation from Web Form Input* | **LOCKED** |
| **A7** | Live Total Operating Cost | String | None | Static Label | **LOCKED** |
| **C7** | [Value] Live Total Operating Cost | Currency | None | `=SUM('Vendor_Control'!$C$5:$C$54)+'F&B_Ledger'!$D$5` | **LOCKED** |
| **D7** | Financial Variance Delta | Currency | None | `=C7-C6` | **LOCKED** |
| **A9** | **ATTENDANCE BREAKDOWN** | String | None | Section Header Block | **LOCKED** |
| **A10** | Status: Attending | String | None | Static Label | **LOCKED** |
| **C10** | [Value] Status: Attending | Integer | None | `=COUNTIF(GD_Status_Range, "Attending")` | **LOCKED** |
| **A11** | Status: Declined | String | None | Static Label | **LOCKED** |
| **C11** | [Value] Status: Declined | Integer | None | `=COUNTIF(GD_Status_Range, "Declined")` | **LOCKED** |
| **A12** | Status: No Response | String | None | Static Label | **LOCKED** |
| **C12** | [Value] Status: No Response | Integer | None | `=COUNTIF(GD_Status_Range, "No Response")` | **LOCKED** |
| **A14** | **SEATING AUDIT TASKS** | String | None | Section Header Block | **LOCKED** |
| **A15** | Total Confirmed Unseated Guests | String | None | Static Label | **LOCKED** |
| **C15** | [Value] Total Confirmed Unseated | Integer | None | `=C10-SUM('Seating_Engine'!$D$5:$D$54)` | **LOCKED** |
| **A17** | **CATERING FINANCIAL PARAMETERS** | String | None | Section Header Block | **LOCKED** |
| **A19** | Live F&B Rate Per Head (Cover) | String | None | Static Label | **LOCKED** |
| **C19** | [Value] Live F&B Rate | Currency | Decimal $\ge 0$ | *User Configurable (Defaults to Web Form Input)* | **UNLOCKED** |

#### 3. Conditional Formatting Rules

* **Cell D4 (Guest Load Delta):**
* Formula Condition: `=$D$4>0` $\rightarrow$ Apply **Light Red Fill (HEX #FFC7CE) / Dark Red Text (HEX #9C0006)**.
* Formula Condition: `=$D$4<0` $\rightarrow$ Apply **Light Green Fill (HEX #C6EFCE) / Dark Green Text (HEX #006100)**.


* **Cell D7 (Financial Variance Delta):**
* Formula Condition: `=$D$7>0` $\rightarrow$ Apply **Soft Red Fill (HEX #FFC7CE) / Bold Dark Red Text (HEX #9C0006)** (Flags budget overruns).


* **Cell C15 (Total Confirmed Unseated Guests):**
* Formula Condition: `=$C$15>0` $\rightarrow$ Apply **Flashing-Alert Bright Red Fill (HEX #FF0000) / White Bold Text (HEX #FFFFFF)** (Flags that confirmed guests still need table assignments).



#### 4. Structural Relationships

* Consumes metrics calculated across `Guest_Database`, `Seating_Engine`, and `Vendor_Control`.
* Supplies the core baseline inputs (`CC_Live_Confirmed_Guests`, `CC_FB_Cost_Per_Head`) to `F&B_Ledger` via global named ranges.

---

### Tab 2: Master Guest Database (`Guest_Database`)

#### 1. Purpose

The single repository for all guest records. It structures unstructured input data into a clean, flat table format to feed downstream seating allocation and budget calculations.

#### 2. Layout, Structure & Column Mapping (Rows 5 to 1004 - Supports 1,000 Guests)

| Column | Header Label | Data Type | Formula Configuration (Row 5 Base Example) | Validation Rule | Protected? |
| --- | --- | --- | --- | --- | --- |
| **A** | Guest Unique ID | String | `=IF(ISBLANK(B5), "", "G-" & TEXT(ROW()-4, "0000"))` | None (Formula-driven auto-generation) | **LOCKED** |
| **B** | Guest Full Name | String | None | Text length string between 1 and 75 chars | **UNLOCKED** |
| **C** | RSVP Status | String | None | Explicit Dropdown List: `Attending`, `Declined`, `No Response` | **UNLOCKED** |
| **D** | Category Cohort | String | None | Dropdown List: `Bride Family`, `Groom Family`, `Mutual Friends`, `VIP Corporate`, `Kids` | **UNLOCKED** |
| **E** | Dietary Marker | String | None | Dropdown List: `None`, `Vegan`, `Vegetarian`, `Gluten-Free`, `Severe Nut Allergen` | **UNLOCKED** |
| **F** | Table Number Assigned | Integer | None | Dropdown List pointing to range: `SE_Table_ID_Range` | **UNLOCKED** |

*Note: Row 4 is locked as the structural table header row.*

#### 3. Conditional Formatting Rules

* **Column C (RSVP Status Cells):**
* Text match `="Attending"` $\rightarrow$ **Soft Green Fill (HEX #E2EFDA) / Dark Green Text (HEX #375623)**.
* Text match `="Declined"` $\rightarrow$ **Soft Red Fill (HEX #FCE4D6) / Dark Red Text (HEX #C65911)**.
* Text match `="No Response"` $\rightarrow$ **Soft Muted Yellow Fill (HEX #FFF2CC) / Brown Text (HEX #7F6000)**.


* **Column E (Dietary Marker Column):**
* Text match `="Severe Nut Allergen"` $\rightarrow$ **High-Visibility Solid Red Fill (HEX #C00000) / White Bold Text (HEX #FFFFFF)** (Critical for venue safety handoffs).



#### 4. Structural Relationships

* Column A dynamically updates based on whether data is present in Column B.
* Columns C, D, and F are targeted directly by `COUNTIF` and `COUNTIFS` summaries inside `Command_Center` and `Seating_Engine`.

---

### Tab 3: Table Assignment & Seating Engine (`Seating_Engine`)

#### 1. Purpose

Tracks table capacities and enforces spatial room rules. It automatically updates counts and cohort distributions as edits are made, validating the event manager's manual decisions against physical venue constraints in real time.

#### 2. Layout, Structure & Column Mapping (Rows 5 to 54 - Supports 50 Physical Tables)

| Column | Header Label | Data Type | Formula Configuration (Row 5 Base Example) | Validation Rule | Protected? |
| --- | --- | --- | --- | --- | --- |
| **A** | Table Table ID | Integer | Programmatically generated sequence integers `1` to `50` | None (Static primary key array index) | **LOCKED** |
| **B** | Table Descriptive Label | String | None | Text length string between 1 and 30 chars | **UNLOCKED** |
| **C** | Maximum Physical Capacity | Integer | None | Whole number integer range between `1` and `16` | **UNLOCKED** |
| **D** | Live Total Seated | Integer | `=COUNTIF(GD_Table_Range, A5)` | None (Calculation cell) | **LOCKED** |
| **E** | Net Available Seats | Integer | `=C5-D5` | None (Calculation cell) | **LOCKED** |
| **F** | Capacity Validation Status | String | `=IF(D5>C5, "OVER CAPACITY", IF(D5=C5, "Table Full", "Seats Available"))` | None (Calculation cell) | **LOCKED** |
| **G** | Cohort Count: Bride | Integer | `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "Bride Family")` | None (Calculation cell) | **LOCKED** |
| **H** | Cohort Count: Groom | Integer | `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "Groom Family")` | None (Calculation cell) | **LOCKED** |
| **I** | Cohort Count: Friends | Integer | `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "Mutual Friends")` | None (Calculation cell) | **LOCKED** |
| **J** | Cohort Count: Corporate | Integer | `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "VIP Corporate")` | None (Calculation cell) | **LOCKED** |

#### 3. Conditional Formatting Rules

* **Column F (Capacity Validation Status Column):**
* Text match `="OVER CAPACITY"` $\rightarrow$ Apply **Bright Alert Red Fill (HEX #FF0000) / White Bold Text (HEX #FFFFFF)** to the complete row cross-section `A5:F5`.


* **Column E (Net Available Seats Column):**
* Numeric target check `=0` $\rightarrow$ Apply **Soft Gray Fill background (HEX #F2F2F2) / Muted Gray italic text string font** (Visually signals a locked table).



#### 4. Structural Relationships

* Column A serves as the absolute verification vector controlling dropdown constraints for Column F in `Guest_Database`.
* Column D parameters are aggregated back to `Command_Center!C15` to identify unassigned guests across tabs.

---

### Tab 4: Vendor & Procurement Control (`Vendor_Control`)

#### 1. Purpose

A consolidated checklist ledger to track supplier contracts, down payments, and outstanding balances. It calculates these figures dynamically to help manage final cash flow balances.

#### 2. Layout, Structure & Column Mapping (Rows 5 to 54 - Supports 50 Service Contracts)

| Column | Header Label | Data Type | Formula Configuration (Row 5 Base Example) | Validation Rule | Protected? |
| --- | --- | --- | --- | --- | --- |
| **A** | Operational Category Tag | String | None | Dropdown List: `Venue`, `Catering`, `Production`, `Band/DJ`, `Florist`, `Photography`, `Planner` | **UNLOCKED** |
| **B** | Vendor Entity Legal Name | String | None | Text length between 1 and 100 chars | **UNLOCKED** |
| **C** | Total Contracted Cost Fee | Currency | None | Decimal number configuration $\ge 0$ | **UNLOCKED** |
| **D** | Total Retainer Amount Paid | Currency | None | Decimal number configuration $\ge 0$ | **UNLOCKED** |
| **E** | Outstanding Net Balance Due | Currency | `=C5-D5` | None (Calculation cell) | **LOCKED** |
| **F** | Administrative Status | String | None | Dropdown List: `Paid In Full`, `Deposit Paid`, `Balance Pending`, `No Payment Made` | **UNLOCKED** |

#### 3. Conditional Formatting Rules

* **Column E (Outstanding Net Balance Due Column):**
* Formula evaluation condition: `AND($E5>0, $F5="Balance Pending")` $\rightarrow$ Apply **Soft Amber Warning Fill (HEX #FFF2CC) / Brown Text (HEX #7F6000)**.


* **Column F (Administrative Status Column):**
* Text match `="Paid In Full"` $\rightarrow$ Apply **Emerald Green Text Treatment (HEX #006100) / Transparent Fill**.
* Text match `="No Payment Made"` $\rightarrow$ Apply **Crimson Red Font Face Format (HEX #9C0006) / Muted Red Background Grid**.



#### 4. Structural Relationships

* Columns C and D sum totals flow directly upstream to the live operating expenditure cell formula inside `Command_Center!C7`.

---

### Tab 5: Budget & F&B Ledger (`F&B_Ledger`)

#### 1. Purpose

Tracks fixed logistics overhead alongside dynamic per-head catering fees. It automatically updates total event costs when headcount variables shift on the guest list.

#### 2. Layout, Structure & Cell Mapping

| Cell Coordinate | Label / Component Element | Data Type | Validation Rule | Formula / Calculation Source Matrix | Protected? |
| --- | --- | --- | --- | --- | --- |
| **A1:D1** | **VARIABLE FOOD & BEVERAGE COMMITTED COSTING LEDGER** | String | None | Merge & Center, Financial Sheet Formatting | **LOCKED** |
| **A3** | Live Attending Guest Counts | String | None | Static Label | **LOCKED** |
| **D3** | [Value] Confirmed Guests | Integer | None | `=CC_Live_Confirmed_Guests` *(Named Range Sync Link)* | **LOCKED** |
| **A4** | Negotiated Menu Per-Head Rate | String | None | Static Label | **LOCKED** |
| **D4** | [Value] Cost Per Head Cover | Currency | None | `=CC_FB_Cost_Per_Head` *(Named Range Sync Link)* | **LOCKED** |
| **A5** | **Total Variable F&B Financial Liability** | String | None | Static Label (Bold Font Style) | **LOCKED** |
| **D5** | [Value] Computed Variable Total | Currency | None | `=D3*D4` *(Dynamic volume catering cost projection)* | **LOCKED** |
| **A7:D7** | **FIXED LOGISTICS OVERHEAD OPERATING LINE ITEMS** | String | None | Sub-Section Section Split Header | **LOCKED** |
| **A8** | *Row Item Base 1:* Expense Title | String | None | User Input Text Label String (e.g., `"City Permit"`) | **UNLOCKED** |
| **B8** | *Row Item Base 1:* Gross cost value | Currency | Value $\ge 0$ | User Input Decimal Number | **UNLOCKED** |
| **C8** | *Row Item Base 1:* Paid amount | Currency | Value $\ge 0$ | User Input Decimal Number | **UNLOCKED** |
| **D8** | *Row Item Base 1:* Unpaid balance | Currency | None | `=B8-C8` | **LOCKED** |

*Note: The Fixed Cost line items block row range runs sequentially from Row 8 to Row 48. Cells in Column D follow the same downward calculation structure (`=B48-C48`).*

#### 3. Summary Performance Totals Blocks

* **Cell B50** $\rightarrow$ Static Label: `"Total Aggregate Fixed Expenses Balance Owed"` (**LOCKED**)
* **Cell D50** $\rightarrow$ Calculation Formula: `=SUM(D8:D48)` (**LOCKED**)

#### 4. Conditional Formatting Rules

* **Cell D5 (Computed Variable Total Cell):**
* Formula comparative threshold evaluation: `=$D$5>('Command_Center'!$C$6*0.5)` $\rightarrow$ Apply **Soft Amber Highlight Text (HEX #8A6D3B)** (Flags if catering alone consumes over half the baseline budget allocation).



#### 5. Structural Relationships

* Pulls current attendee counts and rates from `Command_Center` via global named ranges.
* Passes the final variable expense sum back to the global ledger formula inside `Command_Center!C7`.

---

### Tab 6: Operational AI Brief (`AI_Brief`)

#### 1. Purpose

A dedicated text interface that displays the qualitative operational brief generated by the Gemini API during workbook initialization. It gives on-site teams clear, non-mathematical strategic guidance and operational steps.

#### 2. Layout, Formatting & Absolute Protection Parameters

* **Layout Grid Space Assignment Matrix:** Rows 1 through 65 across Columns A through L are merged into a unified text field.
* **Grid Formatting Properties:** Horizontal alignment is locked to `Left`, Vertical distribution is anchored to `Top`, and `Wrap Text` is enabled (`true`).
* **Data Typology:** Long-form alphanumeric text block, injected as a static value by SheetJS during file compilation.
* **Sheet Protection Lock:** This entire sheet is set to **Locked** (`Protect := true`). All cell edit rights are disabled, preventing users from making modifications and keeping the AI-generated brief as a fixed reference guide.

---

## SECTION 3: CROSS-TAB REFERENCE MAP

To assist with coding the generation script, this map shows how data moves across sheets. It ensures that cell updates flow smoothly across tabs using native Excel calculations.

```
Guest_Database Tab (Rows 5-1004)
 ├── Column C (RSVP Status) ──────────► Used in COUNTIF for Command_Center!C10:C12
 ├── Column D (Cohort Tag) ───────────► Used in COUNTIFS for Seating_Engine!G5:J54
 └── Column F (Table Number) ─────────► Used in COUNTIF for Seating_Engine!D5:D54
                                        and Command_Center!C15

Command_Center Tab (KPI Dashboard)
 ├── Cell C10 (Attending Count) ──────► Named Range Live_Confirmed_Guests ──► Feeds F&B_Ledger!D3
 └── Cell C19 (F&B Rate Per Head) ────► Named Range FB_Cost_Per_Head ────────► Feeds F&B_Ledger!D4

Vendor_Control Tab (Rows 5-54)
 └── Column C (Contract Costs) ───────► Summed up directly inside ──────────► Feeds Command_Center!C7

F&B_Ledger Tab (Catering Calculator)
 └── Cell D5 (Variable Total Cost) ───► Added directly into ────────────────► Feeds Command_Center!C7

```