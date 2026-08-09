import init, {
  wasm_build_expression,
  wasm_describe_en,
  wasm_describe_zh,
  wasm_get_presets,
  wasm_next_executions,
  wasm_parse_cron,
  wasm_time_zone_database_version,
  wasm_validate_cron
} from "./pkg/cron_maker_web.js";

const messages = {
  en: {
    skipLink: "Skip to workspace",
    title: "Cron Maker",
    subtitle: "Build and inspect schedules without sending expressions anywhere.",
    dialect: "Unix 5-field",
    scheduleControls: "Schedule controls",
    editorMode: "Editor mode",
    visualTab: "Visual",
    expressionTab: "Expression",
    timeZone: "Time zone",
    occurrences: "Occurrences",
    editorHeading: "Schedule editor",
    localOnly: "Browser-local",
    minute: "Minute",
    hour: "Hour",
    dayOfMonth: "Day of month",
    month: "Month",
    dayOfWeek: "Day of week",
    cronExpression: "Cron expression",
    presets: "Presets",
    schedulePresets: "Schedule presets",
    currentExpression: "Current expression",
    copy: "Copy",
    copied: "Copied",
    descriptionHeading: "Description",
    scheduleHeading: "Next occurrences",
    evaluatedIn: "Evaluated in",
    localTime: "Local time",
    relative: "Relative",
    occurrenceTable: "Upcoming cron occurrences",
    timeZoneData: "Time zone data: ",
    footer: "No expressions or schedule data leave this page.",
    security: "Security",
    switchLanguage: "Switch to Chinese",
    loading: "Loading WebAssembly...",
    valid: "Valid Unix expression",
    scheduleReady: "Schedule ready",
    scheduleEmpty: "No future occurrences",
    noOccurrences: "No matching dates found",
    scheduleError: "Schedule unavailable",
    copyFailed: "Copy failed. Select the expression manually.",
    everyMinute: "Every minute",
    everyHour: "Every hour",
    everyDay: "Every day",
    everyMonth: "Every month",
    anyDay: "Any day",
    weekdays: "Monday to Friday",
    weekend: "Weekend"
  },
  zh: {
    skipLink: "跳到工作区",
    title: "Cron 构建器",
    subtitle: "在浏览器本地构建、检查和预览调度计划。",
    dialect: "Unix 五字段",
    scheduleControls: "调度控制",
    editorMode: "编辑模式",
    visualTab: "可视化",
    expressionTab: "表达式",
    timeZone: "时区",
    occurrences: "次数",
    editorHeading: "调度编辑器",
    localOnly: "仅浏览器本地",
    minute: "分钟",
    hour: "小时",
    dayOfMonth: "日期",
    month: "月份",
    dayOfWeek: "星期",
    cronExpression: "Cron 表达式",
    presets: "常用预设",
    schedulePresets: "调度预设",
    currentExpression: "当前表达式",
    copy: "复制",
    copied: "已复制",
    descriptionHeading: "表达式说明",
    scheduleHeading: "后续执行时间",
    evaluatedIn: "计算时区",
    localTime: "本地时间",
    relative: "相对时间",
    occurrenceTable: "后续 Cron 执行时间",
    timeZoneData: "时区数据：",
    footer: "表达式和调度数据不会离开此页面。",
    security: "安全",
    switchLanguage: "Switch to English",
    loading: "正在加载 WebAssembly...",
    valid: "有效的 Unix 表达式",
    scheduleReady: "计划已生成",
    scheduleEmpty: "没有后续执行时间",
    noOccurrences: "未找到匹配日期",
    scheduleError: "无法生成计划",
    copyFailed: "复制失败，请手动选择表达式。",
    everyMinute: "每分钟",
    everyHour: "每小时",
    everyDay: "每天",
    everyMonth: "每月",
    anyDay: "任意星期",
    weekdays: "周一至周五",
    weekend: "周末"
  }
};

const commonTimeZones = [
  "UTC",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney"
];

const SCHEDULE_REFRESH_SLOP_MS = 50;

const state = {
  locale: "en",
  expression: "* * * * *",
  mode: "visual",
  presets: [],
  timeZone: resolveBrowserTimeZone(),
  timeZoneDatabaseVersion: "...",
  count: 10,
  debounce: undefined,
  scheduleRefreshTimer: undefined,
  toastTimer: undefined
};

