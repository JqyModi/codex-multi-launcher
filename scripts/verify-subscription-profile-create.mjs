import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const testRoot = await fs.mkdtemp(path.join(os.tmpdir(), "codex-subscription-profile-"));
let challenge = "";
let tokenPolls = 0;
const accessToken = "sk-subscription-profile-test-secret";

const server = http.createServer(async (request, response) => {
  const body = await readJson(request);
  const origin = `http://${request.headers.host}`;
  const url = new URL(request.url ?? "/", origin);

  if (request.method === "POST" && url.pathname === "/api/v1/desktop-auth/sessions") {
    challenge = body.code_challenge;
    sendJson(response, 200, { data: {
      session_id: "profile-session-1",
      authorization_url: `${origin}/desktop/authorize?session=profile-session-1`,
      expires_in: 300,
      poll_interval: 1
    } });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/desktop-auth/token") {
    assert.equal(body.session_id, "profile-session-1");
    assert.equal(crypto.createHash("sha256").update(body.code_verifier).digest("base64url"), challenge);
    tokenPolls += 1;
    if (tokenPolls === 1) {
      sendJson(response, 409, { error: { code: "authorization_pending" } });
      return;
    }
    sendJson(response, 200, { data: {
      base_url: `${origin}/v1`,
      access_token: accessToken,
      provider_name: "Subscription Test Service",
      default_model: "gpt-5-codex"
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

try {
  const auth = await import("../dist-electron/main/subscription-auth.js");
  const profileService = await import("../dist-electron/main/profile-service.js");
  const secrets = await import("../dist-electron/main/secrets.js");
  const paths = await import("../dist-electron/main/paths.js");

  const session = await auth.startSubscriptionAuthorization({ deviceName: "Profile verification" });
  assert.equal((await auth.pollSubscriptionAuthorization(session.id)).state, "pending");
  assert.equal((await auth.pollSubscriptionAuthorization(session.id)).state, "authorized");

  const result = await profileService.createProfile({
    name: "Subscription Verification",
    authMode: "subscription",
    subscriptionAuthorizationSessionId: session.id,
    inheritDefaultConfig: false,
    provider: {
      type: "official_openai",
      displayName: "Untrusted renderer value",
      baseUrl: "https://untrusted.invalid/v1",
      model: "untrusted-model",
      apiKey: "untrusted-api-key"
    }
  });

  assert.equal(result.profile.auth.mode, "subscription");
  assert.equal(result.profile.provider.type, "third_party_responses");
  assert.equal(result.profile.provider.displayName, "Subscription Test Service");
  assert.equal(result.profile.provider.baseUrl, process.env.CODEX_PROFILE_MANAGER_SUBSCRIPTION_SERVICE_URL + "/v1");
  assert.equal(result.profile.provider.model, "gpt-5-codex");
  assert.equal(await secrets.getApiKey(result.profile.id, result.profile.provider.id), accessToken);
  assert.throws(() => auth.getAuthorizedSubscriptionConfig(session.id), /not found/);

  const registry = await fs.readFile(paths.getAppPaths().profilesFile, "utf8");
  assert.equal(registry.includes(accessToken), false);
  assert.equal(registry.includes("untrusted-api-key"), false);
  console.log("Subscription profile creation verification passed.");
} finally {
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
