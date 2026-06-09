const STATUS_ATTENDING = "מאשר הגעה";
const UNCATEGORIZED = "ללא קטגוריה";

export function buildSeatingRecommendationPlan(guests = [], tables = [], options = {}) {
  const includeExistingAssignments = Boolean(options.includeExistingAssignments);
  const normalizedTables = tables
    .filter((table) => Number(table.table) > 0)
    .map((table) => ({
      table: Number(table.table),
      label: table.label || `שולחן ${table.table}`,
      capacity: Math.max(0, Number(table.capacity) || 0),
      category: table.category || "",
      guests: [],
      remaining: Math.max(0, Number(table.capacity) || 0),
    }))
    .sort((first, second) => first.table - second.table);

  const confirmedGuests = guests
    .map((guest, index) => ({ ...guest, _index: index, category: normalizeCategory(guest.category) }))
    .filter((guest) => isAttending(guest.status));

  const pendingGuests = guests
    .map((guest, index) => ({ ...guest, _index: index, category: normalizeCategory(guest.category) }))
    .filter((guest) => !isAttending(guest.status));

  if (!normalizedTables.length) {
    return {
      generatedAt: new Date().toISOString(),
      includeExistingAssignments,
      assignments: [],
      unassignedGuests: confirmedGuests.map((g) => ({ guestIndex: g._index, name: g.name, category: g.category })),
      recommendations: [],
      notes: ["עדיין לא הוגדרו שולחנות. הוסיפו שולחנות וקיבולת כדי להתחיל שיבוץ."],
      warnings: ["עדיין לא הוגדרו שולחנות."],
      pendingGuests: pendingGuests.map(toGuestSummary),
      summary: buildSummary(guests, normalizedTables, [], pendingGuests, ["עדיין לא הוגדרו שולחנות."]),
    };
  }

  const lockedAssignments = [];
  if (!includeExistingAssignments) {
    confirmedGuests.forEach((guest) => {
      const tableState = normalizedTables.find((table) => table.table === Number(guest.table));
      if (!tableState) return;
      tableState.guests.push(guest);
      tableState.remaining = Math.max(0, tableState.remaining - 1);
      lockedAssignments.push({ guestIndex: guest._index, table: tableState.table, reason: "שיבוץ קיים נשמר" });
    });
  } else {
    confirmedGuests.forEach((guest) => {
      guest.table = 0;
    });
  }

  const candidateGuests = confirmedGuests.filter((guest) => includeExistingAssignments || !Number(guest.table));
  const groups = groupGuestsByCategory(candidateGuests).sort((first, second) => second.guests.length - first.guests.length);
  const recommendations = [];
  const assignments = [];
  const warnings = [];
  const unassignedGuests = [];

  groups.forEach((group) => {
    if (!group.guests.length) return;
    const emptySuitableTable = normalizedTables
      .filter((table) => table.remaining >= group.guests.length && (table.guests.length === 0 || table.category === group.category))
      .sort((first, second) => {
        const firstCategoryScore = first.category === group.category ? 1 : 0;
        const secondCategoryScore = second.category === group.category ? 1 : 0;
        if (firstCategoryScore !== secondCategoryScore) return secondCategoryScore - firstCategoryScore;
        return first.remaining - second.remaining;
      })[0];

    if (emptySuitableTable) {
      placeGuests(group.guests, emptySuitableTable, assignments);
      recommendations.push({
        category: group.category,
        guestCount: group.guests.length,
        tables: [emptySuitableTable.table],
        tableLabels: [emptySuitableTable.label],
        status: "together",
        mixed: emptySuitableTable.guests.length > group.guests.length,
        warning: "",
        text: `מומלץ להושיב את קבוצת '${group.category}' בשולחן ${emptySuitableTable.table} — הקבוצה נכנסת במלואה.`,
      });
      return;
    }

    const splitTables = normalizedTables
      .filter((table) => table.remaining > 0)
      .sort((first, second) => {
        const firstCategoryScore = first.category === group.category ? 1 : 0;
        const secondCategoryScore = second.category === group.category ? 1 : 0;
        if (firstCategoryScore !== secondCategoryScore) return secondCategoryScore - firstCategoryScore;
        return second.remaining - first.remaining;
      });
    const groupAssignments = [];
    let cursor = 0;
    for (const table of splitTables) {
      while (table.remaining > 0 && cursor < group.guests.length) {
        const guest = group.guests[cursor];
        placeGuests([guest], table, assignments);
        groupAssignments.push({ guest, table });
        cursor += 1;
      }
      if (cursor >= group.guests.length) break;
    }

    const usedTables = [...new Set(groupAssignments.map((item) => item.table.table))];
    if (cursor < group.guests.length) {
      const missing = group.guests.length - cursor;
      const warning = `אין מספיק מקומות לקבוצת '${group.category}'. חסרים ${missing} מקומות.`;
      warnings.push(warning);
      group.guests.slice(cursor).forEach((guest) => {
        unassignedGuests.push({ guestIndex: guest._index, name: guest.name, category: guest.category });
      });
      recommendations.push({
        category: group.category,
        guestCount: group.guests.length,
        tables: usedTables,
        tableLabels: usedTables.map((tableNumber) => normalizedTables.find((table) => table.table === tableNumber)?.label || `שולחן ${tableNumber}`),
        status: "noCapacity",
        mixed: usedTables.some((tableNumber) => hasMixedCategories(normalizedTables.find((table) => table.table === tableNumber))),
        warning,
        text: warning,
      });
      return;
    }

    recommendations.push({
      category: group.category,
      guestCount: group.guests.length,
      tables: usedTables,
      tableLabels: usedTables.map((tableNumber) => normalizedTables.find((table) => table.table === tableNumber)?.label || `שולחן ${tableNumber}`),
      status: "split",
      mixed: usedTables.some((tableNumber) => hasMixedCategories(normalizedTables.find((table) => table.table === tableNumber))),
      warning: "",
      text: `קבוצת '${group.category}' כוללת ${group.guests.length} אורחים ולכן מומלץ לפצל בין ${usedTables.map((table) => `שולחן ${table}`).join(" ו-")}.`,
    });
  });

  assertNoTableExceedsCapacity(assignments, normalizedTables);
  const totalCapacity = normalizedTables.reduce((sum, table) => sum + table.capacity, 0);
  const confirmedCount = confirmedGuests.length;
  if (totalCapacity < confirmedCount) warnings.push(`אין מספיק מקומות לכל האורחים. חסרים ${confirmedCount - totalCapacity} מקומות.`);

  const notes = [
    ...recommendations.map((recommendation) => recommendation.text),
    ...warnings,
    pendingGuests.length ? `טרם השיבו — לא שובצו: ${pendingGuests.map((guest) => guest.name).join(", ")}` : "",
    "המלצה בלבד — מנהל האירוע מחליט.",
  ].filter(Boolean);

  return {
    generatedAt: new Date().toISOString(),
    includeExistingAssignments,
    lockedAssignments,
    assignments,
    unassignedGuests,
    recommendations,
    notes,
    warnings,
    pendingGuests: pendingGuests.map(toGuestSummary),
    summary: buildSummary(guests, normalizedTables, assignments, pendingGuests, warnings, recommendations),
  };
}

