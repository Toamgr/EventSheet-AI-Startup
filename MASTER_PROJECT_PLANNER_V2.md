# MASTER\_PROJECT\_PLANNER\_V2.md

# EventSheet AI — Official Master Project Planner V2

**Document Status:** Official Source of Truth  
**Product Type:** AI-Powered Wedding Operations Workbook Generator  
**Primary Output:** Hebrew-first, RTL-native, formula-driven Excel workbook  
**Primary User:** Professional event manager / wedding operator  
**Development Mode:** Frozen MVP baseline, implementation-ready  
**Core Principle:** Build the product first; academic documentation is completed around the working product.

\---

# 1\. Executive Summary

EventSheet AI is an AI-powered Wedding Operations Workbook Generator built for the reality of Israeli wedding and event operations. It transforms chaotic, fragmented event information into a structured, protected, formula-driven Excel workbook that becomes the operational source of truth for the event.

EventSheet AI is not a full SaaS platform, not a CRM, not an RSVP system, not a seating automation engine, and not a cloud database. It is a focused one-way generation pipeline:

1. The user enters messy event information into a simple web interface.
2. Gemini parses and standardizes the data.
3. SheetJS compiles the structured data into a protected Excel workbook.
4. The user downloads the final workbook.
5. From that point onward, Excel becomes the permanent operational source of truth.

The product exists because real wedding operations do not happen inside clean SaaS forms. They happen through WhatsApp messages, last-minute voice notes, screenshots, broken spreadsheets, supplier updates, and stressful changes during the final 72 hours before the event. Event managers need a tool that accepts that chaos and turns it into a clear operational file.

EventSheet AI serves:

* Professional event managers
* Wedding planners
* Venues and event halls
* Couples who need structured visibility
* Hospitality/event operations teams that rely on Excel as their practical field tool

The MVP focuses on maximum operational utility with minimum engineering complexity. It deliberately rejects feature bloat and uses Excel as the product, not as an export afterthought.

\---

# 2\. Vision

## Long-Term Vision

EventSheet AI should become the fastest way for an event professional to transform fragmented wedding information into a reliable operational workbook. Long term, it can become a standard bridge between messy client communication and professional execution.

The product’s long-term ambition is to become an Israeli-native event operations layer: a practical, field-ready tool that helps event managers make better decisions under pressure without forcing them into a complex SaaS workflow.

## Product Philosophy

EventSheet AI is designed around one core truth:

**Event managers do not need more dashboards. They need one reliable operational source of truth.**

The product should feel like an “Event Director inside Excel,” but its intelligence must remain pragmatic. Anything mathematical should be handled by deterministic formulas. Anything qualitative, narrative, or messy-language-based can be assisted by AI.

The product is built for the real world:

* People send unclear messages.
* Couples change their mind.
* Guest lists arrive late.
* Suppliers provide partial information.
* Managers work from mobile devices.
* Final changes happen under pressure.
* Excel remains the tool operators actually trust in the field.

## Excel-as-the-Product Philosophy

Excel is not a secondary export. Excel is the final product.

The web app is only a compiler. Its purpose is to gather and sanitize input, trigger AI parsing, and generate the workbook. After export, the workbook becomes the permanent operational environment.

This means:

* Excel is the database.
* Excel is the dashboard.
* Excel is the live operating tool.
* Excel is the source of truth.
* Excel handles live changes through formulas.
* Excel must be protected, validated, and mobile-compatible.

The system avoids two-way sync because that would create complexity, fragility, and scope risk. The user should understand that after generation, the workbook is the final operational file.

## Hebrew-First Philosophy

EventSheet AI is a Hebrew-first product.

The user-facing experience must be native to Israeli event managers. The web interface, workbook tabs, dropdown values, validation messages, status labels, AI brief, and demo environment must all be in Hebrew and must support RTL by default.

English may be used internally for code, documentation, architecture, and developer prompts, but the final user-facing product must not feel translated from English. It must use local Israeli terminology such as:

* מאשר הגעה
* לא מגיע
* טרם השיב
* משפחת הכלה
* משפחת החתן
* יתרה להסדרה
* מחיר מנה
* לוח\_בקרה
* מנוע\_הושבה

Terms such as RSVP, BEO, Cohorts, Command Center, Guest Database, and Vendor Control should not appear in the final customer-facing UI unless required internally for development.

\---

# 3\. Problem Statement

## Problems Faced by Couples

Couples manage wedding information across many disconnected sources:

* WhatsApp messages
* Excel files
* screenshots
* supplier PDFs
* family notes
* phone calls
* memory
* RSVP exports from other platforms
* payment confirmations
* seating lists
* dietary notes

This creates stress, lack of clarity, and constant uncertainty. Couples often do not know which list is current, what the real guest count is, who has paid, who has confirmed, and what has changed.

Common couple-side problems:

* lost guest updates
* duplicate lists
* inconsistent RSVPs
* missing dietary requirements
* unclear supplier payment status
* unexpected budget increases
* last-minute emotional pressure from family

