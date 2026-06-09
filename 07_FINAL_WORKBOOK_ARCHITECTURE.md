```markdown
# FINAL_WORKBOOK_ARCHITECTURE.md

## Executive Summary
EventSheet AI is a specialized, one-way data-provisioning pipeline that transforms unformatted wedding planning information into an ironclad, formula-driven Excel operating workbook[cite: 1, 4]. It is built specifically to serve the professional event manager (e.g., Omer Sdot) during the chaotic, high-stakes 72-hour execution window immediately preceding a wedding[cite: 1, 4].

By embracing an **Excel-as-the-Product** philosophy[cite: 1, 4], this architecture entirely bypasses multi-user cloud synchronization and over-engineered generative seating algorithms[cite: 1, 4]. Instead, it uses **SheetJS (Codex Compiler)** to compile a rigid, client-side, 6-tab spreadsheet running entirely on standard native formulas[cite: 1, 2, 4]. This final workbook specification incorporates all approved product board revisions and technical audits, establishing the frozen structural blueprint for immediate development[cite: 1].

---

## Critical Findings
* **One-Way Pipeline, Permanent Offline Truth:** Upstream web-syncing databases are operationally fragile and rejected[cite: 4]. The web wizard serves strictly as a frontend compiler; once the `.xlsx` file is generated, Excel becomes the definitive, offline source of truth for on-site execution[cite: 4].
* **Formula-Driven Seating & Validation Over AI:** High-end event planners do not require automated social engineering placement[cite: 4]. They require explicit, real-time formula validation constraints (`COUNTIF`/`COUNTIFS`) that immediately flag capacity overflows and category distributions when they make manual adjustments under pressure[cite: 4].
* **Data Integrity Safeguards:** To protect structural tracking equations during high-stress field coordination, global null-string password protection is programmatically applied[cite: 1, 2]. Data inputs are restricted to explicitly unlocked cells, and user data constraints are strictly enforced via locked dropdown lists to prevent broken string references[cite: 1, 2].
* **Tab Collapse Performance:** Core logistical dimensions—Category Intelligence, Venue Constraints, and Financial Variance—are elegantly collapsed into the main sheets via standard cell formulas to honor the 1-developer, 24-hour delivery target[cite: 1, 2, 4].

---

## What Matters Most
* **Absolute Integrity at the Handoff Point:** Serving the event manager when guest counts fluctuate, seating layouts shift, and final catering billing totals must be locked[cite: 4].
* **Strict Formula Isolation:** Keeping cell coordinates, structured parameters, and cross-tab references completely intact so that copying or entering data locally cannot corrupt the logic[cite: 4].
* **High-Visibility Status Indicators:** Using conditional formatting to instantly flash bright alerts for severe health/allergen risks, financial budget overruns, and table capacity breaches[cite: 1, 2].

---

## What Should Be Removed
* **Multi-User Cloud Infrastructure:** No user authentication, database persistence (Supabase/PostgreSQL), local storage, or collaborative client sync rooms[cite: 4].
* **Generative AI Seating Algorithms:** No relationship proximity scores, psychological profiling, or automated matrix-based seating placements[cite: 4].
* **Tab Proliferation:** Discard isolated, separate sheets for RSVPs, categories, venue profiles, or hazard indexes[cite: 4].
* **Dynamic String Parsing Inside Excel:** No loose text processing; all string validations are strictly limited to locked dropdown menus[cite: 1].

---

## MVP Recommendation
Proceed with the lightweight Lovable client-side single-page UI wizard[cite: 1, 4]. The frontend ingests raw unformatted guest text and core financial/venue parameters, triggers a single serverless Base44 / Gemini API call to synthesize a qualitative operational briefing narrative, compiles the data structure with SheetJS, and triggers an instantaneous local download of the 6-tab workbook[cite: 1, 4].

---

## Workbook Architecture & Global Standards

### Global Named Ranges
The workbook generation script must programmatically inject these absolute named ranges to keep formulas decoupled from layout drift[cite: 2]:
* `CC_Baseline_Guests` $\rightarrow$ `='Command_Center'!$C$3`[cite: 2]
* `CC_Live_Total_Guests` $\rightarrow$ `='Command_Center'!$C$4`[cite: 2]
* `CC_Live_Confirmed_Guests` $\rightarrow$ `='Command_Center'!$C$10`[cite: 2]
* `CC_FB_Cost_Per_Head` $\rightarrow$ `='Command_Center'!$C$19`[cite: 2]
* `GD_Status_Range` $\rightarrow$ `='Guest_Database'!$C$5:$C$1004`[cite: 2]
* `GD_Cohort_Range` $\rightarrow$ `='Guest_Database'!$D$5:$D$1004`[cite: 2]
* `GD_Table_Range` $\rightarrow$ `='Guest_Database'!$F$5:$F$1004`[cite: 2]
* `SE_Table_ID_Range` $\rightarrow$ `='Seating_Engine'!$A$5:$A$54`[cite: 2]

### Global Protection Engine Rules
* **Password Constraint:** Set via an empty/null string configuration script (`SheetProtectSettings.Password := "";`)[cite: 1, 2].
* **Default State:** Global cells are locked by default (`Locked = true`)[cite: 2]. Only explicit cell ranges designated below as **UNLOCKED** will accept user data inputs in the field[cite: 1, 2].

---

## Detailed Sheet Specifications

### Tab 1: Event Command Center (`Command_Center`)
#### 1. Purpose
The primary executive KPI dashboard[cite: 2]. It aggregates data across the entire workbook, exposing live headcount changes, seating gaps, and structural budget variances[cite: 2, 4].

#### 2. Layout, Structure & Row Mapping
* **Cells A1:D1:** `EVENT COMMAND CENTER - EXECUTIVE DASHBOARD` (Merged & Centered, Title Block Theme)[cite: 2]
* **Cell C3:** Baseline Contract Guests. Integer. **LOCKED**. (Hardcoded from initial web form input)[cite: 2]
* **Cell C4:** Live Loaded Guests. Integer. **LOCKED**. Formula: `=COUNTA('Guest_Database'!$B$5:$B$1004)`[cite: 2]
* **Cell D4:** Guest Load Delta. Integer. **LOCKED**. Formula: `=C4-C3`[cite: 2]
* **Cell C6:** Baseline Cost Budget. Currency. **LOCKED**. (Hardcoded from initial web form input)[cite: 2]
* **Cell C7:** Live Total Operating Cost. Currency. **LOCKED**. Formula: `=SUM('Vendor_Control'!$C$5:$C$54)+'F&B_Ledger'!$D$5+'F&B_Ledger'!$B$50`  *(Approved Revision: Now comprehensively sums external vendors, dynamic catering liabilities, and fixed operational expenses)*[cite: 1, 2]
* **Cell D7:** Financial Variance Delta. Currency. **LOCKED**. Formula: `=C7-C6`[cite: 2]
* **Cell C10:** Status: Attending. Integer. **LOCKED**. Formula: `=COUNTIF(GD_Status_Range, "Attending")`[cite: 2]
* **Cell C11:** Status: Declined. Integer. **LOCKED**. Formula: `=COUNTIF(GD_Status_Range, "Declined")`[cite: 2]
* **Cell C12:** Status: No Response. Integer. **LOCKED**. Formula: `=COUNTIF(GD_Status_Range, "No Response")`[cite: 2]
* **Cell C15:** Total Confirmed Unseated Guests. Integer. **LOCKED**. Formula: `=C10-SUM('Seating_Engine'!$D$5:$D$54)`[cite: 2]
* **Cell C19:** Live F&B Rate Per Head (Cover). Currency. **UNLOCKED** (Decimal $\ge 0$, defaults to web form input)[cite: 2].

#### 3. Conditional Formatting Rules
* **Cell D4 (Guest Load Delta):** Formula `=$D$4>0` $\rightarrow$ **Light Red Fill (#FFC7CE) / Dark Red Text (#9C0006)**; `=$D$4<0` $\rightarrow$ **Light Green Fill (#C6EFCE) / Dark Green Text (#006100)**[cite: 2].
* **Cell D7 (Financial Variance Delta):** Formula `=$D$7>0` $\rightarrow$ **Soft Red Fill (#FFC7CE) / Bold Dark Red Text (#9C0006)** (Triggers budget overrun warnings)[cite: 2].
* **Cell C15 (Total Confirmed Unseated Guests):** Formula `=$C$15>0` $\rightarrow$ **High-Visibility Bright Red Fill (#FF0000) / White Bold Text (#FFFFFF)** (Flags that confirmed attendees lack seats)[cite: 2].

---

### Tab 2: Master Guest Database (`Guest_Database`)
#### 1. Purpose
The single, flat relational repository for all guest profiles, sanitizing raw lists into operational fields[cite: 2, 4].

#### 2. Layout, Structure & Column Mapping (Rows 5 to 1004 - Supports 1,000 Guests)
* **Column A (Guest Unique ID):** String. **LOCKED**. Base Formula (`A5`): `=IF(ISBLANK(B5), "", "G-" & TEXT(ROW()-4, "0000"))`[cite: 1, 2]
* **Column B (Guest Full Name):** String. **UNLOCKED**. Validation: Text length 1 to 75 characters[cite: 2]. *(Approved Revision: System column header configuration notes appended with "Paste Values Only" to protect structural validation from Excel clipboard overrides)*[cite: 1].
* **Column C (RSVP Status):** String. **UNLOCKED**. Explicit Dropdown List: `Attending`, `Declined`, `No Response`[cite: 2].
* **Column D (Category Cohort):** String. **UNLOCKED**. Explicit Dropdown List: `BRIDE FAMILY`, `GROOM FAMILY`, `MUTUAL FRIENDS`, `VIP CORPORATE`, `KIDS`[cite: 2]. *(Approved Revision: Form inputs and data values forced into uppercase to safeguard string-matching formulas)*[cite: 1].
* **Column E (Dietary Marker):** String. **UNLOCKED**. Dropdown List: `None`, `Vegan`, `Vegetarian`, `Gluten-Free`, `Severe Nut Allergen`[cite: 2].
* **Column F (Table Number Assigned):** Integer. **UNLOCKED**. Dropdown List referencing the cell range: `SE_Table_ID_Range`[cite: 2].

#### 3. Conditional Formatting Rules
* **Column C (RSVP Status):** `="Attending"` $\rightarrow$ **Soft Green (#E2EFDA) / Dark Green Text (#375623)**; `="Declined"` $\rightarrow$ **Soft Red (#FCE4D6) / Dark Red Text (#C65911)**; `="No Response"` $\rightarrow$ **Soft Muted Yellow (#FFF2CC) / Brown Text (#7F6000)**[cite: 2].
* **Column E (Dietary Marker):** `="Severe Nut Allergen"` $\rightarrow$ **High-Visibility Solid Red Fill (#C00000) / White Bold Text (#FFFFFF)** (Critical for catering and venue safety handoffs)[cite: 1, 2].

---

### Tab 3: Table Assignment & Seating Engine (`Seating_Engine`)
#### 1. Purpose
Evaluates layout restrictions, table caps, and social cohorts dynamically against physical room limits[cite: 2, 4].

#### 2. Layout, Structure & Column Mapping (Rows 5 to 54 - Supports 50 Physical Tables)
* **Column A (Table ID):** Integer. **LOCKED**. Static programmatic integers `1` to `50`[cite: 2].
* **Column B (Table Descriptive Label):** String. **UNLOCKED**. Validation: Text length 1 to 30 characters[cite: 2].
* **Column C (Maximum Physical Capacity):** Integer. **UNLOCKED**. Validation: Whole number integer range `1` to `16`[cite: 2].
* **Column D (Live Total Seated):** Integer. **LOCKED**. Base Formula (`D5`): `=COUNTIF(GD_Table_Range, A5)`[cite: 2].
* **Column E (Net Available Seats):** Integer. **LOCKED**. Base Formula (`E5`): `=C5-D5`[cite: 2].
* **Column F (Capacity Validation Status):** String. **LOCKED**. Base Formula (`F5`): `=IF(D5>C5, "OVER CAPACITY", IF(D5=C5, "Table Full", "Seats Available"))`[cite: 2].
* **Column G (Cohort Count: Bride):** Integer. **LOCKED**. Base Formula (`G5`): `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "BRIDE FAMILY")`[cite: 2].
* **Column H (Cohort Count: Groom):** Integer. **LOCKED**. Base Formula (`H5`): `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "GROOM FAMILY")`[cite: 2].
* **Column I (Cohort Count: Friends):** Integer. **LOCKED**. Base Formula (`I5`): `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "MUTUAL FRIENDS")`[cite: 2].
* **Column J (Cohort Count: Corporate):** Integer. **LOCKED**. Base Formula (`J5`): `=COUNTIFS(GD_Table_Range, A5, GD_Cohort_Range, "VIP CORPORATE")`[cite: 2].

#### 3. Conditional Formatting Rules
* **Column F (Capacity Validation Status):** Match `="OVER CAPACITY"` $\rightarrow$ Apply **Bright Alert Red Fill (#FF0000) / White Bold Text (#FFFFFF)** to the complete row cross-section row layout range `A5:F5`[cite: 2].
* **Column E (Net Available Seats):** Numeric equal to `0` $\rightarrow$ Apply **Soft Gray Fill background (#F2F2F2) / Muted Gray italic text string font** to signal a physically locked table layout[cite: 2].

---

### Tab 4: Vendor & Procurement Control (`Vendor_Control`)
#### 1. Purpose
Tracks supplier parameters, line-item down payments, and contract milestones to manage immediate operational cash flow[cite: 2, 4].

#### 2. Layout, Structure & Column Mapping (Rows 5 to 54 - Supports 50 Service Contracts)
* **Column A (Operational Category Tag):** String. **UNLOCKED**. Dropdown List: `Venue`, `Catering`, `Production`, `Band/DJ`, `Florist`, `Photography`, `Planner`[cite: 2].
* **Column B (Vendor Entity Legal Name):** String. **UNLOCKED**. Validation: Text length 1 to 100 characters[cite: 2].
* **Column C (Total Contracted Cost Fee):** Currency. **UNLOCKED**. Validation: Decimal value $\ge 0$[cite: 2].
* **Column D (Total Retainer Amount Paid):** Currency. **UNLOCKED**. Validation: Decimal value $\ge 0$[cite: 2].
* **Column E (Outstanding Net Balance Due):** Currency. **LOCKED**. Base Formula (`E5`): `=C5-D5`[cite: 2].
* **Column F (Administrative Status):** String. **UNLOCKED**. Dropdown List: `Paid In Full`, `Deposit Paid`, `Balance Pending`, `No Payment Made`[cite: 2].

#### 3. Conditional Formatting Rules
* **Column E (Outstanding Net Balance Due):** Condition `AND($E5>0, $F5="Balance Pending")` $\rightarrow$ Apply **Soft Amber Warning Fill (#FFF2CC) / Brown Text (#7F6000)**[cite: 2].
* **Column F (Administrative Status):** Match `="Paid In Full"` $\rightarrow$ **Emerald Green Text Treatment (#006100) / Transparent Fill**; Match `="No Payment Made"` $\rightarrow$ **Crimson Red Font Face Format (#9C0006) / Muted Red Background Grid**[cite: 2].

---

### Tab 5: Budget & F&B Ledger (`F&B_Ledger`)
#### 1. Purpose
Calculates the variable food and beverage liabilities tied to real-time attendee records while itemizing fixed on-site logistics expenses[cite: 1, 2, 4].

#### 2. Layout, Structure & Cell Mapping
* **Cells A1:D1:** `VARIABLE FOOD & BEVERAGE COMMITTED COSTING LEDGER` (Merged & Centered)[cite: 2]
* **Cell D3:** Confirmed Guests. Integer. **LOCKED**. Formula: `=CC_Live_Confirmed_Guests` *(Named Range Link)*[cite: 2]
* **Cell D4:** Cost Per Head Cover. Currency. **LOCKED**. Formula: `=CC_FB_Cost_Per_Head` *(Named Range Link)*[cite: 2]
* **Cell D5:** Total Variable F&B Financial Liability. Currency. **LOCKED**. Formula: `=D3*D4`[cite: 2]
* **Cells A7:D7:** `FIXED LOGISTICS OVERHEAD OPERATING LINE ITEMS` (Sub-Section Split Header)[cite: 2]
* **Columns A8:A48:** Expense Title. String. **UNLOCKED**. User input line item labels[cite: 2].
* **Columns B8:B48:** Gross Cost Value. Currency. **UNLOCKED**. User input item fees ($\ge 0$)[cite: 2].
* **Columns C8:C48:** Paid Amount. Currency. **UNLOCKED**. User input amounts paid ($\ge 0$)[cite: 2].
* **Columns D8:D48:** Unpaid Balance. Currency. **LOCKED**. Base Formula (`D8`): `=B8-C8`[cite: 2].

#### 3. Summary Performance Totals Blocks *(Approved Revisions)*
* **Cell B50:** Label: `"Total Gross Fixed Expenses Cost"`. String. **LOCKED**[cite: 1].
* **Cell B51:** Label: `"Total Aggregate Fixed Expenses Balance Owed"`. String. **LOCKED**[cite: 2].
* **Cell D50:** Total Gross Fixed Cost Calculation. Currency. **LOCKED**. Formula: `=SUM(B8:B48)`[cite: 1].
* **Cell D51:** Balance Owed Calculation. Currency. **LOCKED**. Formula: `=SUM(D8:D48)`[cite: 2].

#### 4. Conditional Formatting Rules
* **Cell D5 (Computed Variable Total):** Formula condition `=$D$5>('Command_Center'!$C$6*0.5)` $\rightarrow$ Apply **Soft Amber Highlight Text (#8A6D3B)** (Flags if catering single-handedly exhausts over half the total baseline budget allocation)[cite: 2].

---

### Tab 6: Operational AI Brief (`AI_Brief`)
#### 1. Purpose
A locked markdown interface dedicated to rendering the long-form qualitative strategy, sync checklists, and on-site guidance synthesized by the Gemini API upon initial form ingestion[cite: 2, 4].

#### 2. Layout & Absolute Layout Rules
* **Grid Bounds Mapping:** Rows 1 through 65 spanning across Columns A through L are permanently merged into an open text dashboard[cite: 2].
* **Cell Typography Alignment:** Horizontal layout properties locked to `Left`, Vertical distribution anchored to `Top`, and `Wrap Text` enabled (`true`)[cite: 2].
* **Data Ingestion State:** Alphanumeric long text string, injected as a hardcoded static value during SheetJS construction[cite: 2].
* **Sheet Security Lockout:** The entire worksheet is fully isolated (`Protect := true`)[cite: 2]. All editing rights are disabled to prevent on-site data fragmentation from overriding the core AI strategic narrative directive[cite: 2].

---

## Technical Cross-Tab Reference Map

The chart below maps out the mathematical relationships and data dependencies across the workbook layers, ensuring client-side operations update instantaneously across tabs via standard Excel calculation patterns[cite: 2]:


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

F&B_Ledger Tab (Catering & Logistics Calculator)
├── Cell D5 (Variable Total Cost) ───► Added directly into ────────────────► Feeds Command_Center!C7
└── Cell D50 (Total Gross Fixed) ────► Added directly into ────────────────► Feeds Command_Center!C7

```