export function applySeatingRecommendationPlan(guests = [], plan) {
  const assignmentByGuest = new Map((plan?.assignments || []).map((assignment) => [assignment.guestIndex, assignment.table]));
  if (!assignmentByGuest.size) return guests;
  return guests.map((guest, index) => assignmentByGuest.has(index) ? { ...guest, table: assignmentByGuest.get(index) } : guest);
}

export function validateAndApplySeatingPlan(guests = [], tables = [], plan) {
  if (!plan?.assignments?.length) {
    return { ok: false, error: "אין שיבוץ לביצוע. חשבו המלצות הושבה תחילה." };
  }
  const capacities = new Map(
    tables
      .filter((t) => Number(t.table) > 0)
      .map((t) => [Number(t.table), { capacity: Math.max(0, Number(t.capacity) || 0), label: t.label || `שולחן ${t.table}` }])
  );
  const assignedByIndex = new Map((plan.assignments || []).map((a) => [a.guestIndex, Number(a.table)]));
  const countByTable = new Map();
  guests.forEach((guest, index) => {
    const finalTable = assignedByIndex.has(index) ? assignedByIndex.get(index) : Number(guest.table || 0);
    if (!finalTable) return;
    countByTable.set(finalTable, (countByTable.get(finalTable) || 0) + 1);
  });
  const violations = [];
  for (const [tableNum, count] of countByTable.entries()) {
    const def = capacities.get(tableNum);
    if (!def) continue;
    if (count > def.capacity) {
      violations.push(`${def.label}: ${count} אורחים, קיבולת ${def.capacity}`);
    }
  }
  if (violations.length) {
    return { ok: false, error: `לא ניתן להחיל שיבוץ — חריגת קיבולת:\n${violations.join("\n")}` };
  }
  return { ok: true, guests: applySeatingRecommendationPlan(guests, plan) };
}