const elements = {
  main: document.querySelector("#main-content"),
  languageButton: document.querySelector("#language-button"),
  timeZone: document.querySelector("#time-zone"),
  timeZoneOptions: document.querySelector("#time-zone-options"),
  occurrenceCount: document.querySelector("#occurrence-count"),
  visualTab: document.querySelector("#tab-visual"),
  expressionTab: document.querySelector("#tab-expression"),
  visualPanel: document.querySelector("#visual-panel"),
  expressionPanel: document.querySelector("#expression-panel"),
  minute: document.querySelector("#field-minute"),
  hour: document.querySelector("#field-hour"),
  dayOfMonth: document.querySelector("#field-day-of-month"),
  month: document.querySelector("#field-month"),
  dayOfWeek: document.querySelector("#field-day-of-week"),
  expressionInput: document.querySelector("#expression-input"),
  presetList: document.querySelector("#preset-list"),
  currentExpression: document.querySelector("#current-expression"),
  copyButton: document.querySelector("#copy-button"),
  expressionStatus: document.querySelector("#expression-status"),
  descriptionEn: document.querySelector("#description-en"),
  descriptionZh: document.querySelector("#description-zh"),
  scheduleZone: document.querySelector("#schedule-zone"),
  scheduleStatus: document.querySelector("#schedule-status"),
  occurrenceRows: document.querySelector("#occurrence-rows"),
  timeZoneData: document.querySelector("#time-zone-data"),
  toast: document.querySelector("#toast")
};

function resolveBrowserTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function text(key) {
  return messages[state.locale][key] ?? key;
}

function createOption(value, label) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  return option;
}

function replaceOptions(select, options) {
  const selected = select.value;
  const replacements = options.map(([value, label]) => createOption(value, label));
  if (selected && !replacements.some((option) => option.value === selected)) {
    replacements.push(createOption(selected, selected));
  }
  select.replaceChildren(...replacements);
  if (selected) {
    select.value = selected;
  }
}

function populateTimeZones() {
  const zones = new Set(commonTimeZones);
  zones.add(state.timeZone);
  elements.timeZoneOptions.replaceChildren(
    ...[...zones].sort().map((zone) => createOption(zone, zone))
  );
  elements.timeZone.value = state.timeZone;
}

function populateFields() {
  const minuteOptions = [["*", `* ${text("everyMinute")}`]];
  for (const step of [5, 10, 15, 20, 30]) {
    minuteOptions.push([`*/${step}`, `*/${step}`]);
  }
  for (let minute = 0; minute <= 59; minute += 1) {
    minuteOptions.push([String(minute), String(minute).padStart(2, "0")]);
  }

  const hourOptions = [["*", `* ${text("everyHour")}`]];
  for (const step of [2, 3, 4, 6, 8, 12]) {
    hourOptions.push([`*/${step}`, `*/${step}`]);
  }
  for (let hour = 0; hour <= 23; hour += 1) {
    hourOptions.push([String(hour), `${String(hour).padStart(2, "0")}:00`]);
  }

  const dayOptions = [["*", `* ${text("everyDay")}`]];
  for (let day = 1; day <= 31; day += 1) {
    dayOptions.push([String(day), String(day)]);
  }

  const monthOptions = [["*", `* ${text("everyMonth")}`]];
  for (let month = 1; month <= 12; month += 1) {
    monthOptions.push([String(month), String(month)]);
  }

  const dayNames = state.locale === "en"
    ? ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  const weekOptions = [["*", `* ${text("anyDay")}`]];
  dayNames.forEach((name, day) => weekOptions.push([String(day), name]));
  weekOptions.push(["1-5", text("weekdays")], ["0,6", text("weekend")]);

  replaceOptions(elements.minute, minuteOptions);
  replaceOptions(elements.hour, hourOptions);
  replaceOptions(elements.dayOfMonth, dayOptions);
  replaceOptions(elements.month, monthOptions);
  replaceOptions(elements.dayOfWeek, weekOptions);
}

function applyLocale() {
  document.documentElement.lang = state.locale === "en" ? "en" : "zh-CN";
  document.title = state.locale === "en" ? "Cron Maker | Tinkora" : "Cron 构建器 | Tinkora";
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    element.textContent = text(element.dataset.i18n);
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
    element.setAttribute("aria-label", text(element.dataset.i18nAria));
  });
  elements.languageButton.textContent = state.locale === "en" ? "中文" : "EN";
  elements.languageButton.setAttribute("aria-label", text("switchLanguage"));
  elements.timeZoneData.textContent = `${text("timeZoneData")}IANA ${state.timeZoneDatabaseVersion}`;
  populateFields();
  renderPresets();
}

