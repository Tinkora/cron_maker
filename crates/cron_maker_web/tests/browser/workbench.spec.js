import { expect, test } from "@playwright/test";

async function waitForReady(page) {
  await expect(page.locator("#schedule-status")).toContainText("Schedule ready");
  await expect(page.locator("#occurrence-rows tr")).toHaveCount(10);
}

async function loadEveryMinuteScheduleAt(page, time) {
  await page.clock.install({ time: new Date("2026-01-01T00:00:00Z") });
  await page.goto("/");
  await waitForReady(page);
  await page.clock.pauseAt(new Date(time));
  await page.getByLabel("Time zone").fill("UTC");
  await page.getByLabel("Time zone").press("Enter");

  const firstRow = page.locator("#occurrence-rows tr").first();
  await expect(firstRow.locator("td").nth(2)).toHaveText("2026-01-01 00:01:00 UTC");
  await expect(firstRow.locator("td").nth(3)).toHaveText("in 30 seconds");
  return firstRow;
}

async function occurrenceValues(row) {
  return {
    utc: await row.locator("td").nth(2).textContent(),
    relative: await row.locator("td").nth(3).textContent()
  };
}

test("returns JSON-compatible records across the WASM boundary", async ({ page }) => {
  await page.goto("/");

  const contract = await page.evaluate(async () => {
    const wasm = await import("/pkg/cron_maker_web.js");
    await wasm.default();
    const parsed = wasm.wasm_parse_cron("*/15 * * * *");
    const validation = wasm.wasm_validate_cron("*/15 * * * *");
    const built = wasm.wasm_build_expression("*/15", "*", "*", "*", "*");
    const presets = wasm.wasm_get_presets();
    const timeZoneDatabaseVersion = wasm.wasm_time_zone_database_version();
    const occurrences = wasm.wasm_next_executions("* * * * *", 1_767_225_600n, 1, "UTC");

    return {
      parsedIsPlainObject: Object.getPrototypeOf(parsed) === Object.prototype,
      minute: parsed.minutes?.raw,
      validationIsPlainObject: Object.getPrototypeOf(validation) === Object.prototype,
      canonical: validation.canonical,
      builtIsPlainObject: Object.getPrototypeOf(built) === Object.prototype,
      builtExpression: built.expression,
      presetIsPlainObject: Object.getPrototypeOf(presets[0]) === Object.prototype,
      firstPreset: presets[0]?.expression,
      timeZoneDatabaseVersion,
      occurrenceIsPlainObject: Object.getPrototypeOf(occurrences[0]) === Object.prototype,
      unix: occurrences[0]?.unix,
      iso: occurrences[0]?.iso,
      localIso: occurrences[0]?.local_iso
    };
  });

  expect(contract).toEqual({
    parsedIsPlainObject: true,
    minute: "*/15",
    validationIsPlainObject: true,
    canonical: "*/15 * * * *",
    builtIsPlainObject: true,
    builtExpression: "*/15 * * * *",
    presetIsPlainObject: true,
    firstPreset: "@hourly",
    timeZoneDatabaseVersion: "2026c",
    occurrenceIsPlainObject: true,
    unix: 1_767_225_660,
    iso: "2026-01-01T00:01:00Z",
    localIso: "2026-01-01T00:01:00+00:00"
  });
});

test("loads real WASM with English default and a complete Chinese entry", async ({ page }) => {
  const wasmResponsePromise = page.waitForResponse((response) =>
    response.url().endsWith("/pkg/cron_maker_web_bg.wasm")
  );
  await page.goto("/");
  const wasmResponse = await wasmResponsePromise;

  expect(wasmResponse.status()).toBe(200);
  expect(wasmResponse.headers()["content-type"]).toContain("application/wasm");
  await waitForReady(page);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: "Cron Maker" })).toBeVisible();
  await expect(page.getByText("Unix 5-field", { exact: true })).toBeVisible();
  await expect(page.locator("#time-zone-data")).toHaveText("Time zone data: IANA 2026c");

  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByRole("heading", { name: "Cron 构建器" })).toBeVisible();
  await expect(page.locator("#schedule-status")).toContainText("计划已生成");
  await expect(page.getByRole("columnheader", { name: "本地时间" })).toBeVisible();
  await expect(page.locator("#time-zone-data")).toHaveText("时区数据：IANA 2026c");
});

