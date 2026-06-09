import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { spawn } from "node:child_process";

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const appUrl = process.env.EVENTSHEET_QA_URL || "http://127.0.0.1:5180";
const userDataDir = join(process.cwd(), "outputs", "edge-profile-manual-guest-check");
const port = 9225;

if (!existsSync(edgePath)) throw new Error("Microsoft Edge executable was not found.");
rmSync(userDataDir, { recursive: true, force: true });

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
  const target = await ws.send("Target.createTarget", { url: "about:blank" });
  const attached = await ws.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  const send = (method, params = {}) => ws.send(method, params, sessionId);

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Page.navigate", { url: appUrl });
  await sleep(1500);

  const result = await send("Runtime.evaluate", {
    awaitPromise: true,
    returnByValue: true,
    expression: `
      (async () => {
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const setValue = (el, value) => {
          const setter = Object.getOwnPropertyDescriptor(el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype, 'value').set;
          setter.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        };
        document.querySelector('.secondary-button')?.click();
        await sleep(250);
        [...document.querySelectorAll('button')].find(button => button.textContent.includes('ארגן מידע'))?.click();
        for (let i = 0; i < 40; i += 1) {
          if (document.querySelector('.workspace-shell')) break;
          await sleep(250);
        }
        [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'אורחים')?.click();
        await sleep(300);
        const fields = [...document.querySelectorAll('.manual-guest-card input, .manual-guest-card select')];
        setValue(fields[0], 'אורח בדיקה');
        setValue(fields[1], 'חבר גרעין');
        setValue(fields[2], 'צד הכלה');
        setValue(fields[3], 'מאשר הגעה');
        setValue(fields[4], '4');
        setValue(fields[5], 'נוסף ידנית');
        [...document.querySelectorAll('button')].find(button => button.textContent.trim() === 'הוסף אורח')?.click();
        await sleep(400);
        [...document.querySelectorAll('.chip-button')].find(button => button.textContent.includes('חבר גרעין'))?.click();
        await sleep(250);
        const text = document.body.innerText;
        return {
          hasManualGuest: text.includes('אורח בדיקה'),
          hasManualNotes: text.includes('נוסף ידנית'),
          hasCategoryFilter: text.includes('חבר גרעין'),
          text: text.slice(0, 1000)
        };
      })()
    `,
  });

  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails, null, 2));
  if (!result.result.value.hasManualGuest || !result.result.value.hasManualNotes || !result.result.value.hasCategoryFilter) {
    throw new Error(JSON.stringify(result.result.value, null, 2));
  }
  console.log(JSON.stringify(result.result.value, null, 2));
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
