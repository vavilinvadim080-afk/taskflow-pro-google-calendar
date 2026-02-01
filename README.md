# taskflow-pro-google-calendar
Automated task planning system for Google Calendar &amp; Sheets using Apps Script.
# 📅 TaskFlow Pro (Google Apps Script Task Planner)

**[English]**
TaskFlow Pro is an automated task planning system built on Google Apps Script. It synchronizes events from Google Calendar into a Google Sheet, analyzes your workload, highlights deadlines, and provides AI-like recommendations for time management.

**[Русский]**
TaskFlow Pro — это система автоматического планирования задач на базе Google Apps Script. Скрипт синхронизирует события из Google Календаря в Google Таблицу, анализирует загруженность, подсвечивает дедлайны и дает умные рекомендации по тайм-менеджменту.

---

## 🚀 Features / Возможности

- **Calendar Sync**: Automatically imports tasks, events, and classes from specific Google Calendars.
- **Auto-Prioritization**: Detects keywords like "critical", "high priority" in event descriptions.
- **Workload Analysis**: Calculates daily occupancy percentage based on tasks duration.
- **Deadline Tracking**: Color-coded urgency (Today, Tomorrow, Overdue).
- **Time Management Assistant**: A dedicated dashboard sheet with weekly/monthly stats and specific advice.

## 🛠 Setup / Установка

1. **Google Sheet**: Create a new Google Sheet.
2. **Apps Script**: Go to `Extensions` > `Apps Script`.
3. **Copy Code**: Copy the content of `Code.gs` into the editor.
4. **Config**: Edit the `CONFIG` object at the top of the file:
   - Set your **Calendar Names** (must match your Google Calendars).
   - Customize **Keywords** for status/priority detection.
5. **Run**: Run `importCalendarEventsToSheet()` function.
6. **Triggers**: Set up a time-driven trigger to run every hour/day.

## ⚙️ Configuration Example

```javascript
const CONFIG = {
  // Set your actual calendar names here
  CALENDARS: [
    { name: "My Tasks", type: "Task", color: "#10b981" },
    { name: "Work",     type: "Event", color: "#f3f4f6" },
    { name: "Classes",  type: "Class", color: "#dbeafe" }
  ],
  // ...
};