test("declares a local favicon that loads successfully", async ({ baseURL, page, request }) => {
  await page.goto("/");

  const favicon = page.locator('link[rel~="icon"]');
  await expect(favicon).toHaveAttribute("href", "./favicon.svg");

  const response = await request.get(new URL("./favicon.svg", baseURL).href);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/svg+xml");
});

test("builds a Unix expression and rejects an implicit Quartz expression", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  await page.getByLabel("Minute").selectOption("30");
  await page.getByLabel("Hour").selectOption("9");
  await page.getByLabel("Day of week").selectOption("1-5");
  await expect(page.locator("#current-expression")).toHaveText("30 9 * * 1-5");
  await expect(page.locator("#expression-status")).toContainText("Valid Unix expression");

  await page.getByRole("tab", { name: "Expression" }).click();
  await page.getByLabel("Cron expression").fill("0 30 9 * * 1-5");
  await expect(page.locator("#expression-status")).toContainText("expected 5 fields");
  await expect(page.locator("#occurrence-rows tr")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Copy" })).toBeDisabled();
});

test("preserves custom visual fields across a language change", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  await page.getByRole("tab", { name: "Expression" }).click();
  await page.getByLabel("Cron expression").fill("1,3,5 1-9/2 15 6 MON-FRI");
  await page.getByLabel("Cron expression").press("Enter");
  await page.getByRole("tab", { name: "Visual" }).click();

  await expect(page.getByLabel("Minute")).toHaveValue("1,3,5");
  await expect(page.getByLabel("Hour")).toHaveValue("1-9/2");
  await expect(page.getByLabel("Day of week")).toHaveValue("MON-FRI");

  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(page.getByLabel("分钟")).toHaveValue("1,3,5");
  await expect(page.getByLabel("小时")).toHaveValue("1-9/2");
  await expect(page.getByLabel("星期")).toHaveValue("MON-FRI");

  await page.getByLabel("分钟").selectOption("10");
  await expect(page.locator("#current-expression")).toHaveText("10 1-9/2 15 6 MON-FRI");
});

test("enforces the raw UTF-8 input limit before trimming", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  await page.getByRole("tab", { name: "Expression" }).click();
  await page.getByLabel("Cron expression").fill(`${" ".repeat(256)}* * * * *`);

  await expect(page.locator("#expression-status")).toContainText("maximum 256");
  await expect(page.locator("#occurrence-rows tr")).toHaveCount(0);
});

test("keeps every schedule control available and readable", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  await expect(page.getByRole("combobox", { name: "Occurrences", exact: true })).toBeVisible();
  for (const label of ["Minute", "Hour", "Day of month", "Month", "Day of week"]) {
    const control = page.getByRole("combobox", { name: label, exact: true });
    await expect(control).toBeVisible();
    expect((await control.boundingBox()).width).toBeGreaterThanOrEqual(145);
  }
});

test("keeps every occurrence column visible on tablet and desktop widths", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  const widths = new Set([page.viewportSize().width, 768, 1024, 1100, 1101, 1280, 1281, 1440]);
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 });
    const tableLayout = await page.locator(".table-scroll").evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth
    }));

    expect(
      tableLayout.scrollWidth === tableLayout.clientWidth,
      `occurrence table visibility at ${width}px`
    ).toBe(width >= 768);
  }
});

test("uses the selected IANA zone for wall-clock scheduling", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  await page.getByRole("tab", { name: "Expression" }).click();
  await page.getByLabel("Cron expression").fill("30 2 * * *");
  await page.getByLabel("Time zone").fill("America/New_York");
  await page.getByLabel("Time zone").press("Enter");

  await expect(page.locator("#schedule-zone")).toHaveText("America/New_York");
  await expect(page.locator("#occurrence-rows tr")).toHaveCount(10);

  const timestamps = await page.evaluate(async () => {
    const wasm = await import("/pkg/cron_maker_web.js");
    return wasm.wasm_next_executions("30 2 * * *", 1_772_884_800n, 2, "America/New_York");
  });
  expect(timestamps.map((item) => Number(item.unix))).toEqual([1_773_037_800, 1_773_124_200]);
});