---

## User Flow
1. **Access:** The event manager accesses the single-page Lovable frontend layout[cite: 1, 4].
2. **Configuration:** The user inputs baseline numbers (Contract Guests, Baseline Budget, Per-Head Cover Rate) and pastes an unformatted raw client registry list[cite: 1, 4].
3. **Extraction:** The client payload executes a serverless inference request through the Gemini API to format and render the non-mathematical, qualitative operational directive brief[cite: 1, 4].
4. **Compilation:** SheetJS receives the JSON payload, structures the flat relational arrays, maps dropdown validation cells, hardcodes the absolute cell formulas, applies uppercase cohort conversions, locks protective blocks, and triggers an automatic local `.xlsx` workbook download[cite: 1, 2, 4].

---

## Demo Strategy
* **The 48-Hour Crisis Scenario:** Avoid abstract theoretical feature walkthroughs[cite: 4]. The live demonstration begins directly with a pre-populated, 200-guest wedding workbook compiled 48 hours before execution[cite: 1, 4].
* **The Practical Friction Input:** Manually shift 8 guests in `Guest_Database` from `"No Response"` to `"Attending"`, wrap their fields into an already filled VIP table configuration, and apply a `"Severe Nut Allergen"` dietary marker to one entry[cite: 1, 2].
* **The Immediate Payoff:** Demonstrate to the audience that without refreshing any database or saving files, the `Seating_Engine` table line instantly highlights dark red (`OVER CAPACITY`)[cite: 1, 2], the `F&B_Ledger` variable calculation line automatically recalculates the dynamic financial catering exposure[cite: 1, 2], the master dashboard flags budget variance notifications[cite: 1, 2], and the allergen cell flashes an intense red safety alert[cite: 1, 2].