## Problems Faced by Event Managers

Event managers operate during the highest-pressure window: the final 72 hours before the event. This is when guest count, seating, catering, supplier payments, and operational instructions must become final.

Their main problems:

* receiving chaotic updates from couples
* manually cleaning guest lists
* fixing broken spreadsheets
* updating seating under pressure
* checking table capacity manually
* calculating guest-count financial impact
* tracking suppliers and balances
* keeping kitchen/service/venue teams aligned
* identifying severe dietary/allergy risks
* preventing formula corruption inside Excel

The event manager does not need AI to “decide” seating. The manager needs a protected workbook that validates their decisions instantly.

## Problems Faced by Venues

Venues need clarity before execution. Their risks include:

* wrong final headcount
* incorrect table counts
* over-capacity tables
* unclear supplier arrival/payment status
* missing dietary/allergy information
* wrong catering quantities
* fragmented communication between couple, planner, and venue
* no single operational document

Venues benefit from an output that resembles a professional operational workbook/function sheet, without requiring them to adopt a new platform.

## Problems Caused by Fragmented Information

Fragmented information causes:

* version confusion
* duplicate manual work
* missed guest updates
* budget errors
* supplier payment confusion
* capacity mistakes
* wrong kitchen quantities
* legal/health risks from missed allergies
* poor event-day visibility
* loss of control during final changes

EventSheet AI exists to compress this fragmentation into one protected workbook.

\---

# 4\. Target Users

## Event Managers

Primary user.

The event manager receives information from the couple and must translate it into an executable plan. They need:

* fast ingestion
* clean guest database
* seating validation
* budget visibility
* supplier control
* operational briefing
* mobile-compatible Excel
* Hebrew-native interface
* minimal setup complexity

Example persona: Omer Sdot, a professional event manager operating under Israeli wedding conditions.

## Wedding Planners

Wedding planners can use EventSheet AI to move from planning conversations to an operational execution workbook. They benefit from:

* faster file creation
* better client handoff
* clear guest/seating/supplier structure
* final operational briefing
* reduced manual formatting

## Venues

Venues can provide EventSheet AI as a value-added operational file generator for couples and event managers. They benefit from:

* better data hygiene
* consistent event workbooks
* fewer last-minute mistakes
* clearer final headcount/capacity visibility
* a Hebrew-native field tool

## Couples

Couples are secondary users. They may not be the primary operators, but they benefit from:

* greater visibility
* less chaos
* clearer budget picture
* better guest tracking
* fewer stressful last-minute errors

The product should not assume couples are Excel experts. The event manager remains the operational owner.

\---

# 5\. Product Rules (Locked)

The following rules are frozen and must guide all development, architecture, documentation, and demo decisions.

## 5.1 Hebrew First Product

The final product must be Hebrew-first. All user-facing software, workbook labels, tab names, generated reports, validation messages, dropdown values, status indicators, and AI brief output must be in Hebrew.

## 5.2 RTL Native

The interface and generated Excel workbook must support right-to-left layout by default. RTL is not a cosmetic enhancement; it is part of product usability.

## 5.3 Excel as the Product

The Excel workbook is the product. The web app exists only to generate the workbook.

## 5.4 Excel Becomes Source of Truth

After export, the Excel file becomes the permanent operational source of truth. Users continue working inside Excel.

## 5.5 No Database

No Supabase, PostgreSQL, persistent cloud database, local storage dependency, or saved app state in the MVP.

## 5.6 No CRM

EventSheet AI is not a sales CRM, lead management system, venue CRM, or client acquisition pipeline.

## 5.7 No RSVP Platform

EventSheet AI does not send invitations, collect RSVPs directly from guests, operate WhatsApp Business campaigns, or replace RSVP platforms. It ingests RSVP-related data that the manager already has.

## 5.8 No AI Auto Seating

The MVP must not build AI-generated seating arrangements, relationship-proximity scoring, psychological seating maps, Leiden/Louvain clustering, line-of-sight algorithms, or automated social engineering.

The manager decides seating. Excel validates capacity and cohort distribution.

## 5.9 One-Way Pipeline

The product is a one-way pipeline:

Raw input → Gemini parsing → structured JSON → SheetJS workbook → Excel source of truth.

There is no re-import of edited Excel files back into the web app.

## 5.10 WhatsApp First Input

The product must be designed around the Israeli reality that event data often arrives through WhatsApp messages. The text ingestion interface must accept chaotic copied WhatsApp text.

## 5.11 Product Must Accept Chaos

The product should assume messy input, not perfect forms. It must accept:

* unstructured Hebrew text
* pasted guest lists
* partial supplier notes
* inconsistent RSVP language
* dietary notes inside long sentences
* last-minute changes
* copied spreadsheet fragments

## 5.12 Native Israeli Terminology

The product must use natural Israeli event language. It should not expose English operational terms to the end user.

## 5.13 Excel Mobile Compatibility

