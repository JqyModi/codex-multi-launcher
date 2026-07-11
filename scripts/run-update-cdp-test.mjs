const port = Number.parseInt(process.argv[2] ?? "9333", 10);
const shouldInstall = process.argv.includes("--install");

let id = 0;

async function findPageTarget() {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json`);
      const targets = await response.json();
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page;
    } catch {
      // App may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Could not find Electron page target on port ${port}`);
}

function createCdpClient(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  const pending = new Map();

  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id) return;
    const callbacks = pending.get(message.id);
    if (!callbacks) return;
    pending.delete(message.id);
    if (message.error) {
      callbacks.reject(new Error(message.error.message));
    } else {
      callbacks.resolve(message.result);
    }
  });

  return {
    async ready() {
      if (socket.readyState === WebSocket.OPEN) return;
      await new Promise((resolve, reject) => {
        socket.addEventListener("open", resolve, { once: true });
        socket.addEventListener("error", reject, { once: true });
      });
    },
    send(method, params = {}) {
      const messageId = ++id;
      const payload = JSON.stringify({ id: messageId, method, params });
      return new Promise((resolve, reject) => {
        pending.set(messageId, { resolve, reject });
        socket.send(payload);
      });
    },
    close() {
      socket.close();
    }
  };
}

async function evaluate(client, expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text);
  }
  return result.result.value;
}

const target = await findPageTarget();
const client = createCdpClient(target.webSocketDebuggerUrl);
await client.ready();
await client.send("Runtime.enable");

const updateResult = await evaluate(client, `(${async () => {
  const api = window.codexProfileManager;
  const info = await api.getAppInfo();
  const check = await api.checkForUpdates();
  window.__codexUpdateEvents = [];
  if (window.__codexDisposeUpdateEvents) {
    window.__codexDisposeUpdateEvents();
  }
  window.__codexDisposeUpdateEvents = api.onUpdateEvent((event) => {
    window.__codexUpdateEvents.push(event);
  });
  const startedAt = Date.now();
  await api.downloadUpdate();
  return {
    info,
    check,
    events: window.__codexUpdateEvents,
    downloadMs: Date.now() - startedAt
  };
}})()`);

console.log(JSON.stringify(updateResult, null, 2));

if (shouldInstall) {
  await evaluate(client, "window.codexProfileManager.installUpdate()");
  console.log("installUpdate invoked");
}

client.close();