---

## Risks & Mitigation
* **Formula Overwrite Risks:** Field teams often accidentally overwrite formulas when copying and pasting information in the spreadsheet[cite: 1, 4]. 
  * *Mitigation:* Apply strict SheetJS cell protection configuration metrics (`Locked = true`) to every calculation tile while leaving only database name inputs and status selectors open[cite: 2].
* **The Spreadsheet Clipboard Vulnerability:** Copy-pasting cells natively wipes out an Excel sheet's underlying Data Validation rules, allowing arbitrary string data to corrupt down-stream parsing[cite: 1].
  * *Mitigation:* Ingest strings cleanly on the web application frontend using Lovable before compilation, and explicitly structure column headers with localized user instruction strings warning planners to "Paste Values Only"[cite: 1].

---

## Recommended Next Steps for Development
1. **Configure SheetJS Workbook Compiler Engine:** Code the explicit coordinates, uppercase string constraints, and cell properties outlined in Section 2, ensuring that `F&B_Ledger!D50` map data points tie back accurately into the master `Command_Center!C7` calculation[cite: 1, 2].
2. **Build out Lovable Frontend Forms:** Launch the input wizard cards to accept the initial flat guest texts, budget targets, layout bounds, and per-head rates[cite: 4].
3. **Freeze the Gemini API Prompt Stack:** Lock down the generation prompt layout to return the properly formatted markdown strings for Tab 6 execution containment[cite: 4].

```