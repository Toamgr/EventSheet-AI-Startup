## Executive Summary

EventSheet AI is suffering from classic "Day 1 Feature Bloat." The initial master plan attempts to build an entire enterprise SaaS platform (11 spreadsheet tabs, advanced predictive AI engines, change impact tracking, multi-role user flows) packaged as a 24-hour university project. **It will fail to launch.**

To deliver 80% of the value with 20% of the complexity, we must strip away the speculative analytics and focus entirely on the Event Manager’s absolute worst nightmare: **The chaotic 72 hours before a wedding where guest counts shift, seating maps break, and budgets shatter.** By narrowing the scope to a clean data-ingestion web form that outputs a bulletproof, formulas-optimized Excel workbook, a single developer can realistically build and deploy this MVP in one day using Lovable, Base44, and Gemini.

---

## The Brutal Audit: Feature Rationalization

Every tab and feature must earn its right to exist based on operational utility for the Event Manager (Omer Sdot). If it can be calculated using a native Excel formula, AI should not touch it.

### Feature & Tab Disposition

| Feature / Tab | Status | Strategic Justification |
| --- | --- | --- |
| **Tab 1: Event Command Center** | **KEEP** | Essential. High operational visibility. Aggregates KPIs via simple Excel formulas (`COUNTA`, `SUM`). |
| **Tab 2: Master Guest Database** | **KEEP** | Essential. The core data repository. Flattened to include RSVP and Category directly to eliminate data fragmentation. |
| **Tab 3: RSVP Control Center** | **REMOVE** | **Feature Bloat.** RSVPs can be tracked via a simple dropdown in the Master Guest Database and a `COUNTIF` formula on the Command Center. A separate tab adds no operational value. |
| **Tab 4: Category Intelligence** | **REMOVE** | **Over-engineering.** Cross-filtering by family/friends can be achieved via native Excel Pivot Tables or simple summaries on the Command Center. |
| **Tab 5: Seating Engine** | **KEEP** | **Core Value Proposition.** Tracks table assignments against maximum venue capacities. |
| **Tab 6: Venue Data** | **REMOVE** | **Unnecessary Complexity.** Embed table capacity limits directly as data validation rules inside the Seating Engine tab. No need for a separate structural registry. |
| **Tab 7: Supplier Control Center** | **KEEP (Min)** | Keep as a flat checklist (Name, Service, Cost, Paid Status). Crucial for basic budget calculations. |
| **Tab 8: Budget Engine** | **KEEP** | Essential. Calculates Total Cost, Cost Per Guest, and Variance using standard Excel formulas. |
| **Tab 9: Change Impact Engine** | **REMOVE** | **Science Fiction.** Predictive impact modeling is completely unrealistic for a 1-day MVP. Standard Excel formula variances handle this natively. |
| **Tab 10: Event Risk Engine** | **REMOVE** | **Redundant.** Instead of a dedicated tab, highlight risks directly on the Command Center using simple Conditional Formatting (e.g., if Table Guest Count > Capacity, turn red). |
| **Tab 11: Final Event Brief** | **KEEP (AI)** | **The "Wow" Factor.** A single text block containing an AI-generated, operational narrative summary of the wedding. |

---

## 1. The Exact MVP Scope

The MVP is strictly a **one-way data provisioning pipeline**.

The web application acts exclusively as a structured, rapid data-entry interface. Once the user submits the form, the backend processes the data, prompts the Gemini API once to write the Executive Brief, compiles the data into an `.xlsx` file using basic JavaScript libraries, and triggers an immediate download.

There is **no database authentication, no saved states, and no multi-user syncing** built into the web app. Excel is the database.

---

## 2. The Exact Workbook Structure (5 Tabs)

To ensure professional execution, the generated workbook will drop all complex multi-tab relational lookups and rely on flat tables supercharged with native Excel formulas.

### Tab 1: Command Center (The Dashboard)

* **KPI Blocks (Top Row):**
* Total Invited Guests: `=COUNTA('Master Guest List'!A:A) - 1`
* Total Confirmed (RSVP = Yes): `=COUNTIF('Master Guest List'!D:D, "Yes")`
* Total Seated Guests: `=COUNTIF('Master Guest List'!E:E, "<>")`
* Target Budget vs. Actual Spend Variance: `='Budget Engine'!B2 - 'Budget Engine'!B3`


* **Alerts Section:** Conditional formatting alerts highlighting structural issues:
* *ALERT: Unseated Guests Present* (Triggers if Confirmed $\neq$ Seated)
* *ALERT: Budget Overrun* (Triggers if Variance $< 0$)



### Tab 2: Master Guest List

A clean, flat matrix for rapid sorting and filtering.

* **Columns:** `Guest ID` | `Guest Name` | `Category (Family, Friends, Work, Army)` | `RSVP Status (Yes, No, Pending)` | `Assigned Table #` | `Dietary Requirements` | `Notes`

### Tab 3: Seating Engine