The generated workbook must be tested and optimized for Excel Mobile viewing/editing where possible, especially for event managers operating on phones.

## 5.14 AI Assists, Manager Decides

AI may parse, standardize, summarize, and generate the operational brief. AI must not override professional judgment. The event manager makes final decisions.

## 5.15 Build First, Academic Documentation Later

The working MVP has priority. Academic compliance, citations, ethics documentation, and presentation framing must be prepared around the frozen product—not used to expand product scope.

## 5.16 Deterministic Formula Logic

All mathematical logic must be handled through standard Excel formulas such as:

* SUM
* COUNTA
* COUNTIF
* COUNTIFS
* SUMIF
* simple subtraction
* simple multiplication

Avoid complex dynamic arrays, fragile lookups, nested formulas, or unnecessary advanced modeling.

## 5.17 Protected Workbook by Default

All formula cells are locked by default. Only designated input cells are unlocked.

## 5.18 No Tab Proliferation

The final MVP workbook contains exactly 6 tabs. Features such as RSVP Control, Category Intelligence, Venue Data, Change Impact, and Risk Engine are not separate tabs. Their value is collapsed into the core tabs through formulas and conditional formatting.

## 5.19 No Multi-User Collaboration

No shared editing, comments, permissions, client portals, manager dashboards, or real-time collaboration in the MVP.

## 5.20 No Payment Processing

No Stripe, credit-card gifts, accounting integrations, payment gateways, or direct financial transactions.

## 5.21 No Dynamic String Parsing Inside Excel

All messy parsing must happen before workbook compilation. Excel should receive clean, standardized tokens only.

## 5.22 Clipboard Risk Must Be Addressed

The product must warn users not to destroy validation by pasting raw content into protected Excel dropdown fields. Headers and validation messages should instruct “הדבקת ערכים בלבד / Paste Values Only.”

## 5.23 Single AI Runtime Call

The MVP uses one AI call during generation for parsing/structuring and/or producing the operational AI brief. The workbook itself should not rely on ongoing AI.

## 5.24 No Product Redesign Without Critical Contradiction

Frozen MVP decisions must not be reopened unless they create a critical implementation contradiction.
## 5.25 Dynamic Guest Categories



Guest categories are manager-defined.



The system may suggest categories during AI parsing.



However, the event manager controls the final category structure.



The workbook must support custom categories such as:



\- חברים מהצבא

\- חברים מהתיכון

\- חברים מהעבודה

\- חברים מהלימודים

\- חברים של ההורים

\- משפחת הכלה

\- משפחת החתן



The product must not force a fixed category taxonomy.



The manager may create, rename, merge, split, or remove categories according to the operational needs of the event.

\---

# 6\. Final MVP Scope

## Included in MVP

### Web Application

A single-page Lovable web wizard that allows the user to enter or paste event information.

Required sections:

1. Raw guest/event information input
2. Event baseline parameters
3. Seating/table capacity parameters
4. Financial parameters
5. Supplier/vendor quick entry
6. Export action button

Primary button label:

**ייצא מקור אמת תפעולי סופי (Excel)**

### AI Layer

Gemini is used to:

* parse messy Hebrew input
* standardize guest, RSVP, cohort, dietary, supplier, and financial data
* transform the data into strict JSON
* generate a qualitative operational brief for the final workbook

### Excel Generation Layer

SheetJS compiles:

* workbook structure
* Hebrew tab names
* RTL settings
* formulas
* data validation
* conditional formatting
* sheet protection
* locked/unlocked cell states
* static AI brief

### Final Workbook

The workbook contains exactly 6 tabs:

1. לוח\_בקרה
2. בסיס\_נתונים\_אורחים
3. מנוע\_הושבה
4. בקרת\_ספקים
5. תקציב\_וקייטרינג
6. תדריך\_תפעולי\_AI

## Excluded from MVP

The MVP explicitly excludes:

* database
* login/authentication
* CRM
* RSVP sending/collection
* WhatsApp Business API automation
* email automation
* payment processing
* gift collection
* multi-user collaboration
* cloud sync
* Excel re-import
* AI auto seating
* 3D floorplans
* CAD tools
* predictive guest attendance scoring
* automatic vendor recommendations
* contract parsing
* live event command center
* mobile app
* PDF BEO exporter
* multiple events dashboard
* advanced academic documentation inside the product

\---

# 7\. Workbook Architecture

## Workbook Overview

The workbook is a protected, Hebrew-first, RTL-native Excel operating file. It supports up to:

* 1,000 guests
* 50 tables
* 50 suppliers/contracts
* 41 fixed logistics expense rows

It is designed around simple formulas, locked structures, clear dropdowns, and conditional formatting.

## Tab 1: לוח\_בקרה

### Purpose

The management dashboard. It shows event-level KPIs, guest count variance, budget variance, confirmed/unconfirmed attendance, unseated confirmed guests, and catering rate.

### Core Metrics

