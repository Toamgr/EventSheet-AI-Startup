## Executive Summary

This document establishes the strategic specification for the **Input Intelligence Layer** of EventSheet AI. In the Israeli event ecosystem, professional event managers like Omer Sdot operate in a high-stress, chaotic environment where the primary data pipeline is inherently fragmented, noisy, and unstructured. Zeros and ones do not plan weddings; WhatsApp messages, panicky voice notes, erratic screenshots, and broken Excel tables do.

The web application (built in Lovable) serves exclusively as a **one-way data-provisioning pipeline**. It ingests raw, messy real-world communication and leverages Gemini's linguistic parsing capabilities to synthesize it into a structurally protected, highly optimized Excel workbook. Once compiled by SheetJS, **Excel becomes the native, offline operating system and permanent source of truth**. This framework completely bypasses the engineering complexity of two-way cloud syncing and database infrastructure, achieving high operational utility within a strict 1-developer-day constraint.

---

## Critical Findings

### 1. The Israeli Input Ecosystem

Data collection for Israeli weddings does not occur via structured SaaS forms. It is driven by cultural friction points:

* **The Unstructured WhatsApp Dump:** Couples forward unformatted text lists, family groupings, and last-minute cancellation notifications directly to the manager.


* **The Fragmented Spreadsheet Trap:** Couples often manage multiple conflicting versions of guest lists containing mismatched formatting, missing indicators, and inconsistent labeling.


* **The Voice Note Breakdown:** Urgent updates ("*Omer, add 5 seats for my uncle's friends, make sure 2 are vegan, put them near the stage but away from the speakers*") are sent as audio files during high-stress operational windows.


* **The Mobile Screenshot:** Couples send cropped images of bank transfers, vendor agreements, and tables from external RSVP apps.



### 2. Core Data Quality Failures & Risks

Messy inputs introduce critical vulnerabilities that can degrade the integrity of the downstream spreadsheet logic if uncorrected:

* **String Match Failures:** Inconsistent input language (e.g., lowercase vs. uppercase, trailing spaces, typing `מאשר הגעה ` instead of the strict validation string `מאשר הגעה`) breaks standard Excel indexing formulas like `COUNTIF` and `XLOOKUP`.


* **Clipboard Corruption:** Manual copying and pasting from WhatsApp directly into Excel overrides native cell Data Validation rules, corrupting formula execution paths.


* **Hidden Operational Liabilities:** Dietaries (e.g., severe nut allergies) buried deep within unstructured strings get overlooked, creating severe legal and physical risks on the event floor.



---

## What Matters Most

* **Deterministic Translation:** Transforming unstructured Hebrew strings into explicit, predefined database options (`משפחת הכלה`, `חברים משותפים`) to ensure downstream formulas execute correctly.


* **Immediate Field Utility:** Maximizing user value during the critical 72-hour window before execution, when headcount variations directly impact financial liabilities and seating boundaries.


* **Frontend Pre-processing & Sanitization:** Using Gemini on the client side to clean, format, and structure text strings *before* SheetJS compiles the final arrays, preventing raw user errors from compromising spreadsheet integrity.



---

## What Should Be Removed

* **Generative Seating Math:** Completely discard automated AI layout algorithms or dynamic social mapping features. Seating is a constraint-validation problem solved through structured Excel formulas.


* **Upstream Re-import Engines:** Eliminate all multi-user database syncing, cloud persistence layers, and cloud infrastructure.


* **Multi-language Complexity:** Strip out English-centric terms (`RSVP`, `BEO`, `Cohorts`). The product must be **Hebrew-First and RTL Native** to match local operational standards.



---

## MVP Recommendation

Implement a client-side parsing pipeline inside the Lovable frontend wrapper. When raw data (text, transcribed voice notes, tables) is supplied, Gemini executes a single asynchronous inference call to structure the data into a strict JSON payload mapping directly to the spreadsheet's schema. SheetJS processes this structured payload, binds the native Excel validation parameters, locks the core formula cells, and triggers an instant `.xlsx` workbook download.