function switchMode(mode, focus = false) {
  state.mode = mode;
  const visualActive = mode === "visual";
  elements.visualTab.classList.toggle("is-active", visualActive);
  elements.expressionTab.classList.toggle("is-active", !visualActive);
  elements.visualTab.setAttribute("aria-selected", String(visualActive));
  elements.expressionTab.setAttribute("aria-selected", String(!visualActive));
  elements.visualTab.tabIndex = visualActive ? 0 : -1;
  elements.expressionTab.tabIndex = visualActive ? -1 : 0;
  elements.visualPanel.hidden = !visualActive;
  elements.expressionPanel.hidden = visualActive;

  if (visualActive) {
    syncVisualFields();
  } else {
    elements.expressionInput.value = state.expression;
  }
  if (focus) {
    (visualActive ? elements.visualTab : elements.expressionTab).focus();
  }
}

function handleTabKey(event) {
  const tabs = [elements.visualTab, elements.expressionTab];
  const currentIndex = tabs.indexOf(event.currentTarget);
  let nextIndex;
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    nextIndex = (currentIndex + 1) % tabs.length;
  } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
  } else if (event.key === "Home") {
    nextIndex = 0;
  } else if (event.key === "End") {
    nextIndex = tabs.length - 1;
  } else {
    return;
  }
  event.preventDefault();
  switchMode(tabs[nextIndex].dataset.mode, true);
}

function renderPresets() {
  elements.presetList.replaceChildren();
  state.presets.forEach((preset) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preset-button";
    button.textContent = state.locale === "en" ? preset.label_en : preset.label_zh;
    button.title = preset.expression;
    button.setAttribute("aria-pressed", String(preset.expression === state.expression));
    button.addEventListener("click", () => {
      state.expression = preset.expression;
      elements.expressionInput.value = state.expression;
      updateExpression(state.expression);
      syncVisualFields();
    });
    elements.presetList.append(button);
  });
}

function ensureSelectValue(select, raw) {
  if (![...select.options].some((option) => option.value === raw)) {
    select.append(createOption(raw, raw));
  }
  select.value = raw;
}

function syncVisualFields() {
  try {
    const parsed = wasm_parse_cron(state.expression);
    ensureSelectValue(elements.minute, parsed.minutes.raw);
    ensureSelectValue(elements.hour, parsed.hours.raw);
    ensureSelectValue(elements.dayOfMonth, parsed.day_of_month.raw);
    ensureSelectValue(elements.month, parsed.month.raw);
    ensureSelectValue(elements.dayOfWeek, parsed.day_of_week.raw);
  } catch {
    switchMode("expression");
  }
}

function buildFromVisual() {
  try {
    const result = wasm_build_expression(
      elements.minute.value,
      elements.hour.value,
      elements.dayOfMonth.value,
      elements.month.value,
      elements.dayOfWeek.value
    );
    state.expression = result.expression;
    elements.expressionInput.value = state.expression;
    updateExpression(state.expression);
  } catch (error) {
    showExpressionError(error);
  }
}

function errorMessage(error) {
  if (error && typeof error.message === "string") {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return String(error ?? "Unknown error");
}

function showExpressionError(error) {
  const message = errorMessage(error);
  elements.copyButton.disabled = true;
  elements.expressionInput.setAttribute("aria-invalid", "true");
  elements.expressionStatus.className = "status-message is-error";
  elements.expressionStatus.textContent = message;
  elements.descriptionEn.textContent = "—";
  elements.descriptionZh.textContent = "—";
  elements.occurrenceRows.replaceChildren();
  elements.scheduleStatus.className = "schedule-status is-error";
  elements.scheduleStatus.textContent = text("scheduleError");
}

function relativeTime(timestamp, now) {
  const seconds = timestamp - now;
  const formatter = new Intl.RelativeTimeFormat(state.locale === "en" ? "en" : "zh-CN", {
    numeric: "auto"
  });
  if (Math.abs(seconds) < 90) {
    return formatter.format(Math.round(seconds), "second");
  }
  const minutes = seconds / 60;
  if (Math.abs(minutes) < 90) {
    return formatter.format(Math.round(minutes), "minute");
  }
  const hours = minutes / 60;
  if (Math.abs(hours) < 36) {
    return formatter.format(Math.round(hours), "hour");
  }
  return formatter.format(Math.round(hours / 24), "day");
}

function appendCell(row, value, className) {
  const cell = document.createElement("td");
  cell.textContent = value;
  if (className) {
    cell.className = className;
  }
  row.append(cell);
}

function setScheduleStatus(className, message) {
  if (elements.scheduleStatus.className !== className) {
    elements.scheduleStatus.className = className;
  }
  if (elements.scheduleStatus.textContent !== message) {
    elements.scheduleStatus.textContent = message;
  }
}

function renderSchedule() {
  state.timeZone = elements.timeZone.value.trim() || "UTC";
  state.count = Number(elements.occurrenceCount.value);
  elements.scheduleZone.textContent = state.timeZone;
  elements.occurrenceRows.replaceChildren();

  try {
    const now = Math.floor(Date.now() / 1000);
    const occurrences = wasm_next_executions(
      state.expression,
      BigInt(now),
      state.count,
      state.timeZone
    );

    if (occurrences.length === 0) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "empty-schedule";
      cell.textContent = text("noOccurrences");
      row.append(cell);
      elements.occurrenceRows.append(row);
      setScheduleStatus("schedule-status", text("scheduleEmpty"));
      return;
    }

    occurrences.forEach((occurrence, index) => {
      const timestamp = Number(occurrence.unix);
      const row = document.createElement("tr");
      appendCell(row, String(index + 1));
      appendCell(row, occurrence.local_iso);
      appendCell(row, occurrence.iso.replace("T", " ").replace("Z", " UTC"));
      appendCell(row, relativeTime(timestamp, now), "relative-cell");
      elements.occurrenceRows.append(row);
    });

    setScheduleStatus("schedule-status is-ready", text("scheduleReady"));
  } catch (error) {
    setScheduleStatus(
      "schedule-status is-error",
      `${text("scheduleError")}: ${errorMessage(error)}`
    );
  }
}

