import crypto from "node:crypto";
import type {
  StartSubscriptionAuthorizationInput,
  SubscriptionAuthorizationOption,
  SubscriptionAuthorizationSession,
  SubscriptionAuthorizationState,
  SubscriptionAuthorizationStatus
} from "../shared/types.js";

const CLIENT_ID = "codex-multi-launcher";
const DEFAULT_SUBSCRIPTION_SERVICE_URL = "https://sub2api.minai.eu.org";
const DEFAULT_POLL_INTERVAL_MS = 2_000;
const DEFAULT_EXPIRES_IN_SECONDS = 300;
const PENDING_STATES = new Set(["authorization_pending", "pending", "login_required", "waiting_for_authorization"]);
const PAYMENT_STATES = new Set(["payment_required", "subscription_required", "purchase_required"]);

interface PendingAuthorization {
  codeVerifier: string;
  expiresAt: number;
  pollIntervalMs: number;
  serverSessionId: string;
  state: SubscriptionAuthorizationState;
  authorizationUrl: string;
  error?: string;
  authorizedConfig?: AuthorizedSubscriptionConfig;
  subscriptions?: SubscriptionAuthorizationOption[];
}

export interface AuthorizedSubscriptionConfig {
  accessToken: string;
  baseUrl: string;
  defaultModel: string;
  expiresAt?: string;
  providerName: string;
  subscriptionId?: string;
}

const pendingAuthorizations = new Map<string, PendingAuthorization>();

export async function startSubscriptionAuthorization(input: StartSubscriptionAuthorizationInput): Promise<SubscriptionAuthorizationSession> {
  const serviceUrl = subscriptionServiceUrl();
  const localSessionId = crypto.randomBytes(24).toString("base64url");
  const codeVerifier = crypto.randomBytes(48).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  const response = await serviceRequest(serviceUrl, "/api/v1/desktop-auth/sessions", {
    method: "POST",
    body: JSON.stringify({
      client_id: CLIENT_ID,
      platform: platformName(),
      device_name: sanitizeDeviceName(input.deviceName),
      code_challenge: codeChallenge,
      code_challenge_method: "S256"
    })
  });

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(`Subscription authorization could not be started (${response.status}).`);
  }

  const record = unwrapPayload(payload);
  const serverSessionId = requiredString(record.session_id, "Missing authorization session ID.");
  const authorizationUrl = validateAuthorizationUrl(requiredString(record.authorization_url, "Missing authorization URL."), serviceUrl);
  const expiresInSeconds = positiveNumber(record.expires_in, DEFAULT_EXPIRES_IN_SECONDS);
  const pollIntervalMs = Math.max(1_000, positiveNumber(record.poll_interval, DEFAULT_POLL_INTERVAL_MS / 1_000) * 1_000);
  const expiresAt = Date.now() + expiresInSeconds * 1_000;

  pendingAuthorizations.set(localSessionId, {
    authorizationUrl,
    codeVerifier,
    expiresAt,
    pollIntervalMs,
    serverSessionId,
    state: "pending"
  });

  return {
    id: localSessionId,
    authorizationUrl,
    expiresAt: new Date(expiresAt).toISOString(),
    pollIntervalMs,
    state: "pending"
  };
}

export async function pollSubscriptionAuthorization(localSessionId: string): Promise<SubscriptionAuthorizationStatus> {
  const authorization = getPendingAuthorization(localSessionId);
  if (authorization.state === "authorized") {
    return publicStatus(localSessionId, authorization);
  }

  if (authorization.expiresAt <= Date.now()) {
    authorization.state = "expired";
    authorization.error = "Authorization session expired. Start again to continue.";
    return publicStatus(localSessionId, authorization);
  }

  const serviceUrl = subscriptionServiceUrl();
  let response: Response;
  try {
    response = await serviceRequest(serviceUrl, "/api/v1/desktop-auth/token", {
      method: "POST",
      body: JSON.stringify({
        session_id: authorization.serverSessionId,
        code_verifier: authorization.codeVerifier
      })
    });
  } catch {
    authorization.state = "error";
    authorization.error = "Could not reach the subscription service. Try again shortly.";
    return publicStatus(localSessionId, authorization);
  }

  const payload = await parseJson(response);
  const record = unwrapPayload(payload);
  const errorCode = stringValue(record.code) ?? stringValue(record.error_code) ?? nestedErrorCode(record.error);
  const availableSubscriptions = parseSubscriptionOptions(record.subscriptions);
  if (availableSubscriptions.length > 0) {
    authorization.subscriptions = availableSubscriptions;
  }

  if (response.ok) {
    try {
      authorization.authorizedConfig = parseAuthorizedConfig(record, serviceUrl);
      authorization.state = "authorized";
      authorization.error = undefined;
    } catch {
      authorization.state = "error";
      authorization.error = "The subscription service returned an invalid profile configuration.";
    }
    return publicStatus(localSessionId, authorization);
  }

  if (PENDING_STATES.has(errorCode ?? "") || response.status === 409) {
    authorization.state = "pending";
    authorization.error = undefined;
  } else if (PAYMENT_STATES.has(errorCode ?? "") || response.status === 402) {
    authorization.state = "payment_required";
    authorization.error = undefined;
  } else if (errorCode === "authorization_denied" || response.status === 403) {
    authorization.state = "denied";
    authorization.error = "Authorization was not approved.";
  } else if (errorCode === "authorization_expired" || response.status === 410) {
    authorization.state = "expired";
    authorization.error = "Authorization session expired. Start again to continue.";
  } else {
    authorization.state = "error";
    authorization.error = `Subscription authorization failed (${response.status}).`;
  }

  return publicStatus(localSessionId, authorization);
}