* אורחים חתומים בחוזה
* מוזמנים במערכת
* דלתא כמות אורחים
* תקציב יעד מקורי
* עלות הפעלה נוכחית
* חריגה/סטייה תקציבית
* סה"כ מאשרי הגעה
* סה"כ לא מגיעים
* טרם השיבו
* אורחים מאושרים ללא הושבה
* מחיר מנת בסיס

### Formula Logic

The dashboard consumes data from guest, seating, supplier, and budget tabs.

Key formula concepts:

* total guests from guest name count
* confirmed/declined/no response from RSVP dropdowns
* financial variance from baseline budget vs. live cost
* unseated guests from confirmed attendance minus seated count
* live operating cost from supplier contracts + variable catering + fixed costs

### Protection

Mostly locked. Only designated parameter fields such as price per head may be editable.

## Tab 2: בסיס\_נתונים\_אורחים

### Purpose

The clean guest database and single flat guest schema.

### Core Columns

* מזהה אורח
* שם מלא
* סטטוס הגעה
* שיוך קבוצתי / מגזר
* סימון תזונתי
* מספר שולחן

### Supported Rows

Rows 5–1004, supporting 1,000 guests.

### Logic

Guest IDs are generated automatically. RSVP, cohort, dietary, and table assignment fields use dropdowns.

### Protection

Formula columns are locked. Input columns are unlocked.

## Tab 3: מנוע\_הושבה

### Purpose

Validates seating decisions against table capacity and cohort distribution. This tab does not choose seats automatically. It validates the manager’s manual decisions.

### Core Columns

* מזהה שולחן
* שם/כינוי השולחן
* קיבולת פיזית מקסימלית
* אורחים שהושבו בפועל
* מקומות פנויים בשולחן
* סטטוס תפוסה
* ספירת מגזר: כלה
* ספירת מגזר: חתן
* ספירת מגזר: חברים
* ספירת מגזר: עסקים/VIP

### Supported Rows

Rows 5–54, supporting 50 tables.

### Logic

* COUNTIF counts guests assigned to each table.
* COUNTIFS counts cohort distribution by table.
* Capacity status turns red if assigned guests exceed physical capacity.
* Full tables are visually muted/locked through formatting.

### Protection

Table labels and capacity values may be editable. Live counts, status formulas, and cohort formulas are locked.

## Tab 4: בקרת\_ספקים

### Purpose

Tracks supplier categories, contract totals, deposits, balances, and payment status.

### Core Columns

* סיווג מקצועי
* שם ישות משפטית / ספק
* סך חוזה כולל מע"מ
* מקדמה שולמה
* יתרת תשלום לאולם/ספק
* מצב חשבון תפעולי

### Supported Rows

Rows 5–54, supporting 50 suppliers.

### Logic

Outstanding balance = total contract cost minus retainer paid.

Supplier contract totals feed the dashboard’s live operating cost.

### Protection

Input fields are unlocked. Balance formulas are locked.

## Tab 5: תקציב\_וקייטרינג

### Purpose

Calculates dynamic catering liability based on confirmed guest count and cost per head, while tracking fixed logistics overhead.

### Core Blocks

Variable catering block:

* כמות אורחים מאשרים
* מחיר מנה
* סה"כ התחייבות קייטרינג

Fixed logistics block:

* סעיף הוצאה
* עלות ברוטו
* סכום ששולם
* יתרה לתשלום

Summary totals:

* סה"כ עלויות קבועות
* סה"כ יתרת חוב קבועה

### Logic

* confirmed guests are pulled from לוח\_בקרה
* price per head is pulled from לוח\_בקרה
* total variable catering = confirmed guests × price per head
* unpaid balance = gross cost - paid amount
* fixed gross expenses are summed and passed into the dashboard live operating cost

### Protection

Calculation cells are locked. Fixed cost item inputs are unlocked.

## Tab 6: תדריך\_תפעולי\_AI

### Purpose

A locked static operational brief generated by Gemini during workbook creation.

### Content

The brief should include:

* strategic operational protocol
* contingency/risk matrix
* F\&B and service directives
* synchronized event timeline
* urgent focus areas
* professional next steps

### Protection

Entire tab is locked. The AI brief is not edited inside Excel during execution.

## Data Flow Between Tabs

### Guest Database → Dashboard

סטטוס הגעה feeds COUNTIF formulas for:

* מאשרי הגעה
* לא מגיע
* טרם השיב

### Guest Database → Seating Engine

מספר שולחן feeds table occupancy counts.

שיוך קבוצתי feeds cohort distribution by table.

### Dashboard → Budget \& Catering

מאשרי הגעה and מחיר מנה feed the catering liability formulas.

### Supplier Control → Dashboard

Supplier contract totals feed live operating cost.

### Budget \& Catering → Dashboard

Variable catering and fixed logistics totals feed live operating cost.

## Formula Philosophy

Use only robust, simple, readable formulas.

Approved formula families:

