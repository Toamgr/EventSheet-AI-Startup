import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  AlertTriangle,
  Armchair,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  FileSpreadsheet,
  LayoutDashboard,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Trash2,
  Truck,
  Users,
  Wallet,
} from "lucide-react";
import { buildWorkbook as compileWorkbook, generateSeatingRecommendations, parseMessyEventInfo as parseEventInfo, workbookToBuffer } from "./eventsheetWorkbook.js";
import { buildEventUrl, createEmptyPreview, createEventRecord, deleteEventRecord, getEventIdFromUrl, listEventRecords, loadEventRecord, saveEventRecord } from "./eventStorage.js";
import { applySeatingRecommendationPlan, buildSeatingRecommendationPlan, checkManualAssignCapacity, getSeatingMetrics, seatingPlanToNotes, validateAndApplySeatingPlan } from "./seatingIntelligence.js";
import "./styles.css";

const sampleText = `אירוע: חתונת נועה ודניאל
לקוח: משפחת כהן-לוי
מקום: גן עדן אירועים
תאריך: 2026-07-18

אורחים:
מולר חבר גרעין
מידן חבר גרעין
תואם חבר גרעין וחבר לימודים
זוהר חברה לימודים
פלג חברה לימודים
נועה כהן - משפחת הכלה - מאשר הגעה - שולחן 1 - טבעוני
דניאל לוי - משפחת החתן - טרם השיב - שולחן 2
רוני ושירה - VIP - מאשרים הגעה - שולחן 3 - ללא גלוטן

ספקים:
קייטרינג טעם טוב - 42000 - מקדמה 12000 - 050-8887766
די ג׳יי אלון - 8500
צילום רגעים - 11000 - שולם 4000 - 054-3332211

תקציב:
אולם - 65000
בר משקאות - 18000

סיכון: אלרגיה חמורה לאגוזים אצל אורח VIP
בעיה: חסרים 12 אישורי הגעה`;

const navItems = [
  { id: "overview", label: "סקירה", icon: LayoutDashboard },
  { id: "guests", label: "אורחים", icon: Users },
  { id: "seating", label: "הושבה", icon: Armchair },
  { id: "suppliers", label: "ספקים", icon: Truck },
  { id: "risks", label: "סיכונים", icon: ShieldAlert },
  { id: "workbook", label: "הפקה", icon: FileSpreadsheet },
];

const hashTabs = new Set(["overview", "guests", "seating", "suppliers", "risks", "workbook"]);
const rsvpOptions = ["מאשר הגעה", "טרם השיב", "לא מגיע"];
const paymentOptions = ["פתוח לתשלום", "שולם חלקית", "שולם"];

