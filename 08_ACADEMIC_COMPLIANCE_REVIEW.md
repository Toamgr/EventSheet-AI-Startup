## Executive Summary

EventSheet AI is an AI-powered Wedding Operations Workbook Generator engineered for professional event managers facing high-stakes, highly volatile, 72-hour execution windows. The product employs an **Excel-as-the-Product** methodology where a frontend wizard (built via Lovable) takes unstructured textual data, runs a structured prompt through a Gemini API architecture, compiles a rigid 6-tab spreadsheet utilizing SheetJS (Codex Compiler), and down-provisions it to the user. Once compiled, Excel functions as the permanent offline operating truth, using deterministic formulas for seating, budget control, and error flagging.

As an academic university project for the course *"Artificial Intelligence and Innovation in Tourism and Leisure Management" (Spring 2026, taught by Eran Livni)*, this product layout is exceptionally solid from a functional software standpoint. However, an evaluation against the academic grading parameters reveals a structural discrepancy: **The product is designed flawlessly, but the academic framing contains critical omissions that will severely harm its grade if left unaddressed.** This review acts as the University Project Review Board to flag academic compliance shortfalls, evaluate execution risks, and map out immediate alignment measures—all while completely preserving the frozen, formula-driven product architecture.

---

## Critical Findings

* **Academic Multi-Tool Rule Breach:** The course guidelines strictly state that a project *must* utilize **2 to 3 distinct AI tools** taught in the course. The architecture relies heavily on Gemini (via API) for text synthesis and Lovable/Base44 for generation. It explicitly bans Claude and excludes other tools taught in the syllabus (such as Perplexity for market research, Vidnoz for synthetic brief videos, or CRM modules). Leaving the stack as just "Gemini API + Lovable" threatens core grading criteria.
* **Literature Review and Citation Absence:** The official academic dossier requires a **Short Literature Review (approx. 1 page)** referencing **3 to 5 academic or professional sources** formatted in **APA 7**. The current development documents (MVP Baseline, Workbook Architecture) refer to product requirements, engineering challenges, and operational personas, but entirely lack formal academic indexing.
* **Missing Ethical and Human-in-the-Loop Documentation:** The academic guidelines demand explicit analysis of **ethical considerations** (e.g., data privacy of guest listings, bias mitigation) and an evaluation of **what the AI did well vs. what required human intervention**. These sections are missing from the current system blueprints.
* **The Demo Matrix Paradox:** The chosen live demonstration scenario (handling late-stage operational disruptions 48 hours prior to an event) is operationally brilliant. However, because the product relies on a *one-way compilation pipeline*, showing updates *inside Excel* does not showcase an active, live AI tool running on-screen during presentation day. The live presentation rules explicitly mandate **the live execution of at least one AI tool in real-time on screen**.

---

## What Matters Most

* **Securing Academic Alignment Without Feature Creep:** Meeting the grading requirements without compromising the architectural design (e.g., no cloud sync, no automated AI seating). The solution lies in adding AI tooling to the documentation, preparation, and presentation phases, rather than expanding the runtime code stack.
* **Proving tourism/hospitality industry relevance:** Framing the workbook as a professional **BEO (Banquet Event Order) / Function Sheet operator**—the universal data standard for hotel sales, catering managers, and venue coordinators—to firmly establish academic alignment.
* **The 5-Minute Live Demo Execution:** Structuring the presentation so the instructor witnesses the frontend wizard ingest unformatted text, make a live Gemini API call, and generate a downloadable `.xlsx` asset right in front of the class.

---

## What Should Be Removed

* **The "University Student Project" Tone in Technical Briefs:** Replace statements regarding development limits (e.g., "1-day, 1-developer reality") with formal operational terminology. Frame it as a strategic choice to reduce tech footprint, minimize connectivity dependencies during field operations, and optimize performance.
* **Isolating the Product From the Syllabus:** The presentation must not present the workbook as a standalone standalone software utility; it must use terminology directly from the course (e.g., automated structured data formatting, multi-agent prototyping, client-side low-code rendering).

---

## MVP Recommendation

Maintain the architectural baseline exactly as defined: A single-page Lovable web wizard that processes unstructured guest/financial data, sends a single optimized prompt to Gemini for Tab 6 textual compilation, compiles the multi-tab layout client-side using SheetJS, and delivers an ironclad, formula-driven Excel sheet protected against unintended editing. To satisfy the course multi-tool requirements, incorporate **Perplexity** into the pre-development research documentation phase and **Vidnoz/ElevenLabs** into the final presentation deliverable phase.