* SUM
* COUNTA
* COUNTIF
* COUNTIFS
* SUMIF
* multiplication
* subtraction
* IF only where necessary for status outputs

Avoid:

* dynamic spill arrays
* complex XLOOKUP dependencies
* nested formula chains
* AI-generated formulas after export
* hidden calculations the manager cannot understand

## Validation Philosophy

Validation must protect formulas and standardize user input.

Validation applies to:

* RSVP status
* cohort category
* dietary marker
* table number
* supplier category
* supplier payment status
* positive numeric values
* text length limits
* table capacity limits

## Protection Philosophy

Workbook protection is required to prevent operational damage.

Default state:

* all cells locked

Unlocked only:

* guest names
* RSVP dropdowns
* cohort dropdowns
* dietary dropdowns
* table assignment dropdowns
* table labels
* table capacities
* supplier input fields
* fixed cost input fields
* selected configuration values

Password strategy:

* null/blank string protection through SheetJS, with protection enabled

\---

# 8\. Input Intelligence Layer

## Purpose

The Input Intelligence Layer transforms messy real-world event information into a clean structured payload before workbook generation.

It exists because Israeli wedding data often arrives in broken, informal, high-pressure formats.

## WhatsApp Ingestion

The MVP should accept copied WhatsApp text inside a raw input text area.

Typical examples:

* “יוסי ואשתו מגיעים”
* “דניאל הבן אולי”
* “דודה ציפי רגישה לאגוזים”
* “סגרנו עם הצלם ב-15,000 ושילמנו 2,000 מקדמה”
* “12 חברים של החתן אישרו עכשיו”
* “משפחת הכלה צריכה להיות קרובה לבמה”

The system should parse this into guest records, statuses, dietary markers, cohorts, supplier records, and financial values.

## Voice Note Future Support

Voice note support is future scope, not MVP runtime requirement.

Future flow:

1. user uploads or records voice note
2. transcription converts speech to text
3. the same Gemini parsing pipeline processes the transcript
4. output maps to the same JSON schema

The MVP should be architected so voice transcripts can later enter the same text ingestion path.
## Voice Notes Architectural Principle



Future voice-note support must reuse the exact same Input Intelligence pipeline.



Target future flow:



Voice Note

→ Speech-to-Text

→ Input Intelligence Layer

→ Standardized JSON

→ Workbook Generator



No separate parsing architecture should be created for voice notes.



All future voice-note functionality must remain compatible with the existing workbook generation pipeline.

## Screenshot Ingestion

Screenshot ingestion is future scope unless available trivially through the frontend stack.

Future use cases:

* screenshots of guest lists
* screenshots of bank transfers
* screenshots of supplier messages
* screenshots from other RSVP platforms

The principle remains the same: screenshot → OCR/multimodal extraction → standardized JSON → workbook.

## Gemini Parsing

Gemini is responsible for linguistic interpretation and standardization, not final operational authority.

Gemini should:

* split combined guest references into individual records
* infer RSVP status where clear
* default missing RSVP status to טרם השיב
* identify dietary markers
* identify severe allergy risks
* identify supplier category
* extract contract amounts and deposits
* normalize cohort/category terms
* generate operational brief text

Gemini must not:

* auto-seat guests
* invent missing facts
* override manager decisions
* create categories outside approved dropdowns
* generate formulas
* create unsupported workbook tabs

## Data Standardization

All messy inputs must map to approved system tokens.

### RSVP Standardization

Examples:

* “מגיע”
* “סגור”
* “אישר”
* “כן”
* “רשום ככן”

Map to:

* מאשר הגעה

Examples:

* “לא בא”
* “ביטל”
* “לא מגיעים”

Map to:

* לא מגיע

Unknown or missing:

* טרם השיב

### Cohort Standardization

Messy user phrases map to:

* משפחת הכלה
* משפחת החתן
* חברים משותפים
* אורחי כבוד ועסקים
* ילדים

### Dietary Standardization

Messy user phrases map to:

* ללא
* טבעוני
* צמחוני
* ללא גלוטן
* אלרגיה חמורה לאגוזים

### Supplier Standardization

Supplier categories map to:

* אולם/גן אירועים
* קייטרינג ובר
* הפקה ועיצוב
* דיג'יי/להקות
* צילום
* אטרקציות ופירוטכניקה
* ניהול אירוע/תכנון

### Payment Status Standardization

Payment status maps to:

* שולם במלואו
* שולמה מקדמה
* יתרה להסדרה
* לא בוצע תשלום

## JSON Transformation Pipeline

The frontend should produce or receive a strict JSON payload.

Recommended high-level structure:

```json
{
  "event": {
    "event\_name": "",
    "event\_date": "",
    "baseline\_contract\_guests": 0,
    "baseline\_cost\_budget": 0,
    "fb\_cost\_per\_head": 0
  },
  "guests": \[
    {
      "full\_name": "",
      "rsvp\_status": "טרם השיב",
      "cohort": "חברים משותפים",
      "dietary\_marker": "ללא",
      "assigned\_table": null
    }
  ],
  "tables": \[
    {
      "table\_id": 1,
      "table\_label": "",
      "max\_capacity": 10
    }
  ],
  "vendors": \[
    {
      "category": "צילום",
      "vendor\_name": "",
      "contract\_total": 0,
      "retainer\_paid": 0,
      "payment\_status": "יתרה להסדרה"
    }
  ],
  "fixed\_expenses": \[
    {
      "expense\_title": "",
      "gross\_cost": 0,
      "paid\_amount": 0
    }
  ],
  "ai\_brief": ""
}
```

The SheetJS compiler maps this JSON into the Hebrew workbook.

\---

# 9\. Hebrew Product Standard

## Naming Conventions

All user-facing names must be Hebrew.

Workbook tabs:

* לוח\_בקרה
* בסיס\_נתונים\_אורחים
* מנוע\_הושבה
* בקרת\_ספקים
* תקציב\_וקייטרינג
* תדריך\_תפעולי\_AI

Web interface labels:

* הדבק כאן רשימת מוזמנים גולמית
* חוקי הושבה וקיבולת אולם
* נתוני חוזה, מנות וספקים
* ייצא מקור אמת תפעולי סופי (Excel)

## Terminology Standards

Use practical Israeli event language, not translated enterprise jargon.

Preferred:

* מאשר הגעה
* לא מגיע
* טרם השיב
* משפחת הכלה
* משפחת החתן
* חברים משותפים
* אורחי כבוד ועסקים
* ילדים
* יתרה להסדרה
* מחיר מנה
* סך חוזה
* מקדמה שולמה

Avoid user-facing:

* RSVP
* BEO
* Cohorts
* Command Center
* Guest Database
* Vendor Hub
* Seating Manifest

## Statuses

### RSVP Status

* מאשר הגעה
* לא מגיע
* טרם השיב

### Table Capacity Status

* חריגת קיבולת
* שולחן מלא
* מקומות פנויים

### AI Brief Status

* תדריך נעול - גרסה סופית

### Supplier Payment Status

* שולם במלואו
* שולמה מקדמה
* יתרה להסדרה
* לא בוצע תשלום

## Dropdown Standards

Dropdowns must be closed lists. Free text should be minimized where formula logic depends on exact matches.

### Guest Cohort

* משפחת הכלה
* משפחת החתן
* חברים משותפים
* אורחי כבוד ועסקים
* ילדים

### Dietary Marker

* ללא
* טבעוני
* צמחוני
* ללא גלוטן
* אלרגיה חמורה לאגוזים

### Supplier Category

* אולם/גן אירועים
* קייטרינג ובר
* הפקה ועיצוב
* דיג'יי/להקות
* צילום
* אטרקציות ופירוטכניקה
* ניהול אירוע/תכנון

## User-Facing Language Standards

Tone should be:

* direct
* operational
* Hebrew-native
* calm under pressure
* professional
* not academic
* not technical-heavy
* not over-explaining

Validation messages must be written in Hebrew and explain what the user should do.

Example:

**כותרת:** שגיאת הזנה  
**תוכן:** יש להזין שם מלא בלבד (בין 1 ל-75 תווים). אנא ודא כי הדבקת ערכים בלבד (Paste Values Only) כדי לא לדרוס את הנוסחאות.

\---

# 10\. User Journey

## Step 1 — Messy Information Arrives

The event manager receives chaotic information from the couple and suppliers:

* WhatsApp text
* copied guest list
* unclear RSVP updates
* dietary notes
* supplier contract amounts
* deposit confirmations
* table constraints
* last-minute cancellations

## Step 2 — Manager Opens EventSheet AI

The manager opens the Lovable web interface.

## Step 3 — Raw Input Is Pasted

The manager pastes messy text into:

**הדבק כאן רשימת מוזמנים גולמית**

## Step 4 — Baseline Event Parameters Are Entered

The manager enters:

* contracted guest count
* baseline budget
* price per head
* table capacity defaults
* key supplier/payment information

## Step 5 — Gemini Parses and Standardizes

Gemini maps the messy input into approved tokens and strict JSON.

## Step 6 — SheetJS Compiles Workbook

SheetJS generates the 6-tab Hebrew RTL workbook with:

* tab names
* formulas
* named ranges
* validation rules
* locked/unlocked cells
* conditional formatting
* AI brief
* local download

## Step 7 — Workbook Downloads

The manager downloads the file and opens it in Excel.

## Step 8 — Excel Becomes Source of Truth

From this point forward, the manager works directly inside the workbook.

## Step 9 — Manager Makes Operational Updates

The manager can update:

* guest RSVP status
* table assignments
* table capacities
* supplier payments
* fixed cost items
* price per head where allowed

## Step 10 — Workbook Reacts Instantly

Excel formulas update:

* dashboard KPIs
* guest count delta
* financial variance
* unseated guest count
* table capacity status
* catering liability
* supplier balances
* allergen alerts