---

## Workbook Architecture (Hebrew Native RTL)

The output is a 6-tab, structurally protected Excel workbook built to act as the offline Event Operating System:

```
[ קובץ אקסל: EventSheet AI Source of Truth ]
│
├── לשונית 1: לוח_בקרה          ◄── (KPI Dashboard, Contracted Baseline vs. Live Variance) [Locked]
├── לשונית 2: בסיס_נתונים_אורחים  ◄── (Flat Data Schema, RSVP Dropdowns, Cohort Tags) [Inputs Open]
├── לשונית 3: מנוע_הושבה         ◄── (Capacity Rules, Sector Metrics, Overflow Alerts) [Formulas Locked]
├── לשונית 4: בקרת_ספקים         ◄── (Contracts, Retainers, Outstanding Balances Due) [Inputs Open]
├── לשונית 5: תקציב_וקייטרינג     ◄── (Dynamic Costing Per Head + Fixed Logistics Costs) [Formulas Locked]
└── לשונית 6: תדריך_תפעולי_AI    ◄── (Static Operational Strategy Narrative Block) [Locked]

```

---

## User Flow

```
[ Raw Messy Input ] ──► [ Gemini AI Ingestion Layer ] ──► [ Standardized JSON Payload ]
                                                                   │
[ Download Workbook ] ◄── [ SheetJS Compilation ] ◄── [ Map Formulas & Validation Rules ]

```

1. **Ingestion:** The event manager opens the web interface and inputs an unformatted block of text, notes, or files.


2. **Structuring:** Gemini processes the input text, map relationships, normalizes values, and isolates dietary markers into clean structured arrays.


3. **Compilation:** SheetJS converts the sanitized JSON data into the 6 designated Hebrew tabs, embeds standard cross-tab formulas, applies conditional formatting alerts, and locks the tracking fields.


4. **Handoff:** The browser automatically downloads the finalized, production-ready spreadsheet to the manager's local machine.



---

## Input Intelligence Layer: Operational Data Transformation

The primary engine maps unstructured input data into a clean, normalized relational matrix using standard system tokens:

### 1. Ingestion Translation Matrix

| Messy Real-World Input Example | Gemini Parsing Strategy & Extraction Rule | Target Sheet & Column Destination | Standardized Token Output

 |
| --- | --- | --- | --- |
| "*יוסי כהן ואשתו מגיעים, דניאל הבן אולי*" | Split into distinct records. Identify implicit counts. Assign unique IDs.

 | `בסיס_נתונים_אורחים` <br>

<br>עמודה א': מזהה אורח <br>

<br>עמודה ב': שם מלא

 | Record 1: `G-0001`, יוסי כהן<br>

<br>Record 2: `G-0002`, אשת יוסי כהן<br>

<br>Record 3: `G-0003`, דניאל כהן |
| "*יוסי כהן ואשתו אישרו סופית, הילד לא בא*" | Parse logical status variables and enforce strict dropdown values.

 | `בסיס_נתונים_אורחים`<br>

<br>עמודה ג': סטטוס הגעה

 | Record 1: `מאשר הגעה`<br>

<br>Record 2: `מאשר הגעה`<br>

<br>Record 3: `לא מגיע`<br> |
| "*חברים של החתן מהצבא, לשים בשולחנות של הצעירים*" | Normalize categorization tags into rigid system segments.

 | `בסיס_נתונים_אורחים`<br>

<br>עמודה ד': שיוך קבוצתי

 | `חברים משותפים` <br>

<br>*(Forced to Upper/Standardized Case)*<br> |
| "*סגרנו עם הדיג'יי שחר ב-12,000 ש"ח, שילמנו לו 3,000 מקדמה במזומן*" | Extract financial values, isolate tax parameters, and map payment balances.

 | `בקרת_ספקים`<br>

<br>עמודה ג': סך חוזה<br>

<br>עמודה ד': מקדמה שולמה

 | קטגוריית ספק: `דיג'יי/להקות`<br>