const visualTemplateTables = [
  { table: 1, label: "שולחן 1", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 2, label: "שולחן 2", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 3, label: "שולחן 3", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 4, label: "שולחן 4", capacity: 12, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 5, label: "שולחן 5", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 6, label: "שולחן 6", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 7, label: "שולחן 7", capacity: 8, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 8, label: "שולחן 8", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 9, label: "שולחן 9", capacity: 10, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
  { table: 10, label: "אבירים 10", capacity: 20, category: "תבנית", guests: [], visualOnly: true, shape: "long" },
  { table: 11, label: "אבירים 11", capacity: 20, category: "תבנית", guests: [], visualOnly: true, shape: "long" },
  { table: 12, label: "שולחן 12", capacity: 12, category: "תבנית", guests: [], visualOnly: true, shape: "round" },
];

function App() {
  const [eventIndex, setEventIndex] = useState([]);
  const [record, setRecord] = useState(null);
  const [screen, setScreen] = useState("registry");
  const [activeTab, setActiveTabState] = useState("overview");
  const [missingEventId, setMissingEventId] = useState("");
  const [guestQuery, setGuestQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedGuestIndexes, setSelectedGuestIndexes] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [newGuest, setNewGuest] = useState(emptyGuest());
  const [newSupplier, setNewSupplier] = useState(emptySupplier());
  const [newTable, setNewTable] = useState({ table: "", capacity: "10", category: "", type: "", zone: "", notes: "" });
  const [workbookReady, setWorkbookReady] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [applyError, setApplyError] = useState(null);
  const [manualAssignError, setManualAssignError] = useState(null);

  useEffect(() => {
    setEventIndex(listEventRecords());
    const requestedEventId = getEventIdFromUrl();
    const hash = window.location.hash.replace("#", "");
    if (requestedEventId) {
      const loaded = loadEventRecord(requestedEventId);
      if (!loaded) {
        setMissingEventId(requestedEventId);
        setScreen("missing");
        return;
      }
      openRecord(loaded, hashTabs.has(hash) ? hash : "overview", false);
      return;
    }
    if (listEventRecords().length === 0) startNewEvent(false);
  }, []);

  useEffect(() => {
    if (!record?.eventId || screen === "missing") return;
    saveEventRecord(record);
    setEventIndex(listEventRecords());
  }, [record?.eventId, record?.name, record?.clientName, record?.date, record?.venue, record?.estimatedGuests, record?.rawInfo, record?.preview, record?.status]);

  useEffect(() => {
    function applyHashRoute() {
      const hash = window.location.hash.replace("#", "");
      if (hashTabs.has(hash)) {
        setActiveTabState(hash);
        if (record) setScreen("review");
      }
    }
    window.addEventListener("hashchange", applyHashRoute);
    return () => window.removeEventListener("hashchange", applyHashRoute);
  }, [record]);

  const preview = record?.preview || createEmptyPreview();
  const stats = useMemo(() => getStats(preview), [preview]);
  const seatingWithGuests = useMemo(() => mapSeating(preview), [preview]);
  const categories = useMemo(() => Object.keys(stats.categories), [stats.categories]);
  const filteredGuestEntries = useMemo(() => {
    const query = guestQuery.trim();
    return preview.guests
      .map((guest, index) => ({ guest, index }))
      .filter(({ guest }) => {
        const matchesQuery = !query || [guest.name, guest.category, guest.status, guest.dietary, guest.notes, guest.side, guest.table].join(" ").includes(query);
        const matchesCategory = selectedCategory === "all" || splitTags(guest.category).includes(selectedCategory);
        return matchesQuery && matchesCategory;
      });
  }, [guestQuery, preview.guests, selectedCategory]);

  function startNewEvent(updateUrl = true) {
    const next = saveEventRecord(createEventRecord());
    setRecord(next);
    setEventIndex(listEventRecords());
    setScreen("intake");
    setActiveTabState("overview");
    if (updateUrl) history.pushState(null, "", buildEventUrl(next.eventId, "overview", window.location.origin));
  }

  function openRecord(nextRecord, tab = "overview", updateUrl = true) {
    setRecord(nextRecord);
    setScreen(nextRecord.preview.guests.length || nextRecord.preview.suppliers.length || nextRecord.preview.seating.length ? "review" : "intake");
    setActiveTabState(tab);
    setSelectedCategory("all");
    setSelectedGuestIndexes([]);
    setSelectedTableId(null);
    if (updateUrl) history.pushState(null, "", buildEventUrl(nextRecord.eventId, tab, window.location.origin));
  }

  function removeEvent(eventId) {
    deleteEventRecord(eventId);
    setEventIndex(listEventRecords());
    if (record?.eventId === eventId) {
      setRecord(null);
      setScreen("registry");
      history.pushState(null, "", window.location.pathname);
    }
  }

  function updateRecord(fields) {
    setRecord((current) => ({ ...current, ...fields }));
    setWorkbookReady(false);
  }

  function updatePreview(updater) {
    setRecord((current) => {
      const nextPreview = typeof updater === "function" ? updater(current.preview) : updater;
      return { ...current, preview: normalizePreviewForApp(nextPreview) };
    });
    setWorkbookReady(false);
  }

  function setActiveTab(tab) {
    setActiveTabState(tab);
    if (record?.eventId) history.pushState(null, "", buildEventUrl(record.eventId, tab, window.location.origin));
  }

  function organizeInformation() {
    const parsed = parseEventInfo(record);
    const nextPreview = normalizePreviewForApp(parsed);
    setRecord((current) => ({
      ...current,
      ...parsed.eventPatch,
      preview: nextPreview,
      status: "מאורגן",
    }));
    setSelectedCategory("all");
    setActiveTab("overview");
    setScreen("review");
  }

  async function generateWorkbook() {
    if (!record) return;
    setIsGenerating(true);
    try {
      const saved = saveEventRecord(record);
      const workbook = compileWorkbook(saved, saved.preview, window.location?.origin || "http://127.0.0.1:5173");
      const safeName = (saved.name || "אירוע").replace(/[\\/:*?"<>|]/g, "-");
      const buffer = await workbookToBuffer(workbook);
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `EventSheet_AI_${safeName}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setWorkbookReady(true);
      setActiveTab("workbook");
      setRecord({ ...saved, workbookMeta: { generatedAt: new Date().toISOString() } });
    } finally {
      setIsGenerating(false);
    }
  }

  function addGuest() {
    const name = newGuest.name.trim();
    if (!name) return;
    const guest = {
      name,
      category: newGuest.category.trim() || "ללא קטגוריה",
      side: newGuest.side.trim(),
      status: newGuest.status || "טרם השיב",
      dietary: newGuest.dietary.trim() || "ללא",
      table: Number(newGuest.table) || 0,
      notes: newGuest.notes.trim(),
    };
    updatePreview((current) => refreshRecommendations({
      ...current,
      guests: [...current.guests, guest],
    }));
    setNewGuest(emptyGuest());
  }

  function updateGuest(index, field, value) {
    if (field === "table" && Number(value) > 0) {
      const check = checkManualAssignCapacity(preview.guests, preview.seating, [index], Number(value));
      if (!check.ok) {
        setManualAssignError(check.error);
        return;
      }
    }
    setManualAssignError(null);
    updatePreview((current) => refreshRecommendations({
      ...current,
      guests: current.guests.map((guest, guestIndex) => guestIndex === index ? { ...guest, [field]: field === "table" ? Number(value) || 0 : value } : guest),
    }));
  }

  function deleteGuest(index) {
    updatePreview((current) => refreshRecommendations({
      ...current,
      guests: current.guests.filter((_, guestIndex) => guestIndex !== index),
    }));
    setSelectedGuestIndexes((indexes) => indexes.filter((item) => item !== index));
  }

  function addSupplier() {
    const name = newSupplier.name.trim();
    if (!name) return;
    updatePreview((current) => ({
      ...current,
      suppliers: [...current.suppliers, {
        category: newSupplier.category.trim() || "ספק כללי",
        name,
        contact: newSupplier.contact.trim(),
        phone: newSupplier.phone.trim(),
        email: newSupplier.email.trim(),
        amount: Number(newSupplier.amount) || 0,
        paid: Number(newSupplier.paid) || 0,
        status: newSupplier.status,
        dueDate: newSupplier.dueDate,
        notes: newSupplier.notes.trim(),
      }],
    }));
    setNewSupplier(emptySupplier());
  }

  function updateSupplier(index, field, value) {
    updatePreview((current) => ({
      ...current,
      suppliers: current.suppliers.map((supplier, supplierIndex) => supplierIndex === index
        ? { ...supplier, [field]: ["amount", "paid"].includes(field) ? Number(value) || 0 : value }
        : supplier),
    }));
  }

  function deleteSupplier(index) {
    updatePreview((current) => ({
      ...current,
      suppliers: current.suppliers.filter((_, supplierIndex) => supplierIndex !== index),
    }));
  }

  function addTable() {
    const tableNumber = Number(newTable.table) || nextTableNumber(preview.seating);
    if (!tableNumber || preview.seating.some((table) => Number(table.table) === tableNumber)) return;
    updatePreview((current) => ({
      ...current,
      seating: [...current.seating, {
        table: tableNumber,
        label: `שולחן ${tableNumber}`,
        capacity: Number(newTable.capacity) || 10,
        category: newTable.category.trim() || "כללי",
        type: newTable.type.trim(),
        zone: newTable.zone.trim(),
        notes: newTable.notes.trim(),
      }].sort((a, b) => Number(a.table) - Number(b.table)),
    }));
    setSelectedTableId(tableNumber);
    setNewTable((current) => ({ table: "", capacity: current.capacity || "10", category: "", type: current.type || "", zone: current.zone || "", notes: "" }));
  }

  function updateTable(tableNumber, field, value) {
    updatePreview((current) => ({
      ...current,
      seating: current.seating.map((table) => Number(table.table) === Number(tableNumber)
        ? { ...table, [field]: field === "capacity" ? Number(value) || 0 : value }
        : table),
    }));
  }

  function deleteTable(tableNumber) {
    updatePreview((current) => refreshRecommendations({
      ...current,
      seating: current.seating.filter((table) => Number(table.table) !== Number(tableNumber)),
      guests: current.guests.map((guest) => Number(guest.table) === Number(tableNumber) ? { ...guest, table: 0 } : guest),
    }));
    setSelectedTableId(null);
  }

  function toggleGuestSelection(index) {
    setSelectedGuestIndexes((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  function assignSelectedGuests() {
    const tableNumber = Number(selectedTableId);
    if (!tableNumber || selectedGuestIndexes.length === 0) return;
    const check = checkManualAssignCapacity(preview.guests, preview.seating, selectedGuestIndexes, tableNumber);
    if (!check.ok) {
      setManualAssignError(check.error);
      return;
    }
    setManualAssignError(null);
    updatePreview((current) => refreshRecommendations({
      ...current,
      guests: current.guests.map((guest, index) => selectedGuestIndexes.includes(index) ? { ...guest, table: tableNumber } : guest),
    }));
    setSelectedGuestIndexes([]);
  }

  function removeGuestFromTable(index) {
    updateGuest(index, "table", 0);
  }

  function calculateSeatingRecommendations(includeExistingAssignments = false) {
    setApplyError(null);
    setManualAssignError(null);
    const plan = buildSeatingRecommendationPlan(preview.guests, preview.seating, { includeExistingAssignments });
    updatePreview((current) => ({
      ...current,
      seatingPlan: plan,
      seatingRecommendations: seatingPlanToNotes(plan),
    }));
  }

  function applySeatingRecommendations() {
    const plan = preview.seatingPlan;
    if (!plan?.assignments?.length) return;
    const result = validateAndApplySeatingPlan(preview.guests, preview.seating, plan);
    if (!result.ok) {
      setApplyError(result.error);
      return;
    }
    setApplyError(null);
    updatePreview((current) => {
      const seatingRecommendations = seatingPlanToNotes(plan);
      return {
        ...current,
        guests: result.guests,
        seatingRecommendations,
        seatingPlan: {
          ...plan,
          appliedAt: new Date().toISOString(),
        },
        finalBrief: appendRecommendationNotes(current.finalBrief, seatingRecommendations),
      };
    });
    setSelectedGuestIndexes([]);
  }

  function clearSeatingRecommendations() {
    setApplyError(null);
    setManualAssignError(null);
    updatePreview((current) => ({
      ...current,
      seatingPlan: null,
      seatingRecommendations: generateSeatingRecommendations(current.guests),
    }));
  }

  if (screen === "missing") {
    return <MissingEventScreen eventId={missingEventId} onHome={() => { setScreen("registry"); history.pushState(null, "", window.location.pathname); }} />;
  }

  if (screen === "registry" && !record) {
    return <EventRegistry events={eventIndex} onCreate={startNewEvent} onDelete={removeEvent} onOpen={(eventId) => openRecord(loadEventRecord(eventId), "overview")} />;
  }

  return (
    <main className="app" dir="rtl">
      {screen === "registry" ? (
        <EventRegistry events={eventIndex} onCreate={startNewEvent} onDelete={removeEvent} onOpen={(eventId) => openRecord(loadEventRecord(eventId), "overview")} />
      ) : screen === "intake" ? (
        <IntakeScreen
          eventData={record}
          onBack={() => setScreen("registry")}
          onChange={(field, value) => updateRecord({ [field]: value })}
          onSample={() => updateRecord({ rawInfo: sampleText })}
          onOrganize={organizeInformation}
        />
      ) : (
        <Workspace
          activeTab={activeTab}
          applyError={applyError}
          categories={categories}
          manualAssignError={manualAssignError}
          eventData={record}
          filteredGuestEntries={filteredGuestEntries}
          guestQuery={guestQuery}
          isGenerating={isGenerating}
          newGuest={newGuest}
          newSupplier={newSupplier}
          newTable={newTable}
          onAddGuest={addGuest}
          onAddSupplier={addSupplier}
          onAddTable={addTable}
          onApplySeatingRecommendations={applySeatingRecommendations}
          onAssignSelectedGuests={assignSelectedGuests}
          onBack={() => setScreen("intake")}
          onCalculateSeatingRecommendations={calculateSeatingRecommendations}
          onClearSeatingRecommendations={clearSeatingRecommendations}
          onDeleteGuest={deleteGuest}
          onDeleteSupplier={deleteSupplier}
          onDeleteTable={deleteTable}
          onGenerate={generateWorkbook}
          onGuestQuery={setGuestQuery}
          onNewGuestChange={(field, value) => setNewGuest((current) => ({ ...current, [field]: value }))}
          onNewSupplierChange={(field, value) => setNewSupplier((current) => ({ ...current, [field]: value }))}
          onNewTableChange={(field, value) => setNewTable((current) => ({ ...current, [field]: value }))}
          onOpenRegistry={() => setScreen("registry")}
          onRemoveGuestFromTable={removeGuestFromTable}
          onSelectedCategory={setSelectedCategory}
          onTab={setActiveTab}
          onToggleGuestSelection={toggleGuestSelection}
          onUpdateGuest={updateGuest}
          onUpdateSupplier={updateSupplier}
          onUpdateTable={updateTable}
          preview={preview}
          selectedCategory={selectedCategory}
          selectedGuestIndexes={selectedGuestIndexes}
          selectedTableId={selectedTableId}
          setSelectedTableId={setSelectedTableId}
          seatingWithGuests={seatingWithGuests}
          stats={stats}
          workbookReady={workbookReady}
        />
      )}
    </main>
  );
}

function EventRegistry({ events, onCreate, onDelete, onOpen }) {
  return (
    <section className="registry-page">
      <div className="registry-header">
        <div>
          <p className="eyebrow">EventSheet AI</p>
          <h1>אירועים שמורים</h1>
          <p>רשומות האירוע נשמרות מקומית בדפדפן הזה. קובץ Excel נוצר מאותה רשומה.</p>
        </div>
        <button className="primary-button" type="button" onClick={() => onCreate(true)}>
          <Plus size={18} />
          אירוע חדש
        </button>
      </div>
      <div className="registry-list">
        {events.length ? events.map((event) => (
          <article className="registry-card" key={event.eventId}>
            <div>
              <strong>{event.name || "אירוע ללא שם"}</strong>
              <span>{event.date || "ללא תאריך"} · {event.venue || "ללא מקום"}</span>
              <small>עודכן: {formatDateTime(event.updatedAt)}</small>
            </div>
            <div className="registry-actions">
              <button className="secondary-button" type="button" onClick={() => onOpen(event.eventId)}>פתח</button>
              <button className="icon-button danger" type="button" onClick={() => onDelete(event.eventId)} aria-label="מחק אירוע"><Trash2 size={17} /></button>
            </div>
          </article>
        )) : <EmptyState text="אין עדיין אירועים שמורים. צרו אירוע ראשון כדי להתחיל." />}
      </div>
    </section>
  );
}

function MissingEventScreen({ eventId, onHome }) {
  return (
    <main className="app" dir="rtl">
      <section className="missing-event-screen">
        <FileSpreadsheet size={42} />
        <h1>האירוע לא נמצא במכשיר זה</h1>
        <p>ייתכן שהקובץ נוצר במחשב אחר או שהאירוע נמחק.</p>
        <small>eventId: {eventId}</small>
        <button className="primary-button" type="button" onClick={onHome}>חזרה לאירועים</button>
      </section>
    </main>
  );
}

function IntakeScreen({ eventData, onBack, onChange, onSample, onOrganize }) {
  return (
    <section className="intake-page">
      <div className="intake-hero">
        <div className="brand-mark"><FileSpreadsheet size={24} /></div>
        <p className="eyebrow">EventSheet AI</p>
        <h1>ספר תכנון Excel מקצועי לאירוע</h1>
        <p>יוצרים רשומת אירוע יציבה, מארגנים מידע עברי מבולגן, ומפיקים חוברת תפעולית מאותה רשומה.</p>
      </div>
      <div className="intake-card">
        <div className="card-heading">
          <div>
            <p className="eyebrow">שלב 1</p>
            <h2>פרטי אירוע</h2>
          </div>
          <button className="text-button" type="button" onClick={onBack}>כל האירועים</button>
        </div>
        <div className="fields-grid">
          <Field label="שם האירוע" value={eventData.name} onChange={(value) => onChange("name", value)} placeholder="חתונת נועה ודניאל" />
          <Field label="לקוח / משפחה" value={eventData.clientName} onChange={(value) => onChange("clientName", value)} placeholder="משפחת כהן-לוי" />
          <Field label="תאריך האירוע" type="date" value={eventData.date} onChange={(value) => onChange("date", value)} />
          <Field label="מקום האירוע" value={eventData.venue} onChange={(value) => onChange("venue", value)} placeholder="גן / אולם" />
          <Field label="כמות אורחים משוערת" type="number" value={eventData.estimatedGuests} onChange={(value) => onChange("estimatedGuests", value)} placeholder="250" />
          <Field label="סטטוס" value={eventData.status} onChange={(value) => onChange("status", value)} placeholder="טיוטה" />
        </div>
        <label className="field textarea-field">
          <span>הדבקת מידע גולמי</span>
          <textarea value={eventData.rawInfo} onChange={(event) => onChange("rawInfo", event.target.value)} placeholder="הדביקו כאן רשימות אורחים, ספקים, תקציב, סיכונים והערות..." />
        </label>
        <div className="form-actions">
          <button className="secondary-button" type="button" onClick={onSample}>טען דוגמת דמו</button>
          <button className="primary-button" type="button" onClick={onOrganize}>
            <Sparkles size={18} />
            ארגן מידע אירוע
          </button>
        </div>
      </div>
    </section>
  );
}

function Workspace(props) {
  const {
    activeTab,
    eventData,
    isGenerating,
    onBack,
    onGenerate,
    onOpenRegistry,
    onTab,
    preview,
    stats,
    workbookReady,
  } = props;
  return (
    <section className="workspace-shell">
      <aside className="workspace-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small"><FileSpreadsheet size={20} /></div>
          <div>
            <strong>EventSheet AI</strong>
            <span>מרחב תכנון</span>
          </div>
        </div>
        <div className="active-event">
          <span>אירוע פעיל</span>
          <strong>{eventData.name || "אירוע ללא שם"}</strong>
          <small>{eventData.date || "ללא תאריך"}</small>
          <small className="event-id-label">{eventData.eventId}</small>
        </div>
        <nav className="side-nav" aria-label="ניווט תצוגת אירוע">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.id} className={activeTab === item.id ? "active" : ""} type="button" onClick={() => onTab(item.id)}>
                <Icon size={18} />
                {item.label}
              </button>
            );
          })}
        </nav>
        <button className="outline-button sidebar-download" type="button" onClick={onGenerate} disabled={isGenerating}>
          <Download size={18} />
          {isGenerating ? "מפיק..." : "הפק חוברת Excel"}
        </button>
      </aside>
      <div className="workspace-main">
        <header className="workspace-header">
          <div className="header-actions">
            <button className="text-button" type="button" onClick={onBack}>חזור להזנה</button>
            <button className="text-button" type="button" onClick={onOpenRegistry}>כל האירועים</button>
          </div>
          <div>
            <p className="eyebrow">רשומת אירוע שמורה</p>
            <h1>{eventData.name || "אירוע ללא שם"}</h1>
            <div className="event-meta">
              <span><CalendarDays size={15} />{eventData.date || "ללא תאריך"}</span>
              <span><MapPin size={15} />{eventData.venue || "ללא מקום"}</span>
              <span><Users size={15} />{eventData.estimatedGuests || stats.guests || 0} אורחים משוערים</span>
            </div>
          </div>
        </header>
        {activeTab === "overview" && <OverviewPanel preview={preview} seatingWithGuests={props.seatingWithGuests} stats={stats} />}
        {activeTab === "guests" && <GuestsPanel {...props} />}
        {activeTab === "seating" && <SeatingPanel {...props} />}
        {activeTab === "suppliers" && <SuppliersPanel {...props} />}
        {activeTab === "risks" && <RisksPanel risks={preview.risks} />}
        {activeTab === "workbook" && <WorkbookPanel isGenerating={isGenerating} onGenerate={onGenerate} workbookReady={workbookReady} eventId={eventData.eventId} />}
      </div>
    </section>
  );
}

function OverviewPanel({ stats, seatingWithGuests, preview }) {
  return (
    <div className="workspace-content">
      <div className="status-grid">
        <StatusCard icon={Users} label="אורחים" value={`${stats.confirmed} / ${stats.guests}`} helper="אישורי הגעה" percent={stats.guests ? stats.confirmed / stats.guests : 0} tone="blue" />
        <StatusCard icon={Armchair} label="הושבה" value={`${stats.seated} / ${stats.guests}`} helper="שובצו לשולחן" percent={stats.guests ? stats.seated / stats.guests : 0} tone="violet" />
        <StatusCard icon={Truck} label="ספקים" value={stats.suppliers} helper="ספקים ברשומה" percent={stats.suppliers ? 1 : 0} tone="green" />
        <StatusCard icon={Wallet} label="תקציב" value={formatCurrency(stats.budget)} helper="עלות מזוהה" percent={stats.budget ? 1 : 0} tone="amber" />
        <StatusCard icon={ShieldAlert} label="סיכונים" value={stats.risks} helper="פתוחים לטיפול" percent={stats.risks ? 1 : 0} tone="red" />
      </div>
      {preview.risks.length > 0 && (
        <div className="risk-banner">
          <AlertTriangle size={22} />
          <div>
            <strong>{preview.risks.length} סיכונים פתוחים</strong>
            <span>מנהל האירוע נדרש לבדוק ולאשר לפני ההפקה.</span>
          </div>
        </div>
      )}
      <div className="two-column">
        <section className="panel-card">
          <PanelTitle title="מצב הושבה" subtitle="שולחנות שהוגדרו בפועל" />
          <div className="mini-seating-grid">
            {seatingWithGuests.length ? seatingWithGuests.slice(0, 6).map((table) => <MiniTableCard key={table.table} table={table} />) : <EmptyState compact text="טרם הוגדרו שולחנות אמיתיים" />}
          </div>
        </section>
        <section className="panel-card">
          <PanelTitle title="פילוח אורחים לפי קטגוריה" subtitle="מתעדכן מהרשומה" />
          <CategoryBars categories={stats.categories} total={Math.max(stats.guests, 1)} />
        </section>
      </div>
    </div>
  );
}

function GuestsPanel({ categories, filteredGuestEntries, guestQuery, manualAssignError, newGuest, onAddGuest, onDeleteGuest, onGuestQuery, onNewGuestChange, onSelectedCategory, onUpdateGuest, selectedCategory, stats }) {
  return (
    <div className="workspace-content">
      <SectionHeader title="אורחים" subtitle={`${stats.guests} אורחים · ${stats.confirmed} אישרו · ${stats.seated} שובצו`} />
      {manualAssignError && <div className="recommendation-warning apply-error"><p>{manualAssignError}</p></div>}
      <div className="search-shell">
        <Search size={18} />
        <input value={guestQuery} onChange={(event) => onGuestQuery(event.target.value)} placeholder="חיפוש לפי שם, קטגוריה, שולחן או סטטוס..." />
      </div>
      <div className="chip-row">
        <button className="chip-button" type="button" onClick={() => onSelectedCategory("all")}><Chip active={selectedCategory === "all"}>הכל ({stats.guests})</Chip></button>
        {categories.map((category) => (
          <button className="chip-button" key={category} type="button" onClick={() => onSelectedCategory(category)}>
            <Chip active={selectedCategory === category}>{category} ({stats.categories[category]})</Chip>
          </button>
        ))}
      </div>
      <ManualGuestForm guest={newGuest} onAdd={onAddGuest} onChange={onNewGuestChange} categories={categories} />
      <div className="editable-list-card">
        {filteredGuestEntries.length ? filteredGuestEntries.map(({ guest, index }) => (
          <EditableGuestRow key={`${guest.name}-${index}`} guest={guest} index={index} onDelete={onDeleteGuest} onUpdate={onUpdateGuest} categories={categories} />
        )) : <EmptyState text="לא זוהו אורחים — לעדכון ידני" />}
      </div>
    </div>
  );
}

function ManualGuestForm({ categories, guest, onAdd, onChange }) {
  return (
    <section className="manual-guest-card">
      <div className="manual-guest-title">
        <h3>הוסף אורח</h3>
        <span>נשמר ברשומת האירוע</span>
      </div>
      <div className="manual-guest-grid">
        <Field label="שם" value={guest.name} onChange={(value) => onChange("name", value)} placeholder="שם מלא" />
        <TextOrSelect label="קטגוריה" value={guest.category} options={categories} onChange={(value) => onChange("category", value)} placeholder="חבר גרעין / לימודים / משפחה" />
        <Field label="צד" value={guest.side} onChange={(value) => onChange("side", value)} placeholder="צד הכלה / צד החתן" />
        <SelectField label="סטטוס הגעה" value={guest.status} options={rsvpOptions} onChange={(value) => onChange("status", value)} />
        <Field label="שולחן" type="number" value={guest.table} onChange={(value) => onChange("table", value)} placeholder="0" />
        <Field label="תזונה" value={guest.dietary} onChange={(value) => onChange("dietary", value)} placeholder="ללא / טבעוני / אלרגיה" />
        <Field label="הערות" value={guest.notes} onChange={(value) => onChange("notes", value)} placeholder="קבוצות, קשרים, רגישויות" />
      </div>
      <button className="secondary-button add-guest-button" type="button" onClick={onAdd}>הוסף אורח</button>
    </section>
  );
}

function EditableGuestRow({ categories, guest, index, onDelete, onUpdate }) {
  return (
    <article className="editable-row guest-edit-row">
      <Field label="שם" value={guest.name || ""} onChange={(value) => onUpdate(index, "name", value)} />
      <SelectField label="סטטוס" value={guest.status || "טרם השיב"} options={rsvpOptions} onChange={(value) => onUpdate(index, "status", value)} />
      <TextOrSelect label="קטגוריה" value={guest.category || ""} options={categories} onChange={(value) => onUpdate(index, "category", value)} />
      <Field label="צד" value={guest.side || ""} onChange={(value) => onUpdate(index, "side", value)} />
      <Field label="שולחן" type="number" value={guest.table || ""} onChange={(value) => onUpdate(index, "table", value)} />
      <Field label="תזונה" value={guest.dietary || ""} onChange={(value) => onUpdate(index, "dietary", value)} />
      <Field label="הערות" value={guest.notes || ""} onChange={(value) => onUpdate(index, "notes", value)} />
      <button className="icon-button danger" type="button" onClick={() => onDelete(index)} aria-label="מחק אורח"><Trash2 size={17} /></button>
    </article>
  );
}

function SeatingPanel(props) {
  const {
    applyError,
    eventData,
    manualAssignError,
    newTable,
    onAddTable,
    onApplySeatingRecommendations,
    onAssignSelectedGuests,
    onCalculateSeatingRecommendations,
    onClearSeatingRecommendations,
    onDeleteTable,
    onNewTableChange,
    onRemoveGuestFromTable,
    onToggleGuestSelection,
    onUpdateTable,
    preview,
    selectedGuestIndexes,
    selectedTableId,
    setSelectedTableId,
    seatingWithGuests,
  } = props;
  const hasRealTables = seatingWithGuests.length > 0;
  const displayTables = hasRealTables ? seatingWithGuests : visualTemplateTables;
  const selectedTable = displayTables.find((table) => Number(table.table) === Number(selectedTableId)) || displayTables[0];
  const unassignedGuests = preview.guests.map((guest, index) => ({ guest, index })).filter(({ guest }) => !Number(guest.table));
  const seatingMetrics = getSeatingMetrics(preview.guests, preview.seating);
  const seatingPlan = preview.seatingPlan || null;
  const recommendations = seatingPlan?.notes?.length ? seatingPlan.notes : preview.seatingRecommendations || [];
  const shouldShowPastEventNotice = isPastEventDate(eventData.date);

  return (
    <div className="workspace-content seating-workspace-content">
      <SectionHeader title="הושבה" subtitle={hasRealTables ? `${seatingWithGuests.length} שולחנות אמיתיים · ${unassignedGuests.length} אורחים ללא שולחן` : "תבנית ויזואלית בלבד — טרם הוגדרו שולחנות אמיתיים"} />
      {shouldShowPastEventNotice && <div className="canvas-status-notice subtle">האירוע כבר עבר · פריסת ההושבה מוצגת לעיון בלבד</div>}
      <SeatingSummaryStrip metrics={seatingMetrics} />
      {!hasRealTables && <div className="seating-empty-guidance">עדיין לא הוגדרו שולחנות. הוסיפו שולחנות וקיבולת כדי להתחיל שיבוץ.</div>}
      <SeatingRecommendationPanel
        applyError={applyError}
        hasRealTables={hasRealTables}
        onApply={onApplySeatingRecommendations}
        onCalculate={onCalculateSeatingRecommendations}
        onClear={onClearSeatingRecommendations}
        plan={seatingPlan}
      />
      <div className="seating-map-layout">
        <aside className="table-object-panel">
          <div className="object-panel-head">
            <strong>שולחנות</strong>
            <span>{hasRealTables ? `${displayTables.length} אמיתיים` : "תבנית בלבד"}</span>
          </div>
          <div className="table-add-form">
            <Field label="מס׳" type="number" value={newTable.table} onChange={(value) => onNewTableChange("table", value)} placeholder={String(nextTableNumber(preview.seating))} />
            <Field label="קיבולת" type="number" value={newTable.capacity} onChange={(value) => onNewTableChange("capacity", value)} />
            <Field label="קטגוריה" value={newTable.category} onChange={(value) => onNewTableChange("category", value)} placeholder="משפחה / חברים" />
            <Field label="סוג" value={newTable.type} onChange={(value) => onNewTableChange("type", value)} placeholder="עגול / אבירים" />
            <Field label="אזור" value={newTable.zone} onChange={(value) => onNewTableChange("zone", value)} placeholder="אולם / גן" />
            <button className="secondary-button" type="button" onClick={onAddTable}><Plus size={16} />הוסף שולחן</button>
          </div>
          <div className="object-list">
            {displayTables.map((table) => <TableInventoryItem isSelected={Number(table.table) === Number(selectedTable?.table)} key={table.table} onClick={() => setSelectedTableId(table.table)} table={table} />)}
          </div>
        </aside>
        <section className="seating-canvas-card">
          <div className="canvas-toolbar">
            <div>
              <strong>מפת הושבה</strong>
              <span>{hasRealTables ? "שולחנות מתוך רשומת האירוע" : "תבנית תצוגה בלבד — לא תיוצא לאקסל כשולחנות אמיתיים"}</span>
            </div>
            <Chip tone="blue">{seatingWithGuests.reduce((sum, table) => sum + table.guests.length, 0)} משובצים</Chip>
          </div>
          <div className="venue-canvas" aria-label="מפת הושבה סכמטית">
            <div className="canvas-zone garden">גן / קבלת פנים</div>
            <div className="canvas-zone hall">אולם מרכזי</div>
            <div className="canvas-zone path">ציר מעבר</div>
            <div className="canvas-landmark chuppah">חופה</div>
            <div className="canvas-landmark dance">רחבת ריקודים</div>
            <div className="canvas-landmark bar">בר</div>
            <div className="canvas-landmark entrance">כניסה</div>
            <div className="canvas-landmark restrooms">שירותים</div>
            {displayTables.map((table, index) => (
              <SeatingMapTable
                index={index}
                isSelected={Number(table.table) === Number(selectedTable?.table)}
                key={table.table}
                onClick={() => setSelectedTableId(table.table)}
                table={table}
              />
            ))}
          </div>
        </section>
        <SelectedTablePanel
          hasRealTables={hasRealTables}
          manualAssignError={manualAssignError}
          onAssignSelectedGuests={onAssignSelectedGuests}
          onDeleteTable={onDeleteTable}
          onRemoveGuestFromTable={onRemoveGuestFromTable}
          onToggleGuestSelection={onToggleGuestSelection}
          onUpdateTable={onUpdateTable}
          recommendations={recommendations}
          selectedGuestIndexes={selectedGuestIndexes}
          table={selectedTable}
          unassignedGuests={unassignedGuests}
        />
      </div>
    </div>
  );
}

function SeatingSummaryStrip({ metrics }) {
  const gapText = metrics.capacityGap >= 0 ? `עודף ${metrics.capacityGap}` : `חסרים ${Math.abs(metrics.capacityGap)}`;
  const gapTone = metrics.capacityGap >= 0 ? "green" : "red";
  return (
    <section className="seating-summary-strip">
      <div><span>שולחנות</span><strong>{metrics.totalTables}</strong></div>
      <div><span>קיבולת</span><strong>{metrics.totalCapacity}</strong></div>
      <div><span>מגיעים</span><strong>{metrics.confirmedGuests}</strong></div>
      <div><span>משובצים</span><strong>{metrics.seatedGuests}</strong></div>
      <div><span>מגיעים ללא שולחן</span><strong>{metrics.unseatedConfirmed}</strong></div>
      <div><span>פער קיבולת</span><strong className={`metric-${gapTone}`}>{gapText}</strong></div>
      <div><span>חריגות קיבולת</span><strong className={metrics.overCapacityTables ? "metric-red" : "metric-green"}>{metrics.overCapacityTables}</strong></div>
    </section>
  );
}

function SeatingRecommendationPanel({ applyError, hasRealTables, onApply, onCalculate, onClear, plan }) {
  return (
    <section className="seating-recommendation-panel">
      <div className="recommendation-panel-head">
        <div>
          <strong>המלצות הושבה לפי קבוצות</strong>
          <span>המערכת מציעה שיבוץ. הזוג או מנהל האירוע מאשרים ומחליטים.</span>
          {plan?.appliedAt && <small className="applied-at-label">הוחל: {formatDateTime(plan.appliedAt)}</small>}
        </div>
        <div className="recommendation-actions">
          <button className="secondary-button" type="button" disabled={!hasRealTables} onClick={() => onCalculate(false)}>חשב המלצות הושבה</button>
          <button className="outline-button" type="button" disabled={!hasRealTables} onClick={() => onCalculate(true)}>חשב מחדש כולל שיבוצים קיימים</button>
          <button className="primary-button" type="button" disabled={!plan?.assignments?.length} onClick={onApply}>החל שיבוץ אוטומטי</button>
          <button className="text-button" type="button" disabled={!plan} onClick={onClear}>נקה המלצות</button>
        </div>
      </div>
      {applyError && (
        <div className="recommendation-warning apply-error">
          {applyError.split("\n").map((line, i) => <p key={i}>{line}</p>)}
        </div>
      )}
      {plan ? (
        <div className="recommendation-list">
          {(plan.recommendations || []).length ? plan.recommendations.map((recommendation) => (
            <article className={`recommendation-card ${recommendation.status}`} key={`${recommendation.category}-${recommendation.tables.join("-")}`}>
              <div>
                <strong>{recommendation.category}</strong>
                <span>{recommendation.guestCount} אורחים · {recommendation.status === "together" ? "הקבוצה נשארת יחד" : recommendation.status === "split" ? "פיצול מומלץ" : "דורש טיפול"}</span>
              </div>
              <Chip tone={recommendation.status === "noCapacity" ? "red" : recommendation.status === "split" ? "amber" : "green"}>
                {recommendation.tables.length ? recommendation.tables.map((table) => `שולחן ${table}`).join(", ") : "אין קיבולת"}
              </Chip>
              <p>{recommendation.text}</p>
              {recommendation.mixed && <small>יש ערבוב קבוצות בשולחן — לבדיקה ידנית.</small>}
              {recommendation.warning && <small>{recommendation.warning}</small>}
            </article>
          )) : <EmptyState compact text="אין עדיין המלצות. לחצו על חישוב המלצות לאחר הגדרת שולחנות וקיבולת." />}
          {(plan.warnings || []).map((warning) => <div className="recommendation-warning" key={warning}>{warning}</div>)}
          {plan.unassignedGuests?.length > 0 && (
            <div className="recommendation-warning">
              לא שובצו {plan.unassignedGuests.length} אורחים מאשרים — אין קיבולת מספיקה: {plan.unassignedGuests.map((g) => g.name).join(", ")}
            </div>
          )}
          {plan.pendingGuests?.length > 0 && <div className="recommendation-warning muted">טרם השיבו — לא שובצו: {plan.pendingGuests.map((guest) => guest.name).join(", ")}</div>}
        </div>
      ) : (
        <EmptyState compact text={hasRealTables ? "לחצו על חישוב המלצות כדי לקבל הצעת שיבוץ לפי קטגוריות." : "הוסיפו שולחנות אמיתיים לפני חישוב המלצות."} />
      )}
    </section>
  );
}

function TableInventoryItem({ isSelected, onClick, table }) {
  const occupied = table.guests?.length || 0;
  const percent = table.capacity ? Math.min(100, Math.round((occupied / table.capacity) * 100)) : 0;
  const statusTone = table.visualOnly ? "template" : percent >= 100 ? "full" : percent > 0 ? "active" : "empty";
  return (
    <button className={`object-item ${isSelected ? "selected" : ""}`} type="button" onClick={onClick}>
      <span className={`object-status ${statusTone}`} />
      <span>{table.label}</span>
      <small>{table.visualOnly ? "תבנית" : getDominantCategory(table.guests, table.category)}</small>
      <strong>{occupied}/{table.capacity}</strong>
    </button>
  );
}

function SeatingMapTable({ index, isSelected, onClick, table }) {
  const occupied = table.guests?.length || 0;
  const percent = table.capacity ? Math.min(100, Math.round((occupied / table.capacity) * 100)) : 0;
  const position = getTablePosition(index);
  const shape = table.shape || position.shape || (Number(table.capacity) > 12 ? "long" : "round");
  return (
    <button className={`map-table ${shape} ${isSelected ? "selected" : ""} ${table.visualOnly ? "template" : ""}`} style={{ "--seat-fill": `${percent}%`, insetInlineStart: position.x, top: position.y }} type="button" onClick={onClick}>
      <span className="map-table-number">{table.table}</span>
      <strong>{occupied}/{table.capacity}</strong>
      <em>{table.visualOnly ? "תבנית" : getDominantCategory(table.guests, table.category)}</em>
      <i />
    </button>
  );
}

function SelectedTablePanel({ hasRealTables, manualAssignError, onAssignSelectedGuests, onDeleteTable, onRemoveGuestFromTable, onToggleGuestSelection, onUpdateTable, recommendations, selectedGuestIndexes, table, unassignedGuests }) {
  if (!table) return <aside className="selected-table-panel"><EmptyState compact text="לא נבחר שולחן" /></aside>;
  const occupied = table.guests?.length || 0;
  const percent = table.capacity ? Math.min(100, Math.round((occupied / table.capacity) * 100)) : 0;
  const tableNumber = Number(table.table);
  const noteList = recommendations.length ? recommendations : ["בחר שולחן או הוסף אורחים כדי לקבל המלצות הושבה"];
  return (
    <aside className="selected-table-panel">
      <div className="selected-panel-head">
        <span>{table.visualOnly ? "תבנית ויזואלית" : "שולחן נבחר"}</span>
        <h3>{table.label}</h3>
      </div>
      <div className="selected-stat"><strong>{occupied}/{table.capacity}</strong><span>תפוסה</span></div>
      <Progress value={percent} />
      {hasRealTables && !table.visualOnly && (
        <div className="selected-edit-fields">
          <Field label="שם שולחן" value={table.label || ""} onChange={(value) => onUpdateTable(tableNumber, "label", value)} />
          <Field label="קיבולת" type="number" value={table.capacity || ""} onChange={(value) => onUpdateTable(tableNumber, "capacity", value)} />
          <Field label="קטגוריה" value={table.category || ""} onChange={(value) => onUpdateTable(tableNumber, "category", value)} />
          <Field label="סוג" value={table.type || ""} onChange={(value) => onUpdateTable(tableNumber, "type", value)} />
          <Field label="אזור" value={table.zone || ""} onChange={(value) => onUpdateTable(tableNumber, "zone", value)} />
          <button className="outline-button danger-outline" type="button" onClick={() => onDeleteTable(tableNumber)}>מחק שולחן</button>
        </div>
      )}
      <div className="selected-guests">
        <strong>אורחים משובצים</strong>
        {table.guests?.length ? table.guests.map((guest) => (
          <div className="selected-guest" key={guest._index ?? guest.name}>
            <span>{guest.name}</span>
            <button className="text-button tiny" type="button" onClick={() => onRemoveGuestFromTable(guest._index)}>הסר</button>
          </div>
        )) : <em>אין אורחים משובצים</em>}
      </div>
      <div className="selected-guests unassigned-guests">
        <strong>אורחים ללא שולחן ({unassignedGuests.length})</strong>
        {unassignedGuests.length ? unassignedGuests.slice(0, 8).map(({ guest, index }) => (
          <label className="selected-guest checkbox-row" key={`unassigned-${guest.name}-${index}`}>
            <input type="checkbox" checked={selectedGuestIndexes.includes(index)} onChange={() => onToggleGuestSelection(index)} />
            <span>{guest.name}</span>
            <small>{guest.category || "כללי"}</small>
          </label>
        )) : <em>אין אורחים ללא שולחן</em>}
        {manualAssignError && <div className="recommendation-warning apply-error"><p>{manualAssignError}</p></div>}
        <button className="primary-button compact" type="button" onClick={onAssignSelectedGuests} disabled={!hasRealTables || table.visualOnly || selectedGuestIndexes.length === 0}>שבץ לשולחן</button>
      </div>
      <div className="selected-notes">
        <strong>הערות והמלצות</strong>
        {noteList.map((note) => <p key={note}>{note}</p>)}
        <p>המלצה בלבד — מנהל האירוע מחליט</p>
      </div>
    </aside>
  );
}

function SuppliersPanel({ newSupplier, onAddSupplier, onDeleteSupplier, onNewSupplierChange, onUpdateSupplier, preview, stats }) {
  return (
    <div className="workspace-content">
      <SectionHeader title="ספקים" subtitle={`${preview.suppliers.length} ספקים · ${formatCurrency(stats.budget)} תקציב מזוהה`} />
      <div className="budget-strip">
        <span>תקציב ספקים וסעיפים</span>
        <strong>{formatCurrency(stats.budget)}</strong>
        <div><i style={{ width: stats.budget ? "100%" : "0%" }} /></div>
      </div>
      <SupplierForm supplier={newSupplier} onAdd={onAddSupplier} onChange={onNewSupplierChange} />
      <div className="editable-list-card">
        {preview.suppliers.length ? preview.suppliers.map((supplier, index) => (
          <EditableSupplierRow key={`${supplier.name}-${index}`} supplier={supplier} index={index} onDelete={onDeleteSupplier} onUpdate={onUpdateSupplier} />
        )) : <EmptyState text="לא זוהו ספקים — לעדכון ידני" />}
      </div>
    </div>
  );
}

function SupplierForm({ supplier, onAdd, onChange }) {
  return (
    <section className="manual-guest-card">
      <div className="manual-guest-title"><h3>הוסף ספק</h3><span>נשמר ברשומת האירוע ומיוצא לאקסל</span></div>
      <div className="manual-guest-grid">
        <Field label="תחום" value={supplier.category} onChange={(value) => onChange("category", value)} placeholder="קייטרינג / צילום / דיג׳יי" />
        <Field label="שם ספק" value={supplier.name} onChange={(value) => onChange("name", value)} />
        <Field label="איש קשר" value={supplier.contact} onChange={(value) => onChange("contact", value)} />
        <Field label="טלפון" value={supplier.phone} onChange={(value) => onChange("phone", value)} />
        <Field label="אימייל" value={supplier.email} onChange={(value) => onChange("email", value)} />
        <Field label="עלות חוזה" type="number" value={supplier.amount} onChange={(value) => onChange("amount", value)} />
        <Field label="שולם" type="number" value={supplier.paid} onChange={(value) => onChange("paid", value)} />
        <SelectField label="סטטוס תשלום" value={supplier.status} options={paymentOptions} onChange={(value) => onChange("status", value)} />
        <Field label="תאריך יעד" type="date" value={supplier.dueDate} onChange={(value) => onChange("dueDate", value)} />
        <Field label="הערות" value={supplier.notes} onChange={(value) => onChange("notes", value)} />
      </div>
      <button className="secondary-button add-guest-button" type="button" onClick={onAdd}>הוסף ספק</button>
    </section>
  );
}

function EditableSupplierRow({ index, onDelete, onUpdate, supplier }) {
  const outstanding = Math.max(0, (Number(supplier.amount) || 0) - (Number(supplier.paid) || 0));
  return (
    <article className="editable-row supplier-edit-row">
      <Field label="תחום" value={supplier.category || ""} onChange={(value) => onUpdate(index, "category", value)} />
      <Field label="שם" value={supplier.name || ""} onChange={(value) => onUpdate(index, "name", value)} />
      <Field label="איש קשר" value={supplier.contact || ""} onChange={(value) => onUpdate(index, "contact", value)} />
      <Field label="טלפון" value={supplier.phone || ""} onChange={(value) => onUpdate(index, "phone", value)} />
      <Field label="עלות" type="number" value={supplier.amount || ""} onChange={(value) => onUpdate(index, "amount", value)} />
      <Field label="שולם" type="number" value={supplier.paid || ""} onChange={(value) => onUpdate(index, "paid", value)} />
      <SelectField label="סטטוס" value={supplier.status || "פתוח לתשלום"} options={paymentOptions} onChange={(value) => onUpdate(index, "status", value)} />
      <div className="row-total"><span>יתרה</span><strong>{formatCurrency(outstanding)}</strong></div>
      <button className="icon-button danger" type="button" onClick={() => onDelete(index)} aria-label="מחק ספק"><Trash2 size={17} /></button>
    </article>
  );
}

function RisksPanel({ risks }) {
  const openRisks = risks.filter((risk) => risk.severity !== "נמוכה");
  return (
    <div className="workspace-content">
      <SectionHeader title="סיכונים" subtitle={`${openRisks.length} פתוחים · ${Math.max(risks.length - openRisks.length, 0)} טופלו`} />
      {openRisks.length > 0 && (
        <div className="risk-warning-panel">
          <AlertTriangle size={24} />
          <div><strong>{openRisks.length} סיכונים דורשים בדיקה</strong><span>השלימו טיפול ידני לפני שימוש בחוברת בשטח.</span></div>
        </div>
      )}
      <div className="risk-list">
        {risks.length ? risks.map((risk, index) => <RiskRow key={`${risk.risk}-${index}`} risk={risk} />) : <EmptyState text="לא זוהו סיכונים — לעדכון ידני" />}
      </div>
    </div>
  );
}

function WorkbookPanel({ eventId, isGenerating, onGenerate, workbookReady }) {
  return (
    <div className="workbook-screen">
      <div className="workbook-card">
        <div className="workbook-icon"><FileSpreadsheet size={34} /></div>
        <p className="eyebrow">ספר תכנון</p>
        <h2>{workbookReady ? "החוברת מוכנה" : "חוברת Excel מוכנה להפקה"}</h2>
        <p>12 גיליונות הופקו · קישורים חוזרים לאותו eventId · הרשומה המקומית היא בסיס ההפקה.</p>
        <small className="event-id-label">eventId: {eventId}</small>
        <button className="primary-button large" type="button" onClick={onGenerate} disabled={isGenerating}>
          <Download size={19} />
          {isGenerating ? "מפיק חוברת..." : workbookReady ? "הורד שוב את החוברת" : "הפק חוברת Excel"}
        </button>
        {workbookReady && <div className="ready-note"><CheckCircle2 size={18} /><span>12 גיליונות הופקו</span></div>}
      </div>
    </div>
  );
}

function StatusCard({ helper, icon: Icon, label, percent, tone, value }) {
  const displayPercent = Math.round((percent || 0) * 100);
  return (
    <article className={`status-card ${tone}`}>
      <div className="status-icon"><Icon size={20} /></div>
      <div className="ring" style={{ "--percent": `${displayPercent}%` }}>{displayPercent}%</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </article>
  );
}

function MiniTableCard({ table }) {
  const percent = table.capacity ? Math.min(100, Math.round((table.guests.length / table.capacity) * 100)) : 0;
  return (
    <div className="mini-table-card">
      <div><strong>{table.label}</strong><span>{table.guests.length}/{table.capacity}</span></div>
      <Progress value={percent} />
    </div>
  );
}

function RiskRow({ risk }) {
  return (
    <article className="risk-row">
      <span className="risk-dot" />
      <div><strong>{risk.risk}</strong><span>{risk.action || "בדיקה ידנית"}</span></div>
      <Chip tone={risk.severity === "גבוהה" ? "red" : "amber"}>{risk.severity || "בינונית"}</Chip>
    </article>
  );
}

function CategoryBars({ categories, total }) {
  const entries = Object.entries(categories);
  if (!entries.length) return <EmptyState text="לא זוהו קטגוריות — לעדכון ידני" compact />;
  return (
    <div className="category-bars">
      {entries.map(([category, count]) => (
        <div key={category} className="category-row">
          <Chip tone="violet">{category}</Chip>
          <Progress value={Math.round((count / total) * 100)} />
          <strong>{count}</strong>
        </div>
      ))}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "" }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value || options[0]} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextOrSelect({ label, value, options, onChange, placeholder }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input list={`${label}-options`} value={value || ""} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      <datalist id={`${label}-options`}>
        {options.map((option) => <option key={option} value={option} />)}
      </datalist>
    </label>
  );
}

function SectionHeader({ subtitle, title }) {
  return <div className="section-header"><h2>{title}</h2><p>{subtitle}</p></div>;
}

function PanelTitle({ subtitle, title }) {
  return <div className="panel-title"><h3>{title}</h3><span>{subtitle}</span></div>;
}

function Chip({ active = false, children, tone = "neutral" }) {
  return <span className={`chip ${tone} ${active ? "active" : ""}`}>{children}</span>;
}

function Progress({ value }) {
  return <div className="progress-track"><i style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} /></div>;
}

function EmptyState({ compact = false, text }) {
  return <div className={`empty-state ${compact ? "compact" : ""}`}>{text}</div>;
}

function getStats(preview) {
  const guests = preview.guests.length;
  const confirmed = preview.guests.filter((guest) => guest.status === "מאשר הגעה").length;
  const seated = preview.guests.filter((guest) => Number(guest.table) > 0).length;
  const suppliers = preview.suppliers.length;
  const supplierBudget = preview.suppliers.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const manualBudget = preview.budget.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
  const risks = preview.risks.length;
  const categories = preview.guests.reduce((result, guest) => {
    splitTags(guest.category || "ללא קטגוריה").forEach((key) => { result[key] = (result[key] || 0) + 1; });
    return result;
  }, {});
  return { budget: supplierBudget + manualBudget, categories, confirmed, guests, risks, seated, suppliers };
}

function mapSeating(preview) {
  return preview.seating.map((table) => ({
    ...table,
    guests: preview.guests
      .map((guest, index) => ({ ...guest, _index: index }))
      .filter((guest) => Number(guest.table) === Number(table.table)),
  }));
}

function refreshRecommendations(preview) {
  const seatingRecommendations = generateSeatingRecommendations(preview.guests);
  return {
    ...preview,
    seatingRecommendations,
    finalBrief: appendRecommendationNotes(preview.finalBrief, seatingRecommendations),
  };
}

function normalizePreviewForApp(preview) {
  return {
    ...createEmptyPreview(),
    ...preview,
    guests: Array.isArray(preview.guests) ? preview.guests : [],
    seating: Array.isArray(preview.seating) ? preview.seating : [],
    suppliers: Array.isArray(preview.suppliers) ? preview.suppliers : [],
    budget: Array.isArray(preview.budget) ? preview.budget : [],
    risks: Array.isArray(preview.risks) ? preview.risks : [],
    seatingRecommendations: Array.isArray(preview.seatingRecommendations) ? preview.seatingRecommendations : [],
    seatingPlan: preview.seatingPlan || null,
  };
}

function splitTags(value) {
  return String(value || "").split(/,|،|\/|\|/).map((part) => part.trim()).filter(Boolean);
}

function isPastEventDate(value) {
  if (!value) return false;
  const eventDate = new Date(`${value}T00:00:00`);
  if (Number.isNaN(eventDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate < today;
}

function getDominantCategory(guests = [], fallback = "ללא קטגוריה") {
  const counts = guests.reduce((result, guest) => {
    splitTags(guest.category || fallback || "ללא קטגוריה").forEach((category) => { result[category] = (result[category] || 0) + 1; });
    return result;
  }, {});
  return Object.entries(counts).sort((first, second) => second[1] - first[1])[0]?.[0] || fallback || "ללא קטגוריה";
}

function getTablePosition(index) {
  const positions = [
    { x: "77%", y: "16%", shape: "long" },
    { x: "65%", y: "16%", shape: "long" },
    { x: "53%", y: "16%", shape: "long" },
    { x: "80%", y: "42%", shape: "round" },
    { x: "66%", y: "43%", shape: "round" },
    { x: "51%", y: "45%", shape: "round" },
    { x: "75%", y: "68%", shape: "round" },
    { x: "60%", y: "70%", shape: "round" },
    { x: "44%", y: "68%", shape: "round" },
    { x: "28%", y: "30%", shape: "long" },
    { x: "28%", y: "58%", shape: "long" },
    { x: "38%", y: "33%", shape: "round" },
  ];
  return positions[index % positions.length];
}

function nextTableNumber(seating) {
  const max = seating.reduce((result, table) => Math.max(result, Number(table.table) || 0), 0);
  return max + 1;
}

function emptyGuest() {
  return { name: "", category: "", side: "", status: "טרם השיב", table: "", dietary: "", notes: "" };
}

function emptySupplier() {
  return { category: "", name: "", contact: "", phone: "", email: "", amount: "", paid: "", status: "פתוח לתשלום", dueDate: "", notes: "" };
}

function appendRecommendationNotes(brief, recommendations) {
  const base = brief || "בריף תפעולי";
  if (!recommendations?.length) return base;
  const cleanBase = base.split("המלצות הושבה לבדיקה:")[0].trim();
  return [cleanBase, "", "המלצות הושבה לבדיקה:", ...recommendations.map((note) => `- ${note}`)].join("\n");
}

function formatCurrency(value) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(value || 0);
}

function formatDateTime(value) {
  if (!value) return "לא ידוע";
  try {
    return new Intl.DateTimeFormat("he-IL", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
  } catch {
    return value;
  }
}

createRoot(document.getElementById("root")).render(<App />);