test("renders selected-zone times from the bundled time-zone database", async ({ page }) => {
  await page.clock.install({ time: new Date("2026-09-20T03:00:00Z") });
  await page.addInitScript(() => {
    const NativeDateTimeFormat = Intl.DateTimeFormat;
    Intl.DateTimeFormat = class extends NativeDateTimeFormat {
      constructor(locales, options) {
        if (options?.timeZone) {
          throw new Error("Browser time-zone conversion must not format occurrence rows");
        }
        super(locales, options);
      }
    };
  });

  await page.goto("/");
  await page.getByRole("tab", { name: "Expression" }).click();
  await page.getByLabel("Cron expression").fill("30 2 * * *");
  await page.getByLabel("Time zone").fill("Africa/Casablanca");
  await page.getByLabel("Time zone").press("Enter");

  await expect(page.locator("#schedule-status")).toHaveText("Schedule ready");
  await expect(page.locator("#occurrence-rows tr").first().locator("td").nth(1)).toHaveText(
    "2026-09-21T02:30:00+00:00"
  );
});

test("explains a valid schedule with no future occurrences", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  await page.getByRole("tab", { name: "Expression" }).click();
  await page.getByLabel("Cron expression").fill("0 0 31 2 *");
  await expect(page.locator("#schedule-status")).toHaveText("No future occurrences");
  await expect(page.locator("#occurrence-rows")).toContainText("No matching dates found");

  await page.getByRole("button", { name: "Switch to Chinese" }).click();
  await expect(page.locator("#schedule-status")).toHaveText("没有后续执行时间");
  await expect(page.locator("#occurrence-rows")).toContainText("未找到匹配日期");
});

test("refreshes next occurrences when an open page crosses the next minute", async ({ page }) => {
  const firstRow = await loadEveryMinuteScheduleAt(page, "2026-01-01T00:00:30Z");

  await page.clock.runFor(31_000);

  expect(await occurrenceValues(firstRow)).toEqual({
    utc: "2026-01-01 00:02:00 UTC",
    relative: "in 60 seconds"
  });
});

test("refreshes stale occurrences when the page becomes visible", async ({ page }) => {
  const firstRow = await loadEveryMinuteScheduleAt(page, "2026-01-01T00:00:30Z");

  await page.clock.setSystemTime(new Date("2026-01-01T00:02:10Z"));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));

  expect(await occurrenceValues(firstRow)).toEqual({
    utc: "2026-01-01 00:03:00 UTC",
    relative: "in 50 seconds"
  });
});

test("refreshes stale occurrences when the window regains focus", async ({ page }) => {
  const firstRow = await loadEveryMinuteScheduleAt(page, "2026-01-01T00:00:30Z");

  await page.clock.setSystemTime(new Date("2026-01-01T00:02:10Z"));
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));

  expect(await occurrenceValues(firstRow)).toEqual({
    utc: "2026-01-01 00:03:00 UTC",
    relative: "in 50 seconds"
  });
});

test("supports keyboard tab navigation", async ({ page }) => {
  await page.goto("/");
  await waitForReady(page);

  const visual = page.getByRole("tab", { name: "Visual" });
  const expression = page.getByRole("tab", { name: "Expression" });
  await visual.focus();
  await page.keyboard.press("ArrowRight");
  await expect(expression).toBeFocused();
  await expect(expression).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#expression-panel")).toBeVisible();
  await page.keyboard.press("Home");
  await expect(visual).toBeFocused();
  await expect(visual).toHaveAttribute("aria-selected", "true");
});

test("has no external requests, console problems, failed responses, or overflow", async ({
  baseURL,
  page
}) => {
  const problems = [];
  const externalRequests = [];
  const failedResponses = [];
  const expectedOrigin = new URL(baseURL).origin;

  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) {
      problems.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("request", (request) => {
    if (new URL(request.url()).origin !== expectedOrigin) {
      externalRequests.push(request.url());
    }
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await waitForReady(page);

  const layout = await page.evaluate(() => ({
    bodyScrollWidth: document.body.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth
  }));
  expect(layout.documentScrollWidth).toBe(layout.clientWidth);
  expect(layout.bodyScrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  expect(externalRequests).toEqual([]);
  expect(failedResponses).toEqual([]);
  expect(problems).toEqual([]);
});
