```markdown
# FINAL_MVP_BASELINE.md

## Executive Summary
EventSheet AI is an AI-powered Wedding Operations Workbook Generator. Its primary customer is the professional event manager (e.g., Omer Sdot) who coordinates the high-stakes, highly volatile execution window immediately preceding a wedding. This document sets the official final baseline for the product's MVP, resolving historical contradictions between earlier architectural plans, audits, and scope revisions. 

By adopting an **Excel-as-the-Product** philosophy, EventSheet AI focuses entirely on the developer-constrained (1-day, 1-developer) reality of a university project. It achieves maximum competitive utility not through a heavy web SaaS platform, but by transforming unstructured input into a structurally locked, formulas-optimized operational blueprint.

---

## Critical Findings
1. **The Real-Time Paradox Resolved:** Event managers inevitably modify data directly within Excel during chaotic on-site operations. Any upstream web-syncing database architecture is rejected as unrealistic for a 1-day build and operationally fragile. The web app will act purely as a **one-way data-provisioning pipeline**; once generated, Excel becomes the permanent, offline source of truth.
2. **Evolution of Seating Logic:** The product's core intelligence evolved from an over-engineered algorithmic approach (e.g., automated social network engineering, Leiden community detection, and line-of-sight mathematical models) to a deterministic, **formula-driven architecture**. High-end planners do not need automated AI seating arrangements; they need explicit, formula-enforced constraints that validate their manual decisions in real time.
3. **Integration of Core Cohort and Impact Tracking:** While early scope audits excessively cut down tabs to accelerate development time (leaving gaps in core event logic), the final baseline recognizes that **Category Intelligence, Venue Constraints, and Variance Tracking** are non-negotiable. Instead of being separated into complex, isolated tabs, these features are elegantly collapsed directly into the main tabs via native Excel formulas (`COUNTIF`, `SUMIF`, and simple cell subtractions).

---

## What Matters Most
* **Operational Control at the Handoff Point:** Serving the event manager during the absolute worst-case scenario: the final 72 hours before the event, when guest counts fluctuate, seating maps shift, and final billing totals must be guaranteed.
* **Structural Data Integrity:** Locking cell architectures, drop-down menus, and cross-tab references so that an event manager can manipulate data inside Excel without breaking the workbook's formula structure.
* **The "Wow" Metric vs. Formula Pragmatism:** Anything that can be calculated mathematically must be handled via hardcoded native Excel formulas. The AI layer is reserved purely for synthesizing qualitative operational strategy.

---

## What Should Be Removed
* **Multi-user Cloud Infrastructure:** No user authentication, database persistence (Supabase/PostgreSQL), local storage, or active client-manager sync rooms.
* **AI Seating Math:** No generative AI seating algorithms, psychological profiling, or relationship-proximity automation.
* **Tab Proliferation:** Discard separate dedicated tabs for RSVPs, categories, venue details, and risk indexes.

---

## MVP Recommendation
Build a lightweight, single-page web wizard in **Lovable** that accepts raw client lists and event parameters, packages them through a single serverless **Base44 / Gemini API** request to extract qualitative directives, and compiles them via **SheetJS (Codex)** into a robust, 6-tab Excel workbook.

---

## Workbook Architecture
The final generated workbook contains exactly **6 interconnected sheets**, enforcing strict named ranges and validation matrices:


```

[ EventSheet AI Generated Workbook ]
│
├── Tab 1: Event Command Center (KPI Dashboard & Baseline vs. Live Variance)
├── Tab 2: Master Guest Database (Flat List with Status and Cohort Dropdowns)
├── Tab 3: Table Assignment & Seating Engine (Capacity Monitoring & Validation)
├── Tab 4: Vendor & Procurement Control (Line-Item Expenses & Payment Schedule)
├── Tab 5: Budget & F&B Ledger (Contract vs. Live Spending Analysis)
└── Tab 6: Operational AI Brief (Qualitative Executive Narrative Brief)