<br>סך חוזה: `12000`<br>

<br>מקדמה שולמה: `3000`<br> |
| "*דודה ציפי רגישה בטירוף לאגוזים, דני צמחוני*" | Identify critical health liabilities and parse standard dietary profiles.

 | `בסיס_נתונים_אורחים`<br>

<br>עמודה ה': סימון תזונתי

 | ציפי כהן: `אלרגיה חמורה לאגוזים`<br>

<br>דני כהן: `צמחוני`<br> |

### 2. Operational Logic Mapping & Data Transformations

To prevent text fragmentation from breaking down-stream spreadsheet queries, Gemini executes the following strict data transformation overrides:

* **RSVP Status Standardization:** Maps variations like "*סגור*", "*מגיעים*", "*רשום ככן*" to the strict validation string: `מאשר הגעה`. Missing statuses default to `טרם השיב`.


* **Cohort Consolidation:** Groups random user strings like "*חברים מהעבודה*", "*חבר'ה מהטכניון*", "*צוות 8200*" into the unified system cohort token: `חברים משותפים`.


* **Dietary Risk Flags:** Extracts buried qualitative phrases (e.g., "*צליאק*", "*בלי גלוטן בכלל*") and converts them into explicit system validation strings: `ללא גלוטן` or `אלרגיה חמורה לאגוזים`.



---

## Demo Strategy

1. **The Friction Source:** Paste an unformatted, chaotic Hebrew WhatsApp message into the input field:
> "*אורן, תשמע, דודה חנה מרחובות מגיעה עם עוד 3 אנשים מהמשפחה של הכלה, שאחד מהם טבעוני. דניאל אלבז ואשתו ביטלו. תרשום גם שסגרנו עם הצלם ב-15,000 שח, נתנו לו 2,000 מקדמה*"
> 
> 


2. **The Live Transformation:** Click **"ייצא מקור אמת תפעולי סופי (Excel)"**. Show the file compile and download instantaneously.


3. **The Spreadsheet Validation:** Open the workbook locally. Show that:


* `בסיס_נתונים_אורחים` successfully generated 4 new rows for family members, marked them as `מאשר הגעה`, set the category to `משפחת הכלה`, and flagged one guest as `טבעוני`.


* דניאל אלבז and his spouse are instantly switched to `לא מגיע`.


* `לוח_בקרה` adjusted the real-time KPIs, and `תקציב_וקייטרינג` automatically updated food liabilities and outstanding balances based on the new photographer contract variables.





---

## Risks & Missing Information

### Critical Operational Risks

* **The Clipboard Overwrite Trap:** Event managers copy-pasting names directly inside Excel can wipe out cell-level Data Validation dropdown constraints.


* *Mitigation:* Pre-program a prominent text alert in the header row of column validation points explicitly instructing users: **"יש להשתמש בהדבקת ערכים בלבד (Paste Values Only)"**.




* **Linguistic Context Blindspots:** Ambiguous text updates (e.g., "*תוסיף את משה וחברה שלו*") can prevent accurate unique ID allocation and lead to guest count variance errors.



### Missing Information

* **Mobile Spreadsheet Rendering Constraints:** Confirm if standard web-compiled SheetJS styles and conditional formatting flags function reliably across iOS and Android Excel Mobile apps without rendering lag.



---

## Recommended Next Steps

1. **Define the System Prompt Constraints:** Build the rigid JSON translation schema specifying acceptable categorical tokens (`משפחת הכלה`, `מאשר הגעה`) for the client-side Gemini payload.


2. **Formulate Cross-Tab Coordinates:** Document the exact cell grid intersections ensuring `לוח_בקרה` aggregates math directly from column metrics within `בסיס_נתונים_אורחים` and `תקציב_וקייטרינג` using uppercase values.


3. **Test SheetJS Compilation Limits:** Run local tests generating protected worksheets using a null-string password configuration to verify user input paths remain editable while preserving target calculation cells.