## Step 11 — Final Operational Workbook Is Used for Execution

The file becomes the single reference point for event execution.

\---

# 11\. Demo Strategy

## Demo Story

The demo should tell a high-pressure Israeli wedding story:

It is 48 hours before the event. The couple sends a chaotic WhatsApp message with late confirmations, cancellations, dietary notes, and supplier payment updates. Normally this would require manual cleanup across several spreadsheets. EventSheet AI turns it into a protected workbook in seconds.

## Demo Flow

### 1\. Friction Setup

Show a messy Hebrew message, for example:

“אורן, דודה חנה מרחובות מגיעה עם עוד 3 אנשים מהמשפחה של הכלה, אחד מהם טבעוני. דניאל אלבז ואשתו ביטלו. תרשום גם שסגרנו עם הצלם ב-15,000 שח, נתנו לו 2,000 מקדמה.”

### 2\. Live AI Demonstration

Paste the text into the web interface and click:

**ייצא מקור אמת תפעולי סופי (Excel)**

Show that Gemini is being used live to parse the messy input and produce structured output/briefing.

### 3\. Workbook Generation

Download and open the generated Excel workbook.

### 4\. Workbook Demonstration

Show:

* guest records created
* RSVP statuses standardized
* dietary marker flagged
* supplier contract added
* deposit extracted
* dashboard KPIs updated
* seating engine capacity logic working
* budget/catering calculation reacting

### 5\. Business Value Demonstration

Show that the product saves time and reduces risk:

* messy input becomes structured data
* no manual spreadsheet building
* formulas work instantly
* manager remains in control
* Excel works offline
* Hebrew interface feels native
* the final file is operational, not theoretical

## Demo Message

The key line:

**“EventSheet AI does not replace the event manager. It gives the event manager a clean, protected operational source of truth within seconds.”**

\---

# 12\. Risks

## Technical Risks

### SheetJS Formula Mapping Errors

Incorrect cell references can create broken formulas or #REF errors.

Mitigation:

* freeze exact coordinates
* keep formulas simple
* test every generated workbook
* verify named ranges

### Protection Behavior Differences

Excel protection may behave differently across desktop Excel, Google Sheets, and mobile Excel.

Mitigation:

* prioritize Microsoft Excel compatibility
* test Excel Mobile
* keep protection logic simple

### Conditional Formatting Compatibility

Some mobile or legacy Excel versions may not render advanced conditional formatting consistently.

Mitigation:

* use standard Excel-compatible conditional formatting rules
* avoid exotic formatting logic

## Operational Risks

### Clipboard Overwrite

Users may paste directly into Excel and destroy validation.

Mitigation:

* use web ingestion first
* lock formulas
* add Paste Values Only warnings

### Misinterpreted Input

Gemini may misunderstand ambiguous text.

Mitigation:

* AI assists, manager decides
* use reviewable structured output
* default uncertain fields to safe values like טרם השיב

### Missing Critical Allergies

Dietary information buried in text can be missed.

Mitigation:

* explicitly instruct Gemini to prioritize allergen extraction
* visually highlight severe allergy markers

## Adoption Risks

### Users Expect Full SaaS

Users may expect saved events, dashboards, or multi-user access.

Mitigation:

* clearly position the MVP as an Excel workbook generator
* label export as final operational source of truth

### Couples May Not Understand Excel

Couples may not be comfortable operating the file.

Mitigation:

* target event managers as primary users
* keep workbook structure clean and clear

## AI Risks

### Hallucination

AI may invent missing details.

Mitigation:

* forbid invention in prompt
* allow only extracted or default values
* uncertain values remain blank or טרם השיב

### Over-Automation Perception

Evaluators may think the product is not “AI enough” because Excel formulas do calculations.

Mitigation:

* show AI live during ingestion
* explain AI’s role as messy-input translator and brief generator
* explain why deterministic formulas are safer for operations

## Excel Risks

### Formula Corruption

Users may overwrite formulas.

Mitigation:

* lock formula cells
* leave only input fields open
* use workbook protection

### Version Confusion

Users may create multiple final files.

Mitigation:

* clear file naming
* communicate Excel as the source of truth after export

### Mobile Limitations

Some Excel Mobile features may display differently.

Mitigation:

* test on mobile
* keep workbook simple
* avoid advanced features that mobile may not support

\---

# 13\. Success Metrics

## Product Success Metrics

* Workbook generated successfully from messy input.
* Workbook opens correctly in Microsoft Excel.
* Hebrew tab names display correctly.
* RTL layout works correctly.
* Formulas calculate without errors.
* Protected cells cannot be accidentally edited.
* Input cells remain editable.
* Dropdowns work correctly.
* Conditional formatting alerts appear correctly.
* AI brief is generated and inserted into the final workbook.

## Operational Success Metrics