export function seatingPlanToNotes(plan) {
  return (plan?.notes || []).filter(Boolean);
}

export function getSeatingMetrics(guests = [], tables = []) {
  const confirmedGuests = guests.filter((guest) => isAttending(guest.status));
  const seatedConfirmed = confirmedGuests.filter((guest) => Number(guest.table) > 0);
  const totalCapacity = tables.reduce((sum, table) => sum + (Number(table.capacity) || 0), 0);
  const overCapacityTables = tables.filter((table) => guests.filter((guest) => Number(guest.table) === Number(table.table)).length > (Number(table.capacity) || 0)).length;
  return {
    totalTables: tables.length,
    totalCapacity,
    confirmedGuests: confirmedGuests.length,
    seatedGuests: seatedConfirmed.length,
    unseatedConfirmed: Math.max(0, confirmedGuests.length - seatedConfirmed.length),
    capacityGap: totalCapacity - confirmedGuests.length,
    overCapacityTables,
  };
}

function assertNoTableExceedsCapacity(assignments, tables) {
  for (const table of tables) {
    const count = assignments.filter((a) => a.table === table.table).length;
    if (count > table.capacity) {
      throw new Error(`שגיאה פנימית: שולחן ${table.table} קיבל ${count} אורחים אך קיבולתו ${table.capacity}`);
    }
  }
}

function placeGuests(guests, table, assignments) {
  guests.forEach((guest) => {
    table.guests.push(guest);
    table.remaining = Math.max(0, table.remaining - 1);
    assignments.push({
      guestIndex: guest._index,
      guestName: guest.name,
      category: guest.category,
      table: table.table,
      tableLabel: table.label,
    });
  });
}

function groupGuestsByCategory(guests) {
  const map = new Map();
  guests.forEach((guest) => {
    const category = normalizeCategory(guest.category);
    if (!map.has(category)) map.set(category, { category, guests: [] });
    map.get(category).guests.push(guest);
  });
  return Array.from(map.values());
}

function normalizeCategory(value) {
  const text = String(value || "").trim();
  return text || UNCATEGORIZED;
}

function isAttending(status) {
  const text = String(status || "");
  if (/declined|not_attending|not attending|no/i.test(text)) return false;
  if (/attending|confirmed|yes/i.test(text)) return true;
  if (text.includes("לא")) return false;
  return text.includes(STATUS_ATTENDING) || text.includes("מגיע") || text.includes("מאשר");
}

function hasMixedCategories(table) {
  if (!table) return false;
  return new Set(table.guests.map((guest) => normalizeCategory(guest.category))).size > 1;
}

function toGuestSummary(guest) {
  return {
    guestIndex: guest._index,
    name: guest.name,
    category: normalizeCategory(guest.category),
    status: guest.status || "",
  };
}

function buildSummary(guests, tables, assignments, pendingGuests, warnings, recommendations = []) {
  const metrics = getSeatingMetrics(guests, tables);
  return {
    ...metrics,
    recommendationAssignments: assignments.length,
    pendingGuests: pendingGuests.length,
    warningCount: warnings.length,
    splitGroups: recommendations.filter((recommendation) => recommendation.status === "split").length,
    mixedGroups: recommendations.filter((recommendation) => recommendation.mixed).length,
  };
}