---

## Workbook Architecture

The approved 6-tab structure is retained with zero core code changes:

1. **`Command_Center`:** Master operational dashboard featuring named ranges, high-level financial tracking, and conditional alerts.
2. **`Guest_Database`:** Structured relational register using explicit cell protection configuration (`Locked = true`) and hard-constrained status menus.
3. **`Seating_Manifest`:** Space allocation register utilizing native `COUNTIF`/`COUNTIFS` metrics to flag venue capacity and cohort distribution issues.
4. **`F&B_Ledger`:** Calculation matrix connecting guest attendance numbers, menu selections, and variance data back to master fields.
5. **`Supplier_Hub`:** Logistical timeline tracking service schedules, contract values, and outstanding deposits.
6. **`Operational_Brief (Tab 6)`:** The AI target container displaying the qualitative brief generated by the Gemini prompt layer.

---

## User Flow

```
[Raw/Unstructured Guest Data] 
             │
             ▼
┌──────────────────────────────────────┐
│  Lovable Frontend Ingestion Wizard   │ ──(Student runs live on screen)
└──────────────────────────────────────┘
             │
             ├─────────────────────────────────────────┐
             ▼                                         ▼
┌──────────────────────────────────────┐   ┌──────────────────────────────────┐
│ Gemini API Prompt Synthesis Engine   │   │     SheetJS Compiler Engine      │
│ (Generates Tab 6 Operational Brief)  │   │  (Injects formulas & protection) │
└──────────────────────────────────────┘   └──────────────────────────────────┘
             │                                         │
             └────────────────────┬────────────────────┘
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│             Rigid, Multi-Tab Formula-Driven Excel Operational OS            │
│             (Permanent offline source of truth for the manager)             │
└─────────────────────────────────────────────────────────────────────────────┘

```

---

## Demo Strategy

To fulfill the mandatory 5-minute live demonstration requirement while demonstrating real-time software responsiveness, the presentation will follow a split-screen timeline:

1. **The Input Phase (1.5 Minutes):** Paste a chaotic, raw stream of text (e.g., text from a messy WhatsApp message containing late RSVPs, food allergies, and budget updates) into the Lovable web application interface.
2. **The Generation Phase (0.5 Minutes):** Click "Generate Workbook." Show the immediate live execution of the Gemini API synthesizing the qualitative operational brief on screen.
3. **The Offline Truth Phase (3 Minutes):** Download the compiled `.xlsx` file on the spot. Open it locally in Microsoft Excel. Change a guest status from "Pending" to "Declined." Show how Excel's standard internal calculation engine instantly updates the financial layout, clears table capacity alerts, and recalculates catering variances in real time. This approach clearly demonstrates an end-to-end workflow from unformatted data to structured operational reality.

---

## Risks

### Grading Risks

* **Lack of Literature Context:** Risk of losing significant points under the project portfolio evaluation framework due to the complete lack of professional references or academic background information.
* **Perceived Insufficient AI Depth:** Because the core operational workbook runs on deterministic Excel formulas rather than machine learning algorithms, an evaluator might initially think the project lacks technical AI depth.

### Implementation Risks

* **SheetJS Parameter Vulnerabilities:** Mapping coordinates incorrectly in the backend compilation engine can break cell references, leading to `#REF!` errors inside Excel.

### Demo Day Risks

* **API/Network Instability:** Relying on active campus Wi-Fi networks to process requests through the Gemini API and Lovable interfaces can cause unexpected dropouts or slow rendering times on presentation day.

---

## Missing Information

* **Course Team Matrix:** The official names and identification numbers of the three students on the project team are missing from the formal proposal cover sheet.
* **Specific Academic Bibliography:** A curated list of 3–5 foundational research sources or hospitality whitepapers addressing event risk metrics or BEO data management is needed.
* **Prompt Layout Engineering Specification:** The system requirements documents do not include the precise markdown text for the Gemini prompt layer that generates Tab 6.

---

## Technical Audit & Compliance Matrix