export function getAuthorizedSubscriptionConfig(localSessionId: string): AuthorizedSubscriptionConfig {
  const authorization = getPendingAuthorization(localSessionId);
  if (authorization.state !== "authorized" || !authorization.authorizedConfig) {
    throw new Error("Subscription authorization has not completed.");
  }
  return authorization.authorizedConfig;
}

export function cancelSubscriptionAuthorization(localSessionId: string): void {
  pendingAuthorizations.delete(localSessionId);
}

function getPendingAuthorization(localSessionId: string): PendingAuthorization {
  const authorization = pendingAuthorizations.get(localSessionId);
  if (!authorization) {
    throw new Error("Subscription authorization session was not found.");
  }
  return authorization;
}

function publicStatus(id: string, authorization: PendingAuthorization): SubscriptionAuthorizationStatus {
  return {
    id,
    expiresAt: new Date(authorization.expiresAt).toISOString(),
    pollIntervalMs: authorization.pollIntervalMs,
    state: authorization.state,
    ...(authorization.authorizedConfig ? {
      defaultModel: authorization.authorizedConfig.defaultModel,
      providerName: authorization.authorizedConfig.providerName,
      subscriptionExpiresAt: authorization.authorizedConfig.expiresAt,
    } : {}),
    ...(authorization.subscriptions ? { subscriptions: authorization.subscriptions } : {}),
    ...(authorization.error ? { error: authorization.error } : {})
  };
}

function parseSubscriptionOptions(value: unknown): SubscriptionAuthorizationOption[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!isRecord(item)) return [];
    const id = positiveNumber(item.id, 0);
    const groupId = positiveNumber(item.group_id, 0);
    const groupName = stringValue(item.group_name);
    const expiresAt = stringValue(item.expires_at);
    if (!id || !groupId || !groupName || !expiresAt) return [];
    return [{ id, group_id: groupId, group_name: groupName, expires_at: expiresAt }];
  });
}

function subscriptionServiceUrl(): URL {
  // Local and staging builds may override the production service explicitly.
  const rawUrl = process.env.CODEX_PROFILE_MANAGER_SUBSCRIPTION_SERVICE_URL?.trim() || DEFAULT_SUBSCRIPTION_SERVICE_URL;

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("Subscription service URL is invalid.");
  }

  const localDevelopment = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (url.protocol !== "https:" && !(localDevelopment && url.protocol === "http:")) {
    throw new Error("Subscription service must use HTTPS.");
  }

  return url;
}

async function serviceRequest(serviceUrl: URL, pathname: string, init: RequestInit): Promise<Response> {
  const url = new URL(pathname, serviceUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    return await fetch(url, {
      ...init,
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...init.headers
      },
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function parseJson(response: Response): Promise<Record<string, unknown>> {
  try {
    const payload: unknown = await response.json();
    return isRecord(payload) ? payload : {};
  } catch {
    return {};
  }
}

function unwrapPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return isRecord(payload.data) ? payload.data : payload;
}

function parseAuthorizedConfig(record: Record<string, unknown>, serviceUrl: URL): AuthorizedSubscriptionConfig {
  const baseUrl = validateServiceBaseUrl(requiredString(record.base_url, "Missing API base URL."), serviceUrl);
  const accessToken = requiredString(record.access_token, "Missing access token.");
  const defaultModel = requiredString(record.default_model, "Missing default model.");
  const providerName = stringValue(record.provider_name) ?? "Subscription service";

  return {
    accessToken,
    baseUrl,
    defaultModel,
    providerName,
    ...(stringValue(record.expires_at) ? { expiresAt: stringValue(record.expires_at) } : {}),
    ...(stringValue(record.subscription_id) ? { subscriptionId: stringValue(record.subscription_id) } : {})
  };
}

function validateAuthorizationUrl(rawUrl: string, serviceUrl: URL): string {
  const url = new URL(rawUrl);
  if (url.origin !== serviceUrl.origin || (url.protocol !== "https:" && url.protocol !== "http:")) {
    throw new Error("Subscription authorization URL is not trusted.");
  }
  return url.toString();
}

function validateServiceBaseUrl(rawUrl: string, serviceUrl: URL): string {
  const url = new URL(rawUrl);
  if (url.origin !== serviceUrl.origin || (url.protocol !== "https:" && url.protocol !== "http:")) {
    throw new Error("Subscription API base URL is not trusted.");
  }
  return url.toString().replace(/\/+$/, "");
}

function sanitizeDeviceName(value: string | undefined): string {
  const fallback = `${platformName()} device`;
  const name = value?.trim().replace(/[\r\n\t]+/g, " ").slice(0, 100);
  return name || fallback;
}

function platformName(): "darwin" | "win32" | "linux" {
  if (process.platform === "darwin" || process.platform === "win32") {
    return process.platform;
  }
  return "linux";
}

function requiredString(value: unknown, message: string): string {
  const parsed = stringValue(value);
  if (!parsed) {
    throw new Error(message);
  }
  return parsed;
}

function positiveNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;
}

function nestedErrorCode(value: unknown): string | undefined {
  return isRecord(value) ? stringValue(value.code) : undefined;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
