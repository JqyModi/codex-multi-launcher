import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-subscription-reauth-"));
const originalCwd = process.cwd();
const sessions = new Map();
let sessionNumber = 0;

const server = http.createServer(async (request, response) => {
  const body = await readJson(request);
  const origin = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "/", origin);

  if (request.method === "POST" && url.pathname === "/api/v1/desktop-auth/sessions") {
    sessionNumber += 1;
    const id = `reauth-session-${sessionNumber}`;
    sessions.set(id, body.code_challenge);
    sendJson(response, 200, { data: {
      session_id: id,
      authorization_url: `${origin}/desktop/authorize?session=${id}`,
      expires_in: 300,
      poll_interval: 1
    } });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/desktop-auth/token") {
    assert.equal(
      crypto.createHash("sha256").update(body.code_verifier).digest("base64url"),
      sessions.get(body.session_id)
    );
    const replacement = body.session_id === "reauth-session-2";
    sendJson(response, 200, { data: {
      base_url: `${origin}/v1`,
      access_token: replacement ? "sk-replacement-subscription-key" : "sk-original-subscription-key",
      provider_name: replacement ? "Replacement Subscription" : "Original Subscription",
      default_model: replacement ? "gpt-5.6-sol" : "gpt-5.5",
      subscription_id: replacement ? "22" : "11"
    } });
    return;
  }

  sendJson(response, 404, { error: { code: "not_found" } });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert.ok(address && typeof address === "object");
process.env.CODEX_PROFILE_MANAGER_HOME_OVERRIDE = testRoot;
process.env.CODEX_PROFILE_MANAGER_SUBSCRIPTION_SERVICE_URL = `http://127.0.0.1:${address.port}`;
process.chdir(path.parse(originalCwd).root);

try {
  const auth = await import("../dist-electron/main/subscription-auth.js");
  const profileService = await import("../dist-electron/main/profile-service.js");
  const secrets = await import("../dist-electron/main/secrets.js");
  const paths = await import("../dist-electron/main/paths.js");

  const initialSession = await auth.startSubscriptionAuthorization({ deviceName: "Original Profile" });
  assert.equal((await auth.pollSubscriptionAuthorization(initialSession.id)).state, "authorized");
  const created = await profileService.createProfile({
    name: "Reauthorization Verification",
    authMode: "subscription",
    subscriptionAuthorizationSessionId: initialSession.id,
    inheritDefaultConfig: false,
    provider: { type: "third_party_responses", displayName: "ignored", model: "ignored" }
  });

  const markerPath = path.join(created.profile.paths.codexHome, "sessions", "history-marker.txt");
  await fs.mkdir(path.dirname(markerPath), { recursive: true });
  await fs.writeFile(markerPath, "preserve-history", "utf8");

  const replacementSession = await auth.startSubscriptionAuthorization({ deviceName: created.profile.name });
  assert.equal((await auth.pollSubscriptionAuthorization(replacementSession.id)).state, "authorized");
  const updated = await profileService.reauthorizeSubscriptionProfile({
    profileId: created.profile.id,
    subscriptionAuthorizationSessionId: replacementSession.id
  });

  assert.equal(updated.profile.id, created.profile.id);
  assert.deepEqual(updated.profile.paths, created.profile.paths);
  assert.equal(updated.profile.auth.mode, "subscription");
  assert.equal(updated.profile.provider.displayName, "Replacement Subscription");
  assert.equal(updated.profile.provider.model, "gpt-5.6-sol");
  assert.equal(await secrets.getApiKey(updated.profile.id, updated.profile.provider.id), "sk-replacement-subscription-key");
  assert.equal(await fs.readFile(markerPath, "utf8"), "preserve-history");
  assert.throws(() => auth.getAuthorizedSubscriptionConfig(replacementSession.id), /not found/);

  const registry = await fs.readFile(paths.getAppPaths().profilesFile, "utf8");
  assert.equal(registry.includes("sk-original-subscription-key"), false);
  assert.equal(registry.includes("sk-replacement-subscription-key"), false);
  console.log("Subscription profile reauthorization verification passed.");
} finally {
  process.chdir(originalCwd);
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  await fs.rm(testRoot, { force: true, recursive: true });
}

async function readJson(request) {
  let raw = "";
  for await (const chunk of request) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}