| Requirement Area | Detailed Finding | Status Classification |
| --- | --- | --- |
| **Course Core Framework** | Chosen domain fits the hospitality/event track. The team configuration requires exactly three members. | **Approved** |
| **AI Tool Stack Variety** | The runtime relies entirely on the Gemini API and Lovable. The syllabus explicitly requires a multi-tool configuration featuring **2 to 3 distinct AI tools**. | **Critical Missing Element** |
| **Literature Review Foundation** | The project documentation includes no literature review section or the mandatory **3 to 5 professional/academic references formatted in APA 7**. | **Critical Missing Element** |
| **Ethical & Human Factors Evaluation** | The portfolio lacks a dedicated analysis regarding data security, guest listing privacy, and a clear breakdown of **AI capabilities vs. required manual inputs**. | **Needs Revision** |
| **Technical Data Implementation** | Uses highly realistic, unformatted unstructured text data inputs to produce structured datasets. | **Approved** |
| **Live Demonstration Layout** | The 15-minute presentation breakdown and 5-minute split-screen real-time simulation align perfectly with the course requirements. | **Approved** |
| **Comparative Metrics** | Needs a clear, quantifiable comparison demonstrating **time savings with AI** versus traditional manual methods. | **Needs Revision** |

---

## Instructor Perspective & Grading Evaluation

If I were evaluating this project as the course instructor:

### Would you approve the project today?

**No, it requires minor revisions before final approval.** While the technical architecture is highly professional, the project proposal and documentation cannot be approved until the missing academic requirements (multi-tool utilization framework, literature review citations, and ethical impact analysis) are integrated into the project portfolio.

### What would concern you?

* **An Illusion of AI Core Functionality:** I would worry that the core product value is driven by traditional Excel syntax (`COUNTIF`/`SUMIF`) rather than ongoing artificial intelligence interactions. The documentation must clearly highlight the AI's role: it acts as an intelligent ingestion layer that maps unstructured text to a structured data schema.
* **Potential Grading Penalties:** The team risk losing up to 15-20% of their final grade simply by failing to provide standard APA 7 citations or an ethical risk assessment.

### What would impress you?

* **A High Level of Practical Empathy:** Bypassing complex seating algorithms in favor of ironclad spreadsheet security demonstrates a deep understanding of real-world operational challenges. It positions the tool as a practical utility rather than a theoretical project.
* **The "Excel-as-the-Product" Philosophy:** Moving away from heavy, over-engineered web apps to leverage Microsoft Excel as an offline source of truth is a highly pragmatic development approach.

### What would you require before development begins?

1. **Academic Citation Alignment:** Add 3 to 5 professional sources (e.g., Cornell Hospitality Reports, Event Management Journals) regarding BEO data management and spreadsheet error rates.
2. **Explicit Integration of Course AI Tools:** Formalize the use of additional tools from the syllabus to satisfy the multi-tool requirement:
* **Perplexity AI:** Document its use during the initial market research and technical audit phase.
* **Vidnoz / ElevenLabs AI:** Use these tools to generate a 60-second synthetic video presentation featuring an AI avatar of an "Event Director" explaining the field utility of Tab 6.


3. **Draft a Comprehensive Comparative Metric:** Include an explicit calculation showing how EventSheet AI reduces the time required to format data and generate operational briefs from **5-6 hours of manual data entry down to 30 seconds** of automated generation.

---

## Recommended Next Steps for Development

1. **Complete the Project Proposal Cover Sheet:** Insert student names, identification credentials, and select "EventSheet AI: An AI-Powered Operations Generator" as the formal title.
2. **Draft the Literature Review Section (1 Page):** Write a brief operational overview using standard APA 7 formatting. Cite studies on data fragmentation in event planning and typical error rates in hospitality spreadsheets.
3. **Build the Ethical Framework and Human-in-the-Loop Documentation:** Add a section to the portfolio detailing guest data privacy (local download processing with zero cloud data storage) and defining the division of labor (AI handles ingestion and textual synthesis, while the event manager retains manual operational control).
4. **Develop a Local Demo Safety Backup File:** Save a pre-compiled version of the target `.xlsx` file on a local USB drive. If campus Wi-Fi drops during the presentation, the team can still present the core Excel spreadsheet functionality flawlessly.
5. **Begin Lovable Codebase Implementation:** Initialize the frontend wizard fields using the exact coordinates, uppercase formulas, and strict cell-locking logic defined in the frozen blueprint.