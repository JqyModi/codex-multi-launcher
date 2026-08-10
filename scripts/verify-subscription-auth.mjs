import assert from "node:assert/strict";
import crypto from "node:crypto";
import http from "node:http";

const seen = {
  codeChallenge: "",
  tokenPolls: 0
};

const server = http.createServer(async (request, response) => {
  const body = await readJson(request);
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "POST" && url.pathname === "/api/v1/desktop-auth/sessions") {
    assert.equal(body.client_id, "codex-multi-launcher");
    assert.equal(body.code_challenge_method, "S256");
    assert.equal(typeof body.code_challenge, "string");
    assert.ok(body.code_challenge.length > 20);
    assert.ok(!body.code_verifier);
    seen.codeChallenge = body.code_challenge;
    sendJson(response, 200, {
      data: {
        session_id: "server-session-1",
        authorization_url: `http://${request.headers.host}/desktop/authorize?session=server-session-1`,
        expires_in: 300,
        poll_interval: 1
      }
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/v1/desktop-auth/token") {
    assert.equal(body.session_id, "server-session-1");
    assert.equal(typeof body.code_verifier, "string");
    const challenge = crypto.createHash("sha256").update(body.code_verifier).digest("base64url");
    assert.equal(challenge, seen.codeChallenge);
    seen.tokenPolls += 1;

    if (seen.tokenPolls === 1) {
      sendJson(response, 409, { data: {
        state: "selection_required",
        subscriptions: [
          { id: 22, group_id: 4, group_name: "Codex Standard", expires_at: "2026-09-30T00:00:00.000Z" },
          { id: 11, group_id: 3, group_name: "Codex Lite", expires_at: "2026-09-15T00:00:00.000Z" }
        ]
      } });
      return;
    }

    sendJson(response, 200, {
      data: {
        base_url: `http://${request.headers.host}/v1`,
        access_token: "sk-subscription-test-secret",
        provider_name: "Subscription Test Service",
        default_model: "gpt-5-codex",
        expires_at: "2026-08-31T00:00:00.000Z",
        subscription_id: "sub-test-1"
      }
    });
    return;
  }

  sendJson(response, 404, { error: { code: "not_found" } });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const address = server.address();
assert.ok(address && typeof address === "object");
process.env.CODEX_PROFILE_MANAGER_SUBSCRIPTION_SERVICE_URL = `http://127.0.0.1:${address.port}`;

try {
  const auth = await import("../dist-electron/main/subscription-auth.js");
  const session = await auth.startSubscriptionAuthorization({ deviceName: "Verification Device" });
  assert.equal(session.state, "pending");
  assert.equal(session.pollIntervalMs, 1_000);
  assert.match(session.authorizationUrl, /\/desktop\/authorize/);

  const pending = await auth.pollSubscriptionAuthorization(session.id);
  assert.equal(pending.state, "pending");
  assert.equal(pending.subscriptions?.length, 2);
  assert.equal(pending.subscriptions?.[0]?.group_name, "Codex Standard");
  assert.equal(JSON.stringify(pending).includes("sk-subscription-test-secret"), false);

  const authorized = await auth.pollSubscriptionAuthorization(session.id);
  assert.equal(authorized.state, "authorized");
  assert.equal(authorized.providerName, "Subscription Test Service");
  assert.equal(authorized.defaultModel, "gpt-5-codex");
  assert.equal(JSON.stringify(authorized).includes("sk-subscription-test-secret"), false);

  const config = auth.getAuthorizedSubscriptionConfig(session.id);
  assert.equal(config.accessToken, "sk-subscription-test-secret");
  assert.equal(config.baseUrl, process.env.CODEX_PROFILE_MANAGER_SUBSCRIPTION_SERVICE_URL + "/v1");
  auth.cancelSubscriptionAuthorization(session.id);
  assert.throws(() => auth.getAuthorizedSubscriptionConfig(session.id), /not found/);

  console.log("Subscription authorization verification passed.");
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
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