* **Columns:** `Table #` | `Max Capacity (Hardcoded, default 10)` | `Current Seated Count` | `Capacity Status`
* **Formulas:** * Current Seated Count: `=COUNTIF('Master Guest List'!E:E, A2)`
* Capacity Status: `=IF(C2>B2, "OVER CAPACITY", IF(C2=B2, "Full", "Available"))`


* **Conditional Formatting:** Highlight row in soft red if Status equals `"OVER CAPACITY"`.

### Tab 4: Budget Engine

* **Columns:** `Expense Category` | `Supplier Name` | `Contracted Amount` | `Amount Paid` | `Balance Owed`
* **Formulas:** * Balance Owed: `=C2 - D2`
* Summary Row (Bottom): Bottom-line totals calculating `Total Cost` and `Cost Per Confirmed Guest`.



### Tab 5: AI Event Brief

* **Structure:** A merged, text-wrapped markdown block (`A1:H30`) populated during generation with a highly contextualized, professional operational summary written by Gemini.

---

## 3. The Exact Web Application Structure

Built within **Lovable**, the UI consists of a singular, highly scannable **Single-Page Setup Wizard** divided into four logical sections.

```
[ Step 1: Event Essentials ] -> Name, Date, Target Budget, Table Caps
            ↓
[ Step 2: CSV / Paste Guest List ] -> Name, Category, RSVP, Table #
            ↓
[ Step 3: Supplier Quick-Entry ] -> Name, Service Type, Total Cost
            ↓
[ Button: Generate Intelligent Workbook ] -> Triggers API & Downloads File

```

* **No user login:** Users complete the form in one continuous session.
* **Paste-from-Excel Component:** A simple text-area field where the Event Manager can copy columns from a raw scratchpad and paste them directly into the web app, skipping tedious manual line-by-line typing.

---

## 4. The Exact AI Capabilities (The Gemini Prompt)

Instead of running continuous, complex background calculations, the AI is invoked **exactly once** at the moment the user clicks "Generate Intelligent Workbook."

The web app takes the JSON payload of the form and sends it to the Gemini API using the following system prompt:

```text
You are an expert Wedding Director. Review the following raw event data payload:
[INSERT JSON PAYLOAD: Event details, Guest counts, Table assignments, Budgets, Suppliers]

Generate a professional, highly concise, 3-paragraph Operational Executive Brief to be placed inside the event workbook. 

Format your response exactly as follows, optimizing for operational clarity:
1. CRITICAL FOCUS: Identify the single biggest logistical bottleneck (e.g., "Table 4 is currently over capacity by 2 guests," or "60% of the Groom's family remain unassigned to tables").
2. FINANCIAL HEALTH: Call out high-risk budget anomalies (e.g., "Catering costs represent 72% of total budget, leaving an unstable cushion for pending vendor balances").
3. PROTOCOL RECOMMENDATION: Provide 3 bulleted, high-priority next steps for the Event Manager this week.

```

The resulting text string is mapped directly into the cells of **Tab 5 (AI Event Brief)** during file compilation.

---

## 5. The Exact Demo Flow

To achieve maximum impact during the course presentation, the project must be demonstrated through a highly relatable, friction-free scenario:

1. **The Hook (0:00 - 0:30):** Show a messy text file or WhatsApp message sent by a panicked couple containing 150 unsorted guest names, mixed RSVPs, and unstructured vendor pricing notes.
2. **The Ingestion (0:30 - 1:00):** Copy the raw text block, paste it straight into the Lovable web app, and hit "Generate Intelligent Workbook."
3. **The Reveal (1:00 - 2:00):** Open the newly downloaded Excel file. Show the clean layout, point out how native Excel formulas instantly caught a table capacity overload on Tab 3, and read the Gemini AI Brief on Tab 5 showcasing immediate, professional-grade diagnostic clarity.

---

## 6. What Should Absolutely NOT Be Built

To prevent scope creep and guarantee delivery by a single developer within 24 hours, the following features are strictly **banned** from development:

* ❌ **No Multi-user Collaboration:** No chat rooms, comments, or shared permissions between Couples and Event Managers.
* ❌ **No AI Seating Math:** Do not write code attempting to make AI auto-arrange seating charts. It is prone to hallucination and highly complex. Let the app track manual table assignments, and use Excel formulas to flag overages.
* ❌ **No Database Architecture:** Do not set up Supabase, PostgreSQL, or local storage. The data exists solely in the frontend state machine until it is baked into the downloaded Excel file.
* ❌ **No Payment Processing Gateways:** Do not integrate Stripe or payment tracking links.

---

## Recommended Next Steps

1. **Open Lovable:** Initialize a single-page layout utilizing a form wizard UI component.
2. **Embed SheetJS (`xlsx` library):** Write the export script that maps form states directly into rows, columns, and hardcoded native Excel formula strings (`=SUM`, `=COUNTIF`).
3. **Connect Gemini API:** Wire up the prompt payload to a serverless Base44 function or direct frontend fetch to populate the Executive Brief tab.