```

1. **Tab 1: Event Command Center** * **Purpose:** High-visibility executive overview. 
   * **Logic:** Aggregates totals via `COUNTA` and `SUM`. Includes the **"Snapshot vs. Live" Variance Tracker**. Initial contract values are hardcoded as static reference parameters upon export; current metrics are live formulas tracking variations in guest counts and costs.
2. **Tab 2: Master Guest Database** * **Purpose:** Single source of truth for all guest properties. 
   * **Logic:** Flat table structures with columns for `Guest Name`, `RSVP Status` (Dropdown), `Category Cohort` (Dropdown), and `Dietary Requirements`.
3. **Tab 3: Table Assignment & Seating Engine** * **Purpose:** Live seating constraint tracking. 
   * **Logic:** Links individual guests from Tab 2 to specific table rows. Incorporates **Venue Constraints** directly by mapping physical maximum capacities alongside each table number. Natively handles **Category Intelligence** via a matrix that counts how many members of a specific category are seated vs. unseated. Uses `COUNTIF` to instantly flash red via conditional formatting if assigned guest counts exceed maximum table capacities.
4. **Tab 4: Vendor & Procurement Control** * **Purpose:** Flat checklist of service provider parameters.
   * **Logic:** Tracks `Vendor Name`, `Category`, `Contracted Fee`, `Amount Paid`, and `Balance Owed` to structure basic cash flow mechanics.
5. **Tab 5: Budget & F&B Ledger** * **Purpose:** Real-time procurement and meal expense monitoring.
   * **Logic:** Standard financial ledger using cell operators and standard subtractions (`A1-B1`). Calculates catering costs dynamically using a formula linked to live confirmed guest counts (e.g., `=Confirmed_Guests * Cost_Per_Head`).
6. **Tab 6: Operational AI Brief** * **Purpose:** The qualitative anchor for multi-department sync.
   * **Logic:** A beautifully formatted, static text layout containing the pre-compiled operational narrative summary produced during the initial web-form submission.

---

## User Flow
1. **Access:** The Event Manager opens the clean Lovable single-page app layout.
2. **Ingestion:** The manager pastes an unformatted guest list into a text area and enters core parameters (venue capacity rules, category designations, per-head food costs, and vendor milestones).
3. **Compilation:** The manager clicks **"Generate Operational Source of Truth."** The application targets the Gemini API to run text processing for Tab 6, then structures all data using client-side libraries.
4. **Delivery:** The structured, formatted `.xlsx` workbook automatically downloads to the manager's device within seconds.

---

## Demo Strategy
* **The Live Last-Minute Friction Scenario:** Avoid abstract theoretical concepts or complex initial setup flows. 
* **The Practical Test:** Begin with a generated workbook for a 200-guest wedding 48 hours before execution. In real time, demonstrate changing 10 guests from "Undecided" to "Yes," assigning them to an already full VIP table, and changing another guest to a severe allergen profile.
* **The Payoff:** Show how the **Command Center** instantly highlights financial variances, the **Seating Engine** flashes red to warn of a table capacity overload, and how the **Ledger** automatically updates food procurement budgets without breaking structural equations.

---

## Risks
* **Formula Corruption:** Users can accidentally overwrite formulas when modifying files locally. 
  * *Mitigation:* Apply strict native Excel sheet protection properties to formula-heavy cells, ensuring only input data cells remain editable.
* **The Re-Import Trap:** Users may expect to upload their edited spreadsheet back into the web engine. 
  * *Mitigation:* Clearly and explicitly label the primary web interface export action as: **"Export Final Operational Source of Truth"** to establish that Excel is the permanent operational database moving forward.

---

## Missing Information
* **Specific SheetJS Native Constraints:** Confirm if specific legacy versions of mobile Excel used by field teams natively support custom conditional formatting formulas without explicit script initialization.

---

## Recommended Next Steps
1. **Map out the SheetJS Matrix:** Document the precise cell coordinates for the Command Center tab to ensure the `COUNTIF` and `SUMIF` formulas accurately reference the Master Guest Database columns.
2. **Build the Lovable Entry UI:** Construct the multi-step input wizard fields to capture the venue layout parameters and table rules before data generation.
3. **Assemble the Gemini Prompt Payload:** Confirm the structured JSON payload sent to the API to produce the qualitative text for the Operational AI Brief.

---

## 1. Final MVP Scope
EventSheet AI is a specialized, **one-way data provisioning pipeline**. The web platform features a single-page wizard UI to ingest unformatted raw lists, define baseline event variables, and construct hardcoded native formula strings inside an downloadable, enterprise-grade Excel operating workbook. The frontend architecture requires no database setups, multi-role access controls, or cloud-hosted infrastructure.

## 2. Final Workbook Structure
The output document contains exactly 6 tabs:
1. `Tab 1: Event Command Center` (Aggregated KPIs, Conditional Alert Indicators, Baseline Contract vs. Live Delta Trackers).
2. `Tab 2: Master Guest Database` (Sanitized flat schema tracking RSVP statuses, dietary markers, and category tags).
3. `Tab 3: Seating Engine` (Table lists showing assignments, live attendee counts, strict venue capacities, and category distributions).
4. `Tab 4: Vendor & Procurement Control` (Service checklist tracing baseline fees, balances, and payment statuses).
5. `Tab 5: Budget & F&B Ledger` (Financial calculation interface capturing dynamic per-head costs and total budget margins).
6. `Tab 6: Operational AI Brief` (Static text container housing the AI-generated operational strategy narrative).

## 3. Final Web Application Structure
* **Single-Page Form Wizard:** Built using modern UI blocks in Lovable.
* **Step 1:** Raw text area input box allowing users to paste unstructured text or guest names.
* **Step 2:** Form parameters defining table sizes, layout rules, and venue physical capacity caps.
* **Step 3:** Financial input cards capture per-head contract costs and basic vendor milestones.
* **Action Trigger:** A distinct button labeled **"Export Final Operational Source of Truth"** that initiates file creation and download.

## 4. Final AI Scope
The application limits the AI engine to a **single asynchronous inference call** using the Gemini API during data submission. The prompt instructs the model to process raw guest list metrics and event constraints to write a qualitative, operational execution text brief for Tab 6. The AI is barred from managing mathematical functions or data sorting.

## 5. Final Demo Scope
A live simulation focusing on **Last-Minute Response Management**. It demonstrates a generated workbook absorbing unexpected modifications 48 hours prior to an event. The showcase proves how changing an attendee's status instantly updates the financial overview, triggers conditional alarms when venue capacities are broken, and displays cost variations using native calculations.

## 6. Features Deferred To Future Versions
* **Two-way Syncing Mechanisms:** Re-importing local workbook edits back into the cloud application state engine.
* **Custom BEO Document Exporters:** Built-in tools for formatting print-ready PDF catering sheets and kitchen reports directly from Excel data.
* **Persistent Planning Dashboards:** Multi-event control centers for managers running concurrent schedules across various dates.

## 7. Features Explicitly Rejected
* **Multi-user Cloud Portals:** Sync pipelines, real-time comment threads, or shared editing spaces between event planners and wedding couples.
* **AI-Generated Seating Maps:** Automated algorithmic table placement or relationship-driven automated seating tools.
* **Integrated Financial Transactions:** Payment gateway connectors or accounting API synchronization layers.

```