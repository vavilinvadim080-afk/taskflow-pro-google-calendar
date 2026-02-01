
```javascript
/**
 * TaskFlow Pro - Automated Task Management System
 * v8.3 Open Source Edition
 * 
 * SETUP INSTRUCTIONS:
 * 1. Update the CONFIG object below with your Calendar names.
 * 2. Ensure your Google Sheet is empty or has a sheet named in CONFIG.SHEET_NAME.
 */

// ==========================================
// ⚙️ CONFIGURATION (USER SETTINGS)
// ==========================================
const CONFIG = {
  // Names of calendars to fetch events from
  // name: Your Google Calendar name
  // type: Internal type (Task, Event, Class)
  // color: Hex color for the spreadsheet row
  CALENDARS: [
    { name: "Tasks",       type: "Задача",      color: "#10b981" }, // Change "Tasks" to your calendar name
    { name: "Events",      type: "Мероприятие", color: "#f3f4f6" }, // Change "Events" to your calendar name
    { name: "University",  type: "Пара",        color: "#dbeafe" }  // Change "University" to your calendar name
  ],

  // Settings for the main sheet
  SHEET_NAME: "Задачи", // Name of the main tab
  ASSISTANT_SHEET_NAME: "Помощник", // Name of the analysis tab
  
  // Keywords to look for in Calendar Description
  KEYWORDS: {
    STATUS_DONE: "статус: готово",
    STATUS_PAUSE: "статус: отложено",
    PRIORITY_CRITICAL: "приоритет: критический",
    PRIORITY_HIGH: "приоритет: высокий"
  },

  // Priority Colors
  PRIORITY_COLORS: {
    "Критический": "#ef4444",
    "Высокий": "#f97316",
    "Средний": "#f59e0b",
    "Низкий": "#10b981",
    "Неопределённый": "#d1d5db"
  },

  // Workload settings
  WORK_HOURS_WEEKDAY: 8,
  WORK_HOURS_WEEKEND: 4
};

// ==========================================
// 🚀 MAIN LOGIC
// ==========================================

function importCalendarEventsToSheet() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // Create sheet if not exists
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    } else {
      sheet.activate();
    }

    // Preserve existing manual data (Status, Priority, etc.)
    const sheetData = sheet.getDataRange().getValues();
    const sheetDataMap = createDataMap(sheetData);

    const startDate = new Date();
    const endDate = new Date(new Date().setFullYear(new Date().getFullYear() + 1));
    const allEvents = [];
    let processedEvents = 0;

    // Iterate through configured calendars
    for (let config of CONFIG.CALENDARS) {
      const calendars = CalendarApp.getCalendarsByName(config.name);
      
      if (calendars.length === 0) {
        console.warn(`⚠️ Calendar '${config.name}' not found. Check CONFIG.`);
        continue;
      }

      const calendar = calendars[0];
      const events = calendar.getEvents(startDate, endDate);
      Logger.log(`🔍 Found ${events.length} events in '${config.name}'`);

      for (let event of events) {
        // --- Process Event Data ---
        const title = event.getTitle().trim() || "Untitled";
        const startTime = event.getStartTime();
        const endTime = event.getEndTime();
        const description = (event.getDescription() || "").toLowerCase();
        
        // Key for mapping existing data
        const key = createEventKey(title, startTime);
        const existingRow = sheetDataMap[key];

        // Default Values
        let status = "В работе";
        let priority = "Неопределённый";
        let recommendation = "";
        let conflict = "";

        // Restore Manual Overrides
        if (existingRow) {
          status = existingRow.status || "В работе";
          priority = existingRow.priority || "Неопределённый";
        } else {
          // Auto-detect from Description
          if (description.includes(CONFIG.KEYWORDS.STATUS_DONE)) status = "Готово";
          if (description.includes(CONFIG.KEYWORDS.PRIORITY_CRITICAL)) priority = "Критический";
          else if (description.includes(CONFIG.KEYWORDS.PRIORITY_HIGH)) priority = "Высокий";
        }

        // Calculations
        const daysLeft = Math.ceil((startTime - new Date()) / (1000 * 60 * 60 * 24));
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        
        // Determine Urgency Label
        let urgency = getUrgencyLabel(daysLeft);

        // Occupancy Calc
        let dayOccupancy = calculateDayOccupancySimple(allEvents, startTime);
        let taskDayOccupancy = 0;
        
        if (config.type === "Задача") {
           const dailyLimit = isWeekend(startTime) ? CONFIG.WORK_HOURS_WEEKEND : CONFIG.WORK_HOURS_WEEKDAY;
           taskDayOccupancy = Math.min(100, Math.round((durationHours / dailyLimit) * 100));
        }

        // Add to list
        allEvents.push([
          config.type,
          title,
          new Date(), // Created At (Mock)
          startTime,
          daysLeft,
          status,
          urgency,
          priority,
          CONFIG.PRIORITY_COLORS[priority] || "#ccc",
          recommendation,
          conflict,
          0, // Meeting Count (Placeholder)
          0, // Class Count (Placeholder)
          dayOccupancy,
          "", // Time Tip
          taskDayOccupancy
        ]);
      }
    }

    // Write to Sheet
    if (allEvents.length > 0) {
      sheet.clearContents();
      
      // Headers
      const headers = ["Тип", "Название", "Дата создания", "Дедлайн", "Дней", "Статус", "Спешка", "Приоритет", "Цвет", "Совет", "Конфликт", "Встречи", "Пары", "Загрузка Дня %", "Совет дня", "Загрузка Задачи %"];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
      
      // Data
      sheet.getRange(2, 1, allEvents.length, allEvents[0].length).setValues(allEvents);
      
      // Formatting
      sheet.getRange(2, 4, allEvents.length, 1).setNumberFormat("dd.MM.yyyy HH:mm");
      applyConditionalFormatting(sheet, allEvents.length);
    }
    
    // Generate Assistant Dashboard
    createTimeManagementAssistantSheet(allEvents);
    
    Logger.log("✅ Sync Complete!");

  } catch (e) {
    Logger.log("❌ Error: " + e.toString());
  }
}

// ==========================================
// 🛠 HELPER FUNCTIONS
// ==========================================

function getUrgencyLabel(days) {
  if (days < 0) return "🔥 ПРОСРОЧЕНО!";
  if (days === 0) return "⏰ СЕГОДНЯ!";
  if (days <= 3) return "🚨 Срочно";
  return "🟢 Норма";
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function createDataMap(data) {
  const map = {};
  if (data.length < 2) return map;
  // Map logic to preserve user inputs
  // Assumes Title is col 1, Date is col 3
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = createEventKey(row[1], row[3]);
    map[key] = {
      status: row[5],
      priority: row[7]
    };
  }
  return map;
}

function createEventKey(title, date) {
  if (!date || !(date instanceof Date)) return title + "_nodate";
  return title + "_" + date.toISOString();
}

function calculateDayOccupancySimple(events, targetDate) {
  // Simplified occupancy calc for demo
  return 0; 
}

function applyConditionalFormatting(sheet, rows) {
  // Apply logic for colors based on Status column
  const range = sheet.getRange(2, 1, rows, 16);
  range.setBorder(true, true, true, true, true, true, "#e5e7eb", SpreadsheetApp.BorderStyle.SOLID);
}

function createTimeManagementAssistantSheet(events) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.ASSISTANT_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(CONFIG.ASSISTANT_SHEET_NAME);
  sheet.clear();
  
  sheet.appendRow(["📊 DASHBOARD", "", ""]);
  sheet.appendRow(["Total Events", events.length, ""]);
  // Add your detailed charts generation logic here...
}
