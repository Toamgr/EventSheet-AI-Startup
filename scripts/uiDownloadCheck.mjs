import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";
import ExcelJS from "exceljs";
import { sheetNames } from "../src/eventsheetWorkbook.js";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const appUrl = process.env.EVENTSHEET_QA_URL || "http://127.0.0.1:5180";
const downloadDir = join(process.cwd(), "outputs", "ui-download-check");
const userDataDir = join(process.cwd(), "outputs", "edge-profile-check");
const port = 9223;

if (!existsSync(edgePath)) throw new Error("Microsoft Edge executable was not found.");

rmSync(downloadDir, { recursive: true, force: true });
rmSync(userDataDir, { recursive: true, force: true });
mkdirSync(downloadDir, { recursive: true });
mkdirSync(userDataDir, { recursive: true });

const edge = spawn(edgePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: "ignore" });

try {
  const version = await waitForJson(`http://127.0.0.1:${port}/json/version`);
  const ws = await connectCdp(version.webSocketDebuggerUrl);
  await ws.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: downloadDir, eventsEnabled: true });
  const target = await ws.send("Target.createTarget", { url: "about:blank" });
  const attached = await ws.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;

  const send = (method, params = {}) => ws.send(method, params, sessionId);
  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: appUrl });
  await sleep(2000);

  const clickResult = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        document.querySelector('.ghost-button')?.click();
        await sleep(500);
        document.querySelector('.primary-button')?.click();
        for (let i = 0; i < 40; i += 1) {
          if (document.querySelector('.review-layout')) break;
          await sleep(250);
        }
        const buttons = [...document.querySelectorAll('button')].map(button => button.textContent.trim());
        const excelButton = [...document.querySelectorAll('button')].find(button => button.textContent.includes('Excel'));
        if (!excelButton) return { ok: false, buttons, text: document.body.innerText.slice(0, 500) };
        excelButton.click();
        await sleep(3000);
        return { ok: true, buttons, text: document.body.innerText.slice(0, 500) };
      })()
    `,
  });
  if (clickResult.exceptionDetails) throw new Error(JSON.stringify(clickResult.exceptionDetails, null, 2));
  console.log(JSON.stringify({ uiResult: clickResult.result.value }, null, 2));

  const filePath = await waitForDownload(downloadDir);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(readFileSync(filePath));
  const names = workbook.worksheets.map((sheet) => sheet.name);
  const missing = sheetNames.filter((name) => !names.includes(name));
  const text = [
    workbook.getWorksheet("02_Guest_Database").getCell("B2").value,
    workbook.getWorksheet("07_Suppliers").getCell("B2").value,
    workbook.getWorksheet("11_Final_Brief").getCell("A2").value,
  ].join(" ");

  if (missing.length || text.includes("????") || text.includes("���")) {
    throw new Error(JSON.stringify({ missing, text }, null, 2));
  }

  console.log(JSON.stringify({ downloaded: filePath, sheetCount: names.length, missing, hebrewOk: true }, null, 2));
} finally {
  edge.kill();
}

async function waitForJson(url) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch {
      await sleep(250);
    }
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function waitForDownload(dir) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const file = readdirSync(dir).find((name) => name.endsWith(".xlsx") && !name.endsWith(".crdownload"));
    if (file) return join(dir, file);
    await sleep(500);
  }
  throw new Error("Timed out waiting for UI workbook download.");
}

function connectCdp(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    let id = 0;
    const callbacks = new Map();

    socket.addEventListener("open", () => {
      resolve({
        send(method, params = {}, sessionId) {
          const messageId = ++id;
          const payload = { id: messageId, method, params };
          if (sessionId) payload.sessionId = sessionId;
          socket.send(JSON.stringify(payload));
          return new Promise((res, rej) => callbacks.set(messageId, { res, rej }));
        },
      });
    });
    socket.addEventListener("error", reject);
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !callbacks.has(message.id)) return;
      const callback = callbacks.get(message.id);
      callbacks.delete(message.id);
      if (message.error) callback.rej(new Error(JSON.stringify(message.error)));
      else callback.res(message.result);
    });
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