* Time to create operational workbook reduced from several hours to under one minute.
* User can identify table capacity overflow instantly.
* User can identify unseated confirmed guests instantly.
* User can see live guest count delta instantly.
* User can see budget variance instantly.
* User can identify severe dietary/allergy risks instantly.
* Supplier outstanding balances are visible.

## Demo Success Metrics

* Live AI input parsing is shown successfully.
* `.xlsx` file downloads during demo.
* Workbook opens during demo.
* One manual change inside Excel updates dashboard formulas live.
* Audience understands the value within 5 minutes.

## Academic Success Metrics

* Uses multiple AI tools in the project workflow.
* Demonstrates live AI execution.
* Includes human-in-the-loop explanation.
* Includes ethical/privacy framing.
* Includes measurable time-savings comparison.
* Maintains product scope without academic feature creep.

\---

# 14\. Future Scope

The following features are intentionally postponed.

## Input Expansion

* voice note transcription
* screenshot OCR/multimodal ingestion
* file upload from RSVP platforms
* supplier contract parsing
* structured import from existing Excel files

## Workflow Expansion

* WhatsApp Business API integration
* automated RSVP campaigns
* email automation
* reminder automation
* guest communication flows
* phone/IVR integrations

## Product Expansion

* saved events
* user accounts
* venue dashboards
* planner dashboards
* CRM module
* multi-event management
* team permissions
* cloud sync
* Excel re-import
* version history
* PDF export
* BEO/function sheet export
* kitchen brief export
* service brief export

## Intelligence Expansion

* predictive RSVP forecasting
* seating recommendations
* relationship mapping
* conflict scoring
* accessibility intelligence
* vendor risk scoring
* budget forecasting
* post-event lessons learned

## Visual Expansion

* floorplan builder
* 2D/3D seating diagram
* drag-and-drop seating
* venue map import
* print-ready seating boards

## iPlan Compatibility
* 
* Future versions may support importing guest lists and event data exported from iPlan.
* 
* The goal is not to replace iPlan.
* 
* The goal is to transform existing iPlan exports into an enhanced operational workbook.
* 
* Any future iPlan integration must remain consistent with the Excel-as-the-Product philosophy.

\---

# 15\. Build Scope Freeze

## Must Build

* Hebrew-first single-page Lovable wizard
* raw messy text input area
* event baseline inputs
* seating/table capacity inputs
* supplier/financial inputs
* Gemini parsing/brief generation call
* strict JSON transformation pipeline
* SheetJS workbook generation
* exactly 6 Hebrew tabs
* RTL workbook settings
* formulas and named ranges
* dropdown validation
* locked formula cells
* unlocked input cells
* conditional formatting alerts
* Excel download button labeled in Hebrew
* AI operational brief tab
* demo-ready sample scenario

## Should Build

* mobile Excel compatibility testing
* Paste Values Only warning
* clear empty states
* clean visual workbook styling
* basic error handling if Gemini fails
* fallback sample workbook for presentation day
* file naming convention
* simple loading state during generation
* structured review preview before export, if simple

## Future

* voice notes
* screenshots
* WhatsApp API
* RSVP automation
* PDF exports
* saved events
* dashboards
* multi-event management
* advanced seating intelligence
* floorplan visualization
* contract parsing
* lessons learned
* post-event reconciliation

## Never Build in MVP

* CRM
* payment processing
* gift collection
* AI auto seating
* relationship-proximity algorithms
* line-of-sight math
* 3D floorplan system
* real-time collaboration
* cloud database
* user authentication
* two-way Excel sync
* re-import engine
* live multi-user planning portal
* English-first UI
* separate RSVP control tab
* separate category intelligence tab
* separate venue data tab
* separate change impact engine tab
* separate risk engine tab

\---

# 16\. Development Readiness Assessment

EventSheet AI is ready to move into architecture and implementation.

The product has a frozen MVP direction, a clear scope boundary, and an implementation model that fits the constraints. The approved architecture is coherent:

* one-way pipeline
* Gemini ingestion/brief generation
* SheetJS compilation
* Hebrew RTL Excel workbook
* deterministic formula logic
* protected workbook structure
* 6-tab final architecture
* no database
* no CRM
* no RSVP platform
* no AI auto seating

The critical development work is no longer product discovery. It is execution discipline.

## Implementation Readiness Status

**Ready, with strict scope discipline.**

## Required Development Priorities

1. Implement the Hebrew UI exactly.
2. Implement the JSON schema exactly.
3. Implement SheetJS workbook generation exactly.
4. Implement formulas with stable references.
5. Implement workbook protection correctly.
6. Implement dropdowns and validation rules.
7. Implement the AI brief and parsing flow.
8. Test the workbook locally in Excel.
9. Test the workbook on Excel Mobile.
10. Prepare a demo fallback workbook.

## Final Product Direction

EventSheet AI should be built as a focused, practical, Hebrew-first operational workbook generator.

The winning MVP is not the one with the most features.

The winning MVP is the one that takes real Israeli wedding chaos and turns it into a clean, protected, professional Excel source of truth that an event manager can actually use.

