import { setTimeout as delay } from "node:timers/promises";

const PRODUCTION_SERVICE_URL = "https://sub2api.minai.eu.org";
const args = parseArgs(process.argv.slice(2));

if (!args.confirmProduction) {
  fail("Refusing to start. Pass --confirm-production to use the production subscription service.");
}

process.env.CODEX_PROFILE_MANAGER_SUBSCRIPTION_SERVICE_URL = PRODUCTION_SERVICE_URL;

const auth = await import("../dist-electron/main/subscription-auth.js");
const profileService = await import("../dist-electron/main/profile-service.js");
const profileName = args.profileName || defaultProfileName();
const deadline = Date.now() + args.timeoutMinutes * 60_000;
let session;

const stop = () => {
  if (session) {
    auth.cancelSubscriptionAuthorization(session.id);
  }
  process.exit(130);
};

process.once("SIGINT", stop);
process.once("SIGTERM", stop);

try {
  session = await auth.startSubscriptionAuthorization({
    appVersion: "0.1.9",
    campaignId: "subscription-launch-v019",
    deviceName: profileName
  });

  console.log("Open this URL in the browser where the acceptance-test user is signed in:");
  console.log(session.authorizationUrl);
  console.log(`Waiting up to ${args.timeoutMinutes} minutes for authorization and payment...`);

  let previousState;
  while (Date.now() < deadline) {
    const status = await auth.pollSubscriptionAuthorization(session.id);
    if (status.state !== previousState) {
      console.log(`Authorization state: ${status.state}`);
      previousState = status.state;
    }

    if (status.state === "authorized") {
      const result = await profileService.createProfile({
        name: profileName,
        authMode: "subscription",
        subscriptionAuthorizationSessionId: session.id,
        inheritDefaultConfig: false,
        appearance: { color: "#1677ff" },
        provider: {
          type: "third_party_responses",
          displayName: "Subscription service",
          model: "server-managed"
        }
      });

      session = undefined;
      console.log("Subscription Profile created successfully.");
      console.log(`Profile: ${result.profile.name}`);
      console.log(`Model: ${result.profile.provider.model}`);
      console.log(`Config: ${result.configPath}`);
      console.log("No access token or API key was printed.");
      process.exitCode = 0;
      break;
    }

    if (["denied", "expired", "error"].includes(status.state)) {
      throw new Error(status.error || `Authorization ended with state: ${status.state}`);
    }

    await delay(Math.max(1_000, status.pollIntervalMs));
  }

  if (session && Date.now() >= deadline) {
    throw new Error(`Acceptance authorization timed out after ${args.timeoutMinutes} minutes.`);
  }
} catch (error) {
  if (session) {
    auth.cancelSubscriptionAuthorization(session.id);
  }
  fail(error instanceof Error ? error.message : String(error));
} finally {
  process.removeListener("SIGINT", stop);
  process.removeListener("SIGTERM", stop);
}

function parseArgs(values) {
  const result = {
    confirmProduction: false,
    profileName: "",
    timeoutMinutes: 10
  };

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--confirm-production") {
      result.confirmProduction = true;
      continue;
    }
    if (value === "--profile-name") {
      result.profileName = requiredValue(values[++index], "--profile-name");
      continue;
    }
    if (value === "--timeout-minutes") {
      const parsed = Number(requiredValue(values[++index], "--timeout-minutes"));
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
        fail("--timeout-minutes must be an integer between 1 and 30.");
      }
      result.timeoutMinutes = parsed;
      continue;
    }
    fail(`Unknown argument: ${value}`);
  }

  return result;
}

function requiredValue(value, flag) {
  if (!value || value.startsWith("--")) {
    fail(`${flag} requires a value.`);
  }
  return value.trim();
}

function defaultProfileName() {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return `Subscription Acceptance ${stamp}`;
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