function scheduleNextRefresh() {
  window.clearTimeout(state.scheduleRefreshTimer);
  const delay = 60_000 - (Date.now() % 60_000) + SCHEDULE_REFRESH_SLOP_MS;
  state.scheduleRefreshTimer = window.setTimeout(() => {
    if (document.visibilityState === "visible") {
      renderSchedule();
    }
    scheduleNextRefresh();
  }, delay);
}

function refreshAfterResume() {
  renderSchedule();
  scheduleNextRefresh();
}

function updateExpression(expression) {
  state.expression = expression;
  elements.currentExpression.textContent = "—";
  renderPresets();

  try {
    const validation = wasm_validate_cron(expression);
    state.expression = validation.canonical;
    elements.currentExpression.textContent = state.expression;
    elements.copyButton.disabled = false;
    renderPresets();
    elements.expressionInput.setAttribute("aria-invalid", "false");
    elements.expressionStatus.className = "status-message is-valid";
    elements.expressionStatus.textContent = `${text("valid")} · ${validation.canonical}`;
    elements.descriptionEn.textContent = wasm_describe_en(state.expression);
    elements.descriptionZh.textContent = wasm_describe_zh(state.expression);
    renderSchedule();
  } catch (error) {
    showExpressionError(error);
  }
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.hidden = false;
  state.toastTimer = window.setTimeout(() => {
    elements.toast.hidden = true;
  }, 1800);
}

async function copyExpression() {
  try {
    await navigator.clipboard.writeText(state.expression);
    showToast(text("copied"));
  } catch {
    showToast(text("copyFailed"));
  }
}

function setupEvents() {
  [elements.visualTab, elements.expressionTab].forEach((tab) => {
    tab.addEventListener("click", () => switchMode(tab.dataset.mode));
    tab.addEventListener("keydown", handleTabKey);
  });

  [elements.minute, elements.hour, elements.dayOfMonth, elements.month, elements.dayOfWeek]
    .forEach((select) => select.addEventListener("change", buildFromVisual));

  elements.expressionInput.addEventListener("input", () => {
    window.clearTimeout(state.debounce);
    state.debounce = window.setTimeout(() => updateExpression(elements.expressionInput.value), 180);
  });
  elements.expressionInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      window.clearTimeout(state.debounce);
      updateExpression(elements.expressionInput.value);
    }
  });

  elements.timeZone.addEventListener("change", renderSchedule);
  elements.timeZone.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      renderSchedule();
    }
  });
  elements.occurrenceCount.addEventListener("change", renderSchedule);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      refreshAfterResume();
    }
  });
  window.addEventListener("focus", refreshAfterResume);
  elements.copyButton.addEventListener("click", copyExpression);
  elements.languageButton.addEventListener("click", () => {
    state.locale = state.locale === "en" ? "zh" : "en";
    applyLocale();
    updateExpression(state.expression);
  });
}

async function main() {
  applyLocale();
  populateTimeZones();
  elements.expressionStatus.textContent = text("loading");
  elements.scheduleStatus.textContent = text("loading");

  try {
    await init();
    state.presets = Array.from(wasm_get_presets());
    state.timeZoneDatabaseVersion = wasm_time_zone_database_version();
    elements.timeZoneData.textContent = `${text("timeZoneData")}IANA ${state.timeZoneDatabaseVersion}`;
    setupEvents();
    renderPresets();
    updateExpression(state.expression);
    scheduleNextRefresh();
    elements.main.setAttribute("aria-busy", "false");
  } catch (error) {
    showExpressionError(error);
    elements.main.setAttribute("aria-busy", "false");
  }
}

main();
